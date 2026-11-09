import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { animate, motion, motionValue, useMotionValueEvent, useReducedMotion, useScroll, useTime, useTransform } from "framer-motion";
import { TONES, MOTION } from "../design/tokens.js";
import {
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

/* ============================================================
   MOMENLABS — TEMPLATE "ARUNIKA" (Adat Jawa, fajar jingga)
   ------------------------------------------------------------
   Arunika = cahaya matahari terbit. Pengunjung diajak "turun" ke
   dunia undangan:
     1. Subuh di atas awan — langit ungu berbintang, awan mega
        mendung menutup pandangan, nama & tamu di atasnya.
     2. "Buka Undangan": awan tersibak ke kedua sisi, kamera turun
        dari langit ke bumi, matahari terbit di antara dua gunung
        dan langit berubah jingga.
     3. Pelataran tersusun berpasangan (simetris): pagoda & bale,
        pendopo, pagar, kolam teratai, lentera, pohon merah.
     4. Kamera melangkah masuk melewati celah candi bentar ke
        pelataran pendopo → nama muncul.

   Lapisan (belakang → depan), semua sprite utuh dari desainer:
     langit fajar (sky only) → bintang, matahari, awan → dua gunung
     → pelataran batu (ground only) → pagoda → pendopo → pagar &
     lentera jauh → kolam teratai → lentera dekat → pohon merah →
     candi bentar → semak → ranting paling depan.
   Kabut cakrawala & kabut tanah menyatukan langit dan pelataran.

   Interaksi: parallax mouse/gyroscope, angin dari gerak kursor
   (pohon, semak, ranting bergoyang), sentuh pohon → daun gugur,
   sentuh teratai → riak air & kupu-kupu, sentuh lentera → api
   berkobar, sentuh pendopo/pagoda/gerbang → pendar emas.
   Ambient: awan berarak, kabut melayang, kunang-kunang subuh,
   burung, kupu-kupu, daun & melati gugur, debu cahaya.
   Aset: assets-src/arunika/raw → scripts/arunika-assets.cjs
   ============================================================ */

const ASSET = "/templates/arunika";
const tone = TONES.sunrise;
const ease = MOTION.ease;
const VP = "50% 58%"; // titik hilang: tangga pendopo

/* nilai bersama cover, hero & latar agar transisi menyambung */
const LIVE = {
  part: motionValue(1), // 0 awan menutup → 1 tersibak
  descend: motionValue(1), // 0 menengadah ke langit → 1 menatap pelataran
  sun: motionValue(1), // 0 subuh → 1 matahari terbit
  build: motionValue(1), // 0 kosong → 1 pelataran tersusun
  dolly: motionValue(0), // 0 di depan candi bentar → 1 sudah di pelataran
};
const heroReveal = motionValue(1);
const wind = motionValue(0);

// nilai diam untuk thumbnail katalog (tanpa animasi pembukaan)
const STILL = {
  part: motionValue(1),
  descend: motionValue(1),
  sun: motionValue(1),
  build: motionValue(1),
  dolly: motionValue(1),
};

// kamera perjalanan (lihat kit/rig.js); thumbnail memakai kamera diam
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
   Panggung 9:16. x = tengah sprite (%), bottom = alas (%), w = lebar (%).
   pair(): sisi kanan dicerminkan agar berpasangan sempurna.
   depth: geser parallax (px) & laju zoom saat kamera masuk.
   at: kapan muncul saat pelataran tersusun (0..1 dari build).
   ============================================================ */

const pair = (item, xLeft) => [
  { ...item, x: xLeft },
  { ...item, x: 100 - xLeft, mirror: !item.mirror },
];

/* Tata letak mengikuti lukisan referensi (cakrawala 62%):
   matahari besar tepat di atas atap pendopo; pohon merah & pagoda di belakang kiri-kanan;
   pendopo besar di tengah; kolam teratai & sepasang lentera mengapit jalan masuk;
   semak teratai di sudut bawah & dahan merah di sudut atas sebagai bingkai.
   Angka di sini posisi SEBELUM kamera masuk: tiap lapisan lalu membesar dari titik hilang
   (×1 + 0.05 + depth/24 × 0.6), sehingga setelah masuk semuanya mendarat di posisi referensi
   (pendopo ±72% lebar, lentera di ±25% / 75%, alas pendopo di 62%). */
const LAYERS = [
  { id: "mountains", depth: 3, items: pair({ name: "mountain", bottom: 38, w: 72, at: 0 }, 22) },
  { id: "trees", depth: 6, items: pair({ name: "tree", bottom: 36, w: 54, at: 0.06, sway: 1.1, tap: "tree" }, 7) },
  // menara pagoda di sisi luar (gambar asli: bale kiri, menara kanan → sisi kiri dicerminkan)
  { id: "pagoda", depth: 7, items: pair({ name: "pagoda", bottom: 41, w: 24, at: 0.12, mirror: true, tap: "glow" }, 32.7) },
  {
    id: "pendopo",
    depth: 9,
    items: [
      { name: "platform", x: 50, bottom: 37.6, w: 66, at: 0.16 },
      { name: "pendopo", x: 50, bottom: 38.9, w: 56.5, at: 0.2, tap: "glow" },
    ],
  },
  { id: "pondFar", depth: 12, items: pair({ name: "lotus", bottom: 33.1, w: 20.7, at: 0.32, tap: "lotus", pond: true }, 36.7) },
  {
    id: "lanterns",
    depth: 16,
    items: [
      ...pair({ name: "lotus", bottom: 25.4, w: 30, at: 0.4, tap: "lotus", pond: true }, 26.6),
      ...pair({ name: "lantern", bottom: 26.8, w: 10.3, at: 0.46, tap: "lamp", lamp: true }, 33.4),
    ],
  },
  {
    id: "frame",
    depth: 24,
    frame: true,
    items: [
      ...pair({ name: "bush", bottom: 7, w: 40, at: 0.66, sway: 0.7 }, 4),
      ...pair({ name: "bushLotus", bottom: -3, w: 52, at: 0.7, sway: 0.6, tap: "lotus" }, 14),
      ...pair({ name: "branch", top: -3, w: 64, at: 0.76, sway: 2, origin: "0% 20%" }, 14),
    ],
  },
];

// candi bentar: celahnya (54% lebar gambar) tepat di tengah panggung
const GATE = { name: "gate", x: 46.2, bottom: 9, w: 96, at: 0.6, tap: "glow" };
const GATE_ORIGIN = "50% 72%";

/* ---------- langit fajar (sky only) ---------- */

const STARS = Array.from({ length: 36 }, (_, i) => ({
  x: (i * 53 + 7) % 100,
  y: -32 + ((i * 37) % 56),
  r: 0.6 + (i % 3) * 0.5,
  d: 2 + (i % 5) * 0.7,
}));

// awan berlapis: [nama, x %, top %, lebar %, durasi arak, arah]
// (langit desainer sudah berawan; sprite ini hanya awan yang bergerak di depannya)
const SKY_CLOUDS = [
  ["cloudGold", 18, -26, 42, 60, 1],
  ["cloudCream", 80, -14, 36, 52, -1],
  ["cloudE", 50, 4, 40, 70, 1],
  ["cloudC", 14, 20, 28, 50, 1],
  ["cloudG", 84, 26, 22, 40, -1],
  ["cloudA", 30, 36, 16, 36, 1],
  ["cloudB", 70, 38, 14, 34, -1],
];

function Sky() {
  const { sun, dolly, still, cam } = useScene();
  const x = useTransform([tiltX, cam.pan], ([v, p]) => `calc(${-v * 2.5}px + ${-p * panShift(0)}%)`);
  const y = useTransform(tiltY, (v) => -v * 2);
  const scale = useTransform([dolly, cam.push], ([d, p]) => (1 + d * 0.04) * (1 + p * 0.08));
  const night = useTransform(sun, (s) => 1 - s);
  // matahari naik dari balik gunung ke atas pendopo
  const sunBottom = useTransform(sun, (s) => `${40 + s * 15.6}%`); // akhir: tepi bawah cakram sedikit di balik atap
  const glowBottom = useTransform(sun, (s) => `${48 + s * 15.6}%`);
  const sunGlow = useTransform(sun, (s) => 0.25 + s * 0.75);
  const sunScale = useTransform(sun, (s) => 1.15 - s * 0.15);
  return (
    <motion.div className="absolute inset-0" style={{ x, y, scale, transformOrigin: VP }}>
      {/* langit desainer: cakrawalanya (71% tinggi gambar) tepat di cakrawala panggung (62%),
          bagian atasnya cukup tinggi untuk pandangan menengadah saat subuh */}
      <img
        src={`${ASSET}/sky.webp`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-[-33%] h-[133.4%] w-auto max-w-none -translate-x-1/2 select-none"
      />
      {/* subuh: langit ungu tua yang memudar saat matahari naik */}
      <motion.div
        className="absolute inset-x-0 top-[-33%] h-[95%] bg-[linear-gradient(180deg,#0E0C24_0%,#1E1638_45%,rgba(60,32,72,0.75)_80%,rgba(90,44,70,0.4)_100%)]"
        style={{ opacity: night }}
      />
      {/* bintang subuh */}
      <motion.div className="absolute inset-0" style={{ opacity: night }}>
        {STARS.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-[#FFF4DC] shadow-[0_0_6px_rgba(255,240,210,0.9)]"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2 }}
            animate={still ? undefined : { opacity: [0.3, 1, 0.3] }}
            transition={{ duration: s.d, repeat: Infinity, ease: "easeInOut", delay: i * 0.13 }}
          />
        ))}
      </motion.div>
      {/* pendar & matahari terbit */}
      <motion.div
        className="absolute left-1/2 aspect-square w-[120%] rounded-full bg-[radial-gradient(closest-side,rgba(255,230,170,0.75),rgba(255,170,90,0.32)_38%,rgba(240,110,70,0.1)_65%,transparent)]"
        style={{ bottom: glowBottom, x: "-50%", y: "50%", opacity: sunGlow }}
      />
      {/* cakram matahari ada di sepertiga kiri gambar (awan di kanannya): digeser agar cakramnya di tengah */}
      <motion.div className="absolute left-[57.4%] w-[44%]" style={{ bottom: sunBottom, x: "-50%", scale: sunScale }}>
        <motion.img
          src={`${ASSET}/sun.webp`}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="block w-full select-none"
          animate={still ? undefined : { filter: ["brightness(1)", "brightness(1.12)", "brightness(1)"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      {/* awan berarak di beberapa kedalaman */}
      {SKY_CLOUDS.map(([name, cx, top, w, dur, dir], i) => (
        <div key={i} className="absolute" style={{ left: `${cx}%`, top: `${top}%`, width: `${w}%`, transform: "translateX(-50%)" }}>
          <motion.img
            src={`${ASSET}/${name}.webp`}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="block w-full select-none opacity-90"
            animate={still ? undefined : { x: [`${-8 * dir}%`, `${8 * dir}%`, `${-8 * dir}%`] }}
            transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      ))}
    </motion.div>
  );
}

/* ---------- lantai mahoni (ground only) — sudah dilukis berperspektif, dipasang datar ---------- */

function Ground() {
  const { dolly, still, cam } = useScene();
  const x = useTransform([tiltX, cam.pan], ([v, p]) => `calc(${-v * 6}px + ${-p * panShift(0.4)}%)`);
  const y = useTransform(tiltY, (v) => -v * 4);
  const scale = useTransform([dolly, cam.push], ([d, p]) => (1 + d * 0.24) * (1 + p * 0.7));
  return (
    <motion.div className="absolute inset-0" style={{ x, y, scale, transformOrigin: VP }}>
      {/* tepi atas lantai (sudah memudar di gambarnya) tepat di cakrawala 62%; titik hilang di tengah */}
      <img
        src={`${ASSET}/ground.webp`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-[61%] h-[40%] w-auto max-w-none -translate-x-1/2 select-none"
      />
      {/* kabut cakrawala: menyatukan kaki gunung, langit & pelataran */}
      <motion.div
        className="absolute inset-x-0 top-[55%] h-[13%] bg-[linear-gradient(180deg,transparent,rgba(255,214,160,0.6)_45%,rgba(240,160,110,0.25)_72%,transparent)]"
        animate={still ? undefined : { opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* kabut tipis yang melayang di atas pelataran */
function Mist() {
  const { still } = useScene();
  if (still) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {[
        ["top-[57%]", "h-[9%]", 38, 0.55],
        ["top-[67%]", "h-[11%]", 52, 0.35],
        ["top-[82%]", "h-[9%]", 64, 0.25],
      ].map(([top, h, dur, op], i) => (
        <motion.div
          key={i}
          className={`absolute left-[-50%] w-[200%] ${top} ${h} bg-[radial-gradient(50%_50%_at_30%_50%,rgba(255,232,200,0.9),transparent_70%),radial-gradient(40%_50%_at_75%_50%,rgba(255,220,180,0.8),transparent_70%)]`}
          style={{ opacity: op }}
          animate={{ x: i % 2 ? ["8%", "-8%", "8%"] : ["-8%", "8%", "-8%"] }}
          transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ---------- sentuhan sadar-transparansi ----------
   Kotak gambar pohon besar menutupi lentera & kolam di belakangnya. Saat disentuh,
   semua sprite di titik itu diperiksa dari depan ke belakang dan yang dipilih adalah
   yang pikselnya benar-benar tidak transparan. */

const tapHandlers = new WeakMap(); // <img> → fungsi sentuh sprite
const alphaCache = new Map(); // src → { w, h, data }

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

function tapAt(e) {
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
}

/* ---------- sprite: muncul berpasangan, bergoyang angin, bisa disentuh ---------- */

function Sprite({ item, index, onAction }) {
  const { build, still } = useScene();
  const time = useTime();
  const [glow, setGlow] = useState(0);
  const pos = {
    left: `${item.x}%`,
    width: `${item.w}%`,
    ...(item.top != null ? { top: `${item.top}%` } : { bottom: `${item.bottom}%` }),
  };
  const k = useTransform(build, (b) => clamp01((b - item.at) / 0.26));
  const opacity = k;
  const scale = useTransform(k, (v) => 0.9 + v * 0.1);
  const y = useTransform(k, (v) => (1 - v) * 24);
  const phase = index * 1.7;
  const rotate = useTransform([time, wind], ([t, w]) => {
    if (!item.sway || still) return 0;
    const s = t / 1000;
    return Math.sin(s * 0.55 + phase) * item.sway * 0.6 + Math.sin(s * 2.3 + phase) * item.sway * (0.15 + w * 1.6);
  });
  const origin = item.origin ?? (item.top != null ? "50% 0%" : "50% 100%");

  const onTap = (e) => {
    setGlow((g) => g + 1);
    onAction?.(item, e);
  };
  const active = glow > 0;
  const register = (el) => {
    if (el && item.tap) tapHandlers.set(el, onTap);
  };

  return (
    <div className="absolute" style={{ ...pos, transform: `translateX(-50%)${item.mirror ? " scaleX(-1)" : ""}` }}>
      <motion.div style={{ opacity, scale, y, transformOrigin: origin }}>
        <motion.div style={{ rotate, transformOrigin: origin }}>
          <motion.img
            key={glow}
            src={`${ASSET}/${item.name}.webp`}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`block w-full select-none ${item.tap && !still ? "pointer-events-auto cursor-pointer" : "pointer-events-none"}`}
            style={{ transformOrigin: "50% 100%" }}
            ref={register}
            data-mirror={item.mirror ? "1" : undefined}
            initial={active ? { filter: "drop-shadow(0 0 18px rgba(255,190,100,0.95))" } : false}
            animate={{
              filter: "drop-shadow(0 6px 10px rgba(40,10,6,0.3))",
              scale: active ? [1, 1.06, 1] : 1,
              rotate: active && item.tap === "tree" ? [0, -2.5, 2, -1, 0] : 0,
            }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          {item.lamp && <LampGlow flare={glow} still={still} />}
          {item.pond && !still && <PondRipples />}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* api lentera: pendar hangat yang berkedip, berkobar saat disentuh */
function LampGlow({ flare, still }) {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute left-[46%] top-[29%] aspect-square w-[260%] rounded-full bg-[radial-gradient(closest-side,rgba(255,214,140,0.85),rgba(255,150,70,0.35)_40%,transparent)]"
        style={{ x: "-50%", y: "-50%" }}
        animate={still ? undefined : { opacity: [0.55, 0.9, 0.65, 1, 0.6], scale: [1, 1.05, 0.97, 1.03, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {flare > 0 && (
        <motion.div
          key={flare}
          className="pointer-events-none absolute left-[46%] top-[29%] aspect-square w-[420%] rounded-full bg-[radial-gradient(closest-side,rgba(255,236,180,0.95),rgba(255,160,80,0.4)_45%,transparent)]"
          style={{ x: "-50%", y: "-50%" }}
          initial={{ opacity: 1, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      )}
    </>
  );
}

/* riak air & kilau kecil di kolam teratai (koordinat sprite) */
function PondRipples() {
  return (
    <svg viewBox="0 0 100 18" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {[
        [28, 10, 0],
        [62, 8, 1.3],
        [80, 12, 2.4],
      ].map(([cx, cy, delay], i) => (
        <motion.ellipse
          key={i}
          cx={cx}
          cy={cy}
          fill="none"
          stroke="rgba(255,236,200,0.75)"
          strokeWidth="0.35"
          initial={{ rx: 1, ry: 0.4, opacity: 0.8 }}
          animate={{ rx: [1, 9], ry: [0.4, 2.4], opacity: [0.8, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, delay, ease: "easeOut" }}
        />
      ))}
      {[18, 40, 55, 72, 90].map((cx, i) => (
        <motion.circle
          key={`s${i}`}
          cx={cx}
          cy={6 + (i % 3) * 3}
          r="0.6"
          fill="#FFF3D6"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.45 }}
        />
      ))}
    </svg>
  );
}

function Layer({ layer, cam, onAction }) {
  const { dolly, cam: rig } = useScene();
  const k = layer.depth / 24;
  // tilt (px) + kamera menoleh: lapisan dekat bergeser lebih jauh (parallax)
  const x = useTransform([tiltX, rig.pan], ([v, p]) => `calc(${-v * layer.depth}px + ${-p * panShift(k)}%)`);
  const y = useTransform(tiltY, (v) => -v * layer.depth * 0.6);
  // kamera melangkah masuk: lapisan dekat membesar & menyingkir lebih cepat
  // bingkai depan (semak & dahan) tetap terlihat seperti di lukisan, hanya sedikit membesar
  const zoom = layer.frame ? 0.08 : 0.05 + k * 0.6;
  // + melangkah masuk ke pendopo: lapisan dekat membesar & menyingkir, lalu memudar
  const scale = useTransform([cam, dolly, rig.push], ([c, d, p]) => (1 + d * zoom) * (1 + c * (0.04 + k * 0.12)) * (1 + p * (0.12 + k * 1.4)));
  const opacity = useTransform([dolly, rig.push], ([d, p]) => (layer.front ? 1 - Math.min(1, d * 1.6) : 1) * (k > 0.5 ? 1 - clamp01((p - 0.35) / 0.4) : 1));
  // lapisan yang sudah lenyap tidak boleh menangkap sentuhan
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
  return (
    <motion.div className="absolute inset-0 will-change-transform" style={{ x, y, scale, opacity, visibility, transformOrigin: VP }}>
      {layer.items.map((item, i) => (
        <Sprite key={`${item.name}-${i}`} item={item} index={i + layer.depth} onAction={onAction} />
      ))}
    </motion.div>
  );
}

/* candi bentar: kamera menembus celahnya — gerbang membesar dari titik celah lalu lenyap */
function GateLayer({ cam, onAction }) {
  const { dolly } = useScene();
  const x = useTransform(tiltX, (v) => -v * 20);
  const y = useTransform(tiltY, (v) => -v * 12);
  const scale = useTransform([cam, dolly], ([c, d]) => (1 + d * d * 3.6) * (1 + c * 0.14));
  const opacity = useTransform(dolly, (d) => 1 - clamp01((d - 0.5) / 0.35));
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
  return (
    <motion.div className="absolute inset-0 will-change-transform" style={{ x, y, scale, opacity, visibility, transformOrigin: GATE_ORIGIN }}>
      <Sprite item={GATE} index={20} onAction={onAction} />
    </motion.div>
  );
}

/* ---------- daun merah gugur (dari pohon desainer) ---------- */

const LEAF = "M0 -10 C4 -8 7 -4 7 0 C7 5 3 9 0 10 C-3 9 -7 5 -7 0 C-7 -4 -4 -8 0 -10 Z";
const LEAF_COLORS = [
  ["#D2382C", "#7E1A14"],
  ["#E8723A", "#9A3414"],
  ["#F0A04A", "#9A5A16"],
  ["#B8222A", "#5E0E12"],
];

function Leaf({ size, colors, id }) {
  return (
    <svg viewBox="-11 -11 22 22" style={{ width: size }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <path d={LEAF} fill={`url(#${id})`} />
      <path d="M0 10 L0 -8 M0 -2 L4 -5 M0 -2 L-4 -5 M0 3 L4 0 M0 3 L-4 0" stroke={colors[1]} strokeWidth="0.5" opacity="0.6" fill="none" />
    </svg>
  );
}

const AMBIENT_LEAVES = Array.from({ length: 8 }, (_, i) => ({
  left: (i * 41 + 4) % 96,
  size: 10 + (i % 3) * 4,
  dur: 12 + (i % 4) * 2.5,
  delay: (i * 1.6) % 12,
  sway: (i % 2 ? 1 : -1) * (30 + (i % 3) * 18),
  colors: LEAF_COLORS[i % LEAF_COLORS.length],
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
          <Leaf size={l.size} colors={l.colors} id={`aru-leaf-a${i}`} />
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
            <Leaf size={l.size} colors={l.colors} id={`aru-leaf-${b.id}-${i}`} />
          </motion.div>
        ))
      )}
    </div>
  );
}

/* ---------- riak besar saat kolam disentuh ---------- */

function TapRipples({ ripples }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3]">
      {ripples.map((r) =>
        [0, 0.25, 0.5].map((d, i) => (
          <motion.div
            key={`${r.id}-${i}`}
            className="absolute h-[18px] w-[60px] rounded-[50%] border border-[#FFEBC8]/80"
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

/* ---------- kunang-kunang subuh: memudar saat matahari naik ---------- */

const FIREFLIES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 29 + 5) % 94,
  top: 48 + ((i * 17) % 40),
  dx: (i % 2 ? 1 : -1) * (14 + (i % 4) * 8),
  dy: -10 - (i % 3) * 8,
  dur: 4 + (i % 4),
}));

function Fireflies() {
  const { sun, cam } = useScene();
  const opacity = useTransform([sun, cam.dusk], ([s, n]) => Math.min(1, 1 - s * 0.75 + n * 0.75));
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity }}>
      {FIREFLIES.map((f, i) => (
        <motion.span
          key={i}
          className="absolute h-[5px] w-[5px] rounded-full bg-[#FFE9A8] shadow-[0_0_10px_3px_rgba(255,210,120,0.8)]"
          style={{ left: `${f.left}%`, top: `${f.top}%` }}
          animate={{ x: [0, f.dx, 0], y: [0, f.dy, 0], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: f.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}
    </motion.div>
  );
}

/* ---------- sinar fajar dari balik pendopo ---------- */

function SunRays() {
  const { sun } = useScene();
  const opacity = useTransform(sun, (s) => s);
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }}>
      {[-34, -16, 0, 16, 34].map((rot, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-[33%] h-[70%] w-[22%] origin-top"
          style={{ x: "-50%", rotate: 180 + rot, background: "radial-gradient(50% 100% at 50% 0%, rgba(255,222,160,0.34), transparent 80%)" }}
          animate={{ opacity: [0.25, 0.55, 0.3] }}
          transition={{ duration: 5 + i, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: i * 0.6 }}
        />
      ))}
    </motion.div>
  );
}

// burung gelap di langit jingga (kuntul & walet)
const FLOCKS = [
  { top: 14, size: 14, tone: "rgba(60,24,30,0.55)", count: 5, duration: 42, delay: -6, rise: -4 },
  { top: 22, size: 22, tone: "rgba(50,18,22,0.75)", count: 4, duration: 30, delay: -18, rise: 6, reverse: true },
  { top: 9, size: 44, tone: "rgba(40,12,14,0.92)", count: 2, duration: 13, delay: 5, rise: -10, repeatDelay: 15, detail: true },
];

const BUTTERFLY_COLORS = [
  { a: "#FFE7BC", b: "#EE9D55", vein: "#5A3418" },
  { a: "#FFF4C8", b: "#E2B64A", vein: "#5E4818" },
  { a: "#FFE3DA", b: "#E07A5A", vein: "#6A3028" },
];

const AMBIENT_BUTTERFLIES = [
  { left: 20, top: 70, size: 34, ...BUTTERFLY_COLORS[0], dur: 17, path: [[0, 0], [40, -60], [90, -30], [60, 30], [0, 0]] },
  { left: 74, top: 64, size: 30, ...BUTTERFLY_COLORS[1], dur: 20, path: [[0, 0], [-50, -40], [-90, 10], [-30, 40], [0, 0]] },
  { left: 46, top: 80, size: 26, ...BUTTERFLY_COLORS[2], dur: 15, path: [[0, 0], [30, -50], [-20, -90], [-40, -30], [0, 0]] },
];

/* ============================================================
   AWAN MEGA MENDUNG PENUTUP (bagian dari adegan, ikut berlanjut di latar)
   ============================================================ */

// [nama, sisi, x %, top %, lebar %] — sisi kanan dicerminkan
const VEIL = [
  ["cloudF", 8, 30, 58],
  ["cloudGold", 14, 46, 74],
  ["cloudCream", 4, 60, 66],
  ["cloudD", 18, 72, 70],
  ["cloudC", 6, 84, 86],
];

function CloudVeil() {
  const { part, still } = useScene();
  const opacity = useTransform(part, [0.75, 1], [1, 0]);
  const haze = useTransform(part, (p) => (1 - p) * 0.85);
  if (still) return null;
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" style={{ opacity }}>
      {/* cahaya fajar samar di balik awan */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(70%_60%_at_50%_70%,rgba(255,210,160,0.55),rgba(200,110,110,0.2)_55%,transparent)]"
        style={{ opacity: haze }}
      />
      {[-1, 1].map((side) => (
        <VeilSide key={side} side={side} />
      ))}
    </motion.div>
  );
}

function VeilSide({ side }) {
  const { part } = useScene();
  const x = useTransform(part, (p) => `${side * p * 85}%`);
  const scale = useTransform(part, (p) => 1 + p * 0.35);
  return (
    <motion.div className="absolute inset-0" style={{ x, scale, transformOrigin: side < 0 ? "0% 60%" : "100% 60%" }}>
      {VEIL.map(([name, xl, top, w], i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: `${side < 0 ? xl : 100 - xl}%`, top: `${top}%`, width: `${w}%`, transform: `translate(-50%,-50%)${side > 0 ? " scaleX(-1)" : ""}` }}
        >
          <motion.img
            src={`${ASSET}/${name}.webp`}
            alt=""
            draggable={false}
            className="block w-full select-none"
            animate={{ x: ["-3%", "3%", "-3%"], y: ["0%", "-4%", "0%"] }}
            transition={{ duration: 9 + i * 1.3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      ))}
    </motion.div>
  );
}

/* ============================================================
   ADEGAN LENGKAP
   ============================================================ */

function ArunikaScene({ cam, interactive = true, focusY = 0.5 }) {
  const ctx = useScene();
  const [ref, box] = useStageBox(9 / 16, focusY);
  const reduce = useReducedMotion();
  const live = interactive && !reduce && !ctx.still;
  useTiltInput(live);
  useWind(live);
  const [bursts, setBursts] = useState([]);
  const [ripples, setRipples] = useState([]);
  const [freed, setFreed] = useState([]);
  const seq = useRef(0);
  // kamera menengadah ke langit saat subuh, lalu turun menatap pelataran
  // + kamera perjalanan menengadah (lift) ke langit fajar
  const lookY = useTransform([ctx.descend, ctx.cam.lift], ([d, l]) => `${(1 - d) * 32 + l * 26}%`); // sisakan tepi agar goyang parallax tak memperlihatkan ujung langit
  const tint = useTransform(ctx.sun, (s) => (1 - s) * 0.45);
  // malam turun saat penutup
  const night = useTransform(ctx.cam.dusk, (n) => n * 0.6); // langit fajar lebih terang dari senja Minang

  const onAction = (item, e) => {
    if (!live) return;
    const root = ref.current?.getBoundingClientRect();
    if (!root) return;
    const x = e.clientX - root.left;
    const y = e.clientY - root.top;
    const id = ++seq.current;
    if (item.tap === "tree") {
      gust(0.8);
      const leaves = Array.from({ length: 9 }, (_, i) => ({
        dx: (i % 2 ? 1 : -1) * (30 + ((i * 37) % 90)),
        up: -20 - ((i * 13) % 40),
        fall: 220 + ((i * 53) % 260),
        spin: (i % 2 ? 1 : -1) * (200 + i * 40),
        dur: 2.6 + (i % 4) * 0.5,
        size: 11 + (i % 3) * 4,
        colors: LEAF_COLORS[i % LEAF_COLORS.length],
      }));
      setBursts((b) => [...b, { id, x, y, leaves }]);
      setTimeout(() => setBursts((b) => b.filter((v) => v.id !== id)), 4800);
    }
    if (item.tap === "lotus") {
      setRipples((r) => [...r, { id, x, y }]);
      setTimeout(() => setRipples((r) => r.filter((v) => v.id !== id)), 2400);
      const c = BUTTERFLY_COLORS[id % BUTTERFLY_COLORS.length];
      const dir = item.x < 50 ? 1 : -1;
      const bf = { left: (x / root.width) * 100, top: (y / root.height) * 100, size: 28, ...c, dur: 6, path: [[0, 0], [dir * 40, -80], [dir * 110, -160], [dir * 180, -260], [dir * 240, -360]] };
      setFreed((f) => [...f, { id, bf }]);
      setTimeout(() => setFreed((f) => f.filter((v) => v.id !== id)), 6000);
    }
  };

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#1E1634]" onClick={live ? tapAt : undefined}>
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          <motion.div className="absolute inset-0" style={{ y: lookY }}>
            <Sky />
            <Layer layer={LAYERS[0]} cam={cam} onAction={onAction} />
            <Ground />
            {/* pohon, pagoda & pendopo → kabut melayang → kolam & lentera (kabut tak menutupi lentera) */}
            {LAYERS.slice(1, 4).map((layer) => (
              <Layer key={layer.id} layer={layer} cam={cam} onAction={onAction} />
            ))}
            <Mist />
            {LAYERS.slice(4, -1).map((layer) => (
              <Layer key={layer.id} layer={layer} cam={cam} onAction={onAction} />
            ))}
            <GateLayer cam={cam} onAction={onAction} />
            <Layer layer={LAYERS[LAYERS.length - 1]} cam={cam} onAction={onAction} />
          </motion.div>
        </div>
      )}

      {/* rona subuh di atas seluruh adegan, memudar saat matahari terbit */}
      <motion.div className="pointer-events-none absolute inset-0 bg-[#2A1840]" style={{ opacity: tint }} />
      <motion.div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#120C24,#2A1430_60%,#1E0E14)]" style={{ opacity: night }} />
      <SunRays />
      {!ctx.still && (
        <>
          <Fireflies />
          <Flocks list={FLOCKS} />
          <Butterflies list={AMBIENT_BUTTERFLIES} />
          {freed.map((f) => (
            <Butterflies key={f.id} list={[f.bf]} />
          ))}
          <Dust palette={tone.dust} count={14} />
          <FallingLeaves bursts={bursts} />
          <TapRipples ripples={ripples} />
        </>
      )}
      <CloudVeil />

      {/* vinyet & gradasi atas agar nama terbaca */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_65%_at_50%_45%,transparent_55%,rgba(40,14,20,0.5)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26%] bg-gradient-to-b from-[#1E1230]/70 to-transparent" />
    </div>
  );
}

/* ---------- thumbnail katalog: pelataran pendopo saat matahari sudah terbit ---------- */

const ZERO = motionValue(0);

export function ArunikaThumb() {
  return (
    <Scene.Provider value={{ ...STILL, cam: STILL_CAM, still: true }}>
      {/* kartu lebih pendek dari panggung: fokus ke matahari & pendopo */}
      <ArunikaScene cam={ZERO} interactive={false} focusY={0.15} />
    </Scene.Provider>
  );
}

/* ============================================================
   COVER
   ============================================================ */

export function ArunikaCover({ t, guestName, onOpen }) {
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // subuh di atas awan: semua kembali ke awal
    Object.values(LIVE).forEach((v) => v.set(0));
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
    // 1 awan tersibak → 2 kamera turun & matahari terbit → 3 pelataran tersusun
    // → 4 melangkah melewati candi bentar → 5 nama muncul
    gust(0.5);
    animate(LIVE.part, 1, { duration: 2.6, ease: MOTION.door });
    animate(LIVE.descend, 1, { delay: 0.3, duration: 3.2, ease: [0.6, 0, 0.3, 1] });
    animate(LIVE.sun, 1, { delay: 0.2, duration: 4.4, ease: [0.3, 0, 0.3, 1] });
    animate(LIVE.build, 1, { delay: 0.6, duration: 2.8, ease: "linear" });
    animate(LIVE.dolly, 1, { delay: 3.1, duration: 3, ease: MOTION.dolly });
    animate(heroReveal, 1, { delay: 5.5, duration: 1.4, ease });
    // pindah ke undangan; adegan latar melanjutkan gerak yang sama
    setTimeout(onOpen, 2000);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <ArunikaScene cam={ZERO} />
        <Petals palette={tone.petals} count={8} />
        <div className="relative z-[7] h-full">
          <CoverTitle tone={tone} t={t} leaving={leaving} delay={0.2} />
          <GuestPanel tone={tone} guestName={guestName} leaving={leaving} onOpen={open} delay={1.2} />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HERO, LATAR TETAP & DEKORASI (kit bersama)
   ============================================================ */

const HeroScene = makeHeroScene({ tone, kicker: "PAHARGYAN DHAUP", reveal: heroReveal });

/* latar tetap: adegan menempel di belakang seluruh undangan; posisi scroll menentukan pose
   kamera (bab yang sedang menempel, atau pose istirahat), selubung gelap = CAM.dim */
function Backdrop() {
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => aimRig(poseAt(y, window.innerHeight)));
  useEffect(() => aimRig(poseAt(window.scrollY, window.innerHeight)), []);
  return (
    <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden" aria-hidden="true">
      <ArunikaScene cam={ZERO} />
      <motion.div style={{ opacity: CAM.dim }} className={`absolute inset-0 ${tone.wash}`} />
    </div>
  );
}

/* isi undangan sebagai perjalanan kamera di pelataran pendopo (kit/journey.jsx) */
const { Journey, Closing } = makeJourney({
  tone,
  asset: ASSET,
  // kain sindur (upacara panggih): merah berpinggir putih
  accent: "bg-[linear-gradient(90deg,#FFF4E2_0_16%,#B3202A_16%_84%,#FFF4E2_84%_100%)]",
  crown: { src: "crest", className: "-mb-1 w-[72%]" },
  lantern: { src: "lantern", glow: "top-[24%]" },
  portal: {
    crown: { src: "crest", className: "-mb-2 w-[66%]" },
    side: { src: "lantern", className: "bottom-[-3%] h-[44%] w-auto max-w-none", left: "left-[-13%]", right: "right-[-13%]", mirror: true },
    base: { src: "platform", className: "bottom-[-6%] left-1/2 w-[112%] -translate-x-1/2" },
  },
  copy: {
    ampTag: "GARWA · SIGARANING NYAWA",
    storyKicker: "LAMPAH TRESNA",
    storyTitle: "Jejak Kenangan",
    storySub: "Tiap lentera di pelataran ini menyimpan satu kenangan",
    eventsSub: "Mari melangkah masuk ke pendopo",
    thanks: "MATUR NUWUN",
  },
});

const SectionDecor = makeSectionDecor(tone);

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={12} />;
}

export const arunikaDecor = { Backdrop, HeroScene, Section: SectionDecor, Global: GlobalDecor, Journey, Closing, skipOpening: true };

/* ---------- isi undangan bernuansa Jawa ---------- */

export function arunikaData(data) {
  return {
    ...data,
    groom: { ...data.groom, fullName: "Raden Bagas Wicaksono", parents: "Putra pertama dari Bapak R. Hadi Purnomo & Ibu Sri Rahayu" },
    bride: { ...data.bride, fullName: "Larasati Kusuma Wardani", parents: "Putri kedua dari Bapak Suryo Wibowo & Ibu Endang Pertiwi" },
    quote: {
      text: "Garwa iku sigaraning nyawa — pasangan hidup adalah separuh jiwa. Dua insan dipersatukan untuk saling momong, saling ngemong, hingga akhir hayat.",
      source: "Pitutur Jawa",
    },
    events: [
      {
        id: "akad",
        title: "Ijab Qabul",
        start: "2026-12-12T08:00:00+07:00",
        end: "2026-12-12T09:30:00+07:00",
        venue: "Masjid Gedhe Kauman",
        address: "Jl. Kauman, Ngupasan, Gondomanan, Yogyakarta",
        mapsUrl: "https://maps.google.com/?q=Masjid+Gedhe+Kauman+Yogyakarta",
      },
      {
        id: "resepsi",
        title: "Panggih & Pahargyan",
        start: "2026-12-12T11:00:00+07:00",
        end: "2026-12-12T14:00:00+07:00",
        venue: "Pendopo Agung Royal Ambarrukmo",
        address: "Jl. Laksda Adisucipto No. 81, Caturtunggal, Sleman, Yogyakarta",
        mapsUrl: "https://maps.google.com/?q=Royal+Ambarrukmo+Yogyakarta",
      },
    ],
    story: [
      { year: "2019", title: "Tepung Pisan", text: "Pertama bertemu di sebuah pentas karawitan kampus di Yogyakarta, berawal dari obrolan soal gending favorit." },
      { year: "2021", title: "Tresna Tumuwuh", text: "Witing tresna jalaran saka kulina — dari sering bersama, rasa itu tumbuh dengan sendirinya." },
      { year: "2025", title: "Lamaran", text: "Dengan restu kedua keluarga, Bagas datang melamar Laras dalam acara nontoni yang hangat." },
      { year: "2026", title: "Dhaup", text: "Kini kami siap menyatukan dua keluarga, dan ingin merayakannya bersama Bapak/Ibu/Saudara/i." },
    ],
  };
}
