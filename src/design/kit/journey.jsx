import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useScroll, useTime, useTransform, useVelocity } from "framer-motion";
import { CalendarPlus, Clock, Instagram, MapPin } from "lucide-react";
import { FONTS, MOTION } from "../tokens.js";
import { tiltX, tiltY } from "./stage.js";
import { TZ, fmtTime, gcalLink } from "./calendar.js";
import { CAM, registerChapter, seg, smooth, track } from "./rig.js";

/* ============================================================
   MOMENLABS KIT — PERJALANAN (isi undangan di dalam dunianya)
   ------------------------------------------------------------
   Isi undangan tidak berupa kartu di atas latar yang dipudarkan.
   Tiap bab adalah satu "shot" kamera (lihat rig.js); kontennya adalah
   benda di dunia template dan bergerak bersama kamera (CAM).

     1. Salam    — kamera menengadah ke langit; salam & petuah tertulis
                   kata demi kata di antara kabut.
     2. Mempelai — kamera menoleh ke kiri: papan nama mempelai pria
                   tergantung di bawah ornamen, berayun mengikuti gerak
                   kamera; melintas bangunan utama ("&"); menoleh ke kanan:
                   mempelai wanita.
     3. Kisah    — (Premium) disusul Album Kenangan: Story Mode foto ala Instagram.
                   Kamera berjalan di jalan menuju bangunan utama; tiap
                   kenangan adalah lentera yang menyala saat didekati
                   dan terlewati di sisi jalan.
     4. Acara    — kamera melangkah ke pintu bangunan utama, cahaya dari
                   dalam menyilaukan, lalu tiap acara "dibangun" sebagai
                   gerbang: sisi naik, mahkota turun, isi muncul.
     5. Penutup  — malam turun, lentera menyala; pengunjung bisa
                   menerbangkan cahaya doa.

   makeJourney(config) → { Journey, Closing } untuk decor template:
     tone    : token tone (tokens.js)
     asset   : folder sprite template, mis. "/templates/arunika"
     accent  : kelas strip aksen adat (marawa, kain sindur, …)
     crown   : { src | node, className } ornamen di atas papan nama (sprite, atau elemen SVG)
     lantern : { src, srcRight?, mirror?, glow } benda kenangan di sisi jalan; glow = posisi cahaya (kelas top-…)
               null = tanpa benda kenangan (hanya kartu)
     storyCard: "top" (bawaan, kartu kenangan di atas) | "center" (kartu di tengah layar)
     photo   : { className, initial } ukuran bingkai foto mempelai (bawaan w-[42%]) & ukuran huruf inisial
     light   : true untuk tone terang (teks gelap): kabut & tombol garis berwarna terang
     night   : seberapa gelap malam di penutup (0..1, bawaan 1)
     portal  : { crown: { src, className }, side: { src, className, left, right, mirror }, base?: { src, className } }
     copy    : teks bernuansa adat (lihat DEFAULT_COPY)
   ============================================================ */

const ease = MOTION.ease;

const DEFAULT_COPY = {
  albumKicker: "ALBUM KENANGAN",
  albumTitle: "Cerita Kami",
  salam: ["ASSALAMU'ALAIKUM", "WARAHMATULLAHI WABARAKATUH"],
  coupleKicker: "BISMILLAHIRRAHMANIRRAHIM",
  coupleIntro: "Dengan memohon rahmat dan rida Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami",
  ampTag: "DUA KELUARGA · SATU IKATAN",
  storyKicker: "KISAH KAMI",
  storyTitle: "Jejak Langkah",
  storySub: "Tiap lentera di jalan ini menyimpan satu kenangan",
  eventsTitle: "Hari Bahagia",
  eventsSub: "Mari melangkah masuk",
  thanks: "TERIMA KASIH",
  prayer: "TERBANGKAN DOA ✦",
};

// opacity jendela: muncul a→b, hilang c→d
const windowed = (p, a, b, c, d) => Math.min(smooth(seg(p, a, b)), 1 - smooth(seg(p, c, d)));

/* ---------- bab: section tinggi dengan panggung menempel ---------- */

function Chapter({ id, vh, pose, children }) {
  const ref = useRef(null);
  const poseRef = useRef(pose);
  poseRef.current = pose;
  useEffect(() => registerChapter({ ref, pose: (p) => poseRef.current(p) }), []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    // bab tidak menangkap sentuhan (kecuali kontennya) agar adegan di belakang tetap interaktif
    <section id={id} ref={ref} className="pointer-events-none relative" style={{ height: `${vh}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden" data-chapter-stage>
        {children(scrollYProgress)}
      </div>
    </section>
  );
}

/* ---------- percik cahaya saat disentuh ---------- */

function useSparks() {
  const [list, setList] = useState([]);
  const seq = useRef(0);
  const fire = (e, n = 12) => {
    const stage = e.currentTarget.closest("[data-chapter-stage]");
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const id = ++seq.current;
    setList((l) => [...l, { id, x: e.clientX - r.left, y: e.clientY - r.top, n }]);
    setTimeout(() => setList((l) => l.filter((v) => v.id !== id)), 1700);
  };
  const node = (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
      {list.map((b) =>
        Array.from({ length: b.n }, (_, i) => {
          const a = (i / b.n) * Math.PI * 2 + b.id;
          const r = 36 + ((i * 37) % 54);
          return (
            <motion.span
              key={`${b.id}-${i}`}
              className="absolute h-1.5 w-1.5 rounded-full bg-[#FFE7A8] shadow-[0_0_8px_2px_rgba(255,200,110,0.85)]"
              style={{ left: b.x, top: b.y }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r - 24, opacity: 0, scale: 0.3 }}
              transition={{ duration: 1.1 + (i % 3) * 0.2, ease: "easeOut" }}
            />
          );
        })
      )}
    </div>
  );
  return [node, fire];
}

function useViewWidth() {
  const calc = () => (typeof window === "undefined" ? 400 : Math.min(window.innerWidth, 440));
  const [w, setW] = useState(calc);
  useEffect(() => {
    const on = () => setW(calc());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

/* ---------- pose kamera tiap bab ---------- */

const salamPose = (p) => ({
  lift: track(p, [[0, 0], [0.22, 1], [0.82, 1], [1, 0.2]]),
  dim: track(p, [[0, 0.05], [0.2, 0.2], [0.85, 0.2], [1, 0.08]]),
});

const couplePose = (p) => ({
  pan: track(p, [[0, 0], [0.12, 0], [0.22, -1], [0.42, -1], [0.5, 0], [0.58, 0], [0.68, 1], [0.88, 1], [1, 0]]),
  push: track(p, [[0, 0], [0.5, 0.1], [1, 0]]),
  lift: 0.04,
  dim: 0.2,
});

const eventsPose = (p) => ({
  push: track(p, [[0, 0], [0.27, 1], [1, 1]]),
  dim: track(p, [[0, 0.1], [0.24, 0.14], [0.34, 0.45], [1, 0.45]]),
});

const closingPose = (night) => (p) => ({
  dusk: track(p, [[0, 0.35 * night], [0.4, night], [1, night]]),
  lift: track(p, [[0, 0.35], [0.4, 0.12], [1, 0.12]]),
  dim: track(p, [[0, 0.5], [0.35, 0.14], [1, 0.14]]),
});

const DOOR_END = 0.34;

export function makeJourney(config) {
  const { tone, asset, accent, crown, lantern, portal, light = false, night = 1, storyCard = "top" } = config;
  // ukuran bingkai foto mempelai di papan nama (bawaan kecil: w-[42%]); huruf inisial ikut membesar
  const photo = { className: "w-[42%]", initial: "text-[58px]", ...config.photo };
  const copy = { ...DEFAULT_COPY, ...config.copy };
  // tone terang: kabut pembaca terang, tombol garis & jejak berwarna tinta cokelat
  const haze = light
    ? "bg-[radial-gradient(70%_55%_at_50%_45%,rgba(255,250,240,0.8),rgba(255,248,236,0.35)_60%,transparent)]"
    : "bg-[radial-gradient(70%_55%_at_50%_45%,rgba(40,18,10,0.55),rgba(40,18,10,0.2)_60%,transparent)]";
  const outline = light
    ? "border-[#9A7244]/50 text-[#6B4A2C] hover:bg-[#9A7244]/10"
    : "border-[#F2C25E]/45 text-[#FFE3A6] hover:bg-[#F2C25E]/10";
  const trailOff = light ? "bg-[#6B4A2C]/25" : "bg-[#FFF4E0]/30";
  const crownEl = (cls) =>
    crown.node ? (
      <div className={`relative z-10 mx-auto ${cls}`}>{crown.node}</div>
    ) : (
      <img src={`${asset}/${crown.src}.webp`} alt="" aria-hidden="true" draggable={false} className={`relative z-10 mx-auto block select-none drop-shadow-[0_6px_10px_rgba(20,10,0,0.5)] ${cls}`} />
    );

  // garis emas kecil dengan strip aksen adat di tengah
  function Divider({ style, className = "" }) {
    return (
      <motion.div style={style} className={`mx-auto flex items-center justify-center gap-2 ${className}`}>
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#F2C25E]/70" />
        <span className={`h-1.5 w-8 rounded-full ${accent}`} />
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#F2C25E]/70" />
      </motion.div>
    );
  }

  /* ============================================================
     1. SALAM — langit
     ============================================================ */

  function Word({ p, from, children }) {
    const opacity = useTransform(p, [from, from + 0.05], [0.12, 1]);
    const y = useTransform(p, [from, from + 0.05], [8, 0]);
    return (
      <motion.span className="inline-block" style={{ opacity, y }}>
        {children}&nbsp;
      </motion.span>
    );
  }

  function SalamChapter({ quote }) {
    const [sparks, fire] = useSparks();
    const words = quote.text.split(" ");
    return (
      <Chapter id="salam" vh={260} pose={salamPose}>
        {(p) => <SalamStage p={p} words={words} quote={quote} sparks={sparks} fire={fire} />}
      </Chapter>
    );
  }

  function SalamStage({ p, words, quote, sparks, fire }) {
    const kicker = useTransform(p, (v) => windowed(v, 0.1, 0.2, 0.88, 0.97));
    const body = useTransform(p, (v) => 1 - smooth(seg(v, 0.88, 0.97)));
    const source = useTransform(p, (v) => windowed(v, 0.7, 0.78, 0.88, 0.97));
    const hazeO = useTransform(p, (v) => windowed(v, 0.12, 0.24, 0.85, 0.97));
    return (
      <>
        {/* kabut lembut di belakang tulisan agar terbaca di atas langit */}
        <motion.div className={`absolute inset-x-0 top-[8%] h-[58%] ${haze}`} style={{ opacity: hazeO }} />
        <motion.div className="pointer-events-auto absolute inset-x-0 top-[13%] cursor-pointer px-8 text-center" style={{ opacity: body }} onClick={(e) => fire(e)}>
          <motion.p style={{ opacity: kicker }} className={`${FONTS.caps} text-[9px] leading-relaxed tracking-[0.32em] ${tone.kicker}`}>
            {copy.salam[0]}
            <br />
            {copy.salam[1]}
          </motion.p>
          <Divider style={{ opacity: kicker }} className="mt-4" />
          <p className={`mt-5 ${FONTS.body} text-[21px] italic leading-relaxed ${tone.body}`}>
            “
            {words.map((w, i) => (
              <Word key={i} p={p} from={0.2 + (i / words.length) * 0.46}>
                {w}
              </Word>
            ))}
            ”
          </p>
          <motion.p style={{ opacity: source }} className={`mt-5 ${FONTS.caps} text-[10px] tracking-[0.35em] ${tone.kicker}`}>
            — {quote.source.toUpperCase()} —
          </motion.p>
        </motion.div>
        <motion.p style={{ opacity: source }} className={`absolute inset-x-0 bottom-[14%] text-center ${FONTS.caps} text-[9px] tracking-[0.35em] ${tone.hint}`}>
          SENTUH KATA-KATANYA ✦
        </motion.p>
        {sparks}
      </>
    );
  }

  /* ============================================================
     2. MEMPELAI — papan nama tergantung di bawah ornamen
     ============================================================ */

  /* Papan nama = benda dekat kamera di dunia: posisinya terikat pada arah pandang kamera
     (anchor -1 = kiri, 1 = kanan), bergerak lebih cepat dari latar (parallax), berayun
     karena gerak kamera, kemiringan HP & sentuhan. */
  function Plaque({ person, role, anchor, onTap }) {
    const vw = useViewWidth();
    const time = useTime();
    const vel = useVelocity(CAM.pan);
    const kick = useMotionValue(0);
    const x = useTransform(CAM.pan, (p) => (anchor - p) * 1.25 * vw);
    const rotate = useTransform([vel, time, tiltX, kick], ([v, t, tx, k]) => {
      const swing = Math.max(-14, Math.min(14, -v * 9));
      return swing + Math.sin((t / 1000) * 1.25 + anchor) * 1.4 + tx * 3 + k;
    });
    const tap = (e) => {
      animate(kick, [0, 11, -8, 5, -2.5, 0], { duration: 1.8, ease: "easeOut" });
      onTap(e);
    };
    const initial = person.nickname?.[0] ?? "";
    return (
      <motion.div className="absolute inset-x-0 top-0 flex justify-center" style={{ x }}>
        <motion.div className="relative mt-[9svh] w-[78%] max-w-[330px]" style={{ rotate, transformOrigin: "50% -9svh" }}>
          {/* tali gantungan */}
          <span className="absolute bottom-full left-[22%] h-[12svh] w-px bg-gradient-to-b from-transparent to-[#F2C25E]/80" />
          <span className="absolute bottom-full right-[22%] h-[12svh] w-px bg-gradient-to-b from-transparent to-[#F2C25E]/80" />
          <div className="pointer-events-auto cursor-pointer" onClick={tap}>
            {crownEl(crown.className)}
            <div className={`relative rounded-[20px] border px-5 pb-5 pt-6 text-center backdrop-blur-md ${tone.panel}`}>
              <span className={`absolute inset-x-6 top-0 h-1 rounded-b-full ${accent}`} />
              <div className={`relative mx-auto ${photo.className} overflow-hidden rounded-t-full border border-[#F2C25E]/50 bg-[radial-gradient(80%_70%_at_50%_30%,rgba(242,194,94,0.35),rgba(46,22,14,0.9))]`}>
                {person.photo ? (
                  <img src={person.photo} alt={person.fullName} className="aspect-[4/5] w-full object-cover" />
                ) : (
                  <div className={`grid aspect-[4/5] w-full place-items-center ${FONTS.script} ${photo.initial} leading-none ${tone.title}`}>{initial}</div>
                )}
              </div>
              <p className={`mt-4 ${FONTS.caps} text-[9px] tracking-[0.38em] ${tone.kicker}`}>{role}</p>
              <h3 className={`mt-1.5 ${FONTS.body} text-[25px] font-medium leading-tight ${tone.title}`}>{person.fullName}</h3>
              <p className={`mx-auto mt-2 max-w-[250px] ${FONTS.body} text-[14px] italic leading-snug opacity-80`}>{person.parents}</p>
              {person.instagram && (
                <a
                  href={`https://instagram.com/${person.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] transition ${outline}`}
                >
                  <Instagram className="h-3.5 w-3.5" /> @{person.instagram}
                </a>
              )}
            </div>
            {/* jumbai emas di bawah papan */}
            <div className="flex justify-center gap-[30%]">
              {[0, 1].map((i) => (
                <motion.span
                  key={i}
                  className="block h-6 w-[3px] rounded-b-full bg-gradient-to-b from-[#F2C25E] to-[#B87A24]"
                  animate={{ rotate: [-6, 6, -6] }}
                  transition={{ duration: 2.4 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformOrigin: "50% 0%" }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  function CoupleChapter({ data }) {
    const [sparks, fire] = useSparks();
    return (
      <Chapter id="mempelai" vh={420} pose={couplePose}>
        {(p) => <CoupleStage p={p} data={data} sparks={sparks} fire={fire} />}
      </Chapter>
    );
  }

  function CoupleStage({ p, data, sparks, fire }) {
    const intro = useTransform(p, (v) => windowed(v, 0.0, 0.05, 0.12, 0.17));
    const introY = useTransform(p, [0.12, 0.17], [0, -30]);
    const amp = useTransform(p, (v) => windowed(v, 0.44, 0.5, 0.56, 0.61));
    const ampScale = useTransform(p, [0.44, 0.52], [0.7, 1]);
    return (
      <>
        <motion.div style={{ opacity: intro, y: introY }} className="absolute inset-x-0 top-[15%] px-9 text-center">
          <p className={`${FONTS.caps} text-[9px] tracking-[0.36em] ${tone.kicker}`}>{copy.coupleKicker}</p>
          <p className={`mt-4 ${FONTS.body} text-[19px] italic leading-relaxed ${tone.body}`}>{copy.coupleIntro}</p>
          <p className={`mt-6 ${FONTS.caps} text-[9px] tracking-[0.35em] ${tone.hint}`}>GULIR — KAMERA AKAN MENOLEH ✦</p>
        </motion.div>
        <Plaque person={data.groom} role="MEMPELAI PRIA" anchor={-1} onTap={fire} />
        <Plaque person={data.bride} role="MEMPELAI WANITA" anchor={1} onTap={fire} />
        {/* melintas di depan bangunan utama */}
        <motion.div style={{ opacity: amp, scale: ampScale }} className="absolute inset-x-0 top-[17%] text-center">
          <p className={`${FONTS.script} text-[110px] leading-none ${tone.title}`}>&amp;</p>
          <p className={`mt-1 ${FONTS.caps} text-[10px] tracking-[0.4em] ${tone.kicker}`}>{copy.ampTag}</p>
        </motion.div>
        {sparks}
      </>
    );
  }

  /* ============================================================
     3. KISAH — lentera kenangan di sepanjang jalan
     ============================================================ */

  function StoryChapter({ story }) {
    const n = story.length;
    // berjalan maju, sedikit melenggang kiri-kanan
    const pose = (p) => ({ push: p * 0.42, pan: Math.sin(p * Math.PI * n) * 0.16, dim: 0.16 });
    const [sparks, fire] = useSparks();
    return (
      <Chapter id="story" vh={130 + n * 85} pose={pose}>
        {(p) => <StoryStage p={p} story={story} sparks={sparks} fire={fire} />}
      </Chapter>
    );
  }

  function StoryStage({ p, story, sparks, fire }) {
    const n = story.length;
    // posisi kamera di sepanjang jalan: kenangan ke-i "di sini" saat walk = i
    const walk = useTransform(p, (v) => -0.6 + seg(v, 0.06, 0.96) * (n - 1 + 1.2));
    const head = useTransform(p, (v) => windowed(v, 0, 0.03, 0.06, 0.11));
    const [active, setActive] = useState(-1);
    useMotionValueEvent(walk, "change", (w) => setActive(Math.max(-1, Math.min(n - 1, Math.round(w)))));
    return (
      <>
        <motion.div style={{ opacity: head }} className="absolute inset-x-0 top-[15%] px-8 text-center">
          <p className={`${FONTS.caps} text-[10px] tracking-[0.4em] ${tone.kicker}`}>{copy.storyKicker}</p>
          <h2 className={`mt-2 ${FONTS.script} text-[52px] leading-none ${tone.title}`}>{copy.storyTitle}</h2>
          <p className={`mt-3 ${FONTS.body} text-[16px] italic ${tone.body}`}>{copy.storySub}</p>
        </motion.div>
        {story.map((s, i) => (
          <Milestone key={i} s={s} i={i} walk={walk} onTap={fire} />
        ))}
        {/* jejak langkah: posisi di perjalanan */}
        <div className="absolute inset-x-0 bottom-[12%] flex items-center justify-center gap-2">
          {story.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? `w-7 ${accent}` : i < active ? "w-1.5 bg-[#F2C25E]" : `w-1.5 ${trailOff}`}`}
            />
          ))}
        </div>
        {sparks}
      </>
    );
  }

  /* proyeksi sederhana: jarak D (dalam satuan kenangan) → skala & posisi di jalan */
  function Milestone({ s, i, walk, onTap }) {
    const side = i % 2 ? 1 : -1;
    const [flare, setFlare] = useState(0);
    const D = useTransform(walk, (w) => i - w);
    const scale = useTransform(D, (d) => 1 / (1 + Math.max(-0.5, d) * 1.1));
    const left = useTransform(scale, (k) => `${50 + side * (6 + 36 * k)}%`);
    const bottom = useTransform(scale, (k) => `${42 - 34 * Math.min(1.25, k)}%`);
    const height = useTransform(scale, (k) => `${10 + 15 * k}svh`);
    const opacity = useTransform(D, (d) => Math.min(smooth(seg(-d, -2.4, -1.7)), 1 - smooth(seg(-d, 0.32, 0.6))));
    const lit = useTransform(D, (d) => 1 - smooth(seg(d, 0.25, 1.3)));
    const card = useTransform(D, (d) => 1 - smooth(seg(Math.abs(d), 0.26, 0.5)));
    const cardY = useTransform(D, (d) => d * 46);
    const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
    const cardVis = useTransform(card, (o) => (o < 0.02 ? "hidden" : "visible"));
    const tap = (e) => {
      setFlare((f) => f + 1);
      onTap(e, 16);
    };
    return (
      <>
        {/* lentera di sisi jalan */}
        {lantern && (
        <motion.div className="absolute" style={{ left, bottom, height, opacity, visibility, x: "-50%" }}>
          <motion.div
            className={`pointer-events-none absolute left-1/2 aspect-square w-[260%] rounded-full bg-[radial-gradient(closest-side,rgba(255,222,140,0.8),rgba(255,160,60,0.28)_42%,transparent)] ${lantern.glow}`}
            style={{ x: "-50%", y: "-50%", opacity: lit }}
          />
          {flare > 0 && (
            <motion.div
              key={flare}
              className={`pointer-events-none absolute left-1/2 aspect-square w-[420%] rounded-full bg-[radial-gradient(closest-side,rgba(255,240,190,0.95),rgba(255,170,70,0.4)_45%,transparent)] ${lantern.glow}`}
              style={{ x: "-50%", y: "-50%" }}
              initial={{ opacity: 1, scale: 0.5 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 1.3, ease: "easeOut" }}
            />
          )}
          <img
            src={`${asset}/${side > 0 && lantern.srcRight ? lantern.srcRight : lantern.src}.webp`}
            alt=""
            aria-hidden="true"
            draggable={false}
            onClick={tap}
            className="pointer-events-auto relative h-full w-auto max-w-none cursor-pointer select-none drop-shadow-[0_10px_14px_rgba(20,10,0,0.45)]"
            style={side > 0 && lantern.mirror !== false ? { transform: "scaleX(-1)" } : undefined}
          />
        </motion.div>
        )}
        {/* kenangan yang sedang didekati */}
        <motion.div className={`absolute inset-x-0 flex justify-center px-7 ${storyCard === "center" ? "inset-y-0 items-center" : "top-[14%]"}`} style={{ opacity: card, y: cardY, visibility: cardVis }}>
          <div onClick={tap} className={`pointer-events-auto relative w-full max-w-[330px] cursor-pointer rounded-[22px] border px-6 pb-6 pt-7 text-center backdrop-blur-md ${tone.panel}`}>
            <span className={`absolute inset-x-8 top-0 h-1 rounded-b-full ${accent}`} />
            <p className={`${FONTS.caps} text-[11px] tracking-[0.45em] ${tone.kicker}`}>{s.year}</p>
            <h3 className={`mt-2 ${FONTS.body} text-[30px] font-medium italic leading-tight ${tone.title}`}>{s.title}</h3>
            <p className={`mt-3 ${FONTS.body} text-[16px] leading-relaxed opacity-85`}>{s.text}</p>
          </div>
        </motion.div>
      </>
    );
  }

  /* ============================================================
     4. ACARA — masuk pintu bangunan utama, gerbang dibangun
     ============================================================ */

  function EventsChapter({ data }) {
    const n = data.events.length;
    const [sparks, fire] = useSparks();
    return (
      <Chapter id="acara" vh={150 + n * 110} pose={eventsPose}>
        {(p) => <EventsStage p={p} data={data} sparks={sparks} fire={fire} />}
      </Chapter>
    );
  }

  function EventsStage({ p, data, sparks, fire }) {
    const n = data.events.length;
    const head = useTransform(p, (v) => windowed(v, 0, 0.04, 0.12, 0.18));
    // cahaya dari balik pintu, lalu silau saat melangkah masuk
    const doorScale = useTransform(p, [0.08, 0.3], [0.2, 3.2]);
    const doorGlow = useTransform(p, (v) => windowed(v, 0.08, 0.2, 0.32, 0.42) * 0.9);
    const flash = useTransform(p, (v) => windowed(v, 0.25, 0.31, 0.33, 0.42));
    const [phase, setPhase] = useState(-1);
    useMotionValueEvent(p, "change", (v) => setPhase(v < DOOR_END ? -1 : Math.min(n - 1, Math.floor((v - DOOR_END) / ((1 - DOOR_END) / n)))));
    const couple = `${data.groom.nickname} & ${data.bride.nickname}`;
    return (
      <>
        <motion.div style={{ opacity: head }} className="absolute inset-x-0 top-[13%] px-8 text-center">
          <p className={`${FONTS.caps} text-[10px] tracking-[0.4em] ${tone.kicker}`}>SAVE THE DATE</p>
          <h2 className={`mt-2 ${FONTS.script} text-[54px] leading-none ${tone.title}`}>{copy.eventsTitle}</h2>
          <p className={`mt-3 ${FONTS.body} text-[16px] italic ${tone.body}`}>{copy.eventsSub}</p>
        </motion.div>
        <motion.div
          className="absolute left-1/2 top-[56%] aspect-square w-[70%] rounded-full bg-[radial-gradient(closest-side,rgba(255,240,200,0.95),rgba(255,200,110,0.5)_40%,transparent)]"
          style={{ x: "-50%", y: "-50%", scale: doorScale, opacity: doorGlow }}
        />
        <motion.div className="absolute inset-0 bg-[#FFF1D0]" style={{ opacity: flash }} />
        <AnimatePresence mode="wait">
          {phase >= 0 && <Portal key={phase} ev={data.events[phase]} index={phase} total={n} couple={couple} onTap={fire} />}
        </AnimatePresence>
        {phase >= 0 && phase < n - 1 && (
          <p className={`absolute inset-x-0 bottom-[12%] text-center ${FONTS.caps} text-[9px] tracking-[0.35em] ${tone.hint}`}>GULIR UNTUK ACARA BERIKUTNYA ✦</p>
        )}
        {sparks}
      </>
    );
  }

  /* gerbang: sisi naik dari tanah, mahkota turun, isi muncul; miring mengikuti HP */
  function Portal({ ev, index, total, couple, onTap }) {
    const rotateY = useTransform(tiltX, (v) => v * 9);
    const rotateX = useTransform(tiltY, (v) => -v * 6);
    const d = new Date(ev.start);
    const day = d.toLocaleDateString("id-ID", { weekday: "long", timeZone: TZ });
    const date = d.toLocaleDateString("id-ID", { day: "2-digit", timeZone: TZ });
    const monthYear = d.toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: TZ });
    const { side, base } = portal;
    return (
      <motion.div
        className="absolute inset-x-0 top-[7%] flex justify-center px-[9%] [perspective:900px]"
        exit={{ opacity: 0, y: -40, scale: 0.95, transition: { duration: 0.45, ease: "easeIn" } }}
      >
        <motion.div className="relative w-full max-w-[340px]" style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
          {/* mahkota turun */}
          <motion.div
            onClick={(e) => onTap(e, 18)}
            className={`pointer-events-auto relative z-20 mx-auto cursor-pointer select-none ${portal.crown.className}`}
            initial={{ y: -120, opacity: 0, rotate: -8 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 11, delay: 0.5 }}
          >
            {portal.crown.node ?? (
              <img src={`${asset}/${portal.crown.src}.webp`} alt="" aria-hidden="true" draggable={false} className="block w-full drop-shadow-[0_8px_12px_rgba(20,10,0,0.5)]" />
            )}
          </motion.div>
          {/* sisi gerbang naik */}
          {[-1, 1].map((s) => (
            <motion.img
              key={s}
              src={`${asset}/${s > 0 && side.srcRight ? side.srcRight : side.src}.webp`}
              alt=""
              aria-hidden="true"
              draggable={false}
              className={`absolute z-10 select-none drop-shadow-[0_8px_10px_rgba(20,10,0,0.45)] ${side.className} ${s < 0 ? side.left : side.right}`}
              style={{ transformOrigin: "50% 100%", scaleX: s > 0 && side.mirror ? -1 : 1 }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease, delay: 0.1 }}
            />
          ))}
          {/* alas (undakan) */}
          {base && (
            <motion.img
              src={`${asset}/${base.src}.webp`}
              alt=""
              aria-hidden="true"
              draggable={false}
              className={`absolute z-[5] select-none ${base.className}`}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease, delay: 0.05 }}
            />
          )}
          {/* panel lengkung */}
          <motion.div
            className={`relative mx-[8%] rounded-b-[22px] rounded-t-[120px] border px-5 pb-6 pt-10 text-center backdrop-blur-md ${tone.panel}`}
            initial={{ opacity: 0, scaleY: 0.6 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.6, ease, delay: 0.3 }}
            style={{ transformOrigin: "50% 100%" }}
          >
            <span className={`absolute inset-x-10 bottom-0 h-1 rounded-t-full ${accent}`} />
            <motion.div initial="h" animate="v" variants={{ v: { transition: { staggerChildren: 0.08, delayChildren: 0.8 } } }}>
              {[
                <p key="n" className={`${FONTS.caps} text-[10px] tracking-[0.4em] ${tone.kicker}`}>
                  {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </p>,
                <h3 key="t" className={`mt-1 ${FONTS.body} text-[32px] font-medium italic leading-tight ${tone.title}`}>{ev.title}</h3>,
                <div key="d" className="mt-4 flex items-center justify-center gap-3">
                  <p className={`w-[34%] text-right ${FONTS.caps} text-[9px] tracking-[0.2em] opacity-75`}>{day.toUpperCase()}</p>
                  <p className={`border-x border-[#F2C25E]/40 px-3 ${FONTS.body} text-[46px] font-medium leading-none ${tone.title}`}>{date}</p>
                  <p className={`w-[34%] text-left ${FONTS.caps} text-[9px] tracking-[0.2em] opacity-75`}>{monthYear.toUpperCase()}</p>
                </div>,
                <p key="w" className="mt-4 inline-flex items-center gap-1.5 text-[13px] opacity-85">
                  <Clock className="h-3.5 w-3.5 text-[#F2C25E]" /> {fmtTime(ev.start)} – {fmtTime(ev.end)} WIB
                </p>,
                <div key="v" className="mx-auto mt-3 max-w-[260px]">
                  <p className={`inline-flex items-center gap-1.5 ${FONTS.body} text-[19px] font-semibold`}>
                    <MapPin className="h-4 w-4 text-[#F2C25E]" /> {ev.venue}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed opacity-65">{ev.address}</p>
                </div>,
                <div key="b" className="pointer-events-auto mt-5 grid gap-2">
                  <a
                    href={gcalLink(ev, couple)}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-semibold transition ${outline}`}
                  >
                    <CalendarPlus className="h-4 w-4" /> Simpan ke Kalender
                  </a>
                  <a href={ev.mapsUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold ${tone.button}`}>
                    <MapPin className="h-4 w-4" /> Petunjuk Arah
                  </a>
                </div>,
              ].map((el, i) => (
                <motion.div key={i} variants={{ h: { opacity: 0, y: 12 }, v: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}>
                  {el}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  /* ============================================================
     5. PENUTUP — malam turun, terbangkan cahaya doa
     ============================================================ */

  function Closing({ data }) {
    return (
      <Chapter id="penutup" vh={220} pose={closingPose(night)}>
        {(p) => <ClosingStage p={p} data={data} />}
      </Chapter>
    );
  }

  function ClosingStage({ p, data }) {
    const [lights, setLights] = useState([]);
    const seq = useRef(0);
    const text = useTransform(p, (v) => smooth(seg(v, 0.3, 0.45)));
    const textY = useTransform(p, [0.3, 0.45], [24, 0]);
    const release = (x, y, count) => {
      const batch = Array.from({ length: count }, (_, i) => {
        const id = ++seq.current;
        return { id, x: x + ((i * 47) % 120) - 60, y, dx: ((i * 29) % 80) - 40, dur: 6 + (i % 4), size: 7 + (i % 3) * 3, delay: i * 0.12 };
      });
      setLights((l) => [...l, ...batch].slice(-60));
      const ids = new Set(batch.map((b) => b.id));
      setTimeout(() => setLights((l) => l.filter((v) => !ids.has(v.id))), 11000);
    };
    const tapSky = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      release(e.clientX - r.left, e.clientY - r.top, 3);
    };
    const sendPrayer = (e) => {
      e.stopPropagation();
      const r = e.currentTarget.closest("[data-chapter-stage]").getBoundingClientRect();
      release(r.width / 2, r.height * 0.82, 14);
    };
    return (
      <div className="pointer-events-auto absolute inset-0 cursor-pointer" onClick={tapSky}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
          {lights.map((l) => (
            <motion.span
              key={l.id}
              className="absolute rounded-full bg-[radial-gradient(circle,#FFF6D8,#FFC860_55%,rgba(255,170,60,0))] shadow-[0_0_16px_6px_rgba(255,190,90,0.55)]"
              style={{ left: l.x, top: l.y, width: l.size, height: l.size }}
              initial={{ y: 0, x: 0, opacity: 0 }}
              animate={{ y: "-95svh", x: [0, l.dx, -l.dx / 2, l.dx / 3], opacity: [0, 1, 1, 0] }}
              transition={{ duration: l.dur, delay: l.delay, ease: "easeOut" }}
            />
          ))}
        </div>
        {/* kabut gelap lembut di belakang tulisan agar terbaca di depan langit terang */}
        <motion.div className={`pointer-events-none absolute inset-x-0 top-[4%] h-[62%] ${haze}`} style={{ opacity: text }} />
        <motion.div style={{ opacity: text, y: textY }} className="absolute inset-x-0 top-[12%] px-8 text-center">
          <p className={`${FONTS.body} text-[17px] italic leading-relaxed ${tone.body}`}>
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir memberikan doa restu.
          </p>
          <p className={`mt-6 ${FONTS.caps} text-[10px] tracking-[0.4em] ${tone.kicker}`}>{copy.thanks}</p>
          <h2 className={`mt-3 ${FONTS.script} text-[56px] leading-none ${tone.title}`}>
            {data.groom.nickname} &amp; {data.bride.nickname}
          </h2>
          <Divider className="mt-5" />
          <button
            onClick={sendPrayer}
            className={`mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 ${FONTS.caps} text-[10px] font-semibold tracking-[0.25em] transition active:scale-95 ${tone.button}`}
          >
            {copy.prayer}
          </button>
          <p className={`mt-3 ${FONTS.caps} text-[8px] tracking-[0.3em] ${tone.hint}`}>ATAU SENTUH LANGIT MALAM</p>
        </motion.div>
        <motion.p style={{ opacity: text }} className={`absolute inset-x-0 bottom-[11%] text-center text-[10px] tracking-[0.3em] ${tone.hint}`}>
          MADE WITH ♥ BY MOMENLABS
        </motion.p>
      </div>
    );
  }

  /* ============================================================
     3b. ALBUM KENANGAN — Story Mode ala Instagram (fitur Premium)
     Foto kisah tampil satu per satu dalam kartu 9:16: tap kanan = lanjut,
     tap kiri = kembali, tahan = jeda, berganti otomatis tiap 5 detik.
     Foto perlahan membesar (Ken Burns); teks kenangan di bawahnya.
     ============================================================ */

  function StoryAlbum({ story, couple }) {
    const [index, setIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [seen, setSeen] = useState(false);
    const ref = useRef(null);
    const DURATION = 5000;
    const n = story.length;

    // baru berjalan saat kartu terlihat di layar
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.4 });
      io.observe(el);
      return () => io.disconnect();
    }, []);

    useEffect(() => {
      if (paused || !seen || !n) return;
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
    }, [index, paused, seen, n]);

    if (!n) return null;
    const go = (dir) => {
      setIndex((i) => (i + dir + n) % n);
      setProgress(0);
    };
    const s = story[index];
    const initials = couple
      .split("&")
      .map((w) => w.trim()[0] ?? "")
      .join("&");

    return (
      <section id="album" className="relative z-10 px-6 py-20">
        <div className="text-center">
          <p className={`${FONTS.caps} text-[10px] tracking-[0.4em] ${tone.kicker}`}>{copy.albumKicker}</p>
          <h2 className={`mt-2 ${FONTS.script} text-[48px] leading-none ${tone.title}`}>{copy.albumTitle}</h2>
          <Divider className="mt-4" />
        </div>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease }}
          className="mx-auto mt-8 max-w-[340px]"
        >
          <div
            className="relative aspect-[9/16] w-full cursor-pointer select-none overflow-hidden rounded-[28px] border border-[#F2C25E]/35 bg-black/40 shadow-[0_30px_60px_-20px_rgba(242,194,94,0.35)]"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              go(e.clientX - r.left < r.width * 0.33 ? -1 : 1);
            }}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerLeave={() => setPaused(false)}
          >
            {/* garis waktu tiap foto */}
            <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
              {story.map((_, i) => (
                <div key={i} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-[#F6D27A]" style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }} />
                </div>
              ))}
            </div>
            <div className="absolute inset-x-3 top-6 z-20 flex items-center gap-2">
              <span className={`grid h-7 w-7 place-items-center rounded-full border border-[#F2C25E]/60 bg-black/50 ${FONTS.caps} text-[9px] text-[#F6D27A]`}>{initials}</span>
              <span className="text-[11px] font-semibold text-white drop-shadow">{couple}</span>
              <span className="text-[10px] text-white/60">· {s.year}</span>
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
                  <motion.img
                    src={s.photo}
                    alt={s.title}
                    className="h-full w-full object-cover"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.1 }}
                    transition={{ duration: DURATION / 1000 + 1, ease: "linear" }}
                  />
                ) : (
                  <div className="relative h-full w-full bg-[radial-gradient(90%_60%_at_50%_30%,rgba(242,194,94,0.3),rgba(30,16,8,0.95)_70%)]">
                    <span className={`absolute left-1/2 top-[22%] -translate-x-1/2 ${FONTS.caps} text-[96px] leading-none text-[#F2C25E]/15`}>{s.year}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-center">
                  <span className={`mx-auto mb-3 block h-1 w-12 rounded-full ${accent}`} />
                  <p className={`${FONTS.caps} text-[11px] tracking-[0.4em] text-[#F6D27A]`}>{s.year}</p>
                  <h3 className={`mt-2 ${FONTS.body} text-[32px] font-medium italic leading-tight text-foil`}>{s.title}</h3>
                  <p className={`mt-3 ${FONTS.body} text-[16px] leading-relaxed text-white/85`}>{s.text}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className={`mt-4 text-center text-[11px] ${tone.hint}`}>Tap kanan/kiri untuk berpindah · tahan untuk jeda</p>
        </motion.div>
      </section>
    );
  }

  /* ---------- rangkaian bab ---------- */

  function Journey({ data, premium }) {
    return (
      <>
        <SalamChapter quote={data.quote} />
        <CoupleChapter data={data} />
        {premium && (
          <>
            <StoryChapter story={data.story} />
            <StoryAlbum story={data.story} couple={`${data.groom.nickname} & ${data.bride.nickname}`} />
          </>
        )}
        <EventsChapter data={data} />
      </>
    );
  }

  return { Journey, Closing };
}
