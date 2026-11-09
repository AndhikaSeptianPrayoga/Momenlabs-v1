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
   MOMENLABS — TEMPLATE "SUNTING RAJO" (Adat · Minang Royal: rumah gadang, songket marun & sunting emas)
   ------------------------------------------------------------
   Pola animasi sama dengan Gebyok Kencana ("SKILL 3", sinema berlapis 2.5D):
     COVER   — tirai songket marun berbingkai pita songket emas & mahkota ukiran di atasnya;
               panel nama di tengah; kamera menempel di puncak gonjong (zoom 1,7).
     BUKA    — tirai tersibak ke kiri & kanan; kamera dolly zoom-out 1,7 → 1,0 (power3.out);
               bingkai carano menyala + kilau emas menyapu dari atas ke bawah; sunting, songket & mawar
               meluncur naik (y 100 → 0, pegas lembut); nama muncul bertahap 0,4 s setelah bingkai mapan.
     SCROLL  — hero: latar ×0,15 (membesar pelan), konten ×1, sunting & songket keluar ke bawah ×1,45.
               Isi = perjalanan kamera (kit/journey): menengadah ke awan, menoleh ke mempelai pria lalu
               wanita, lalu MENEMBUS BINGKAI CARANO (latar ×1,4) menuju acara.
     MIKRO   — sunting & songket bernapas (±1°, ±3 px), tilt HP/mouse menggeser lapisan, serbuk emas.
   CAHAYA: pendar hangat dari balik atap gonjong (berdenyut), kilau linier menyapu ukiran (gold-mask),
     kilatan payet pada sunting, kilatan di ujung gonjong & ukiran, berkas cahaya berayun, pelita berkedip.
   Aset: assets-src/sunting-rajo → scripts/sunting-rajo-assets.cjs
   ============================================================ */

const ASSET = "/templates/sunting-rajo";
const tone = TONES.minang;
const img = (n) => `${ASSET}/${n}.webp`;
const PUSH_ORIGIN = "50% 54%"; // pusat bingkai carano: arah kamera menembus

/* nilai pembukaan bersama cover & latar */
const OPEN = {
  curtain: motionValue(1), // tirai songket tersibak
  cam: motionValue(1), // 0 = zoom 1,7 di puncak gonjong → 1 = 1,0
  frame: motionValue(1), // bingkai menyala + kilau
  bloom: motionValue(1), // sunting & songket meluncur naik
  text: motionValue(1),
};
const HERO = motionValue(0); // 0 hero → 1 hero terlewati (parallax multi-kecepatan)

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease3 = (v) => v * v * (3 - 2 * v);
const power3Out = (v) => 1 - Math.pow(1 - v, 3);

/* ---------- lapisan dunia: tilt + toleh (pan) + tengadah (lift) + menembus (push) ---------- */
function WorldLayer({ k, lift, push = 0, tilt, fade, heroY = 0, heroFade = 0, heroScale = 0, children }) {
  const x = useTransform([tiltX, CAM.pan], ([v, p]) => `calc(${-v * tilt}px + ${-p * panShift(k)}%)`);
  const y = useTransform([tiltY, CAM.lift, HERO], ([v, l, h]) => `calc(${-v * tilt * 0.7}px + ${l * lift - h * heroY}%)`);
  const scale = useTransform([CAM.push, HERO], ([p, h]) => (1 + ease3(p) * push) * (1 + h * heroScale));
  // kedalaman saat keluar layar: memudar (bukan blur — blur lapisan selebar layar membuat HP tersendat)
  const opacity = useTransform([CAM.push, HERO], ([p, h]) => {
    const f = fade ? 1 - clamp01((p - fade[0]) / (fade[1] - fade[0])) : 1;
    return f * (1 - h * heroFade);
  });
  return (
    <motion.div className="absolute inset-0 will-change-transform" style={{ x, y, scale, opacity, transformOrigin: PUSH_ORIGIN }}>
      {children}
    </motion.div>
  );
}

/* sprite bernapas: rotasi ±amp°, naik-turun ±3 px */
function Breath({ src, style, mirror, phase = 0, amp = 1, origin = "50% 100%", still, children }) {
  const time = useTime();
  const rotate = useTransform(time, (t) => (still ? 0 : Math.sin((t / 1000) * 0.6 + phase) * amp));
  const y = useTransform(time, (t) => (still ? 0 : Math.sin((t / 1000) * 0.48 + phase * 1.3) * 3));
  return (
    <motion.div className="pointer-events-none absolute" style={{ ...style, rotate, y, transformOrigin: origin }}>
      <img src={img(src)} alt="" aria-hidden="true" draggable={false} className="block w-full select-none" style={mirror ? { transform: "scaleX(-1)" } : undefined} />
      {children}
    </motion.div>
  );
}

const maskOf = (file) => ({
  WebkitMaskImage: `url(${ASSET}/${file})`,
  maskImage: `url(${ASSET}/${file})`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
});

/* kilatan bintang kecil (dipakai di ukiran, ujung gonjong, payet sunting) */
function Glint({ x, y, s = 1, delay = 0, every = 2.5 }) {
  return (
    <motion.span
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%`, width: 26 * s, height: 26 * s }}
      animate={{ opacity: [0, 1, 0], scale: [0.3, 1.1, 0.3], rotate: [0, 45, 90] }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: every, delay, ease: "easeInOut" }}
    >
      <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[linear-gradient(180deg,transparent,#FFF6DA,transparent)]" />
      <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[linear-gradient(90deg,transparent,#FFF6DA,transparent)]" />
      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_4px_rgba(255,220,150,0.9)]" />
    </motion.span>
  );
}

/* ============================================================
   LATAR — lukisan rumah gadang + langit songket di atasnya (terlihat saat kamera menengadah)
   ============================================================ */

const SKY_AWAN = [
  { src: "awanA", top: 16, w: 54, dur: 70, phase: 0.1, o: 0.85 },
  { src: "awanB", top: 42, w: 60, dur: 82, phase: 0.6, o: 0.8 },
  { src: "awanA", top: 66, w: 36, dur: 54, phase: 0.35, o: 0.7 },
];

function DriftAwan({ a, still }) {
  const time = useTime();
  const span = 100 + a.w + 20;
  const left = useTransform(time, (t) => `${((((t / 1000) / a.dur + a.phase) % 1) * span) - (a.w + 10)}%`);
  return (
    <motion.img
      src={img(a.src)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute select-none"
      style={{ top: `${a.top}%`, width: `${a.w}%`, opacity: a.o, left: still ? `${a.phase * 70}%` : left }}
    />
  );
}

function SkyAbove({ still }) {
  return (
    <div className="absolute inset-x-[-20%] top-[-62%] h-[64%]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#120203_0%,#2A0608_60%,#3A0A0C_100%)]" />
      <div className="absolute inset-0 opacity-[0.22]" style={{ backgroundImage: `url(${img("songket-fabric")})`, backgroundSize: "34% auto", backgroundRepeat: "repeat" }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,2,3,0.75)_0%,rgba(42,6,8,0.35)_60%,rgba(58,10,12,0.2)_100%)]" />
      {SKY_AWAN.map((a, i) => (
        <DriftAwan key={i} a={a} still={still} />
      ))}
    </div>
  );
}

/* pendar hangat dari balik atap gonjong, membesar-mengecil bergelombang */
function Backlight({ still }) {
  const time = useTime();
  const scale = useTransform(time, (t) => (still ? 1 : 1 + Math.sin(t / 1600) * 0.08 + Math.sin(t / 700) * 0.02));
  const opacity = useTransform(time, (t) => (still ? 0.8 : 0.7 + Math.sin(t / 1600) * 0.2));
  return (
    <motion.div
      className="pointer-events-none absolute left-[-15%] top-[-8%] aspect-[1.4/1] w-[130%] rounded-full bg-[radial-gradient(closest-side,rgba(255,196,110,0.42),rgba(255,140,60,0.14)_50%,transparent)] will-change-transform"
      style={{ scale, opacity }}
    />
  );
}

/* kilau emas linier menyapu ukiran: sapuan pembuka (ikut OPEN.frame) + sapuan berkala */
function GoldSweep({ still }) {
  const y = useTransform(OPEN.frame, (v) => `${-120 + v * 540}%`);
  const op = useTransform(OPEN.frame, (v) => (v > 0.02 && v < 0.98 ? 1 : 0));
  return (
    <div className="pointer-events-none absolute inset-0" style={maskOf("gold-mask.webp")}>
      <motion.div className="absolute inset-x-0 top-0 h-[26%] bg-[linear-gradient(180deg,transparent,rgba(255,240,195,0.8),transparent)] will-change-transform" style={{ y, opacity: op }} />
      {!still && (
        <motion.div
          className="absolute left-[-60%] top-[-10%] h-[60%] w-[60%] rotate-[25deg] bg-[linear-gradient(90deg,transparent,rgba(255,240,200,0.65),transparent)] will-change-transform"
          initial={{ x: "0%", y: "0%" }}
          animate={{ x: ["0%", "380%"], y: ["0%", "120%"] }}
          transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 4, ease: "easeInOut", delay: 3.5 }}
        />
      )}
    </div>
  );
}

// ujung gonjong, ukiran lengkung, gantungan emas & sudut bingkai (koordinat % panggung)
const GLINTS = [
  [50, 2, 1.3], [22, 13, 0.9], [78, 13, 0.9], [10, 16, 0.8], [90, 16, 0.8], [33, 14, 0.7], [67, 14, 0.7],
  [50, 24, 1.1], [19, 12, 0.6], [81, 12, 0.6], [8, 40, 0.8], [92, 40, 0.8], [30, 31, 0.7], [70, 31, 0.7],
];
function Glints({ still }) {
  if (still) return null;
  return GLINTS.map(([x, y, s], i) => <Glint key={i} x={x} y={y} s={s} delay={i * 0.6} every={2 + (i % 4) * 1.2} />);
}

/* berkas cahaya dari atas yang berayun pelan */
const RAYS = [
  { a: -24, w: 16, o: 0.26, d: 11 },
  { a: -9, w: 22, o: 0.34, d: 13 },
  { a: 7, w: 18, o: 0.3, d: 12 },
  { a: 21, w: 14, o: 0.24, d: 14 },
];
function GodRays({ still }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {RAYS.map((r, i) => (
        <motion.div
          key={i}
          className="absolute top-[-6%] h-[115%] will-change-transform"
          style={{ left: `${50 - r.w / 2}%`, width: `${r.w}%`, transformOrigin: "50% 0%", background: "radial-gradient(50% 100% at 50% 0%, rgba(255,214,150,0.5), rgba(255,170,100,0.12) 55%, transparent 100%)" }}
          initial={{ rotate: r.a, opacity: r.o }}
          animate={still ? undefined : { rotate: [r.a - 4, r.a + 4, r.a - 4], opacity: [r.o * 0.5, r.o, r.o * 0.5] }}
          transition={{ duration: r.d, repeat: Infinity, ease: "easeInOut", delay: i * 1.3 }}
        />
      ))}
    </div>
  );
}

/* pendar pelita berkedip + bocoran cahaya hangat yang melintas */
function Lamps({ still }) {
  const time = useTime();
  const flick = useTransform(time, (t) => {
    const s = t / 1000;
    return 0.6 + Math.sin(s * 7.3) * 0.08 + Math.sin(s * 13.1) * 0.06 + Math.sin(s * 2.1) * 0.1;
  });
  const leakX = useTransform(time, (t) => `${Math.sin(t / 9000) * 40}%`);
  const leakY = useTransform(time, (t) => `${Math.cos(t / 11000) * 20}%`);
  return (
    <>
      {[
        [8, 34, 34],
        [92, 34, 34],
        [50, 95, 60],
      ].map(([x, y, w], i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,180,90,0.5),rgba(255,120,40,0.15)_50%,transparent)]"
          style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, opacity: still ? 0.7 : flick }}
        />
      ))}
      {!still && (
        <motion.div
          className="pointer-events-none absolute left-[20%] top-[30%] aspect-square w-[90%] rounded-full bg-[radial-gradient(closest-side,rgba(255,200,140,0.14),transparent)] will-change-transform"
          style={{ x: leakX, y: leakY }}
        />
      )}
    </>
  );
}

/* ============================================================
   DEPAN — awan merah melayang di atas; sunting, songket & mawar di sudut bawah
   ============================================================ */

function TopClouds({ still }) {
  const y = useTransform(OPEN.bloom, (v) => `${(1 - v) * -50}%`);
  // memudar saat kamera menengadah (tak menutupi teks salam)
  const opacity = useTransform([OPEN.bloom, CAM.lift], ([b, l]) => clamp01(b * 2) * (1 - clamp01(l * 1.6)));
  return (
    <motion.div className="absolute inset-0" style={{ y, opacity }}>
      <Breath src="awanA" still={still} phase={0.3} amp={0.8} origin="50% 50%" style={{ left: "-16%", top: "4%", width: "44%" }} />
      <Breath src="awanB" still={still} phase={1.9} amp={0.8} origin="50% 50%" style={{ right: "-18%", top: "8%", width: "46%" }} />
    </motion.div>
  );
}

// payet sunting yang berkilat (koordinat % kotak sprite sunting)
const SUNTING_SPARKS = [
  [50, 6], [28, 22], [72, 22], [40, 36], [60, 36], [20, 52], [80, 52], [50, 58], [34, 74], [66, 74], [50, 88],
];

function Blooms({ still }) {
  // meluncur naik 100 px dengan pegas lembut
  const y = useTransform(OPEN.bloom, (v) => (1 - v) * 100);
  const opacity = useTransform(OPEN.bloom, [0, 0.4], [0, 1]);
  const xL = useTransform(CAM.push, (d) => `${-ease3(clamp01(d * 1.7)) * 70}%`);
  const xR = useTransform(CAM.push, (d) => `${ease3(clamp01(d * 1.7)) * 70}%`);
  return (
    <motion.div className="absolute inset-0" style={{ y, opacity }}>
      <motion.div className="absolute inset-0" style={{ x: xL }}>
        {/* gugus luar kiri (tampak saat kamera menoleh ke kiri) */}
        <Breath src="drape" still={still} phase={2.2} origin="50% 0%" style={{ left: "-44%", bottom: "6%", width: "34%" }} />
        <Breath src="rose" still={still} phase={1.1} style={{ left: "-40%", bottom: "-2%", width: "32%" }} />
        {/* gugus kiri: sunting di atas daun & mawar */}
        <Breath src="leafSprig" still={still} phase={0.2} style={{ left: "-6%", bottom: "9%", width: "28%" }} />
        <Breath src="sunting" still={still} phase={1.4} amp={0.8} style={{ left: "-5%", bottom: "4%", width: "46%" }}>
          {!still && SUNTING_SPARKS.map(([sx, sy], i) => <Glint key={i} x={sx} y={sy} s={0.7} delay={0.3 + i * 0.35} every={1.4 + (i % 3) * 0.8} />)}
        </Breath>
        <Breath src="rose" still={still} phase={0.9} style={{ left: "-9%", bottom: "-4%", width: "30%" }} />
        <Breath src="roseDuo" still={still} phase={2.7} style={{ left: "22%", bottom: "-5%", width: "22%" }} />
      </motion.div>
      <motion.div className="absolute inset-0" style={{ x: xR }}>
        <Breath src="leafSmall" still={still} phase={0.6} mirror style={{ right: "-40%", bottom: "10%", width: "26%" }} />
        <Breath src="roseB" still={still} phase={2.6} mirror style={{ right: "-38%", bottom: "-2%", width: "30%" }} />
        {/* gugus kanan: songket berombak, daun emas & buket mawar */}
        <Breath src="songketWave" still={still} phase={1.8} amp={0.5} origin="100% 100%" style={{ right: "-34%", bottom: "-5%", width: "112%" }} />
        <Breath src="goldLeaves" still={still} phase={1.5} style={{ right: "-3%", bottom: "8%", width: "24%" }} />
        <Breath src="bouquet" still={still} phase={0.4} style={{ right: "-7%", bottom: "-4%", width: "44%" }} />
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   ADEGAN LENGKAP (panggung 9:16 = lukisan komposisi)
   ============================================================ */

function MinangScene({ still = false, cover = false }) {
  const [ref, box] = useStageBox(9 / 16, 0.5);
  // dolly zoom-out dari puncak gonjong (power3.out), fokus bergeser ke tengah
  const camScale = useTransform(OPEN.cam, (c) => 1 + (1 - power3Out(c)) * 0.7);
  const camOrigin = useTransform(OPEN.cam, (c) => `50% ${4 + power3Out(c) * 46}%`);
  const frameGlow = useTransform(OPEN.frame, (v) => (v >= 0.999 ? "none" : `brightness(${0.55 + v * 0.45})`));
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#1E0406]">
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          <motion.div className="absolute inset-0 will-change-transform" style={{ scale: camScale, transformOrigin: camOrigin }}>
            <WorldLayer k={0} lift={44} push={0.4} tilt={5} heroScale={0.06}>
              <SkyAbove still={still} />
              <Backlight still={still} />
              <motion.img src={img("scene")} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none" style={{ filter: frameGlow }} />
              <GoldSweep still={still} />
              <Glints still={still} />
              <Lamps still={still} />
            </WorldLayer>
            <WorldLayer k={0.12} lift={48} push={0.5} tilt={8} heroScale={0.08}>
              <GodRays still={still} />
            </WorldLayer>
          </motion.div>
          <WorldLayer k={0.7} lift={60} push={1.1} tilt={18} fade={[0.2, 0.55]} heroY={30} heroFade={0.35}>
            <TopClouds still={still} />
          </WorldLayer>
          <WorldLayer k={1} lift={85} tilt={28} heroY={-45} heroFade={0.35}>
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_50%,transparent_55%,rgba(14,2,3,0.6)_100%)]" />
    </div>
  );
}

/* ============================================================
   COVER — tirai songket marun; tersibak ke kiri & kanan saat dibuka
   ============================================================ */

const FOLDS =
  "repeating-linear-gradient(90deg, rgba(0,0,0,0.38) 0%, rgba(255,210,170,0.07) 4%, rgba(0,0,0,0.12) 8%, rgba(255,220,180,0.1) 11%, rgba(0,0,0,0.4) 14.5%)";

function Curtain({ side, still }) {
  const dir = side === "l" ? -1 : 1;
  const time = useTime();
  const x = useTransform(OPEN.curtain, (v) => `${dir * power3Out(v) * 105}%`);
  // lipatan merapat saat tirai ditarik ke tepi
  const scaleX = useTransform(OPEN.curtain, (v) => 1 - ease3(v) * 0.35);
  // ayunan halus saat masih tertutup
  const rotate = useTransform(time, (t) => (still ? 0 : Math.sin(t / 1900 + (side === "l" ? 0 : 1.4)) * 0.6));
  const sheen = useTransform(time, (t) => `${((t / 60) % 300) - 100}%`);
  return (
    <motion.div
      className="pointer-events-none absolute top-0 h-full w-[53%] overflow-hidden will-change-transform"
      style={{ [side === "l" ? "left" : "right"]: 0, x, scaleX, rotate, transformOrigin: side === "l" ? "0% 0%" : "100% 0%" }}
    >
      {/* kain songket Minang asli (motif belah ketupat emas, dari pita songket desainer) */}
      <div className="absolute inset-0" style={{ backgroundImage: `url(${img("songket-fabric")})`, backgroundSize: "100% auto", backgroundRepeat: "repeat-y" }} />
      {/* rona marun agar emasnya tidak menyilaukan + gelap di bawah */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(74,10,16,0.38)_0%,rgba(60,8,12,0.45)_60%,rgba(30,4,6,0.7)_100%)]" />
      {/* lipatan kain */}
      <div className="absolute inset-0" style={{ backgroundImage: FOLDS, backgroundSize: "100% 100%" }} />
      {/* pita songket emas di tepi dalam tirai */}
      <div className={`absolute top-0 h-full w-[6px] ${side === "l" ? "right-0" : "left-0"} bg-[linear-gradient(90deg,#8A5A1E,#F0CD82,#8A5A1E)] shadow-[0_0_14px_rgba(0,0,0,0.6)]`} />
      {/* kilau kain yang bergeser */}
      {!still && (
        <motion.div className="absolute inset-y-0 w-[40%] bg-[linear-gradient(90deg,transparent,rgba(255,220,180,0.12),transparent)]" style={{ left: sheen }} />
      )}
      {/* rumbai emas di bawah */}
      <div
        className="absolute inset-x-0 bottom-0 h-[3.5%]"
        style={{ backgroundImage: "repeating-linear-gradient(90deg, #F0CD82 0 2px, #B8862E 2px 3px, transparent 3px 6px)", maskImage: "linear-gradient(180deg,#000,rgba(0,0,0,0.5))" }}
      />
    </motion.div>
  );
}

/* lambrekin (penutup atas tirai): ukiran emas + sorot lampu; naik & memudar saat tirai tersibak */
function Valance({ still }) {
  const y = useTransform(OPEN.curtain, (v) => `${-power3Out(v) * 120}%`);
  const opacity = useTransform(OPEN.curtain, [0.4, 0.9], [1, 0]);
  return (
    <motion.div className="pointer-events-none absolute inset-x-0 top-0 z-[5]" style={{ y, opacity }}>
      <div className="h-[9svh] bg-[linear-gradient(180deg,#2A0508,#4A0A10)] shadow-[0_10px_24px_rgba(0,0,0,0.55)]" />
      <img src={img("crest")} alt="" aria-hidden="true" draggable={false} className="absolute left-1/2 top-[3svh] w-[86%] -translate-x-1/2 select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]" />
      {!still && (
        <>
          <Glint x={50} y={70} s={1.1} delay={0.5} every={2} />
          <Glint x={22} y={95} s={0.7} delay={1.4} every={2.6} />
          <Glint x={78} y={95} s={0.7} delay={2.2} every={2.6} />
        </>
      )}
    </motion.div>
  );
}

/* sorot lampu panggung di atas tirai + serbuk emas (hanya selama cover) */
function CurtainLight({ still }) {
  const time = useTime();
  const opacity = useTransform([OPEN.curtain, time], ([c, t]) => (1 - clamp01(c * 2.5)) * (still ? 0.8 : 0.65 + Math.sin(t / 1700) * 0.2));
  return (
    <motion.div className="pointer-events-none absolute inset-0 z-[4]" style={{ opacity }}>
      <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_10%,rgba(255,226,170,0.32),rgba(255,180,110,0.08)_55%,transparent)]" />
      {!still && <Dust palette={tone.dust} count={12} />}
    </motion.div>
  );
}

/* panel nama & tombol di tengah layar (marun pekat, tanpa backdrop-blur agar ringan & terbaca) */
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
        <div className="absolute -inset-6 rounded-[44px] bg-[radial-gradient(closest-side,rgba(14,2,3,0.75),transparent)]" />
        <div className="relative overflow-hidden rounded-[30px] border border-[#F0CD82]/55 bg-[radial-gradient(120%_90%_at_50%_0%,#4E0E14_0%,#33080C_55%,#1E0406_100%)] px-6 pb-6 pt-7 text-center shadow-[0_24px_50px_-18px_rgba(0,0,0,0.85)]">
          <div className="pointer-events-none absolute inset-[6px] rounded-[25px] border border-[#F0CD82]/25" />
          <img src={img("ornTri")} alt="" aria-hidden="true" draggable={false} className="mx-auto w-[22%] select-none" />
          <p className={`mt-3 ${FONTS.caps} text-[10px] tracking-[0.42em] text-[#F0CD82]`}>BARALEK GADANG</p>
          <h1 className={`mt-3 ${FONTS.script} text-[46px] leading-[0.95] text-foil drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]`}>{g}</h1>
          <p className={`${FONTS.body} text-2xl italic leading-none text-[#F0CD82]`}>&amp;</p>
          <h1 className={`${FONTS.script} text-[46px] leading-[0.95] text-foil drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]`}>{b}</h1>
          <span className="mx-auto mt-4 block h-px w-28 bg-gradient-to-r from-transparent via-[#F0CD82] to-transparent" />
          <p className={`mt-4 ${FONTS.body} text-[13px] italic text-[#FBEBD8]/75`}>Kepada Yth. Bapak/Ibu/Saudara/i</p>
          <p className={`mt-0.5 truncate ${FONTS.body} text-xl font-semibold text-[#FBEBD8]`}>{guestName || "Tamu Undangan"}</p>
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

export function SuntingRajoCover({ t, guestName, onOpen }) {
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
    animate(OPEN.curtain, 1, { duration: 1.6, ease: [0.65, 0, 0.35, 1] });
    animate(OPEN.cam, 1, { delay: 0.5, duration: 3.8, ease: [0.215, 0.61, 0.355, 1] }); // power3.out
    animate(OPEN.frame, 1, { delay: 1.0, duration: 2.4, ease: [0.22, 1, 0.36, 1] });
    animate(OPEN.bloom, 1, { delay: 1.6, type: "spring", stiffness: 60, damping: 10, mass: 1 });
    animate(OPEN.text, 1, { delay: 3.8, duration: 1.8, ease: [0.22, 1, 0.36, 1] }); // 0,4 s setelah bingkai mapan
    setTimeout(onOpen, 1400);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.9, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <MinangScene still={!!reduce} cover />
        <Curtain side="l" still={!!reduce} />
        <Curtain side="r" still={!!reduce} />
        <CurtainLight still={!!reduce} />
        <Valance still={!!reduce} />
        <div className="relative z-[7] h-full">
          <CoverPlate t={t} guestName={guestName} leaving={leaving} onOpen={open} />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HERO — nama di dalam bingkai carano, muncul bertahap (fade + letter-spacing melebar)
   ============================================================ */

const pad = (n) => String(n).padStart(2, "0");

function Lift({ i, children, className = "", spread = false }) {
  const k = useTransform(OPEN.text, (v) => clamp01(v * 1.6 - i * 0.12));
  const y = useTransform(k, (v) => (1 - v) * 16);
  const letterSpacing = useTransform(k, (v) => (spread ? `${-0.04 + v * 0.06}em` : undefined));
  return (
    <motion.div className={className} style={{ opacity: k, y, letterSpacing }}>
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
  // blok teks di tengah bukaan bingkai carano (y 33–67 %), di atas sunting & songket (mulai ±72 %)
  return (
    <section className="pointer-events-none relative h-[100svh]">
      <div className="absolute inset-x-0 top-[53.5%] -translate-y-1/2 px-[20%] text-center">
        <Lift i={0}>
          <p className={`${FONTS.caps} text-[10px] tracking-[0.42em] ${tone.kicker}`}>BARALEK GADANG</p>
        </Lift>
        <Lift i={1} className="mt-3" spread>
          <h1 className={`${FONTS.script} text-[52px] leading-[0.92] ${tone.title}`}>{data.groom.nickname}</h1>
        </Lift>
        <Lift i={2}>
          <p className={`${FONTS.body} text-2xl italic leading-none ${tone.amp}`}>&amp;</p>
        </Lift>
        <Lift i={3} spread>
          <h1 className={`${FONTS.script} text-[52px] leading-[0.92] ${tone.title}`}>{data.bride.nickname}</h1>
        </Lift>
        <Lift i={4} className="mt-4">
          <span className="mx-auto block h-px w-28 bg-gradient-to-r from-transparent via-[#F0CD82] to-transparent" />
          <p className={`mt-2 ${FONTS.caps} text-[11px] tracking-[0.32em] ${tone.kicker}`}>{day.toUpperCase()}</p>
          <p className={`mt-0.5 ${FONTS.body} text-[18px] italic ${tone.body}`}>{date}</p>
        </Lift>
        <Lift i={5} className="mt-4">
          <div className="mx-auto grid max-w-[220px] grid-cols-4 gap-1">
            {Object.entries(t).map(([k, v]) => (
              <div key={k} className="text-center">
                <p className={`${FONTS.body} text-[22px] font-medium leading-none ${tone.count}`}>{pad(v)}</p>
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
  // adegan latar baru dirender saat undangan mulai dibuka (selama cover tampil, cover punya adegannya sendiri)
  const [live, setLive] = useState(() => OPEN.curtain.get() > 0);
  useMotionValueEvent(OPEN.curtain, "change", (v) => v > 0 && setLive(true));
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const vh = window.innerHeight;
    HERO.set(y <= vh ? clamp01(y / vh) : clamp01(1 - (y - vh) / (vh * 0.6)));
    aimRig(poseAt(y, window.innerHeight));
  });
  useEffect(() => aimRig(poseAt(window.scrollY, window.innerHeight)), []);
  // setelah hero: bagian atas layar digelapkan lembut agar teks bab (di atas atap gonjong yang terang) tetap terbaca
  const scrim = useTransform(scrollY, (y) => clamp01((y - window.innerHeight * 1.2) / (window.innerHeight * 0.5)));
  return (
    <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden" aria-hidden="true">
      {live ? <MinangScene still={!!reduce} /> : <div className="absolute inset-0 bg-[#1E0406]" />}
      <motion.div style={{ opacity: scrim }} className="absolute inset-x-0 top-0 h-[42%] bg-[linear-gradient(180deg,rgba(20,3,5,0.82)_0%,rgba(20,3,5,0.55)_55%,transparent_100%)]" />
      <motion.div style={{ opacity: CAM.dim }} className={`absolute inset-0 ${tone.wash}`} />
    </div>
  );
}

const SectionDecor = makeSectionDecor(tone);

/* isi undangan sebagai perjalanan kamera di halaman rumah gadang (kit/journey.jsx) */
const { Journey, Closing } = makeJourney({
  tone,
  asset: ASSET,
  // marawa (bendera adat Minang): hitam, merah, kuning
  accent: "bg-[linear-gradient(90deg,#1A1208_0_33.3%,#B3202A_33.3%_66.6%,#E8B848_66.6%_100%)]",
  crown: { src: "crest", className: "-mb-3 w-[70%]" },
  lantern: null,
  storyCard: "center",
  // foto mempelai besar
  photo: { className: "w-[72%]", initial: "text-[110px]" },
  portal: {
    crown: { src: "crest", className: "-mb-4 w-[62%]" },
    // pilar ukir kecil di luar tepi kartu acara: membingkai tanpa menutupi tulisan
    side: { src: "column", className: "bottom-[3%] h-[48%] w-auto max-w-none opacity-95", left: "left-[-17%]", right: "right-[-17%]", mirror: true },
  },
  copy: {
    salam: ["ASSALAMU'ALAIKUM", "WARAHMATULLAHI WABARAKATUH"],
    coupleKicker: "BISMILLAHIRRAHMANIRRAHIM",
    ampTag: "SAKATO SAIYO",
    storyKicker: "KABA KITO",
    storyTitle: "Kisah Kami",
    storySub: "Tiap langkah menuju rumah gadang ini menyimpan satu kenangan",
    eventsTitle: "Hari Bahagia",
    eventsSub: "Mari masuak ka rumah gadang",
    thanks: "TARIMO KASIH",
    albumKicker: "KENANGAN",
    albumTitle: "Album Kami",
  },
});

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={10} />;
}

export const suntingRajoDecor = { Backdrop, HeroScene, Section: SectionDecor, Global: GlobalDecor, Journey, Closing, skipOpening: true };

/* thumbnail katalog: lukisan komposisi desainer */
export function SuntingRajoThumb() {
  return <img src={`${ASSET}/poster.webp`} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />;
}
