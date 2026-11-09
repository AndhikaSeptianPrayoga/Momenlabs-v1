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
   MOMENLABS — TEMPLATE "GOLDEN MINANGKABAU" (Adat Minang, senja keemasan)
   ------------------------------------------------------------
   Istana rumah gadang berkabut di bawah matahari senja. Pengunjung
   diajak "masuk" ke dunianya:
     1. Di atas kabut emas — langit senja, matahari masih tinggi,
        nama & tamu di atasnya.
     2. "Buka Undangan": kabut tersibak ke kedua sisi, kamera turun
        dari langit, matahari perlahan tenggelam ke balik gonjong
        istana, lentera menyala satu per satu.
     3. Halaman tersusun berpasangan (simetris): gunung, pohon emas,
        istana, taman, lentera, marawa, tanaman depan.
     4. Kamera melangkah menembus kabut ke halaman istana → nama muncul.

   Lapisan (belakang → depan), semua sprite utuh dari desainer:
     langit senja (sky only) → matahari → dua gunung → lantai batu basah
     (ground only) → pohon → istana → taman → kabut → lentera → marawa
     → kabut depan → pohon besar & tanaman bingkai.

   Interaksi: parallax mouse/gyroscope, angin dari gerak kursor (pohon,
   tanaman, marawa bergoyang), sentuh pohon → daun emas gugur, sentuh
   lentera → api berkobar, sentuh marawa → berkibar, sentuh tanaman →
   kupu-kupu terbang, sentuh lantai basah → riak genangan, sentuh
   istana → pendar emas.
   Ambient: kabut melayang, kilau pantulan di lantai basah, sinar senja,
   kunang-kunang petang, burung pulang, kupu-kupu, daun gugur, debu emas.
   Aset: assets-src/golden-minang → scripts/golden-minang-assets.cjs
   ============================================================ */

const ASSET = "/templates/golden-minang";
const tone = TONES.goldenHour;
const ease = MOTION.ease;
const VP = { x: 50, y: 60 }; // titik hilang: tangga istana
const VP_CSS = `${VP.x}% ${VP.y}%`;

/* nilai bersama cover, hero & latar agar transisi menyambung */
const LIVE = {
  part: motionValue(1), // 0 kabut menutup → 1 tersibak
  descend: motionValue(1), // 0 menengadah ke langit → 1 menatap halaman
  sun: motionValue(1), // 0 matahari tinggi → 1 tenggelam di balik istana
  build: motionValue(1), // 0 kosong → 1 halaman tersusun
  dolly: motionValue(0), // 0 di balik kabut → 1 sudah di halaman
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
   Panggung 9:16. x = tengah sprite (%), bottom/top = alas/puncak (%), w = lebar (%).
   Angka di LAYERS adalah posisi AKHIR (setelah kamera masuk), mengikuti lukisan
   referensi; landed() menghitung balik posisi awalnya karena tiap lapisan membesar
   dari titik hilang saat kamera masuk.
   pair(): sisi kanan dicerminkan agar berpasangan sempurna.
   depth: geser parallax (px) & laju zoom saat kamera masuk.
   at: kapan muncul saat halaman tersusun (0..1 dari build).
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

/* Tata letak mengikuti lukisan referensi (cakrawala 62%). Di HP 375×812 panggung 9:16 lebih
   lebar dari layar: yang terlihat hanya ±82% bagian tengahnya (x 9–91%).
   matahari besar tepat di belakang gonjong tengah; dua gunung di kiri-kanan;
   istana selebar layar dengan tangga di tengah; pohon emas & taman di kaki istana;
   sepasang lentera & marawa mengapit jalan batu; pohon besar membingkai sudut atas,
   tanaman berdaun lebar membingkai sudut bawah. */
const LAYERS = [
  { id: "mountains", depth: 3, items: pair({ name: "mountain", bottom: 47, w: 88, at: 0 }, 14) },
  {
    id: "trees",
    depth: 6,
    items: [
      ...pair({ name: "tree", bottom: 36, w: 30, at: 0.06, sway: 1, tap: "tree" }, 5),
      ...pair({ name: "house", bottom: 38, w: 30, at: 0.1, tap: "glow" }, 13),
    ],
  },
  { id: "palace", depth: 8, items: [{ name: "palace", x: 50, bottom: 37.2, w: 82, at: 0.16, tap: "glow" }] },
  {
    id: "garden",
    depth: 11,
    items: [
      ...pair({ name: "treeGold", bottom: 35.5, w: 24, at: 0.24, sway: 1.1, tap: "tree" }, 7),
      ...pair({ name: "hedgeFlower", bottom: 34.4, w: 36, at: 0.3, sway: 0.4 }, 23),
    ],
  },
  {
    id: "lanterns",
    depth: 15,
    items: [
      ...pair({ name: "kerb", bottom: 25, w: 44, at: 0.38 }, 13),
      ...pair({ name: "lantern", bottom: 26, w: 12, at: 0.44, tap: "lamp", lamp: true }, 31),
    ],
  },
  { id: "banners", depth: 19, items: pair({ name: "banner", bottom: 15, w: 30, at: 0.52, sway: 1.4, flutter: true, tap: "banner" }, 12) },
  {
    id: "frame",
    depth: 24,
    frame: true,
    items: [
      ...pair({ name: "treeGold", bottom: 38, w: 92, at: 0.6, sway: 1.2, origin: "50% 100%", tap: "tree" }, -14),
      ...pair({ name: "leafBig", bottom: -4, w: 50, at: 0.66, sway: 0.8, tap: "plant" }, 6),
      ...pair({ name: "plant", bottom: -7, w: 40, at: 0.7, sway: 0.7, tap: "plant" }, 25),
    ],
  },
].map((layer) => ({ ...layer, items: layer.items.map((it) => landed(it, 1 + zoomOf(layer))) }));

/* ---------- langit senja (sky only) ---------- */

function Sky() {
  const { sun, dolly, still, cam } = useScene();
  const x = useTransform([tiltX, cam.pan], ([v, p]) => `calc(${-v * 2.5}px + ${-p * panShift(0)}%)`);
  const y = useTransform(tiltY, (v) => -v * 2);
  const scale = useTransform([dolly, cam.push], ([d, p]) => (1 + d * 0.04) * (1 + p * 0.08));
  // langit pucat keperakan sebelum senja → keemasan pekat saat matahari turun
  const pale = useTransform(sun, (s) => (1 - s) * 0.55);
  // matahari turun dari langit tinggi ke balik gonjong istana
  const sunBottom = useTransform(sun, (s) => `${70 - s * 22}%`);
  const glowBottom = useTransform(sun, (s) => `${78 - s * 22}%`);
  const sunGlow = useTransform(sun, (s) => 0.55 + s * 0.45);
  const sunScale = useTransform(sun, (s) => 0.9 + s * 0.1);
  return (
    <motion.div className="absolute inset-0" style={{ x, y, scale, transformOrigin: VP_CSS }}>
      {/* langit desainer: cakrawala lautnya (72% tinggi gambar) tepat di cakrawala panggung (62%),
          bagian atasnya cukup tinggi untuk pandangan menengadah saat cover */}
      <img
        src={`${ASSET}/sky.webp`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-[-34%] h-[133.4%] w-auto max-w-none -translate-x-1/2 select-none"
      />
      <motion.div
        className="absolute inset-x-0 top-[-34%] h-[96%] bg-[linear-gradient(180deg,rgba(70,58,52,0.85)_0%,rgba(150,128,104,0.55)_55%,rgba(255,236,200,0.25)_100%)]"
        style={{ opacity: pale }}
      />
      {/* pendar & matahari senja */}
      <motion.div
        className="absolute left-1/2 aspect-square w-[130%] rounded-full bg-[radial-gradient(closest-side,rgba(255,232,170,0.8),rgba(255,190,90,0.35)_38%,rgba(220,130,40,0.1)_65%,transparent)]"
        style={{ bottom: glowBottom, x: "-50%", y: "50%", opacity: sunGlow }}
      />
      {/* cakram matahari (37% lebar gambar) ada di 62% lebar gambar (awan di kiri-kanannya): digeser agar cakramnya di tengah */}
      <motion.div className="absolute left-[39.3%] w-[89%]" style={{ bottom: sunBottom, x: "-50%", scale: sunScale }}>
        <motion.img
          src={`${ASSET}/sun.webp`}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="block w-full select-none"
          animate={still ? undefined : { filter: ["brightness(1)", "brightness(1.14)", "brightness(1)"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ---------- lantai batu basah (ground only) — sudah dilukis berperspektif ---------- */

// kilau pantulan yang berkedip di genangan: [x %, top %, lebar %]
const GLINTS = [
  [22, 66, 10],
  [36, 72, 7],
  [50, 68, 12],
  [64, 74, 8],
  [78, 67, 10],
  [30, 82, 9],
  [70, 85, 9],
  [50, 90, 14],
];

function Ground() {
  const { dolly, still, cam } = useScene();
  const x = useTransform([tiltX, cam.pan], ([v, p]) => `calc(${-v * 6}px + ${-p * panShift(0.4)}%)`);
  const y = useTransform(tiltY, (v) => -v * 4);
  const scale = useTransform([dolly, cam.push], ([d, p]) => (1 + d * 0.24) * (1 + p * 0.7));
  return (
    <motion.div className="absolute inset-0" style={{ x, y, scale, transformOrigin: VP_CSS }}>
      {/* tepi atas lantai (sudah memudar di gambarnya) tepat di cakrawala; titik hilang di tengah */}
      <img
        src={`${ASSET}/ground.webp`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-[61%] h-[40%] w-auto max-w-none -translate-x-1/2 select-none"
      />
      {/* pantulan matahari memanjang di lantai basah */}
      <motion.div
        className="absolute left-1/2 top-[62%] h-[38%] w-[34%] -translate-x-1/2 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(255,214,130,0.5),rgba(255,180,80,0.15)_55%,transparent_80%)]"
        animate={still ? undefined : { opacity: [0.7, 1, 0.7], scaleX: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      {!still &&
        GLINTS.map(([gx, top, w], i) => (
          <motion.div
            key={i}
            className="absolute h-[0.6%] rounded-full bg-[radial-gradient(closest-side,rgba(255,240,200,0.95),transparent)]"
            style={{ left: `${gx}%`, top: `${top}%`, width: `${w}%`, x: "-50%" }}
            animate={{ opacity: [0, 0.9, 0], scaleX: [0.6, 1.2, 0.6] }}
            transition={{ duration: 2.4 + (i % 3) * 0.7, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }}
          />
        ))}
      {/* kabut cakrawala: menyatukan kaki gunung, langit & halaman */}
      <motion.div
        className="absolute inset-x-0 top-[54%] h-[14%] bg-[linear-gradient(180deg,transparent,rgba(255,222,160,0.55)_45%,rgba(230,170,90,0.22)_72%,transparent)]"
        animate={still ? undefined : { opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* kabut emas tipis yang melayang di atas halaman */
function Mist() {
  const { still } = useScene();
  if (still) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {[
        ["top-[52%]", "h-[10%]", 40, 0.6],
        ["top-[58%]", "h-[9%]", 54, 0.45],
        ["top-[70%]", "h-[11%]", 64, 0.28],
      ].map(([top, h, dur, op], i) => (
        <motion.div
          key={i}
          className={`absolute left-[-50%] w-[200%] ${top} ${h} bg-[radial-gradient(50%_50%_at_30%_50%,rgba(255,236,196,0.9),transparent_70%),radial-gradient(40%_50%_at_75%_50%,rgba(255,222,170,0.8),transparent_70%)]`}
          style={{ opacity: op }}
          animate={{ x: i % 2 ? ["8%", "-8%", "8%"] : ["-8%", "8%", "-8%"] }}
          transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ---------- sentuhan sadar-transparansi ----------
   Kotak gambar pohon besar menutupi lentera & marawa di belakangnya. Saat disentuh,
   semua sprite di titik itu diperiksa dari depan ke belakang dan yang dipilih adalah
   yang pikselnya benar-benar tidak transparan. Tidak kena sprite → lantai basah. */

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

/* ---------- sprite: muncul berpasangan, bergoyang angin, bisa disentuh ---------- */

function Sprite({ item, index, onAction }) {
  const { build, sun, still } = useScene();
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
  // marawa berkibar: kain melengkung pelan, makin kuat saat berangin
  const skewY = useTransform([time, wind], ([t, w]) => {
    if (!item.flutter || still) return 0;
    const s = t / 1000;
    return Math.sin(s * 1.7 + phase) * (1.2 + w * 4) + Math.sin(s * 4.1 + phase) * (0.4 + w * 1.5);
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
        <motion.div style={{ rotate, skewY, transformOrigin: origin }}>
          {item.lamp && <LampGlow flare={glow} still={still} sun={sun} />}
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
            initial={active ? { filter: "drop-shadow(0 0 18px rgba(255,206,110,0.95))" } : false}
            animate={{
              filter: "drop-shadow(0 6px 10px rgba(30,16,4,0.3))",
              scale: active ? [1, 1.06, 1] : 1,
              rotate: active && (item.tap === "tree" || item.tap === "plant") ? [0, -2.5, 2, -1, 0] : 0,
              skewY: active && item.tap === "banner" ? [0, 7, -6, 4, -2, 0] : 0,
            }}
            transition={{ duration: item.tap === "banner" ? 1.6 : 0.9, ease: "easeOut" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* api lentera (di belakang sprite agar batunya tetap jelas): menyala saat matahari
   tenggelam, berkedip, berkobar saat disentuh */
function LampGlow({ flare, still, sun }) {
  const lit = useTransform(sun, (s) => clamp01((s - 0.35) / 0.5));
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: lit }}>
      <motion.div
        className="absolute left-1/2 top-[46%] aspect-square w-[230%] rounded-full bg-[radial-gradient(closest-side,rgba(255,220,140,0.7),rgba(255,160,60,0.25)_40%,transparent)]"
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
  // tilt (px) + kamera menoleh: lapisan dekat bergeser lebih jauh (parallax)
  const x = useTransform([tiltX, rig.pan], ([v, p]) => `calc(${-v * layer.depth}px + ${-p * panShift(k)}%)`);
  const y = useTransform(tiltY, (v) => -v * layer.depth * 0.6);
  // kamera melangkah masuk: lapisan dekat membesar & menyingkir lebih cepat
  // bingkai depan (pohon besar & tanaman) tetap terlihat seperti di lukisan, hanya sedikit membesar
  const zoom = zoomOf(layer);
  // melangkah masuk ke pintu istana: lapisan dekat membesar & menyingkir, lalu memudar
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

/* ---------- kabut depan: kamera menembusnya saat melangkah masuk ---------- */

function FrontMist() {
  const { dolly, still } = useScene();
  const opacity = useTransform(dolly, (d) => (d < 0.15 ? 0.2 + d * 4 : 1 - clamp01((d - 0.15) / 0.6)));
  const scale = useTransform(dolly, (d) => 1 + d * 1.8);
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
  if (still) return null;
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ opacity, scale, visibility, transformOrigin: VP_CSS }}>
      <div className="absolute inset-x-[-20%] top-[40%] h-[50%] bg-[radial-gradient(45%_40%_at_25%_50%,rgba(255,232,190,0.85),transparent_70%),radial-gradient(45%_40%_at_75%_55%,rgba(255,226,180,0.8),transparent_70%),radial-gradient(60%_30%_at_50%_40%,rgba(255,240,210,0.6),transparent_70%)]" />
    </motion.div>
  );
}

/* ---------- daun emas gugur (dari pohon desainer) ---------- */

const LEAF = "M0 -10 C4 -8 7 -4 7 0 C7 5 3 9 0 10 C-3 9 -7 5 -7 0 C-7 -4 -4 -8 0 -10 Z";
const LEAF_COLORS = [
  ["#F6C25A", "#9A6418"],
  ["#E89A3A", "#8A4A12"],
  ["#FFE08A", "#B07A22"],
  ["#C9782C", "#5E340C"],
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

const AMBIENT_LEAVES = Array.from({ length: 9 }, (_, i) => ({
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
          <Leaf size={l.size} colors={l.colors} id={`gm-leaf-a${i}`} />
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
            <Leaf size={l.size} colors={l.colors} id={`gm-leaf-${b.id}-${i}`} />
          </motion.div>
        ))
      )}
    </div>
  );
}

/* ---------- riak genangan saat lantai basah disentuh ---------- */

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

/* ---------- kunang-kunang petang: muncul saat matahari tenggelam ---------- */

const FIREFLIES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 29 + 5) % 94,
  top: 46 + ((i * 17) % 44),
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

/* ---------- sinar senja memancar dari cakram matahari (di langit, di belakang istana) ---------- */

function SunRays() {
  const { sun } = useScene();
  const opacity = useTransform(sun, (s) => 0.4 + s * 0.6);
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity }}>
      {[-62, -40, -20, 0, 20, 40, 62].map((rot, i) => (
        <motion.div
          key={i}
          className="absolute bottom-[57%] left-1/2 h-[46%] w-[16%] origin-bottom"
          style={{ x: "-50%", rotate: rot, background: "radial-gradient(50% 100% at 50% 100%, rgba(255,230,160,0.4), transparent 80%)" }}
          animate={{ opacity: [0.25, 0.55, 0.3] }}
          transition={{ duration: 5 + i, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: i * 0.6 }}
        />
      ))}
    </motion.div>
  );
}

// burung pulang ke sarang saat senja
const FLOCKS = [
  { top: 12, size: 14, tone: "rgba(60,36,16,0.55)", count: 6, duration: 44, delay: -6, rise: -4 },
  { top: 21, size: 22, tone: "rgba(50,28,10,0.75)", count: 4, duration: 30, delay: -18, rise: 6, reverse: true },
  { top: 8, size: 42, tone: "rgba(40,22,8,0.92)", count: 2, duration: 13, delay: 5, rise: -10, repeatDelay: 15, detail: true },
];

const BUTTERFLY_COLORS = [
  { a: "#FFEFC0", b: "#E8A848", vein: "#5A3A14" },
  { a: "#FFF6D0", b: "#D8A030", vein: "#5E4414" },
  { a: "#FFE6C8", b: "#D07838", vein: "#5E3018" },
];

const AMBIENT_BUTTERFLIES = [
  { left: 18, top: 72, size: 32, ...BUTTERFLY_COLORS[0], dur: 17, path: [[0, 0], [40, -60], [90, -30], [60, 30], [0, 0]] },
  { left: 76, top: 66, size: 28, ...BUTTERFLY_COLORS[1], dur: 20, path: [[0, 0], [-50, -40], [-90, 10], [-30, 40], [0, 0]] },
  { left: 48, top: 82, size: 24, ...BUTTERFLY_COLORS[2], dur: 15, path: [[0, 0], [30, -50], [-20, -90], [-40, -30], [0, 0]] },
];

/* ============================================================
   KABUT EMAS PENUTUP (bagian dari adegan, ikut berlanjut di latar)
   gumpalan kabut lembut — tanpa tepi potongan
   ============================================================ */

// [x %, top %, lebar %, tinggi %] — sisi kanan dicerminkan
const VEIL = [
  [4, 44, 80, 18],
  [20, 58, 96, 22],
  [2, 70, 90, 20],
  [24, 84, 100, 22],
  [10, 98, 110, 22],
];

function MistVeil() {
  const { part, still } = useScene();
  const opacity = useTransform(part, [0.7, 1], [1, 0]);
  const haze = useTransform(part, (p) => (1 - p) * 0.8);
  if (still) return null;
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" style={{ opacity }}>
      {/* cahaya senja samar di balik kabut */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[60%] bg-[linear-gradient(180deg,transparent,rgba(255,226,170,0.4)_45%,rgba(240,190,110,0.35))]"
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
  const x = useTransform(part, (p) => `${side * p * 90}%`);
  const scale = useTransform(part, (p) => 1 + p * 0.3);
  return (
    <motion.div className="absolute inset-0" style={{ x, scale, transformOrigin: side < 0 ? "0% 60%" : "100% 60%" }}>
      {VEIL.map(([xl, top, w, h], i) => (
        <motion.div
          key={i}
          className="absolute rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,240,212,0.8),rgba(255,226,180,0.5)_45%,rgba(240,200,140,0.15)_75%,transparent)]"
          style={{ left: `${side < 0 ? xl : 100 - xl}%`, top: `${top}%`, width: `${w}%`, height: `${h}%`, x: "-50%", y: "-50%" }}
          animate={{ x: ["-53%", "-47%", "-53%"], y: ["-50%", "-54%", "-50%"] }}
          transition={{ duration: 9 + i * 1.3, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

/* ============================================================
   ADEGAN LENGKAP
   ============================================================ */

function GoldenMinangScene({ cam, interactive = true, focusY = 0.5 }) {
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
  // kamera menengadah ke langit saat cover, lalu turun menatap halaman
  // + kamera perjalanan menengadah (lift) ke langit senja
  const lookY = useTransform([ctx.descend, ctx.cam.lift], ([d, l]) => `${(1 - d) * 32 + l * 26}%`); // sisakan tepi agar goyang parallax tak memperlihatkan ujung langit
  // senja makin pekat saat matahari turun, lalu malam saat penutup
  const dusk = useTransform([ctx.sun, ctx.cam.dusk], ([s, n]) => s * 0.16 + n * 0.42);

  const point = (e) => {
    const root = ref.current?.getBoundingClientRect();
    return root && { root, x: e.clientX - root.left, y: e.clientY - root.top, id: ++seq.current };
  };

  const ripple = (p) => {
    setRipples((r) => [...r, p]);
    setTimeout(() => setRipples((r) => r.filter((v) => v.id !== p.id)), 2400);
  };

  const onAction = (item, e) => {
    if (!live) return;
    const p = point(e);
    if (!p) return;
    const { root, x, y, id } = p;
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
    if (item.tap === "banner") gust(0.9);
    if (item.tap === "plant") {
      gust(0.4);
      const c = BUTTERFLY_COLORS[id % BUTTERFLY_COLORS.length];
      const dir = item.x < 50 ? 1 : -1;
      const bf = { left: (x / root.width) * 100, top: (y / root.height) * 100, size: 28, ...c, dur: 6, path: [[0, 0], [dir * 40, -80], [dir * 110, -160], [dir * 180, -260], [dir * 240, -360]] };
      setFreed((f) => [...f, { id, bf }]);
      setTimeout(() => setFreed((f) => f.filter((v) => v.id !== id)), 6000);
    }
  };

  // sentuhan yang tidak kena sprite: riak di lantai basah (di bawah cakrawala)
  const onFloor = (e) => {
    const p = point(e);
    if (p && p.y > p.root.height * 0.62) ripple(p);
  };

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#2A1A0C]" onClick={live ? (e) => tapAt(e, onFloor) : undefined}>
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          <motion.div className="absolute inset-0" style={{ y: lookY }}>
            <Sky />
            <SunRays />
            <Layer layer={LAYERS[0]} cam={cam} onAction={onAction} />
            <Ground />
            {/* pohon, istana & taman → kabut melayang → lentera, marawa → kabut depan → bingkai */}
            {LAYERS.slice(1, 4).map((layer) => (
              <Layer key={layer.id} layer={layer} cam={cam} onAction={onAction} />
            ))}
            <Mist />
            {LAYERS.slice(4, -1).map((layer) => (
              <Layer key={layer.id} layer={layer} cam={cam} onAction={onAction} />
            ))}
            <FrontMist />
            <Layer layer={LAYERS[LAYERS.length - 1]} cam={cam} onAction={onAction} />
          </motion.div>
        </div>
      )}

      {/* rona senja di atas seluruh adegan */}
      <motion.div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#1A0E1E,#3A1A08_60%,#2A1204)]" style={{ opacity: dusk }} />
      {!ctx.still && (
        <>
          <Fireflies />
          <Flocks list={FLOCKS} />
          <Butterflies list={AMBIENT_BUTTERFLIES} />
          {freed.map((f) => (
            <Butterflies key={f.id} list={[f.bf]} />
          ))}
          <Dust palette={tone.dust} count={16} />
          <FallingLeaves bursts={bursts} />
          <TapRipples ripples={ripples} />
        </>
      )}
      <MistVeil />

      {/* vinyet & gradasi atas agar nama terbaca */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_65%_at_50%_45%,transparent_55%,rgba(36,20,6,0.5)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26%] bg-gradient-to-b from-[#2A1A0C]/70 to-transparent" />
    </div>
  );
}

/* ---------- thumbnail katalog: halaman istana saat senja ---------- */

const ZERO = motionValue(0);

export function GoldenMinangThumb() {
  return (
    <Scene.Provider value={{ ...STILL, cam: STILL_CAM, still: true }}>
      {/* kartu lebih pendek dari panggung: fokus ke matahari & istana */}
      <GoldenMinangScene cam={ZERO} interactive={false} focusY={0.2} />
    </Scene.Provider>
  );
}

/* ============================================================
   COVER
   ============================================================ */

export function GoldenMinangCover({ t, guestName, onOpen }) {
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // di atas kabut emas: semua kembali ke awal
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
    // 1 kabut tersibak → 2 kamera turun & matahari tenggelam → 3 halaman tersusun
    // → 4 melangkah menembus kabut ke halaman istana → 5 nama muncul
    gust(0.5);
    animate(LIVE.part, 1, { duration: 2.6, ease: MOTION.door });
    animate(LIVE.descend, 1, { delay: 0.3, duration: 3.2, ease: [0.6, 0, 0.3, 1] });
    animate(LIVE.sun, 1, { delay: 0.2, duration: 5, ease: [0.3, 0, 0.3, 1] });
    animate(LIVE.build, 1, { delay: 0.6, duration: 2.8, ease: "linear" });
    animate(LIVE.dolly, 1, { delay: 3.1, duration: 3, ease: MOTION.dolly });
    animate(heroReveal, 1, { delay: 5.5, duration: 1.4, ease });
    // pindah ke undangan; adegan latar melanjutkan gerak yang sama
    setTimeout(onOpen, 2000);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <GoldenMinangScene cam={ZERO} />
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

const HeroScene = makeHeroScene({ tone, kicker: "BARALEK GADANG", reveal: heroReveal });

/* latar tetap: adegan menempel di belakang seluruh undangan; posisi scroll menentukan pose
   kamera (bab yang sedang menempel, atau pose istirahat), selubung gelap = CAM.dim */
function Backdrop() {
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => aimRig(poseAt(y, window.innerHeight)));
  useEffect(() => aimRig(poseAt(window.scrollY, window.innerHeight)), []);
  return (
    <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden" aria-hidden="true">
      <GoldenMinangScene cam={ZERO} />
      <motion.div style={{ opacity: CAM.dim }} className={`absolute inset-0 ${tone.wash}`} />
    </div>
  );
}

const SectionDecor = makeSectionDecor(tone);

/* isi undangan sebagai perjalanan kamera di halaman istana (kit/journey.jsx) */
const { Journey, Closing } = makeJourney({
  tone,
  asset: ASSET,
  // marawa (bendera adat Minang): hitam, merah, kuning
  accent: "bg-[linear-gradient(90deg,#1A1208_0_33.3%,#B3202A_33.3%_66.6%,#E8B848_66.6%_100%)]",
  crown: { src: "gable", className: "-mb-3 w-[40%]" },
  lantern: { src: "lantern", glow: "top-[40%]" },
  portal: {
    crown: { src: "gable", className: "-mb-4 w-[38%]" },
    side: { src: "pillar", className: "bottom-0 h-[86%] w-[11%] object-fill", left: "left-[-4%]", right: "right-[-4%]" },
  },
  copy: {
    ampTag: "DUA KELUARGA · SATU IKATAN",
    storyTitle: "Jejak Langkah",
    storySub: "Tiap lentera di jalan ini menyimpan satu kenangan",
    eventsSub: "Mari melangkah masuk ke istana",
    thanks: "TERIMO KASIH",
  },
});

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={12} />;
}

export const goldenMinangDecor = {
  Backdrop,
  HeroScene,
  Section: SectionDecor,
  Global: GlobalDecor,
  Journey,
  Closing,
  skipOpening: true,
};

/* ---------- isi undangan bernuansa Minangkabau ---------- */

export function goldenMinangData(data) {
  return {
    ...data,
    groom: { ...data.groom, fullName: "Rizky Aulia Putra, S.T. Sutan Mangkuto", parents: "Putra pertama dari Bapak H. Zulkarnain Datuak Rajo Mangkuto & Ibu Hj. Yusnimar" },
    bride: { ...data.bride, fullName: "Annisa Rahmadhani, S.Pd.", parents: "Putri kedua dari Bapak Syafrizal & Ibu Rosmaniar" },
    quote: {
      text: "Adat basandi syarak, syarak basandi Kitabullah — adat bersendikan agama, agama bersendikan Al-Qur'an. Di atasnyalah dua keluarga kami satukan dalam ikatan yang diridai-Nya.",
      source: "Falsafah Minangkabau",
    },
    events: [
      {
        id: "akad",
        title: "Akad Nikah",
        start: "2026-12-12T08:00:00+07:00",
        end: "2026-12-12T09:30:00+07:00",
        venue: "Masjid Raya Sumatera Barat",
        address: "Jl. Khatib Sulaiman, Alai Parak Kopi, Padang Utara, Kota Padang",
        mapsUrl: "https://maps.google.com/?q=Masjid+Raya+Sumatera+Barat",
      },
      {
        id: "resepsi",
        title: "Baralek Gadang",
        start: "2026-12-12T11:00:00+07:00",
        end: "2026-12-12T15:00:00+07:00",
        venue: "Istano Basa Pagaruyung",
        address: "Jl. Sutan Alam Bagagarsyah, Pagaruyung, Tanjung Emas, Tanah Datar",
        mapsUrl: "https://maps.google.com/?q=Istano+Basa+Pagaruyung",
      },
    ],
    story: [
      { year: "2019", title: "Basuo", text: "Pertama bertemu di Bukittinggi, saat sama-sama menjadi panitia pentas randai di kampus." },
      { year: "2022", title: "Bakawan", text: "Dari sering bertukar kabar, tumbuh rasa yang tak lagi bisa disebut sekadar kawan." },
      { year: "2025", title: "Maminang & Batimbang Tando", text: "Keluarga Annisa datang maminang, lalu kedua keluarga bertukar tando sebagai ikatan janji." },
      { year: "2026", title: "Baralek", text: "Kini kami siap duduk basandiang, dan ingin merayakannya bersama Bapak/Ibu/Saudara/i." },
    ],
  };
}
