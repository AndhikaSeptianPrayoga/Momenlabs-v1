import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

/* ============================================================
   MOMENLABS — SISTEM PARALLAX TEMPLATE
   ------------------------------------------------------------
   Level per paket:
   - "none"      : Basic   → tanpa parallax
   - "soft"      : Premium → parallax halus (ornamen & foto bergerak lembut)
   - "cinematic" : Luxury  → parallax sinematik (lebih dalam, zoom, debu emas,
                             sapuan cahaya, opening ala bioskop)
   ============================================================ */

export const ParallaxContext = createContext("soft");
export const useParallaxLevel = () => useContext(ParallaxContext);

const FACTOR = { none: 0, soft: 0.45, cinematic: 1 };
const ease = [0.22, 1, 0.36, 1];

export function levelFromPlan({ isPremium, isLuxury }) {
  if (isLuxury) return "cinematic";
  if (isPremium) return "soft";
  return "none";
}

/* faktor gerak, otomatis 0 jika pengguna memilih reduce motion */
export function useParallaxFactor() {
  const level = useParallaxLevel();
  const reduce = useReducedMotion();
  return reduce ? 0 : FACTOR[level] ?? 0;
}

/**
 * Lapisan dekoratif yang bergerak saat di-scroll.
 * speed  : jarak gerak (px) pada level cinematic; positif = lebih lambat dari konten.
 * rotate : derajat rotasi tambahan sepanjang scroll.
 * onlyCinematic : hanya tampil di Luxury.
 */
export function ParallaxLayer({ speed = 80, rotate = 0, onlyCinematic = false, className = "", innerClassName = "", children }) {
  const ref = useRef(null);
  const level = useParallaxLevel();
  const f = useParallaxFactor();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * f, -speed * f]);
  const r = useTransform(scrollYProgress, [0, 1], [-rotate * f, rotate * f]);
  if (onlyCinematic && level !== "cinematic") return null;
  return (
    <div ref={ref} className={`pointer-events-none ${className}`} aria-hidden="true">
      <motion.div style={{ y, rotate: r }} className={innerClassName}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Efek kedalaman untuk hero: foto melambat & membesar, teks naik & memudar.
 * Mengembalikan style siap pakai untuk tiap lapisan.
 */
export function useHeroParallax(ref) {
  const f = useParallaxFactor();
  const level = useParallaxLevel();
  const cine = level === "cinematic";
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  return {
    back: {
      y: useTransform(p, [0, 1], [0, 220 * f]),
      scale: useTransform(p, [0, 1], [1, 1 + (cine ? 0.18 : 0.06) * (f ? 1 : 0)]),
    },
    mid: {
      y: useTransform(p, [0, 1], [0, 90 * f]),
    },
    front: {
      y: useTransform(p, [0, 1], [0, -120 * f]),
      opacity: useTransform(p, [0, 0.8], [1, cine ? 0 : 1]),
    },
  };
}

/**
 * Bungkus konten section. Di Luxury, konten "melayang" masuk & keluar layar
 * (geser + skala halus) sehingga tiap section terasa seperti adegan film.
 */
export function CinematicBlock({ children, className = "" }) {
  const ref = useRef(null);
  const level = useParallaxLevel();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const on = level === "cinematic" && !reduce;
  const y = useTransform(scrollYProgress, [0, 0.5, 1], on ? [70, 0, -50] : [0, 0, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 0.55, 1], on ? [0.94, 1, 1, 0.97] : [1, 1, 1, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.85, 1], on ? [0.2, 1, 1, 0.45] : [1, 1, 1, 1]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, scale, opacity }}>{children}</motion.div>
    </div>
  );
}

/* ---------- Efek global khusus Luxury ---------- */

const DUST = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 41 + 7) % 100,
  size: 2 + (i % 3),
  dur: 9 + (i % 6) * 1.6,
  delay: (i * 0.7) % 9,
  drift: (i % 2 ? 1 : -1) * (10 + (i % 4) * 8),
}));

/* debu emas yang melayang naik pelan di seluruh layar */
export function GoldDust() {
  const level = useParallaxLevel();
  const reduce = useReducedMotion();
  if (level !== "cinematic" || reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
      {DUST.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-[#F3E2B3] shadow-[0_0_8px_rgba(243,226,179,0.9)]"
          style={{ left: `${d.left}%`, bottom: -10, width: d.size, height: d.size }}
          animate={{ y: [0, -1100], x: [0, d.drift, 0], opacity: [0, 0.9, 0.7, 0] }}
          transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: "linear" }}
        />
      ))}
    </div>
  );
}

/* sapuan cahaya emas yang mengikuti scroll */
export function LightSweep() {
  const level = useParallaxLevel();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const rotate = useTransform(scrollYProgress, [0, 1], [-18, 22]);
  const x = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  if (level !== "cinematic" || reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{ rotate, x }}
      className="pointer-events-none fixed -inset-1/2 z-20 bg-[conic-gradient(from_210deg_at_50%_0%,transparent_0deg,rgba(233,210,154,0.07)_14deg,transparent_30deg,rgba(233,210,154,0.05)_52deg,transparent_70deg)] mix-blend-screen"
    />
  );
}

/* garis progres emas tipis di atas layar */
export function GoldProgress() {
  const level = useParallaxLevel();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  if (level !== "cinematic") return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-[#9C7A3C] via-[#F6E7B8] to-[#C9A45C]"
    />
  );
}

/**
 * Opening eksklusif Luxury: setelah cover dibuka, layar menjadi bioskop —
 * garis emas memanjang, letterbox terbuka, dan nama pasangan muncul.
 */
export function CinematicOpening({ show, title, subtitle, onDone }) {
  const [visible, setVisible] = useState(show);
  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cinematic-opening"
          className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          aria-hidden="true"
        >
          {/* letterbox atas & bawah */}
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-[#060507]"
            initial={{ y: 0 }}
            animate={{ y: "-82%" }}
            transition={{ duration: 1.2, delay: 0.9, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-[#060507]"
            initial={{ y: 0 }}
            animate={{ y: "82%" }}
            transition={{ duration: 1.2, delay: 0.9, ease: [0.76, 0, 0.24, 1] }}
          />
          {/* garis emas */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-px -translate-x-1/2 bg-gradient-to-r from-transparent via-[#F6E7B8] to-transparent shadow-[0_0_18px_rgba(246,231,184,0.9)]"
            initial={{ width: 0, opacity: 1 }}
            animate={{ width: "90%", opacity: [1, 1, 0] }}
            transition={{ duration: 1.3, ease, opacity: { duration: 1.6, times: [0, 0.6, 1] } }}
          />
          {/* judul */}
          <motion.div
            className="relative text-center"
            initial={{ opacity: 0, scale: 1.08, filter: "blur(10px)" }}
            animate={{ opacity: [0, 1, 1, 0], scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 2.4, times: [0, 0.3, 0.75, 1], ease }}
          >
            <p className="font-cinzel text-[10px] tracking-[0.5em] text-[#C9A45C]">{subtitle}</p>
            <p className="mt-3 font-script text-[54px] leading-none text-foil">{title}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* pasang semua efek global Luxury sekaligus */
export function CinematicEffects() {
  return (
    <>
      <LightSweep />
      <GoldDust />
      <GoldProgress />
    </>
  );
}
