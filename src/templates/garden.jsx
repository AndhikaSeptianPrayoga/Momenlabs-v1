import React, { useEffect, useRef, useState } from "react";
import { animate, motion, motionValue, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ParallaxLayer } from "./parallax.jsx";

/* ============================================================
   MOMENLABS — TEMPLATE "SECRET GARDEN"
   ------------------------------------------------------------
   Taman pernikahan ivory & blush. Gerakan utama: kamera maju pelan
   ke dalam adegan (dolly-in); lapisan depan membesar & bergeser
   lebih cepat dari gazebo di tengah, sehingga terasa ada kedalaman.
   Aset PNG transparan: scripts/cutout-sprites.cjs (assets-src/garden-dream).
   ============================================================ */

const BASE = "/templates/garden-dream";

/* satu "kamera" bersama untuk cover & hero: saat undangan dibuka, hero
   melanjutkan posisi kamera cover persis, jadi transisinya menyambung */
const sceneCam = motionValue(0);
// 0 → 1: teks hero (nama & countdown) muncul setelah kamera selesai masuk
const heroReveal = motionValue(1);
const CAM_ENTERED = 1.3; // posisi kamera setelah masuk (gerbang, lampu & bunga sudah dilewati)
const ease = [0.22, 1, 0.36, 1];

export function Asset({ name, className = "", style }) {
  return <img src={`${BASE}/${name}.png`} alt="" aria-hidden="true" draggable={false} className={`pointer-events-none select-none ${className}`} style={style} />;
}

/* ---------- elemen pendukung: langit, bukit, jalan, burung, kelopak ---------- */

function Sky() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#F8EFE6_0%,#FBF3EC_38%,#F6E6DF_60%,#EFE6D6_100%)]" />
      {[
        { l: "-10%", t: "6%", w: "70%", d: 60 },
        { l: "40%", t: "12%", w: "80%", d: 75 },
        { l: "5%", t: "22%", w: "60%", d: 90 },
      ].map((c, i) => (
        <motion.div
          key={i}
          className="absolute h-[9%] rounded-full bg-white/70 blur-2xl"
          style={{ left: c.l, top: c.t, width: c.w }}
          animate={{ x: ["0%", "12%", "0%"] }}
          transition={{ duration: c.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function Hills() {
  return (
    <svg viewBox="0 0 400 140" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
      <path d="M0 70 C 60 30, 110 50, 160 40 S 260 10, 320 35 S 380 50, 400 40 L400 140 L0 140Z" fill="#D9DDC8" opacity="0.7" />
      <path d="M0 90 C 70 60, 130 80, 200 66 S 320 55, 400 72 L400 140 L0 140Z" fill="#C6CEB2" opacity="0.8" />
      <path d="M0 110 C 80 92, 160 104, 240 96 S 360 92, 400 100 L400 140 L0 140Z" fill="#B3BE9C" />
    </svg>
  );
}

/* jalan setapak berperspektif menuju gazebo */
function Aisle() {
  return (
    <div className="h-full w-full" aria-hidden="true">
      <div
        className="h-full w-full"
        style={{
          clipPath: "polygon(43% 0, 57% 0, 100% 100%, 0 100%)",
          background:
            "repeating-linear-gradient(180deg, rgba(232,206,198,0.95) 0 6%, rgba(244,226,219,0.95) 6% 12%), linear-gradient(180deg,#F2DCD4,#E9CFC5)",
        }}
      />
      <div className="absolute inset-0" style={{ clipPath: "polygon(43% 0, 57% 0, 100% 100%, 0 100%)", background: "linear-gradient(180deg, rgba(250,245,238,0.85), transparent 45%)" }} />
    </div>
  );
}

function Birds({ className = "", delay = 0, duration = 18, size = 1 }) {
  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      initial={{ x: "-30vw", y: 0 }}
      animate={{ x: "130vw", y: [-10, 12, -6, 8] }}
      transition={{ duration, repeat: Infinity, delay, ease: "linear", y: { duration: duration / 2, repeat: Infinity, ease: "easeInOut" } }}
    >
      {[
        [0, 0],
        [22, 10],
        [10, 22],
        [40, 4],
      ].map(([x, y], i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 10"
          className="absolute"
          style={{ left: x * size, top: y * size, width: 18 * size }}
          animate={{ scaleY: [1, 0.4, 1] }}
          transition={{ duration: 0.6 + i * 0.07, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M1 8 Q 6 1 12 7 Q 18 1 23 8" fill="none" stroke="#6B5A4C" strokeWidth="1.6" strokeLinecap="round" />
        </motion.svg>
      ))}
    </motion.div>
  );
}

const PETALS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 29 + 7) % 100,
  size: 7 + (i % 4) * 2,
  dur: 10 + (i % 5) * 1.6,
  delay: (i * 0.85) % 10,
  sway: (i % 2 ? 1 : -1) * (24 + (i % 3) * 14),
  hue: ["#F3C9C2", "#EDB4B0", "#F8DDD3", "#FFFFFF"][i % 4],
}));

export function Petals({ fixed = false, count = 16 }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 z-20 overflow-hidden`}>
      {PETALS.slice(0, count).map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[60%_10%_60%_10%] shadow-sm"
          style={{ left: `${p.left}%`, top: -20, width: p.size, height: p.size * 0.8, background: p.hue, opacity: 0.85 }}
          animate={{ y: ["0vh", "110vh"], x: [0, p.sway, -p.sway / 2, p.sway / 3], rotate: [0, 180, 360] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "linear" }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   ADEGAN BERLAPIS — digerakkan oleh satu nilai "kamera" (0 → 1)
   depth  : 0 (jauh) … 1 (paling depan)
   side   : -1 kiri, 0 tengah, 1 kanan (arah geser saat kamera maju)
   ============================================================ */

function Layer({ cam, depth, side = 0, rise = 0, fadeFrom = 9, className = "", children }) {
  const scale = useTransform(cam, (c) => 1 + c * (0.06 + depth * 0.55) + Math.max(0, c - 0.6) ** 2 * depth * 0.9);
  // lapisan samping menyingkir makin cepat saat kamera melewatinya
  const x = useTransform(cam, (c) => `${side * depth * (c * 20 + c * c * 34)}%`);
  const y = useTransform(cam, (c) => `${c * rise + Math.max(0, c - 0.6) ** 2 * rise * 4}%`);
  const opacity = useTransform(cam, (c) => (c <= fadeFrom ? 1 : Math.max(0, 1 - (c - fadeFrom) * 3)));
  // pembungkus luar untuk posisi (boleh pakai translate Tailwind), dalam untuk gerak kamera
  return (
    <div className={`absolute ${className}`}>
      <motion.div style={{ scale, x, y, opacity, transformOrigin: "50% 60%" }}>{children}</motion.div>
    </div>
  );
}

function GardenScene({ cam, compactText = false }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Sky />
      <Birds className="left-0 top-[9%]" duration={22} size={0.9} />
      <Birds className="left-0 top-[17%]" duration={30} delay={7} size={0.6} />

      {/* jauh: bukit */}
      <Layer cam={cam} depth={0.05} className="inset-x-[-10%] top-[34%] h-[16%]">
        <Hills />
      </Layer>

      {/* jalan setapak */}
      <Layer cam={cam} depth={0.35} rise={4} className="inset-x-[-20%] bottom-0 top-[56%]">
        <Aisle />
      </Layer>

      {/* tengah: gazebo (tujuan kamera) */}
      <Layer cam={cam} depth={0.18} rise={-2} className="left-1/2 top-[27%] w-[50%] -translate-x-1/2">
        <Asset name="gazebo" className="w-full drop-shadow-[0_12px_20px_rgba(120,90,60,0.25)]" />
      </Layer>

      {/* air mancur di depan gazebo */}
      <Layer cam={cam} depth={0.3} rise={6} fadeFrom={1.2} className="left-1/2 top-[50%] w-[42%] -translate-x-1/2">
        <Asset name="fountain" className="w-full" />
      </Layer>

      {/* lampu taman & guci di sisi jalan */}
      <Layer cam={cam} depth={0.42} side={-1} fadeFrom={1.05} className="left-[12%] top-[40%] w-[12%]">
        <Asset name="lampPost" className="w-full" />
      </Layer>
      <Layer cam={cam} depth={0.42} side={1} fadeFrom={1.05} className="right-[12%] top-[40%] w-[12%]">
        <Asset name="lampPost" className="w-full -scale-x-100" />
      </Layer>
      <Layer cam={cam} depth={0.55} side={-1} rise={3} fadeFrom={0.95} className="left-[2%] top-[56%] w-[24%]">
        <Asset name="urnMid" className="w-full" />
      </Layer>
      <Layer cam={cam} depth={0.55} side={1} rise={3} fadeFrom={0.95} className="right-[2%] top-[56%] w-[24%]">
        <Asset name="urnTop" className="w-full -scale-x-100" />
      </Layer>

      {/* depan: gerbang tanaman di kiri-kanan */}
      <Layer cam={cam} depth={0.85} side={-1} fadeFrom={0.85} className="-left-[8%] top-[18%] w-[36%]">
        <Asset name="stoneArch" className="w-full" />
      </Layer>
      <Layer cam={cam} depth={0.85} side={1} fadeFrom={0.85} className="-right-[8%] top-[18%] w-[36%]">
        <Asset name="stoneArch" className="w-full -scale-x-100" />
      </Layer>

      {/* rangkaian bunga tergantung di atas */}
      <Layer cam={cam} depth={0.95} side={-1} rise={-6} fadeFrom={0.8} className="-left-[6%] -top-[3%] w-[40%]">
        <motion.div animate={{ rotate: [0, 2, -1.5, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "50% 0%" }}>
          <Asset name="floralHang" className="w-full" />
        </motion.div>
      </Layer>
      <Layer cam={cam} depth={0.95} side={1} rise={-6} fadeFrom={0.8} className="-right-[6%] -top-[3%] w-[40%]">
        <motion.div animate={{ rotate: [0, -2, 1.5, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "50% 0%" }}>
          <Asset name="floralRibbon" className="w-full -scale-x-100" />
        </motion.div>
      </Layer>

      {/* paling depan: semak bunga bawah */}
      <Layer cam={cam} depth={1} side={-1} rise={5} fadeFrom={0.8} className="-bottom-[2%] -left-[18%] w-[70%]">
        <Asset name="floralSpray" className="w-full" />
      </Layer>
      <Layer cam={cam} depth={1} side={1} rise={5} fadeFrom={0.8} className="-bottom-[2%] -right-[18%] w-[70%]">
        <Asset name="floralSpray" className="w-full -scale-x-100" />
      </Layer>

      {/* kabut tipis agar teks terbaca */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 ${compactText ? "h-[30%]" : "h-[34%]"} bg-gradient-to-b from-[#FBF5EE]/90 via-[#FBF5EE]/50 to-transparent`} />
    </div>
  );
}

/* ---------- thumbnail katalog (statis, kamera sedikit maju) ---------- */

export function GardenThumb({ compact }) {
  const cam = useMotionValue(0.15);
  return <GardenScene cam={cam} compactText={compact} />;
}

/* ============================================================
   COVER: kamera maju pelan. Saat dibuka, hanya teks yang memudar;
   pemandangan diserahkan ke hero dengan posisi kamera yang sama.
   ============================================================ */

export function GardenCover({ t, guestName, onOpen }) {
  const [g, b] = t.names.split(" & ");
  const reduce = useReducedMotion();
  const cam = sceneCam;
  const [leaving, setLeaving] = useState(false);
  const drift = useRef(null);

  useEffect(() => {
    cam.set(0);
    heroReveal.set(0);
    if (reduce) {
      cam.set(0.3);
      return;
    }
    drift.current = animate(cam, 0.55, { duration: 11, ease: [0.25, 0.1, 0.25, 1] });
    return () => drift.current?.stop();
  }, [cam, reduce]);

  const open = () => {
    if (leaving) return;
    setLeaving(true);
    drift.current?.stop();
    // teks memudar dulu, lalu cover dilepas; hero di bawahnya identik
    // dan kamera langsung melanjutkan maju perlahan (tanpa jeda / lompatan)
    if (reduce) {
      cam.set(CAM_ENTERED);
      heroReveal.set(1);
      onOpen();
      return;
    }
    // kamera masuk: gerbang, bunga & lampu di kiri-kanan menyingkir dan hilang
    animate(cam, CAM_ENTERED, { duration: 2.6, ease: [0.55, 0.05, 0.25, 1] });
    animate(heroReveal, 1, { duration: 1.2, delay: 2.1, ease: [0.22, 1, 0.36, 1] });
    // cover dilepas setelah teks memudar; hero di bawahnya memakai kamera yang sama
    setTimeout(onOpen, 450);
  };

  return (
    <motion.div className="fixed inset-0 z-[100] flex justify-center overflow-hidden bg-[#FBF5EE]" exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <GardenScene cam={cam} />
        <Petals count={10} />

        {/* nama di langit */}
        <motion.div
          className="absolute inset-x-0 top-[7%] z-10 px-[14%] text-center"
          animate={{ opacity: leaving ? 0 : 1, y: leaving ? -20 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            animate={{ opacity: 1, letterSpacing: "0.35em" }}
            transition={{ duration: 1.8, delay: 0.6, ease }}
            className="font-cinzel text-[9px] uppercase"
            style={{ color: t.accent }}
          >
            {t.kicker}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.6, delay: 0.9, ease }}
            className="mt-2 whitespace-nowrap font-script text-[46px] leading-none"
            style={{ color: t.fg }}
          >
            {g} <span className="font-cormorant text-2xl italic" style={{ color: t.accent }}>&amp;</span> {b}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="mt-2 font-cinzel text-[10px] tracking-[0.3em]"
            style={{ color: t.fg }}
          >
            12 · 12 · 2026
          </motion.p>
        </motion.div>

        {/* tamu + tombol */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: leaving ? 0 : 1, y: 0 }}
          transition={{ duration: leaving ? 0.3 : 1, delay: leaving ? 0 : 1.8, ease }}
          className="absolute inset-x-[12%] bottom-[7%] z-10 rounded-[22px] border border-white/70 bg-[#FBF5EE]/75 px-5 py-4 text-center shadow-[0_20px_40px_-20px_rgba(120,90,60,0.5)] backdrop-blur-md"
          style={{ color: t.fg }}
        >
          <p className="font-cormorant text-[13px] italic opacity-70">Kepada Yth. Bapak/Ibu/Saudara/i</p>
          <p className="mt-0.5 truncate font-cormorant text-xl font-semibold">{guestName || "Tamu Undangan"}</p>
          <button
            onClick={open}
            className="group relative mt-3 inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3 font-cinzel text-[11px] font-semibold tracking-[0.2em] text-white shadow-[0_14px_30px_-12px_rgba(120,90,40,0.7)] transition active:scale-95"
            style={{ background: `linear-gradient(135deg, #D9BC85, ${t.accent} 50%, #8C6A36)` }}
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            <span className="relative">BUKA UNDANGAN</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HERO: adegan yang sama, kamera maju mengikuti scroll
   ============================================================ */

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

function HeroScene({ data }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 });
  const cam = useTransform([sceneCam, smooth], ([c, p]) => (reduce ? CAM_ENTERED : c + p * 0.55));

  const titleScroll = useTransform(smooth, [0, 0.55, 0.75], [1, 1, 0]);
  const titleOpacity = useTransform([titleScroll, heroReveal], ([a, b]) => a * b);
  const titleY = useTransform(smooth, [0, 1], ["0%", "-30%"]);
  const countOpacity = useTransform(heroReveal, [0.4, 1], [0, 1]);
  const hintOpacity = useTransform(smooth, [0, 0.08], [1, 0]);
  const first = data.events[0];
  const t = useCountdown(first.start);
  const date = new Date(first.start).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <section ref={ref} className="relative h-[230svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <GardenScene cam={cam} />
        <motion.div style={{ opacity: titleOpacity, y: titleY }} className="absolute inset-x-0 top-[8%] z-10 px-8 text-center">
          <p className="font-cinzel text-[10px] tracking-[0.4em] text-gold">WE ARE GETTING MARRIED</p>
          <h1 className="mt-3 font-script text-[54px] leading-none text-foil">
            {data.groom.nickname} &amp; {data.bride.nickname}
          </h1>
          <p className="mt-2 font-cormorant text-lg italic text-cream/80">{date}</p>
        </motion.div>
        <motion.div
          style={{ opacity: countOpacity }}
          className="absolute inset-x-6 bottom-[9%] z-10 grid grid-cols-4 gap-2 rounded-[22px] border border-white/70 bg-[#FBF5EE]/75 p-3 backdrop-blur-md"
        >
          {Object.entries(t).map(([k, v]) => (
            <div key={k} className="text-center">
              <p className="font-cormorant text-3xl font-medium leading-none text-foil">{pad(v)}</p>
              <p className="mt-1 font-cinzel text-[8px] tracking-[0.25em] text-cream/60">{k.toUpperCase()}</p>
            </div>
          ))}
        </motion.div>
        <motion.p
          style={{ opacity: hintOpacity }}
          className="absolute inset-x-0 bottom-[3%] z-10 text-center font-cinzel text-[9px] tracking-[0.35em] text-cream/60"
        >
          GULIR UNTUK MASUK ✦
        </motion.p>
      </div>
    </section>
  );
}

/* ============================================================
   DEKORASI SECTION
   ============================================================ */

const SECTION_DECOR = {
  default: [
    { name: "floralRibbon", cls: "-right-[8%] -top-[2%] w-[34%]", speed: 50, sway: true },
    { name: "candles", cls: "-left-[4%] bottom-[4%] w-[30%]", speed: 120 },
  ],
  mempelai: [
    { name: "floralHang", cls: "-left-[8%] -top-[2%] w-[36%]", speed: 50, sway: true },
    { name: "mirrorArch", cls: "-right-[4%] top-[34%] w-[18%] opacity-80", speed: 130 },
    { name: "urnBottom", cls: "-left-[6%] bottom-[2%] w-[30%]", speed: 110 },
  ],
  story: [
    { name: "pearls", cls: "left-[2%] top-0 w-[22%]", speed: 40, sway: true },
    { name: "pearls", cls: "right-[2%] top-0 w-[22%]", speed: 60, sway: true },
  ],
  acara: [
    { name: "chandelier", cls: "left-1/2 top-0 w-[30%] -translate-x-1/2", speed: 40, sway: true },
    { name: "lampPost", cls: "-left-[2%] bottom-[30%] w-[14%]", speed: 140 },
    { name: "chairs", cls: "-right-[8%] bottom-[2%] w-[38%]", speed: 110 },
  ],
  hadiah: [
    { name: "lanterns", cls: "-left-[2%] top-0 w-[24%]", speed: 50, sway: true },
    { name: "cake", cls: "right-[0%] bottom-[4%] w-[22%]", speed: 120 },
  ],
  rsvp: [
    { name: "welcome", cls: "-right-[6%] top-[4%] w-[34%] opacity-90", speed: 70 },
    { name: "floralSpray", cls: "-left-[20%] bottom-[2%] w-[60%]", speed: 130 },
  ],
  voice: [
    { name: "windowArch", cls: "-right-[4%] top-[8%] w-[22%] opacity-80", speed: 70 },
    { name: "sofa", cls: "-left-[10%] bottom-[2%] w-[48%]", speed: 120 },
  ],
};

function SectionDecor({ id }) {
  const items = SECTION_DECOR[id] ?? SECTION_DECOR.default;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {items.map((d, i) => (
        <ParallaxLayer key={i} speed={d.speed} className={`absolute ${d.cls}`}>
          {d.sway ? (
            <motion.div animate={{ rotate: [0, 2, -1.5, 0] }} transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "50% 0%" }}>
              <Asset name={d.name} className="w-full" />
            </motion.div>
          ) : (
            <Asset name={d.name} className="w-full" />
          )}
        </ParallaxLayer>
      ))}
    </div>
  );
}

function GlobalDecor() {
  return <Petals fixed count={12} />;
}

export const gardenDecor = { HeroScene, Section: SectionDecor, Global: GlobalDecor, skipOpening: true };
