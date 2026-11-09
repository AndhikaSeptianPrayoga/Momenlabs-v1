import React, { useEffect, useState } from "react";
import { animate, motion, motionValue, useMotionValueEvent, useReducedMotion, useScroll, useTime, useTransform } from "framer-motion";
import { TONES, FONTS } from "../design/tokens.js";
import {
  Bokeh,
  CAM,
  Dust,
  Petals,
  REST_TOP,
  aimRig,
  makeJourney,
  makeSectionDecor,
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
   MOMENLABS — TEMPLATE "GEBYOK KENCANA" (Adat · Jawa klasik, gebyok ukir emas)
   ------------------------------------------------------------
   Gaya animasi "SKILL 3" (sinema berlapis 2.5D, lihat CLAUDE.md):
     COVER   — sepasang kayon (gunungan) bersilang di depan lukisan, kamera menempel di puncak gebyok.
     BUKA    — kayon tersibak ke kiri & kanan seperti pembuka pagelaran wayang; kamera dolly zoom-out
               1,6 → 1,0 dari puncak gebyok (ease power3.out); bingkai emas merekah + kilau emas menyapu
               ukiran dari atas ke bawah; ronce melati & mawar meluncur naik (y 90 → 0, pegas lembut);
               nama muncul bertahap 0,4 s setelah bingkai mapan.
     SCROLL  — hero: latar ×0,15, konten ×1, ronce ×1,4 + blur kedalaman. Isi = perjalanan kamera
               (kit/journey): menengadah ke awan mega mendung, menoleh ke mempelai pria lalu wanita,
               lalu MENEMBUS GERBANG GEBYOK (latar ×1,35, bunga terbang keluar layar) menuju acara.
     MIKRO   — ronce bernapas (±1,5°, ±4 px), tilt HP/mouse menggeser lapisan sangat kuat
               ("meleng dikit ternyata muncul"), serbuk emas berkedip.
   CAHAYA BERGERAK: berkas cahaya dari atas yang berayun, kilau emas menyapu ukiran (gold-mask),
     kilatan bintang di titik ukiran, pendar pelita berkedip, bocoran cahaya hangat melintas,
     bokeh emas naik pelan.
   Aset: assets-src/gebyok-kencana → scripts/gebyok-kencana-assets.cjs
   ============================================================ */

const ASSET = "/templates/gebyok-kencana";
const tone = TONES.javanese;
const img = (n) => `${ASSET}/${n}.webp`;
const APEX = "50% 6%"; // puncak gebyok: titik awal kamera
const PUSH_ORIGIN = "50% 46%"; // pusat lengkung gerbang: arah kamera menembus

/* nilai pembukaan bersama cover & latar */
const OPEN = {
  kayon: motionValue(1), // kayon tersibak
  cam: motionValue(1), // 0 = zoom 1,6 di puncak gebyok → 1 = 1,0
  frame: motionValue(1), // bingkai merekah + kilau
  bloom: motionValue(1), // ronce meluncur naik
  text: motionValue(1),
};
const HERO = motionValue(0); // 0 hero → 1 hero terlewati (parallax multi-kecepatan)

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease3 = (v) => v * v * (3 - 2 * v);
const power3Out = (v) => 1 - Math.pow(1 - v, 3);

/* ---------- lapisan dunia: tilt kuat + toleh (pan) + tengadah (lift) + menembus (push) ---------- */
function WorldLayer({ k, lift, push = 0, tilt, fade, heroY = 0, heroBlur = 0, heroScale = 0, children, className = "" }) {
  const x = useTransform([tiltX, CAM.pan], ([v, p]) => `calc(${-v * tilt}px + ${-p * panShift(k)}%)`);
  const y = useTransform([tiltY, CAM.lift, HERO], ([v, l, h]) => `calc(${-v * tilt * 0.7}px + ${l * lift - h * heroY}%)`);
  const scale = useTransform([CAM.push, HERO], ([p, h]) => (1 + ease3(p) * push) * (1 + h * heroScale));
  // kedalaman saat keluar layar: memudar (bukan blur — blur lapisan selebar layar membuat HP tersendat)
  const opacity = useTransform([CAM.push, HERO], ([p, h]) => {
    const f = fade ? 1 - clamp01((p - fade[0]) / (fade[1] - fade[0])) : 1;
    return f * (1 - h * (heroBlur ? 0.35 : 0));
  });
  return (
    <motion.div className={`absolute inset-0 will-change-transform ${className}`} style={{ x, y, scale, opacity, transformOrigin: PUSH_ORIGIN }}>
      {children}
    </motion.div>
  );
}

/* sprite bernapas: rotasi ±amp°, naik-turun ±4 px */
function Breath({ src, style, mirror, phase = 0, amp = 1.5, origin = "50% 100%", still, className = "" }) {
  const time = useTime();
  const rotate = useTransform(time, (t) => (still ? 0 : Math.sin((t / 1000) * 0.65 + phase) * amp));
  const y = useTransform(time, (t) => (still ? 0 : Math.sin((t / 1000) * 0.5 + phase * 1.3) * 4));
  return (
    <motion.img
      src={img(src)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pointer-events-none absolute select-none ${className}`}
      style={{ ...style, rotate, y, scaleX: mirror ? -1 : 1, transformOrigin: origin }}
    />
  );
}

const maskOf = (file) => ({
  WebkitMaskImage: `url(${ASSET}/${file})`,
  maskImage: `url(${ASSET}/${file})`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
});

/* ============================================================
   LATAR — lukisan gebyok + langit batik di atasnya (terlihat saat kamera menengadah)
   ============================================================ */

const SKY_AWAN = [
  { src: "awanR", top: -44, w: 62, dur: 70, phase: 0.1, o: 0.75 },
  { src: "awanL", top: -30, w: 46, dur: 58, phase: 0.55, o: 0.7 },
  { src: "awanS1", top: -18, w: 22, dur: 40, phase: 0.3, o: 0.8 },
  { src: "awanS2", top: -52, w: 24, dur: 46, phase: 0.8, o: 0.65 },
];

function DriftAwan({ a, still }) {
  const time = useTime();
  const span = 100 + a.w + 20;
  const left = useTransform(time, (t) => `${((((t / 1000) / a.dur + a.phase) % 1) * span) - (a.w + 10)}%`);
  const y = useTransform(time, (t) => `${Math.sin((t / 1000) * 0.3 + a.phase * 7) * 5}%`);
  return (
    <motion.img
      src={img(a.src)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute select-none"
      style={{ top: `${a.top}%`, width: `${a.w}%`, opacity: a.o, left: still ? `${a.phase * 70}%` : left, y }}
    />
  );
}

function SkyAbove({ still }) {
  return (
    <div className="absolute inset-x-[-20%] top-[-62%] h-[64%]">
      {/* batik parang samar di langit malam keemasan */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#080402_0%,#160C05_60%,#1E1209_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(232,190,110,0.9) 0 2px, transparent 2px 22px, rgba(232,190,110,0.5) 22px 23px, transparent 23px 44px)" }}
      />
      <div className="absolute inset-0" style={{ position: "absolute" }}>
        {SKY_AWAN.map((a, i) => (
          <DriftAwan key={i} a={{ ...a, top: a.top + 62 }} still={still} />
        ))}
      </div>
    </div>
  );
}

/* kilau emas menyapu ukiran: sapuan pembuka (ikut OPEN.frame) + sapuan berkala */
function GoldSweep({ still }) {
  const y = useTransform(OPEN.frame, (v) => `${-120 + v * 540}%`);
  const op = useTransform(OPEN.frame, (v) => (v > 0.02 && v < 0.98 ? 1 : 0));
  return (
    <div className="pointer-events-none absolute inset-0" style={maskOf("gold-mask.webp")}>
      <motion.div className="absolute inset-x-0 top-0 h-[26%] bg-[linear-gradient(180deg,transparent,rgba(255,240,195,0.75),transparent)] will-change-transform" style={{ y, opacity: op }} />
      {!still && (
        <>
          <motion.div
            className="absolute left-[-60%] top-[-10%] h-[60%] w-[60%] rotate-[25deg] bg-[linear-gradient(90deg,transparent,rgba(255,240,200,0.6),transparent)] will-change-transform"
            initial={{ x: "0%", y: "0%" }}
            animate={{ x: ["0%", "380%"], y: ["0%", "120%"] }}
            transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 4.5, ease: "easeInOut", delay: 3.5 }}
          />
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(40%_25%_at_50%_10%,rgba(255,220,150,0.55),transparent)]"
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
    </div>
  );
}

// titik ukiran yang berkilat (koordinat % panggung)
const GLINTS = [
  [50, 3.2, 1.3], [12.5, 47.5, 1], [87.5, 47.5, 1], [50, 86.5, 1.2], [8, 57, 0.9], [92, 57, 0.9], [9, 33, 0.8], [91, 33, 0.8], [30, 15, 0.7], [70, 15, 0.7],
];
function Glints({ still }) {
  if (still) return null;
  return GLINTS.map(([x, y, s], i) => (
    <motion.span
      key={i}
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%`, width: 26 * s, height: 26 * s }}
      animate={{ opacity: [0, 1, 0], scale: [0.4, 1.1, 0.4], rotate: [0, 45, 90] }}
      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2 + (i % 4) * 1.3, delay: i * 0.7, ease: "easeInOut" }}
    >
      <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[linear-gradient(180deg,transparent,#FFF3D0,transparent)]" />
      <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[linear-gradient(90deg,transparent,#FFF3D0,transparent)]" />
      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_4px_rgba(255,220,150,0.9)]" />
    </motion.span>
  ));
}

/* berkas cahaya dari atas yang berayun pelan */
const RAYS = [
  { a: -24, w: 16, o: 0.28, d: 11 },
  { a: -9, w: 22, o: 0.36, d: 13 },
  { a: 7, w: 18, o: 0.32, d: 12 },
  { a: 21, w: 14, o: 0.26, d: 14 },
];
function GodRays({ still }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {RAYS.map((r, i) => (
        <motion.div
          key={i}
          className="absolute top-[-6%] h-[115%] will-change-transform"
          style={{
            left: `${50 - r.w / 2}%`,
            width: `${r.w}%`,
            transformOrigin: "50% 0%",
            background: "radial-gradient(50% 100% at 50% 0%, rgba(255,226,160,0.55), rgba(255,200,120,0.14) 55%, transparent 100%)",
          }}
          initial={{ rotate: r.a, opacity: r.o }}
          animate={still ? undefined : { rotate: [r.a - 4, r.a + 4, r.a - 4], opacity: [r.o * 0.5, r.o, r.o * 0.5] }}
          transition={{ duration: r.d, repeat: Infinity, ease: "easeInOut", delay: i * 1.3 }}
        />
      ))}
    </div>
  );
}

/* pendar pelita yang berkedip + bocoran cahaya hangat yang melintas */
function Lamps({ still }) {
  const time = useTime();
  const flick = useTransform(time, (t) => {
    const s = t / 1000;
    return 0.65 + Math.sin(s * 7.3) * 0.08 + Math.sin(s * 13.1) * 0.06 + Math.sin(s * 2.1) * 0.1;
  });
  const leakX = useTransform(time, (t) => `${Math.sin(t / 9000) * 40}%`);
  const leakY = useTransform(time, (t) => `${Math.cos(t / 11000) * 20}%`);
  return (
    <>
      {[
        [50, 93, 70],
        [6, 70, 40],
        [94, 70, 40],
      ].map(([x, y, w], i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,190,90,0.55),rgba(255,140,40,0.18)_50%,transparent)]"
          style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, opacity: still ? 0.7 : flick }}
        />
      ))}
      {!still && (
        <motion.div
          className="pointer-events-none absolute left-[20%] top-[25%] aspect-square w-[90%] rounded-full bg-[radial-gradient(closest-side,rgba(255,214,150,0.16),transparent)] will-change-transform"
          style={{ x: leakX, y: leakY }}
        />
      )}
    </>
  );
}

/* ============================================================
   DEPAN — ronce melati menjuntai di atas & rangkaian mawar-melati di sudut bawah
   ============================================================ */

function Garlands({ still }) {
  const y = useTransform(OPEN.bloom, (v) => `${(1 - v) * -60}%`);
  // ronce atas memudar saat kamera menengadah (tak menutupi teks salam)
  const opacity = useTransform([OPEN.bloom, CAM.lift], ([b, l]) => clamp01(b * 2) * (1 - clamp01(l * 1.6)));
  return (
    <motion.div className="absolute inset-0" style={{ y, opacity }}>
      <Breath src="ronceB" still={still} phase={0.3} amp={2.2} origin="50% 0%" style={{ left: "-6%", top: "-1%", width: "44%" }} />
      <Breath src="ronceB" still={still} phase={1.9} amp={2.2} mirror origin="50% 0%" style={{ right: "-6%", top: "-1%", width: "44%" }} />
      <Breath src="redFlower" still={still} phase={0.8} amp={3} origin="50% 0%" style={{ left: "13%", top: "8.5%", width: "11%" }} />
      <Breath src="redFlower" still={still} phase={2.4} amp={3} mirror origin="50% 0%" style={{ right: "13%", top: "8.5%", width: "11%" }} />
    </motion.div>
  );
}

function Blooms({ still }) {
  // meluncur naik 90 px dengan pegas lembut
  const y = useTransform(OPEN.bloom, (v) => (1 - v) * 90);
  const opacity = useTransform(OPEN.bloom, [0, 0.4], [0, 1]);
  const xL = useTransform(CAM.push, (d) => `${-ease3(clamp01(d * 1.7)) * 70}%`);
  const xR = useTransform(CAM.push, (d) => `${ease3(clamp01(d * 1.7)) * 70}%`);
  return (
    <motion.div className="absolute inset-0" style={{ y, opacity }}>
      <motion.div className="absolute inset-0" style={{ x: xL }}>
        {/* gugus luar kiri (tampak saat kamera menoleh ke kiri) */}
        <Breath src="leafSprigB" still={still} phase={2.2} style={{ left: "-46%", bottom: "8%", width: "38%" }} />
        <Breath src="rose" still={still} phase={1.1} style={{ left: "-40%", bottom: "-2%", width: "30%" }} />
        <Breath src="melati" still={still} phase={0.4} style={{ left: "-22%", bottom: "2%", width: "26%" }} />
        {/* gugus kiri */}
        <Breath src="leafSprig" still={still} phase={0.2} style={{ left: "-4%", bottom: "13%", width: "22%" }} />
        <Breath src="ronceA" still={still} phase={1.4} amp={2} origin="20% 100%" style={{ left: "-8%", bottom: "6%", width: "40%", rotate: -12 }} />
        <Breath src="melati" still={still} phase={2.7} style={{ left: "14%", bottom: "1%", width: "26%" }} />
        <Breath src="rose" still={still} phase={0.9} style={{ left: "-9%", bottom: "-3%", width: "30%" }} />
        <Breath src="goldFlower" still={still} phase={3.1} style={{ left: "22%", bottom: "-4%", width: "16%" }} />
      </motion.div>
      <motion.div className="absolute inset-0" style={{ x: xR }}>
        <Breath src="leafSprigB" still={still} phase={0.6} mirror style={{ right: "-46%", bottom: "8%", width: "38%" }} />
        <Breath src="rose" still={still} phase={2.6} mirror style={{ right: "-40%", bottom: "-2%", width: "30%" }} />
        <Breath src="melati" still={still} phase={1.8} mirror style={{ right: "-22%", bottom: "2%", width: "26%" }} />
        <Breath src="leafSprig" still={still} phase={1.5} mirror style={{ right: "-4%", bottom: "13%", width: "22%" }} />
        <Breath src="ronceA" still={still} phase={0.5} amp={2} mirror origin="80% 100%" style={{ right: "-8%", bottom: "6%", width: "40%", rotate: 12 }} />
        <Breath src="melati" still={still} phase={0.1} mirror style={{ right: "14%", bottom: "1%", width: "26%" }} />
        <Breath src="rose" still={still} phase={2.2} mirror style={{ right: "-9%", bottom: "-3%", width: "30%" }} />
        <Breath src="goldFlower" still={still} phase={1.2} mirror style={{ right: "22%", bottom: "-4%", width: "16%" }} />
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   ADEGAN LENGKAP (panggung 9:16 = lukisan komposisi)
   ============================================================ */

function GebyokScene({ still = false, cover = false }) {
  const [ref, box] = useStageBox(9 / 16, 0.5);
  // dolly zoom-out dari puncak gebyok (power3.out), fokus bergeser ke tengah
  const camScale = useTransform(OPEN.cam, (c) => 1 + (1 - power3Out(c)) * 0.6);
  const camOrigin = useTransform(OPEN.cam, (c) => `50% ${6 + power3Out(c) * 40}%`);
  // bingkai merekah: terang & sedikit membesar dari tengah
  const frameGlow = useTransform(OPEN.frame, (v) => (v >= 0.999 ? "none" : `brightness(${0.55 + v * 0.45})`));
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#120A05]">
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          <motion.div className="absolute inset-0 will-change-transform" style={{ scale: camScale, transformOrigin: camOrigin }}>
            <WorldLayer k={0} lift={14} push={0.35} tilt={5} heroScale={0.06}>
              <SkyAbove still={still} />
              <motion.img src={img("scene")} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none" style={{ filter: frameGlow }} />
              <GoldSweep still={still} />
              <Glints still={still} />
              <Lamps still={still} />
            </WorldLayer>
            <WorldLayer k={0.12} lift={18} push={0.5} tilt={8} heroScale={0.08}>
              <GodRays still={still} />
            </WorldLayer>
          </motion.div>
          <WorldLayer k={0.75} lift={60} push={1.1} tilt={20} fade={[0.2, 0.55]} heroY={30} heroBlur={3}>
            <Garlands still={still} />
          </WorldLayer>
          <WorldLayer k={1} lift={85} tilt={30} heroY={-40} heroBlur={6}>
            <Blooms still={still} />
          </WorldLayer>
          {!still && !cover && (
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <Bokeh />
            </div>
          )}
        </div>
      )}
      {!still && <Dust palette={tone.dust} count={14} />}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_48%,transparent_55%,rgba(8,4,2,0.6)_100%)]" />
    </div>
  );
}

/* ============================================================
   COVER — kayon bersilang di depan gebyok; dibuka seperti pembuka pagelaran wayang
   ============================================================ */

/* kayon HD menutupi layar seperti tirai; saat dibuka terbelah dua dari garis tengahnya dan tiap
   belahan bergeser ke samping. Semua efek cahaya ada DI DALAM tiap belahan sehingga ikut terbelah:
   sorot lampu dari atas, kilau emas menyapu diagonal (mask bentuk kayon), kilatan di titik ukiran,
   bayangan lembut di kaki kayon. Hanya transform & opacity yang dianimasikan (ringan di HP). */
const KAYON_BOX = "absolute left-[-25%] top-[-3%] aspect-[1005/1520] w-[150%]";
const KAYON_MASK = { WebkitMaskImage: `url(${img("gunungan-hd")})`, maskImage: `url(${img("gunungan-hd")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };
// titik ukiran yang berkilat (% kotak kayon): puncak, kepala naga, bunga, atap, mahkota bawah
const KAYON_GLINTS = [
  [50, 1.5, 1.2], [21, 54, 0.9], [79, 54, 0.9], [30, 41, 0.7], [70, 41, 0.7], [50, 46, 1], [50, 78, 0.9], [36, 66, 0.6], [64, 66, 0.6], [50, 30, 0.8],
];

function Kayon({ side, still }) {
  const dir = side === "l" ? -1 : 1;
  const time = useTime();
  const x = useTransform(OPEN.kayon, (v) => `${dir * power3Out(v) * 70}%`);
  const rotate = useTransform(OPEN.kayon, (v) => dir * ease3(v) * 10);
  const opacity = useTransform(OPEN.kayon, [0.65, 1], [1, 0]);
  // napas pelan saat masih tertutup
  const y = useTransform(time, (t) => (still ? 0 : Math.sin(t / 1400) * 4));
  // sorot lampu bernapas
  const spot = useTransform(time, (t) => (still ? 0.8 : 0.65 + Math.sin(t / 1700) * 0.2));
  return (
    <motion.div
      className={`pointer-events-none ${KAYON_BOX} will-change-transform`}
      style={{ x, y, rotate, opacity, clipPath: side === "l" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)", transformOrigin: side === "l" ? "0% 100%" : "100% 100%" }}
    >
      <img src={img("gunungan-hd")} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none" />
      {/* cahaya di permukaan kayon (hanya di dalam bentuknya) */}
      <div className="absolute inset-0 overflow-hidden" style={KAYON_MASK}>
        {/* sorot lampu panggung dari atas + bayangan di kaki */}
        <motion.div className="absolute inset-0 bg-[radial-gradient(60%_42%_at_50%_8%,rgba(255,244,214,0.55),rgba(255,226,160,0.12)_55%,transparent)]" style={{ opacity: spot }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(30,12,4,0.45)_100%)]" />
        {/* kilau emas menyapu diagonal */}
        {!still && (
          <motion.div
            className="absolute left-[-60%] top-[-20%] h-[140%] w-[45%] rotate-[22deg] bg-[linear-gradient(90deg,transparent,rgba(255,246,215,0.75),transparent)] will-change-transform"
            initial={{ x: "0%" }}
            animate={{ x: ["0%", "420%"] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 2.8, ease: "easeInOut", delay: 0.8 }}
          />
        )}
      </div>
      {/* kilatan bintang di titik ukiran */}
      {!still &&
        KAYON_GLINTS.map(([gx, gy, s], i) => (
          <motion.span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${gx}%`, top: `${gy}%`, width: 30 * s, height: 30 * s }}
            animate={{ opacity: [0, 1, 0], scale: [0.3, 1.1, 0.3], rotate: [0, 45, 90] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.6 + (i % 4) * 1.1, delay: 0.4 + i * 0.55, ease: "easeInOut" }}
          >
            <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[linear-gradient(180deg,transparent,#FFF6DA,transparent)]" />
            <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[linear-gradient(90deg,transparent,#FFF6DA,transparent)]" />
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_5px_rgba(255,220,150,0.85)]" />
          </motion.span>
        ))}
    </motion.div>
  );
}

/* serbuk emas melayang di depan kayon (hanya selama cover) */
function KayonDust({ still }) {
  const opacity = useTransform(OPEN.kayon, [0, 0.4], [1, 0]);
  if (still) return null;
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ opacity }}>
      <Dust palette={tone.dust} count={12} />
    </motion.div>
  );
}

function KayonGlow() {
  const opacity = useTransform(OPEN.kayon, [0, 0.6], [1, 0]);
  return (
    <motion.div className="pointer-events-none absolute left-[-40%] top-[0%] aspect-square w-[180%] rounded-full bg-[radial-gradient(closest-side,rgba(255,196,100,0.4),rgba(255,150,50,0.1)_55%,transparent)]" style={{ opacity }}>
      <motion.div
        className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(255,226,160,0.3),transparent)]"
        animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* panel nama & tombol di tengah layar, menutupi garis belah kayon. Latarnya cokelat sogan pekat
   bergradasi (tanpa backdrop-blur agar ringan) supaya tulisan emas tidak beradu dengan ukiran. */
function CoverPlate({ t, guestName, leaving, onOpen }) {
  const [g, b] = t.names.split(" & ");
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-[9%]">
    <motion.div
      className="pointer-events-auto relative w-full"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 1.04 : 1 }}
      transition={{ duration: leaving ? 0.45 : 1.2, delay: leaving ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* bayangan lembut agar panel "terangkat" dari kayon */}
      <div className="absolute -inset-6 rounded-[44px] bg-[radial-gradient(closest-side,rgba(10,5,2,0.75),transparent)]" />
      <div className="relative overflow-hidden rounded-[30px] border border-[#E8C77E]/55 bg-[radial-gradient(120%_90%_at_50%_0%,#3A2414_0%,#24150A_55%,#160C05_100%)] px-6 pb-6 pt-7 text-center shadow-[0_24px_50px_-18px_rgba(0,0,0,0.85)]">
        <div className="pointer-events-none absolute inset-[6px] rounded-[25px] border border-[#E8C77E]/25" />
        <img src={img("crest")} alt="" aria-hidden="true" draggable={false} className="mx-auto w-[58%] select-none" />
        <p className={`mt-3 ${FONTS.caps} text-[10px] tracking-[0.42em] text-[#E8C77E]`}>{t.kicker?.toUpperCase?.() || "PAWIWAHAN AGUNG"}</p>
        <h1 className={`mt-3 ${FONTS.script} text-[46px] leading-[0.95] text-foil drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]`}>{g}</h1>
        <p className={`${FONTS.body} text-2xl italic leading-none text-[#E8C77E]`}>&amp;</p>
        <h1 className={`${FONTS.script} text-[46px] leading-[0.95] text-foil drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]`}>{b}</h1>
        <span className="mx-auto mt-4 block h-px w-28 bg-gradient-to-r from-transparent via-[#E8C77E] to-transparent" />
        <p className={`mt-4 ${FONTS.body} text-[13px] italic text-[#F7E8D0]/75`}>Kepada Yth. Bapak/Ibu/Saudara/i</p>
        <p className={`mt-0.5 truncate ${FONTS.body} text-xl font-semibold text-[#F7E8D0]`}>{guestName || "Tamu Undangan"}</p>
        <button
          type="button"
          onClick={onOpen}
          className={`group relative mt-4 inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3 ${FONTS.caps} text-[11px] font-semibold tracking-[0.2em] transition active:scale-95 ${tone.button}`}
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          <span className="relative">BUKA UNDANGAN</span>
        </button>
      </div>
    </motion.div>
    </div>
  );
}

export function GebyokKencanaCover({ t, guestName, onOpen }) {
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  useTiltInput(!reduce);
  // reset sebelum anak-anak dirender agar transformasi turunan langsung memakai nilai awal
  useState(() => {
    Object.values(OPEN).forEach((v) => v.set(0));
    HERO.set(0);
    snapRig(REST_TOP);
    return true;
  });
  useEffect(() => snapRig(REST_TOP), []);

  const open = () => {
    if (leaving) return;
    setLeaving(true);
    requestTiltPermission();
    if (reduce) {
      Object.values(OPEN).forEach((v) => v.set(1));
      onOpen();
      return;
    }
    animate(OPEN.kayon, 1, { duration: 1.5, ease: [0.65, 0, 0.35, 1] });
    animate(OPEN.cam, 1, { delay: 0.5, duration: 3.6, ease: [0.215, 0.61, 0.355, 1] }); // power3.out
    animate(OPEN.frame, 1, { delay: 1.0, duration: 2.4, ease: [0.22, 1, 0.36, 1] });
    animate(OPEN.bloom, 1, { delay: 1.6, type: "spring", stiffness: 60, damping: 10, mass: 1 });
    animate(OPEN.text, 1, { delay: 3.8, duration: 1.8, ease: [0.22, 1, 0.36, 1] }); // 0,4 s setelah bingkai mapan
    setTimeout(onOpen, 1300);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.9, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <GebyokScene still={!!reduce} cover />
        <KayonGlow />
        <Kayon side="l" still={!!reduce} />
        <Kayon side="r" still={!!reduce} />
        <KayonDust still={!!reduce} />
        <div className="relative z-[7] h-full">
          <CoverPlate t={t} guestName={guestName} leaving={leaving} onOpen={open} />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HERO — nama di dalam lengkung gebyok, muncul bertahap
   ============================================================ */

const pad = (n) => String(n).padStart(2, "0");

function Lift({ i, children, className = "" }) {
  const k = useTransform(OPEN.text, (v) => clamp01(v * 1.6 - i * 0.12));
  const y = useTransform(k, (v) => (1 - v) * 18);
  const scale = useTransform(k, (v) => 0.92 + v * 0.08);
  return (
    <motion.div className={className} style={{ opacity: k, y, scale }}>
      {children}
    </motion.div>
  );
}

function HeroScene({ data }) {
  const first = data.events[0];
  const t = useCountdown(first.start);
  const opt = { timeZone: "Asia/Jakarta" };
  const day = new Date(first.start).toLocaleDateString("id-ID", { weekday: "long", ...opt });
  const date = new Date(first.start).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", ...opt });
  return (
    <section className="pointer-events-none relative h-[100svh]">
      <div className="absolute inset-x-0 top-[50%] -translate-y-1/2 px-[20%] text-center">
        <Lift i={0}>
          <img src={img("crest")} alt="" aria-hidden="true" className="mx-auto w-[64%] opacity-90" />
          <p className={`mt-2 ${FONTS.caps} text-[10px] tracking-[0.42em] ${tone.kicker}`}>PAWIWAHAN AGUNG</p>
        </Lift>
        <Lift i={1} className="mt-3">
          <h1 className={`${FONTS.script} text-[54px] leading-[0.92] ${tone.title}`}>{data.groom.nickname}</h1>
        </Lift>
        <Lift i={2}>
          <p className={`${FONTS.body} text-2xl italic leading-none ${tone.amp}`}>&amp;</p>
        </Lift>
        <Lift i={3}>
          <h1 className={`${FONTS.script} text-[54px] leading-[0.92] ${tone.title}`}>{data.bride.nickname}</h1>
        </Lift>
        <Lift i={4} className="mt-4">
          <span className="mx-auto block h-px w-28 bg-gradient-to-r from-transparent via-[#E8C77E] to-transparent" />
          <p className={`mt-2 ${FONTS.caps} text-[11px] tracking-[0.32em] ${tone.kicker}`}>{day.toUpperCase()}</p>
          <p className={`mt-0.5 ${FONTS.body} text-[18px] italic ${tone.body}`}>{date}</p>
        </Lift>
        <Lift i={5} className="mt-4">
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
   LATAR TETAP — pose kamera dari bab yang menempel + parallax multi-kecepatan di hero
   ============================================================ */

function Backdrop() {
  const reduce = useReducedMotion();
  useTiltInput(!reduce);
  // adegan latar baru dirender saat undangan mulai dibuka (selama cover tampil, cover sudah punya adegannya
  // sendiri — dua adegan animasi sekaligus membuat HP tersendat)
  const [live, setLive] = useState(() => OPEN.kayon.get() > 0);
  useMotionValueEvent(OPEN.kayon, "change", (v) => v > 0 && setLive(true));
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const vh = window.innerHeight;
    HERO.set(y <= vh ? clamp01(y / vh) : clamp01(1 - (y - vh) / (vh * 0.6)));
    aimRig(poseAt(y, window.innerHeight));
  });
  useEffect(() => aimRig(poseAt(window.scrollY, window.innerHeight)), []);
  return (
    <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden" aria-hidden="true">
      {live ? <GebyokScene still={!!reduce} /> : <div className="absolute inset-0 bg-[#120A05]" />}
      <motion.div style={{ opacity: CAM.dim }} className={`absolute inset-0 ${tone.wash}`} />
    </div>
  );
}

const SectionDecor = makeSectionDecor(tone);

/* isi undangan sebagai perjalanan kamera di dalam gebyok (kit/journey.jsx) */
const { Journey, Closing } = makeJourney({
  tone,
  asset: ASSET,
  // sogan (cokelat batik) & emas
  accent: "bg-[linear-gradient(90deg,#4A2B12_0_30%,#E8C77E_30%_70%,#4A2B12_70%_100%)]",
  crown: { src: "crest", className: "-mb-3 w-[64%]" },
  lantern: null,
  storyCard: "center",
  // foto mempelai besar (Skill 3: fokus pada pasangan)
  photo: { className: "w-[72%]", initial: "text-[110px]" },
  portal: {
    crown: { src: "crest", className: "-mb-4 w-[58%]" },
    side: { src: "vine", className: "bottom-[3%] h-[46%] w-auto max-w-none opacity-95", left: "left-[-19%]", right: "right-[-19%]", mirror: true },
  },
  copy: {
    salam: ["ASSALAMU'ALAIKUM", "WARAHMATULLAHI WABARAKATUH"],
    coupleKicker: "BISMILLAHIRRAHMANIRRAHIM",
    ampTag: "LORO-LORONING ATUNGGAL",
    storyKicker: "LAMPAH TRESNA",
    storyTitle: "Kisah Kami",
    storySub: "Tiap langkah menuju gebyok ini menyimpan satu kenangan",
    eventsTitle: "Hari Bahagia",
    eventsSub: "Mari melangkah menembus gebyok pawiwahan",
    thanks: "MATUR NUWUN",
    albumKicker: "KENANGAN",
    albumTitle: "Album Kami",
  },
});

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={10} />;
}

export const gebyokKencanaDecor = { Backdrop, HeroScene, Section: SectionDecor, Global: GlobalDecor, Journey, Closing, skipOpening: true };

/* thumbnail katalog: lukisan komposisi desainer */
export function GebyokKencanaThumb() {
  return <img src={`${ASSET}/poster.webp`} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />;
}
