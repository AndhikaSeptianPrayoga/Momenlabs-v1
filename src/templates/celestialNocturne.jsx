import React, { useEffect, useState } from "react";
import { animate, motion, motionValue, useMotionValueEvent, useReducedMotion, useScroll, useTime, useTransform } from "framer-motion";
import { TONES, FONTS } from "../design/tokens.js";
import {
  CAM,
  CoverTitle,
  Dust,
  GuestPanel,
  Petals,
  REST_TOP,
  aimRig,
  makeJourney,
  panShift,
  poseAt,
  requestTiltPermission,
  snapRig,
  tiltX,
  tiltY,
  useCountdown,
  useStageBox,
  useTiltInput,
} from "../design/kit/index.js";

/* ============================================================
   MOMENLABS — TEMPLATE "CELESTIAL NOCTURNE" (Modern Aesthetic · Modern Celestial Luxury)
   ------------------------------------------------------------
   Langit tengah malam navy dengan bulan sabit, bingkai lengkung geometri emas,
   anemone putih, pampas & daun palem emas. Sprite utuh dari desainer
   (assets-src/celestial-nocturne → scripts/celestial-nocturne-assets.cjs).

   Lapisan (k = kedalaman untuk parallax & toleh kamera):
     langit 0 · cincin astrolab 0,15 · awan 0,25 · bingkai 0,5 · kabut depan 0,8 · bunga 1

   PEMBUKAAN ("Buka Undangan"): kamera zoom 1,8× di bulan sabit → mundur ke 1,0;
     bingkai 0,7 → 1 + garis kilau; bunga naik 80px → 0; teks bertahap.
   ISI = PERJALANAN KAMERA (kit/journey + rig CAM, seperti template Rumah Adat):
     lift — salam: kamera menengadah ke langit (rasi bintang tergambar, bintang jatuh)
     pan  — mempelai: kamera menoleh kiri/kanan, lapisan bergeser sesuai kedalamannya
     push — kisah & acara: kamera terbang menembus bingkai emas; bunga mekar ke samping + blur;
            di balik bingkai cahaya medali & cincin astrolab
     dusk — penutup: malam makin pekat, bintang makin terang
   GERAK SEPANJANG WAKTU: awan berarak kiri → kanan, bintang jatuh, komet debu emas,
     cincin astrolab berputar, rasi bintang tergambar ulang, bunga bernapas (±1°, ±5px),
     parallax 3D mouse / gyroscope.
   ============================================================ */

const ASSET = "/templates/celestial-nocturne";
const tone = TONES.nocturne;
const MOON = { x: 51, y: 7.2 }; // pusat bulan sabit di panggung (%)
const PUSH_ORIGIN = "50% 46%"; // pusat lengkung bingkai: arah kamera terbang

/* nilai pembukaan bersama cover & latar agar transisi menyambung */
const OPEN = {
  cam: motionValue(1), // 0 = zoom 1,8× di bulan → 1 = 1,0
  frame: motionValue(1),
  bloom: motionValue(1),
  text: motionValue(1),
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease3 = (v) => v * v * (3 - 2 * v);

/* ---------- lapisan dunia: tilt + toleh (pan) + tengadah (lift) + terbang masuk (push) ---------- */
function WorldLayer({ k, lift, push = 0, tilt, fade, children, className = "" }) {
  const x = useTransform([tiltX, CAM.pan], ([v, p]) => `calc(${-v * tilt}px + ${-p * panShift(k)}%)`);
  const y = useTransform([tiltY, CAM.lift], ([v, l]) => `calc(${-v * tilt * 0.7}px + ${l * lift}%)`);
  const scale = useTransform(CAM.push, (p) => 1 + ease3(p) * push);
  const opacity = useTransform(CAM.push, (p) => (fade ? 1 - clamp01((p - fade[0]) / (fade[1] - fade[0])) : 1));
  return (
    <motion.div className={`absolute inset-0 ${className}`} style={{ x, y, scale, opacity, transformOrigin: PUSH_ORIGIN }}>
      {children}
    </motion.div>
  );
}

const img = (src) => `${ASSET}/${src}.webp`;

/* sprite yang "bernapas": rotasi ±1°, naik-turun ±5px, fase berbeda tiap sprite */
function Breath({ src, style, mirror, phase = 0, amp = 1, origin = "50% 100%", still }) {
  const time = useTime();
  const rotate = useTransform(time, (t) => (still ? 0 : Math.sin((t / 1000) * 0.7 + phase) * amp));
  const y = useTransform(time, (t) => (still ? 0 : Math.sin((t / 1000) * 0.55 + phase * 1.3) * 5));
  return (
    <motion.img
      src={img(src)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute select-none"
      style={{ ...style, rotate, y, scaleX: mirror ? -1 : 1, transformOrigin: origin }}
    />
  );
}

/* ============================================================
   LANGIT — gradasi, bidang bintang, nebula, rasi bintang, bintang jatuh
   (meluas jauh di atas panggung: terlihat saat kamera menengadah)
   ============================================================ */

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
// koordinat bintang di bidang langit yang diperluas (x −15…115 %, y −45…100 % tinggi panggung)
const STARS = Array.from({ length: 150 }, () => ({
  x: -15 + rnd() * 130,
  y: -45 + rnd() * 145,
  s: rnd() < 0.12 ? 2.6 : 0.8 + rnd() * 1.4,
  d: 1.8 + rnd() * 3.5,
  o: 0.35 + rnd() * 0.65,
  dl: rnd() * 4,
}));

// rasi bintang (koordinat % panggung): tergambar ulang perlahan
const CONSTELLATIONS = [
  { pts: [[8, -30], [16, -24], [24, -27], [30, -19], [38, -22], [42, -14]], d: 0 },
  { pts: [[62, -38], [70, -31], [78, -34], [84, -25], [76, -20], [70, -31]], d: 2.5 },
  { pts: [[14, -8], [20, -2], [12, 4], [22, 9]], d: 5 },
  { pts: [[80, -6], [88, -1], [93, 7], [86, 12], [80, -6]], d: 7.5 },
  { pts: [[44, -40], [50, -33], [56, -36]], d: 4 },
];

function Constellations({ still }) {
  return (
    <svg className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {CONSTELLATIONS.map((c, i) => (
        <g key={i}>
          <motion.polyline
            points={c.pts.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="#E8C987"
            strokeWidth="0.18"
            strokeOpacity="0.55"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 0.8 }}
            initial={{ pathLength: still ? 1 : 0 }}
            animate={still ? undefined : { pathLength: [0, 1, 1, 0] }}
            transition={{ duration: 12, times: [0, 0.35, 0.85, 1], repeat: Infinity, delay: c.d, ease: "easeInOut" }}
          />
          {c.pts.map(([x, y], j) => (
            <motion.circle
              key={j}
              cx={x}
              cy={y}
              r="0.45"
              fill="#FFF1CC"
              animate={still ? undefined : { opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.4 + j * 0.3, repeat: Infinity, delay: j * 0.2 + c.d }}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

function ShootingStar({ top, left, delay, every, len = 22, still }) {
  if (still) return null;
  return (
    <motion.span
      className="pointer-events-none absolute h-[1.5px] origin-right rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,236,190,0.15)_40%,#FFF6DE)] shadow-[0_0_6px_rgba(255,226,160,0.9)]"
      style={{ top: `${top}%`, left: `${left}%`, width: `${len}%`, rotate: 22 }}
      initial={{ opacity: 0, x: "0%" }}
      animate={{ opacity: [0, 1, 1, 0], x: ["0%", "180%"], y: ["0%", "1400%"] }}
      transition={{ duration: 1.3, times: [0, 0.15, 0.7, 1], repeat: Infinity, repeatDelay: every, delay, ease: "easeIn" }}
    />
  );
}

function Sky({ still }) {
  const night = useTransform(CAM.dusk, (d) => 0.55 + d * 0.45);
  return (
    <>
      {/* bidang langit yang diperluas ke atas & samping */}
      {/* warna dasar luar angkasa = warna lukisan langit desainer (hitam kebiruan), bukan biru langit biasa */}
      <div className="absolute left-[-20%] right-[-20%] top-[-50%] bottom-[-12%] bg-[linear-gradient(180deg,#02050C_0%,#020D19_32%,#021221_45%,#04162A_70%,#071B33_100%)]" />
      {/* bidang bintang padat + pita bima sakti (scripts/celestial-starfield.cjs) */}
      <div className="absolute left-[-20%] right-[-20%] top-[-50%] bottom-[-12%] opacity-90" style={{ backgroundImage: `url(${img("starfield")})`, backgroundSize: "100% 100%" }} />
      {/* nebula lembut berarak */}
      {!still && (
        <>
          <motion.div
            className="absolute left-[-20%] top-[-34%] aspect-square w-[90%] rounded-full bg-[radial-gradient(closest-side,rgba(110,80,180,0.2),transparent)] mix-blend-screen blur-[6px]"
            animate={{ x: ["0%", "12%", "0%"], scale: [1, 1.12, 1] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[-25%] top-[18%] aspect-square w-[85%] rounded-full bg-[radial-gradient(closest-side,rgba(40,110,160,0.16),transparent)] mix-blend-screen blur-[6px]"
            animate={{ x: ["0%", "-10%", "0%"], scale: [1.05, 0.95, 1.05] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
      {/* bintang berkedip (lebih terang saat malam makin pekat) */}
      <motion.div className="absolute inset-0" style={{ opacity: night }}>
        {STARS.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-[#FFF4DA]"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, boxShadow: s.s > 2 ? "0 0 6px 1px rgba(255,236,190,0.9)" : "0 0 3px rgba(255,236,190,0.8)" }}
            animate={still ? { opacity: s.o } : { opacity: [s.o * 0.25, s.o, s.o * 0.25] }}
            transition={{ duration: s.d, repeat: Infinity, delay: s.dl, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
      {/* bima sakti emas di langit atas */}
      <motion.img
        src={img("milkyway")}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-[-18%] top-[-44%] w-[95%] select-none mix-blend-screen"
        animate={still ? undefined : { opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <Constellations still={still} />
      {/* langit desainer: bulan sabit, rasi bintang, bima sakti — tepinya melebur ke langit */}
      <img
        src={`${ASSET}/sky.webp`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-x-0 top-0 w-full select-none [mask-image:linear-gradient(180deg,#000_35%,rgba(0,0,0,0.6)_65%,transparent_97%)]"
      />
      <motion.img
        src={img("milkyway")}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute right-[-22%] top-[10%] w-[70%] select-none mix-blend-screen"
        animate={still ? undefined : { opacity: [0.45, 0.8, 0.45], x: ["0%", "-4%", "0%"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* pendar bulan berdenyut */}
      <motion.div
        className="absolute aspect-square w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,226,160,0.42),rgba(232,201,135,0.12)_45%,transparent)] mix-blend-screen"
        style={{ left: `${MOON.x}%`, top: `${MOON.y}%` }}
        animate={still ? undefined : { opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* bintang jatuh dari kiri ke kanan */}
      <ShootingStar still={still} top={-30} left={-10} delay={1.5} every={6} />
      <ShootingStar still={still} top={-6} left={20} delay={4.2} every={8} len={16} />
      <ShootingStar still={still} top={18} left={-15} delay={7} every={9} len={18} />
      <ShootingStar still={still} top={-40} left={40} delay={10} every={7} len={14} />
    </>
  );
}

/* komet debu emas yang melayang menyeberangi langit (kiri → kanan) */
function Comet({ still, top, dur, phase, w }) {
  const time = useTime();
  const left = useTransform(time, (t) => `${((((t / 1000) / dur + phase) % 1) * (130 + w)) - (w + 15)}%`);
  const y = useTransform(time, (t) => `${Math.sin((t / 1000 / dur + phase) * Math.PI * 2) * 30}%`);
  if (still) return null;
  return (
    <motion.img
      src={img("sparkleTrail")}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute select-none mix-blend-screen"
      style={{ top: `${top}%`, width: `${w}%`, left, y }}
    />
  );
}

/* cincin astrolab emas berputar pelan di belakang bingkai */
function Astrolabe({ still }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  return (
    <motion.svg
      viewBox="-50 -50 100 100"
      className="pointer-events-none absolute left-1/2 top-[44%] w-[135%] -translate-x-1/2 -translate-y-1/2 opacity-[0.22]"
      animate={still ? undefined : { rotate: 360 }}
      transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
      aria-hidden="true"
    >
      <g fill="none" stroke="#E8C987" strokeWidth="0.18">
        <circle r="48" />
        <circle r="45.5" strokeDasharray="0.6 1.2" />
        <circle r="38" />
        <circle r="30" strokeOpacity="0.6" />
        {ticks.map((a) => (
          <line key={a} x1="0" y1={a % 30 === 0 ? -48 : -48} x2="0" y2={a % 30 === 0 ? -43 : -46} transform={`rotate(${a})`} />
        ))}
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d="M0 -41.8 L0.9 -40 L0 -38.2 L-0.9 -40 Z" fill="#E8C987" stroke="none" />
          </g>
        ))}
      </g>
    </motion.svg>
  );
}

/* ============================================================
   AWAN — berarak terus dari kiri ke kanan (bukan tempelan diam)
   ============================================================ */

const CLOUDS = [
  { src: "cloudB", top: -22, w: 70, dur: 95, phase: 0.1, o: 0.55 },
  { src: "cloudC", top: -10, w: 40, dur: 80, phase: 0.6, o: 0.5, mirror: true },
  { src: "cloudB", top: 19, w: 78, dur: 110, phase: 0.35, o: 0.92 },
  { src: "cloudC", top: 31, w: 46, dur: 85, phase: 0.8, o: 0.85 },
  { src: "cloudB", top: 44, w: 62, dur: 100, phase: 0.05, o: 0.5, mirror: true },
  { src: "cloudC", top: 56, w: 52, dur: 90, phase: 0.5, o: 0.55, mirror: true },
  { src: "cloudB", top: 61, w: 84, dur: 120, phase: 0.72, o: 0.75 },
];

function DriftCloud({ c, still }) {
  const time = useTime();
  const span = 100 + c.w + 30;
  const left = useTransform(time, (t) => `${((((t / 1000) / c.dur + c.phase) % 1) * span) - (c.w + 15)}%`);
  const y = useTransform(time, (t) => `${Math.sin((t / 1000) * 0.2 + c.phase * 9) * 6}%`);
  return (
    <motion.img
      src={img(c.src)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute select-none"
      style={{ top: `${c.top}%`, width: `${c.w}%`, opacity: c.o, left: still ? `${c.phase * 100 - c.w / 2}%` : left, y, scaleX: c.mirror ? -1 : 1 }}
    />
  );
}

/* kabut tipis di depan bingkai: memberi kedalaman antara bingkai & bunga */
function FrontMist({ still }) {
  const time = useTime();
  const x = useTransform(time, (t) => `${Math.sin((t / 1000) * 0.08) * 12}%`);
  return (
    <motion.div className="absolute inset-x-[-30%] bottom-[18%] h-[22%]" style={{ x: still ? 0 : x }}>
      <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_30%_60%,rgba(120,130,190,0.16),transparent),radial-gradient(45%_50%_at_75%_40%,rgba(120,130,190,0.13),transparent)] blur-[4px]" />
    </motion.div>
  );
}

/* ============================================================
   BINGKAI — lengkung geometri emas + medali matahari + rantai bintang
   ============================================================ */

const FRAME_MASK = { WebkitMaskImage: `url(${img("frame")})`, maskImage: `url(${img("frame")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };

function GoldFrame({ still }) {
  const opacity = useTransform(OPEN.frame, [0, 0.6], [0, 1]);
  const scale = useTransform(OPEN.frame, (v) => 0.7 + ease3(v) * 0.3);
  const scanTop = useTransform(OPEN.frame, (v) => `${-20 + v * 130}%`);
  const scanO = useTransform(OPEN.frame, (v) => (v > 0.05 && v < 0.98 ? 1 : 0));
  return (
    <motion.div className="absolute inset-0" style={{ opacity, scale, transformOrigin: "50% 50%" }}>
      <div className="absolute left-1/2 top-[25%] h-[52%] w-[62%] -translate-x-1/2 rounded-t-full bg-[radial-gradient(70%_60%_at_50%_45%,rgba(6,10,28,0.55),rgba(6,10,28,0.2)_70%,transparent)]" />
      <div className="absolute left-1/2 top-[20%] w-[78%] -translate-x-1/2">
        <img src={img("frame")} alt="" aria-hidden="true" draggable={false} className="block w-full select-none drop-shadow-[0_0_14px_rgba(232,201,135,0.45)]" />
        <div className="absolute inset-0 overflow-hidden mix-blend-screen" style={FRAME_MASK}>
          <motion.div className="absolute inset-x-0 h-[16%] bg-[linear-gradient(180deg,transparent,rgba(255,244,210,1),transparent)]" style={{ top: scanTop, opacity: scanO }} />
          {!still && (
            <motion.div
              className="absolute inset-x-0 h-[12%] bg-[linear-gradient(180deg,transparent,rgba(255,236,190,0.85),transparent)]"
              initial={{ top: "-15%" }}
              animate={{ top: ["-15%", "110%"] }}
              transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 5, ease: "easeInOut", delay: 4 }}
            />
          )}
        </div>
      </div>
      <motion.img
        src={img("medallion")}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-[13.5%] w-[30%] -translate-x-1/2 select-none mix-blend-screen"
        animate={still ? undefined : { filter: ["brightness(1)", "brightness(1.35)", "brightness(1)"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {[-1, 1].map((s) => (
        <motion.img
          key={s}
          src={img("chains")}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute top-[30%] w-[8%] select-none"
          style={{ [s < 0 ? "left" : "right"]: "3%", transformOrigin: "50% 0%", scaleX: s }}
          animate={still ? undefined : { rotate: [-2 * s, 2 * s, -2 * s] }}
          transition={{ duration: 5 + (s > 0 ? 1 : 0), repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

/* di balik bingkai: cahaya medali besar saat kamera terbang masuk (bab acara) */
function InnerSanctum({ still }) {
  const opacity = useTransform(CAM.push, [0.35, 0.95], [0, 1]);
  const scale = useTransform(CAM.push, [0.35, 1], [0.6, 1]);
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <div className="absolute left-1/2 top-[46%] aspect-square w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,226,160,0.28),rgba(212,175,106,0.08)_50%,transparent)]" />
      <motion.img
        src={img("medallion")}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-[30%] w-[90%] -translate-x-1/2 select-none opacity-40 mix-blend-screen"
        style={{ scale }}
        animate={still ? undefined : { rotate: [0, 6, 0, -6, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* ============================================================
   BUNGA — anemone, pampas & daun palem emas (kiri/kanan + gugus luar saat kamera menoleh)
   ============================================================ */

function Blooms({ still }) {
  const y = useTransform(OPEN.bloom, (v) => (1 - v) * 80);
  const scale = useTransform(OPEN.bloom, (v) => 0.95 + v * 0.05);
  const opacity = useTransform(OPEN.bloom, [0, 0.5], [0, 1]);
  // kamera terbang masuk: gugus bunga mekar ke samping keluar layar dengan blur
  const xL = useTransform(CAM.push, (d) => `${-ease3(clamp01(d * 1.6)) * 70}%`);
  const xR = useTransform(CAM.push, (d) => `${ease3(clamp01(d * 1.6)) * 70}%`);
  const blur = useTransform(CAM.push, (d) => `blur(${clamp01(d * 1.6) * 10}px)`);
  const grow = useTransform(CAM.push, (d) => 1 + clamp01(d * 1.6) * 0.3);
  return (
    <motion.div className="absolute inset-0" style={{ y, scale, opacity, transformOrigin: "50% 100%" }}>
      <motion.div className="absolute inset-0" style={{ filter: blur }}>
        <motion.div className="absolute inset-0" style={{ x: xL, scale: grow, transformOrigin: "0% 100%" }}>
          {/* gugus luar kiri (tampak saat kamera menoleh ke kiri) */}
          <Breath src="featherSpray" still={still} phase={2.1} style={{ left: "-52%", bottom: "4%", width: "26%" }} />
          <Breath src="pampas" still={still} phase={0.9} style={{ left: "-70%", bottom: "8%", width: "44%" }} origin="40% 100%" />
          <Breath src="blossoms" still={still} phase={1.9} mirror style={{ left: "-48%", bottom: "-4%", width: "30%" }} />
          <Breath src="leafNavy" still={still} phase={0.3} style={{ left: "-30%", bottom: "2%", width: "16%" }} />
          {/* gugus kiri */}
          <Breath src="wave" still={still} phase={0.4} amp={0.4} style={{ left: "-40%", bottom: "-8%", width: "110%" }} />
          <Breath src="pampas" still={still} phase={0.2} style={{ left: "-16%", bottom: "16%", width: "44%" }} origin="40% 100%" />
          <Breath src="palm" still={still} phase={1.1} style={{ left: "14%", bottom: "17%", width: "18%" }} />
          <Breath src="monstera" still={still} phase={2.3} style={{ left: "-10%", bottom: "-2%", width: "30%" }} />
          <Breath src="bouquet" still={still} phase={0.8} amp={0.8} style={{ left: "-12%", bottom: "-12%", width: "60%" }} origin="30% 100%" />
        </motion.div>
        <motion.div className="absolute inset-0" style={{ x: xR, scale: grow, transformOrigin: "100% 100%" }}>
          {/* gugus luar kanan */}
          <Breath src="pampas" still={still} phase={2.7} mirror style={{ right: "-72%", bottom: "6%", width: "44%" }} origin="60% 100%" />
          <Breath src="flowerSprig" still={still} phase={1.2} style={{ right: "-40%", bottom: "4%", width: "20%" }} />
          <Breath src="bouquet" still={still} phase={3.1} mirror style={{ right: "-62%", bottom: "-12%", width: "56%" }} origin="70% 100%" />
          {/* gugus kanan */}
          <Breath src="wave" still={still} phase={1.4} amp={0.4} mirror style={{ right: "-40%", bottom: "-9%", width: "100%" }} />
          <Breath src="pampas" still={still} phase={1.7} mirror style={{ right: "-14%", bottom: "12%", width: "42%" }} origin="60% 100%" />
          <Breath src="featherSpray" still={still} phase={2.9} style={{ right: "-4%", bottom: "6%", width: "26%" }} />
          <Breath src="monstera" still={still} phase={0.5} mirror style={{ right: "-8%", bottom: "-4%", width: "30%" }} />
          <Breath src="blossoms" still={still} phase={3.4} style={{ right: "16%", bottom: "-3%", width: "28%" }} />
          <Breath src="anemoneSmall" still={still} phase={1.4} style={{ right: "6%", bottom: "2%", width: "22%" }} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   ADEGAN LENGKAP (panggung 9:16)
   ============================================================ */

const TWINKLES = [
  { src: "star", x: 16, y: 18, w: 7, d: 3.2 },
  { src: "starburst", x: 84, y: 26, w: 9, d: 4.1 },
  { src: "star", x: 88, y: 58, w: 6, d: 2.7 },
  { src: "starburst", x: 10, y: 64, w: 8, d: 3.6 },
  { src: "star", x: 70, y: 12, w: 5, d: 2.4 },
  { src: "starburst", x: 30, y: -18, w: 10, d: 3.9 },
  { src: "star", x: 74, y: -30, w: 8, d: 3.3 },
];

function NocturneScene({ still = false }) {
  const [ref, box] = useStageBox(9 / 16, 0.5);
  // pembukaan: zoom 1,8× di bulan → 1,0, titik fokus bergeser dari bulan ke tengah
  const camScale = useTransform(OPEN.cam, (c) => 1 + (1 - ease3(c)) * 0.8);
  const camOrigin = useTransform(OPEN.cam, (c) => `${MOON.x}% ${MOON.y + ease3(c) * (50 - MOON.y)}%`);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#020D19]">
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          <motion.div className="absolute inset-0 will-change-transform" style={{ scale: camScale, transformOrigin: camOrigin }}>
            <WorldLayer k={0} lift={24} push={0.22} tilt={3}>
              <Sky still={still} />
              <Comet still={still} top={-26} dur={38} phase={0.2} w={26} />
              <Comet still={still} top={14} dur={46} phase={0.7} w={20} />
              {!still &&
                TWINKLES.map((s, i) => (
                  <motion.img
                    key={i}
                    src={img(s.src)}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none mix-blend-screen"
                    style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.1, 0.5], rotate: [0, 25, 0] }}
                    transition={{ duration: s.d, repeat: Infinity, delay: i * 0.9, ease: "easeInOut" }}
                  />
                ))}
            </WorldLayer>
            <WorldLayer k={0.15} lift={30} push={0.5} tilt={5}>
              <Astrolabe still={still} />
            </WorldLayer>
            <WorldLayer k={0.25} lift={36} push={0.7} tilt={6} fade={[0.4, 0.9]}>
              {CLOUDS.map((c, i) => (
                <DriftCloud key={i} c={c} still={still} />
              ))}
            </WorldLayer>
            <WorldLayer k={0.35} lift={40} push={0.4} tilt={7}>
              <InnerSanctum still={still} />
            </WorldLayer>
            <WorldLayer k={0.5} lift={56} push={1.7} tilt={9} fade={[0.45, 0.85]}>
              <GoldFrame still={still} />
            </WorldLayer>
            <WorldLayer k={0.8} lift={70} push={1} tilt={14} fade={[0.3, 0.7]}>
              <FrontMist still={still} />
            </WorldLayer>
          </motion.div>
          <WorldLayer k={1} lift={85} tilt={22}>
            <Blooms still={still} />
          </WorldLayer>
        </div>
      )}
      {!still && <Dust palette={tone.dust} count={26} />}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_50%,transparent_55%,rgba(2,4,14,0.55)_100%)]" />
    </div>
  );
}

/* ============================================================
   COVER — kamera masih menempel di bulan sabit (zoom 1,8×)
   ============================================================ */

export function CelestialNocturneCover({ t, guestName, onOpen }) {
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  useTiltInput(!reduce);

  useEffect(() => {
    Object.values(OPEN).forEach((v) => v.set(0));
    snapRig(REST_TOP);
  }, []);

  const open = () => {
    if (leaving) return;
    setLeaving(true);
    requestTiltPermission();
    if (reduce) {
      Object.values(OPEN).forEach((v) => v.set(1));
      onOpen();
      return;
    }
    animate(OPEN.cam, 1, { duration: 3.4, ease: [0.16, 1, 0.3, 1] });
    animate(OPEN.frame, 1, { delay: 0.7, duration: 2, ease: [0.22, 1, 0.36, 1] });
    animate(OPEN.bloom, 1, { delay: 1.1, duration: 2, ease: [0.22, 1, 0.36, 1] });
    animate(OPEN.text, 1, { delay: 2.7, duration: 1.6, ease: [0.22, 1, 0.36, 1] });
    setTimeout(onOpen, 600);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <NocturneScene still={!!reduce} />
        <Petals palette={tone.petals} count={8} />
        {/* lingkar cahaya lembut di belakang nama: teks tetap terbaca saat awan melintas */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[44%] aspect-[4/3] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(2,8,18,0.8),rgba(2,8,18,0.45)_55%,transparent)]"
          animate={{ opacity: leaving ? 0 : 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[44%] aspect-square w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(232,201,135,0.16),transparent)] mix-blend-screen"
          animate={leaving ? { opacity: 0 } : { opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-[7] h-full">
          <CoverTitle tone={tone} t={t} leaving={leaving} delay={0.2} position="top-[40%]" />
          <GuestPanel tone={tone} guestName={guestName} leaving={leaving} onOpen={open} delay={1.2} />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HERO — teks di dalam lengkung emas (muncul bertahap setelah semua mapan)
   ============================================================ */

const pad = (n) => String(n).padStart(2, "0");

function Lift({ i, children, className = "" }) {
  const k = useTransform(OPEN.text, (v) => clamp01(v * 1.7 - i * 0.16));
  const y = useTransform(k, (v) => (1 - v) * 18);
  const filter = useTransform(k, (v) => `blur(${(1 - v) * 6}px)`);
  return (
    <motion.div className={className} style={{ opacity: k, y, filter }}>
      {children}
    </motion.div>
  );
}

function HeroScene({ data }) {
  const first = data.events[0];
  const t = useCountdown(first.start);
  const date = new Date(first.start).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  return (
    <section className="pointer-events-none relative h-[100svh]">
      <div className="absolute inset-x-0 top-[36svh] px-[20%] text-center">
        <Lift i={0}>
          <p className={`${FONTS.caps} text-[9px] tracking-[0.45em] ${tone.kicker}`}>WRITTEN IN THE STARS</p>
        </Lift>
        <Lift i={1} className="mt-4">
          <h1 className={`${FONTS.script} text-[46px] leading-[0.95] ${tone.title}`}>{data.groom.nickname}</h1>
        </Lift>
        <Lift i={2}>
          <p className={`${FONTS.body} text-2xl italic ${tone.amp}`}>&amp;</p>
        </Lift>
        <Lift i={3}>
          <h1 className={`${FONTS.script} text-[46px] leading-[0.95] ${tone.title}`}>{data.bride.nickname}</h1>
        </Lift>
        <Lift i={4} className="mt-4">
          <span className="mx-auto block h-px w-24 bg-gradient-to-r from-transparent via-[#E8C987] to-transparent" />
          <p className={`mt-3 ${FONTS.body} text-[15px] italic ${tone.body}`}>{date}</p>
        </Lift>
        <Lift i={5} className="mt-5">
          <div className="mx-auto grid max-w-[230px] grid-cols-4 gap-1">
            {Object.entries(t).map(([k, v]) => (
              <div key={k} className="text-center">
                <p className={`${FONTS.body} text-[24px] font-medium leading-none ${tone.count}`}>{pad(v)}</p>
                <p className={`mt-1 ${FONTS.caps} text-[7px] tracking-[0.2em] ${tone.countLabel}`}>{k.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </Lift>
      </div>
    </section>
  );
}

/* ============================================================
   LATAR TETAP — posisi scroll menentukan pose kamera (bab yang menempel)
   ============================================================ */

function Backdrop() {
  const reduce = useReducedMotion();
  useTiltInput(!reduce);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => aimRig(poseAt(y, window.innerHeight)));
  useEffect(() => aimRig(poseAt(window.scrollY, window.innerHeight)), []);
  return (
    <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden" aria-hidden="true">
      <NocturneScene still={!!reduce} />
      <motion.div style={{ opacity: CAM.dim }} className={`absolute inset-0 ${tone.wash}`} />
    </div>
  );
}

function SectionDecor() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${tone.line}`} />
      <img src={img("starburst")} alt="" className="absolute left-1/2 top-0 w-10 -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
      <div className="absolute left-1/2 top-[18%] h-[50%] w-[120%] -translate-x-1/2 rounded-full" style={{ background: `radial-gradient(closest-side, ${tone.glow}, transparent)` }} />
    </div>
  );
}

/* isi undangan sebagai perjalanan kamera di langit malam (kit/journey.jsx) */
const { Journey, Closing } = makeJourney({
  tone,
  asset: ASSET,
  accent: "bg-[linear-gradient(90deg,#D4AF6A_0_30%,#FFF1CC_30%_70%,#D4AF6A_70%_100%)]",
  crown: { src: "medallion", className: "-mb-4 w-[46%] mix-blend-screen" },
  lantern: null,
  storyCard: "center",
  portal: {
    crown: { src: "medallion", className: "-mb-5 w-[40%]" },
    side: { src: "featherSpray", className: "bottom-0 h-[62%] w-auto max-w-none", left: "left-[-8%]", right: "right-[-8%]", mirror: true },
  },
  copy: {
    salam: ["WRITTEN IN THE STARS", "WITH LOVE, WE INVITE YOU"],
    coupleKicker: "THE BRIDE & GROOM",
    coupleIntro: "Dengan memohon rahmat dan rida Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami",
    ampTag: "TWO STARS · ONE SKY",
    storyKicker: "OUR LOVE STORY",
    storyTitle: "Our Constellation",
    storySub: "Tiap bintang di langit ini menyimpan satu kenangan",
    eventsTitle: "The Celebration",
    eventsSub: "Mari melangkah menembus gerbang bintang",
    thanks: "WITH GRATITUDE",
    albumKicker: "OUR MEMORIES",
    albumTitle: "Love Album",
  },
});

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={8} />;
}

export const celestialNocturneDecor = { Backdrop, HeroScene, Section: SectionDecor, Global: GlobalDecor, Journey, Closing, skipOpening: true };

/* thumbnail katalog: lukisan komposisi desainer */
export function CelestialNocturneThumb() {
  return <img src={`${ASSET}/poster.webp`} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />;
}
