import React from "react";
import { motion } from "framer-motion";

/* ============================================================
   MOMENLABS KIT — MAKHLUK HIDUP (burung & kupu-kupu beranatomi)
   Dipakai bersama oleh template berbasis adegan.
   ============================================================ */

/* ============================================================
   BURUNG tampak samping (menghadap arah terbang): kepala & paruh,
   badan ramping dengan perut terang, ekor bercabang, dua sayap yang
   melengkung di pergelangan dengan bulu primer berjari. Sayap berputar
   di bahu (atas → bawah); sayap jauh sedikit tertinggal & lebih gelap.
   Mengepak beberapa kali lalu melayang, badan naik-turun mengikutinya.
   ============================================================ */

const r1 = (v) => Math.round(v * 10) / 10;

// sayap pada sudut theta (derajat, + = ke atas), dari bahu S, viewBox 0 0 120 60
function wingPath(theta, S = [66, 29], L = 50, chord = 13, bow = 5) {
  const t = (theta * Math.PI) / 180;
  const d = [-Math.cos(t), -Math.sin(t)];
  let n = [d[1], -d[0]];
  if (n[0] > 0) n = [-n[0], -n[1]]; // tepi belakang sayap selalu menghadap ekor
  const chordAt = (u) => chord * Math.pow(1 - u, 0.5) * (1 - 0.25 * Math.sin(Math.PI * u)) + 1.2;
  const lead = [];
  const trail = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    // melengkung ke depan di pergelangan, ujung tersapu ke belakang
    const arc = -bow * Math.sin(Math.PI * Math.min(1, u * 1.25)) + bow * 0.6 * u * u;
    const bx = S[0] + d[0] * L * u + n[0] * arc;
    const by = S[1] + d[1] * L * u + n[1] * arc;
    const c = chordAt(u);
    lead.push([bx - n[0] * c * 0.28, by - n[1] * c * 0.28]);
    const finger = u > 0.55 ? (i % 2 ? 0.55 : 1.05) : 1; // bulu primer berjari
    trail.push([bx + n[0] * c * 0.72 * finger, by + n[1] * c * 0.72 * finger]);
  }
  return "M" + [...lead, ...trail.reverse()].map(([x, y]) => `${r1(x)} ${r1(y)}`).join(" L") + " Z";
}

const BIRD_BODY = "M30 33 C 38 27.5, 56 25.5, 74 27.5 C 82 28.2, 87 26.6, 92 27.6 C 95.5 28.4, 97 30.2, 95.4 32 C 92.6 34.4, 86 35, 80 35.6 C 66 38.2, 46 39, 34 36.8 Z";
const BIRD_BELLY = "M44 36.6 C 56 37.8, 70 36.8, 82 34.6 C 76 37.6, 58 39.2, 44 36.6 Z";
const BIRD_BEAK = "M95.2 29.6 L 102 31 L 95.2 32.4 Z";
const BIRD_TAIL = "M33 33.4 L 14 28.6 L 22 34.4 L 12 39.6 L 33 36.6 Z";

// satu siklus: 3 kepakan (atas → bawah → atas) lalu melayang
const STROKE = [72, 40, 10, -20, -50, -20, 10, 40];
const CYCLE = [...STROKE, ...STROKE, ...STROKE, 72, 30, 12, 10, 12];
const WING_NEAR = CYCLE.map((a) => wingPath(a));
const WING_FAR = CYCLE.map((a) => wingPath(a - 12, [64, 28], 46, 12));
const CYCLE_TIMES = CYCLE.map((_, i) => (i < 24 ? (i / 24) * 0.62 : 0.62 + ((i - 24) / 4) * 0.38));

export function Bird({ size, tone, flap, delay, detail }) {
  const t = { duration: flap, times: CYCLE_TIMES, repeat: Infinity, ease: "linear", delay };
  return (
    <svg viewBox="0 0 120 60" style={{ width: size, overflow: "visible" }} aria-hidden="true">
      <motion.path fill={tone} opacity="0.7" initial={{ d: WING_FAR[0] }} animate={{ d: WING_FAR }} transition={{ ...t, delay: delay + 0.04 }} />
      <path d={BIRD_TAIL} fill={tone} />
      <path d={BIRD_BODY} fill={tone} />
      {detail && (
        <>
          <path d={BIRD_BELLY} fill="#B48A6A" opacity="0.55" />
          <path d={BIRD_BEAK} fill="#C9A06A" />
          <circle cx="91.6" cy="29.8" r="1" fill="#F3E2C8" />
        </>
      )}
      <motion.path fill={tone} initial={{ d: WING_NEAR[0] }} animate={{ d: WING_NEAR }} transition={t} />
    </svg>
  );
}

/* kawanan burung bawaan: makin jauh makin kecil, pucat & lambat (kedalaman) */
export const FLOCKS = [
  { top: 14, size: 16, tone: "rgba(92,66,58,0.55)", count: 5, duration: 46, delay: -8, rise: -4 },
  { top: 24, size: 24, tone: "rgba(70,48,40,0.78)", count: 4, duration: 32, delay: -20, rise: 6, reverse: true },
  { top: 9, size: 52, tone: "rgba(52,36,28,0.95)", count: 2, duration: 14, delay: 6, rise: -10, repeatDelay: 16, detail: true },
];

/* satu kawanan: { top (%), size (px), tone, count, duration, delay, rise, reverse, repeatDelay, detail } */
export function Flock({ flock }) {
  const { top, size, tone, count, duration, delay, rise, reverse, repeatDelay = 0, detail = false } = flock;
  const birds = Array.from({ length: count }, (_, i) => ({
    x: i * size * 1.25 + ((i * 37) % 11),
    y: (((i * 29) % 7) - 3) * size * 0.25 + (i % 2) * size * 0.3,
    flap: 2.4 + ((i * 7) % 5) * 0.18,
    s: 0.85 + ((i * 13) % 4) * 0.08,
  }));
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{ top: `${top}%`, scaleX: reverse ? -1 : 1 }}
      initial={{ x: reverse ? "120vw" : "-30vw", y: 0 }}
      animate={{ x: reverse ? ["120vw", "-30vw"] : ["-30vw", "120vw"], y: [0, rise * 0.5, rise, rise * 0.4] }}
      transition={{ duration, repeat: Infinity, delay, repeatDelay, ease: "linear" }}
    >
      {birds.map((b, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: b.x, top: b.y }}
          animate={{ y: [0, -size * 0.12, 0, -size * 0.12, 0, -size * 0.12, size * 0.06, 0], rotate: [0, -3, 0, -3, 0, -3, 2, 0] }}
          transition={{ duration: b.flap, times: [0, 0.1, 0.21, 0.31, 0.41, 0.52, 0.8, 1], repeat: Infinity, ease: "easeInOut", delay: i * 0.23 }}
        >
          <Bird size={size * b.s} tone={tone} flap={b.flap} delay={i * 0.23} detail={detail} />
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ============================================================
   KUPU-KUPU tampak atas: kepala, toraks berbulu, abdomen beruas,
   antena berujung gada. Sayap depan meruncing & sayap belakang
   membulat dipasang di toraks, berputar 3D pada sumbu badan; sayap
   belakang sedikit tertinggal. Pola: pangkal gelap, pita tepi gelap
   berbintik putih, bintik sel & mata di sayap belakang, urat sayap.
   Terbang berkelok dengan getaran naik-turun khas kupu-kupu.
   ============================================================ */

export const BUTTERFLIES = [
  { left: 16, top: 66, size: 40, a: "#FFE7BC", b: "#EE9D55", vein: "#5A3418", dur: 16, path: [[0, 0], [40, -60], [90, -30], [60, 30], [0, 0]] },
  { left: 68, top: 58, size: 34, a: "#FFEDE4", b: "#E2897A", vein: "#6A3028", dur: 19, path: [[0, 0], [-50, -40], [-90, 10], [-30, 40], [0, 0]] },
  { left: 42, top: 76, size: 30, a: "#F4F7FF", b: "#9DB4E2", vein: "#3C4866", dur: 14, path: [[0, 0], [30, -50], [-20, -90], [-40, -30], [0, 0]] },
  { left: 80, top: 40, size: 26, a: "#FFF4C8", b: "#E2B64A", vein: "#5E4818", dur: 21, path: [[0, 0], [-40, 30], [-20, 70], [20, 30], [0, 0]] },
];

const BF_FORE = "M0 -1 C 3 -9, 12 -17, 24 -19 C 30 -20, 33 -17, 32 -12 C 31 -7, 26 -2, 18 0 C 12 1.5, 5 1.5, 0 1 Z";
const BF_HIND = "M0 1.5 C 6 2, 16 4, 22 9 C 26 13, 24 19, 18 21 C 12 23, 6 18, 3 12 C 1.5 8, 0.5 4, 0 1.5 Z";
const BF_FORE_BAND = "M24 -19 C 30 -20, 33 -17, 32 -12 C 31 -7, 26 -2, 18 0 C 22 -4, 26 -8, 27 -12 C 28 -15, 27 -17.5, 24 -19 Z";
const BF_HIND_BAND = "M22 9 C 26 13, 24 19, 18 21 C 12 23, 6 18, 3 12 C 7 16, 12 19, 16 18.5 C 21 17.5, 23 13, 22 9 Z";
const BF_FORE_VEINS = "M1 0 C 8 -6, 16 -12, 24 -17 M1 0.5 C 10 -3, 20 -7, 30 -12 M1 0.8 C 9 0, 16 -0.5, 22 -1";
const BF_HIND_VEINS = "M1 2 C 8 4, 15 8, 21 12 M1 2.4 C 6 7, 11 13, 15 19 M1 2.6 C 3 8, 5 13, 7 16";

/* Kepakan dilihat dari atas: sayap "melipat" ke atas pada sumbu badan sehingga lebarnya
   menyempit (scaleX). Dua kepakan cepat lalu melayang dengan sayap terbuka; sayap
   belakang sedikit tertinggal dari sayap depan. */
const FLAP = [1, 0.16, 1, 0.2, 1, 0.92, 1];
const FLAP_T = [0, 0.14, 0.28, 0.42, 0.56, 0.78, 1];

// sepasang sayap (depan + belakang) di satu sisi; sisi kiri = cermin sisi kanan
function WingSide({ side, a, vein, grad, flapDur, delay }) {
  const t = { duration: flapDur, times: FLAP_T, repeat: Infinity, ease: "easeInOut" };
  return (
    <g transform={side < 0 ? "scale(-1 1)" : undefined}>
      <motion.g style={{ originX: 0, originY: 0.5 }} animate={{ scaleX: FLAP }} transition={{ ...t, delay: delay + flapDur * 0.06 }}>
        <path d={BF_HIND} fill={`url(#${grad})`} stroke={vein} strokeWidth="0.35" />
        <path d={BF_HIND_BAND} fill={vein} opacity="0.8" />
        <circle cx="17" cy="15" r="2" fill={vein} opacity="0.85" />
        <circle cx="17" cy="15" r="1.1" fill={a} />
        <circle cx="17.3" cy="14.7" r="0.4" fill="#FFFFFF" />
        <path d={BF_HIND_VEINS} stroke={vein} strokeWidth="0.25" opacity="0.6" fill="none" />
      </motion.g>
      <motion.g style={{ originX: 0, originY: 0.5 }} animate={{ scaleX: FLAP }} transition={{ ...t, delay }}>
        <path d={BF_FORE} fill={`url(#${grad})`} stroke={vein} strokeWidth="0.35" />
        <path d={BF_FORE_BAND} fill={vein} opacity="0.85" />
        <circle cx="29" cy="-14.5" r="0.8" fill="#FFFDF6" />
        <circle cx="27.5" cy="-8.5" r="0.7" fill="#FFFDF6" />
        <circle cx="25" cy="-4.5" r="0.6" fill="#FFFDF6" />
        <circle cx="14" cy="-8" r="1.3" fill={vein} opacity="0.7" />
        <path d={BF_FORE_VEINS} stroke={vein} strokeWidth="0.25" opacity="0.6" fill="none" />
      </motion.g>
    </g>
  );
}

// arah hadap tiap titik lintasan (derajat; 0 = kepala ke atas), dibatasi agar tidak berputar liar
function headings(path) {
  const out = path.map((p, i) => {
    const q = path[(i + 1) % path.length];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    if (!dx && !dy) return 0;
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return Math.max(-70, Math.min(70, deg));
  });
  out[out.length - 1] = out[0]; // lintasan melingkar: kembali ke hadap awal
  return out;
}

function Butterfly({ bf, index }) {
  const uid = React.useId().replace(/:/g, "");
  const grad = `bf-${uid}`;
  const flapDur = 0.62 + (index % 3) * 0.08; // satu siklus = 2 kepakan + melayang
  const xs = bf.path.map(([x]) => x);
  const ys = bf.path.map(([, y]) => y);
  return (
    <motion.div
      className="absolute"
      style={{ left: `${bf.left}%`, top: `${bf.top}%`, width: bf.size, height: bf.size * 0.67 }}
      animate={{ x: xs, y: ys, rotate: headings(bf.path) }}
      transition={{ duration: bf.dur, repeat: Infinity, ease: "easeInOut", delay: index * 1.3 }}
    >
      {/* naik sedikit tiap kepakan, turun pelan saat melayang */}
      <motion.svg
        viewBox="-36 -24 72 48"
        className="absolute inset-0 h-full w-full"
        style={{ overflow: "visible" }}
        animate={{ y: [0, -3, 0, -3, 0, 1.5, 0] }}
        transition={{ duration: flapDur, times: FLAP_T, repeat: Infinity, ease: "easeInOut", delay: index * 0.07 }}
      >
        <defs>
          <radialGradient id={grad} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(32)">
            <stop offset="0%" stopColor={bf.b} />
            <stop offset="75%" stopColor={bf.a} />
          </radialGradient>
        </defs>
        {[-1, 1].map((side) => (
          <WingSide key={side} side={side} a={bf.a} vein={bf.vein} grad={grad} flapDur={flapDur} delay={index * 0.07} />
        ))}
        {/* badan: antena bergada, kepala, toraks berbulu, abdomen beruas */}
        <path d="M-0.3 -2.6 Q -3 -9 -6 -12.5 M0.3 -2.6 Q 3 -9 6 -12.5" stroke="#3A2618" strokeWidth="0.45" fill="none" />
        <circle cx="-6" cy="-12.5" r="0.75" fill="#3A2618" />
        <circle cx="6" cy="-12.5" r="0.75" fill="#3A2618" />
        <circle cx="0" cy="-2.3" r="1.05" fill="#3A2618" />
        <ellipse cx="0" cy="0.5" rx="1.35" ry="2.1" fill="#4A3220" />
        <path d="M-0.95 2.4 C -0.95 6, -0.5 10, 0 12.5 C 0.5 10, 0.95 6, 0.95 2.4 Z" fill="#4A3220" />
        <path d="M-0.8 4.6 H0.8 M-0.75 6.8 H0.75 M-0.6 9 H0.6" stroke="#2A1A10" strokeWidth="0.25" />
      </motion.svg>
    </motion.div>
  );
}

export function Butterflies({ list = BUTTERFLIES }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {list.map((bf, i) => (
        <Butterfly key={i} bf={bf} index={i} />
      ))}
    </div>
  );
}

/* semua kawanan dalam satu lapisan */
export function Flocks({ list = FLOCKS }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {list.map((f, i) => (
        <Flock key={i} flock={f} />
      ))}
    </div>
  );
}
