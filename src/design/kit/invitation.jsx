import React, { useEffect, useRef, useState } from "react";
import { motion, motionValue, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { FONTS, MOTION } from "../tokens.js";

/* ============================================================
   MOMENLABS KIT — UI UNDANGAN
   Potongan antarmuka yang sama di semua template berbasis adegan:
   judul cover, panel tamu, hero (nama + hitung mundur), latar tetap
   yang mengikuti scroll, dan dekorasi section. Gaya dari token tone.
   ============================================================ */

export function useCountdown(iso) {
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

const pad = (n) => String(n).padStart(2, "0");

/* ---------- cover ---------- */

/* kicker + nama + tanggal di atas cover; delay = jeda sebelum mulai muncul */
// position: kelas posisi vertikal blok judul (bawaan di atas; template bisa menaruhnya di tengah)
export function CoverTitle({ tone, t, leaving, delay = 0, position = "top-[5%]" }) {
  const [g, b] = t.names.split(" & ");
  return (
    <motion.div
      className={`pointer-events-none absolute inset-x-0 ${position} z-10 px-[10%] text-center`}
      animate={{ opacity: leaving ? 0 : 1, y: leaving ? -16 : 0 }}
      transition={{ duration: 0.45 }}
    >
      <motion.p
        initial={{ opacity: 0, letterSpacing: "0.1em" }}
        animate={{ opacity: 1, letterSpacing: "0.38em" }}
        transition={{ duration: 1.8, delay: delay + 0.5, ease: MOTION.ease }}
        className={`${FONTS.caps} text-[9px] uppercase ${tone.kicker}`}
      >
        {t.kicker}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.6, delay: delay + 0.8, ease: MOTION.ease }}
        className={`mt-2 whitespace-nowrap ${FONTS.script} text-[48px] leading-none ${tone.title}`}
      >
        {g} <span className={`${FONTS.body} text-2xl italic ${tone.amp}`}>&amp;</span> {b}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 1, delay: delay + 1.3 }}
        className={`mt-2 ${FONTS.caps} text-[10px] tracking-[0.3em] ${tone.body}`}
      >
        12 · 12 · 2026
      </motion.p>
    </motion.div>
  );
}

/* panel kaca berisi nama tamu & tombol buka undangan */
export function GuestPanel({ tone, guestName, leaving, onOpen, delay = 1.8 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: leaving ? 0 : 1, y: 0 }}
      transition={{ duration: leaving ? 0.3 : 1, delay: leaving ? 0 : delay, ease: MOTION.ease }}
      className={`absolute inset-x-[10%] bottom-[3%] z-10 rounded-[22px] border px-5 py-4 text-center backdrop-blur-md ${tone.panel}`}
    >
      <p className={`${FONTS.body} text-[13px] italic opacity-75`}>Kepada Yth. Bapak/Ibu/Saudara/i</p>
      <p className={`mt-0.5 truncate ${FONTS.body} text-xl font-semibold`}>{guestName || "Tamu Undangan"}</p>
      <button
        onClick={onOpen}
        className={`group relative mt-3 inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3 ${FONTS.caps} text-[11px] font-semibold tracking-[0.2em] transition active:scale-95 ${tone.button}`}
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        <span className="relative">BUKA UNDANGAN</span>
      </button>
    </motion.div>
  );
}

/* ---------- hero ---------- */

/* Hero 2 layar: nama & tanggal muncul (fade-up + blur → jelas) saat reveal naik ke 1,
   hitung mundur di bawah, petunjuk gulir; adegan latar dari makeBackdrop. */
export function makeHeroScene({ tone, kicker, reveal }) {
  return function HeroScene({ data }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
    const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 });
    const titleScroll = useTransform(smooth, [0, 0.55, 0.75], [1, 1, 0]);
    const titleOpacity = useTransform([titleScroll, reveal], ([a, b]) => a * b);
    const titleY = useTransform([smooth, reveal], ([p, v]) => `calc(${-30 * p}% + ${(1 - v) * 28}px)`);
    const titleBlur = useTransform(reveal, (v) => `blur(${(1 - v) * 10}px)`);
    const countOpacity = useTransform(reveal, [0.4, 1], [0, 1]);
    const countY = useTransform(reveal, (v) => (1 - v) * 24);
    const hintOpacity = useTransform([smooth, reveal], ([p, r]) => (1 - Math.min(1, p / 0.08)) * r);
    const first = data.events[0];
    const t = useCountdown(first.start);
    const date = new Date(first.start).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

    return (
      // hero tidak menangkap sentuhan agar adegan di belakangnya tetap interaktif
      <section ref={ref} className="pointer-events-none relative h-[200svh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <motion.div style={{ opacity: titleOpacity, y: titleY, filter: titleBlur }} className="absolute inset-x-0 top-[6%] z-10 px-8 text-center">
            <p className={`${FONTS.caps} text-[10px] tracking-[0.4em] ${tone.kicker}`}>{kicker}</p>
            <h1 className={`mt-3 ${FONTS.script} text-[54px] leading-none ${tone.title}`}>
              {data.groom.nickname} &amp; {data.bride.nickname}
            </h1>
            <p className={`mt-2 ${FONTS.body} text-lg italic ${tone.body}`}>{date}</p>
          </motion.div>
          <motion.div
            style={{ opacity: countOpacity, y: countY }}
            className={`absolute inset-x-6 bottom-[9%] z-10 grid grid-cols-4 gap-2 rounded-[22px] border p-3 backdrop-blur-md ${tone.panel}`}
          >
            {Object.entries(t).map(([k, v]) => (
              <div key={k} className="text-center">
                <p className={`${FONTS.body} text-3xl font-medium leading-none ${tone.count}`}>{pad(v)}</p>
                <p className={`mt-1 ${FONTS.caps} text-[8px] tracking-[0.25em] ${tone.countLabel}`}>{k.toUpperCase()}</p>
              </div>
            ))}
          </motion.div>
          <motion.p style={{ opacity: hintOpacity }} className={`absolute inset-x-0 bottom-[3%] z-10 text-center ${FONTS.caps} text-[9px] tracking-[0.35em] ${tone.hint}`}>
            GULIR UNTUK MASUK ✦
          </motion.p>
        </div>
      </section>
    );
  };
}

/* ---------- latar tetap ---------- */

/* Adegan menempel di belakang seluruh isi undangan. Kamera maju mengikuti scroll
   (cam = progres × travel, ditambah camBase bila ada); setelah hero, adegan diberi
   lapisan "wash" tone agar teks section terbaca. after = lapisan di atas wash. */
const ZERO = motionValue(0);

export function makeBackdrop({ tone, travel = 1.3, renderScene, camBase = ZERO, after = null }) {
  return function Backdrop() {
    const reduce = useReducedMotion();
    const { scrollY } = useScroll();
    const maxScroll = useMotionValue(10000);
    const vh = useMotionValue(800);
    useEffect(() => {
      const update = () => {
        vh.set(window.innerHeight);
        maxScroll.set(Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
      };
      update();
      window.addEventListener("resize", update);
      const id = setInterval(update, 1200);
      return () => {
        window.removeEventListener("resize", update);
        clearInterval(id);
      };
    }, [maxScroll, vh]);
    const progress = useTransform([scrollY, maxScroll], ([y, m]) => Math.min(1, y / m));
    const smooth = useSpring(progress, { stiffness: 80, damping: 26, mass: 0.4 });
    const cam = useTransform([smooth, camBase], ([p, base]) => base + (reduce ? 0 : p * travel));
    const wash = useTransform([scrollY, vh], ([y, h]) => Math.min(tone.washMax, Math.max(0, (y - h * 1.2) / h) * tone.washMax));
    return (
      <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden" aria-hidden="true">
        {renderScene({ cam, progress: smooth })}
        <motion.div style={{ opacity: wash }} className={`absolute inset-0 ${tone.wash}`} />
        {after}
      </div>
    );
  };
}

/* ---------- section ---------- */

/* garis emas tipis di atas & cahaya lembut di belakang tiap section */
export function makeSectionDecor(tone) {
  return function SectionDecor() {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${tone.line}`} />
        <div
          className="absolute left-1/2 top-[18%] h-[50%] w-[120%] -translate-x-1/2 rounded-full"
          style={{ background: `radial-gradient(closest-side, ${tone.glow}, transparent)` }}
        />
      </div>
    );
  };
}
