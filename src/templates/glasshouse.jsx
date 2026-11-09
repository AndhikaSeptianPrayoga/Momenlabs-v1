import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { animate, motion, motionValue, useMotionValueEvent, useReducedMotion, useScroll, useTime, useTransform } from "framer-motion";
import { TONES, MOTION } from "../design/tokens.js";
import {
  Bird,
  Bokeh,
  CoverTitle,
  Dust,
  Flocks,
  GuestPanel,
  Petals,
  makeHeroScene,
  makeJourney,
  makeSectionDecor,
  CAM,
  REST_TOP,
  aimRig,
  panShift,
  poseAt,
  snapRig,
  requestTiltPermission,
  tiltX,
  tiltY,
  useStageBox,
  useTiltInput,
} from "../design/kit/index.js";

/* ============================================================
   MOMENLABS — TEMPLATE "BOTANICAL GLASSHOUSE" (taman rumah kaca, senja keemasan)
   ------------------------------------------------------------
   Taman klasik Eropa saat senja, tersusun dari sprite utuh desainer
   (assets-src/botanical-glasshouse/v2 → scripts/glasshouse-assets.cjs).
     1. Cover — tirai putih tipis tertutup lalu tersibak sedikit, kamera
        menengadah ke langit senja; untaian lampu peri berayun di sisi.
     2. "Buka Undangan" — tirai tersibak & terikat di sisi, kamera turun
        menatap rumah kaca, matahari tenggelam, taman tersusun berpasangan,
        jendela & lampu taman menyala, sekawanan merpati putih terbang keluar.
     3. Kamera melangkah menembus kabut ke pintu rumah kaca, cahaya hangat
        menyambut → nama muncul.

   Lapisan (belakang → depan):
     langit lukisan & matahari → bukit berkabut → cemara jauh → rumah kaca
     (jendela berpendar, kilau atap kaca) → semak berbunga → cemara → halaman
     rumput & jalan kerikil → air mancur, topiari → patung, mawar → teras batu
     & tangga → balustrade, lampu taman, guci → bingkai pohon, rangkaian mawar
     & semak bunga → tirai & lampu peri.

   Interaksi: parallax mouse/gyroscope, angin dari gerak kursor (pohon, mawar,
   cemara, tirai bergoyang), sentuh pohon → daun gugur, mawar → kelopak berhamburan,
   lampu → api berkobar, tanaman → kupu-kupu kaca terbang, air mancur/lantai →
   riak, rumah kaca & patung → pendar emas.
   Saat di-scroll menuju bab kisah, kamera melesat masuk ke pintu rumah kaca (zoom dalam +
   kilatan cahaya) dan latar berganti ke INTERIOR rumah kaca (desain kedua).
   Isi undangan = perjalanan kamera, sinar senja, kabut, kilau atap kaca, jendela
   berkedip hangat, tirai air mancur, merpati putih melintas, kupu-kupu ekor walet
   bersayap kaca mutiara, debu cahaya, bokeh, kelopak berjatuhan.
   ============================================================ */

const ASSET = "/templates/botanical-glasshouse/v2";
const tone = TONES.ivory;
const ease = MOTION.ease;
const VP = { x: 50, y: 56 }; // titik hilang: pintu rumah kaca
const VP_CSS = `${VP.x}% ${VP.y}%`;
const HORIZON = 60; // % tinggi panggung: tepi halaman rumput

/* nilai bersama cover, hero & latar agar transisi menyambung */
const LIVE = {
  descend: motionValue(1), // 0 menengadah ke langit → 1 menatap rumah kaca
  sun: motionValue(1), // 0 matahari tinggi → 1 tenggelam
  build: motionValue(1), // 0 kosong → 1 taman tersusun
  dolly: motionValue(0), // 0 di balik tirai → 1 sudah di taman
};
const glow = motionValue(0); // cahaya hangat menyambut di pintu
const heroReveal = motionValue(1);
const wind = motionValue(0);
/* bukaan tirai: 0 = tertutup rapat, COVER_OPEN = sedikit terbuka di cover, 1 = terikat di sisi */
const curtain = motionValue(1);
const COVER_OPEN = 0.3;

const STILL = { descend: motionValue(1), sun: motionValue(1), build: motionValue(1), dolly: motionValue(1) };
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
   SUSUNAN TAMAN (simetris, panggung 9:16)
   x = tengah sprite (%), bottom/top = alas/puncak (%), w = lebar (%). Angka = posisi
   AKHIR setelah kamera masuk; landed() menghitung balik posisi awalnya.
   pair(): sisi kanan dicerminkan. depth: parallax & laju zoom. at: kapan muncul.
   Di HP yang terlihat hanya ±82% bagian tengah panggung (x 9–91%).
   Tata letak: jalan setapak lurus dari tangga teras ke pintu rumah kaca; sepasang
   air mancur & topiari mengapit jalan, patung menuntun ke pintu, cemara & semak
   membingkai rumah kaca, teras batu dengan balustrade di depan pengunjung.
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

const HAZE = "saturate(0.75) brightness(1.08) contrast(0.9)"; // cemara jauh tertutup kabut senja

const LAYERS = [
  {
    id: "far",
    depth: 2,
    items: [
      ...pair({ name: "cypressB", bottom: 40, w: 6, at: 0, filter: HAZE, sway: 0.15 }, 11),
      ...pair({ name: "cypressC", bottom: 40, w: 7, at: 0.02, filter: HAZE, sway: 0.15 }, 19),
    ],
  },
  { id: "house", depth: 5, items: [{ name: "glasshouse", x: 50, bottom: 38.5, w: 90, at: 0.04, tap: "glow", house: true }] },
  { id: "hedges", depth: 7, items: pair({ name: "hedgeA", bottom: 36.5, w: 30, at: 0.1, sway: 0.3, tap: "rose" }, 22) },
  { id: "cypress", depth: 8, items: pair({ name: "cypressA", bottom: 35, w: 12, at: 0.14, sway: 0.3, tap: "tree" }, 4) },
  {
    id: "garden",
    depth: 11,
    items: [
      ...pair({ name: "fountain", bottom: 33, w: 19, at: 0.2, tap: "fountain", water: true }, 15),
    ],
  },
  { id: "terrace", depth: 15, items: [{ name: "terrace", x: 50, bottom: -7, w: 112, at: 0.38, tap: "floor", floor: true }] },
  {
    id: "terraceDecor",
    depth: 17,
    items: [
      ...pair({ name: "balustrade", bottom: 17, w: 26, at: 0.44 }, 13),
      ...pair({ name: "lampPost", bottom: 1, w: 4.6, at: 0.48, tap: "lamp", lamp: true }, 31),
      ...pair({ name: "urnPedestal", bottom: -3, w: 12, at: 0.5, tap: "rose" }, 8),
    ],
  },
  {
    id: "frame",
    depth: 24,
    frame: true,
    items: [
      ...pair({ name: "tree", bottom: 34, w: 62, at: 0.56, sway: 1, origin: "50% 100%", tap: "tree" }, -8),
      { name: "cornerL", x: 14, top: -2, w: 40, at: 0.6, sway: 0.9, tap: "rose" },
      { name: "cornerR", x: 82, top: -2, w: 46, at: 0.62, sway: 0.9, tap: "rose" },
      ...pair({ name: "roseBush", bottom: -4, w: 42, at: 0.66, sway: 0.6, tap: "rose" }, 14),
      ...pair({ name: "hydrangea", bottom: -6, w: 26, at: 0.7, sway: 0.5, tap: "plant" }, 37),
      ...pair({ name: "shrub", bottom: 3, w: 20, at: 0.72, sway: 0.4, tap: "plant" }, 1),
    ],
  },
].map((layer) => ({ ...layer, items: layer.items.map((it) => landed(it, 1 + zoomOf(layer))) }));

/* ============================================================
   LANGIT — lukisan langit senja desainer (biru pucat → keemasan), dihidupkan:
   gerak kamera pelan, matahari tenggelam, pendar & sinar di matahari lukisan,
   kilau menyapu awan, kabut tipis, bukit berkabut di cakrawala.
   ============================================================ */

const SKY_W = 120;
const SKY_TOP = -42;
const SKY_H = SKY_W * 1.5 * (9 / 16);
const SUN_X = (100 - SKY_W) / 2 + 0.908 * SKY_W; // cakram matahari di lukisan: (90.8%, 78.5%)
const SUN_Y = SKY_TOP + 0.785 * SKY_H;

function Sky() {
  const { sun, dolly, still, cam } = useScene();
  const x = useTransform([tiltX, cam.pan], ([v, p]) => `calc(${-v * 2.5}px + ${-p * panShift(0)}%)`);
  const y = useTransform(tiltY, (v) => -v * 2);
  const scale = useTransform([dolly, cam.push], ([d, p]) => (1 + d * 0.04) * (1 + p * 0.08));
  const sink = useTransform(sun, (s) => `${(s - 1) * 8}%`);
  const pale = useTransform(sun, (s) => (1 - s) * 0.25);
  const sunPos = { left: `${SUN_X}%`, top: `${SUN_Y}%` };
  return (
    <motion.div className="absolute inset-0" style={{ x, y, scale, transformOrigin: VP_CSS }}>
      <motion.div className="absolute inset-0" style={{ y: sink }}>
        <motion.div
          className="absolute"
          style={{ left: `${(100 - SKY_W) / 2}%`, top: `${SKY_TOP}%`, width: `${SKY_W}%`, height: `${SKY_H}%`, transformOrigin: "90% 78%" }}
          animate={still ? undefined : { scale: [1, 1.06, 1], x: ["0%", "1.5%", "0%"] }}
          transition={{ duration: 50, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src={`${ASSET}/sky.webp`} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none" />
          {!still && (
            <motion.div
              className="absolute inset-0 mix-blend-soft-light"
              style={{ backgroundImage: "linear-gradient(240deg, transparent 35%, rgba(255,238,200,0.9) 48%, rgba(255,220,170,0.6) 52%, transparent 65%)", backgroundSize: "250% 250%" }}
              initial={{ backgroundPosition: "0% 100%" }}
              animate={{ backgroundPosition: ["-10% 110%", "110% -10%"] }}
              transition={{ duration: 15, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
            />
          )}
        </motion.div>
        <motion.div className="absolute inset-x-0 h-[102%] bg-[linear-gradient(180deg,rgba(150,170,210,0.6),rgba(240,225,210,0.2))]" style={{ top: `${SKY_TOP}%`, opacity: pale }} />
        {/* pendar, sinar berputar & bintang cahaya di matahari lukisan */}
        <motion.div
          className="absolute aspect-square w-[140%] rounded-full bg-[radial-gradient(closest-side,rgba(255,236,186,0.65),rgba(255,196,120,0.28)_32%,rgba(240,150,90,0.08)_60%,transparent)] mix-blend-screen"
          style={{ ...sunPos, x: "-50%", y: "-50%" }}
          animate={still ? undefined : { opacity: [0.75, 1, 0.75], scale: [1, 1.06, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        {!still && (
          <>
            <motion.div className="absolute aspect-square w-[150%] mix-blend-screen" style={{ ...sunPos, x: "-50%", y: "-50%" }} animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }}>
              <div className="h-full w-full rounded-full bg-[repeating-conic-gradient(from_0deg,rgba(255,236,190,0.2)_0deg_2.5deg,transparent_2.5deg_11deg)] [mask-image:radial-gradient(closest-side,#000_6%,transparent_72%)]" />
            </motion.div>
            <motion.div className="absolute w-[30%] mix-blend-screen" style={{ ...sunPos, x: "-50%", y: "-50%" }} animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.08, 0.95] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
              <div className="h-[3px] w-full rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,252,236,0.95),transparent)]" />
            </motion.div>
            {[
              [16, 0.35, 70],
              [32, 0.3, 90],
              [47, 0.4, 60],
            ].map(([top, o, dur], i) => (
              <motion.div
                key={`h${i}`}
                className="absolute left-[-40%] h-[9%] w-[180%] blur-[10px] bg-[radial-gradient(40%_50%_at_30%_50%,rgba(255,240,214,0.9),transparent_70%),radial-gradient(35%_50%_at_75%_50%,rgba(255,226,190,0.8),transparent_70%)]"
                style={{ top: `${top}%`, opacity: o }}
                animate={{ x: i % 2 ? ["5%", "-5%", "5%"] : ["-5%", "5%", "-5%"] }}
                transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </>
        )}
      </motion.div>
      <Hills still={still} />
    </motion.div>
  );
}

/* bukit & hutan jauh berlapis kabut di cakrawala (hijau keabuan → makin dekat makin tegas) */
const RIDGES = [
  { d: "M0 60 C10 50 22 46 34 52 C44 44 56 42 66 50 C76 44 88 42 100 50 L100 100 L0 100 Z", fill: "rgba(170,170,150,0.55)", top: 45 },
  { d: "M0 70 C8 62 18 58 28 64 C38 56 50 54 60 62 C72 56 84 56 100 64 L100 100 L0 100 Z", fill: "rgba(128,138,104,0.72)", top: 49 },
  { d: "M0 80 C12 72 24 70 36 76 C46 70 58 68 70 74 C80 68 90 70 100 76 L100 100 L0 100 Z", fill: "rgba(96,110,74,0.88)", top: 53 },
];

function Hills({ still }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {RIDGES.map((r, i) => (
        <svg key={i} viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-[-5%] w-[110%]" style={{ top: `${r.top}%`, height: `${HORIZON - r.top + 3}%` }}>
          <path d={r.d} fill={r.fill} />
        </svg>
      ))}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute left-[-40%] h-[8%] w-[180%] bg-[radial-gradient(40%_50%_at_30%_50%,rgba(255,234,206,0.8),transparent_70%),radial-gradient(35%_50%_at_72%_50%,rgba(255,224,190,0.7),transparent_70%)]"
          style={{ top: `${52 + i * 4}%` }}
          animate={still ? undefined : { x: i ? ["6%", "-6%", "6%"] : ["-6%", "6%", "-6%"], opacity: [0.6, 0.95, 0.6] }}
          transition={{ duration: 30 + i * 12, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* sinar senja yang miring dari arah matahari (kanan) */
function LightRays() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen">
      {[
        { left: "74%", w: "26%", rot: 34, o: 0.42, delay: 0 },
        { left: "88%", w: "14%", rot: 38, o: 0.32, delay: 2.2 },
        { left: "60%", w: "10%", rot: 30, o: 0.24, delay: 4 },
      ].map((b, i) => (
        <motion.div
          key={i}
          className="absolute -top-[10%] h-[120%] origin-top"
          style={{ left: b.left, width: b.w, rotate: b.rot, background: "linear-gradient(180deg, rgba(255,238,205,0.6), rgba(255,222,180,0.12) 60%, transparent)" }}
          animate={{ opacity: [b.o * 0.4, b.o, b.o * 0.55] }}
          transition={{ duration: 6 + i, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: b.delay }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   INTERIOR RUMAH KACA — desain kedua (setelah kamera zoom masuk ke pintu saat scroll)
   Lukisan konservatori desainer (interior.webp, 1216×1294) dihidupkan:
     · kamera pelan membesar & bergeser (Ken Burns) + parallax tilt & kamera perjalanan,
     · kandelir kristal berpendar & berkilau, lilin lampu dinding berkedip,
     · matahari senja di balik pintu & jendela lengkung berdenyut,
     · berkas sinar menembus kaca jatuh ke lantai marmer, kilau pantulan di lantai,
     · kerlip di langit-langit kaca, debu cahaya melayang,
     · merpati putih terbang di bawah kubah kaca; saat masuk, sekawanan merpati
       terbang dari pintu ke arah pengunjung.
   Koordinat efek = % lukisan.
   ============================================================ */

const IN_RATIO = 1216 / 1294;
// kandelir: pusat & lilin-lilinnya
const CHANDELIER = { x: 51.6, y: 17.5 };
const CANDLES = [
  [37, 12], [41, 10.5], [45, 9.5], [48.5, 9], [51.6, 8.8], [54.8, 9], [58.3, 9.5], [62.3, 10.5], [66, 12],
  [40.5, 15.5], [45.5, 14.6], [51.6, 14.2], [57.7, 14.6], [62.7, 15.5],
];
// lampu dinding berlilin (sconce)
const SCONCES = [
  [14.8, 40.5], [21.5, 46.5], [86.2, 40.5], [80, 46.5], [9.5, 34], [92, 34],
];
// sumber cahaya senja: pintu tengah & jendela lengkung
const WINDOW_LIGHT = [
  [51.6, 46, 22],
  [31, 44, 14],
  [72, 44, 14],
];
const FLOOR_SHINE = Array.from({ length: 12 }, (_, i) => ({ x: 14 + ((i * 41) % 72), y: 72 + ((i * 17) % 24), w: 6 + (i % 3) * 5, d: 2.4 + (i % 4) * 0.6 }));
const CEILING_GLINTS = Array.from({ length: 14 }, (_, i) => ({ x: 8 + ((i * 37) % 84), y: 2 + ((i * 23) % 22), d: 2 + (i % 4) * 0.7 }));

// merpati di bawah kubah kaca: kawanan melintas berulang
const HALL_DOVES = [
  { top: 6, size: 20, tone: "rgba(255,252,246,0.95)", count: 4, duration: 22, delay: -4, rise: -3 },
  { top: 14, size: 30, tone: "#FFFDF8", count: 3, duration: 16, delay: -11, rise: 4, reverse: true },
  { top: 3, size: 12, tone: "rgba(255,250,240,0.8)", count: 6, duration: 34, delay: -20, rise: -2 },
];

function InteriorPainting({ live }) {
  const [ref, box] = useStageBox(IN_RATIO, 0.45);
  const rig = CAM;
  const x = useTransform([tiltX, rig.pan], ([v, p]) => `calc(${-v * 6}px + ${-p * 6}%)`);
  const y = useTransform([tiltY, rig.lift], ([v, l]) => `calc(${-v * 4}px + ${l * 6}%)`);
  const scale = useTransform(rig.push, (p) => 1.04 + p * 0.35);
  const night = useTransform(rig.dusk, (n) => n * 0.45);
  // sekawanan merpati menyambut tiap kali pengunjung masuk
  const [welcome, setWelcome] = useState(0);
  useEffect(() => {
    if (live) setWelcome((w) => w + 1);
  }, [live]);
  const P = (px, py) => ({ left: `${px}%`, top: `${py}%` });
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#F3E2C8]">
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          <motion.div className="absolute inset-0 will-change-transform" style={{ x, y, scale, transformOrigin: "51.6% 55%" }}>
            <motion.div
              className="absolute inset-0"
              style={{ transformOrigin: "51.6% 50%" }}
              animate={live ? { scale: [1, 1.05, 1], x: ["0%", "-1%", "0%"] } : undefined}
              transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src={`${ASSET}/interior.webp`} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none" />

              {/* matahari senja di balik pintu & jendela */}
              {WINDOW_LIGHT.map(([wx, wy, w], i) => (
                <motion.div
                  key={`w${i}`}
                  className="absolute aspect-[3/4] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,226,170,0.7),rgba(255,196,120,0.25)_55%,transparent)] mix-blend-screen"
                  style={{ ...P(wx, wy), width: `${w}%` }}
                  animate={live ? { opacity: [0.55, 0.95, 0.6], scale: [1, 1.05, 1] } : undefined}
                  transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}

              {/* berkas sinar menembus kaca, jatuh ke lantai marmer */}
              {live &&
                [
                  { x: 51.6, w: 16, rot: 0, o: 0.45 },
                  { x: 33, w: 10, rot: 12, o: 0.32 },
                  { x: 70, w: 10, rot: -12, o: 0.32 },
                ].map((b, i) => (
                  <motion.div
                    key={`b${i}`}
                    className="absolute top-[40%] h-[62%] -translate-x-1/2 origin-top mix-blend-screen"
                    style={{ left: `${b.x}%`, width: `${b.w}%`, rotate: b.rot, background: "linear-gradient(180deg, rgba(255,238,200,0.55), rgba(255,226,180,0.18) 55%, transparent)", clipPath: "polygon(30% 0, 70% 0, 100% 100%, 0 100%)" }}
                    animate={{ opacity: [b.o * 0.45, b.o, b.o * 0.6] }}
                    transition={{ duration: 7 + i, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: i * 1.3 }}
                  />
                ))}

              {/* kandelir kristal: pendar hangat + kilau kristal + lilin */}
              <motion.div
                className="absolute aspect-square w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,240,200,0.75),rgba(255,214,150,0.28)_42%,transparent)] mix-blend-screen"
                style={P(CHANDELIER.x, CHANDELIER.y)}
                animate={live ? { opacity: [0.7, 1, 0.75], scale: [1, 1.06, 1] } : undefined}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />
              {CANDLES.map(([cx, cy], i) => (
                <motion.span
                  key={`c${i}`}
                  className="absolute h-[1.4%] w-[0.9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,#FFFFFF,#FFE6A8_55%,transparent)] mix-blend-screen"
                  style={{ ...P(cx, cy), boxShadow: "0 0 10px 4px rgba(255,214,140,0.7)" }}
                  animate={live ? { opacity: [0.65, 1, 0.75, 1, 0.65], scaleY: [1, 1.25, 0.9, 1.15, 1] } : undefined}
                  transition={{ duration: 1.6 + ((i * 7) % 5) * 0.25, repeat: Infinity, ease: "easeInOut", delay: (i * 0.17) % 1.4 }}
                />
              ))}
              {live &&
                Array.from({ length: 16 }, (_, i) => {
                  const a = (i / 16) * Math.PI * 2;
                  const r = 4 + (i % 4) * 2.4;
                  return (
                    <motion.span
                      key={`k${i}`}
                      className="absolute h-[0.9%] w-[0.9%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white shadow-[0_0_8px_3px_rgba(255,248,226,0.95)]"
                      style={P(CHANDELIER.x + Math.cos(a) * r, CHANDELIER.y + 2 + Math.sin(a) * r * 0.9)}
                      animate={{ opacity: [0, 1, 0], scale: [0.3, 1.2, 0.3] }}
                      transition={{ duration: 1.8 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.23, ease: "easeInOut" }}
                    />
                  );
                })}

              {/* lilin lampu dinding berkedip */}
              {SCONCES.map(([sx, sy], i) => (
                <motion.div
                  key={`s${i}`}
                  className="absolute aspect-square w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,230,170,0.85),rgba(255,186,100,0.3)_45%,transparent)] mix-blend-screen"
                  style={P(sx, sy)}
                  animate={live ? { opacity: [0.6, 1, 0.7, 0.95, 0.6], scale: [1, 1.06, 0.97, 1.04, 1] } : undefined}
                  transition={{ duration: 2.4 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}

              {/* kerlip langit-langit kaca */}
              {live &&
                CEILING_GLINTS.map((g, i) => (
                  <motion.span
                    key={`g${i}`}
                    className="absolute h-[0.8%] w-[0.8%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white shadow-[0_0_8px_2px_rgba(255,250,236,0.9)]"
                    style={P(g.x, g.y)}
                    animate={{ opacity: [0, 1, 0], scale: [0.4, 1.1, 0.4] }}
                    transition={{ duration: g.d, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                  />
                ))}
              {/* kilau menyapu kubah kaca */}
              {live && (
                <motion.div
                  className="absolute inset-x-0 top-0 h-[34%] mix-blend-soft-light"
                  style={{ backgroundImage: "linear-gradient(110deg, transparent 38%, rgba(255,252,240,0.95) 50%, transparent 62%)", backgroundSize: "260% 100%" }}
                  initial={{ backgroundPosition: "160% 0%" }}
                  animate={{ backgroundPosition: ["160% 0%", "-60% 0%"] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 5, ease: [0.45, 0, 0.25, 1] }}
                />
              )}

              {/* pantulan berkilau di lantai marmer */}
              {live &&
                FLOOR_SHINE.map((f, i) => (
                  <motion.span
                    key={`f${i}`}
                    className="absolute h-[1.2%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,244,214,0.95),transparent)] mix-blend-screen"
                    style={{ ...P(f.x, f.y), width: `${f.w}%` }}
                    animate={{ opacity: [0, 0.85, 0], scaleX: [0.6, 1.3, 0.6] }}
                    transition={{ duration: f.d, repeat: Infinity, delay: i * 0.45, ease: "easeInOut" }}
                  />
                ))}
            </motion.div>
          </motion.div>
        </div>
      )}

      {live && (
        <>
          <Flocks list={HALL_DOVES} />
          <DoveFlight run={welcome} />
          <GlassButterflies list={GLASS_BUTTERFLIES.slice(0, 2)} />
          <Dust palette={tone.dust} />
          <Bokeh />
        </>
      )}
      <motion.div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#1C1830,#33283E_55%,#2A1E22)]" style={{ opacity: night }} />
      {/* vinyet hangat & atas diterangkan agar teks terbaca */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_50%,transparent_55%,rgba(80,50,24,0.3)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26%] bg-gradient-to-b from-[#FFF6E8]/50 to-transparent" />
    </div>
  );
}

/* ---------- halaman rumput & jalan batu menuju pintu rumah kaca ---------- */

const LAWN_H = 110 * 1.5 * (9 / 16); // tinggi lukisan jalur taman (lebar 110% panggung, rasio 2:3) dalam % tinggi panggung

function Ground() {
  const { dolly, still, cam } = useScene();
  const x = useTransform([tiltX, cam.pan], ([v, p]) => `calc(${-v * 6}px + ${-p * panShift(0.4)}%)`);
  const y = useTransform(tiltY, (v) => -v * 4);
  const scale = useTransform([dolly, cam.push], ([d, p]) => (1 + d * 0.24) * (1 + p * 0.7));
  return (
    <motion.div className="absolute inset-0" style={{ x, y, scale, transformOrigin: VP_CSS }}>
      <div className="absolute inset-x-[-10%] bottom-[-10%] bg-[linear-gradient(180deg,#A8B07A_0%,#8E9C5E_22%,#74844A_55%,#4E5A30_100%)]" style={{ top: `${HORIZON - 1}%` }} />
      {/* lukisan jalur taman formal: rumput, pagar semak, guci & jalan batu berperspektif.
          Cakrawalanya (63% tinggi gambar) tepat di HORIZON, titik hilang jalan di tengah (pintu rumah kaca) */}
      <img
        src={`${ASSET}/lawn.webp`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 w-[110%] max-w-none -translate-x-1/2 select-none"
        style={{ top: `${HORIZON - 0.63 * LAWN_H}%` }}
      />
      <motion.div
        className="absolute left-1/2 h-[26%] w-[30%] -translate-x-1/2 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(255,226,170,0.45),transparent_80%)]"
        style={{ top: `${HORIZON}%` }}
        animate={still ? undefined : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-0 h-[10%] bg-[linear-gradient(180deg,transparent,rgba(255,232,200,0.45)_45%,transparent)]" style={{ top: `${HORIZON - 7}%` }} />
    </motion.div>
  );
}

function Mist() {
  const { still } = useScene();
  if (still) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {[
        ["top-[56%]", "h-[9%]", 42, 0.45],
        ["top-[66%]", "h-[8%]", 56, 0.3],
      ].map(([top, h, dur, op], i) => (
        <motion.div
          key={i}
          className={`absolute left-[-50%] w-[200%] ${top} ${h} bg-[radial-gradient(50%_50%_at_30%_50%,rgba(255,244,226,0.9),transparent_70%),radial-gradient(40%_50%_at_75%_50%,rgba(255,232,206,0.8),transparent_70%)]`}
          style={{ opacity: op }}
          animate={{ x: i % 2 ? ["8%", "-8%", "8%"] : ["-8%", "8%", "-8%"] }}
          transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ---------- sentuhan sadar-transparansi (sprite yang benar-benar tersentuh) ---------- */

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

/* ---------- air mancur bertingkat (koordinat % kotak sprite air mancur) ---------- */

const TIERS = [
  [17, 34, 66, 31],
  [33, 20, 80, 52],
  [52, 6, 94, 80],
];

function FountainWater({ splash }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      <motion.ellipse cx="50" cy="3" rx="1.4" fill="rgba(240,248,255,0.75)" initial={{ ry: 3 }} animate={{ ry: [3, 6, 3], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }} />
      {TIERS.flatMap(([y0, xl, xr, y1], t) =>
        Array.from({ length: 9 }, (_, i) => {
          const x = xl + ((xr - xl) * i) / 8;
          const out = (x - 50) * 0.05;
          return (
            <motion.path
              key={`${t}-${i}`}
              d={`M ${x} ${y0} Q ${x + out * 0.5} ${y0 + 3} ${x + out} ${y1}`}
              fill="none"
              stroke="rgba(240,250,255,0.75)"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeDasharray="2.5 3.5"
              animate={{ strokeDashoffset: [0, -12] }}
              transition={{ duration: 0.45 + (i % 3) * 0.08, repeat: Infinity, ease: "linear" }}
            />
          );
        })
      )}
      {[0, 1, 2].map((i) => (
        <motion.ellipse
          key={`r${i}`}
          cx="50"
          cy="86"
          fill="none"
          stroke="rgba(255,252,240,0.6)"
          strokeWidth="0.5"
          initial={{ rx: 8, ry: 1.5, opacity: 0.7 }}
          animate={{ rx: [8, 40], ry: [1.5, 5], opacity: [0.7, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: i * 1.05, ease: "easeOut" }}
        />
      ))}
      {splash > 0 &&
        Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI - Math.PI;
          return (
            <motion.circle
              key={`${splash}-${i}`}
              r="1"
              fill="rgba(235,246,255,0.95)"
              initial={{ cx: 50, cy: 5, opacity: 1 }}
              animate={{ cx: 50 + Math.cos(a) * (20 + (i % 4) * 8), cy: [5, 5 + Math.sin(a) * 18, 40 + (i % 3) * 12], opacity: [1, 1, 0] }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          );
        })}
    </svg>
  );
}

/* ---------- rumah kaca hidup: jendela berpendar dari dalam & kilau menyapu atap kaca ---------- */

const HOUSE_MASK = { WebkitMaskImage: `url(${ASSET}/glasshouse.webp)`, maskImage: `url(${ASSET}/glasshouse.webp)`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };
// jendela utama (x %, y %, lebar %) dalam kotak sprite rumah kaca
const WINDOWS = [
  [14, 74, 16],
  [30, 72, 12],
  [50, 74, 18],
  [70, 72, 12],
  [86, 72, 16],
];

function HouseLife({ still, sun }) {
  const lit = useTransform(sun, (s) => 0.45 + s * 0.55);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <motion.div className="absolute inset-0 mix-blend-screen" style={{ ...HOUSE_MASK, opacity: lit }}>
        {WINDOWS.map(([x, y, w], i) => (
          <motion.span
            key={i}
            className="absolute aspect-[3/4] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,214,150,0.85),rgba(255,180,110,0.25)_60%,transparent)]"
            style={{ left: `${x}%`, top: `${y}%`, width: `${w}%` }}
            animate={still ? undefined : { opacity: [0.5, 0.95, 0.6, 0.9, 0.5] }}
            transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
      {!still && (
        <motion.div
          className="absolute inset-0 mix-blend-screen"
          style={{ ...HOUSE_MASK, backgroundImage: "linear-gradient(105deg, transparent 40%, rgba(255,252,240,0.85) 50%, transparent 60%)", backgroundSize: "260% 100%" }}
          initial={{ backgroundPosition: "160% 0%" }}
          animate={{ backgroundPosition: ["160% 0%", "-60% 0%"] }}
          transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 4.5, ease: [0.45, 0, 0.25, 1], delay: 1 }}
        />
      )}
    </div>
  );
}

/* ---------- kilau senja di lantai teras ---------- */

const FLOOR_GLINTS = [
  [20, 70, 12],
  [36, 78, 9],
  [50, 66, 14],
  [64, 76, 10],
  [80, 70, 12],
  [30, 90, 11],
  [70, 90, 11],
];

function FloorGlints() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {FLOOR_GLINTS.map(([x, y, w], i) => (
        <motion.span
          key={i}
          className="absolute h-[3%] rounded-full bg-[radial-gradient(closest-side,rgba(255,238,200,0.9),transparent)] mix-blend-screen"
          style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, x: "-50%" }}
          animate={{ opacity: [0, 0.8, 0], scaleX: [0.6, 1.2, 0.6] }}
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
  const shadow = "drop-shadow(0 6px 10px rgba(60,40,20,0.25))";

  return (
    <div className="absolute" style={{ ...pos, transform: `translateX(-50%)${item.mirror ? " scaleX(-1)" : ""}` }}>
      <motion.div style={{ opacity: k, scale, y, transformOrigin: origin }}>
        <motion.div className="relative" style={{ rotate, transformOrigin: origin }}>
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
            initial={active ? { filter: `drop-shadow(0 0 18px rgba(255,226,160,0.95)) ${item.filter ?? ""}` } : false}
            animate={{ filter: `${shadow} ${item.filter ?? ""}`, scale: active ? [1, 1.05, 1] : 1, rotate: active && wobble ? [0, -2.5, 2, -1, 0] : 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          {item.house && <HouseLife still={still} sun={sun} />}
          {item.water && !still && <FountainWater splash={hit} />}
          {item.floor && !still && <FloorGlints />}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* api lampu taman: menyala saat matahari tenggelam, berkedip, berkobar saat disentuh
   (kepala lampu di 9% tinggi sprite) */
function LampGlow({ flare, still, sun }) {
  const lit = useTransform(sun, (s) => clamp01((s - 0.35) / 0.5));
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: lit }}>
      <motion.div
        className="absolute left-1/2 top-[9%] aspect-square w-[520%] rounded-full bg-[radial-gradient(closest-side,rgba(255,228,160,0.8),rgba(255,180,90,0.25)_40%,transparent)]"
        style={{ x: "-50%", y: "-50%" }}
        animate={still ? undefined : { opacity: [0.6, 0.95, 0.7, 1, 0.65], scale: [1, 1.05, 0.97, 1.03, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {flare > 0 && (
        <motion.div
          key={flare}
          className="absolute left-1/2 top-[9%] aspect-square w-[900%] rounded-full bg-[radial-gradient(closest-side,rgba(255,244,200,0.95),rgba(255,190,90,0.4)_45%,transparent)]"
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

function FrontMist() {
  const { dolly, still } = useScene();
  const opacity = useTransform(dolly, (d) => (d < 0.15 ? 0.2 + d * 4 : 1 - clamp01((d - 0.15) / 0.6)));
  const scale = useTransform(dolly, (d) => 1 + d * 1.8);
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
  if (still) return null;
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ opacity, scale, visibility, transformOrigin: VP_CSS }}>
      <div className="absolute inset-x-[-20%] top-[40%] h-[50%] bg-[radial-gradient(45%_40%_at_25%_50%,rgba(255,244,226,0.85),transparent_70%),radial-gradient(45%_40%_at_75%_55%,rgba(255,236,214,0.8),transparent_70%),radial-gradient(60%_30%_at_50%_40%,rgba(255,248,236,0.6),transparent_70%)]" />
    </motion.div>
  );
}

/* ============================================================
   KUPU-KUPU KACA EKOR WALET (khas template ini)
   Tampak atas: sayap depan meruncing & sayap belakang berekor panjang
   (swallowtail), kaca mutiara transparan dengan urat emas tipis & pelangi
   halus yang berganti warna (iridesens). Kepakan = sayap "melipat" ke atas
   (scaleX) dengan sayap belakang sedikit tertinggal; jejak debu cahaya
   mengikuti di belakangnya. Terbang berkelok mengikuti lintasan kurva.
   ============================================================ */

const SW_FORE = "M0 0 C 4 -10, 14 -20, 30 -23 C 36 -24, 38 -20, 35 -15 C 30 -8, 20 -3, 8 -1 C 5 -0.5, 2 0, 0 0 Z";
const SW_HIND = "M0 1 C 6 3, 15 6, 20 11 C 23 14, 22 19, 18 21 L 21 33 C 21.5 35, 19.5 35.5, 18.5 33.5 L 14 22 C 10 21, 5 16, 2.5 10 C 1 6, 0.3 3, 0 1 Z";
const SW_VEINS = "M1 -0.5 C 10 -6, 20 -14, 30 -21 M1 -0.2 C 12 -4, 24 -10, 34 -16 M1 1.5 C 7 5, 13 10, 18 15 M1 2 C 5 8, 9 14, 13 19";
const SW_EDGE = "M30 -23 C 36 -24, 38 -20, 35 -15 C 33 -12, 30 -9, 27 -7";

const GLASS_BUTTERFLIES = [
  { left: 20, top: 70, size: 34, dur: 18, hue: 0, path: [[0, 0], [50, -60], [100, -20], [60, 30], [0, 0]] },
  { left: 74, top: 62, size: 30, dur: 21, hue: 40, path: [[0, 0], [-60, -40], [-100, 20], [-40, 40], [0, 0]] },
  { left: 46, top: 82, size: 26, dur: 16, hue: 80, path: [[0, 0], [30, -60], [-30, -100], [-50, -30], [0, 0]] },
  { left: 84, top: 40, size: 24, dur: 23, hue: 120, path: [[0, 0], [-40, 30], [-20, 80], [20, 30], [0, 0]] },
];

function GlassWing({ side, flap, delay, hind, id }) {
  return (
    <motion.g
      style={{ originX: "0px", originY: "0px", transformBox: "view-box" }}
      animate={{ scaleX: [1, 0.15, 1, 0.22, 1, 0.9, 1].map((v) => v * side) }}
      transition={{ duration: flap, times: [0, 0.14, 0.28, 0.42, 0.56, 0.78, 1], repeat: Infinity, ease: "easeInOut", delay: delay + (hind ? 0.05 : 0) }}
      initial={{ scaleX: side }}
    >
      {hind ? (
        <>
          <path d={SW_HIND} fill={`url(#${id})`} stroke="rgba(214,178,110,0.85)" strokeWidth="0.6" />
          <circle cx="15" cy="15" r="2.2" fill="rgba(255,236,196,0.85)" stroke="rgba(190,150,80,0.8)" strokeWidth="0.4" />
        </>
      ) : (
        <>
          <path d={SW_FORE} fill={`url(#${id})`} stroke="rgba(214,178,110,0.85)" strokeWidth="0.6" />
          <path d={SW_EDGE} fill="none" stroke="rgba(255,250,236,0.9)" strokeWidth="1.2" strokeLinecap="round" />
          <path d={SW_VEINS} fill="none" stroke="rgba(200,160,90,0.55)" strokeWidth="0.35" />
          {[[24, -17], [28, -13], [20, -9]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="0.9" fill="#FFFDF4" />
          ))}
        </>
      )}
    </motion.g>
  );
}

function GlassButterfly({ b, idx }) {
  const id = `ghbf-${idx}-${b.left}`;
  const flap = 0.5 + (idx % 3) * 0.08;
  const xs = b.path.map((p) => p[0]);
  const ys = b.path.map((p) => p[1]);
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: `${b.left}%`, top: `${b.top}%`, width: b.size, filter: `hue-rotate(${b.hue}deg) drop-shadow(0 0 6px rgba(255,236,200,0.7))` }}
      animate={{ x: xs, y: ys, rotate: xs.map((x, i) => (i ? Math.sign(x - xs[i - 1]) * 12 : 0)) }}
      transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: b.delay ?? 0 }}
    >
      {/* jejak debu cahaya */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-[60%] h-1 w-1 rounded-full bg-[#FFF6DC] shadow-[0_0_6px_2px_rgba(255,226,170,0.8)]"
          animate={{ y: [0, 10 + i * 6], x: [0, (i - 1) * 6], opacity: [0.9, 0], scale: [1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
        />
      ))}
      <motion.div animate={{ y: [0, -3, 0, -2, 0] }} transition={{ duration: flap * 2, repeat: Infinity, ease: "easeInOut" }}>
        <svg viewBox="-40 -28 80 66" className="block w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={id} x1="0" y1="-1" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
              <stop offset="35%" stopColor="rgba(214,240,246,0.7)" />
              <stop offset="65%" stopColor="rgba(232,214,248,0.62)" />
              <stop offset="100%" stopColor="rgba(255,226,196,0.8)" />
            </linearGradient>
          </defs>
          {[-1, 1].map((s) => (
            <React.Fragment key={s}>
              <GlassWing side={s} flap={flap} delay={idx * 0.13} hind id={id} />
              <GlassWing side={s} flap={flap} delay={idx * 0.13} id={id} />
            </React.Fragment>
          ))}
          {/* badan: kepala, toraks, abdomen beruas, antena berujung gada */}
          <ellipse cx="0" cy="-3" rx="1.6" ry="2.2" fill="#5A4630" />
          <ellipse cx="0" cy="4" rx="1.3" ry="7" fill="#6E5538" />
          {[1, 3.5, 6, 8.5].map((y) => (
            <path key={y} d={`M-1.2 ${y} H1.2`} stroke="#C8A66A" strokeWidth="0.4" />
          ))}
          <circle cx="0" cy="-6" r="1.4" fill="#5A4630" />
          <path d="M-0.5 -7 C -2 -11, -4 -14, -5 -16 M0.5 -7 C 2 -11, 4 -14, 5 -16" stroke="#5A4630" strokeWidth="0.45" fill="none" />
          <circle cx="-5" cy="-16" r="0.8" fill="#5A4630" />
          <circle cx="5" cy="-16" r="0.8" fill="#5A4630" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

function GlassButterflies({ list }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {list.map((b, i) => (
        <GlassButterfly key={`${b.left}-${b.top}-${i}`} b={b} idx={i} />
      ))}
    </div>
  );
}

/* ============================================================
   MERPATI PUTIH — sekawanan terbang keluar dari pintu rumah kaca saat
   undangan dibuka, melingkar naik ke kiri & kanan; merpati jauh melintas
   pelan sesekali. Bulu putih dengan tepi tersorot cahaya senja.
   ============================================================ */

const DOVES = Array.from({ length: 22 }, (_, i) => {
  const near = ((i * 53) % 10) / 9;
  const side = i % 2 ? 1 : -1;
  return {
    side,
    near,
    size: 18 + near * 44,
    dur: 4.4 - near * 1.4,
    delay: 0.9 + i * 0.08 + ((i * 7) % 5) * 0.06,
    dx: side * (40 + ((i * 37) % 30)),
    rise: -(28 + ((i * 29) % 26)),
    flap: 0.8 + ((i * 11) % 5) * 0.1,
  };
});

function DoveFlight({ run }) {
  if (!run) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {DOVES.map((d, i) => (
        <motion.div
          key={`${run}-${i}`}
          className="absolute left-1/2 top-[56%]"
          style={{ scaleX: d.side, filter: `drop-shadow(0 2px 4px rgba(120,90,60,0.35)) drop-shadow(0 0 ${2 + d.near * 3}px rgba(255,232,190,0.9))` }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{
            x: ["0vw", `${d.dx * 0.35}vw`, `${d.dx}vw`],
            y: ["0vh", `${d.rise * 0.6}vh`, `${d.rise}vh`],
            opacity: [0, 1, 1],
            scale: [0.4, 0.8 + d.near * 0.4, 1 + d.near * 0.5],
            rotate: [-6, -14, -20],
          }}
          transition={{ duration: d.dur, delay: d.delay, ease: [0.3, 0.1, 0.4, 1], times: [0, 0.4, 1] }}
        >
          <motion.div animate={{ y: [0, -d.size * 0.12, 0] }} transition={{ duration: d.flap, repeat: Infinity, ease: "easeInOut" }}>
            <Bird size={d.size} tone="#FFFDF8" flap={d.flap} delay={(i % 5) * 0.1} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// merpati putih melintas jauh (kawanan kit, warna putih gading)
const FLOCKS = [
  { top: 12, size: 16, tone: "rgba(255,252,244,0.85)", count: 5, duration: 42, delay: -6, rise: -4 },
  { top: 22, size: 24, tone: "rgba(255,253,248,0.95)", count: 4, duration: 30, delay: -18, rise: 6, reverse: true },
  { top: 8, size: 40, tone: "#FFFDF8", count: 2, duration: 14, delay: 6, rise: -10, repeatDelay: 16 },
];

/* ---------- daun & kelopak mawar gugur ---------- */

const LEAF = "M0 -10 C4 -8 7 -4 7 0 C7 5 3 9 0 10 C-3 9 -7 5 -7 0 C-7 -4 -4 -8 0 -10 Z";
const PETAL = "M0 -9 C6 -7 8 0 4 6 C2 9 -2 9 -4 6 C-8 0 -6 -7 0 -9 Z";
const LEAF_COLORS = [
  ["#A8B878", "#5A6A34"],
  ["#C8C890", "#6E7040"],
  ["#8EA068", "#4A5A2A"],
];
const PETAL_COLORS = [
  ["#FFFFFF", "#F2DCD2"],
  ["#FBE4DE", "#E8B8AC"],
  ["#FFF6EA", "#EBD2B8"],
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

function FallingLeaves({ bursts }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
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
            <Leaf size={l.size} colors={l.colors} petal={l.petal} id={`gh-leaf-${b.id}-${i}`} />
          </motion.div>
        ))
      )}
    </div>
  );
}

function TapRipples({ ripples }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3]">
      {ripples.map((r) =>
        [0, 0.25, 0.5].map((d, i) => (
          <motion.div
            key={`${r.id}-${i}`}
            className="absolute h-[18px] w-[60px] rounded-[50%] border border-white/80"
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

/* kunang-kunang petang di taman */
const FIREFLIES = Array.from({ length: 16 }, (_, i) => ({ left: (i * 29 + 5) % 94, top: 46 + ((i * 17) % 44), dx: (i % 2 ? 1 : -1) * (14 + (i % 4) * 8), dy: -10 - (i % 3) * 8, dur: 4 + (i % 4) }));

function Fireflies() {
  const { sun, cam } = useScene();
  const opacity = useTransform([sun, cam.dusk], ([s, n]) => Math.min(1, 0.1 + s * 0.5 + n * 0.7));
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity }}>
      {FIREFLIES.map((f, i) => (
        <motion.span
          key={i}
          className="absolute h-[5px] w-[5px] rounded-full bg-[#FFF3C8] shadow-[0_0_10px_3px_rgba(255,226,150,0.8)]"
          style={{ left: `${f.left}%`, top: `${f.top}%` }}
          animate={{ x: [0, f.dx, 0], y: [0, f.dy, 0], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: f.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}
    </motion.div>
  );
}

/* ============================================================
   TIRAI PUTIH & LAMPU PERI (dipertahankan dari versi sebelumnya)
   ============================================================ */

function drapeWidth(y, open) {
  const closed = 51.5 - 1.5 * (y / 100);
  const tied = y < 62 ? 22 - 15 * Math.pow(y / 62, 0.8) : 7 + 6 * ((y - 62) / 38);
  return closed + (tied - closed) * open;
}
function drapePath(phase, side, open, w) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const y = (i / 24) * 100;
    const amp = (0.6 + (y / 100) * 1.4) * (1.3 - open * 0.3) * (1 + w * 2.5);
    const x = drapeWidth(y, open) + amp * Math.sin(y * 0.16 + phase);
    pts.push([side < 0 ? x : 100 - x, y]);
  }
  const edge = side < 0 ? 0 : 100;
  return `M${edge} 0 ` + pts.map(([x, y]) => `L${x.toFixed(2)} ${y.toFixed(2)}`).join(" ") + ` L${edge} 100 Z`;
}
function foldPath(phase, side, open, inset) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const y = (i / 24) * 100;
    const x = drapeWidth(y, open) * inset + (0.4 + y / 100) * Math.sin(y * 0.16 + phase + inset * 2) * inset;
    pts.push([side < 0 ? x : 100 - x, y]);
  }
  return "M" + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L");
}

const drapePhase = (t, side) => (t / 1000) * (0.75 + side * 0.04);

function Fold({ side, time, inset, opacity }) {
  const d = useTransform([time, curtain], ([t, o]) => foldPath(drapePhase(t, side), side, o, inset));
  return <motion.path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={opacity} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />;
}

function Drape({ side, time }) {
  const id = side < 0 ? "ghDrapeL" : "ghDrapeR";
  // tirai ikut melambai lebih kuat saat berangin
  const d = useTransform([time, curtain, wind], ([t, o, w]) => drapePath(drapePhase(t, side), side, o, w));
  const body = useTransform(curtain, (o) => (1 - o) * 0.55);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1={side < 0 ? "0" : "1"} y1="0" x2={side < 0 ? "1" : "0"} y2="0">
          <stop offset="0%" stopColor="#FFFDF8" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#FFF6EA" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFF3E2" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <motion.path d={d} fill="#FFF8EE" style={{ opacity: body }} />
      <motion.path d={d} fill={`url(#${id})`} />
      {[0.3, 0.55, 0.8].map((k, i) => (
        <Fold key={k} side={side} time={time} inset={k} opacity={0.55 - i * 0.1} />
      ))}
    </g>
  );
}

const STRANDS = [
  { x: 9, len: 58, n: 11, delay: 0 },
  { x: 14, len: 44, n: 8, delay: 1.2 },
  { x: 19, len: 30, n: 6, delay: 0.6 },
];

function FairyStrand({ x, len, n, delay, side }) {
  const left = side < 0 ? `${x}%` : `${100 - x}%`;
  return (
    <motion.div
      className="absolute top-0 w-[2px]"
      style={{ left, height: `${len}%`, transformOrigin: "50% 0%" }}
      animate={{ rotate: [-1.4 * side, 1.6 * side, -1.4 * side] }}
      transition={{ duration: 5.5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-[#C9A46A]/70 to-[#C9A46A]/20" />
      {Array.from({ length: n }, (_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#FFF3D2]"
          style={{ top: `${((i + 0.6) / n) * 100}%`, boxShadow: "0 0 6px 2px rgba(255,214,140,0.85), 0 0 14px 4px rgba(255,200,120,0.35)" }}
          animate={{ opacity: [0.55, 1, 0.65, 1, 0.55] }}
          transition={{ duration: 2.2 + ((i * 7) % 5) * 0.35, repeat: Infinity, ease: "easeInOut", delay: (i * 0.29) % 2 }}
        />
      ))}
    </motion.div>
  );
}

function SideDrapes() {
  const time = useTime();
  const tie = useTransform(curtain, [0.75, 1], [0, 1]);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <Drape side={-1} time={time} />
        <Drape side={1} time={time} />
      </svg>
      {[-1, 1].map((side) => (
        <React.Fragment key={side}>
          {STRANDS.map((s) => (
            <FairyStrand key={s.x} {...s} side={side} />
          ))}
          <motion.div className="absolute top-[62%] h-4 w-4 -translate-x-1/2 -translate-y-1/2" style={{ left: side < 0 ? "7%" : "93%", opacity: tie }}>
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFF1C9,#D6A95C_55%,#9C7436)] shadow-[0_2px_6px_rgba(90,60,20,0.4)]" />
            <motion.div
              className="absolute left-1/2 top-[70%] h-7 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#E2BE7A] to-[#B48B4A]/0"
              style={{ transformOrigin: "50% 0%" }}
              animate={{ rotate: [-6, 6, -6] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ============================================================
   ADEGAN LENGKAP
   ============================================================ */

function GlasshouseScene({ cam, interactive = true, focusY = 0.5, interior = false }) {
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
  // tirai tersibak → merpati terbang keluar dari rumah kaca (sekali tiap pembukaan)
  const [flight, setFlight] = useState(0);
  const opened = useRef(false);
  useMotionValueEvent(curtain, "change", (c) => {
    if (c < 0.02) opened.current = false;
    else if (c > COVER_OPEN + 0.05 && c < 0.95 && !opened.current && live) {
      opened.current = true;
      setFlight((f) => f + 1);
    }
  });
  const lookY = useTransform([ctx.descend, ctx.cam.lift], ([d, l]) => `${(1 - d) * 26 + l * 26}%`);
  const dusk = useTransform([ctx.sun, ctx.cam.dusk], ([s, n]) => s * 0.08 + n * 0.55);
  const welcome = useTransform(glow, (g) => Math.sin(Math.PI * g) * 0.6);

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
    if (item.tap === "fountain" || item.tap === "floor") ripple(p);
    if (item.tap === "plant") {
      gust(0.4);
      const dir = item.x < 50 ? 1 : -1;
      const bf = { left: (p.x / p.root.width) * 100, top: (p.y / p.root.height) * 100, size: 30, dur: 6, hue: (p.id * 47) % 160, path: [[0, 0], [dir * 40, -80], [dir * 110, -160], [dir * 180, -260], [dir * 240, -360]] };
      setFreed((f) => [...f, { id: p.id, bf }]);
      setTimeout(() => setFreed((f) => f.filter((v) => v.id !== p.id)), 6000);
    }
  };
  const onFloor = (e) => {
    const p = point(e);
    if (p && p.y > p.root.height * 0.62) ripple(p);
  };

  if (interior) return <InteriorPainting live={live} />;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#EFD6B8]" onClick={live ? (e) => tapAt(e, onFloor) : undefined}>
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          <motion.div className="absolute inset-0" style={{ y: lookY }}>
            {
              <>
                <Sky />
                <Ground />
                {LAYERS.slice(0, 4).map((layer) => (
                  <Layer key={layer.id} layer={layer} cam={cam} onAction={onAction} />
                ))}
                <Mist />
                {LAYERS.slice(4, -1).map((layer) => (
                  <Layer key={layer.id} layer={layer} cam={cam} onAction={onAction} />
                ))}
                <FrontMist />
                <Layer layer={LAYERS[LAYERS.length - 1]} cam={cam} onAction={onAction} />
              </>
            }
          </motion.div>
        </div>
      )}

      {!ctx.still && <LightRays />}
      <motion.div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#1C1830,#33283E_55%,#2A1E22)]" style={{ opacity: dusk }} />
      {!ctx.still && (
        <>
          <Fireflies />
          <Flocks list={FLOCKS} />
          <DoveFlight run={flight} />
          <GlassButterflies list={GLASS_BUTTERFLIES} />
          {freed.map((f) => (
            <GlassButterflies key={f.id} list={[f.bf]} />
          ))}
          <Dust palette={tone.dust} />
          <Bokeh />
          <FallingLeaves bursts={bursts} />
          <TapRipples ripples={ripples} />
        </>
      )}
      {/* cahaya hangat yang menyambut saat kamera memasuki rumah kaca */}
      <motion.div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_53%,rgba(255,240,210,1),rgba(255,220,170,0.4)_55%,transparent)]" style={{ opacity: welcome }} />
      {/* vinyet hangat & langit atas sedikit diterangkan agar nama terbaca */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_50%,transparent_55%,rgba(70,40,20,0.3)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-[#FFF4E4]/55 to-transparent" />
    </div>
  );
}

/* ---------- thumbnail katalog: taman rumah kaca saat senja ---------- */

const ZERO = motionValue(0);

export function GlasshouseThumb() {
  return (
    <Scene.Provider value={{ ...STILL, cam: STILL_CAM, still: true }}>
      <GlasshouseScene cam={ZERO} interactive={false} focusY={0.28} />
    </Scene.Provider>
  );
}

/* ============================================================
   COVER
   ============================================================ */

export function GlasshouseCover({ t, guestName, onOpen }) {
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    Object.values(LIVE).forEach((v) => v.set(0));
    LIVE.build.set(1); // taman sudah ada di balik tirai
    glow.set(0);
    heroReveal.set(0);
    snapRig(REST_TOP);
    if (reduce) {
      curtain.set(COVER_OPEN);
      return;
    }
    // pengunjung datang: tirai tertutup rapat lalu tersibak sedikit
    curtain.set(0);
    const intro = animate(curtain, COVER_OPEN, { delay: 0.5, duration: 2.2, ease: [0.45, 0, 0.2, 1] });
    return () => intro.stop();
  }, [reduce]);

  const open = () => {
    if (leaving) return;
    setLeaving(true);
    requestTiltPermission();
    if (reduce) {
      [...Object.values(LIVE), glow, heroReveal, curtain].forEach((v) => v.set(1));
      onOpen();
      return;
    }
    // tirai tersibak → kamera turun & taman tersusun, lampu menyala, merpati terbang
    // → melangkah menembus kabut ke pintu rumah kaca → cahaya hangat → nama muncul
    gust(0.6);
    LIVE.build.set(0);
    animate(curtain, 1, { duration: 2.4, ease: [0.65, 0, 0.35, 1] });
    animate(LIVE.descend, 1, { delay: 0.4, duration: 3.2, ease: [0.6, 0, 0.3, 1] });
    animate(LIVE.sun, 1, { delay: 0.2, duration: 5, ease: [0.3, 0, 0.3, 1] });
    animate(LIVE.build, 1, { delay: 0.5, duration: 2.8, ease: "linear" });
    animate(LIVE.dolly, 1, { delay: 3.1, duration: 3, ease: MOTION.dolly });
    animate(glow, 1, { delay: 3.6, duration: 2.6, ease: "easeInOut" });
    animate(heroReveal, 1, { delay: 5.4, duration: 1.4, ease });
    setTimeout(onOpen, 2000);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <GlasshouseScene cam={ZERO} />
        <SideDrapes />
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

const HeroScene = makeHeroScene({ tone, kicker: "THE GARDEN WEDDING OF", reveal: heroReveal });

/* latar tetap: posisi scroll menentukan pose kamera; tirai & lampu peri tetap membingkai sisi layar.
   Menjelang bab kisah, kamera melesat masuk ke pintu rumah kaca (zoom dalam), cahaya putih
   menyilaukan, lalu latar berganti ke interior rumah kaca. Scroll balik = keluar lagi ke taman. */
const DOOR_ORIGIN = "50% 55%"; // posisi pintu rumah kaca di layar
const ease3 = (v) => v * v * (3 - 2 * v);

function Backdrop() {
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => aimRig(poseAt(y, window.innerHeight)));
  useEffect(() => aimRig(poseAt(window.scrollY, window.innerHeight)), []);
  // rentang scroll transisi: dari 1,6 layar sebelum bab kisah sampai bab kisah dimulai
  const range = useRef(null);
  useEffect(() => {
    const measure = () => {
      const el = document.getElementById("story") || document.getElementById("acara");
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const vh = window.innerHeight;
      range.current = [top - vh * 1.6, top - vh * 0.1];
    };
    measure();
    const later = setTimeout(measure, 1500);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(later);
      window.removeEventListener("resize", measure);
    };
  }, []);
  const enter = useTransform(scrollY, (y) => (range.current ? clamp01((y - range.current[0]) / (range.current[1] - range.current[0])) : 0));
  // hanya adegan yang terlihat yang dirender (ringan di HP)
  const [show, setShow] = useState({ garden: true, inside: false });
  useMotionValueEvent(enter, "change", (v) => {
    const garden = v < 0.99;
    const inside = v > 0.5;
    setShow((s) => (s.garden === garden && s.inside === inside ? s : { garden, inside }));
  });
  const gardenScale = useTransform(enter, (v) => 1 + Math.pow(ease3(clamp01(v / 0.9)), 2.2) * 7);
  const gardenOpacity = useTransform(enter, [0.62, 0.86], [1, 0]);
  const gardenBlur = useTransform(enter, (v) => `blur(${clamp01((v - 0.45) / 0.4) * 6}px)`);
  const flash = useTransform(enter, [0.5, 0.74, 0.98], [0, 1, 0]);
  const streaks = useTransform(enter, [0.3, 0.7, 0.9], [0, 0.9, 0]);
  const insideOpacity = useTransform(enter, [0.72, 0.92], [0, 1]);
  const insideScale = useTransform(enter, [0.72, 1], [1.3, 1]);
  return (
    <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden" aria-hidden="true">
      {show.garden && (
        <motion.div className="absolute inset-0 will-change-transform" style={{ scale: gardenScale, opacity: gardenOpacity, filter: gardenBlur, transformOrigin: DOOR_ORIGIN }}>
          <GlasshouseScene cam={ZERO} />
        </motion.div>
      )}
      {show.inside && (
        <motion.div className="absolute inset-0 will-change-transform" style={{ scale: insideScale, opacity: insideOpacity, transformOrigin: DOOR_ORIGIN }}>
          <GlasshouseScene cam={ZERO} interior />
        </motion.div>
      )}
      {/* garis cahaya melesat (kesan kecepatan) & kilatan putih saat menembus pintu */}
      <motion.div
        className="absolute inset-0 mix-blend-screen [background:repeating-conic-gradient(from_0deg_at_50%_55%,rgba(255,248,232,0.5)_0deg_1.2deg,transparent_1.2deg_9deg)] [mask-image:radial-gradient(circle_at_50%_55%,transparent_12%,#000_55%)]"
        style={{ opacity: streaks }}
      />
      <motion.div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,#FFFFFF,#FFF6E6_45%,rgba(255,236,206,0.9))]" style={{ opacity: flash }} />
      <motion.div style={{ opacity: CAM.dim }} className={`absolute inset-0 ${tone.wash}`} />
      <SideDrapes />
    </div>
  );
}

/* mahkota besi tempa khas rumah kaca Victoria: ulir C simetris, puncak berbola, mawar putih */
const CREST_SCROLL =
  "M100 70 C 86 70, 74 62, 74 50 C 74 40, 84 34, 92 38 C 98 41, 97 50, 90 50 M100 70 C 78 72, 52 70, 38 58 C 28 50, 30 36, 42 34 C 51 33, 54 43, 47 46 M38 58 C 26 66, 12 66, 6 60";
const CREST_ROSES = [
  [100, 70, 7],
  [80, 72, 5],
  [120, 72, 5],
  [40, 70, 4.5],
  [160, 70, 4.5],
];

function IronCrest() {
  return (
    <svg viewBox="0 0 200 84" className="block w-full overflow-visible drop-shadow-[0_3px_5px_rgba(60,36,12,0.55)]" aria-hidden="true">
      <defs>
        <linearGradient id="gh-iron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E6BF72" />
          <stop offset="55%" stopColor="#A57A34" />
          <stop offset="100%" stopColor="#6A4A1C" />
        </linearGradient>
        <radialGradient id="gh-rose" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FBEFE6" />
          <stop offset="100%" stopColor="#E8C9BC" />
        </radialGradient>
      </defs>
      <g fill="none" stroke="url(#gh-iron)" strokeWidth="3.4" strokeLinecap="round">
        <path d={CREST_SCROLL} />
        <path d={CREST_SCROLL} transform="translate(200 0) scale(-1 1)" />
        <path d="M100 70 V 14 M92 26 C 96 22, 104 22, 108 26" />
        <path d="M100 30 C 90 24, 90 14, 100 10 C 110 14, 110 24, 100 30" />
      </g>
      <circle cx="100" cy="7" r="4" fill="url(#gh-iron)" />
      <path d="M8 72 H 192" stroke="url(#gh-iron)" strokeWidth="3" strokeLinecap="round" />
      {CREST_ROSES.map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x - r * 1.2} cy={y + 1} rx={r * 0.9} ry={r * 0.45} fill="#8FA27C" transform={`rotate(-20 ${x - r * 1.2} ${y + 1})`} />
          <ellipse cx={x + r * 1.2} cy={y + 1} rx={r * 0.9} ry={r * 0.45} fill="#8FA27C" transform={`rotate(20 ${x + r * 1.2} ${y + 1})`} />
          <circle cx={x} cy={y} r={r} fill="url(#gh-rose)" stroke="#D9B8AA" strokeWidth="0.5" />
        </g>
      ))}
    </svg>
  );
}

/* isi undangan sebagai perjalanan kamera di taman rumah kaca (kit/journey.jsx) */
const { Journey, Closing } = makeJourney({
  tone,
  asset: ASSET,
  light: true,
  night: 0.55,
  accent: "bg-[linear-gradient(90deg,#AFC1A0_0_28%,#F2D6CC_28%_72%,#AFC1A0_72%_100%)]",
  crown: { node: <IronCrest />, className: "-mb-2 w-[64%]" },
  // tanpa patung penanda di sisi jalan (interior lukisan sudah penuh); kartu kenangan di tengah layar
  lantern: null,
  storyCard: "center",
  portal: {
    crown: { node: <IronCrest />, className: "-mb-3 w-[50%]" },
    side: { src: "lampPost", className: "bottom-[2%] h-[60%] w-auto max-w-none", left: "left-[-9%]", right: "right-[-9%]", mirror: true },
  },
  copy: {
    salam: ["WITH LOVE & GRATITUDE", "WE JOYFULLY INVITE YOU"],
    coupleKicker: "THE BRIDE & GROOM",
    coupleIntro: "Dengan penuh syukur dan sukacita, kami mengundang Anda untuk merayakan hari bahagia kami",
    ampTag: "TWO HEARTS · ONE GARDEN",
    storyKicker: "OUR LOVE STORY",
    storyTitle: "Love in Bloom",
    storySub: "Tiap langkah di rumah kaca ini menyimpan satu kenangan",
    eventsTitle: "The Celebration",
    eventsSub: "Mari melangkah masuk ke rumah kaca",
    thanks: "WITH GRATITUDE",
    albumKicker: "OUR MEMORIES",
    albumTitle: "Love Album",
  },
});

const SectionDecor = makeSectionDecor(tone);

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={10} />;
}

export const glasshouseDecor = { Backdrop, HeroScene, Section: SectionDecor, Global: GlobalDecor, Journey, Closing, skipOpening: true };
