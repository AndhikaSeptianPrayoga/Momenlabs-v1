import React, { useEffect, useRef, useState } from "react";
import { animate, motion, motionValue, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { TONES, MOTION } from "../design/tokens.js";
import { Butterflies, CoverTitle, Dust, Flocks, GuestPanel, Petals, makeBackdrop, makeHeroScene, makeSectionDecor, useStageBox } from "../design/kit/index.js";

/* ============================================================
   MOMENLABS — TEMPLATE "VILLA AURELIA" (European classic, taman sore keemasan)
   ------------------------------------------------------------
   Satu ilustrasi taman sore dipecah jadi lapisan kedalaman: langit &
   danau → gerbang → kolam air mancur → pagar depan → bingkai mawar.
   Kamera maju pelan; saat dibuka, kamera masuk dan bingkai kiri-kanan
   menyingkir. Efek berulang: awan, burung, air mancur, kilau danau,
   lentera, kupu-kupu, kelopak mawar.
   Aset: scripts/garden-layers.cjs (assets-src/villa-aurelia).
   ============================================================ */

const PHOTO_BASE = "/templates/villa-aurelia/photos";
const tone = TONES.espresso;
const ease = MOTION.ease;

export const AURELIA_PHOTOS = {
  couple: `${PHOTO_BASE}/couple.jpg`,
  embrace: `${PHOTO_BASE}/couple-embrace.jpg`,
  bride: `${PHOTO_BASE}/bride.jpg`,
  groom: `${PHOTO_BASE}/groom.jpg`,
};

/* kamera bersama cover & hero agar transisi buka undangan menyambung */
const sceneCam = motionValue(0);
const heroReveal = motionValue(1);
const CAM_ENTERED = 1; // kamera setelah masuk: bingkai mawar & pagar depan sudah menyingkir

/* ============================================================
   ADEGAN TAMAN: satu ilustrasi dipecah jadi lapisan kedalaman
   ------------------------------------------------------------
   Semua lapisan berasal dari gambar yang sama, jadi saat diam
   menyatu sempurna. Kamera (cam) memperbesar tiap lapisan dari titik
   hilang di gerbang dengan laju berbeda: makin dekat makin cepat,
   sehingga bingkai mawar & pagar depan menyingkir saat "masuk".
   Aset: scripts/garden-layers.cjs (assets-src/villa-aurelia).
   ============================================================ */

const GARDEN = "/templates/villa-aurelia";
const VP = "50% 39%"; // titik hilang: gerbang di ujung taman
const DEPTH = { bg: 0.1, gate: 0.18, ring: 0.3, near: 0.55 };
const pct = (x, y) => ({ left: `${(x / 1536) * 100}%`, top: `${(y / 1024) * 100}%` });

function LayerImg({ name }) {
  return <img src={`${GARDEN}/${name}.webp`} alt="" aria-hidden="true" draggable={false} decoding="async" className="pointer-events-none absolute inset-0 h-full w-full select-none" />;
}

function GardenLayer({ cam, name, depth, children }) {
  const scale = useTransform(cam, (c) => 1 + c * depth);
  return (
    <motion.div className="absolute inset-0" style={{ scale, transformOrigin: VP }}>
      {name && <LayerImg name={name} />}
      {children}
    </motion.div>
  );
}

/* bingkai mawar kiri/kanan: bergoyang tertiup angin, lalu terbang keluar saat masuk.
   Di layar sempit (HP) bingkai ditarik ke dalam agar tetap membingkai adegan. */
function GardenFrame({ cam, name, side, width, margin, pull, depth = 0.9 }) {
  // bingkai diam selama kamera hanya melayang pelan di cover; baru bergerak saat masuk
  const k = useTransform(cam, (c) => Math.max(0, c - 0.15) / 0.85);
  const scale = useTransform(k, (c) => 1 + c * depth);
  const x = useTransform(k, (c) => -side * margin * pull + side * c * width * 0.2);
  const opacity = useTransform(k, (c) => 1 - Math.max(0, Math.min(1, (c - 0.55) / 0.35)));
  // setelah terbang keluar, lapisan tidak lagi digambar sama sekali
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  return (
    <motion.div className="absolute inset-0" style={{ scale, x, opacity, visibility, transformOrigin: VP }}>
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: side < 0 ? "0% 30%" : "100% 30%" }}
        animate={{ rotate: [0, side * 0.45, side * -0.15, 0] }}
        transition={{ duration: 7 + side, repeat: Infinity, ease: "easeInOut" }}
      >
        <LayerImg name={name} />
      </motion.div>
    </motion.div>
  );
}

/* ---------- kehidupan di langit & danau (ikut lapisan latar) ---------- */

const CLOUD_PUFFS = [
  { x: 470, y: 60, w: 26, dur: 46, delay: -8 },
  { x: 760, y: 120, w: 34, dur: 60, delay: -30 },
  { x: 1010, y: 40, w: 22, dur: 52, delay: -18 },
  { x: 640, y: 175, w: 18, dur: 40, delay: -4 },
];

function SkyLife() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* matahari sore berdenyut lembut */}
      <motion.div
        className="absolute h-[34%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,236,190,0.85),rgba(255,200,140,0.35)_45%,transparent)]"
        style={pct(1236, 230)}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* awan tipis berarak */}
      {CLOUD_PUFFS.map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[radial-gradient(closest-side,rgba(255,244,232,0.55),transparent)]"
          style={{ ...pct(c.x, c.y), width: `${c.w}%`, aspectRatio: "4 / 1" }}
          animate={{ x: ["-18%", "18%", "-18%"] }}
          transition={{ duration: c.dur, repeat: Infinity, ease: "easeInOut", delay: c.delay }}
        />
      ))}
      {/* kilau matahari di permukaan danau */}
      {Array.from({ length: 14 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute h-[0.25%] rounded-full bg-[#FFF3D6]"
          style={{ ...pct(1010 + ((i * 53) % 360), 306 + ((i * 17) % 40)), width: `${0.6 + (i % 3) * 0.5}%` }}
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.2 + (i % 4) * 0.5, repeat: Infinity, delay: (i * 0.37) % 3, ease: "easeInOut" }}
        />
      ))}
      {/* lentera taman menyala */}
      {[
        [262, 382],
        [1271, 376],
        [500, 338],
      ].map(([x, y], i) => (
        <motion.div
          key={`l${i}`}
          className="absolute h-[7%] w-[5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,226,160,0.9),rgba(255,190,110,0.25)_55%,transparent)]"
          style={pct(x, y)}
          animate={{ opacity: [0.6, 1, 0.75, 0.95, 0.6] }}
          transition={{ duration: 2.4 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ---------- air mancur: tirai air jatuh, riak & kilau (ikut lapisan kolam) ---------- */

const STREAMS = [...Array.from({ length: 7 }, (_, i) => 704 + i * 5), ...Array.from({ length: 7 }, (_, i) => 814 + i * 5)];

function FountainWater() {
  return (
    <svg viewBox="0 0 1536 1024" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {STREAMS.map((x, i) => {
        const out = (x - 768) * 0.12;
        return (
          <motion.path
            key={i}
            d={`M ${x} 578 Q ${x + out * 0.4} 600 ${x + out} 688`}
            fill="none"
            stroke="rgba(236,246,255,0.7)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="9 13"
            animate={{ strokeDashoffset: [0, -44] }}
            transition={{ duration: 0.55 + (i % 3) * 0.08, repeat: Infinity, ease: "linear" }}
          />
        );
      })}
      {[0, 1, 2].map((i) => (
        <motion.ellipse
          key={`r${i}`}
          cx="768"
          cy="704"
          fill="none"
          stroke="rgba(240,248,255,0.6)"
          strokeWidth="1.2"
          initial={{ rx: 30, ry: 5, opacity: 0.7 }}
          animate={{ rx: [30, 150], ry: [5, 20], opacity: [0.7, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i, ease: "easeOut" }}
        />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.circle
          key={`s${i}`}
          cx={712 + ((i * 41) % 130)}
          cy={692 + ((i * 13) % 16)}
          r="2.2"
          fill="#FFFFFF"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.21 }}
        />
      ))}
    </svg>
  );
}

/* ---------- cahaya & makhluk kecil di atas adegan ---------- */

/* berkas sinar matahari miring dari kanan atas */
function LightShafts() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {[
        { left: "58%", w: "20%", rot: 32, o: 0.35, delay: 0 },
        { left: "72%", w: "12%", rot: 36, o: 0.28, delay: 1.8 },
        { left: "44%", w: "9%", rot: 28, o: 0.2, delay: 3.4 },
      ].map((b, i) => (
        <motion.div
          key={i}
          className="absolute -top-[12%] h-[100%] origin-top"
          style={{ left: b.left, width: b.w, rotate: b.rot, background: "linear-gradient(180deg, rgba(255,236,200,0.55), rgba(255,220,170,0.12) 60%, transparent)" }}
          animate={{ opacity: [b.o * 0.4, b.o, b.o * 0.5] }}
          transition={{ duration: 6 + i, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: b.delay }}
        />
      ))}
    </div>
  );
}

/* burung sore cokelat tua: jauh kecil & pucat, dekat besar & tegas */
const FLOCKS = [
  { top: 9, size: 18, tone: "rgba(80,52,36,0.6)", count: 5, duration: 28, delay: -10, rise: -4 },
  { top: 17, size: 13, tone: "rgba(96,66,48,0.5)", count: 6, duration: 38, delay: -22, rise: 5, reverse: true },
  { top: 6, size: 44, tone: "rgba(52,34,22,0.92)", count: 2, duration: 11, delay: 6, rise: -8, repeatDelay: 18, detail: true },
];

function RoyalScene({ cam }) {
  // kotak gambar 3:2 yang selalu menutupi layar, titik hilang tetap di tengah
  const [ref, box] = useStageBox(1.5, 0.4);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#D9B48A]">
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          <GardenLayer cam={cam} name="bg" depth={DEPTH.bg}>
            <SkyLife />
          </GardenLayer>
          <GardenLayer cam={cam} name="gate" depth={DEPTH.gate} />
          <GardenLayer cam={cam} name="ring" depth={DEPTH.ring}>
            <FountainWater />
          </GardenLayer>
          <GardenLayer cam={cam} name="near" depth={DEPTH.near} />
          <GardenFrame cam={cam} name="sideL" side={-1} width={box.W} margin={-box.left} pull={0.72} />
          <GardenFrame cam={cam} name="sideR" side={1} width={box.W} margin={-box.left} pull={0.72} />
          <GardenFrame cam={cam} name="canopyL" side={-1} width={box.W} margin={-box.left} pull={0.42} depth={0.7} />
          <GardenFrame cam={cam} name="canopyR" side={1} width={box.W} margin={-box.left} pull={0.42} depth={0.7} />
        </div>
      )}

      <Flocks list={FLOCKS} />
      <LightShafts />
      <Butterflies />
      <Dust palette={tone.dust} count={12} />

      {/* vinyet & gradasi atas agar teks terbaca */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_45%,transparent_50%,rgba(40,24,10,0.45)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-[#2A1A0C]/70 to-transparent" />
    </div>
  );
}

/* ---------- thumbnail katalog ---------- */

export function AureliaThumb() {
  const cam = useMotionValue(0);
  return <RoyalScene cam={cam} />;
}

/* ============================================================
   COVER
   ============================================================ */

export function AureliaCover({ t, guestName, onOpen }) {
  const reduce = useReducedMotion();
  const cam = sceneCam;
  const [leaving, setLeaving] = useState(false);
  const drift = useRef(null);

  useEffect(() => {
    cam.set(0);
    heroReveal.set(0);
    if (reduce) {
      cam.set(0.1);
      return;
    }
    drift.current = animate(cam, 0.12, { duration: 12, ease: [0.25, 0.1, 0.25, 1] });
    return () => drift.current?.stop();
  }, [cam, reduce]);

  const open = () => {
    if (leaving) return;
    setLeaving(true);
    drift.current?.stop();
    if (reduce) {
      cam.set(CAM_ENTERED);
      heroReveal.set(1);
      onOpen();
      return;
    }
    // kamera masuk: bingkai mawar terbang keluar, taman mendekat ke gerbang
    animate(cam, CAM_ENTERED, { duration: 3.2, ease: [0.5, 0.05, 0.25, 1] });
    animate(heroReveal, 1, { duration: 1.2, delay: 2.6, ease });
    setTimeout(onOpen, 450);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <RoyalScene cam={cam} />
        <Petals palette={tone.petals} count={12} />

        <CoverTitle tone={tone} t={t} leaving={leaving} />
        <GuestPanel tone={tone} guestName={guestName} leaving={leaving} onOpen={open} />
      </div>
    </motion.div>
  );
}

/* ============================================================
   HERO, LATAR TETAP & DEKORASI (kit bersama)
   ============================================================ */

const HeroScene = makeHeroScene({ tone, kicker: "WE ARE GETTING MARRIED", reveal: heroReveal });

// kamera latar = posisi setelah masuk (sceneCam) + maju mengikuti scroll
const Backdrop = makeBackdrop({ tone, travel: 1.3, camBase: sceneCam, renderScene: ({ cam }) => <RoyalScene cam={cam} /> });

const SectionDecor = makeSectionDecor(tone);

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={12} />;
}

export const aureliaDecor = { Backdrop, HeroScene, Section: SectionDecor, Global: GlobalDecor, skipOpening: true };

/* foto pasangan untuk data demo */
export function aureliaData(data) {
  return {
    ...data,
    coverPhoto: AURELIA_PHOTOS.couple,
    groom: { ...data.groom, photo: AURELIA_PHOTOS.groom },
    bride: { ...data.bride, photo: AURELIA_PHOTOS.bride },
    story: data.story.map((s, i) => ({
      ...s,
      photo: [AURELIA_PHOTOS.embrace, AURELIA_PHOTOS.couple, AURELIA_PHOTOS.bride, AURELIA_PHOTOS.embrace][i % 4],
    })),
  };
}
