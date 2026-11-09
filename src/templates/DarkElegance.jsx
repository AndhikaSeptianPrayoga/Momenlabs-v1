import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CinematicBlock,
  CinematicEffects,
  CinematicOpening,
  ParallaxContext,
  ParallaxLayer,
  levelFromPlan,
  useHeroParallax,
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
import { TZ, fmtTime, gcalLink } from "../design/kit/calendar.js";

/* ============================================================
   MOMENLABS — TEMPLATE "DARK ELEGANCE" (Hitam & Gold)
   ------------------------------------------------------------
   Paket & fitur:
   - isPremium : Story Mode + Voice Note Wishes
   - isLuxury  : Cinematic parallax + opening eksklusif (otomatis termasuk Premium)
   Tanpa keduanya (Basic) undangan tampil tanpa parallax.

   Pemakaian:
   <DarkElegance isPremium isLuxury data={dataUndangan} guestName="Bapak Andi" />
   ============================================================ */

export const PLAN_FLAGS = {
  isPremium: true,
  isLuxury: true,
};

export const DEFAULT_DATA = {
  slug: "bima-clara",
  bride: {
    nickname: "Clara",
    fullName: "Clara Anindita Putri",
    parents: "Putri kedua dari Bapak Hartono & Ibu Melinda",
    instagram: "clara.anindita",
    photo: null, // URL foto mempelai wanita
  },
  groom: {
    nickname: "Bima",
    fullName: "Bima Satria Wardhana",
    parents: "Putra pertama dari Bapak Wiryawan & Ibu Ratna",
    instagram: "bimasatria",
    photo: null, // URL foto mempelai pria
  },
  coverPhoto: null, // URL foto pasangan untuk cover & hero
  quote: {
    text: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
    source: "QS. Ar-Rum : 21",
  },
  events: [
    {
      id: "akad",
      title: "Akad Nikah",
      start: "2026-12-12T08:00:00+07:00",
      end: "2026-12-12T10:00:00+07:00",
      venue: "Masjid Agung Al-Azhar",
      address: "Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan",
      mapsUrl: "https://maps.google.com/?q=Masjid+Agung+Al-Azhar+Jakarta",
    },
    {
      id: "resepsi",
      title: "Resepsi",
      start: "2026-12-12T11:00:00+07:00",
      end: "2026-12-12T14:00:00+07:00",
      venue: "The Dharmawangsa Ballroom",
      address: "Jl. Brawijaya Raya No. 26, Kebayoran Baru, Jakarta Selatan",
      mapsUrl: "https://maps.google.com/?q=The+Dharmawangsa+Jakarta",
    },
  ],
  story: [
    { year: "2019", title: "Pertama Bertemu", text: "Sebuah seminar kampus di Bandung mempertemukan kami, berawal dari obrolan singkat soal kopi." },
    { year: "2021", title: "Menjalin Kasih", text: "Dua tahun berteman, akhirnya kami memutuskan untuk melangkah bersama." },
    { year: "2025", title: "Lamaran", text: "Di hadapan kedua keluarga, Bima memberanikan diri meminang Clara." },
    { year: "2026", title: "Hari Bahagia", text: "Kini kami siap mengikat janji suci, dan ingin merayakannya bersamamu." },
  ],
  gifts: {
    banks: [
      { bank: "BCA", number: "1234567890", holder: "Clara Anindita Putri" },
      { bank: "Mandiri", number: "1370012345678", holder: "Bima Satria Wardhana" },
    ],
    qris: { image: null, holder: "Clara & Bima" }, // isi image dengan URL gambar QRIS asli
    address: {
      recipient: "Clara Anindita Putri",
      text: "Jl. Kemang Timur No. 12, Mampang Prapatan, Jakarta Selatan 12730",
    },
  },
  music: {
    url: null, // URL file musik .mp3
    title: "Wedding Instrumental",
  },
  wishes: [
    { name: "Tante Rina", attendance: "hadir", message: "Selamat ya Clara & Bima! Semoga menjadi keluarga sakinah, mawaddah, warahmah.", time: "2 jam lalu" },
    { name: "Dimas Prakoso", attendance: "hadir", message: "Akhirnya! Bahagia selalu kalian berdua, sampai ketemu di resepsi.", time: "5 jam lalu" },
    { name: "Sasa & Keluarga", attendance: "tidak", message: "Maaf belum bisa hadir, doa terbaik dari kami sekeluarga di Surabaya.", time: "1 hari lalu" },
  ],
  voiceWishes: [
    { name: "Om Bambang", duration: 12, time: "3 jam lalu", url: null },
    { name: "Nadia & Arga", duration: 15, time: "6 jam lalu", url: null },
  ],
};

/* ============================================================
   UTIL
   ============================================================ */

const ease = [0.22, 1, 0.36, 1];
const pad = (n) => String(n).padStart(2, "0");

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const fmtShort = (iso) => {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }).formatToParts(d);
  const get = (t) => p.find((x) => x.type === t).value;
  return `${get("day")} . ${get("month")} . ${get("year")}`;
};

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
      Hari: Math.floor(diff / 86400000),
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

/* ============================================================
   ELEMEN DEKORATIF
   ============================================================ */

function GoldDivider({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/70" />
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gold" fill="currentColor">
        <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10Z" />
      </svg>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/70" />
    </div>
  );
}

function CornerOrnament({ className = "" }) {
  return (
    <svg viewBox="0 0 80 80" className={`text-gold ${className}`} fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden="true">
      <path d="M2 78 V 20 Q 2 2 20 2 H 78" />
      <path d="M8 78 V 24 Q 8 8 24 8 H 78" opacity="0.5" />
      <path d="M2 40 Q 20 40 20 20 Q 40 20 40 2" opacity="0.7" />
      <circle cx="20" cy="20" r="2.5" fill="currentColor" />
      <path d="M28 14 q 6 -8 14 -6 M14 28 q -8 6 -6 14" opacity="0.7" />
    </svg>
  );
}

function Frame({ children, className = "" }) {
  const position = /\b(absolute|fixed)\b/.test(className) ? "" : "relative";
  return (
    <div className={`${position} ${className}`}>
      <CornerOrnament className="pointer-events-none absolute left-0 top-0 h-14 w-14" />
      <CornerOrnament className="pointer-events-none absolute right-0 top-0 h-14 w-14 rotate-90" />
      <CornerOrnament className="pointer-events-none absolute bottom-0 right-0 h-14 w-14 rotate-180" />
      <CornerOrnament className="pointer-events-none absolute bottom-0 left-0 h-14 w-14 -rotate-90" />
      {children}
    </div>
  );
}

function Photo({ src, alt, initial, className = "", rounded = "rounded-t-full" }) {
  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="relative h-full w-full bg-[radial-gradient(120%_80%_at_50%_10%,rgb(var(--c-gold-deep)/0.32)_0%,rgb(var(--c-noir-800))_55%,rgb(var(--c-noir))_100%)]">
          <svg viewBox="0 0 100 130" className="absolute inset-x-0 bottom-0 w-full text-gold/25" fill="currentColor" aria-hidden="true">
            <circle cx="50" cy="50" r="19" />
            <path d="M10 130 C 12 92, 30 78, 50 78 C 70 78, 88 92, 90 130 Z" />
          </svg>
          {initial && (
            <span className="absolute inset-x-0 top-[9%] text-center font-cinzel text-2xl text-foil">{initial}</span>
          )}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.12] mix-blend-overlay" />
    </div>
  );
}

function CouplePhoto({ src, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src ? (
        <img src={src} alt="Foto pasangan" className="h-full w-full object-cover" />
      ) : (
        <div className="relative h-full w-full bg-[radial-gradient(100%_70%_at_50%_15%,rgb(var(--c-gold-deep)/0.32)_0%,rgb(var(--c-noir-800))_55%,rgb(var(--c-noir))_100%)]">
          <svg
            viewBox="0 0 200 200"
            className="absolute left-1/2 top-[42%] w-[85%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 text-gold/20"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="78" cy="78" r="24" />
            <circle cx="124" cy="72" r="25" />
            <path d="M30 200 C 32 140, 52 116, 78 116 C 98 116, 108 130, 110 200Z" />
            <path d="M92 200 C 96 130, 108 108, 124 108 C 152 108, 170 136, 172 200Z" />
          </svg>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.12] mix-blend-overlay" />
    </div>
  );
}

/* dekorasi opsional per tema: { Hero, Section, Global } (dipakai demo katalog) */
const DecorContext = createContext(null);

function Section({ id, children, className = "" }) {
  const decor = useContext(DecorContext);
  const Ornaments = decor?.Section;
  return (
    <section id={id} className={`relative overflow-hidden px-6 py-20 ${className}`}>
      {Ornaments ? <Ornaments id={id} /> : <SectionOrnaments />}
      <CinematicBlock className="relative">{children}</CinematicBlock>
    </section>
  );
}

/* ornamen emas samar di latar section, bergerak beda kecepatan saat scroll */
function SectionOrnaments() {
  return (
    <>
      <ParallaxLayer speed={70} rotate={6} className="absolute -left-10 top-6 w-40 opacity-[0.14]">
        <CornerOrnament className="h-40 w-40" />
      </ParallaxLayer>
      <ParallaxLayer speed={140} rotate={25} className="absolute -right-6 bottom-10 w-16 opacity-25">
        <svg viewBox="0 0 24 24" className="h-16 w-16 text-gold" fill="currentColor" aria-hidden="true">
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10Z" />
        </svg>
      </ParallaxLayer>
      <ParallaxLayer onlyCinematic speed={200} className="absolute right-[18%] top-[30%] w-6 opacity-40">
        <span className="block h-1.5 w-1.5 rotate-45 bg-gold-light shadow-[0_0_10px_rgba(233,210,154,0.9)]" />
      </ParallaxLayer>
    </>
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
    <Reveal className="text-center">
      <p className="font-cinzel text-[11px] tracking-[0.4em] text-gold/80">{kicker}</p>
      <h2 className="mt-3 font-cormorant text-[40px] font-medium italic leading-none text-foil">{title}</h2>
      <GoldDivider className="mt-5" />
    </Reveal>
  );
}

function PremiumBadge({ label = "Premium" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 font-cinzel text-[9px] tracking-[0.2em] text-gold">
      <Lock className="h-2.5 w-2.5" /> {label}
    </span>
  );
}

function GoldButton({ as: As = "button", children, className = "", variant = "solid", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[12px] font-semibold tracking-wide transition active:scale-[0.97]";
  const styles =
    variant === "solid"
      ? "bg-foil text-noir shadow-[0_10px_30px_-10px_rgba(201,164,92,0.6)] hover:brightness-110"
      : "border border-gold/40 text-gold hover:bg-gold/10";
  return (
    <As className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </As>
  );
}

/* ============================================================
   1. COVER
   ============================================================ */

function Cover({ data, guestName, onOpen }) {
  const firstEvent = data.events[0];
  return (
    <motion.div
      key="cover"
      className="fixed inset-0 z-[100] overflow-hidden bg-noir"
      exit={{ y: "-100%" }}
      transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
    >
      <CouplePhoto src={data.coverPhoto} className="absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-noir/70 via-noir/40 to-noir" />
      <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_45%,transparent_0%,rgb(var(--c-noir-900)/0.85)_100%)]" />

      <Frame className="absolute inset-4 sm:inset-6">
        <div className="absolute inset-[10px] border border-gold/20" />
      </Frame>

      <div className="relative mx-auto flex h-full max-w-md flex-col items-center justify-center px-10 text-center">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          animate={{ opacity: 1, letterSpacing: "0.45em" }}
          transition={{ duration: 1.6, ease }}
          className="font-cinzel text-[11px] text-gold"
        >
          THE WEDDING OF
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.4, delay: 0.3, ease }}
          className="mt-6 font-script text-[64px] leading-[0.95] text-foil"
        >
          {data.groom.nickname}
          <span className="block py-1 font-cormorant text-3xl italic text-gold/80">&amp;</span>
          {data.bride.nickname}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-6 font-cinzel text-xs tracking-[0.35em] text-cream/70"
        >
          {fmtShort(firstEvent.start)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1, ease }}
          className="mt-10 w-full"
        >
          <p className="font-cormorant text-sm italic text-cream/60">Kepada Yth. Bapak/Ibu/Saudara/i</p>
          <p className="mx-auto mt-2 max-w-[260px] truncate border-b border-gold/30 pb-2 font-cormorant text-2xl font-semibold text-cream">
            {guestName || "Tamu Undangan"}
          </p>
          <p className="mt-2 text-[10px] tracking-wider text-cream/40">
            Mohon maaf apabila ada kesalahan penulisan nama/gelar
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.3, ease }}
          className="mt-9"
        >
          <button
            onClick={onOpen}
            className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-foil px-8 py-3.5 font-cinzel text-[12px] font-semibold tracking-[0.2em] text-noir shadow-[0_15px_40px_-10px_rgba(201,164,92,0.7)]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            <svg viewBox="0 0 24 24" className="relative h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 7l9 6 9-6M3 7v10h18V7M3 7l9-4 9 4" />
            </svg>
            <span className="relative">BUKA UNDANGAN</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   2. FLOATING MUSIC PLAYER
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
            className="hidden items-center gap-2 rounded-full border border-gold/20 bg-noir-800/90 py-1.5 pl-3 pr-3.5 backdrop-blur min-[440px]:flex"
          >
            <div className="flex h-3 items-end gap-[2px]">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="w-[2px] rounded-full bg-gold"
                  animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="max-w-[110px] truncate text-[10px] text-cream/70">{title}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={onToggle}
        aria-label={playing ? "Matikan musik" : "Putar musik"}
        className="relative grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-noir-800 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)]"
      >
        <motion.span
          className="absolute inset-1 rounded-full bg-[repeating-radial-gradient(circle_at_center,#1a1719_0_2px,#0f0e10_2px_4px)]"
          animate={{ rotate: playing ? 360 : 0 }}
          transition={playing ? { duration: 4, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
        />
        <span className="absolute h-4 w-4 rounded-full bg-foil" />
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
  const level = useParallaxLevel();
  const HeroDecor = useContext(DecorContext)?.Hero;
  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden">
      {/* lapisan belakang: foto */}
      <motion.div style={layer.back} className="absolute inset-0">
        <motion.div initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease }} className="h-full w-full">
          <CouplePhoto src={data.coverPhoto} className="h-full w-full" />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-noir/30 via-transparent to-noir" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-noir via-noir/80 to-transparent" />
      {HeroDecor && <HeroDecor />}

      {/* lapisan tengah: bingkai emas */}
      {level !== "none" && !HeroDecor && (
        <motion.div style={layer.mid} className="pointer-events-none absolute inset-5" aria-hidden="true">
          <Frame className="absolute inset-0 opacity-70" />
        </motion.div>
      )}

      {/* lapisan depan: teks */}
      <motion.div style={layer.front} className="relative px-6 pb-14 text-center">
        <Reveal>
          <p className="font-cinzel text-[11px] tracking-[0.45em] text-gold">WE ARE GETTING MARRIED</p>
          <h1 className="mt-4 font-script text-[58px] leading-none text-foil">
            {data.groom.nickname} &amp; {data.bride.nickname}
          </h1>
          <p className="mt-3 font-cormorant text-lg italic text-cream/70">{fmtDate(first.start)}</p>
        </Reveal>
        <Reveal delay={0.15} className="mt-8 grid grid-cols-4 gap-2">
          {Object.entries(t).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-gold/20 bg-noir-800/60 py-3 backdrop-blur">
              <p className="font-cormorant text-3xl font-medium leading-none text-foil">{pad(v)}</p>
              <p className="mt-1.5 font-cinzel text-[8px] tracking-[0.25em] text-cream/50">{k.toUpperCase()}</p>
            </div>
          ))}
        </Reveal>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mx-auto mt-10 h-10 w-6 rounded-full border border-gold/40 p-1"
        >
          <span className="mx-auto block h-2 w-1 rounded-full bg-gold" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function QuoteSection({ quote }) {
  return (
    <Section className="pt-10">
      <Reveal className="relative rounded-[28px] border border-gold/15 bg-noir-800/60 px-7 py-10 text-center">
        <span className="absolute -top-5 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border border-gold/30 bg-noir">
          <Heart className="h-4 w-4 fill-gold text-gold" />
        </span>
        <p className="font-cormorant text-[19px] italic leading-relaxed text-cream/85">“{quote.text}”</p>
        <p className="mt-5 font-cinzel text-[11px] tracking-[0.3em] text-gold">{quote.source}</p>
      </Reveal>
    </Section>
  );
}

function PersonCard({ p, role, delay }) {
  return (
    <Reveal delay={delay} className="text-center">
      <div className="relative mx-auto w-[220px]">
        <div className="absolute -inset-2.5 rounded-t-full border border-gold/30" />
        <Photo src={p.photo} alt={p.fullName} initial={p.nickname[0]} className="aspect-[3/4] w-full border border-gold/40" />
      </div>
      <p className="mt-7 font-cinzel text-[10px] tracking-[0.4em] text-gold/80">{role}</p>
      <h3 className="mt-2 font-cormorant text-[30px] font-medium leading-tight text-foil">{p.fullName}</h3>
      <p className="mx-auto mt-2 max-w-[260px] font-cormorant text-[15px] italic leading-snug text-cream/70">{p.parents}</p>
      {p.instagram && (
        <a
          href={`https://instagram.com/${p.instagram}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold/30 px-4 py-2 text-[11px] text-gold transition hover:bg-gold/10"
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
      <Heading kicker="BISMILLAHIRRAHMANIRRAHIM" title="Mempelai" />
      <Reveal delay={0.1}>
        <p className="mx-auto mt-6 max-w-xs text-center font-cormorant text-[16px] italic leading-relaxed text-cream/70">
          Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami:
        </p>
      </Reveal>
      <div className="mt-14 space-y-14">
        <PersonCard p={data.groom} role="MEMPELAI PRIA" />
        <Reveal className="text-center font-script text-6xl text-foil">&amp;</Reveal>
        <PersonCard p={data.bride} role="MEMPELAI WANITA" delay={0.05} />
      </div>
    </Section>
  );
}

/* ============================================================
   6. STORY MODE (PREMIUM)
   ============================================================ */

function StoryMode({ story }) {
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
      <Heading kicker="OUR JOURNEY" title="Love Story" />
      <Reveal delay={0.1} className="mt-4 flex justify-center">
        <PremiumBadge label="Story Mode" />
      </Reveal>

      <Reveal delay={0.15} className="mx-auto mt-8 max-w-[340px]">
        <div
          className="relative aspect-[9/16] w-full cursor-pointer select-none overflow-hidden rounded-[28px] border border-gold/30 bg-noir-800 shadow-[0_30px_60px_-20px_rgba(201,164,92,0.25)]"
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
              <div key={i} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-cream/20">
                <div
                  className="h-full rounded-full bg-foil"
                  style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-3 top-6 z-20 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-gold/50 bg-noir font-cinzel text-[9px] text-gold">
              B&amp;C
            </span>
            <span className="text-[11px] font-semibold text-cream">Our Story</span>
            <span className="text-[10px] text-cream/50">· {s.year}</span>
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease }}
              className="absolute inset-0"
            >
              {s.photo ? (
                <img src={s.photo} alt={s.title} className="h-full w-full object-cover" />
              ) : (
                <div className="relative h-full w-full bg-[radial-gradient(90%_60%_at_50%_30%,rgb(var(--c-gold-deep)/0.32)_0%,rgb(var(--c-noir-800))_55%,rgb(var(--c-noir))_100%)]">
                  <span className="absolute left-1/2 top-[22%] -translate-x-1/2 font-cinzel text-[96px] leading-none text-gold/10">
                    {s.year}
                  </span>
                  <Frame className="absolute inset-6 top-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-center">
                <p className="font-cinzel text-[11px] tracking-[0.4em] text-gold">{s.year}</p>
                <h3 className="mt-2 font-cormorant text-[34px] font-medium italic leading-tight text-foil">{s.title}</h3>
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
   3. DETAIL ACARA
   ============================================================ */

function EventsSection({ data }) {
  const couple = `${data.groom.nickname} & ${data.bride.nickname}`;
  return (
    <Section id="acara" className="bg-noir-900/60">
      <Heading kicker="SAVE THE DATE" title="Rangkaian Acara" />
      <div className="mt-12 space-y-6">
        {data.events.map((ev, i) => (
          <Reveal key={ev.id} delay={i * 0.1}>
            <div className="relative overflow-hidden rounded-[28px] border border-gold/25 bg-gradient-to-b from-noir-700 to-noir-800 p-1">
              <div className="relative rounded-[24px] border border-gold/10 px-6 pb-7 pt-9 text-center">
                <Frame className="pointer-events-none absolute inset-2 opacity-60" />
                <p className="font-cinzel text-[10px] tracking-[0.4em] text-gold/80">0{i + 1}</p>
                <h3 className="mt-2 font-cormorant text-[34px] font-medium italic text-foil">{ev.title}</h3>
                <GoldDivider className="mt-3" />

                <div className="mt-6 flex items-center justify-center gap-4">
                  <div className="text-right">
                    <p className="font-cinzel text-[10px] tracking-[0.25em] text-cream/60">
                      {new Date(ev.start).toLocaleDateString("id-ID", { weekday: "long", timeZone: TZ }).toUpperCase()}
                    </p>
                  </div>
                  <div className="border-x border-gold/30 px-4">
                    <p className="font-cormorant text-5xl font-medium leading-none text-foil">
                      {new Date(ev.start).toLocaleDateString("id-ID", { day: "2-digit", timeZone: TZ })}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-cinzel text-[10px] tracking-[0.25em] text-cream/60">
                      {new Date(ev.start)
                        .toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: TZ })
                        .toUpperCase()}
                    </p>
                  </div>
                </div>

                <p className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-cream/80">
                  <Clock className="h-3.5 w-3.5 text-gold" /> {fmtTime(ev.start)} – {fmtTime(ev.end)} WIB
                </p>
                <div className="mx-auto mt-4 max-w-[260px]">
                  <p className="inline-flex items-center gap-1.5 font-cormorant text-xl font-semibold text-cream">
                    <MapPin className="h-4 w-4 text-gold" /> {ev.venue}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-cream/55">{ev.address}</p>
                </div>

                <div className="mt-7 grid gap-2.5">
                  <GoldButton as="a" href={gcalLink(ev, couple)} target="_blank" rel="noreferrer" variant="outline">
                    <CalendarPlus className="h-4 w-4" /> Simpan ke Google Calendar
                  </GoldButton>
                  <GoldButton as="a" href={ev.mapsUrl} target="_blank" rel="noreferrer">
                    <MapPin className="h-4 w-4" /> Buka Google Maps
                  </GoldButton>
                </div>
              </div>
            </div>
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
  const inFinder = (x, y) =>
    (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
  const cells = [];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) if (!inFinder(x, y) && rand() > 0.52) cells.push([x, y]);
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
    <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-gold-deep/30 via-noir-700 to-noir-800 p-5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)] ring-1 ring-gold/30">
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-gold/15 blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, #C9A45C 0 1px, transparent 1px 10px)" }}
      />
      <div className="relative flex items-start justify-between">
        <span className="font-cinzel text-lg font-semibold tracking-[0.15em] text-foil">{b.bank}</span>
        <svg viewBox="0 0 40 30" className="h-7 w-9" aria-hidden="true">
          <rect x="1" y="1" width="38" height="28" rx="5" className="fill-foil" fill="#C9A45C" />
          <path d="M1 11 H 14 M1 19 H 14 M26 11 H 39 M26 19 H 39 M14 1 V 29 M26 1 V 29" stroke="#8a6b34" strokeWidth="1" />
        </svg>
      </div>
      <p className="relative mt-6 font-mono text-[20px] tracking-[0.12em] text-cream">
        {b.number.replace(/(\d{4})(?=\d)/g, "$1 ")}
      </p>
      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.25em] text-cream/40">Atas Nama</p>
          <p className="truncate font-cormorant text-[17px] font-semibold text-cream">{b.holder}</p>
        </div>
        <button
          onClick={handle}
          className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold transition active:scale-95 ${
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
      <Heading kicker="WEDDING GIFT" title="Tanda Kasih" />
      <Reveal delay={0.1}>
        <p className="mx-auto mt-6 max-w-xs text-center font-cormorant text-[16px] italic leading-relaxed text-cream/70">
          Doa restu Anda merupakan karunia terindah bagi kami. Namun jika ingin memberikan tanda kasih, dapat melalui:
        </p>
      </Reveal>

      <Reveal delay={0.15} className="mx-auto mt-8 flex w-fit gap-1 rounded-full border border-gold/20 bg-noir-800 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative rounded-full px-4 py-2 text-[11px] font-semibold tracking-wide transition ${
              tab === t.id ? "text-noir" : "text-cream/60"
            }`}
          >
            {tab === t.id && <motion.span layoutId="gift-tab" className="absolute inset-0 rounded-full bg-foil" />}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </Reveal>

      <div className="mt-7">
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
              <div className="mx-auto max-w-[300px] rounded-[26px] border border-gold/30 bg-gradient-to-b from-noir-700 to-noir-800 p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-gold">
                  <QrCode className="h-4 w-4" />
                  <span className="font-cinzel text-xs tracking-[0.3em]">QRIS</span>
                </div>
                <div className="mx-auto mt-5 w-[200px] rounded-2xl bg-white p-3">
                  {gifts.qris.image ? (
                    <img src={gifts.qris.image} alt="QRIS" className="w-full" />
                  ) : (
                    <FakeQR seed={gifts.qris.holder} className="w-full" />
                  )}
                </div>
                <p className="mt-4 font-cormorant text-lg font-semibold text-cream">{gifts.qris.holder}</p>
                <p className="mt-1 text-[11px] text-cream/50">Scan dengan m-banking atau e-wallet apa pun</p>
              </div>
            )}

            {tab === "kado" && (
              <div className="rounded-[26px] border border-gold/30 bg-gradient-to-b from-noir-700 to-noir-800 p-6 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-noir">
                  <Gift className="h-6 w-6 text-gold" />
                </span>
                <p className="mt-4 font-cinzel text-[10px] tracking-[0.3em] text-gold/80">PENERIMA</p>
                <p className="mt-1 font-cormorant text-xl font-semibold text-cream">{gifts.address.recipient}</p>
                <p className="mx-auto mt-2 max-w-[250px] text-[13px] leading-relaxed text-cream/60">{gifts.address.text}</p>
                <GoldButton onClick={copyAddress} className="mt-6">
                  <Copy className="h-4 w-4" /> Salin Alamat
                </GoldButton>
              </div>
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
      onToast("Terima kasih! Konfirmasi & ucapanmu terkirim");
    } catch {
      onToast("Gagal mengirim, coba lagi");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-gold/20 bg-noir-800 px-4 py-3.5 text-[14px] text-cream outline-none transition placeholder:text-cream/30 focus:border-gold/60 focus:ring-4 focus:ring-gold/10";

  return (
    <Section id="rsvp">
      <Heading kicker="RSVP" title="Konfirmasi Kehadiran" />

      <Reveal delay={0.1}>
        <form onSubmit={submit} className="mt-10 space-y-3.5 rounded-[28px] border border-gold/20 bg-noir-700/40 p-5">
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
                className={`rounded-2xl border py-3.5 text-[13px] font-semibold transition ${
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
                <div className="flex items-center justify-between rounded-2xl border border-gold/20 bg-noir-800 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-[13px] text-cream/70">
                    <Users className="h-4 w-4 text-gold" /> Jumlah tamu
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, pax: Math.max(1, form.pax - 1) })}
                      className="grid h-8 w-8 place-items-center rounded-full border border-gold/30 text-gold"
                      aria-label="Kurangi"
                    >
                      −
                    </button>
                    <span className="w-4 text-center font-semibold text-cream">{form.pax}</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, pax: Math.min(5, form.pax + 1) })}
                      className="grid h-8 w-8 place-items-center rounded-full border border-gold/30 text-gold"
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
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <div className="flex items-center justify-between">
          <p className="font-cormorant text-2xl italic text-foil">{wishes.length} Ucapan</p>
          <div className="flex gap-2 text-[10px]">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-400">{counts.hadir} Hadir</span>
            <span className="rounded-full bg-cream/5 px-2.5 py-1 font-semibold text-cream/50">{counts.tidak} Tidak</span>
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
                className="rounded-2xl border border-gold/10 bg-noir-800/80 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-foil font-cinzel text-sm font-semibold text-noir">
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
    <div className="flex items-center gap-3 rounded-2xl border border-gold/15 bg-noir-800/80 p-3">
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
              className={`w-[3px] flex-shrink-0 rounded-full transition-colors ${i / BAR_HEIGHTS.length <= progress ? "bg-gold" : "bg-cream/15"}`}
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
      <Heading kicker="VOICE WISHES" title="Doa dalam Suara" />
      <Reveal delay={0.1} className="mt-4 flex justify-center">
        <PremiumBadge label="Voice Note" />
      </Reveal>

      <Reveal delay={0.15} className="mt-8 rounded-[28px] border border-gold/20 bg-noir-700/40 p-6 text-center">
        <p className="font-cormorant text-[16px] italic text-cream/70">Rekam ucapan & doamu, maksimal 15 detik.</p>

        <div className="relative mx-auto mt-6 h-[120px] w-[120px]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(var(--c-gold) / 0.15)" strokeWidth="3" />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke="rgb(var(--c-gold))"
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
                  className="w-full rounded-2xl border border-gold/20 bg-noir-800 px-4 py-3 text-[14px] text-cream outline-none placeholder:text-cream/30 focus:border-gold/60"
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
      </Reveal>

      <div className="mt-8 space-y-3">
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
      <ParallaxLayer speed={110} className="absolute -inset-y-28 inset-x-0" innerClassName="h-full">
        <CouplePhoto src={data.coverPhoto} className="h-full w-full opacity-30" />
      </ParallaxLayer>
      <div className="absolute inset-0 bg-gradient-to-b from-noir via-noir/70 to-noir" />
      <Frame className="relative px-8 py-14">
        <Reveal>
          <p className="font-cormorant text-[17px] italic leading-relaxed text-cream/75">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.
          </p>
          <p className="mt-6 font-cinzel text-[11px] tracking-[0.35em] text-gold/80">TERIMA KASIH</p>
          <h2 className="mt-4 font-script text-[54px] leading-none text-foil">
            {data.groom.nickname} &amp; {data.bride.nickname}
          </h2>
          <GoldDivider className="mt-6" />
        </Reveal>
      </Frame>
      <p className="relative mt-12 text-[10px] tracking-[0.3em] text-cream/30">
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
          className="fixed bottom-24 left-1/2 z-[120] flex items-center gap-2 whitespace-nowrap rounded-full border border-gold/30 bg-noir-800/95 px-4 py-2.5 text-[12px] text-cream shadow-xl backdrop-blur"
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
      className="fixed bottom-5 left-4 z-40 flex items-center gap-1 rounded-full border border-gold/20 bg-noir-800/90 p-1.5 backdrop-blur-md lg:left-[calc(100%-440px+16px)]"
    >
      {items.map(({ href, icon: Icon, label }) => (
        <a
          key={href}
          href={href}
          aria-label={label}
          className="grid h-9 w-9 place-items-center rounded-full text-cream/60 transition hover:bg-gold/10 hover:text-gold"
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

export default function DarkElegance({
  isPremium = PLAN_FLAGS.isPremium,
  isLuxury = PLAN_FLAGS.isLuxury,
  data = DEFAULT_DATA,
  guestName = "",
  onRsvp, // async (form) => simpan ke backend
  onVoiceWish, // async ({ name, blob, duration }) => upload ke storage
  renderCover, // opsional: ({ guestName, onOpen }) => cover pengganti (dipakai demo katalog)
  decor = null, // opsional: { Hero, Section, Global, Journey, Closing } dekorasi tema
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

  const navItems = [
    { href: "#mempelai", icon: Heart, label: "Mempelai" },
    { href: "#acara", icon: CalendarPlus, label: "Acara" },
    { href: "#hadiah", icon: Gift, label: "Hadiah" },
    { href: "#rsvp", icon: Send, label: "RSVP" },
    ...(premium ? [{ href: "#voice", icon: Mic, label: "Voice" }] : []),
  ];

  return (
    <ParallaxContext.Provider value={level}>
    <DecorContext.Provider value={decor}>
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

      <AnimatePresence>
        {!opened &&
          (renderCover ? (
            <React.Fragment key="cover">{renderCover({ guestName, onOpen: openInvitation })}</React.Fragment>
          ) : (
            <Cover data={data} guestName={guestName} onOpen={openInvitation} />
          ))}
      </AnimatePresence>

      <div className="lg:grid lg:grid-cols-[1fr_440px]">
        {/* panel kiri khusus desktop */}
        <aside className="sticky top-0 hidden h-screen overflow-hidden lg:block">
          <CouplePhoto src={data.coverPhoto} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-noir/40 via-noir/50 to-noir" />
          <div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-noir/40" />
          <Frame className="absolute inset-8">
            <div className="flex h-full flex-col items-center justify-end pb-20 text-center">
              <p className="font-cinzel text-xs tracking-[0.5em] text-gold">THE WEDDING OF</p>
              <h1 className="mt-5 font-script text-[96px] leading-none text-foil">
                {data.groom.nickname} &amp; {data.bride.nickname}
              </h1>
              <p className="mt-5 font-cormorant text-2xl italic text-cream/70">{fmtDate(data.events[0].start)}</p>
            </div>
          </Frame>
        </aside>

        {/* konten undangan (mobile-first) */}
        <main className="relative mx-auto w-full max-w-[440px] overflow-x-clip bg-noir lg:border-l lg:border-gold/10">
          {decor?.Backdrop && <decor.Backdrop />}
          <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.04] mix-blend-overlay" />
          {decor?.HeroScene ? <decor.HeroScene data={data} /> : <Hero data={data} />}
          {/* Journey: template berbasis adegan menyajikan salam, mempelai, kisah & acara
              sebagai bab perjalanan kamera di dalam dunianya sendiri */}
          {decor?.Journey ? (
            <decor.Journey data={data} premium={premium} />
          ) : (
            <>
              <QuoteSection quote={data.quote} />
              <CoupleSection data={data} />
              {premium && <StoryMode story={data.story} />}
              <EventsSection data={data} />
            </>
          )}
          <GiftSection gifts={data.gifts} onToast={showToast} />
          <RsvpSection initialWishes={data.wishes} guestName={guestName} onSubmit={onRsvp} onToast={showToast} />
          {premium && (
            <VoiceWishes initial={data.voiceWishes} guestName={guestName} onSubmit={onVoiceWish} onToast={showToast} />
          )}
          {decor?.Closing ? <decor.Closing data={data} /> : <Closing data={data} />}
        </main>
      </div>

      {opened && (
        <>
          {level === "cinematic" && <CinematicEffects />}
          {decor?.Global && <decor.Global />}
          <BottomNav items={navItems} />
          <MusicPlayer playing={playing} onToggle={toggleMusic} title={data.music.title} />
        </>
      )}
      <CinematicOpening
        show={opened && level === "cinematic" && !decor?.skipOpening}
        subtitle="THE WEDDING OF"
        title={`${data.groom.nickname} & ${data.bride.nickname}`}
      />
      <Toast message={toast} />
    </div>
    </DecorContext.Provider>
    </ParallaxContext.Provider>
  );
}
