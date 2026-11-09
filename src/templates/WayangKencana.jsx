import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  CinematicBlock,
  CinematicEffects,
  CinematicOpening,
  ParallaxContext,
  levelFromPlan,
  useHeroParallax,
  useParallaxFactor,
  useParallaxLevel,
} from "./parallax.jsx";
import {
  CalendarPlus,
  Check,
  Clock,
  Copy,
  Gift,
  Heart,
  Instagram,
  Lock,
  MapPin,
  Mic,
  Pause,
  Play,
  QrCode,
  Send,
  Square,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";

/* ============================================================
   MOMENLABS — TEMPLATE "WAYANG KENCANA" (Adat Jawa, Hitam & Emas)
   ------------------------------------------------------------
   Konsep: panggung wayang kulit. Gunungan sebagai gerbang pembuka,
   siluet wayang sebagai layer parallax, batik kawung & parang emas,
   pendopo joglo di section acara.

   Paket & fitur (sama dengan Dark Elegance):
   - isPremium : Story Mode + Voice Note Wishes
   - isLuxury  : Cinematic parallax + opening eksklusif (otomatis termasuk Premium)
   Tanpa keduanya (Basic) siluet wayang tampil diam tanpa parallax.

   Pemakaian:
   <WayangKencana isPremium isLuxury data={dataUndangan} guestName="Bapak Andi" />
   ============================================================ */

export const PLAN_FLAGS = {
  isPremium: true,
  isLuxury: true,
};

export const DEFAULT_DATA = {
  slug: "bagas-laras",
  bride: {
    nickname: "Laras",
    fullName: "Larasati Kusumawardani",
    parents: "Putri kedua dari Bapak Hadi Sutrisno & Ibu Sri Lestari",
    instagram: "larasati.kw",
    photo: null, // URL foto mempelai wanita
  },
  groom: {
    nickname: "Bagas",
    fullName: "Raden Bagas Wicaksono",
    parents: "Putra pertama dari Bapak Raden Joko Santoso & Ibu Endang Rahayu",
    instagram: "bagaswicak",
    photo: null, // URL foto mempelai pria
  },
  coverPhoto: null, // URL foto pasangan untuk hero
  quote: {
    text: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
    source: "QS. Ar-Rum : 21",
  },
  events: [
    {
      id: "ijab",
      title: "Ijab Qabul",
      start: "2026-12-12T08:00:00+07:00",
      end: "2026-12-12T10:00:00+07:00",
      venue: "Masjid Gedhe Kauman",
      address: "Jl. Kauman, Ngupasan, Gondomanan, Yogyakarta",
      mapsUrl: "https://maps.google.com/?q=Masjid+Gedhe+Kauman+Yogyakarta",
    },
    {
      id: "pahargyan",
      title: "Pahargyan",
      start: "2026-12-12T11:00:00+07:00",
      end: "2026-12-12T14:00:00+07:00",
      venue: "Pendopo Agung Royal Ambarrukmo",
      address: "Jl. Laksda Adisucipto No. 81, Caturtunggal, Sleman, Yogyakarta",
      mapsUrl: "https://maps.google.com/?q=Pendopo+Agung+Royal+Ambarrukmo",
    },
  ],
  story: [
    { year: "2018", title: "Pinanggih", text: "Kami pertama bertemu di sanggar karawitan kampus, sama-sama menabuh gamelan di barisan belakang." },
    { year: "2020", title: "Tresna Tuwuh", text: "Dari latihan tiap Kamis sore, tumbuh rasa yang tak lagi bisa disembunyikan." },
    { year: "2025", title: "Lamaran", text: "Dengan restu kedua keluarga, Bagas datang meminang Laras di Yogyakarta." },
    { year: "2026", title: "Pawiwahan", text: "Kini kami siap menapaki lakon baru bersama, dan ingin merayakannya bersamamu." },
  ],
  gifts: {
    banks: [
      { bank: "BCA", number: "8730012345", holder: "Larasati Kusumawardani" },
      { bank: "BNI", number: "0912345678", holder: "Raden Bagas Wicaksono" },
    ],
    qris: { image: null, holder: "Bagas & Laras" }, // isi image dengan URL gambar QRIS asli
    address: {
      recipient: "Larasati Kusumawardani",
      text: "Jl. Prawirotaman No. 21, Mergangsan, Yogyakarta 55153",
    },
  },
  music: {
    url: null, // URL file musik .mp3
    title: "Gendhing Kebo Giro",
  },
  wishes: [
    { name: "Bude Ningsih", attendance: "hadir", message: "Sugeng nggih Laras & Bagas, mugi dados keluarga ingkang sakinah, mawaddah, warahmah.", time: "2 jam lalu" },
    { name: "Yoga Pratama", attendance: "hadir", message: "Selamat bro! Akhirnya lakon kalian sampai di babak paling indah.", time: "4 jam lalu" },
    { name: "Keluarga Wibowo", attendance: "tidak", message: "Mohon maaf belum bisa hadir, doa terbaik dari kami di Semarang.", time: "1 hari lalu" },
  ],
  voiceWishes: [
    { name: "Pakde Harjo", duration: 13, time: "3 jam lalu", url: null },
    { name: "Dewi & Anton", duration: 10, time: "7 jam lalu", url: null },
  ],
};

/* ============================================================
   UTIL
   ============================================================ */

const ease = [0.22, 1, 0.36, 1];
const pad = (n) => String(n).padStart(2, "0");
const TZ = "Asia/Jakarta";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const fmtShort = (iso) => {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }).formatToParts(d);
  const get = (t) => p.find((x) => x.type === t).value;
  return `${get("day")} · ${get("month")} · ${get("year")}`;
};
const gcalStamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function gcalLink(ev, couple) {
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(`${ev.title} ${couple}`)}` +
    `&dates=${gcalStamp(ev.start)}/${gcalStamp(ev.end)}` +
    `&details=${encodeURIComponent(`Undangan ${ev.title} ${couple}`)}` +
    `&location=${encodeURIComponent(`${ev.venue}, ${ev.address}`)}`
  );
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

function useCountdown(iso) {
  const calc = () => {
    const diff = Math.max(0, new Date(iso).getTime() - Date.now());
    return {
      Dinten: Math.floor(diff / 86400000),
      Jam: Math.floor((diff / 3600000) % 24),
      Menit: Math.floor((diff / 60000) % 60),
      Detik: Math.floor((diff / 1000) % 60),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);
  return t;
}

// id SVG unik per instance (tanpa ":" agar aman dipakai di url(#...))
const useSvgId = (prefix) => `${prefix}${useId().replace(/:/g, "")}`;

/* ============================================================
   ORNAMEN JAWA — gunungan, batik kawung & parang, wayang, joglo
   ============================================================ */

// siluet luar gunungan (viewBox 0 0 200 300), dipakai untuk art, mask foto & 3D
const GUNUNGAN_PATH =
  "M100 6 C128 40 176 110 178 196 C179 236 160 262 150 270 L150 288 L50 288 L50 270 C40 262 21 236 22 196 C24 110 72 40 100 6Z";
const GUNUNGAN_INNER =
  "M100 22 C124 54 164 116 165 194 C166 230 150 252 140 260 L60 260 C50 252 34 230 35 194 C36 116 76 54 100 22Z";

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const GUNUNGAN_MASK = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300' preserveAspectRatio='none'><path d='${GUNUNGAN_PATH}' fill='black'/></svg>`
);

// batik kawung: empat kelopak oval mengelilingi satu titik
const KAWUNG_BG = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'><g fill='none' stroke='#C9A45C' stroke-width='0.8'><g transform='rotate(45 22 22)'><ellipse cx='22' cy='11' rx='5.5' ry='9.5'/><ellipse cx='22' cy='33' rx='5.5' ry='9.5'/><ellipse cx='11' cy='22' rx='9.5' ry='5.5'/><ellipse cx='33' cy='22' rx='9.5' ry='5.5'/></g><circle cx='22' cy='22' r='1.6' fill='#C9A45C'/><circle cx='0' cy='0' r='1.2' fill='#C9A45C'/><circle cx='44' cy='0' r='1.2' fill='#C9A45C'/><circle cx='0' cy='44' r='1.2' fill='#C9A45C'/><circle cx='44' cy='44' r='1.2' fill='#C9A45C'/></g></svg>`
);

function Kawung({ className = "", opacity = 0.06, size = 44 }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ backgroundImage: KAWUNG_BG, backgroundSize: `${size}px ${size}px`, opacity }}
    />
  );
}

// pita batik parang: lereng diagonal bergelombang
function ParangBand({ className = "", count = 12 }) {
  const w = count * 10;
  return (
    <svg viewBox={`0 0 ${w} 14`} className={`text-gold ${className}`} fill="none" stroke="currentColor" aria-hidden="true" preserveAspectRatio="none">
      <path d={`M0 1 H ${w} M0 13 H ${w}`} strokeWidth="0.6" opacity="0.6" />
      {Array.from({ length: count }).map((_, i) => {
        const x = i * 10;
        return (
          <g key={i}>
            <path d={`M${x} 12 C ${x + 2} 8, ${x + 5} 9, ${x + 6} 6 C ${x + 7} 3, ${x + 9} 3, ${x + 11} 2`} strokeWidth="0.9" />
            <circle cx={x + 3} cy="4.5" r="0.8" fill="currentColor" stroke="none" opacity="0.8" />
          </g>
        );
      })}
    </svg>
  );
}

function GununganIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 200 300" className={`text-gold ${className}`} aria-hidden="true">
      <path d={GUNUNGAN_PATH} fill="none" stroke="currentColor" strokeWidth="10" />
      <path d="M100 250 V 70" stroke="currentColor" strokeWidth="8" />
      <path d="M100 120 C 80 110 62 120 64 140 M100 120 C 120 110 138 120 136 140 M100 170 C 76 160 56 172 58 196 M100 170 C 124 160 144 172 142 196" fill="none" stroke="currentColor" strokeWidth="7" />
    </svg>
  );
}

function ParangDivider({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 ${className}`} aria-hidden="true">
      <ParangBand className="h-2.5 w-16 opacity-70" count={8} />
      <GununganIcon className="h-6 w-4" />
      <ParangBand className="h-2.5 w-16 -scale-x-100 opacity-70" count={8} />
    </div>
  );
}

// gunungan lengkap: badan, pohon hayat, nyala di puncak, gapura di kaki
function GununganArt({ className = "", tree = true }) {
  const gold = useSvgId("wk-gold");
  const body = useSvgId("wk-body");
  const branches = [92, 124, 156, 188, 216];
  return (
    <svg viewBox="0 0 200 300" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6E7B8" />
          <stop offset="35%" stopColor="#D4AF6A" />
          <stop offset="65%" stopColor="#9C7A3C" />
          <stop offset="100%" stopColor="#E9D29A" />
        </linearGradient>
        <radialGradient id={body} cx="50%" cy="60%" r="65%">
          <stop offset="0%" stopColor="#2A2116" />
          <stop offset="70%" stopColor="#141114" />
          <stop offset="100%" stopColor="#0B0A0C" />
        </radialGradient>
      </defs>

      <path d={GUNUNGAN_PATH} fill={`url(#${body})`} stroke={`url(#${gold})`} strokeWidth="2" />
      {/* tatahan: titik-titik tembus di sepanjang tepi dalam */}
      <path d={GUNUNGAN_INNER} fill="none" stroke={`url(#${gold})`} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 6" />
      <path d={GUNUNGAN_INNER} fill="none" stroke={`url(#${gold})`} strokeWidth="0.6" opacity="0.5" transform="translate(100 150) scale(0.94) translate(-100 -150)" />

      {/* nyala di puncak */}
      <path d="M100 30 C 106 44, 110 52, 100 64 C 90 52, 94 44, 100 30Z" fill={`url(#${gold})`} />

      {tree && (
        <g stroke={`url(#${gold})`} fill="none" strokeLinecap="round">
          <path d="M100 246 C 98 200, 102 140, 100 70" strokeWidth="2.2" />
          {[0, 1].map((m) => (
            <g key={m} transform={m ? "translate(200 0) scale(-1 1)" : undefined}>
              {branches.map((y, i) => {
                const r = 30 + i * 6;
                return (
                  <g key={y}>
                    <path d={`M100 ${y} C ${100 - r * 0.4} ${y - 12}, ${100 - r} ${y - 8}, ${100 - r} ${y + 6} C ${100 - r} ${y + 16}, ${100 - r * 0.6} ${y + 16}, ${100 - r * 0.62} ${y + 8}`} strokeWidth="1.4" />
                    <path d={`M${100 - r * 0.62} ${y + 8} c 2 -4, 7 -3, 6 1`} strokeWidth="1" opacity="0.8" />
                    <path d={`M${100 - r * 0.5} ${y - 6} c -3 -7, -10 -8, -12 -4 c 4 0, 8 2, 12 4z`} fill={`url(#${gold})`} strokeWidth="0.4" opacity="0.85" />
                  </g>
                );
              })}
            </g>
          ))}
        </g>
      )}

      {/* gapura di kaki gunungan */}
      <g fill={`url(#${gold})`}>
        <path d="M58 262 L 100 238 L 142 262Z" />
        <path d="M68 262 H 132 V 288 H 112 V 274 Q 100 262 88 274 V 288 H 68Z" />
        <rect x="38" y="288" width="124" height="6" rx="1" />
        <rect x="30" y="294" width="140" height="5" rx="1" opacity="0.8" />
      </g>
    </svg>
  );
}

/* Siluet wayang kulit (menghadap kanan). variant: "satria" | "putri" */
function WayangFigure({ variant = "satria", className = "" }) {
  const satria = variant === "satria";
  return (
    <svg viewBox="0 0 120 330" className={className} fill="currentColor" aria-hidden="true">
      {/* gapit (tangkai tengah) & tuding (tangkai tangan) */}
      <path d="M57 40 V 330" stroke="currentColor" strokeWidth="2.2" />
      <path d={satria ? "M104 192 L 114 330" : "M98 196 L 108 330"} stroke="currentColor" strokeWidth="1.2" />
      <path d={satria ? "M22 202 L 8 330" : "M30 206 L 14 330"} stroke="currentColor" strokeWidth="1.2" />

      {/* kepala profil, hidung runcing khas wayang */}
      <path d="M58 52 C 63 50, 67 53, 68 57 L 80 63 L 70 65 C 70 71, 66 75, 60 75 C 54 75, 50 69, 50 63 C 50 57, 54 52, 58 52Z" />
      {satria ? (
        <>
          {/* makutha & garuda mungkur */}
          <path d="M49 58 C 44 50, 44 36, 52 28 C 56 22, 63 22, 65 30 C 67 37, 65 45, 60 51Z" />
          <path d="M55 28 L 59 12 L 63 28Z" />
          <path d="M49 46 C 36 42, 27 52, 25 66 C 32 59, 39 57, 47 59Z" />
          <path d="M48 64 C 39 73, 33 92, 35 112 C 42 98, 46 86, 53 75Z" />
        </>
      ) : (
        <>
          {/* gelung (sanggul) & rambut terurai */}
          <path d="M50 61 C 46 51, 50 43, 59 45 C 64 47, 64 53, 61 57Z" />
          <path d="M49 55 C 38 52, 33 63, 39 71 C 45 74, 50 67, 50 61Z" />
          <circle cx="40" cy="62" r="2" fill="#0B0A0C" />
          <path d="M47 66 C 40 80, 38 100, 42 122 C 46 104, 49 88, 54 76Z" />
        </>
      )}

      {/* leher & badan */}
      <path d="M56 74 C 58 80, 61 84, 65 88 C 71 97, 71 121, 65 141 C 62 151, 61 159, 61 167 L 48 167 C 48 151, 46 131, 46 113 C 46 97, 50 85, 54 76Z" />
      {/* lengan panjang */}
      <path
        d={satria ? "M64 90 C 76 104, 84 124, 86 148 C 88 168, 96 182, 104 192" : "M62 92 C 72 108, 78 128, 80 150 C 82 170, 90 186, 98 196"}
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d={satria ? "M52 92 C 40 110, 36 132, 38 156 C 40 176, 32 192, 22 202" : "M52 94 C 44 112, 42 134, 44 158 C 46 180, 40 196, 30 206"}
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* kain / dodot */}
      {satria ? (
        <path d="M45 165 C 37 191, 31 231, 23 281 C 41 287, 53 283, 60 281 C 71 285, 87 287, 97 281 C 87 241, 77 201, 64 165Z" />
      ) : (
        <path d="M46 165 C 42 195, 40 235, 38 290 C 50 296, 60 294, 66 292 C 78 296, 96 298, 108 290 C 92 250, 76 205, 64 165Z" />
      )}
      {/* kaki */}
      <path d={satria ? "M40 281 L 36 302 L 57 304 L 53 283Z M69 283 L 71 302 L 93 304 L 83 283Z" : "M48 292 L 46 306 L 64 308 L 62 294Z"} />

      {/* tatahan: lubang ornamen di badan & kain */}
      <g fill="#0B0A0C">
        {[100, 112, 124, 136].map((y) => (
          <circle key={y} cx="56" cy={y} r="1.6" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <g key={i}>
            <circle cx={satria ? 50 + i * 1.5 : 52 + i * 1.8} cy={190 + i * 15} r="1.8" />
            <circle cx={satria ? 66 + i * 3 : 68 + i * 4} cy={190 + i * 15} r="1.8" />
          </g>
        ))}
        <path d={satria ? "M44 268 C 58 272, 72 272, 92 268" : "M42 280 C 60 286, 80 286, 104 280"} fill="none" stroke="#0B0A0C" strokeWidth="1.4" strokeDasharray="2 3" />
      </g>
    </svg>
  );
}

/* layer parallax: siluet bergerak lebih lambat/cepat dari konten saat scroll */
function WayangParallax({ side = "left", variant = "satria", className = "", speed = 90 }) {
  const ref = useRef(null);
  const k = useParallaxFactor();
  const cine = useParallaxLevel() === "cinematic";
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * k, -speed * k]);
  const rotate = useTransform(scrollYProgress, [0, 1], side === "left" ? [-5 * k, 4 * k] : [5 * k, -4 * k]);
  const left = side === "left";
  return (
    <div ref={ref} className={`pointer-events-none absolute z-0 w-[104px] ${left ? "-left-9" : "-right-9"} ${className}`} aria-hidden="true">
      <motion.div style={{ y, rotate }} className={left ? "" : "-scale-x-100"}>
        <WayangFigure variant={variant} className={`w-full ${cine ? "text-gold/[0.22]" : "text-gold/[0.16]"}`} />
      </motion.div>
    </div>
  );
}

function JogloPendopo({ className = "" }) {
  const gold = useSvgId("wk-joglo");
  return (
    <svg viewBox="0 0 240 140" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6E7B8" />
          <stop offset="50%" stopColor="#C9A45C" />
          <stop offset="100%" stopColor="#9C7A3C" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gold})`} strokeWidth="1.3" strokeLinejoin="round">
        {/* mustaka & bubungan */}
        <path d="M92 20 H 148" strokeWidth="2" />
        <path d="M92 20 c -6 -2, -8 -8, -4 -12 M148 20 c 6 -2, 8 -8, 4 -12" />
        <circle cx="120" cy="12" r="3" fill={`url(#${gold})`} />
        {/* brunjung (atap atas, curam) */}
        <path d="M94 20 L 146 20 L 162 54 L 78 54Z" fill="#141114" />
        {[102, 111, 120, 129, 138].map((x) => (
          <path key={x} d={`M${x} 22 L ${x + (x - 120) * 0.55} 52`} opacity="0.45" />
        ))}
        {/* penanggap */}
        <path d="M78 54 L 162 54 L 198 80 L 42 80Z" fill="#111013" />
        {/* penitih / emper */}
        <path d="M42 80 L 198 80 L 228 98 L 12 98Z" fill="#0F0E10" />
        <path d="M20 98 H 220" strokeWidth="2" />
        {/* saka guru & saka pengarak */}
        {[38, 78, 102, 138, 162, 202].map((x) => (
          <rect key={x} x={x - 1.6} y="98" width="3.2" height="26" fill="#141114" />
        ))}
        {/* lampu gantung */}
        <path d="M120 98 V 106" opacity="0.7" />
        <path d="M115 106 H 125 L 122 112 H 118Z" fill={`url(#${gold})`} />
        {/* umpak, lantai, undakan */}
        <path d="M10 124 H 230 V 130 H 10Z" fill="#141114" />
        <path d="M28 130 H 212 V 136 H 28Z" fill="#111013" />
      </g>
    </svg>
  );
}

/* ============================================================
   KOMPONEN DASAR
   ============================================================ */

// panel bersudut tegas dengan tumpal emas di keempat sudut
function KencanaPanel({ children, className = "", innerClassName = "" }) {
  const corner = "pointer-events-none absolute h-3 w-3 text-gold";
  return (
    <div className={`relative border border-gold/30 bg-gradient-to-b from-noir-700/90 to-noir-800/90 p-1.5 ${className}`}>
      <div className={`relative border border-gold/10 ${innerClassName}`}>{children}</div>
      {["left-0 top-0", "right-0 top-0 rotate-90", "right-0 bottom-0 rotate-180", "left-0 bottom-0 -rotate-90"].map((p) => (
        <svg key={p} viewBox="0 0 12 12" className={`${corner} ${p}`} fill="currentColor" aria-hidden="true">
          <path d="M0 0 H 12 L 0 12Z" />
        </svg>
      ))}
    </div>
  );
}

function Section({ id, children, className = "" }) {
  return (
    <section id={id} className={`relative px-6 py-20 ${className}`}>
      <CinematicBlock className="relative">{children}</CinematicBlock>
    </section>
  );
}

/* cahaya blencong (lampu pertunjukan wayang) yang berkedip — khusus Luxury */
function Blencong({ className = "" }) {
  if (useParallaxLevel() !== "cinematic") return null;
  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full bg-[radial-gradient(closest-side,rgba(246,214,140,0.35),rgba(212,175,106,0.12)_55%,transparent)] ${className}`}
      animate={{ opacity: [0.75, 1, 0.82, 0.95, 0.7, 1], scale: [1, 1.03, 0.99, 1.02, 1] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function Heading({ kicker, title }) {
  return (
    <Reveal className="relative z-10 text-center">
      <p className="font-cinzel text-[10px] tracking-[0.42em] text-gold/80">{kicker}</p>
      <h2 className="mt-3 font-cinzel text-[28px] font-medium leading-tight tracking-[0.06em] text-foil">{title}</h2>
      <ParangDivider className="mt-4" />
    </Reveal>
  );
}

function PremiumBadge({ label = "Premium" }) {
  return (
    <span className="inline-flex items-center gap-1 border border-gold/30 bg-gold/10 px-2.5 py-1 font-cinzel text-[9px] tracking-[0.2em] text-gold">
      <Lock className="h-2.5 w-2.5" /> {label}
    </span>
  );
}

function GoldButton({ as: As = "button", children, className = "", variant = "solid", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 font-cinzel text-[11px] font-semibold tracking-[0.12em] transition active:scale-[0.97]";
  const styles =
    variant === "solid"
      ? "bg-foil text-noir shadow-[0_10px_30px_-12px_rgba(201,164,92,0.7)] hover:brightness-110"
      : "border border-gold/40 text-gold hover:bg-gold/10";
  return (
    <As className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </As>
  );
}

function CouplePlaceholder() {
  return (
    <div className="relative h-full w-full bg-[radial-gradient(100%_70%_at_50%_20%,#3A2F1E_0%,#161316_60%,#0B0A0C_100%)]">
      <svg viewBox="0 0 200 200" className="absolute inset-x-0 bottom-0 w-full text-gold/20" fill="currentColor" aria-hidden="true">
        <circle cx="80" cy="92" r="22" />
        <circle cx="122" cy="86" r="23" />
        <path d="M34 200 C 36 146, 56 126, 80 126 C 100 126, 108 140, 110 200Z" />
        <path d="M94 200 C 98 140, 108 120, 122 120 C 150 120, 166 146, 168 200Z" />
      </svg>
    </div>
  );
}

function Photo({ src, alt, initial }) {
  return src ? (
    <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <div className="relative h-full w-full bg-[radial-gradient(120%_80%_at_50%_10%,#3A3020_0%,#151316_55%,#0B0A0C_100%)]">
      <svg viewBox="0 0 100 130" className="absolute inset-x-0 bottom-0 w-full text-gold/25" fill="currentColor" aria-hidden="true">
        <circle cx="50" cy="56" r="19" />
        <path d="M10 130 C 12 96, 30 84, 50 84 C 70 84, 88 96, 90 130 Z" />
      </svg>
      {initial && <span className="absolute inset-x-0 top-[14%] text-center font-cinzel text-2xl text-foil">{initial}</span>}
    </div>
  );
}

// foto dalam bingkai berbentuk gunungan
function GununganPhoto({ src, className = "" }) {
  return (
    <div className={`relative aspect-[2/3] ${className}`}>
      <div
        className="absolute inset-[3%] overflow-hidden"
        style={{ WebkitMaskImage: GUNUNGAN_MASK, maskImage: GUNUNGAN_MASK, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}
      >
        {src ? <img src={src} alt="Foto pasangan" className="h-full w-full object-cover" /> : <CouplePlaceholder />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-noir/70 via-transparent to-transparent" />
      </div>
      <svg viewBox="0 0 200 300" className="pointer-events-none absolute inset-0 h-full w-full text-gold" fill="none" aria-hidden="true">
        <path d={GUNUNGAN_PATH} stroke="currentColor" strokeWidth="1.6" />
        <path d={GUNUNGAN_PATH} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 7" opacity="0.6" transform="translate(100 150) scale(1.05) translate(-100 -150)" />
      </svg>
    </div>
  );
}

/* ============================================================
   1. COVER — gunungan terbelah sebagai gerbang
   ============================================================ */

function Cover({ data, guestName, onOpen }) {
  const [opening, setOpening] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    timer.current = setTimeout(onOpen, 1500);
  };

  const doors = [
    { key: "kiri", clip: "inset(0 50% 0 0)", origin: "0% 50%", rotateY: -82, x: "-38%" },
    { key: "kanan", clip: "inset(0 0 0 50%)", origin: "100% 50%", rotateY: 82, x: "38%" },
  ];

  return (
    <motion.div
      key="cover"
      className="fixed inset-0 z-[100] overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* latar: kelir hitam + kawung + cahaya blencong */}
      <motion.div
        className="absolute inset-0 bg-noir"
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 0.9, delay: opening ? 0.55 : 0 }}
      >
        <Kawung opacity={0.07} />
        <div className="absolute left-1/2 top-[38%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,175,106,0.28),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_40%,transparent_0%,rgba(6,5,7,0.9)_100%)]" />
        <ParangBand className="absolute inset-x-0 top-0 h-3 w-full opacity-50" count={40} />
        <ParangBand className="absolute inset-x-0 bottom-0 h-3 w-full -scale-y-100 opacity-50" count={40} />
      </motion.div>

      <div className="relative mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.15em" }}
          animate={{ opacity: opening ? 0 : 1, letterSpacing: "0.45em" }}
          transition={{ duration: opening ? 0.3 : 1.6, ease }}
          className="font-cinzel text-[10px] text-gold"
        >
          PAWIWAHAN AGUNG
        </motion.p>

        {/* gerbang gunungan */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.4, ease }}
          className="relative mt-4 aspect-[2/3] h-[min(54svh,470px)]"
          style={{ perspective: 1200 }}
        >
          {doors.map((d) => (
            <motion.div
              key={d.key}
              className="absolute inset-0"
              style={{ clipPath: d.clip, transformOrigin: d.origin }}
              animate={opening ? { rotateY: d.rotateY, x: d.x, opacity: 0 } : { rotateY: 0, x: 0, opacity: 1 }}
              transition={{ duration: 1.25, ease: [0.7, 0, 0.3, 1], opacity: { duration: 0.6, delay: 0.7 } }}
            >
              <GununganArt className="h-full w-full" />
            </motion.div>
          ))}

          {/* nama pasangan di dada gunungan */}
          <motion.div
            className="absolute inset-x-[16%] top-[30%] flex flex-col items-center"
            animate={{ opacity: opening ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute -inset-x-4 -inset-y-5 bg-[radial-gradient(closest-side,rgba(11,10,12,0.95)_55%,rgba(11,10,12,0.55)_80%,transparent)]" />
            <motion.h1
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.4, delay: 0.5, ease }}
              className="relative font-script text-[clamp(34px,10vw,46px)] leading-[1] text-foil"
            >
              {data.groom.nickname}
              <span className="block font-cinzel text-base text-gold/80">&amp;</span>
              {data.bride.nickname}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="relative mt-3 font-cinzel text-[9px] tracking-[0.3em] text-cream/70"
            >
              {fmtShort(data.events[0].start)}
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: opening ? 0 : 1, y: 0 }}
          transition={{ duration: opening ? 0.3 : 1, delay: opening ? 0 : 1.1, ease }}
          className="mt-5 w-full"
        >
          <p className="font-cormorant text-sm italic text-cream/60">Katur dhumateng Bapak/Ibu/Saudara/i</p>
          <p className="mx-auto mt-1.5 max-w-[260px] truncate font-cormorant text-[22px] font-semibold text-cream">
            {guestName || "Tamu Undangan"}
          </p>
          <ParangBand className="mx-auto mt-1 h-2 w-40 opacity-60" count={14} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: opening ? 0 : 1, scale: 1 }}
          transition={{ duration: opening ? 0.3 : 0.8, delay: opening ? 0 : 1.4, ease }}
          className="mt-5"
        >
          <button
            onClick={handleOpen}
            className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-md bg-foil px-7 py-3 font-cinzel text-[11px] font-semibold tracking-[0.22em] text-noir shadow-[0_15px_40px_-10px_rgba(201,164,92,0.7)]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            <GununganIcon className="relative h-4 w-3 text-noir" />
            <span className="relative">BUKA GERBANG</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   2. FLOATING MUSIC PLAYER — tombol gong
   ============================================================ */

function MusicPlayer({ playing, onToggle, title }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 1, ease }}
      className="fixed bottom-5 right-4 z-50 flex items-center gap-2"
    >
      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="hidden items-center gap-2 rounded-md border border-gold/20 bg-noir-800/90 py-1.5 pl-3 pr-3.5 backdrop-blur min-[440px]:flex"
          >
            <span className="font-cinzel text-[9px] tracking-[0.2em] text-gold">GENDHING</span>
            <span className="max-w-[110px] truncate text-[10px] text-cream/70">{title}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={onToggle}
        aria-label={playing ? "Matikan musik" : "Putar musik"}
        className="relative grid h-12 w-12 place-items-center rounded-full border border-gold/50 bg-noir-800 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)]"
      >
        {/* gelombang gong */}
        {playing &&
          [0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-gold/50"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: i, ease: "easeOut" }}
            />
          ))}
        <span className="absolute inset-1.5 rounded-full border border-gold/30" />
        <motion.span
          className="absolute h-5 w-5 rounded-full bg-foil shadow-[0_0_12px_rgba(212,175,106,0.6)]"
          animate={playing ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={playing ? { duration: 1, repeat: Infinity } : { duration: 0.3 }}
        />
        <span className="relative">
          {playing ? <Volume2 className="h-2.5 w-2.5 text-noir" /> : <VolumeX className="h-2.5 w-2.5 text-noir" />}
        </span>
      </button>
    </motion.div>
  );
}

/* ============================================================
   HERO, QUOTE, MEMPELAI
   ============================================================ */

function Hero({ data }) {
  const first = data.events[0];
  const t = useCountdown(first.start);
  const ref = useRef(null);
  const layer = useHeroParallax(ref);
  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-14 pt-16 text-center">
      <motion.div style={layer.back} className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Kawung opacity={0.05} />
        <div className="absolute left-1/2 top-[30%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,175,106,0.18),transparent)]" />
      </motion.div>
      <Blencong className="left-1/2 top-[26%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2" />
      <WayangParallax side="left" variant="satria" className="top-[18%]" />
      <WayangParallax side="right" variant="putri" className="top-[24%]" speed={130} />

      <motion.div style={layer.front} className="relative z-10 w-full">
        <Reveal>
          <p className="font-cinzel text-[10px] tracking-[0.45em] text-gold">LAKON TRESNA</p>
        </Reveal>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.6, ease }}
          className="mx-auto mt-5 w-[min(58vw,230px)]"
        >
          <GununganPhoto src={data.coverPhoto} />
        </motion.div>
        <Reveal delay={0.1}>
          <h1 className="mt-6 font-script text-[52px] leading-none text-foil">
            {data.groom.nickname} &amp; {data.bride.nickname}
          </h1>
          <p className="mt-3 font-cormorant text-lg italic text-cream/70">{fmtDate(first.start)}</p>
        </Reveal>
        <Reveal delay={0.2} className="mx-auto mt-8 flex max-w-[330px] items-stretch border-y border-gold/30 py-3">
          {Object.entries(t).map(([k, v], i) => (
            <div key={k} className={`flex-1 ${i ? "border-l border-gold/20" : ""}`}>
              <p className="font-cinzel text-[26px] leading-none text-foil">{pad(v)}</p>
              <p className="mt-1.5 font-cinzel text-[8px] tracking-[0.25em] text-cream/50">{k.toUpperCase()}</p>
            </div>
          ))}
        </Reveal>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mx-auto mt-9 flex flex-col items-center gap-1 text-gold/60"
          aria-hidden="true"
        >
          <span className="h-8 w-px bg-gradient-to-b from-transparent to-gold/70" />
          <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function QuoteSection({ quote }) {
  return (
    <Section className="pt-6">
      <Reveal className="relative z-10">
        <KencanaPanel innerClassName="px-6 pb-8 pt-10 text-center">
          <GununganIcon className="absolute -top-[26px] left-1/2 h-10 w-7 -translate-x-1/2 bg-noir-800 px-1" />
          <p className="font-cormorant text-[18px] italic leading-relaxed text-cream/85">“{quote.text}”</p>
          <p className="mt-5 font-cinzel text-[10px] tracking-[0.3em] text-gold">{quote.source}</p>
        </KencanaPanel>
      </Reveal>
    </Section>
  );
}

const GATE_CLIP = "polygon(50% 0, 100% 16%, 100% 100%, 0 100%, 0 16%)";

function PersonCard({ p, role, delay }) {
  return (
    <Reveal delay={delay} className="relative z-10 text-center">
      <div className="relative mx-auto w-[200px]">
        <div className="bg-foil p-[2px]" style={{ clipPath: GATE_CLIP }}>
          <div className="aspect-[3/4] overflow-hidden bg-noir" style={{ clipPath: GATE_CLIP }}>
            <Photo src={p.photo} alt={p.fullName} initial={p.nickname[0]} />
          </div>
        </div>
        <ParangBand className="mx-auto mt-2 h-2.5 w-full opacity-70" count={20} />
      </div>
      <p className="mt-6 font-cinzel text-[10px] tracking-[0.4em] text-gold/80">{role}</p>
      <h3 className="mt-2 font-script text-[40px] leading-tight text-foil">{p.nickname}</h3>
      <p className="font-cinzel text-[14px] tracking-[0.08em] text-cream">{p.fullName}</p>
      <p className="mx-auto mt-2 max-w-[260px] font-cormorant text-[15px] italic leading-snug text-cream/70">{p.parents}</p>
      {p.instagram && (
        <a
          href={`https://instagram.com/${p.instagram}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-gold/30 px-4 py-2 text-[11px] text-gold transition hover:bg-gold/10"
        >
          <Instagram className="h-3.5 w-3.5" /> @{p.instagram}
        </a>
      )}
    </Reveal>
  );
}

function CoupleSection({ data }) {
  return (
    <Section id="mempelai">
      <WayangParallax side="right" variant="satria" className="top-[30%]" speed={110} />
      <WayangParallax side="left" variant="putri" className="top-[68%]" />
      <Heading kicker="BISMILLAHIRRAHMANIRRAHIM" title="Mempelai" />
      <Reveal delay={0.1} className="relative z-10">
        <p className="mx-auto mt-6 max-w-xs text-center font-cormorant text-[16px] italic leading-relaxed text-cream/70">
          Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami:
        </p>
      </Reveal>
      <div className="mt-14 space-y-12">
        <PersonCard p={data.groom} role="MEMPELAI KAKUNG" />
        <Reveal className="relative z-10 flex items-center justify-center gap-3">
          <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold/60" />
          <span className="font-script text-5xl text-foil">&amp;</span>
          <span className="h-px w-14 bg-gradient-to-l from-transparent to-gold/60" />
        </Reveal>
        <PersonCard p={data.bride} role="MEMPELAI PUTRI" delay={0.05} />
      </div>
    </Section>
  );
}

/* ============================================================
   6. STORY MODE (PREMIUM) — dibingkai sebagai kelir wayang
   ============================================================ */

function StoryMode({ story, initials }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const DURATION = 5000;
  const n = story.length;

  useEffect(() => {
    if (paused) return;
    let raf;
    const start = performance.now() - progress * DURATION;
    const tick = (now) => {
      const p = Math.min((now - start) / DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        setIndex((i) => (i + 1) % n);
        setProgress(0);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, n]);

  const go = (dir) => {
    setIndex((i) => (i + dir + n) % n);
    setProgress(0);
  };

  const s = story[index];

  return (
    <Section id="story">
      <Heading kicker="WITING TRESNA JALARAN SAKA KULINA" title="Lampahan Kita" />
      <Reveal delay={0.1} className="mt-4 flex justify-center">
        <PremiumBadge label="Story Mode" />
      </Reveal>

      <Reveal delay={0.15} className="relative z-10 mx-auto mt-8 max-w-[340px]">
        <div
          className="relative aspect-[9/16] w-full cursor-pointer select-none overflow-hidden border border-gold/40 bg-noir-800 shadow-[0_30px_60px_-20px_rgba(201,164,92,0.3)]"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            go(e.clientX - r.left < r.width * 0.33 ? -1 : 1);
          }}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
        >
          {/* progress bar */}
          <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
            {story.map((_, i) => (
              <div key={i} className="h-[2px] flex-1 overflow-hidden bg-cream/20">
                <div className="h-full bg-foil" style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }} />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-3 top-6 z-20 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center border border-gold/50 bg-noir font-cinzel text-[9px] text-gold">{initials}</span>
            <span className="text-[11px] font-semibold text-cream">Babak {index + 1}</span>
            <span className="text-[10px] text-cream/50">· {s.year}</span>
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease }}
              className="absolute inset-0"
            >
              {s.photo ? (
                <img src={s.photo} alt={s.title} className="h-full w-full object-cover" />
              ) : (
                <div className="relative h-full w-full bg-[radial-gradient(70%_45%_at_50%_18%,#5A4526_0%,#221B14_45%,#0B0A0C_100%)]">
                  {/* blencong: lampu dalang */}
                  <motion.div
                    className="absolute left-1/2 top-[14%] h-3 w-3 -translate-x-1/2 rounded-full bg-gold-light shadow-[0_0_40px_14px_rgba(233,210,154,0.45)]"
                    animate={{ opacity: [0.8, 1, 0.85, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                  <WayangFigure
                    variant={index % 2 ? "putri" : "satria"}
                    className={`absolute top-[20%] w-[46%] text-black/60 ${index % 2 ? "right-[8%] -scale-x-100" : "left-[8%]"}`}
                  />
                  <span className="absolute right-5 top-[22%] font-cinzel text-[64px] leading-none text-gold/10">{s.year}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-center">
                <p className="font-cinzel text-[11px] tracking-[0.4em] text-gold">{s.year}</p>
                <h3 className="mt-2 font-cinzel text-[26px] font-medium leading-tight text-foil">{s.title}</h3>
                <p className="mt-3 font-cormorant text-[16px] leading-relaxed text-cream/80">{s.text}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="mt-4 text-center text-[11px] text-cream/40">Tap kanan/kiri untuk berpindah · tahan untuk jeda</p>
      </Reveal>
    </Section>
  );
}

/* ============================================================
   3. DETAIL ACARA — dengan pendopo joglo
   ============================================================ */

function EventsSection({ data }) {
  const couple = `${data.groom.nickname} & ${data.bride.nickname}`;
  return (
    <Section id="acara" className="bg-noir-900/60">
      <Kawung opacity={0.04} />
      <WayangParallax side="left" variant="satria" className="top-[40%]" speed={120} />
      <Reveal className="relative z-10">
        <JogloPendopo className="mx-auto w-[260px] drop-shadow-[0_10px_30px_rgba(201,164,92,0.2)]" />
      </Reveal>
      <div className="mt-6">
        <Heading kicker="PAHARGYAN" title="Rangkaian Acara" />
      </div>
      <div className="relative z-10 mt-10 space-y-6">
        {data.events.map((ev, i) => (
          <Reveal key={ev.id} delay={i * 0.1}>
            <KencanaPanel innerClassName="px-5 pb-6 pt-7 text-center">
              <p className="font-cinzel text-[10px] tracking-[0.4em] text-gold/80">BABAK {["I", "II", "III", "IV"][i] || i + 1}</p>
              <h3 className="mt-2 font-cinzel text-[26px] font-medium tracking-[0.05em] text-foil">{ev.title}</h3>

              <div className="mt-5 flex items-center justify-center gap-3">
                <p className="flex-1 text-right font-cinzel text-[10px] tracking-[0.2em] text-cream/60">
                  {new Date(ev.start).toLocaleDateString("id-ID", { weekday: "long", timeZone: TZ }).toUpperCase()}
                </p>
                <div className="relative grid h-[72px] w-[60px] place-items-center">
                  <svg viewBox="0 0 60 72" className="absolute inset-0 h-full w-full text-gold" fill="none" stroke="currentColor" aria-hidden="true">
                    <path d="M30 1 L 59 18 V 71 H 1 V 18Z" strokeWidth="1" opacity="0.6" />
                  </svg>
                  <p className="relative mt-3 font-cinzel text-[32px] leading-none text-foil">
                    {new Date(ev.start).toLocaleDateString("id-ID", { day: "2-digit", timeZone: TZ })}
                  </p>
                </div>
                <p className="flex-1 text-left font-cinzel text-[10px] tracking-[0.2em] text-cream/60">
                  {new Date(ev.start).toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: TZ }).toUpperCase()}
                </p>
              </div>

              <ParangBand className="mx-auto mt-5 h-2 w-44 opacity-50" count={16} />
              <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-cream/80">
                <Clock className="h-3.5 w-3.5 text-gold" /> {fmtTime(ev.start)} – {fmtTime(ev.end)} WIB
              </p>
              <div className="mx-auto mt-3 max-w-[260px]">
                <p className="inline-flex items-center gap-1.5 font-cormorant text-xl font-semibold text-cream">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-gold" /> {ev.venue}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-cream/55">{ev.address}</p>
              </div>

              <div className="mt-6 grid gap-2.5">
                <GoldButton as="a" href={gcalLink(ev, couple)} target="_blank" rel="noreferrer" variant="outline">
                  <CalendarPlus className="h-4 w-4" /> Simpan ke Kalender
                </GoldButton>
                <GoldButton as="a" href={ev.mapsUrl} target="_blank" rel="noreferrer">
                  <MapPin className="h-4 w-4" /> Buka Google Maps
                </GoldButton>
              </div>
            </KencanaPanel>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================
   4. AMPLOP DIGITAL & QRIS
   ============================================================ */

function FakeQR({ seed = "momenlabs", className = "" }) {
  const size = 25;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
  const cells = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!inFinder(x, y) && rand() > 0.52) cells.push([x, y]);
  const finder = (x, y) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#0B0A0C" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#0B0A0C" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} className={className} shapeRendering="crispEdges" aria-label="Kode QRIS">
      <rect x="-1" y="-1" width={size + 2} height={size + 2} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}_${y}`} x={x} y={y} width="1" height="1" fill="#0B0A0C" />
      ))}
      {finder(0, 0)}
      {finder(size - 7, 0)}
      {finder(0, size - 7)}
    </svg>
  );
}

function BankCard({ b, onCopy }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    const ok = await copyText(b.number);
    if (ok) {
      setCopied(true);
      onCopy(`No. rekening ${b.bank} disalin`);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-[#2A2216] via-[#141215] to-[#0B0A0C] p-5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)] ring-1 ring-gold/35">
      <Kawung opacity={0.1} size={36} />
      <GununganIcon className="pointer-events-none absolute -right-4 -top-3 h-28 w-20 opacity-20" />
      <div className="relative flex items-start justify-between">
        <span className="font-cinzel text-lg font-semibold tracking-[0.15em] text-foil">{b.bank}</span>
      </div>
      <p className="relative mt-6 font-mono text-[19px] tracking-[0.12em] text-cream">{b.number.replace(/(\d{4})(?=\d)/g, "$1 ")}</p>
      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.25em] text-cream/40">Atas Nama</p>
          <p className="truncate font-cormorant text-[17px] font-semibold text-cream">{b.holder}</p>
        </div>
        <button
          onClick={handle}
          className={`flex flex-shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-[11px] font-semibold transition active:scale-95 ${
            copied ? "bg-emerald-500/90 text-white" : "bg-foil text-noir"
          }`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
    </div>
  );
}

function GiftSection({ gifts, onToast }) {
  const [tab, setTab] = useState("transfer");
  const copyAddress = async () => {
    if (await copyText(`${gifts.address.recipient} — ${gifts.address.text}`)) onToast("Alamat pengiriman disalin");
  };
  const tabs = [
    { id: "transfer", label: "Transfer" },
    { id: "qris", label: "QRIS" },
    { id: "kado", label: "Kirim Kado" },
  ];

  return (
    <Section id="hadiah" className="bg-noir-900/60">
      <Kawung opacity={0.04} />
      <WayangParallax side="right" variant="putri" className="top-[20%]" speed={100} />
      <Heading kicker="TANDHA KATRESNAN" title="Tanda Kasih" />
      <Reveal delay={0.1} className="relative z-10">
        <p className="mx-auto mt-6 max-w-xs text-center font-cormorant text-[16px] italic leading-relaxed text-cream/70">
          Doa restu Anda merupakan karunia terindah bagi kami. Namun jika ingin memberikan tanda kasih, dapat melalui:
        </p>
      </Reveal>

      <Reveal delay={0.15} className="relative z-10 mx-auto mt-8 flex w-fit border-b border-gold/20">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 pb-2.5 pt-1 font-cinzel text-[11px] tracking-[0.12em] transition ${tab === t.id ? "text-gold" : "text-cream/50"}`}
          >
            {t.label}
            {tab === t.id && <motion.span layoutId="wk-gift-tab" className="absolute inset-x-2 -bottom-px h-[2px] bg-foil" />}
          </button>
        ))}
      </Reveal>

      <div className="relative z-10 mt-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease }}
          >
            {tab === "transfer" && (
              <div className="space-y-4">
                {gifts.banks.map((b) => (
                  <BankCard key={b.number} b={b} onCopy={onToast} />
                ))}
              </div>
            )}

            {tab === "qris" && (
              <KencanaPanel className="mx-auto max-w-[300px]" innerClassName="p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-gold">
                  <QrCode className="h-4 w-4" />
                  <span className="font-cinzel text-xs tracking-[0.3em]">QRIS</span>
                </div>
                <div className="mx-auto mt-5 w-[200px] rounded-md bg-white p-3">
                  {gifts.qris.image ? (
                    <img src={gifts.qris.image} alt="QRIS" className="w-full" />
                  ) : (
                    <FakeQR seed={gifts.qris.holder} className="w-full" />
                  )}
                </div>
                <p className="mt-4 font-cormorant text-lg font-semibold text-cream">{gifts.qris.holder}</p>
                <p className="mt-1 text-[11px] text-cream/50">Scan dengan m-banking atau e-wallet apa pun</p>
              </KencanaPanel>
            )}

            {tab === "kado" && (
              <KencanaPanel innerClassName="p-6 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center border border-gold/40 bg-noir">
                  <Gift className="h-6 w-6 text-gold" />
                </span>
                <p className="mt-4 font-cinzel text-[10px] tracking-[0.3em] text-gold/80">PENERIMA</p>
                <p className="mt-1 font-cormorant text-xl font-semibold text-cream">{gifts.address.recipient}</p>
                <p className="mx-auto mt-2 max-w-[250px] text-[13px] leading-relaxed text-cream/60">{gifts.address.text}</p>
                <GoldButton onClick={copyAddress} className="mt-6">
                  <Copy className="h-4 w-4" /> Salin Alamat
                </GoldButton>
              </KencanaPanel>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}

/* ============================================================
   5. RSVP & UCAPAN
   ============================================================ */

function RsvpSection({ initialWishes, guestName, onSubmit, onToast }) {
  const [form, setForm] = useState({ name: guestName || "", attendance: "hadir", pax: 1, message: "" });
  const [wishes, setWishes] = useState(initialWishes);
  const [sending, setSending] = useState(false);

  const counts = {
    hadir: wishes.filter((w) => w.attendance === "hadir").length,
    tidak: wishes.filter((w) => w.attendance === "tidak").length,
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      onToast("Mohon isi nama dan ucapan");
      return;
    }
    setSending(true);
    try {
      await onSubmit?.(form);
      setWishes((w) => [{ ...form, name: form.name.trim(), message: form.message.trim(), time: "Baru saja" }, ...w]);
      setForm((f) => ({ ...f, message: "" }));
      onToast("Matur nuwun! Konfirmasi & ucapanmu terkirim");
    } catch {
      onToast("Gagal mengirim, coba lagi");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full rounded-md border border-gold/20 bg-noir-800 px-4 py-3.5 text-[14px] text-cream outline-none transition placeholder:text-cream/30 focus:border-gold/60 focus:ring-4 focus:ring-gold/10";

  return (
    <Section id="rsvp">
      <WayangParallax side="left" variant="satria" className="top-[12%]" speed={110} />
      <Heading kicker="RSVP" title="Konfirmasi Kehadiran" />

      <Reveal delay={0.1} className="relative z-10">
        <KencanaPanel className="mt-10" innerClassName="p-4">
          <form onSubmit={submit} className="space-y-3.5">
            <input
              className={inputCls}
              placeholder="Nama lengkap"
              value={form.name}
              maxLength={50}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { v: "hadir", l: "Hadir" },
                { v: "tidak", l: "Tidak Hadir" },
              ].map((o) => (
                <button
                  type="button"
                  key={o.v}
                  onClick={() => setForm({ ...form, attendance: o.v })}
                  className={`rounded-md border py-3.5 text-[13px] font-semibold transition ${
                    form.attendance === o.v ? "border-gold bg-gold/15 text-gold" : "border-gold/15 bg-noir-800 text-cream/50"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
            <AnimatePresence initial={false}>
              {form.attendance === "hadir" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between rounded-md border border-gold/20 bg-noir-800 px-4 py-2.5">
                    <span className="flex items-center gap-2 text-[13px] text-cream/70">
                      <Users className="h-4 w-4 text-gold" /> Jumlah tamu
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, pax: Math.max(1, form.pax - 1) })}
                        className="grid h-8 w-8 place-items-center rounded-md border border-gold/30 text-gold"
                        aria-label="Kurangi"
                      >
                        −
                      </button>
                      <span className="w-4 text-center font-semibold text-cream">{form.pax}</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, pax: Math.min(5, form.pax + 1) })}
                        className="grid h-8 w-8 place-items-center rounded-md border border-gold/30 text-gold"
                        aria-label="Tambah"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <textarea
              className={`${inputCls} min-h-[110px] resize-none`}
              placeholder="Tulis ucapan & doa untuk kedua mempelai…"
              value={form.message}
              maxLength={300}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <GoldButton type="submit" disabled={sending} className="w-full py-4 disabled:opacity-60">
              <Send className="h-4 w-4" /> {sending ? "Mengirim…" : "Kirim Ucapan"}
            </GoldButton>
          </form>
        </KencanaPanel>
      </Reveal>

      <Reveal delay={0.1} className="relative z-10 mt-10">
        <div className="flex items-center justify-between">
          <p className="font-cinzel text-lg tracking-[0.05em] text-foil">{wishes.length} Ucapan</p>
          <div className="flex gap-2 text-[10px]">
            <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-400">{counts.hadir} Hadir</span>
            <span className="rounded-md bg-cream/5 px-2.5 py-1 font-semibold text-cream/50">{counts.tidak} Tidak</span>
          </div>
        </div>
        <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1 [scrollbar-color:#C9A45C33_transparent] [scrollbar-width:thin]">
          <AnimatePresence initial={false}>
            {wishes.map((w, i) => (
              <motion.div
                key={`${w.name}-${w.time}-${i}`}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-l-2 border-gold/50 bg-noir-800/80 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-foil font-cinzel text-sm font-semibold text-noir">
                    {w.name.trim()[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-cream">
                      {w.name}
                      {w.attendance === "hadir" && <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />}
                    </p>
                    <p className="text-[10px] text-cream/40">{w.time}</p>
                  </div>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-cream/75">{w.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Reveal>
    </Section>
  );
}

/* ============================================================
   7. VOICE NOTE WISHES (PREMIUM)
   ============================================================ */

const BAR_HEIGHTS = Array.from({ length: 32 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.9)) * 0.6 + (i % 3) * 0.05);

function VoiceItem({ item }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const simRef = useRef(null);

  useEffect(() => () => clearInterval(simRef.current), []);

  const toggle = () => {
    if (item.url) {
      const a = audioRef.current;
      if (playing) a.pause();
      else a.play();
      return;
    }
    // contoh data tanpa file audio: simulasi progress
    if (playing) {
      clearInterval(simRef.current);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    simRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 0.1 / item.duration;
        if (next >= 1) {
          clearInterval(simRef.current);
          setPlaying(false);
          return 0;
        }
        return next;
      });
    }, 100);
  };

  return (
    <div className="flex items-center gap-3 rounded-md border border-gold/15 bg-noir-800/80 p-3">
      {item.url && (
        <audio
          ref={audioRef}
          src={item.url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
          }}
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (item.duration || e.currentTarget.duration || 1))}
        />
      )}
      <button
        onClick={toggle}
        className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-foil text-noir transition active:scale-95"
        aria-label={playing ? "Jeda" : "Putar"}
      >
        {playing ? <Pause className="h-4 w-4 fill-noir" /> : <Play className="ml-0.5 h-4 w-4 fill-noir" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-[13px] font-semibold text-cream">{item.name}</p>
          <span className="ml-2 text-[10px] tabular-nums text-cream/40">0:{pad(Math.round(item.duration))}</span>
        </div>
        <div className="mt-1.5 flex h-6 items-center gap-[2px] overflow-hidden">
          {BAR_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className={`w-[3px] flex-shrink-0 transition-colors ${i / BAR_HEIGHTS.length <= progress ? "bg-gold" : "bg-cream/15"}`}
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
        <p className="mt-1 text-[10px] text-cream/35">{item.time}</p>
      </div>
    </div>
  );
}

function VoiceWishes({ initial, guestName, onSubmit, onToast }) {
  const LIMIT = 15;
  const [items, setItems] = useState(initial);
  const [state, setState] = useState("idle"); // idle | recording | review
  const [elapsed, setElapsed] = useState(0);
  const [draft, setDraft] = useState(null); // { blob, url, duration }
  const [name, setName] = useState(guestName || "");
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startRef = useRef(0);

  const stopTracks = () => streamRef.current?.getTracks().forEach((t) => t.stop());

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      stopTracks();
    },
    []
  );

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
  }, []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onToast("Browser ini belum mendukung rekam suara");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stopTracks();
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const duration = Math.min(LIMIT, (performance.now() - startRef.current) / 1000);
        setDraft({ blob, url: URL.createObjectURL(blob), duration });
        setState("review");
      };
      recRef.current = rec;
      rec.start();
      startRef.current = performance.now();
      setElapsed(0);
      setState("recording");
      timerRef.current = setInterval(() => {
        const s = (performance.now() - startRef.current) / 1000;
        setElapsed(s);
        if (s >= LIMIT) stop();
      }, 100);
    } catch {
      onToast("Izin mikrofon ditolak");
    }
  };

  const discard = () => {
    if (draft) URL.revokeObjectURL(draft.url);
    setDraft(null);
    setState("idle");
    setElapsed(0);
  };

  const send = async () => {
    if (!name.trim()) {
      onToast("Isi nama dulu ya");
      return;
    }
    try {
      await onSubmit?.({ name: name.trim(), blob: draft.blob, duration: draft.duration });
      setItems((list) => [{ name: name.trim(), duration: draft.duration, time: "Baru saja", url: draft.url }, ...list]);
      setDraft(null);
      setState("idle");
      setElapsed(0);
      onToast("Pesan suaramu terkirim");
    } catch {
      onToast("Gagal mengirim pesan suara");
    }
  };

  const R = 44;
  const C = 2 * Math.PI * R;

  return (
    <Section id="voice" className="bg-noir-900/60">
      <Kawung opacity={0.04} />
      <Heading kicker="PANGESTU LUMANTAR SWANTEN" title="Doa dalam Suara" />
      <Reveal delay={0.1} className="mt-4 flex justify-center">
        <PremiumBadge label="Voice Note" />
      </Reveal>

      <Reveal delay={0.15} className="relative z-10 mt-8">
        <KencanaPanel innerClassName="p-6 text-center">
          <p className="font-cormorant text-[16px] italic text-cream/70">Rekam ucapan & doamu, maksimal 15 detik.</p>

          <div className="relative mx-auto mt-6 h-[120px] w-[120px]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(201,164,92,0.15)" strokeWidth="3" />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="#C9A45C"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C - (Math.min(elapsed, LIMIT) / LIMIT) * C}
                style={{ transition: "stroke-dashoffset 0.1s linear" }}
              />
            </svg>
            {state === "recording" && <span className="absolute inset-4 animate-ping rounded-full bg-red-500/20" />}
            <button
              onClick={state === "recording" ? stop : start}
              disabled={state === "review"}
              className={`absolute inset-4 grid place-items-center rounded-full transition active:scale-95 disabled:opacity-40 ${
                state === "recording" ? "bg-red-500 text-white" : "bg-foil text-noir"
              }`}
              aria-label={state === "recording" ? "Berhenti merekam" : "Mulai merekam"}
            >
              {state === "recording" ? <Square className="h-6 w-6 fill-white" /> : <Mic className="h-7 w-7" />}
            </button>
          </div>
          <p className="mt-3 font-mono text-sm tabular-nums text-cream/70">
            0:{pad(Math.floor(Math.min(elapsed, LIMIT)))} <span className="text-cream/30">/ 0:{LIMIT}</span>
          </p>
          <p className="mt-1 text-[11px] text-cream/40">
            {state === "recording" ? "Merekam… tap untuk berhenti" : state === "review" ? "Dengarkan & kirim" : "Tap untuk mulai merekam"}
          </p>

          <AnimatePresence>
            {state === "review" && draft && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-5 space-y-3 text-left">
                  <audio src={draft.url} controls className="h-10 w-full" />
                  <input
                    value={name}
                    maxLength={50}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama kamu"
                    className="w-full rounded-md border border-gold/20 bg-noir-800 px-4 py-3 text-[14px] text-cream outline-none placeholder:text-cream/30 focus:border-gold/60"
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <GoldButton variant="outline" onClick={discard}>
                      Ulangi
                    </GoldButton>
                    <GoldButton onClick={send}>
                      <Send className="h-4 w-4" /> Kirim
                    </GoldButton>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </KencanaPanel>
      </Reveal>

      <div className="relative z-10 mt-8 space-y-3">
        {items.map((it, i) => (
          <Reveal key={`${it.name}-${i}`} delay={i * 0.05}>
            <VoiceItem item={it} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================
   PENUTUP
   ============================================================ */

function Closing({ data }) {
  return (
    <section className="relative overflow-hidden px-6 pb-32 pt-20 text-center">
      <Kawung opacity={0.06} />
      <Blencong className="left-1/2 top-[30%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute left-1/2 top-[36%] h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,175,106,0.16),transparent)]" />
      <WayangParallax side="left" variant="satria" className="top-[14%]" speed={70} />
      <WayangParallax side="right" variant="putri" className="top-[14%]" speed={70} />
      <Reveal className="relative z-10">
        <GununganArt className="mx-auto w-[120px]" tree />
        <p className="mx-auto mt-8 max-w-[300px] font-cormorant text-[17px] italic leading-relaxed text-cream/75">
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.
        </p>
        <p className="mt-6 font-cinzel text-[11px] tracking-[0.35em] text-gold/80">MATUR NUWUN</p>
        <h2 className="mt-4 font-script text-[50px] leading-none text-foil">
          {data.groom.nickname} &amp; {data.bride.nickname}
        </h2>
        <ParangDivider className="mt-6" />
      </Reveal>
      <p className="relative z-10 mt-12 text-[10px] tracking-[0.3em] text-cream/30">
        MADE WITH <Heart className="inline h-2.5 w-2.5 fill-gold text-gold" /> BY MOMENLABS
      </p>
    </section>
  );
}

function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 20, x: "-50%" }}
          className="fixed bottom-24 left-1/2 z-[120] flex items-center gap-2 whitespace-nowrap rounded-md border border-gold/30 bg-noir-800/95 px-4 py-2.5 text-[12px] text-cream shadow-xl backdrop-blur"
        >
          <Check className="h-3.5 w-3.5 text-gold" /> {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   NAVIGASI BAWAH
   ============================================================ */

function BottomNav({ items }) {
  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 1.2, ease }}
      className="fixed bottom-5 left-4 z-40 flex items-center gap-1 rounded-md border border-gold/25 bg-noir-800/90 p-1.5 backdrop-blur-md before:absolute before:inset-x-3 before:-top-px before:h-px before:bg-foil lg:left-[calc(100%-440px+16px)]"
    >
      {items.map(({ href, icon: Icon, label }) => (
        <a
          key={href}
          href={href}
          aria-label={label}
          className="grid h-9 w-9 place-items-center rounded text-cream/60 transition hover:bg-gold/10 hover:text-gold"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </motion.nav>
  );
}

/* ============================================================
   KOMPONEN UTAMA
   ============================================================ */

export default function WayangKencana({
  isPremium = PLAN_FLAGS.isPremium,
  isLuxury = PLAN_FLAGS.isLuxury,
  data = DEFAULT_DATA,
  guestName = "",
  onRsvp, // async (form) => simpan ke backend
  onVoiceWish, // async ({ name, blob, duration }) => upload ke storage
}) {
  const premium = isPremium || isLuxury; // paket Luxury sudah termasuk semua fitur Premium
  const level = levelFromPlan({ isPremium: premium, isLuxury });
  const [opened, setOpened] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState("");
  const audioRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [opened]);

  const toggleMusic = () => {
    const a = audioRef.current;
    if (!a || !data.music.url) {
      setPlaying((p) => !p);
      return;
    }
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  const openInvitation = () => {
    setOpened(true);
    window.scrollTo(0, 0);
    const a = audioRef.current;
    if (a && data.music.url) a.play().catch(() => {});
    else setPlaying(true);
  };

  const initials = `${data.groom.nickname[0]}&${data.bride.nickname[0]}`;

  const navItems = [
    { href: "#mempelai", icon: Heart, label: "Mempelai" },
    { href: "#acara", icon: CalendarPlus, label: "Acara" },
    { href: "#hadiah", icon: Gift, label: "Hadiah" },
    { href: "#rsvp", icon: Send, label: "RSVP" },
    ...(premium ? [{ href: "#voice", icon: Mic, label: "Voice" }] : []),
  ];

  return (
    <ParallaxContext.Provider value={level}>
    <div className="min-h-screen bg-noir font-sans text-cream antialiased">
      {data.music.url && (
        <audio
          ref={audioRef}
          src={data.music.url}
          loop
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      <AnimatePresence>{!opened && <Cover data={data} guestName={guestName} onOpen={openInvitation} />}</AnimatePresence>

      <div className="lg:grid lg:grid-cols-[1fr_440px]">
        {/* panel kiri khusus desktop: panggung wayang */}
        <aside className="sticky top-0 hidden h-screen overflow-hidden bg-noir-900 lg:block">
          <Kawung opacity={0.07} size={56} />
          <div className="absolute left-1/2 top-[40%] h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,175,106,0.2),transparent)]" />
          <WayangFigure variant="satria" className="absolute bottom-0 left-[6%] h-[78vh] text-gold/[0.12]" />
          <WayangFigure variant="putri" className="absolute bottom-0 right-[6%] h-[78vh] -scale-x-100 text-gold/[0.12]" />
          <ParangBand className="absolute inset-x-0 top-0 h-4 w-full opacity-40" count={60} />
          <ParangBand className="absolute inset-x-0 bottom-0 h-4 w-full -scale-y-100 opacity-40" count={60} />
          <div className="relative flex h-full flex-col items-center justify-center text-center">
            <GununganArt className="h-[42vh] w-auto" />
            <p className="mt-8 font-cinzel text-xs tracking-[0.5em] text-gold">PAWIWAHAN AGUNG</p>
            <h1 className="mt-4 font-script text-[88px] leading-none text-foil">
              {data.groom.nickname} &amp; {data.bride.nickname}
            </h1>
            <p className="mt-4 font-cormorant text-2xl italic text-cream/70">{fmtDate(data.events[0].start)}</p>
          </div>
        </aside>

        {/* konten undangan (mobile-first) */}
        <main className="relative mx-auto w-full max-w-[440px] overflow-hidden bg-noir lg:border-l lg:border-gold/10">
          <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.04] mix-blend-overlay" />
          <Hero data={data} />
          <QuoteSection quote={data.quote} />
          <CoupleSection data={data} />
          {premium && <StoryMode story={data.story} initials={initials} />}
          <EventsSection data={data} />
          <GiftSection gifts={data.gifts} onToast={showToast} />
          <RsvpSection initialWishes={data.wishes} guestName={guestName} onSubmit={onRsvp} onToast={showToast} />
          {premium && (
            <VoiceWishes initial={data.voiceWishes} guestName={guestName} onSubmit={onVoiceWish} onToast={showToast} />
          )}
          <Closing data={data} />
        </main>
      </div>

      {opened && (
        <>
          {level === "cinematic" && <CinematicEffects />}
          <BottomNav items={navItems} />
          <MusicPlayer playing={playing} onToggle={toggleMusic} title={data.music.title} />
        </>
      )}
      <CinematicOpening
        show={opened && level === "cinematic"}
        subtitle="PAWIWAHAN AGUNG"
        title={`${data.groom.nickname} & ${data.bride.nickname}`}
      />
      <Toast message={toast} />
    </div>
    </ParallaxContext.Provider>
  );
}
