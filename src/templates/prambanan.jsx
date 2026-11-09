import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { animate, motion, motionValue, useMotionValueEvent, useReducedMotion, useScroll, useTime, useTransform } from "framer-motion";
import { TONES, MOTION } from "../design/tokens.js";
import {
  Bird,
  Butterflies,
  CoverTitle,
  Dust,
  Flocks,
  GuestPanel,
  Petals,
  makeHeroScene,
  makeJourney,
  CAM,
  REST_TOP,
  aimRig,
  panShift,
  poseAt,
  snapRig,
  makeSectionDecor,
  requestTiltPermission,
  tiltX,
  tiltY,
  useStageBox,
  useTiltInput,
} from "../design/kit/index.js";
import { AURELIA_PHOTOS } from "./aurelia.jsx";

/* ============================================================
   MOMENLABS — TEMPLATE "SEKAR PRAMBANAN" (Adat Jawa, senja keemasan)
   ------------------------------------------------------------
   Pelataran candi saat senja, tersusun dari sprite utuh desainer
   (assets-src/sekar-prambanan/aset-taman-candi.png → scripts/prambanan-assets.cjs).
   Pengunjung diajak "masuk" ke dunianya:
     1. Cover — gapura candi bentar tertutup rapat, kamera menengadah
        ke langit senja, awan berarak, nama & tamu di atasnya.
     2. "Buka Undangan" — cahaya memancar dari celah gapura, kedua
        belahan bergeser ke sisi, kamera turun menatap candi, matahari
        tenggelam ke balik puncak candi, pelataran tersusun berpasangan,
        lentera menyala satu per satu.
     3. Kamera melangkah menembus gapura & kabut ke pelataran → nama muncul.

   Lapisan (belakang → depan):
     langit & matahari → pegunungan berkabut → awan → candi → pohon & tembok
     → mawar → air mancur → kolam teratai → pakis → teras batu & tangga
     → lentera → umbul-umbul → kabut → cahaya celah → gapura (kilau emas) → kawanan burung → gapura → bingkai pohon, rangkaian bunga & tanaman.

   Interaksi: parallax mouse/gyroscope, angin dari gerak kursor (pohon,
   bunga, umbul-umbul bergoyang), sentuh pohon → daun gugur, sentuh mawar
   → kelopak berhamburan, sentuh lentera → api berkobar, sentuh umbul-umbul
   → berkibar, sentuh tanaman → kupu-kupu terbang, sentuh air mancur →
   percikan air, sentuh kolam → riak & teratai berpendar, sentuh candi → pendar emas.
   Ambient: awan berarak, kabut lembah, sinar senja, semburan & tirai air,
   kilau kolam, kunang-kunang petang, burung pulang, kupu-kupu, daun gugur, debu emas.
   ============================================================ */

const ASSET = "/templates/sekar-prambanan";
const tone = TONES.javanese;
const ease = MOTION.ease;
const VP = { x: 50, y: 52 }; // titik hilang: pintu candi utama
const VP_CSS = `${VP.x}% ${VP.y}%`;
const HORIZON = 59; // % tinggi panggung: kaki pegunungan & tepi pelataran

/* nilai bersama cover, hero & latar agar transisi menyambung */
const LIVE = {
  gate: motionValue(1), // 0 gapura tertutup → 1 terbelah ke sisi
  descend: motionValue(1), // 0 menengadah ke langit → 1 menatap candi
  sun: motionValue(1), // 0 matahari tinggi → 1 tenggelam di balik candi
  build: motionValue(1), // 0 kosong → 1 pelataran tersusun
  dolly: motionValue(0), // 0 di depan gapura → 1 sudah di pelataran
};
const heroReveal = motionValue(1);
const wind = motionValue(0);

// nilai diam untuk thumbnail katalog (tanpa animasi pembukaan)
const STILL = { gate: motionValue(1), descend: motionValue(1), sun: motionValue(1), build: motionValue(1), dolly: motionValue(1) };
const STILL_CAM = { pan: motionValue(0), lift: motionValue(0), push: motionValue(0), dim: motionValue(0), dusk: motionValue(0) };

const Scene = createContext({ ...LIVE, cam: CAM, still: false });
const useScene = () => useContext(Scene);

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/* ---------- angin: menguat saat kursor bergerak cepat, lalu reda ---------- */

let windUsers = 0;
let windFrame = 0;
let lastMove = null;
const decay = () => {
  wind.set(wind.get() * 0.95);
  windFrame = wind.get() > 0.002 ? requestAnimationFrame(decay) : 0;
};
function gust(amount) {
  wind.set(Math.min(1, wind.get() + amount));
  if (!windFrame) windFrame = requestAnimationFrame(decay);
}
const onMove = (e) => {
  const now = performance.now();
  if (lastMove) {
    const dt = Math.max(8, now - lastMove.t);
    const speed = Math.hypot(e.clientX - lastMove.x, e.clientY - lastMove.y) / dt;
    if (speed > 0.6) gust(Math.min(0.25, (speed - 0.6) * 0.12));
  }
  lastMove = { x: e.clientX, y: e.clientY, t: now };
};
function useWind(enabled) {
  useEffect(() => {
    if (!enabled) return;
    if (windUsers++ === 0) window.addEventListener("pointermove", onMove);
    return () => {
      if (--windUsers === 0) window.removeEventListener("pointermove", onMove);
    };
  }, [enabled]);
}

/* ============================================================
   SUSUNAN SIMETRIS
   Panggung 9:16. x = tengah sprite (%), bottom/top = alas/puncak (%), w = lebar (%).
   Angka di LAYERS adalah posisi AKHIR (setelah kamera masuk); landed() menghitung
   balik posisi awalnya karena tiap lapisan membesar dari titik hilang.
   pair(): sisi kanan dicerminkan agar berpasangan sempurna.
   depth: geser parallax (px) & laju zoom saat kamera masuk.
   at: kapan muncul saat pelataran tersusun (0..1 dari build).
   Di HP 375×812 yang terlihat hanya ±82% bagian tengah panggung (x 9–91%).
   ============================================================ */

const pair = (item, xLeft) => [
  { ...item, x: xLeft },
  { ...item, x: 100 - xLeft, mirror: !item.mirror },
];

const zoomOf = (layer) => (layer.frame ? 0.08 : 0.05 + (layer.depth / 24) * 0.6);

function landed(item, s) {
  const out = { ...item, x: VP.x + (item.x - VP.x) / s, w: item.w / s };
  if (item.top != null) out.top = VP.y + (item.top - VP.y) / s;
  else out.bottom = 100 - (VP.y + (100 - item.bottom - VP.y) / s);
  return out;
}

/* candi menjulang di tengah dengan matahari di balik puncaknya; tembok & pohon
   mengapitnya; mawar, air mancur & kolam teratai mengisi pelataran; lentera &
   umbul-umbul mengapit jalan; tangga batu di kaki pengunjung; pohon besar,
   umbul-umbul gantung & rangkaian bunga membingkai sudut atas, semak & tanaman sudut bawah. */
const LAYERS = [
  { id: "temple", depth: 4, items: [{ name: "temple", x: 50, bottom: 40.5, w: 64, at: 0, tap: "glow" }] },
  { id: "walls", depth: 6, items: pair({ name: "wallTree", bottom: 39, w: 40, at: 0.06, sway: 0.35, tap: "tree" }, 12) },
  { id: "roses", depth: 9, items: pair({ name: "roseTree", bottom: 30.5, w: 29, at: 0.14, sway: 0.8, tap: "rose" }, 9) },
  {
    id: "court",
    depth: 11,
    items: [
      { name: "fountain", x: 50, bottom: 28, w: 38, at: 0.2, tap: "fountain", water: true },
      ...pair({ name: "pond", bottom: 23, w: 58, at: 0.26, tap: "pond", pond: true }, 29),
    ],
  },
  { id: "ferns", depth: 12, items: pair({ name: "fern", bottom: 23.5, w: 17, at: 0.32, sway: 0.7, tap: "plant" }, 29) },
  // teras batu & tangga di kaki pengunjung: lantai basah memantulkan cahaya senja; lentera & umbul-umbul berdiri di atasnya
  { id: "terrace", depth: 14, items: [{ name: "terrace", x: 50, bottom: -3, w: 112, at: 0.36, tap: "floor", floor: true }] },
  { id: "lanterns", depth: 15, items: pair({ name: "shrine", bottom: 11, w: 14, at: 0.4, tap: "lamp", lamp: true }, 31) },
  { id: "pennants", depth: 17, items: pair({ name: "pennant", bottom: 12, w: 4.5, at: 0.46, sway: 0.5, flutter: true, tap: "banner", origin: "50% 100%" }, 39) },
  {
    id: "frame",
    depth: 24,
    frame: true,
    items: [
      ...pair({ name: "tree", bottom: 51, w: 60, at: 0.56, sway: 1.1, origin: "25% 100%", tap: "tree" }, 9),
      ...pair({ name: "banner", top: 21, w: 12, at: 0.62, sway: 1.6, flutter: true, tap: "banner", origin: "50% 0%" }, 24),
      ...pair({ name: "garland", top: 14, w: 17, at: 0.64, sway: 1, origin: "50% 0%", tap: "rose" }, 3),
      ...pair({ name: "bush", bottom: -4, w: 36, at: 0.68, sway: 0.6, tap: "plant" }, 6),
      ...pair({ name: "plant", bottom: -6, w: 30, at: 0.72, sway: 0.8, tap: "plant" }, 24),
    ],
  },
].map((layer) => ({ ...layer, items: layer.items.map((it) => landed(it, 1 + zoomOf(layer))) }));

/* ---------- langit senja, matahari, pegunungan berkabut & awan berarak ---------- */

/* ============================================================
   LANGIT — lukisan langit senja desainer (sky.webp, 2:3) yang dihidupkan:
     · kamera "Ken Burns" — langit perlahan membesar & bergeser,
     · matahari lukisan ikut tenggelam saat undangan dibuka,
     · pendar, sinar & kilau bintang tepat di cakram matahari lukisan,
     · kilau cahaya menyapu tepi awan, kabut tipis & awan depan yang berarak
       (parallax), bintang pertama saat senja berganti malam.
   Lukisan selebar 120% panggung dari 42% di atas panggung sampai cakrawala.
   ============================================================ */

const SKY_W = 120; // % lebar panggung
const SKY_TOP = -42; // % tinggi panggung
const SKY_H = SKY_W * 1.5 * (9 / 16); // tinggi lukisan dalam % tinggi panggung (rasio 2:3, panggung 9:16)
// cakram matahari di lukisan: (73%, 74.5%) gambar → koordinat panggung
const SUN_X = (100 - SKY_W) / 2 + 0.73 * SKY_W;
const SUN_Y = SKY_TOP + 0.745 * SKY_H;

const GOLD = "saturate(1.2) brightness(1.06)";
// awan depan yang berarak di atas lukisan agar langit terasa bergerak & berlapis
const CLOUDS = [
  { src: "cloud", top: -6, w: 70, dur: 150, delay: -40, o: 0.38, depth: 1.2, tint: GOLD },
  { src: "cloudSmall", top: 12, w: 36, dur: 110, delay: -80, o: 0.42, depth: 1.8, tint: GOLD, mirror: true },
  { src: "cloud", top: 26, w: 56, dur: 120, delay: -15, o: 0.45, depth: 2.4, tint: GOLD, mirror: true },
  { src: "cloudSmall", top: 38, w: 30, dur: 90, delay: -55, o: 0.5, depth: 2.8, tint: GOLD },
];

// bintang pertama di puncak langit (makin terang saat senja berganti malam)
const STARS = Array.from({ length: 22 }, (_, i) => ({ x: (i * 37 + 7) % 100, y: -40 + ((i * 23) % 26), s: 1 + (i % 3) * 0.6, d: 2 + (i % 5) * 0.7 }));

function Sky() {
  const { sun, dolly, still, cam } = useScene();
  const x = useTransform([tiltX, cam.pan], ([v, p]) => `calc(${-v * 2.5}px + ${-p * panShift(0)}%)`);
  const y = useTransform(tiltY, (v) => -v * 2);
  const scale = useTransform([dolly, cam.push], ([d, p]) => (1 + d * 0.04) * (1 + p * 0.08));
  // matahari tenggelam: seluruh lukisan turun pelan saat undangan dibuka
  const sink = useTransform(sun, (s) => `${(s - 1) * 9}%`);
  const warm = useTransform(sun, (s) => 0.12 + s * 0.22);
  const pale = useTransform(sun, (s) => (1 - s) * 0.28);
  const starO = useTransform([sun, cam.dusk], ([s, n]) => 0.1 + s * 0.2 + n * 0.7);
  const sunPos = { left: `${SUN_X}%`, top: `${SUN_Y}%` };
  return (
    <motion.div className="absolute inset-0" style={{ x, y, scale, transformOrigin: VP_CSS }}>
      <motion.div className="absolute inset-0" style={{ y: sink }}>
        {/* lukisan langit + gerak kamera pelan (membesar & bergeser) */}
        <motion.div
          className="absolute"
          style={{ left: `${(100 - SKY_W) / 2}%`, top: `${SKY_TOP}%`, width: `${SKY_W}%`, height: `${SKY_H}%`, transformOrigin: "73% 74.5%" }}
          animate={still ? undefined : { scale: [1, 1.06, 1], x: ["0%", "-1.5%", "0%"] }}
          transition={{ duration: 48, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src={`${ASSET}/sky.webp`} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none" />
          {/* kilau cahaya menyapu tepi awan (diagonal dari arah matahari) */}
          {!still && (
            <motion.div
              className="absolute inset-0 mix-blend-soft-light"
              style={{ backgroundImage: "linear-gradient(120deg, transparent 35%, rgba(255,236,190,0.9) 48%, rgba(255,214,150,0.6) 52%, transparent 65%)", backgroundSize: "250% 250%" }}
              initial={{ backgroundPosition: "100% 100%" }}
              animate={{ backgroundPosition: ["110% 110%", "-10% -10%"] }}
              transition={{ duration: 14, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
            />
          )}
        </motion.div>
        {/* sebelum senja: langit sedikit lebih pucat; setelahnya rona keemasan menghangat */}
        <motion.div className="absolute inset-x-0 h-[102%] bg-[linear-gradient(180deg,rgba(120,130,170,0.6),rgba(240,220,200,0.2))]" style={{ top: `${SKY_TOP}%`, opacity: pale }} />
        <motion.div className="absolute inset-x-0 h-[102%] mix-blend-soft-light bg-[linear-gradient(180deg,rgba(170,110,150,0.5),rgba(255,190,110,0.45)_70%,rgba(255,224,160,0.55))]" style={{ top: `${SKY_TOP}%`, opacity: warm }} />
        {/* bintang pertama */}
        <motion.div className="absolute inset-0" style={{ opacity: starO }}>
          {STARS.map((s, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-[#FFF6E0] shadow-[0_0_6px_1px_rgba(255,240,210,0.8)]"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s * 2, height: s.s * 2 }}
              animate={still ? undefined : { opacity: [0.3, 1, 0.3] }}
              transition={{ duration: s.d, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            />
          ))}
        </motion.div>
        {/* matahari lukisan: pendar besar berdenyut, sinar berputar pelan, bintang cahaya */}
        <motion.div
          className="absolute aspect-square w-[150%] rounded-full bg-[radial-gradient(closest-side,rgba(255,236,180,0.6),rgba(255,180,100,0.28)_32%,rgba(230,120,70,0.1)_60%,transparent)] mix-blend-screen"
          style={{ ...sunPos, x: "-50%", y: "-50%" }}
          animate={still ? undefined : { opacity: [0.75, 1, 0.75], scale: [1, 1.06, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        {!still && (
          <>
            <motion.div className="absolute aspect-square w-[140%] mix-blend-screen" style={{ ...sunPos, x: "-50%", y: "-50%" }} animate={{ rotate: 360 }} transition={{ duration: 140, repeat: Infinity, ease: "linear" }}>
              <div className="h-full w-full rounded-full bg-[repeating-conic-gradient(from_0deg,rgba(255,232,180,0.22)_0deg_2.5deg,transparent_2.5deg_11deg)] [mask-image:radial-gradient(closest-side,#000_6%,transparent_72%)]" />
            </motion.div>
            <motion.div className="absolute aspect-square w-[110%] mix-blend-screen" style={{ ...sunPos, x: "-50%", y: "-50%" }} animate={{ rotate: -360 }} transition={{ duration: 200, repeat: Infinity, ease: "linear" }}>
              <div className="h-full w-full rounded-full bg-[repeating-conic-gradient(from_5deg,rgba(255,220,160,0.16)_0deg_4deg,transparent_4deg_19deg)] [mask-image:radial-gradient(closest-side,#000_6%,transparent_65%)]" />
            </motion.div>
            {/* bintang cahaya (starburst) di cakram matahari */}
            <motion.div className="absolute w-[34%] mix-blend-screen" style={{ ...sunPos, x: "-50%", y: "-50%" }} animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.08, 0.95] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
              <div className="h-[3px] w-full rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,250,230,0.95),transparent)]" />
              <div className="absolute left-1/2 top-1/2 h-[3px] w-[60%] -translate-x-1/2 -translate-y-1/2 rotate-90 rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,250,230,0.8),transparent)]" />
            </motion.div>
          </>
        )}
        {/* kabut tipis berlapis yang melayang di depan lukisan */}
        {!still &&
          [
            [18, 0.35, 70],
            [34, 0.3, 90],
            [48, 0.4, 60],
          ].map(([top, o, dur], i) => (
            <motion.div
              key={`h${i}`}
              className="absolute left-[-40%] h-[10%] w-[180%] blur-[10px] bg-[radial-gradient(40%_50%_at_30%_50%,rgba(255,232,200,0.9),transparent_70%),radial-gradient(35%_50%_at_75%_50%,rgba(255,210,170,0.8),transparent_70%)]"
              style={{ top: `${top}%`, opacity: o }}
              animate={{ x: i % 2 ? ["5%", "-5%", "5%"] : ["-5%", "5%", "-5%"] }}
              transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
      </motion.div>
      {/* awan depan berarak (lebih dekat dari lukisan, bergerak lebih cepat) */}
      {CLOUDS.map((c, i) => (
        <Cloud key={i} c={c} still={still} />
      ))}
      <Mountains still={still} />
    </motion.div>
  );
}

function Cloud({ c, still }) {
  const x = useTransform(tiltX, (v) => -v * c.depth * 3);
  return (
    <motion.div className="absolute left-0" style={{ top: `${c.top}%`, width: `${c.w}%`, x, opacity: c.o }}>
      <motion.img
        src={`${ASSET}/${c.src}.webp`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="block w-full select-none"
        style={{ scaleX: c.mirror ? -1 : 1, filter: c.tint }}
        initial={{ x: "-30%" }}
        animate={still ? { x: "40%" } : { x: ["-70%", "160%"] }}
        transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}

/* tiga punggung gunung berlapis kabut di cakrawala (makin jauh makin pucat) */
const RIDGES = [
  { d: "M0 62 C10 52 18 48 28 54 C36 44 46 40 56 50 C66 42 78 38 88 48 C94 44 98 46 100 48 L100 100 L0 100 Z", fill: "rgba(200,128,100,0.55)", top: 44 },
  { d: "M0 70 C8 60 20 56 30 64 C40 54 52 52 62 60 C72 52 84 54 92 60 C96 58 100 60 100 60 L100 100 L0 100 Z", fill: "rgba(150,88,70,0.7)", top: 48 },
  { d: "M0 80 C12 70 24 68 36 74 C46 68 58 66 70 72 C80 66 90 68 100 74 L100 100 L0 100 Z", fill: "rgba(100,58,44,0.85)", top: 52 },
];

function Mountains({ still }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {RIDGES.map((r, i) => (
        <svg key={i} viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-[-5%] w-[110%]" style={{ top: `${r.top}%`, height: `${HORIZON - r.top + 3}%` }}>
          <path d={r.d} fill={r.fill} />
        </svg>
      ))}
      {/* kabut lembah melayang di kaki gunung */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute left-[-40%] h-[9%] w-[180%] bg-[radial-gradient(40%_50%_at_30%_50%,rgba(255,226,190,0.8),transparent_70%),radial-gradient(35%_50%_at_72%_50%,rgba(255,214,170,0.7),transparent_70%)]"
          style={{ top: `${51 + i * 4}%` }}
          animate={still ? undefined : { x: i ? ["6%", "-6%", "6%"] : ["-6%", "6%", "-6%"], opacity: [0.6, 0.95, 0.6] }}
          transition={{ duration: 30 + i * 12, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ---------- pelataran candi: rumput keemasan & jalan batu menuju candi ---------- */

function Ground() {
  const { dolly, still, cam } = useScene();
  const x = useTransform([tiltX, cam.pan], ([v, p]) => `calc(${-v * 6}px + ${-p * panShift(0.4)}%)`);
  const y = useTransform(tiltY, (v) => -v * 4);
  const scale = useTransform([dolly, cam.push], ([d, p]) => (1 + d * 0.24) * (1 + p * 0.7));
  return (
    <motion.div className="absolute inset-0" style={{ x, y, scale, transformOrigin: VP_CSS }}>
      <div className="absolute inset-x-[-10%] bottom-[-10%] bg-[linear-gradient(180deg,#8E8A48_0%,#6E6E30_20%,#545424_48%,#2E2A12_100%)]" style={{ top: `${HORIZON - 1}%` }} />
      {/* rumput berbintik cahaya senja */}
      <div
        className="absolute inset-x-[-10%] bottom-[-10%] opacity-60 [background-image:radial-gradient(rgba(255,226,150,0.35)_1px,transparent_1.5px),radial-gradient(rgba(40,40,10,0.35)_1px,transparent_1.5px)] [background-position:0_0,6px_5px] [background-size:12px_10px,14px_12px]"
        style={{ top: `${HORIZON}%` }}
      />
      {/* jalan batu berperspektif dari kaki tangga ke pintu candi */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full" style={{ height: `${100 - HORIZON + 1}%` }}>
        <defs>
          <linearGradient id="sp-path" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#B8946A" />
            <stop offset="1" stopColor="#5E4428" />
          </linearGradient>
        </defs>
        <polygon points="44,0 56,0 82,100 18,100" fill="url(#sp-path)" />
        {Array.from({ length: 9 }, (_, i) => {
          const t = ((i + 1) / 10) ** 1.6;
          return <line key={i} x1={44 - 26 * t} x2={56 + 26 * t} y1={t * 100} y2={t * 100} stroke="rgba(80,50,24,0.35)" strokeWidth="0.5" />;
        })}
      </svg>
      {/* pantulan senja di jalan batu */}
      <motion.div
        className="absolute left-1/2 h-[30%] w-[30%] -translate-x-1/2 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(255,214,140,0.5),transparent_80%)]"
        style={{ top: `${HORIZON}%` }}
        animate={still ? undefined : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* kabut cakrawala menyatukan kaki gunung & pelataran */}
      <div className="absolute inset-x-0 h-[10%] bg-[linear-gradient(180deg,transparent,rgba(255,220,170,0.45)_45%,transparent)]" style={{ top: `${HORIZON - 7}%` }} />
    </motion.div>
  );
}

/* kabut keemasan tipis yang melayang di atas pelataran */
function Mist() {
  const { still } = useScene();
  if (still) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {[
        ["top-[55%]", "h-[9%]", 42, 0.5],
        ["top-[64%]", "h-[8%]", 56, 0.35],
        ["top-[76%]", "h-[10%]", 66, 0.22],
      ].map(([top, h, dur, op], i) => (
        <motion.div
          key={i}
          className={`absolute left-[-50%] w-[200%] ${top} ${h} bg-[radial-gradient(50%_50%_at_30%_50%,rgba(255,236,200,0.9),transparent_70%),radial-gradient(40%_50%_at_75%_50%,rgba(255,222,176,0.8),transparent_70%)]`}
          style={{ opacity: op }}
          animate={{ x: i % 2 ? ["8%", "-8%", "8%"] : ["-8%", "8%", "-8%"] }}
          transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ---------- sentuhan sadar-transparansi ----------
   Sprite yang kotaknya bertumpuk diperiksa dari depan ke belakang; yang dipilih
   adalah yang pikselnya benar-benar tidak transparan. Tidak kena sprite → lantai. */

const tapHandlers = new WeakMap();
const alphaCache = new Map();

function alphaAt(img, u, v) {
  let a = alphaCache.get(img.src);
  if (!a) {
    if (!img.complete || !img.naturalWidth) return 255;
    const w = Math.min(256, img.naturalWidth);
    const h = Math.round((w / img.naturalWidth) * img.naturalHeight);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0, w, h);
    a = { w, h, data: g.getImageData(0, 0, w, h).data };
    alphaCache.set(img.src, a);
  }
  const x = Math.min(a.w - 1, Math.max(0, Math.floor(u * a.w)));
  const y = Math.min(a.h - 1, Math.max(0, Math.floor(v * a.h)));
  return a.data[(y * a.w + x) * 4 + 3];
}

function tapAt(e, onFloor) {
  for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
    const fn = el.tagName === "IMG" && tapHandlers.get(el);
    if (!fn) continue;
    const r = el.getBoundingClientRect();
    let u = (e.clientX - r.left) / r.width;
    if (el.dataset.mirror) u = 1 - u;
    if (alphaAt(el, u, (e.clientY - r.top) / r.height) > 40) {
      fn(e);
      return;
    }
  }
  onFloor(e);
}

/* ---------- air mancur: semburan, tirai air & riak (di atas sprite air mancur) ---------- */

// [tepi tingkat (y %), x kiri %, x kanan %, jatuh sampai (y %)] dalam kotak sprite air mancur
const TIERS = [
  [16, 40, 60, 25],
  [33, 26, 74, 46],
  [52, 14, 86, 70],
];

function FountainWater({ splash }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      {/* semburan di puncak */}
      <motion.ellipse cx="50" cy="2" rx="1.4" fill="rgba(240,248,255,0.75)" initial={{ ry: 4 }} animate={{ ry: [4, 7, 4], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }} />
      {[-1, 1].map((s) => (
        <motion.path
          key={s}
          d={`M50 2 Q ${50 + s * 6} -6 ${50 + s * 11} 14`}
          fill="none"
          stroke="rgba(240,248,255,0.7)"
          strokeWidth="0.7"
          strokeDasharray="3 4"
          animate={{ strokeDashoffset: [0, -14] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
        />
      ))}
      {/* tirai air tiap tingkat */}
      {TIERS.flatMap(([y0, xl, xr, y1], t) =>
        Array.from({ length: 8 }, (_, i) => {
          const x = xl + ((xr - xl) * i) / 7;
          const out = (x - 50) * 0.06;
          return (
            <motion.path
              key={`${t}-${i}`}
              d={`M ${x} ${y0} Q ${x + out * 0.5} ${y0 + 3} ${x + out} ${y1}`}
              fill="none"
              stroke="rgba(240,248,255,0.7)"
              strokeWidth="0.55"
              strokeLinecap="round"
              strokeDasharray="2.5 3.5"
              animate={{ strokeDashoffset: [0, -12] }}
              transition={{ duration: 0.45 + (i % 3) * 0.08, repeat: Infinity, ease: "linear" }}
            />
          );
        })
      )}
      {/* riak di kolam bawah */}
      {[0, 1, 2].map((i) => (
        <motion.ellipse
          key={`r${i}`}
          cx="50"
          cy="88"
          fill="none"
          stroke="rgba(255,246,230,0.6)"
          strokeWidth="0.5"
          initial={{ rx: 8, ry: 1.5, opacity: 0.7 }}
          animate={{ rx: [8, 40], ry: [1.5, 6], opacity: [0.7, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: i * 1.05, ease: "easeOut" }}
        />
      ))}
      {/* percikan saat disentuh */}
      {splash > 0 &&
        Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI - Math.PI;
          return (
            <motion.circle
              key={`${splash}-${i}`}
              r="1"
              fill="rgba(235,246,255,0.95)"
              initial={{ cx: 50, cy: 6, opacity: 1 }}
              animate={{ cx: 50 + Math.cos(a) * (20 + (i % 4) * 8), cy: [6, 6 + Math.sin(a) * 18, 40 + (i % 3) * 12], opacity: [1, 1, 0] }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          );
        })}
    </svg>
  );
}

/* ---------- kolam teratai: kilau berkedip & teratai mengangguk ---------- */

const POND_GLINTS = Array.from({ length: 9 }, (_, i) => ({ x: 30 + ((i * 23) % 60), y: 30 + ((i * 17) % 50), w: 6 + (i % 3) * 4, dur: 2.2 + (i % 4) * 0.6 }));

function PondLife({ still, bloom }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {!still &&
        POND_GLINTS.map((g, i) => (
          <motion.span
            key={i}
            className="absolute h-[3%] rounded-full bg-[radial-gradient(closest-side,rgba(255,244,214,0.95),transparent)]"
            style={{ left: `${g.x}%`, top: `${g.y}%`, width: `${g.w}%` }}
            animate={{ opacity: [0, 0.9, 0], x: ["-30%", "30%"] }}
            transition={{ duration: g.dur, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          />
        ))}
      {bloom > 0 && (
        <motion.span
          key={bloom}
          className="absolute left-[60%] top-[40%] aspect-square w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,190,210,0.9),rgba(255,150,180,0.3)_45%,transparent)]"
          initial={{ opacity: 1, scale: 0.4 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
      )}
    </div>
  );
}

/* ---------- kilau senja yang berkedip di lantai batu basah (bagian bawah sprite teras) ---------- */

const FLOOR_GLINTS = [
  [18, 66, 12], [34, 74, 9], [50, 63, 14], [66, 72, 10], [82, 67, 12], [28, 86, 11], [72, 88, 11], [50, 82, 16],
];

function FloorGlints() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {FLOOR_GLINTS.map(([x, y, w], i) => (
        <motion.span
          key={i}
          className="absolute h-[3%] rounded-full bg-[radial-gradient(closest-side,rgba(255,236,190,0.95),transparent)] mix-blend-screen"
          style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, x: "-50%" }}
          animate={{ opacity: [0, 0.85, 0], scaleX: [0.6, 1.2, 0.6] }}
          transition={{ duration: 2.4 + (i % 3) * 0.7, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ---------- sprite: muncul berpasangan, bergoyang angin, bisa disentuh ---------- */

function Sprite({ item, index, onAction }) {
  const { build, sun, still } = useScene();
  const time = useTime();
  const [hit, setHit] = useState(0);
  const pos = {
    left: `${item.x}%`,
    width: `${item.w}%`,
    ...(item.top != null ? { top: `${item.top}%` } : { bottom: `${item.bottom}%` }),
  };
  const k = useTransform(build, (b) => clamp01((b - item.at) / 0.26));
  const scale = useTransform(k, (v) => 0.9 + v * 0.1);
  const y = useTransform(k, (v) => (1 - v) * (item.top != null ? -24 : 24));
  const phase = index * 1.7;
  const rotate = useTransform([time, wind], ([t, w]) => {
    if (!item.sway || still) return 0;
    const s = t / 1000;
    return Math.sin(s * 0.55 + phase) * item.sway * 0.6 + Math.sin(s * 2.3 + phase) * item.sway * (0.15 + w * 1.6);
  });
  // kain umbul-umbul berkibar: melengkung pelan, makin kuat saat berangin
  const skewY = useTransform([time, wind], ([t, w]) => {
    if (!item.flutter || still) return 0;
    const s = t / 1000;
    return Math.sin(s * 1.7 + phase) * (1.2 + w * 4) + Math.sin(s * 4.1 + phase) * (0.4 + w * 1.5);
  });
  const origin = item.origin ?? (item.top != null ? "50% 0%" : "50% 100%");

  const onTap = (e) => {
    setHit((g) => g + 1);
    onAction?.(item, e);
  };
  const active = hit > 0;
  const register = (el) => {
    if (el && item.tap) tapHandlers.set(el, onTap);
  };
  const wobble = item.tap === "tree" || item.tap === "plant" || item.tap === "rose";

  return (
    <div className="absolute" style={{ ...pos, transform: `translateX(-50%)${item.mirror ? " scaleX(-1)" : ""}` }}>
      <motion.div style={{ opacity: k, scale, y, transformOrigin: origin }}>
        <motion.div className="relative" style={{ rotate, skewY, transformOrigin: origin }}>
          {item.lamp && <LampGlow flare={hit} still={still} sun={sun} />}
          <motion.img
            key={hit}
            src={`${ASSET}/${item.name}.webp`}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`relative block w-full select-none ${item.tap && !still ? "pointer-events-auto cursor-pointer" : "pointer-events-none"}`}
            style={{ transformOrigin: origin }}
            ref={register}
            data-mirror={item.mirror ? "1" : undefined}
            initial={active ? { filter: "drop-shadow(0 0 18px rgba(255,206,110,0.95))" } : false}
            animate={{
              filter: "drop-shadow(0 6px 10px rgba(30,16,4,0.3))",
              scale: active ? [1, 1.05, 1] : 1,
              rotate: active && wobble ? [0, -2.5, 2, -1, 0] : 0,
              skewY: active && item.tap === "banner" ? [0, 7, -6, 4, -2, 0] : 0,
            }}
            transition={{ duration: item.tap === "banner" ? 1.6 : 0.9, ease: "easeOut" }}
          />
          {item.water && !still && <FountainWater splash={hit} />}
          {item.pond && <PondLife still={still} bloom={hit} />}
          {item.floor && !still && <FloorGlints />}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* api lentera: menyala saat matahari tenggelam, berkedip, berkobar saat disentuh
   (jendela lampu di 46% tinggi sprite lentera) */
function LampGlow({ flare, still, sun }) {
  const lit = useTransform(sun, (s) => clamp01((s - 0.35) / 0.5));
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: lit }}>
      <motion.div
        className="absolute left-1/2 top-[46%] aspect-square w-[240%] rounded-full bg-[radial-gradient(closest-side,rgba(255,220,140,0.75),rgba(255,160,60,0.25)_40%,transparent)]"
        style={{ x: "-50%", y: "-50%" }}
        animate={still ? undefined : { opacity: [0.55, 0.9, 0.65, 1, 0.6], scale: [1, 1.05, 0.97, 1.03, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {flare > 0 && (
        <motion.div
          key={flare}
          className="absolute left-1/2 top-[46%] aspect-square w-[480%] rounded-full bg-[radial-gradient(closest-side,rgba(255,240,190,0.95),rgba(255,170,70,0.4)_45%,transparent)]"
          style={{ x: "-50%", y: "-50%" }}
          initial={{ opacity: 1, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}

function Layer({ layer, cam, onAction }) {
  const { dolly, cam: rig } = useScene();
  const k = layer.depth / 24;
  const x = useTransform([tiltX, rig.pan], ([v, p]) => `calc(${-v * layer.depth}px + ${-p * panShift(k)}%)`);
  const y = useTransform(tiltY, (v) => -v * layer.depth * 0.6);
  const zoom = zoomOf(layer);
  const scale = useTransform([cam, dolly, rig.push], ([c, d, p]) => (1 + d * zoom) * (1 + c * (0.04 + k * 0.12)) * (1 + p * (0.12 + k * 1.4)));
  const opacity = useTransform(rig.push, (p) => (k > 0.5 ? 1 - clamp01((p - 0.35) / 0.4) : 1));
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
  return (
    <motion.div className="absolute inset-0 will-change-transform" style={{ x, y, scale, opacity, visibility, transformOrigin: VP_CSS }}>
      {layer.items.map((item, i) => (
        <Sprite key={`${item.name}-${i}`} item={item} index={i + layer.depth} onAction={onAction} />
      ))}
    </motion.div>
  );
}

/* ============================================================
   GAPURA CANDI BENTAR
   Dua belahan gapura (sprite yang sama, sisi kanan dicerminkan) berdiri rapat di
   tengah saat cover dengan celah sempit — seperti candi bentar sungguhan — yang
   memancarkan cahaya senja dari pelataran. Saat dibuka, cahaya itu melebar, kedua
   belahan bergeser ke sisi lalu tetap berdiri membingkai pelataran; saat kamera
   melangkah masuk, gapura membesar & menyingkir melewati pengunjung.
   ============================================================ */

const DOOR_H = 62; // % tinggi panggung
const DOOR_BOTTOM = 10.5; // berdiri di atas tangga depan
const GAP = 3.4; // % lebar: celah sempit di antara kedua belahan saat cover
const DOOR_OPEN = 38; // % lebar: geser tiap belahan saat terbuka

function GateDoors() {
  const { gate, dolly, cam: rig, still } = useScene();
  const k = 22 / 24;
  const shift = useTransform([gate, tiltX, rig.pan], ([g, v, p]) => ({ g, v, p }));
  const xL = useTransform(shift, ({ g, v, p }) => `calc(${-g * DOOR_OPEN}% + ${-v * 22}px + ${-p * panShift(k)}%)`);
  const xR = useTransform(shift, ({ g, v, p }) => `calc(${g * DOOR_OPEN}% + ${-v * 22}px + ${-p * panShift(k)}%)`);
  const scale = useTransform([dolly, rig.push], ([d, p]) => (1 + d * 0.4) * (1 + p * 1.6));
  const opacity = useTransform([dolly, rig.push], ([d, p]) => 1 - clamp01((d - 0.7) / 0.3) * 0.15 - clamp01((p - 0.3) / 0.4));
  // cahaya dari celah gapura: memuncak saat baru terbelah
  const beam = useTransform(gate, (g) => (g < 0.35 ? g / 0.35 : 1 - clamp01((g - 0.35) / 0.55)));
  const beamW = useTransform(gate, (g) => `${8 + g * 70}%`);
  const shade = useTransform(gate, (g) => 1 - g * 0.6);
  // garis cahaya di celah: berdenyut saat cover, larut ke pancaran lebar saat terbuka
  const slit = useTransform(gate, (g) => 1 - clamp01(g * 2.5));
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ scale, opacity, transformOrigin: VP_CSS }}>
      {/* bayangan di lantai */}
      <motion.div
        className="absolute left-1/2 h-[5%] w-[90%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(30,14,4,0.6),transparent)]"
        style={{ bottom: `${DOOR_BOTTOM - 2.5}%`, opacity: shade }}
      />
      <motion.div className="absolute left-1/2 w-[7%] -translate-x-1/2" style={{ bottom: `${DOOR_BOTTOM}%`, height: `${DOOR_H * 0.9}%`, opacity: slit }}>
        <motion.div
          className="h-full w-full bg-[radial-gradient(50%_55%_at_50%_62%,rgba(255,250,228,1),rgba(255,222,150,0.85)_38%,rgba(255,180,90,0.3)_70%,transparent)] blur-[2px]"
          animate={still ? undefined : { opacity: [0.75, 1, 0.75], scaleX: [0.9, 1.15, 0.9] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      {!still && (
        <motion.div
          className="absolute left-1/2 h-[80%] -translate-x-1/2 bg-[radial-gradient(50%_60%_at_50%_70%,rgba(255,246,214,0.95),rgba(255,214,150,0.5)_45%,transparent_75%)] mix-blend-screen"
          style={{ bottom: `${DOOR_BOTTOM}%`, width: beamW, opacity: beam }}
        />
      )}
      <Door still={still} style={{ right: `${50 + GAP / 2}%`, x: xL }} />
      <Door still={still} style={{ left: `${50 + GAP / 2}%`, x: xR, scaleX: -1 }} />
    </motion.div>
  );
}

/* satu belahan gapura + kilau emas yang sesekali menyapu batunya (dibentuk persis
   mengikuti siluet gapura lewat mask gambar yang sama) */
const GATE_RATIO = "488 / 1016";
function Door({ style, still }) {
  const mask = { WebkitMaskImage: `url(${ASSET}/gateL.webp)`, maskImage: `url(${ASSET}/gateL.webp)`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };
  return (
    <motion.div className="absolute" style={{ height: `${DOOR_H}%`, aspectRatio: GATE_RATIO, bottom: `${DOOR_BOTTOM}%`, ...style }}>
      <img src={`${ASSET}/gateL.webp`} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
      {!still && (
        <motion.div
          className="absolute inset-0 mix-blend-screen"
          style={{ ...mask, backgroundImage: "linear-gradient(105deg, transparent 38%, rgba(255,226,160,0.0) 42%, rgba(255,236,190,0.75) 50%, rgba(255,226,160,0.0) 58%, transparent 62%)", backgroundSize: "260% 100%" }}
          initial={{ backgroundPosition: "160% 0%" }}
          animate={{ backgroundPosition: ["160% 0%", "-60% 0%"] }}
          transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 5.5, ease: [0.4, 0, 0.2, 1], delay: 1.2 }}
        />
      )}
    </motion.div>
  );
}

/* ============================================================
   CAHAYA PEMBUKAAN — flare anamorfik, sinar memancar & percikan emas
   dari celah gapura (pusat: x 50%, tinggi pintu separuh)
   ============================================================ */

const GAP_Y = 100 - DOOR_BOTTOM - DOOR_H * 0.48; // % atas: titik terang di celah gapura
const SPARKS = Array.from({ length: 42 }, (_, i) => {
  const a = (i / 42) * Math.PI * 2 + (i % 3) * 0.2;
  const r = 18 + ((i * 37) % 30);
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r * 1.4 - 6, s: 2 + (i % 4), d: 1.6 + (i % 5) * 0.3, delay: (i % 7) * 0.05 };
});

function GateLight({ burst }) {
  const { gate, sun, still } = useScene();
  // puncak cahaya saat gapura baru terbelah, lalu menyisakan pendar lembut
  const peak = useTransform(gate, (g) => (g < 0.3 ? g / 0.3 : 1 - clamp01((g - 0.3) / 0.7) * 0.85));
  const flareW = useTransform(gate, (g) => `${40 + g * 120}%`);
  const raysRot = useTransform(gate, (g) => g * 40);
  const glow = useTransform([gate, sun], ([g, s]) => 0.25 + g * 0.35 + s * 0.1);
  if (still) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 mix-blend-screen">
      {/* pendar hangat di belakang gapura */}
      <motion.div
        className="absolute left-1/2 aspect-square w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,228,170,0.55),rgba(255,180,100,0.18)_45%,transparent)]"
        style={{ top: `${GAP_Y}%`, opacity: glow }}
      />
      {/* sinar memancar berputar pelan dari celah */}
      <motion.div className="absolute left-1/2 aspect-square w-[160%]" style={{ top: `${GAP_Y}%`, x: "-50%", y: "-50%", opacity: peak, rotate: raysRot }}>
        <div className="h-full w-full rounded-full bg-[repeating-conic-gradient(from_0deg,rgba(255,236,190,0.32)_0deg_3deg,transparent_3deg_14deg)] [mask-image:radial-gradient(closest-side,#000_8%,transparent_70%)]" />
      </motion.div>
      {/* garis flare anamorfik & bintang cahaya di titik terang */}
      <motion.div
        className="absolute left-1/2 h-[1.1%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,250,235,1),rgba(255,214,150,0.6)_35%,transparent_75%)]"
        style={{ top: `${GAP_Y}%`, width: flareW, opacity: peak }}
      />
      <motion.div
        className="absolute left-1/2 h-[0.35%] w-[150%] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,240,210,0.7)_30%,rgba(255,255,255,0.95)_50%,rgba(255,240,210,0.7)_70%,transparent)]"
        style={{ top: `${GAP_Y}%`, opacity: peak }}
      />
      <motion.div
        className="absolute left-1/2 aspect-square w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,#FFFFFF,rgba(255,236,190,0.6)_40%,transparent)]"
        style={{ top: `${GAP_Y}%` }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* lingkaran flare kecil berderet ke arah matahari */}
      {[
        [62, 0.7, 4],
        [70, 0.45, 7],
        [38, 0.35, 5],
        [28, 0.25, 9],
      ].map(([x, o, w], i) => (
        <motion.div
          key={i}
          className="absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FFE6B8]/40 bg-[radial-gradient(closest-side,rgba(255,220,170,0.25),transparent)]"
          style={{ left: `${x}%`, top: `${GAP_Y - (x - 50) * 0.6}%`, width: `${w}%`, opacity: useTransform(peak, (p) => p * o) }}
        />
      ))}
      {/* percikan emas berhamburan saat gapura dibuka */}
      {burst > 0 &&
        SPARKS.map((s, i) => (
          <motion.span
            key={`${burst}-${i}`}
            className="absolute rounded-full bg-[#FFF1C8] shadow-[0_0_8px_2px_rgba(255,214,140,0.9)]"
            style={{ left: "50%", top: `${GAP_Y}%`, width: s.s, height: s.s }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: [`0vw`, `${s.dx * 0.5}vw`, `${s.dx}vw`], y: [`0vh`, `${s.dy * 0.4}vh`, `${s.dy * 0.6 + 12}vh`], opacity: [0, 1, 0], scale: [0.4, 1.2, 0.6] }}
            transition={{ duration: s.d, delay: 0.25 + s.delay, ease: "easeOut" }}
          />
        ))}
    </div>
  );
}

/* ============================================================
   KAWANAN BURUNG MELINTASI GAPURA saat dibuka: terbang dari sisi kiri,
   melewati celah bercahaya, lalu menghilang ke kanan sambil naik.
   Burung dekat lebih besar & cepat (kedalaman), kepak & irama berbeda tiap ekor;
   siluet cokelat tua dengan tepi tersorot cahaya senja (rim light).
   ============================================================ */

const GATE_BIRDS = Array.from({ length: 36 }, (_, i) => {
  const near = ((i * 53) % 10) / 9; // 0 jauh … 1 dekat
  return {
    top: 24 + ((i * 37) % 30) - near * 6, // % tinggi layar: melintas di langit terang di antara puncak gapura
    size: 22 + near * 62,
    dur: 4.6 - near * 1.9,
    delay: 0.3 + i * 0.075 + ((i * 7) % 5) * 0.08,
    rise: -(6 + ((i * 29) % 14)),
    flap: 0.9 + ((i * 11) % 6) * 0.12 - near * 0.15,
    tone: near > 0.6 ? "#24120A" : near > 0.3 ? "#3A2214" : "rgba(80,48,30,0.8)",
    near,
  };
});

function GateBirds({ run }) {
  if (!run) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
      {GATE_BIRDS.map((b, i) => (
        <motion.div
          key={`${run}-${i}`}
          className="absolute left-0"
          style={{ top: `${b.top}%`, filter: `drop-shadow(0 0 ${1 + b.near * 2}px rgba(255,206,130,0.9))${b.near > 0.85 ? " blur(0.6px)" : ""}` }}
          initial={{ x: "-25vw", y: 0, opacity: 0 }}
          animate={{ x: ["-25vw", "40vw", "125vw"], y: [0, b.rise * 0.3, b.rise], opacity: [0, 1, 1, 1], scale: [0.85, 1, 1.12], rotate: [-4, -8, -12] }}
          transition={{ duration: b.dur, delay: b.delay, ease: [0.35, 0.1, 0.4, 1], times: [0, 0.45, 1] }}
        >
          {/* badan naik-turun mengikuti kepakan */}
          <motion.div animate={{ y: [0, -b.size * 0.12, 0, -b.size * 0.1, 0] }} transition={{ duration: b.flap, repeat: Infinity, ease: "easeInOut" }}>
            <Bird size={b.size} tone={b.tone} flap={b.flap} delay={(i % 5) * 0.11} detail={b.near > 0.45} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* kabut depan: kamera menembusnya saat melangkah masuk */
function FrontMist() {
  const { dolly, still } = useScene();
  const opacity = useTransform(dolly, (d) => (d < 0.15 ? 0.2 + d * 4 : 1 - clamp01((d - 0.15) / 0.6)));
  const scale = useTransform(dolly, (d) => 1 + d * 1.8);
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
  if (still) return null;
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ opacity, scale, visibility, transformOrigin: VP_CSS }}>
      <div className="absolute inset-x-[-20%] top-[40%] h-[50%] bg-[radial-gradient(45%_40%_at_25%_50%,rgba(255,232,196,0.85),transparent_70%),radial-gradient(45%_40%_at_75%_55%,rgba(255,226,186,0.8),transparent_70%),radial-gradient(60%_30%_at_50%_40%,rgba(255,240,214,0.6),transparent_70%)]" />
    </motion.div>
  );
}

/* ---------- daun & kelopak mawar gugur ---------- */

const LEAF = "M0 -10 C4 -8 7 -4 7 0 C7 5 3 9 0 10 C-3 9 -7 5 -7 0 C-7 -4 -4 -8 0 -10 Z";
const PETAL = "M0 -9 C6 -7 8 0 4 6 C2 9 -2 9 -4 6 C-8 0 -6 -7 0 -9 Z";
const LEAF_COLORS = [
  ["#C9B04A", "#5E5A14"],
  ["#E8A83A", "#8A5A12"],
  ["#9DB04A", "#4A5A18"],
  ["#F0C860", "#9A6A1A"],
];
const PETAL_COLORS = [
  ["#E0485A", "#7A1222"],
  ["#F4A0A8", "#B8485A"],
  ["#FFF0E0", "#E0B090"],
];

function Leaf({ size, colors, id, petal }) {
  return (
    <svg viewBox="-11 -11 22 22" style={{ width: size }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <path d={petal ? PETAL : LEAF} fill={`url(#${id})`} />
      {!petal && <path d="M0 10 L0 -8 M0 -2 L4 -5 M0 -2 L-4 -5 M0 3 L4 0 M0 3 L-4 0" stroke={colors[1]} strokeWidth="0.5" opacity="0.6" fill="none" />}
    </svg>
  );
}

const AMBIENT_LEAVES = Array.from({ length: 10 }, (_, i) => ({
  left: (i * 41 + 4) % 96,
  size: 10 + (i % 3) * 4,
  dur: 12 + (i % 4) * 2.5,
  delay: (i * 1.6) % 12,
  sway: (i % 2 ? 1 : -1) * (30 + (i % 3) * 18),
  petal: i % 3 === 0,
  colors: i % 3 === 0 ? PETAL_COLORS[i % PETAL_COLORS.length] : LEAF_COLORS[i % LEAF_COLORS.length],
}));

function FallingLeaves({ bursts }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
      {AMBIENT_LEAVES.map((l, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${l.left}%`, top: -30 }}
          animate={{ y: ["0vh", "110vh"], x: [0, l.sway, -l.sway / 2, l.sway / 3], rotate: [0, 160, 320], rotateY: [0, 180, 360] }}
          transition={{ duration: l.dur, repeat: Infinity, delay: l.delay, ease: "linear" }}
        >
          <Leaf size={l.size} colors={l.colors} petal={l.petal} id={`sp-leaf-a${i}`} />
        </motion.div>
      ))}
      {bursts.map((b) =>
        b.leaves.map((l, i) => (
          <motion.div
            key={`${b.id}-${i}`}
            className="absolute"
            style={{ left: b.x, top: b.y }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: [0, l.dx * 0.6, l.dx], y: [0, l.up, l.fall], rotate: [0, l.spin], opacity: [1, 1, 0] }}
            transition={{ duration: l.dur, ease: "easeOut" }}
          >
            <Leaf size={l.size} colors={l.colors} petal={l.petal} id={`sp-leaf-${b.id}-${i}`} />
          </motion.div>
        ))
      )}
    </div>
  );
}

/* ---------- riak saat lantai / kolam disentuh ---------- */

function TapRipples({ ripples }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3]">
      {ripples.map((r) =>
        [0, 0.25, 0.5].map((d, i) => (
          <motion.div
            key={`${r.id}-${i}`}
            className="absolute h-[18px] w-[60px] rounded-[50%] border border-[#FFE6B0]/80"
            style={{ left: r.x, top: r.y, x: "-50%", y: "-50%" }}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 1.6, delay: d, ease: "easeOut" }}
          />
        ))
      )}
    </div>
  );
}

/* ---------- kunang-kunang petang ---------- */

const FIREFLIES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 29 + 5) % 94,
  top: 44 + ((i * 17) % 46),
  dx: (i % 2 ? 1 : -1) * (14 + (i % 4) * 8),
  dy: -10 - (i % 3) * 8,
  dur: 4 + (i % 4),
}));

function Fireflies() {
  const { sun, cam } = useScene();
  const opacity = useTransform([sun, cam.dusk], ([s, n]) => Math.min(1, 0.15 + s * 0.7 + n * 0.6));
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity }}>
      {FIREFLIES.map((f, i) => (
        <motion.span
          key={i}
          className="absolute h-[5px] w-[5px] rounded-full bg-[#FFE7A0] shadow-[0_0_10px_3px_rgba(255,206,110,0.8)]"
          style={{ left: `${f.left}%`, top: `${f.top}%` }}
          animate={{ x: [0, f.dx, 0], y: [0, f.dy, 0], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: f.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}
    </motion.div>
  );
}

// burung senja pulang ke sarang
const FLOCKS = [
  { top: 14, size: 14, tone: "rgba(70,40,22,0.55)", count: 6, duration: 42, delay: -6, rise: -4 },
  { top: 24, size: 20, tone: "rgba(60,32,16,0.72)", count: 4, duration: 30, delay: -18, rise: 6, reverse: true },
  { top: 9, size: 40, tone: "rgba(48,26,14,0.92)", count: 2, duration: 13, delay: 5, rise: -10, repeatDelay: 15, detail: true },
];

const BUTTERFLY_COLORS = [
  { a: "#FFEFC0", b: "#E8A848", vein: "#5A3A14" },
  { a: "#FFE0E4", b: "#D8506A", vein: "#5E1A24" },
  { a: "#FFE6C8", b: "#D07838", vein: "#5E3018" },
];

const AMBIENT_BUTTERFLIES = [
  { left: 18, top: 72, size: 32, ...BUTTERFLY_COLORS[0], dur: 17, path: [[0, 0], [40, -60], [90, -30], [60, 30], [0, 0]] },
  { left: 78, top: 64, size: 28, ...BUTTERFLY_COLORS[1], dur: 20, path: [[0, 0], [-50, -40], [-90, 10], [-30, 40], [0, 0]] },
  { left: 50, top: 84, size: 24, ...BUTTERFLY_COLORS[2], dur: 15, path: [[0, 0], [30, -50], [-20, -90], [-40, -30], [0, 0]] },
];

/* ============================================================
   ADEGAN LENGKAP
   ============================================================ */

function PrambananScene({ cam, interactive = true, focusY = 0.5 }) {
  const ctx = useScene();
  const [ref, box] = useStageBox(9 / 16, focusY);
  const reduce = useReducedMotion();
  const live = interactive && !reduce && !ctx.still;
  useTiltInput(live);
  useWind(live);
  const [bursts, setBursts] = useState([]);
  const [ripples, setRipples] = useState([]);
  const [freed, setFreed] = useState([]);
  // gapura mulai terbelah → kawanan burung terbang & percikan cahaya (sekali tiap pembukaan)
  const [flight, setFlight] = useState(0);
  const opened = useRef(false);
  useMotionValueEvent(ctx.gate, "change", (g) => {
    if (g < 0.02) opened.current = false;
    else if (g > 0.04 && g < 0.9 && !opened.current && live) {
      opened.current = true;
      setFlight((f) => f + 1);
    }
  });
  const seq = useRef(0);
  // kamera menengadah ke langit saat cover, lalu turun menatap candi (+ kamera perjalanan)
  const lookY = useTransform([ctx.descend, ctx.cam.lift], ([d, l]) => `${(1 - d) * 26 + l * 26}%`);
  const dusk = useTransform([ctx.sun, ctx.cam.dusk], ([s, n]) => s * 0.14 + n * 0.42);

  const point = (e) => {
    const root = ref.current?.getBoundingClientRect();
    return root && { root, x: e.clientX - root.left, y: e.clientY - root.top, id: ++seq.current };
  };

  const ripple = (p) => {
    setRipples((r) => [...r, p]);
    setTimeout(() => setRipples((r) => r.filter((v) => v.id !== p.id)), 2400);
  };

  const scatter = (p, petal) => {
    const leaves = Array.from({ length: petal ? 12 : 9 }, (_, i) => ({
      dx: (i % 2 ? 1 : -1) * (30 + ((i * 37) % 90)),
      up: -20 - ((i * 13) % 40),
      fall: 220 + ((i * 53) % 260),
      spin: (i % 2 ? 1 : -1) * (200 + i * 40),
      dur: 2.6 + (i % 4) * 0.5,
      size: 11 + (i % 3) * 4,
      petal,
      colors: petal ? PETAL_COLORS[i % PETAL_COLORS.length] : LEAF_COLORS[i % LEAF_COLORS.length],
    }));
    setBursts((b) => [...b, { id: p.id, x: p.x, y: p.y, leaves }]);
    setTimeout(() => setBursts((b) => b.filter((v) => v.id !== p.id)), 4800);
  };

  const onAction = (item, e) => {
    if (!live) return;
    const p = point(e);
    if (!p) return;
    if (item.tap === "tree") {
      gust(0.8);
      scatter(p, false);
    }
    if (item.tap === "rose") {
      gust(0.5);
      scatter(p, true);
    }
    if (item.tap === "banner") gust(0.9);
    if (item.tap === "pond" || item.tap === "fountain" || item.tap === "floor") ripple(p);
    if (item.tap === "plant") {
      gust(0.4);
      const c = BUTTERFLY_COLORS[p.id % BUTTERFLY_COLORS.length];
      const dir = item.x < 50 ? 1 : -1;
      const bf = { left: (p.x / p.root.width) * 100, top: (p.y / p.root.height) * 100, size: 28, ...c, dur: 6, path: [[0, 0], [dir * 40, -80], [dir * 110, -160], [dir * 180, -260], [dir * 240, -360]] };
      setFreed((f) => [...f, { id: p.id, bf }]);
      setTimeout(() => setFreed((f) => f.filter((v) => v.id !== p.id)), 6000);
    }
  };

  // sentuhan yang tidak kena sprite: riak di pelataran (di bawah cakrawala)
  const onFloor = (e) => {
    const p = point(e);
    if (p && p.y > p.root.height * 0.6) ripple(p);
  };

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#2B1A10]" onClick={live ? (e) => tapAt(e, onFloor) : undefined}>
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          <motion.div className="absolute inset-0" style={{ y: lookY }}>
            <Sky />
            <Ground />
            {/* candi, tembok & mawar → kabut melayang → air mancur … tangga → kabut depan → gapura → bingkai */}
            {LAYERS.slice(0, 3).map((layer) => (
              <Layer key={layer.id} layer={layer} cam={cam} onAction={onAction} />
            ))}
            <Mist />
            {LAYERS.slice(3, -1).map((layer) => (
              <Layer key={layer.id} layer={layer} cam={cam} onAction={onAction} />
            ))}
            <FrontMist />
            <GateLight burst={flight} />
            <GateDoors />
            <Layer layer={LAYERS[LAYERS.length - 1]} cam={cam} onAction={onAction} />
          </motion.div>
        </div>
      )}

      {/* rona senja di atas seluruh adegan */}
      <motion.div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#1A0E22,#3A1A0C_60%,#2A1206)]" style={{ opacity: dusk }} />
      {!ctx.still && (
        <>
          <Fireflies />
          <Flocks list={FLOCKS} />
          <GateBirds run={flight} />
          <Butterflies list={AMBIENT_BUTTERFLIES} />
          {freed.map((f) => (
            <Butterflies key={f.id} list={[f.bf]} />
          ))}
          <Dust palette={tone.dust} count={16} />
          <FallingLeaves bursts={bursts} />
          <TapRipples ripples={ripples} />
        </>
      )}

      {/* vinyet & gradasi atas agar nama terbaca */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_65%_at_50%_45%,transparent_55%,rgba(36,18,6,0.5)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26%] bg-gradient-to-b from-[#2B160A]/70 to-transparent" />
    </div>
  );
}

/* ---------- thumbnail katalog: pelataran candi saat senja ---------- */

const ZERO = motionValue(0);

export function PrambananThumb() {
  return (
    <Scene.Provider value={{ ...STILL, cam: STILL_CAM, still: true }}>
      <PrambananScene cam={ZERO} interactive={false} focusY={0.16} />
    </Scene.Provider>
  );
}

/* ============================================================
   COVER
   ============================================================ */

export function PrambananCover({ t, guestName, onOpen }) {
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // gapura tertutup rapat, kamera menengadah ke langit senja
    Object.values(LIVE).forEach((v) => v.set(0));
    LIVE.build.set(1); // pelataran sudah ada di balik gapura
    heroReveal.set(0);
    snapRig(REST_TOP);
  }, []);

  const open = () => {
    if (leaving) return;
    setLeaving(true);
    requestTiltPermission();
    if (reduce) {
      Object.values(LIVE).forEach((v) => v.set(1));
      heroReveal.set(1);
      onOpen();
      return;
    }
    // 1 cahaya dari celah & gapura terbelah → 2 kamera turun, matahari tenggelam, pelataran tersusun
    // → 3 melangkah menembus gapura & kabut → 4 nama muncul
    gust(0.6);
    LIVE.build.set(0);
    animate(LIVE.gate, 1, { duration: 2.6, ease: MOTION.door });
    animate(LIVE.descend, 1, { delay: 0.4, duration: 3.2, ease: [0.6, 0, 0.3, 1] });
    animate(LIVE.sun, 1, { delay: 0.2, duration: 5, ease: [0.3, 0, 0.3, 1] });
    animate(LIVE.build, 1, { delay: 0.5, duration: 2.8, ease: "linear" });
    animate(LIVE.dolly, 1, { delay: 3.1, duration: 3, ease: MOTION.dolly });
    animate(heroReveal, 1, { delay: 5.4, duration: 1.4, ease });
    setTimeout(onOpen, 2000);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <PrambananScene cam={ZERO} />
        <Petals palette={tone.petals} count={10} />
        <div className="relative z-[7] h-full">
          <CoverTitle tone={tone} t={t} leaving={leaving} delay={0.2} />
          <GuestPanel tone={tone} guestName={guestName} leaving={leaving} onOpen={open} delay={1.2} />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HERO, LATAR TETAP, PERJALANAN & DEKORASI (kit bersama)
   ============================================================ */

const HeroScene = makeHeroScene({ tone, kicker: "PAWIWAHAN", reveal: heroReveal });

/* latar tetap: adegan menempel di belakang seluruh undangan; posisi scroll menentukan pose kamera */
function Backdrop() {
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => aimRig(poseAt(y, window.innerHeight)));
  useEffect(() => aimRig(poseAt(window.scrollY, window.innerHeight)), []);
  return (
    <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden" aria-hidden="true">
      <PrambananScene cam={ZERO} />
      <motion.div style={{ opacity: CAM.dim }} className={`absolute inset-0 ${tone.wash}`} />
    </div>
  );
}

const SectionDecor = makeSectionDecor(tone);

/* isi undangan sebagai perjalanan kamera di pelataran candi (kit/journey.jsx) */
const { Journey, Closing } = makeJourney({
  tone,
  asset: ASSET,
  // kain jarik sogan: cokelat soga, krem, emas
  accent: "bg-[linear-gradient(90deg,#6B3A1A_0_25%,#F2DDB0_25%_50%,#B07A2A_50%_75%,#6B3A1A_75%_100%)]",
  crown: { src: "temple", className: "-mb-3 w-[34%]" },
  lantern: { src: "shrine", glow: "top-[46%]" },
  portal: {
    crown: { src: "temple", className: "-mb-4 w-[36%]" },
    side: { src: "pennant", className: "bottom-[2%] h-[84%] w-auto", left: "left-[-9%]", right: "right-[-9%]", mirror: true },
  },
  copy: {
    ampTag: "GARWA · SIGARANING NYAWA",
    storyKicker: "LAMPAH TRESNA",
    storyTitle: "Langkah Menuju Candi",
    storySub: "Tiap lentera di pelataran candi menyimpan satu kenangan",
    eventsSub: "Mari melangkah masuk melewati gapura",
    thanks: "MATUR NUWUN",
  },
});

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={12} />;
}

export const prambananDecor = {
  Backdrop,
  HeroScene,
  Section: SectionDecor,
  Global: GlobalDecor,
  Journey,
  Closing,
  skipOpening: true,
};

/* foto pasangan berbusana adat Jawa untuk data demo */
export function prambananData(data) {
  const P = AURELIA_PHOTOS;
  return {
    ...data,
    coverPhoto: P.couple,
    groom: { ...data.groom, photo: P.groom },
    bride: { ...data.bride, photo: P.bride },
    story: data.story.map((s, i) => ({ ...s, photo: [P.embrace, P.couple, P.bride, P.embrace][i % 4] })),
  };
}
