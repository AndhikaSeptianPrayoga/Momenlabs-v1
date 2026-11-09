import React from "react";
import { motion } from "framer-motion";

/* ============================================================
   MOMENLABS KIT — PARTIKEL (kelopak, debu cahaya, bokeh)
   Warna diambil dari token tone (TONES[x].petals / .dust).
   ============================================================ */

const PETALS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 29 + 5) % 100,
  size: 8 + (i % 4) * 2,
  dur: 9 + (i % 5) * 1.7,
  delay: (i * 0.8) % 10,
  sway: (i % 2 ? 1 : -1) * (26 + (i % 3) * 16),
}));

/* kelopak berjatuhan; palette = { from: [warna...], to: warna ujung gradasi } */
export function Petals({ palette, fixed = false, count = 14 }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 z-20 overflow-hidden`}>
      {PETALS.slice(0, count).map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[60%_10%_60%_10%]"
          style={{
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size * 0.8,
            background: `linear-gradient(135deg, ${palette.from[i % palette.from.length]}, ${palette.to})`,
            boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
          }}
          animate={{ y: ["0vh", "110vh"], x: [0, p.sway, -p.sway / 2, p.sway / 3], rotate: [0, 200, 400], rotateX: [0, 180, 360] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "linear" }}
        />
      ))}
    </div>
  );
}

const DUST = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37 + 9) % 100,
  top: 20 + ((i * 29) % 75),
  size: 2 + (i % 3),
  dur: 6 + (i % 5) * 1.3,
  dx: (i % 2 ? 1 : -1) * (12 + (i % 4) * 8),
  dy: -(18 + (i % 5) * 10),
  delay: (i * 0.6) % 6,
}));

/* debu cahaya melayang; palette = { color, glow } */
export function Dust({ palette, count = 16 }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {DUST.slice(0, count).map((f, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: `${f.left}%`, top: `${f.top}%`, width: f.size, height: f.size, background: palette.color, boxShadow: `0 0 8px 2px ${palette.glow}` }}
          animate={{ x: [0, f.dx, 0], y: [0, f.dy, 0], opacity: [0, 1, 0.4, 1, 0] }}
          transition={{ duration: f.dur, repeat: Infinity, delay: f.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

const BOKEH = Array.from({ length: 8 }, (_, i) => ({
  left: (i * 41 + 7) % 96,
  top: 18 + ((i * 31) % 70),
  size: 40 + ((i * 23) % 70),
  o: 0.14 + (i % 3) * 0.06,
  dur: 14 + (i % 4) * 3,
  dx: (i % 2 ? 1 : -1) * (18 + (i % 3) * 10),
}));

/* bokeh cahaya lembut di depan lensa — menambah kedalaman */
export function Bokeh() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {BOKEH.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-[radial-gradient(closest-side,rgba(255,246,226,0.9),rgba(255,230,190,0.35)_60%,transparent)]"
          style={{ left: `${b.left}%`, top: `${b.top}%`, width: b.size, height: b.size }}
          animate={{ x: [0, b.dx, 0], y: [0, -24, 0], opacity: [b.o * 0.4, b.o, b.o * 0.4] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.9 }}
        />
      ))}
    </div>
  );
}
