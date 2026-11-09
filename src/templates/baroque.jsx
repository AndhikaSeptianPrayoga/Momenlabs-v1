import React, { useEffect, useRef, useState } from "react";
import { animate, motion, motionValue, useMotionValue, useReducedMotion, useTime, useTransform } from "framer-motion";
import { TONES, MOTION } from "../design/tokens.js";
import {
  Butterflies,
  CoverTitle,
  Dust,
  Flocks,
  GuestPanel,
  Petals,
  makeBackdrop,
  makeHeroScene,
  makeSectionDecor,
  requestTiltPermission,
  tiltX,
  tiltY,
  useStageBox,
  useTiltInput,
} from "../design/kit/index.js";

/* ============================================================
   MOMENLABS — TEMPLATE "BAROQUE GRAND PALACE" v2
   (European Royal Classic, maroon #4A0E17 & emas #D4AF37)
   ------------------------------------------------------------
   Alur: tirai beludru maroon tertutup (nama & tamu di atasnya) →
   "Buka Undangan": tirai tersibak ke kedua sisi sambil taman istana
   tersusun berpasangan secara simetris → kamera melangkah masuk ke
   halaman istana → nama muncul. Seperti tamu memasuki sebuah ruangan.

   Lapisan (belakang → depan), semua aset utuh dari desainer:
     langit senja (sky only) → awan → istana → tanah & jalan (ground only)
     → cemara → pohon merah → mawar → patung & air mancur → balustrade
     → mawar & ranting paling depan.
   Kabut cakrawala menyatukan langit & tanah.

   Interaksi: parallax mouse/gyroscope, angin yang menguat saat kursor
   bergerak cepat (pohon, cemara, mawar, ranting & tirai bergoyang),
   sentuh pohon → bergoyang & menggugurkan daun, sentuh patung/guci/air
   mancur → membesar dengan pendar emas, sentuh mawar → kupu-kupu terbang.
   Ambient: daun gugur, kupu-kupu, burung, debu emas, kelopak, air mancur.
   Aset: assets-src/baroque-palace/v2 → scripts/baroque-new-assets.cjs
   ============================================================ */

const ASSET = "/templates/baroque-palace/v2";
const tone = TONES.maroon;
const ease = MOTION.ease;
const GOLD = "#D4AF37";

/* nilai bersama cover, hero & latar agar transisi menyambung */
const curtain = motionValue(0); // 0 tertutup → 1 terbuka di sisi
const build = motionValue(1); // 0 kosong → 1 taman tersusun lengkap
const dolly = motionValue(0); // 0 di ambang → 1 sudah masuk halaman
const heroReveal = motionValue(1);
const wind = motionValue(0); // hembusan angin 0..1 dari gerak kursor / sentuhan
const VP = "50% 52%"; // titik hilang: pintu istana

/* ---------- angin: menguat saat kursor bergerak cepat, lalu reda ---------- */

let windUsers = 0;
let windFrame = 0;
let lastMove = null;
const decay = () => {
  wind.set(wind.get() * 0.95);
  windFrame = wind.get() > 0.002 ? requestAnimationFrame(decay) : 0;
};
export function gust(amount) {
  wind.set(Math.min(1, wind.get() + amount));
  if (!windFrame) windFrame = requestAnimationFrame(decay);
}
const onMove = (e) => {
  const now = performance.now();
  if (lastMove) {
    const dt = Math.max(8, now - lastMove.t);
    const speed = Math.hypot(e.clientX - lastMove.x, e.clientY - lastMove.y) / dt; // px/ms
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
   mirror: dibalik untuk sisi kanan agar berpasangan sempurna.
   depth: geser parallax maks (px) & laju zoom saat kamera masuk.
   at: kapan muncul saat taman tersusun (0..1 dari nilai build).
   sway: goyang angin (derajat), tap: jenis interaksi.
   ============================================================ */

const pair = (item, xLeft) => [
  { ...item, x: xLeft },
  { ...item, x: 100 - xLeft, mirror: !item.mirror, flipName: item.flipName },
];

const LAYERS = [
  { id: "palace", depth: 9, items: [{ name: "palace", x: 50, bottom: 58, w: 98, at: 0.05, tap: "glow" }] },
  { id: "cypress", depth: 12, items: pair({ name: "cypress", bottom: 66, w: 46, at: 0.18, sway: 0.7 }, 12) },
  { id: "trees", depth: 15, items: pair({ name: "tree", bottom: 72, w: 52, at: 0.28, sway: 1.4, tap: "tree" }, 2) },
  { id: "roses", depth: 14, items: pair({ name: "roseLow", bottom: 70.5, w: 26, at: 0.36, sway: 0.5, tap: "rose" }, 32) },
  {
    id: "court",
    depth: 16,
    items: [
      { name: "statueL", x: 21, bottom: 81, w: 15, at: 0.44, tap: "glow" },
      { name: "fountain", x: 50, bottom: 84, w: 56, at: 0.44, tap: "glow", fountain: true },
      { name: "statueR", x: 79, bottom: 81, w: 15, at: 0.44, tap: "glow" },
      ...pair({ name: "roseSmall", bottom: 85, w: 13, at: 0.52, sway: 0.5, tap: "rose" }, 33),
    ],
  },
  { id: "balustrade", depth: 20, items: [{ name: "balustrade", x: 50, bottom: 101, w: 150, at: 0.6 }] },
  {
    id: "front",
    depth: 26,
    front: true,
    items: [
      ...pair({ name: "roseBush", bottom: 102, w: 28, at: 0.68, sway: 0.8, tap: "rose" }, 7),
      ...pair({ name: "branch", top: -1, w: 64, at: 0.74, sway: 2.2, origin: "0% 30%" }, 16),
    ],
  },
];

/* ---------- langit (sky only) + awan + matahari ---------- */

function Sky() {
  const x = useTransform(tiltX, (v) => -v * 3);
  const y = useTransform(tiltY, (v) => -v * 2);
  const cloudX = useTransform(tiltX, (v) => -v * 5);
  const scale = useTransform(dolly, (d) => 1 + d * 0.04);
  return (
    <motion.div className="absolute inset-0" style={{ x, y, scale, transformOrigin: VP }}>
      {/* langit cat air: horizonnya di ±54% panggung */}
      <img
        src={`${ASSET}/sky.webp`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-[-4%] h-[76%] w-auto max-w-none -translate-x-1/2 select-none"
      />
      <motion.div
        className="absolute left-1/2 top-[38%] aspect-square w-[85%] rounded-full bg-[radial-gradient(closest-side,rgba(255,236,190,0.7),rgba(255,190,120,0.25)_40%,transparent)]"
        style={{ x: "-50%", y: "-50%" }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* awan berarak */}
      <div className="absolute left-1/2 top-[3%] w-[150%] -translate-x-1/2">
        <motion.div style={{ x: cloudX }}>
          <motion.img
            src={`${ASSET}/clouds.webp`}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="w-full select-none"
            animate={{ x: ["-3%", "3%", "-3%"] }}
            transition={{ duration: 46, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ---------- tanah & jalan (ground only), dimiringkan jadi bidang 3D ---------- */

function Ground() {
  const x = useTransform(tiltX, (v) => -v * 6);
  const y = useTransform(tiltY, (v) => -v * 4);
  const scale = useTransform(dolly, (d) => 1 + d * 0.22);
  return (
    <motion.div className="absolute inset-0" style={{ x, y, scale, transformOrigin: VP }}>
      <img
        src={`${ASSET}/ground.webp`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 max-w-none select-none"
        style={{
          bottom: "-1%",
          width: "210%",
          height: "146%",
          transform: "translateX(-50%) perspective(760px) rotateX(45deg)",
          transformOrigin: "50% 100%",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 6%)",
          maskImage: "linear-gradient(to bottom, transparent, #000 6%)",
        }}
      />
      {/* kabut cakrawala: menyatukan langit & tanah */}
      <motion.div
        className="absolute inset-x-0 top-[48%] h-[14%] bg-[linear-gradient(180deg,transparent,rgba(255,206,160,0.55)_45%,rgba(240,170,130,0.25)_70%,transparent)]"
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* ---------- sprite: muncul berpasangan, bergoyang angin, bisa disentuh ---------- */

function Sprite({ item, index, onAction }) {
  const time = useTime();
  const [glow, setGlow] = useState(false);
  const pos = {
    left: `${item.x}%`,
    width: `${item.w}%`,
    ...(item.top != null ? { top: `${item.top}%` } : { bottom: `${100 - item.bottom}%` }),
  };
  // muncul: membesar dari 0.9 sambil naik & menajam di jendela [at, at + 0.26] dari build
  const k = useTransform(build, (b) => Math.max(0, Math.min(1, (b - item.at) / 0.26)));
  const opacity = useTransform(k, (v) => v);
  const scale = useTransform(k, (v) => 0.9 + v * 0.1);
  const y = useTransform(k, (v) => (1 - v) * 24);
  // goyang angin: ayunan pelan + hembusan dari kursor / sentuhan
  const phase = index * 1.7;
  const rotate = useTransform([time, wind], ([t, w]) => {
    if (!item.sway) return 0;
    const s = t / 1000;
    return Math.sin(s * 0.55 + phase) * item.sway * 0.6 + Math.sin(s * 2.3 + phase) * item.sway * (0.15 + w * 1.6);
  });
  const origin = item.origin ?? (item.top != null ? "50% 0%" : "50% 100%");

  const onTap = (e) => {
    if (!item.tap) return;
    setGlow(true);
    setTimeout(() => setGlow(false), 900);
    onAction?.(item, e);
  };

  return (
    <div className="absolute" style={{ ...pos, transform: `translateX(-50%)${item.mirror ? " scaleX(-1)" : ""}` }}>
      <motion.div style={{ opacity, scale, y, transformOrigin: origin }}>
        <motion.div style={{ rotate, transformOrigin: item.mirror && item.origin ? origin : origin }}>
          <motion.img
            src={`${ASSET}/${item.name}.webp`}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`block w-full select-none ${item.tap ? "pointer-events-auto cursor-pointer" : "pointer-events-none"}`}
            style={{
              transformOrigin: "50% 100%",
              filter: glow ? "drop-shadow(0 0 16px rgba(212,175,55,0.85))" : "drop-shadow(0 6px 10px rgba(40,6,10,0.3))",
            }}
            onClick={onTap}
            whileHover={item.tap ? { scale: 1.03 } : undefined}
            animate={{ scale: glow ? [1, 1.07, 1] : 1, rotate: glow && item.tap === "tree" ? [0, -2.5, 2, -1, 0] : 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {item.fountain && <FountainLife />}
        </motion.div>
      </motion.div>
    </div>
  );
}

function Layer({ layer, cam, onAction }) {
  const k = layer.depth / 26; // 0..1, makin dekat makin besar
  const x = useTransform(tiltX, (v) => -v * layer.depth);
  const y = useTransform(tiltY, (v) => -v * layer.depth * 0.6);
  // kamera melangkah masuk: lapisan dekat membesar & menyingkir lebih cepat
  const scale = useTransform([cam, dolly], ([c, d]) => (1 + d * (0.06 + k * 0.62)) * (1 + c * (0.04 + k * 0.12)));
  const opacity = useTransform(dolly, (d) => (layer.front ? 1 - Math.min(1, d * 1.5) : 1));
  return (
    <motion.div className={`absolute inset-0 will-change-transform ${layer.front ? "z-[2]" : ""}`} style={{ x, y, scale, opacity, transformOrigin: VP }}>
      {layer.items.map((item, i) => (
        <Sprite key={`${item.name}-${i}`} item={item} index={i + layer.depth} onAction={onAction} />
      ))}
    </motion.div>
  );
}

/* ---------- air mancur: tirai air, riak & kilau emas (koordinat sprite) ---------- */

function FountainLife() {
  return (
    <svg viewBox="0 0 264 192" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {[
        [104, 160, 44, 78],
        [70, 194, 96, 150],
      ].flatMap(([xl, xr, y0, y1], t) =>
        Array.from({ length: 9 }, (_, i) => {
          const x = xl + ((xr - xl) * i) / 8;
          const out = (x - 132) * 0.18;
          return (
            <motion.path
              key={`${t}-${i}`}
              d={`M ${x} ${y0} Q ${x + out * 0.6} ${y0 + 8} ${x + out} ${y1}`}
              fill="none"
              stroke="rgba(245,250,255,0.75)"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeDasharray="5 7"
              animate={{ strokeDashoffset: [0, -24] }}
              transition={{ duration: 0.5 + (i % 3) * 0.07, repeat: Infinity, ease: "linear" }}
            />
          );
        })
      )}
      {[0, 1, 2].map((i) => (
        <motion.ellipse
          key={`r${i}`}
          cx="132"
          cy="160"
          fill="none"
          stroke="rgba(255,240,210,0.7)"
          strokeWidth="1"
          initial={{ rx: 20, ry: 3, opacity: 0.7 }}
          animate={{ rx: [20, 100], ry: [3, 12], opacity: [0.7, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i, ease: "easeOut" }}
        />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <motion.circle
          key={`s${i}`}
          cx={70 + ((i * 41) % 124)}
          cy={60 + ((i * 29) % 100)}
          r="1.6"
          fill={i % 2 ? "#FFF6DA" : GOLD}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.27 }}
        />
      ))}
    </svg>
  );
}

/* ---------- daun maple merah-emas: gugur pelan & berhamburan saat pohon disentuh ---------- */

const LEAF = "M0 -10 L2 -5 L6 -7 L5 -2 L10 -1 L6 2 L7 6 L2 4 L0 9 L-2 4 L-7 6 L-6 2 L-10 -1 L-5 -2 L-6 -7 L-2 -5 Z";
const LEAF_COLORS = [
  ["#C2272D", "#7E0E18"],
  ["#E0782F", "#9A3414"],
  ["#D9A441", "#8A5A12"],
  ["#A3142A", "#5E0612"],
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
      <path d="M0 9 L0 -8 M0 0 L5 -4 M0 0 L-5 -4 M0 3 L4 4 M0 3 L-4 4" stroke={colors[1]} strokeWidth="0.5" opacity="0.6" fill="none" />
    </svg>
  );
}

const AMBIENT_LEAVES = Array.from({ length: 9 }, (_, i) => ({
  left: (i * 37 + 6) % 96,
  size: 12 + (i % 3) * 5,
  dur: 11 + (i % 4) * 2.5,
  delay: (i * 1.4) % 12,
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
          <Leaf size={l.size} colors={l.colors} id={`leaf-a${i}`} />
        </motion.div>
      ))}
      {/* daun yang berhamburan dari pohon yang disentuh */}
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
            <Leaf size={l.size} colors={l.colors} id={`leaf-${b.id}-${i}`} />
          </motion.div>
        ))
      )}
    </div>
  );
}

/* ---------- sinar senja ---------- */

function LightRays() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {[-22, 0, 22].map((rot, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-[38%] h-[60%] w-[26%] origin-top"
          style={{ x: "-50%", rotate: 180 + rot, background: "radial-gradient(50% 100% at 50% 0%, rgba(255,226,170,0.32), transparent 80%)" }}
          animate={{ opacity: [0.2, 0.45, 0.25] }}
          transition={{ duration: 6 + i, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: i * 0.8 }}
        />
      ))}
    </div>
  );
}

// burung maroon tua agar menyatu dengan langit senja
const FLOCKS = [
  { top: 12, size: 14, tone: "rgba(60,14,20,0.55)", count: 5, duration: 44, delay: -8, rise: -4 },
  { top: 20, size: 22, tone: "rgba(50,10,16,0.75)", count: 4, duration: 30, delay: -20, rise: 6, reverse: true },
  { top: 7, size: 46, tone: "rgba(40,8,12,0.92)", count: 2, duration: 13, delay: 6, rise: -10, repeatDelay: 16, detail: true },
];

const BUTTERFLY_COLORS = [
  { a: "#FFE7BC", b: "#EE9D55", vein: "#5A3418" },
  { a: "#FFEDE4", b: "#E2897A", vein: "#6A3028" },
  { a: "#FFF4C8", b: "#E2B64A", vein: "#5E4818" },
];

/* ============================================================
   ADEGAN LENGKAP
   ============================================================ */

function PalaceScene({ cam, interactive = true }) {
  const [ref, box] = useStageBox(9 / 16);
  const reduce = useReducedMotion();
  useTiltInput(interactive && !reduce);
  useWind(interactive && !reduce);
  const [bursts, setBursts] = useState([]);
  const [freed, setFreed] = useState([]);
  const seq = useRef(0);

  // sentuhan: pohon menggugurkan daun, mawar melepas kupu-kupu
  const onAction = (item, e) => {
    if (!interactive) return;
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
        size: 12 + (i % 3) * 5,
        colors: LEAF_COLORS[i % LEAF_COLORS.length],
      }));
      setBursts((b) => [...b, { id, x, y, leaves }]);
      setTimeout(() => setBursts((b) => b.filter((v) => v.id !== id)), 4800);
    }
    if (item.tap === "rose") {
      const c = BUTTERFLY_COLORS[id % BUTTERFLY_COLORS.length];
      const dir = item.x < 50 ? 1 : -1;
      const bf = { left: (x / root.width) * 100, top: (y / root.height) * 100, size: 30, ...c, dur: 6, path: [[0, 0], [dir * 40, -80], [dir * 110, -160], [dir * 180, -260], [dir * 240, -360]] };
      setFreed((f) => [...f, { id, bf }]);
      setTimeout(() => setFreed((f) => f.filter((v) => v.id !== id)), 6000);
    }
  };

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#3A0A12]">
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          <Sky />
          <LayerFor id="palace" cam={cam} onAction={onAction} />
          <Ground />
          {LAYERS.filter((l) => l.id !== "palace").map((layer) => (
            <Layer key={layer.id} layer={layer} cam={cam} onAction={onAction} />
          ))}
        </div>
      )}

      <Flocks list={FLOCKS} />
      <LightRays />
      <Butterflies />
      {freed.map((f) => (
        <Butterflies key={f.id} list={[f.bf]} />
      ))}
      <Dust palette={tone.dust} count={14} />
      <FallingLeaves bursts={bursts} />

      {/* vinyet maroon & gradasi atas agar nama terbaca */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_65%_at_50%_45%,transparent_52%,rgba(40,6,10,0.55)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[24%] bg-gradient-to-b from-[#2A060C]/70 to-transparent" />
    </div>
  );
}

// istana di belakang tanah agar alasnya tampak berdiri di halaman
function LayerFor({ id, cam, onAction }) {
  return <Layer layer={LAYERS.find((l) => l.id === id)} cam={cam} onAction={onAction} />;
}

/* ============================================================
   TIRAI BELUDRU MAROON
   Lipatan dari gradasi berulang (ikut merapat saat tirai terkumpul
   ke sisi), kilap beludru, rumbai emas, tali emas di tepi dalam &
   valance bergelombang di atas. Tepi bawah melambai mengikuti angin.
   ============================================================ */

const FOLDS = Array.from({ length: 11 }, (_, i) => i);

function CurtainPanel({ side }) {
  const time = useTime();
  // terkumpul ke sisi: lebar menyusut dari tepi luar, sedikit terangkat
  const scaleX = useTransform(curtain, (o) => 1 - o * 0.78);
  const skewY = useTransform([curtain, time, wind], ([o, t, w]) => side * (Math.sin(t / 900) * (0.4 + w * 2) * (1 - o * 0.6) + o * 2));
  const id = side < 0 ? "velvetL" : "velvetR";
  return (
    <motion.div
      className="absolute inset-y-0 w-[52%]"
      style={{ [side < 0 ? "left" : "right"]: 0, scaleX, skewY, transformOrigin: side < 0 ? "0% 0%" : "100% 0%" }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          {/* lipatan beludru: terang di punggung lipatan, gelap di lekuknya */}
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            {FOLDS.flatMap((i) => [
              <stop key={`${i}a`} offset={`${(i / FOLDS.length) * 100}%`} stopColor="#3A0710" />,
              <stop key={`${i}b`} offset={`${((i + 0.45) / FOLDS.length) * 100}%`} stopColor={i % 2 ? "#7A1424" : "#8E1A2C"} />,
              <stop key={`${i}c`} offset={`${((i + 0.9) / FOLDS.length) * 100}%`} stopColor="#43091A" />,
            ])}
          </linearGradient>
          <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD9C0" stopOpacity="0.16" />
            <stop offset="35%" stopColor="#FFD9C0" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${id})`} />
        <rect width="100" height="100" fill={`url(#${id}-sheen)`} />
      </svg>
      {/* tali emas di tepi dalam */}
      <div className={`absolute inset-y-0 w-[5px] ${side < 0 ? "right-0" : "left-0"} bg-[linear-gradient(180deg,#F6DB8C,#B8862E_30%,#F3D27A_55%,#9C6E22_80%,#E9C46A)] shadow-[0_0_10px_rgba(212,175,55,0.5)]`} />
      {/* rumbai emas di bawah */}
      <div className="absolute inset-x-0 bottom-0 h-[3.2%] bg-[repeating-linear-gradient(90deg,#E9C46A_0_2px,#9C6E22_2px_4px,#F6DB8C_4px_5px,transparent_5px_7px)] opacity-95" />
      <div className="absolute inset-x-0 bottom-[3.2%] h-[0.8%] bg-[linear-gradient(90deg,#9C6E22,#F6DB8C,#9C6E22)]" />
    </motion.div>
  );
}

function Valance() {
  const y = useTransform(curtain, (o) => `${-o * 110}%`);
  return (
    <motion.div className="absolute inset-x-0 top-0 h-[9%]" style={{ y }}>
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="valance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A0710" />
            <stop offset="70%" stopColor="#7A1424" />
            <stop offset="100%" stopColor="#4A0E17" />
          </linearGradient>
        </defs>
        <path d="M0 0 H100 V12 Q 91.7 20 83.3 12 Q 75 20 66.7 12 Q 58.3 20 50 12 Q 41.7 20 33.3 12 Q 25 20 16.7 12 Q 8.3 20 0 12 Z" fill="url(#valance)" />
        <path d="M0 12 Q 8.3 20 16.7 12 Q 25 20 33.3 12 Q 41.7 20 50 12 Q 58.3 20 66.7 12 Q 75 20 83.3 12 Q 91.7 20 100 12" fill="none" stroke="#E9C46A" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      </svg>
    </motion.div>
  );
}

function VelvetCurtain() {
  const opacity = useTransform(curtain, [0.85, 1], [1, 0]);
  return (
    <motion.div className="pointer-events-none absolute inset-0 z-[6]" style={{ opacity }} aria-hidden="true">
      <CurtainPanel side={-1} />
      <CurtainPanel side={1} />
      <Valance />
    </motion.div>
  );
}

/* ---------- thumbnail katalog: lukisan utuh tampilan awal istana ---------- */

export function BaroqueThumb() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <img src={`${ASSET}/thumb.webp`} alt="" className="h-full w-full object-cover object-[50%_50%]" draggable={false} />
      {/* gradasi lembut di atas agar nama terbaca di atas langit senja */}
      <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#2A060C]/70 via-[#2A060C]/30 to-transparent" />
    </div>
  );
}

/* ============================================================
   COVER
   ============================================================ */

export function BaroqueCover({ t, guestName, onOpen }) {
  const reduce = useReducedMotion();
  const cam = useMotionValue(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // tirai tertutup; taman di baliknya belum tersusun
    curtain.set(0);
    build.set(0);
    dolly.set(0);
    heroReveal.set(0);
  }, []);

  const open = () => {
    if (leaving) return;
    setLeaving(true);
    requestTiltPermission();
    if (reduce) {
      [curtain, build, dolly, heroReveal].forEach((v) => v.set(1));
      onOpen();
      return;
    }
    // 1 tirai tersibak → 2 taman tersusun berpasangan → 3 kamera melangkah masuk → 4 nama muncul
    gust(0.6);
    animate(curtain, 1, { duration: 2.2, ease: MOTION.door });
    animate(build, 1, { delay: 0.3, duration: 2.6, ease: "linear" });
    animate(dolly, 1, { delay: 2.2, duration: 2.8, ease: MOTION.dolly });
    animate(heroReveal, 1, { delay: 4.2, duration: 1.4, ease });
    // pindah ke undangan setelah tirai hampir terbuka (adegan latar melanjutkan)
    setTimeout(onOpen, 1800);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <PalaceScene cam={cam} />
        <VelvetCurtain />
        <Petals palette={tone.petals} count={8} />
        <div className="relative z-[7] h-full">
          <CoverTitle tone={tone} t={t} leaving={leaving} delay={0.2} />
          <GuestPanel tone={tone} guestName={guestName} leaving={leaving} onOpen={open} delay={1.4} />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HERO, LATAR TETAP & DEKORASI (kit bersama)
   ============================================================ */

const HeroScene = makeHeroScene({ tone, kicker: "THE ROYAL WEDDING OF", reveal: heroReveal });

const Backdrop = makeBackdrop({ tone, travel: 1.2, renderScene: ({ cam }) => <PalaceScene cam={cam} /> });

const SectionDecor = makeSectionDecor(tone);

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={12} />;
}

export const baroqueDecor = { Backdrop, HeroScene, Section: SectionDecor, Global: GlobalDecor, skipOpening: true };
