import React, { useRef } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ParallaxLayer, useParallaxFactor } from "./parallax.jsx";

/* ============================================================
   MOMENLABS — ASET "CELESTIAL LUXURY" (Art deco, langit malam & emas)
   ------------------------------------------------------------
   Aset PNG transparan hasil scripts/cutout-sprites.cjs
   (sumber: assets-src/celestial-luxury).
   ============================================================ */

const BASE = "/templates/celestial-luxury";
const ease = [0.22, 1, 0.36, 1];
const SKY = "radial-gradient(120% 80% at 50% 22%,#1E2756 0%,#0E1433 45%,#05070F 100%)";

export function Asset({ name, className = "", style }) {
  return <img src={`${BASE}/${name}.png`} alt="" aria-hidden="true" draggable={false} className={`pointer-events-none select-none ${className}`} style={style} />;
}

/* ---------- langit: bintang berkelip & bintang jatuh ---------- */

const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 37 + 13) % 100,
  y: (i * 53 + 7) % 100,
  s: 1 + (i % 3) * 0.8,
  d: 2.5 + (i % 5),
  delay: (i * 0.37) % 4,
}));

export function StarField({ fixed = false, count = 46, className = "" }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 overflow-hidden ${className}`}>
      {STARS.slice(0, count).map((st, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-[#F6E7B8]"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, boxShadow: "0 0 6px rgba(246,231,184,0.9)" }}
          animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: st.d, repeat: Infinity, delay: st.delay, ease: "easeInOut" }}
        />
      ))}
      {/* bintang jatuh */}
      {[0, 1].map((k) => (
        <motion.span
          key={`s${k}`}
          className="absolute h-[1.5px] w-24 rounded-full bg-gradient-to-r from-transparent via-[#F6E7B8] to-white"
          style={{ top: `${12 + k * 22}%`, left: `${60 - k * 30}%`, rotate: -28 }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], x: [-40, -260], y: [0, 140] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 6 + k * 3.5, delay: 2 + k * 2.7, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

/* rasi bintang yang tergambar sendiri */
export function Constellation({ className = "", delay = 0 }) {
  const pts = [
    [10, 60],
    [32, 38],
    [52, 48],
    [70, 22],
    [90, 30],
    [78, 62],
    [52, 48],
  ];
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
  return (
    <svg viewBox="0 0 100 80" className={className} fill="none" aria-hidden="true">
      <motion.path
        d={d}
        stroke="#D4AF6A"
        strokeWidth="0.6"
        strokeOpacity="0.7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay, ease: "easeInOut" }}
      />
      {pts.slice(0, 6).map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="1.6"
          fill="#F6E7B8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.4 + i * 0.4 }}
          style={{ filter: "drop-shadow(0 0 3px rgba(246,231,184,0.9))" }}
        />
      ))}
    </svg>
  );
}

function GlowMoon({ className = "" }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <div className="absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,rgba(246,231,184,0.35),transparent)]" />
      <Asset name="moon" className="relative w-full drop-shadow-[0_0_24px_rgba(246,231,184,0.6)]" />
    </div>
  );
}

/* ---------- thumbnail katalog ---------- */

export function CelestialThumb({ compact }) {
  return (
    <>
      <StarField count={30} />
      <div className="absolute inset-x-0 top-0 flex justify-center gap-0 opacity-90">
        <Asset name="beads" className="w-[48%]" />
        <Asset name="beads" className="w-[48%]" />
      </div>
      <div className={`absolute left-1/2 -translate-x-1/2 ${compact ? "top-[8%] w-[74%]" : "top-[10%] w-[86%]"}`}>
        <GlowMoon className="absolute left-[30%] top-[18%] w-[22%]" />
        <Asset name="archCurtain" className="relative w-full" />
      </div>
      <Asset name="wingLeft" className={`absolute ${compact ? "left-[2%] top-[44%] w-[22%]" : "left-[2%] top-[40%] w-[24%]"}`} />
      <Asset name="wingRight" className={`absolute ${compact ? "right-[2%] top-[44%] w-[22%]" : "right-[2%] top-[40%] w-[24%]"}`} />
      <Asset name="floralRose" className="absolute -bottom-[2%] -left-[10%] w-[44%]" />
      <Asset name="floralDahlia" className="absolute -bottom-[2%] -right-[10%] w-[42%]" />
    </>
  );
}

/* ============================================================
   COVER BERANIMASI
   ============================================================ */

export function CelestialCover({ t, guestName, onOpen }) {
  const [g, b] = t.names.split(" & ");
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 45, damping: 15 });
  const sy = useSpring(my, { stiffness: 45, damping: 15 });
  const depth = (d) => ({ x: useTransform(sx, (v) => v * d), y: useTransform(sy, (v) => v * d) });
  const sky = depth(4);
  const far = depth(9);
  const mid = depth(15);
  const near = depth(26);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex justify-center overflow-hidden bg-[#03040A]"
      exit={{ opacity: 0, transition: { duration: 0.8, delay: 0.6 } }}
      onPointerMove={onMove}
    >
      {/* opening "gerhana": langit terbuka dari lingkaran emas */}
      <motion.div
        className="relative h-full w-full max-w-[440px] overflow-hidden"
        style={{ background: SKY }}
        initial={{ clipPath: "circle(0% at 50% 30%)" }}
        animate={{ clipPath: "circle(150% at 50% 30%)" }}
        transition={{ duration: 2.2, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}
      >
        <motion.div style={sky} className="absolute -inset-6">
          <StarField />
        </motion.div>
        <motion.div style={sky} className="absolute right-[4%] top-[16%] w-[34%] opacity-80">
          <Constellation className="w-full" delay={2.2} />
        </motion.div>
        <motion.div style={sky} className="absolute left-[6%] top-[58%] w-[26%] -scale-x-100 opacity-60">
          <Constellation className="w-full" delay={3} />
        </motion.div>

        {/* naik saat dibuka */}
        <motion.div className="absolute inset-0" exit={{ y: "-18%", opacity: 0, transition: { duration: 1, ease: [0.7, 0, 0.3, 1] } }}>
          {/* untaian manik emas di atas */}
          <motion.div style={far} className="absolute inset-x-0 -top-[1%] flex justify-center">
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 45, damping: 12, delay: 1.6 }}
              className="flex w-[104%] justify-center"
            >
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  className="w-1/2"
                  animate={{ rotate: [0, i ? -1.2 : 1.2, 0] }}
                  transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformOrigin: "50% 0%" }}
                >
                  <Asset name="beads" className="w-full" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* chandelier & bintang-bulan gantung */}
          <motion.div style={far} className="absolute left-1/2 top-0 w-[17%] -translate-x-1/2">
            <motion.div
              initial={{ y: "-110%" }}
              animate={{ y: 0, rotate: [0, 2, -2, 1, 0] }}
              transition={{ y: { type: "spring", stiffness: 50, damping: 9, delay: 1.9 }, rotate: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 3 } }}
              style={{ transformOrigin: "50% 0%" }}
            >
              <Asset name="chandelier" className="w-full drop-shadow-[0_0_18px_rgba(246,231,184,0.45)]" />
            </motion.div>
          </motion.div>
          <motion.div style={far} className="absolute -right-[3%] top-0 w-[34%]">
            <motion.div
              initial={{ y: "-110%" }}
              animate={{ y: 0, rotate: [0, -2, 1.5, 0] }}
              transition={{ y: { type: "spring", stiffness: 48, damping: 10, delay: 2.1 }, rotate: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 } }}
              style={{ transformOrigin: "60% 0%" }}
            >
              <Asset name="celestials" className="w-full drop-shadow-[0_0_10px_rgba(246,231,184,0.35)]" />
            </motion.div>
          </motion.div>
          <motion.div style={far} className="absolute -left-[2%] top-0 w-[26%]">
            <motion.div
              initial={{ y: "-110%" }}
              animate={{ y: 0, rotate: [0, 2, -1.5, 0] }}
              transition={{ y: { type: "spring", stiffness: 48, damping: 10, delay: 2.2 }, rotate: { duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 3 } }}
              style={{ transformOrigin: "40% 0%" }}
            >
              <Asset name="lanterns" className="w-full drop-shadow-[0_0_14px_rgba(246,214,140,0.5)]" />
            </motion.div>
          </motion.div>

          {/* gerbang art deco dengan bulan bercahaya */}
          <motion.div style={mid} className="absolute inset-x-0 top-[17%] flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.6, delay: 1.3, ease }}
              className="relative w-[88%]"
            >
              <motion.div
                className="absolute left-[33%] top-[20%] w-[18%]"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <GlowMoon className="w-full" />
              </motion.div>
              <Asset name="archCurtain" className="relative w-full drop-shadow-[0_18px_40px_rgba(0,0,0,0.6)]" />
            </motion.div>
          </motion.div>

          {/* sayap emas membentang */}
          <motion.div style={near} className="absolute left-[1%] top-[45%] w-[24%]">
            <motion.div
              initial={{ rotate: 35, opacity: 0, x: 30 }}
              animate={{ rotate: [35, 0, -3, 0], opacity: 1, x: 0 }}
              transition={{ duration: 2.2, delay: 2, ease }}
              style={{ transformOrigin: "100% 85%" }}
            >
              <Asset name="wingLeft" className="w-full drop-shadow-[0_0_14px_rgba(212,175,106,0.4)]" />
            </motion.div>
          </motion.div>
          <motion.div style={near} className="absolute right-[1%] top-[45%] w-[24%]">
            <motion.div
              initial={{ rotate: -35, opacity: 0, x: -30 }}
              animate={{ rotate: [-35, 0, 3, 0], opacity: 1, x: 0 }}
              transition={{ duration: 2.2, delay: 2, ease }}
              style={{ transformOrigin: "0% 85%" }}
            >
              <Asset name="wingRight" className="w-full drop-shadow-[0_0_14px_rgba(212,175,106,0.4)]" />
            </motion.div>
          </motion.div>

          {/* tiang & rangkaian bunga di bawah */}
          <motion.div style={near} className="absolute -bottom-[7%] -left-[6%] w-[40%]">
            <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.5, delay: 2.1, ease }} className="relative">
              <Asset name="floralRose" className="relative z-10 -mb-[18%] w-full" />
              <Asset name="pedestal" className="mx-auto w-[40%]" />
            </motion.div>
          </motion.div>
          <motion.div style={near} className="absolute -bottom-[7%] -right-[6%] w-[38%]">
            <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.5, delay: 2.25, ease }} className="relative">
              <Asset name="floralDahlia" className="relative z-10 -mb-[18%] w-full" />
              <Asset name="pedestalSmall" className="mx-auto w-[40%]" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* teks */}
        <motion.div className="absolute inset-x-0 top-[46.5%] z-10 px-[22%] text-center" exit={{ opacity: 0, y: -14, transition: { duration: 0.4 } }}>
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            animate={{ opacity: 1, letterSpacing: "0.38em" }}
            transition={{ duration: 1.6, delay: 2.2, ease }}
            className="font-cinzel text-[9px] uppercase text-[#D4AF6A]"
          >
            {t.kicker}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.4, delay: 2.5, ease }}
            className="mt-2 font-script text-[42px] leading-[0.95] text-foil"
          >
            {g}
            <span className="block font-cormorant text-xl italic text-[#D4AF6A]">&amp;</span>
            {b}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ duration: 1, delay: 2.8 }} className="mt-2 font-cinzel text-[10px] tracking-[0.3em] text-[#F3E6C8]">
            12 · 12 · 2026
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 1, delay: 3, ease }}
          className="absolute inset-x-[24%] top-[69%] z-20 text-center text-[#F3E6C8]"
        >
          <p className="font-cormorant text-[13px] italic opacity-70">Kepada Yth. Bapak/Ibu/Saudara/i</p>
          <p className="mt-1 truncate border-b border-[#D4AF6A]/40 pb-1.5 font-cormorant text-xl font-semibold">{guestName || "Tamu Undangan"}</p>
          <button
            onClick={onOpen}
            className="group relative mt-4 inline-flex items-center gap-2 overflow-hidden rounded-full bg-foil px-7 py-3 font-cinzel text-[11px] font-semibold tracking-[0.2em] text-[#0B1026] shadow-[0_0_30px_-4px_rgba(212,175,106,0.7)] transition active:scale-95"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            <span className="relative">BUKA UNDANGAN</span>
          </button>
        </motion.div>
      </motion.div>

      {/* cincin emas gerhana */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[30%] aspect-square w-[60vmin] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="h-full w-full rounded-full border-2 border-[#F6E7B8]"
          style={{ boxShadow: "0 0 40px 8px rgba(246,231,184,0.6), inset 0 0 30px 4px rgba(246,231,184,0.4)" }}
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: [0.1, 1, 5], opacity: [0, 1, 0] }}
          transition={{ duration: 2.4, delay: 0.1, times: [0, 0.35, 1], ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

/* ============================================================
   DEKORASI PARALLAX ISI UNDANGAN
   ============================================================ */

function HeroDecor() {
  const ref = useRef(null);
  const k = useParallaxFactor();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const skyY = useTransform(scrollYProgress, [0, 1], [0, 60 * k]);
  const moonY = useTransform(scrollYProgress, [0, 1], [0, 160 * k]);
  const topY = useTransform(scrollYProgress, [0, 1], [0, 100 * k]);
  const frontY = useTransform(scrollYProgress, [0, 1], [0, -200 * k]);
  const wingRot = useTransform(scrollYProgress, [0, 1], [0, 18 * k]);
  const wingRotR = useTransform(wingRot, (v) => -v);
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_20%,rgba(30,39,86,0.55),transparent)]" />
      <motion.div style={{ y: skyY }} className="absolute inset-0">
        <StarField count={36} />
        <div className="absolute left-[6%] top-[30%] w-[30%] opacity-70">
          <Constellation className="w-full" delay={0.6} />
        </div>
      </motion.div>
      <motion.div style={{ y: moonY }} className="absolute right-[10%] top-[16%] w-[16%]">
        <GlowMoon className="w-full" />
      </motion.div>
      <motion.div style={{ y: topY }} className="absolute inset-x-0 -top-[1%] flex">
        <Asset name="beads" className="w-1/2" />
        <Asset name="beads" className="w-1/2" />
      </motion.div>
      <motion.div style={{ y: topY }} className="absolute left-1/2 top-0 w-[16%] -translate-x-1/2">
        <motion.div animate={{ rotate: [0, 2, -2, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "50% 0%" }}>
          <Asset name="chandelier" className="w-full drop-shadow-[0_0_18px_rgba(246,231,184,0.45)]" />
        </motion.div>
      </motion.div>
      <motion.div style={{ y: frontY, rotate: wingRot }} className="absolute -left-[4%] top-[40%] w-[26%] origin-right">
        <Asset name="wingLeft" className="w-full opacity-90" />
      </motion.div>
      <motion.div style={{ y: frontY, rotate: wingRotR }} className="absolute -right-[4%] top-[40%] w-[26%] origin-left">
        <Asset name="wingRight" className="w-full opacity-90" />
      </motion.div>
      <motion.div style={{ y: frontY }} className="absolute -bottom-[4%] -left-[12%] w-[46%]">
        <Asset name="floralRose" className="w-full" />
      </motion.div>
      <motion.div style={{ y: frontY }} className="absolute -bottom-[4%] -right-[12%] w-[44%]">
        <Asset name="floralDahlia" className="w-full" />
      </motion.div>
    </div>
  );
}

const SECTION_DECOR = {
  default: [
    { name: "celestials", cls: "-right-[4%] top-0 w-[34%]", speed: 50, sway: true },
    { name: "starBurst", cls: "-left-[2%] bottom-[8%] w-[18%]", speed: 120, spin: true },
  ],
  mempelai: [
    { name: "floralRose", cls: "-left-[16%] top-[4%] w-[46%]", speed: 90, rotate: 6 },
    { name: "moon", cls: "right-[4%] top-[36%] w-[14%]", speed: 160, glow: true },
    { name: "floralDahlia", cls: "-right-[16%] bottom-[2%] w-[44%]", speed: 120 },
  ],
  story: [
    { name: "beads", cls: "-left-[4%] top-0 w-[40%]", speed: 40, sway: true },
    { name: "beads", cls: "-right-[4%] top-0 w-[40%]", speed: 60, sway: true },
  ],
  acara: [
    { name: "chandelier", cls: "left-1/2 top-0 w-[16%] -translate-x-1/2", speed: 40, sway: true },
    { name: "chairLeft", cls: "-left-[10%] bottom-[38%] w-[30%] opacity-80", speed: 140 },
    { name: "chairRight", cls: "-right-[10%] bottom-[4%] w-[30%] opacity-80", speed: 110 },
  ],
  hadiah: [
    { name: "lanterns", cls: "-left-[3%] top-0 w-[26%]", speed: 50, sway: true },
    { name: "pedestalSmall", cls: "right-[2%] bottom-[4%] w-[14%]", speed: 120 },
  ],
  rsvp: [
    { name: "celestials", cls: "-right-[4%] top-0 w-[32%]", speed: 50, sway: true },
    { name: "pampas", cls: "-left-[18%] bottom-[6%] w-[52%]", speed: 130 },
  ],
  voice: [
    { name: "archCurtain", cls: "-right-[30%] top-[6%] w-[70%] opacity-40", speed: 70 },
    { name: "starBurst", cls: "left-[4%] top-[12%] w-[16%]", speed: 140, spin: true },
  ],
};

function SectionDecor({ id }) {
  const items = SECTION_DECOR[id] ?? SECTION_DECOR.default;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <StarField count={18} />
      {items.map((d, i) => (
        <ParallaxLayer key={i} speed={d.speed} rotate={d.rotate ?? 0} className={`absolute ${d.cls}`}>
          {d.sway ? (
            <motion.div animate={{ rotate: [0, 2, -1.5, 0] }} transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "50% 0%" }}>
              <Asset name={d.name} className="w-full" />
            </motion.div>
          ) : d.spin ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
              <Asset name={d.name} className="w-full drop-shadow-[0_0_12px_rgba(246,231,184,0.5)]" />
            </motion.div>
          ) : d.glow ? (
            <GlowMoon className="w-full" />
          ) : (
            <Asset name={d.name} className="w-full" />
          )}
        </ParallaxLayer>
      ))}
    </div>
  );
}

function GlobalDecor() {
  return <StarField fixed count={24} className="z-20 opacity-70" />;
}

export const celestialDecor = { Hero: HeroDecor, Section: SectionDecor, Global: GlobalDecor };
