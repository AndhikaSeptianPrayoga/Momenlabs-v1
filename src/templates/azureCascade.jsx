import React, { useEffect, useState } from "react";
import { animate, motion, motionValue, useMotionValueEvent, useReducedMotion, useScroll, useTime, useTransform } from "framer-motion";
import { TONES, FONTS } from "../design/tokens.js";
import { Butterflies, CoverTitle, Dust, Flocks, GuestPanel, Petals, useCountdown } from "../design/kit/index.js";

/* ============================================================
   MOMENLABS — TEMPLATE "AZURE CASCADE" (Modern Aesthetic · toile biru pudar, krem & emas)
   ------------------------------------------------------------
   Gaya animasi "SKILL 2" (reveal berlapis ala buku cerita, lihat CLAUDE.md):
     COVER   — kartu kertas krem timbul dengan jendela lengkung; di balik jendela lukisan
               danau & air terjun yang mula-mula bernuansa biru monokrom lalu berwarna;
               ranting pohon tumbuh di sudut kartu, ornamen emas di sudut.
     BUKA    — kartu terbelah dua seperti pintu (bergeser + berayun 3D), lukisan tersingkap
               dengan Ken Burns (zoom 1,22 → 1 + blur hilang).
     RAKIT   — ranting masuk dari kiri/kanan atas, rumpun anggrek & mawar mekar dari sudut
               bawah satu per satu, burung & kupu-kupu terbang; bingkai kaca buram lengkung
               berisi nama + "Save The Date" muncul di tengah.
     ISI     — kartu-kartu krem di atas lukisan, diapit rumpun bunga di sudut yang masuk dari
               samping saat di-scroll; ornamen emas di atas tiap kartu.
   AIR TERJUN: mask permukaan air dari lukisan (falls-mask.png) → dua lapis helai air
     (water-strands.png) meluncur dari atas ke bawah dengan kecepatan berbeda + kilau jatuh,
     kabut & percikan di kaki, riak melingkar di danau. Danau: kilau riak horizontal.
   Aset: assets-src/azure-cascade → scripts/azure-cascade-assets.cjs
   ============================================================ */

const ASSET = "/templates/azure-cascade";
const tone = TONES.sapphire;
const img = (n) => `${ASSET}/${n}.webp`;
const PAPER = "#F8F6F0";

/* nilai pembukaan bersama cover & latar (cover → latar menyambung tanpa jeda) */
const OPEN = {
  doors: motionValue(1), // pintu kartu terbuka
  reveal: motionValue(1), // Ken Burns lukisan
  assemble: motionValue(1), // dekorasi dirakit
  text: motionValue(1), // teks hero
};
const SCROLL = motionValue(0); // 0 hero → 1 sudah masuk isi (dekor menyingkir ke tepi)

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease3 = (v) => v * v * (3 - 2 * v);
const easeOut = (v) => 1 - Math.pow(1 - v, 3);
// progres sub-jendela dari nilai 0..1
const part = (v, a, b) => clamp01((v - a) / (b - a));

/* ============================================================
   LUKISAN — kotak 2:3 selebar kolom (air terjun & rotunda selalu terlihat)
   ============================================================ */

const maskOf = (file) => ({
  WebkitMaskImage: `url(${ASSET}/${file})`,
  maskImage: `url(${ASSET}/${file})`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
});

/* satu lapis helai air: tekstur diulang vertikal, digulir ke bawah terus-menerus */
function WaterSheet({ size, dur, opacity, offset = 0, blend }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        opacity,
        mixBlendMode: blend,
        backgroundImage: `url(${ASSET}/water-strands.png)`,
        backgroundSize: `${size[0]}px ${size[1]}px`,
        backgroundRepeat: "repeat",
      }}
      initial={{ backgroundPosition: `${offset}px 0px` }}
      animate={{ backgroundPosition: [`${offset}px 0px`, `${offset}px ${size[1]}px`] }}
      transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
    />
  );
}

// kaki air terjun (koordinat % kotak lukisan): [x, y, lebar kabut]
const FALL_FEET = [
  [19.5, 57.2, 13],
  [29, 56.8, 6],
];

function Waterfall({ still }) {
  if (still) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* aliran air tepat di permukaan air terjun lukisan */}
      <div className="absolute inset-0 overflow-hidden" style={maskOf("falls-mask.png")}>
        <WaterSheet size={[44, 176]} dur={0.75} opacity={0.95} />
        <WaterSheet size={[70, 280]} dur={1.15} opacity={0.7} offset={23} />
        <WaterSheet size={[30, 120]} dur={0.55} opacity={0.45} offset={11} />
        {/* kilau cahaya yang ikut jatuh */}
        <motion.div
          className="absolute inset-x-0 h-[12%] bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.95),transparent)]"
          animate={{ top: ["-12%", "100%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeIn" }}
        />
        <motion.div
          className="absolute inset-x-0 h-[8%] bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.8),transparent)]"
          animate={{ top: ["-10%", "100%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeIn", delay: 0.8 }}
        />
      </div>
      {/* kabut, percikan & riak di kaki air terjun */}
      {FALL_FEET.map(([fx, fy, fw], i) => (
        <React.Fragment key={i}>
          {[0, 1, 2].map((k) => (
            <motion.div
              key={k}
              className="absolute aspect-[2.2/1] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.95),rgba(244,247,252,0.45)_55%,transparent)] blur-[2px]"
              style={{ left: `${fx + (k - 1) * fw * 0.22}%`, top: `${fy - k * 0.6}%`, width: `${fw * (1 - k * 0.15)}%` }}
              animate={{ opacity: [0.45, 0.95, 0.45], scale: [0.85, 1.3, 0.85], y: [0, -5, 0] }}
              transition={{ duration: 2.2 + k * 0.7, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 + k * 0.4 }}
            />
          ))}
          {Array.from({ length: 7 }, (_, j) => (
            <motion.span
              key={`p${j}`}
              className="absolute h-[2.5px] w-[2.5px] rounded-full bg-white shadow-[0_0_3px_rgba(255,255,255,0.9)]"
              style={{ left: `${fx - fw / 3 + (j * fw) / 10}%`, top: `${fy}%` }}
              animate={{ y: [0, -9 - (j % 3) * 5, 3], x: [0, (j % 2 ? 1 : -1) * (3 + (j % 3) * 2)], opacity: [0, 1, 0] }}
              transition={{ duration: 1.1 + (j % 3) * 0.3, repeat: Infinity, delay: j * 0.18 + i * 0.35, ease: "easeOut" }}
            />
          ))}
          {[0, 1].map((k) => (
            <motion.span
              key={`r${k}`}
              className="absolute aspect-[3.2/1] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/80"
              style={{ left: `${fx + 1}%`, top: `${fy + 2.2}%`, width: `${fw}%` }}
              animate={{ scale: [0.4, 1.6], opacity: [0.9, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: k * 1.2 + i * 0.5, ease: "easeOut" }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

/* kilau riak danau: garis-garis cahaya horizontal bergeser pelan + titik kilau */
function Lake({ still }) {
  if (still) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={maskOf("lake-mask.png")} aria-hidden="true">
      <motion.div
        className="absolute inset-y-0 left-[-20%] w-[140%] opacity-70"
        style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 5px, rgba(255,255,255,0.75) 5px 6px, transparent 6px 11px, rgba(90,115,160,0.22) 11px 12px)" }}
        animate={{ x: ["0%", "-8%", "0%"], y: [0, 3, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      {Array.from({ length: 14 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute h-[2px] rounded-full bg-white"
          style={{ left: `${10 + ((i * 47) % 80)}%`, top: `${56 + ((i * 29) % 12)}%`, width: `${3 + (i % 3) * 2}%` }}
          animate={{ opacity: [0, 0.95, 0], scaleX: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4 + (i % 4) * 0.5, repeat: Infinity, delay: (i * 0.37) % 3 }}
        />
      ))}
    </div>
  );
}

/* awan berarak dari kiri ke kanan di langit lukisan */
const CLOUDS = [
  { src: "cloudBig", top: 7, w: 44, dur: 120, phase: 0.15, o: 0.85 },
  { src: "cloudTop", top: 15, w: 36, dur: 95, phase: 0.6, o: 0.75 },
  { src: "cloudSmall", top: 22, w: 22, dur: 80, phase: 0.35, o: 0.7 },
];
function Cloud({ c, still }) {
  const time = useTime();
  const span = 100 + c.w + 20;
  const left = useTransform(time, (t) => `${((((t / 1000) / c.dur + c.phase) % 1) * span) - (c.w + 10)}%`);
  return (
    <motion.img
      src={img(c.src)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute select-none"
      style={{ top: `${c.top}%`, width: `${c.w}%`, opacity: c.o, left: still ? `${c.phase * 80}%` : left }}
    />
  );
}

const FLOCKS = [
  { top: 9, size: 13, tone: "rgba(70,92,135,0.55)", count: 5, duration: 42, delay: -6, rise: -4 },
  { top: 16, size: 19, tone: "rgba(52,74,118,0.75)", count: 3, duration: 30, delay: -18, rise: 6, reverse: true },
];

function Painting({ still }) {
  // Ken Burns pembukaan + napas pelan
  const time = useTime();
  const scale = useTransform([OPEN.reveal, time], ([r, t]) => (1 + (1 - easeOut(r)) * 0.22) * (1 + (still ? 0 : Math.sin(t / 9000) * 0.012)));
  // blur tipis hanya di tengah perjalanan zoom (jendela cover tetap tajam)
  const filter = useTransform(OPEN.reveal, (r) => `blur(${Math.sin(Math.PI * clamp01(r)) * 2.5}px)`);
  return (
    <motion.div className="absolute inset-x-0 top-0 aspect-[2/3] w-full will-change-transform" style={{ scale, filter, transformOrigin: "50% 42%" }}>
      <img src={img("scene")} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none" />
      {CLOUDS.map((c, i) => (
        <Cloud key={i} c={c} still={still} />
      ))}
      <Waterfall still={still} />
      <Lake still={still} />
      {!still && <Flocks list={FLOCKS} />}
      {/* tepi bawah lukisan melebur ke kertas */}
      <div className="absolute inset-x-0 bottom-0 h-[16%]" style={{ background: `linear-gradient(180deg, transparent, ${PAPER})` }} />
    </motion.div>
  );
}

/* ============================================================
   DEKORASI YANG DIRAKIT — ranting atas & rumpun bunga bawah
   ============================================================ */

/* sprite dengan masuk bertahap: k = progres rakit di jendela [at, at+0.3] */
function Piece({ src, at, from, style, sway = 0, phase = 0, still, mirror, origin = "50% 100%", bloom = true }) {
  const time = useTime();
  const k = useTransform(OPEN.assemble, (v) => easeOut(part(v, at, at + 0.3)));
  const x = useTransform(k, (v) => `${(1 - v) * (from?.[0] ?? 0)}%`);
  const y = useTransform(k, (v) => `${(1 - v) * (from?.[1] ?? 0)}%`);
  const scale = useTransform(k, (v) => (bloom ? 0.55 + v * 0.45 : 1));
  const rotate = useTransform(time, (t) => (still || !sway ? 0 : Math.sin((t / 1000) * 0.6 + phase) * sway));
  return (
    <motion.img
      src={img(src)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute select-none"
      style={{ ...style, x, y, scale, rotate, opacity: k, scaleX: mirror ? -1 : 1, transformOrigin: origin }}
    />
  );
}

function Branches({ still }) {
  const xL = useTransform(SCROLL, (s) => `${-s * 22}%`);
  const xR = useTransform(SCROLL, (s) => `${s * 22}%`);
  return (
    <>
      <motion.div className="absolute inset-0" style={{ x: xL }}>
        <Piece src="branchL" at={0.02} from={[-60, -10]} bloom={false} sway={1.2} still={still} origin="0% 0%" style={{ left: "-8%", top: "-1.5%", width: "66%" }} />
      </motion.div>
      <motion.div className="absolute inset-0" style={{ x: xR }}>
        <Piece src="branchR" at={0.1} from={[60, -10]} bloom={false} sway={1.2} phase={1.7} still={still} origin="100% 0%" style={{ right: "-6%", top: "-1%", width: "52%" }} />
      </motion.div>
    </>
  );
}

/* rumpun bunga: koordinat % kotak rumpun; masuk satu per satu dari sudutnya */
const CLUSTER_L = [
  { src: "blossom", x: -6, y: 4, w: 72, at: 0.3, rot: -8 },
  { src: "leafGold", x: 52, y: 8, w: 34, at: 0.34 },
  { src: "roseNavy", x: -4, y: 36, w: 42, at: 0.4 },
  { src: "orchidBig", x: 28, y: 30, w: 44, at: 0.46 },
  { src: "hydrangea", x: 58, y: 48, w: 30, at: 0.52 },
  { src: "roseWhite", x: 18, y: 58, w: 40, at: 0.56 },
  { src: "orchidA", x: -10, y: 64, w: 36, at: 0.6 },
];
const CLUSTER_R = [
  { src: "blueLeaves", x: 46, y: 0, w: 46, at: 0.36 },
  { src: "leafGold", x: 8, y: 16, w: 34, at: 0.4, mirror: true },
  { src: "roseNavyB", x: 52, y: 34, w: 40, at: 0.44 },
  { src: "orchidBig", x: 22, y: 36, w: 44, at: 0.5, mirror: true },
  { src: "roseWhite", x: 62, y: 58, w: 38, at: 0.55 },
  { src: "hydrangea", x: 10, y: 60, w: 32, at: 0.58 },
  { src: "orchidA", x: 38, y: 66, w: 34, at: 0.62, mirror: true },
];

function Cluster({ items, side, still }) {
  const dir = side === "l" ? -1 : 1;
  return items.map((it, i) => (
    <Piece
      key={i}
      src={it.src}
      at={it.at}
      from={[dir * 40, 50]}
      sway={1}
      phase={i * 0.9}
      still={still}
      mirror={it.mirror}
      style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%`, rotate: it.rot }}
    />
  ));
}

function Blooms({ still }) {
  const xL = useTransform(SCROLL, (s) => `${-s * 30}%`);
  const xR = useTransform(SCROLL, (s) => `${s * 30}%`);
  const o = useTransform(SCROLL, (s) => 1 - s * 0.35);
  return (
    <>
      <motion.div className="absolute bottom-[-4%] left-[-8%] aspect-[1/1.05] w-[58%]" style={{ x: xL, opacity: o }}>
        <Cluster items={CLUSTER_L} side="l" still={still} />
      </motion.div>
      <motion.div className="absolute bottom-[-4%] right-[-8%] aspect-[1/1.05] w-[58%]" style={{ x: xR, opacity: o }}>
        <Cluster items={CLUSTER_R} side="r" still={still} />
      </motion.div>
    </>
  );
}

const BUTTERFLIES = [
  { left: 14, top: 72, size: 30, a: "#F7F3E8", b: "#7E95C2", vein: "#2E3E62", dur: 17, path: [[0, 0], [40, -60], [90, -30], [60, 30], [0, 0]] },
  { left: 74, top: 66, size: 26, a: "#FFF6DE", b: "#D7B36A", vein: "#5A4420", dur: 20, path: [[0, 0], [-50, -40], [-90, 10], [-30, 40], [0, 0]] },
  { left: 50, top: 46, size: 22, a: "#F4F7FF", b: "#9DB0D8", vein: "#3C4866", dur: 15, path: [[0, 0], [30, -50], [-20, -90], [-40, -30], [0, 0]] },
];

function Fauna({ still }) {
  const opacity = useTransform(OPEN.assemble, [0.5, 0.8], [0, 1]);
  if (still) return null;
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ opacity }}>
      <Butterflies list={BUTTERFLIES} />
    </motion.div>
  );
}

/* adegan lengkap (latar tetap & di balik jendela cover) */
function AzureScene({ still = false }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: PAPER }}>
      <div className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_100%,rgba(196,208,230,0.35),transparent_70%)]" />
      <Painting still={still} />
      <Branches still={still} />
      <Blooms still={still} />
      <Fauna still={still} />
      {!still && <Dust palette={tone.dust} count={14} />}
    </div>
  );
}

/* ============================================================
   COVER — kartu kertas timbul berjendela lengkung, terbelah seperti pintu
   ============================================================ */

// jendela lengkung (viewBox 0..100, digambar non-proporsional mengikuti layar)
const WIN = { l: 16, r: 84, top: 7, bottom: 54, ry: 15 };
const ARCH = (inset = 0) => {
  const l = WIN.l + inset, r = WIN.r - inset, top = WIN.top + inset * 0.46, b = WIN.bottom - inset * 0.46;
  const rx = (r - l) / 2, ry = WIN.ry - inset * 0.3;
  return `M${l} ${top + ry} A${rx} ${ry} 0 0 1 ${r} ${top + ry} V${b} H${l} Z`;
};
const HOLE_MASK = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path fill-rule='evenodd' fill='black' d='M0 0H100V100H0Z ${ARCH()}'/></svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return { WebkitMaskImage: url, maskImage: url, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };
})();
const PAPER_BG = {
  backgroundColor: "#F6F1E6",
  backgroundImage: [
    `url("data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.09 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>").replace(/%2523/g, "%23")}")`,
    "radial-gradient(120% 70% at 50% 0%, #FFFDF8 0%, #F4EEE2 60%, #E8E0CD 100%)",
  ].join(","),
};

/* hiasan kartu (sama untuk dua daun pintu; masing-masing memotong separuhnya) */
function CardFace({ still }) {
  return (
    <>
      <div className="absolute inset-0" style={PAPER_BG} />
      {/* bingkai garis emas di tepi kartu */}
      <div className="absolute inset-[3.5%] rounded-[22px] border border-[#C9A55A]/55" />
      <div className="absolute inset-[4.6%] rounded-[18px] border border-[#C9A55A]/25" />
      {/* lengkung jendela timbul: bayangan dalam + garis emas + sorot putih */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={ARCH(-1.6)} fill="none" stroke="rgba(120,100,60,0.28)" strokeWidth="5" vectorEffect="non-scaling-stroke" style={{ filter: "blur(3px)" }} />
        <path d={ARCH(-1.2)} fill="none" stroke="#FFFFFF" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <path d={ARCH(-0.3)} fill="none" stroke="#C9A55A" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        <path d={ARCH(-2.6)} fill="none" stroke="#C9A55A" strokeOpacity="0.45" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* ornamen emas di puncak & kaki jendela, rumpun kecil di sudut */}
      <img src={img("ornamentB")} alt="" aria-hidden="true" draggable={false} className="absolute left-1/2 top-[3.4%] w-[30%] -translate-x-1/2 select-none" />
      <img src={img("divider")} alt="" aria-hidden="true" draggable={false} className="absolute left-1/2 top-[55.5%] w-[46%] -translate-x-1/2 select-none opacity-80" />
      <CoverSprig src="blossom" style={{ left: "1%", bottom: "4%", width: "34%" }} delay={0.9} still={still} />
      <CoverSprig src="blossom" mirror style={{ right: "1%", bottom: "4%", width: "34%" }} delay={1.1} still={still} />
    </>
  );
}

/* ranting & rumpun yang "tumbuh" di permukaan kartu saat cover muncul */
function CoverSprig({ src, style, mirror, delay, still, origin = "50% 100%" }) {
  return (
    <motion.img
      src={img(src)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute select-none"
      style={{ ...style, scaleX: mirror ? -1 : 1, transformOrigin: origin }}
      initial={still ? false : { opacity: 0, scale: 0.4, rotate: mirror ? 8 : -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 1.8, delay, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

function Door({ side, still }) {
  const dir = side === "l" ? -1 : 1;
  const x = useTransform(OPEN.doors, (v) => `${dir * ease3(v) * 62}%`);
  const rotateY = useTransform(OPEN.doors, (v) => dir * -ease3(v) * 32);
  const shadow = useTransform(OPEN.doors, (v) => `drop-shadow(${dir * 18 * v}px 10px 24px rgba(40,50,80,${0.15 + v * 0.25}))`);
  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotateY, filter: shadow, transformOrigin: side === "l" ? "0% 50%" : "100% 50%", clipPath: side === "l" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)" }}
    >
      <div className="absolute inset-0" style={HOLE_MASK}>
        <CardFace still={still} />
        {/* ranting tumbuh dari sudut atas kartu */}
        <CoverSprig src="branchL" style={{ left: "-4%", top: "-2%", width: "46%" }} origin="0% 0%" delay={0.3} still={still} />
        <CoverSprig src="branchR" style={{ right: "-4%", top: "-2%", width: "38%" }} origin="100% 0%" delay={0.5} still={still} />
      </div>
    </motion.div>
  );
}

/* isi jendela berubah dari biru monokrom (cetak toile) menjadi lukisan berwarna */
function WindowTint({ still }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 bg-[#5C76AA] mix-blend-color"
      initial={{ opacity: still ? 0 : 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 2.2, delay: 1.2, ease: "easeInOut" }}
    />
  );
}

export function AzureCascadeCover({ t, guestName, onOpen }) {
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  // reset sebelum anak-anak dirender (bukan di effect) agar transformasi turunan langsung memakai nilai awal
  const [ready] = useState(() => {
    Object.values(OPEN).forEach((v) => v.set(0));
    SCROLL.set(0);
    return true;
  });
  useEffect(() => {
    if (ready) Object.values(OPEN).forEach((v) => v.get() === 1 && !leaving && v.set(0));
  }, []);

  const open = () => {
    if (leaving) return;
    setLeaving(true);
    if (reduce) {
      Object.values(OPEN).forEach((v) => v.set(1));
      onOpen();
      return;
    }
    animate(OPEN.doors, 1, { duration: 1.7, ease: [0.65, 0, 0.35, 1] });
    animate(OPEN.reveal, 1, { delay: 0.2, duration: 3.4, ease: [0.22, 1, 0.36, 1] });
    animate(OPEN.assemble, 1, { delay: 1.0, duration: 3.6, ease: "linear" });
    animate(OPEN.text, 1, { delay: 2.4, duration: 1.8, ease: [0.22, 1, 0.36, 1] });
    setTimeout(onOpen, 1750);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden [perspective:1400px]">
        <AzureScene still={!!reduce} />
        <WindowTint still={!!reduce} />
        <Door side="l" still={!!reduce} />
        <Door side="r" still={!!reduce} />
        <div className="relative z-[7] h-full">
          <CoverTitle tone={tone} t={t} leaving={leaving} delay={0.6} position="top-[59%]" />
          <GuestPanel tone={tone} guestName={guestName} leaving={leaving} onOpen={open} delay={1.4} />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HERO — bingkai kaca buram lengkung di antara air terjun & rotunda
   ============================================================ */

const pad = (n) => String(n).padStart(2, "0");

function Lift({ i, children, className = "" }) {
  const k = useTransform(OPEN.text, (v) => clamp01(v * 1.6 - i * 0.12));
  const y = useTransform(k, (v) => (1 - v) * 16);
  const filter = useTransform(k, (v) => `blur(${(1 - v) * 5}px)`);
  return (
    <motion.div className={className} style={{ opacity: k, y, filter }}>
      {children}
    </motion.div>
  );
}

function GlassFrame({ children }) {
  const k = useTransform(OPEN.assemble, (v) => easeOut(part(v, 0.55, 0.9)));
  const scale = useTransform(k, (v) => 0.9 + v * 0.1);
  // bingkai lengkung tepat di tengah layar (horizontal & vertikal)
  return (
    <motion.div className="absolute left-[19%] top-[50%] -mt-[29svh] h-[58svh] w-[62%]" style={{ opacity: k, scale }}>
      {/* kaca buram berbentuk lengkung, tepi putih & garis emas (cukup tembus agar lukisan tetap terlihat) */}
      <div className="absolute inset-0 rounded-t-full rounded-b-[20px] border border-white/85 bg-white/45 shadow-[0_18px_40px_-20px_rgba(40,60,100,0.45)] backdrop-blur-[5px]" />
      <div className="absolute inset-[6px] rounded-t-full rounded-b-[16px] border border-[#C9A55A]/55" />
      <img src={img("ornament")} alt="" aria-hidden="true" draggable={false} className="absolute left-1/2 top-[-3.5%] w-[56%] -translate-x-1/2 select-none" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 pt-[16%] text-center">{children}</div>
    </motion.div>
  );
}

function HeroScene({ data }) {
  const first = data.events[0];
  const t = useCountdown(first.start);
  const opt = { timeZone: "Asia/Jakarta" };
  const day = new Date(first.start).toLocaleDateString("id-ID", { weekday: "long", ...opt });
  const date = new Date(first.start).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", ...opt });
  const toEvents = () => document.getElementById("acara")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="pointer-events-none relative h-[100svh]">
      <GlassFrame>
        <Lift i={0}>
          <p className={`${FONTS.caps} text-[9.5px] tracking-[0.38em] ${tone.kicker}`}>THE WEDDING OF</p>
        </Lift>
        <Lift i={1} className="mt-2">
          <h1 className={`${FONTS.script} text-[50px] leading-[0.92] ${tone.title}`}>{data.groom.nickname}</h1>
        </Lift>
        <Lift i={2}>
          <p className={`${FONTS.body} text-2xl italic leading-none ${tone.amp}`}>&amp;</p>
        </Lift>
        <Lift i={3}>
          <h1 className={`${FONTS.script} text-[50px] leading-[0.92] ${tone.title}`}>{data.bride.nickname}</h1>
        </Lift>
        <Lift i={4} className="mt-3">
          <img src={img("divider")} alt="" aria-hidden="true" className="mx-auto w-[82%] opacity-80" />
          <p className={`mt-1.5 ${FONTS.caps} text-[11px] tracking-[0.3em] ${tone.kicker}`}>{day.toUpperCase()}</p>
          <p className={`mt-0.5 ${FONTS.body} text-[19px] italic ${tone.body}`}>{date}</p>
        </Lift>
        <Lift i={5} className="mt-3 w-full">
          <div className="mx-auto grid max-w-[220px] grid-cols-4 gap-1">
            {Object.entries(t).map(([k, v]) => (
              <div key={k} className="text-center">
                <p className={`${FONTS.body} text-[22px] font-medium leading-none ${tone.count}`}>{pad(v)}</p>
                <p className={`mt-1 ${FONTS.caps} text-[7px] tracking-[0.18em] ${tone.countLabel}`}>{k.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </Lift>
        <Lift i={6} className="mt-4">
          <button
            type="button"
            onClick={toEvents}
            className="pointer-events-auto rounded-full bg-[#4A6597] px-5 py-2 font-serif text-[12px] tracking-[0.12em] text-white shadow-[0_8px_18px_-8px_rgba(40,60,110,0.8)]"
          >
            Save The Date
          </button>
        </Lift>
      </GlassFrame>
    </section>
  );
}

/* ============================================================
   LATAR TETAP — lukisan menempel; dekor menyingkir ke tepi saat isi mulai
   ============================================================ */

function Backdrop() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => SCROLL.set(clamp01((y - window.innerHeight * 0.2) / (window.innerHeight * 0.8))));
  const y = useTransform(scrollY, (v) => -Math.min(v * 0.12, 120));
  const wash = useTransform(SCROLL, (s) => s * 0.45);
  return (
    <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden" aria-hidden="true">
      <motion.div className="absolute inset-0" style={{ y }}>
        <AzureScene still={!!reduce} />
      </motion.div>
      <motion.div style={{ opacity: wash, background: PAPER }} className="absolute inset-0" />
    </div>
  );
}

/* ============================================================
   KARTU ISI — panel krem + ornamen emas + rumpun bunga di sudut (masuk dari samping)
   ============================================================ */

const SECTION_SIDES = { quote: 0, mempelai: 1, acara: 0, hadiah: 1, rsvp: 0, voice: 1, story: 1 };

function CornerCluster({ flip }) {
  const items = flip
    ? [
        { src: "blueLeaves", x: 40, y: 0, w: 52 },
        { src: "roseNavyB", x: 46, y: 30, w: 44 },
        { src: "orchidA", x: 6, y: 34, w: 46 },
        { src: "leafGold", x: 0, y: 6, w: 38 },
      ]
    : [
        { src: "leafGold", x: 54, y: 4, w: 40 },
        { src: "roseNavy", x: 0, y: 26, w: 46 },
        { src: "orchidBig", x: 34, y: 22, w: 50 },
        { src: "hydrangea", x: 20, y: 56, w: 32 },
      ];
  return items.map((it, i) => (
    <motion.img
      key={i}
      src={img(it.src)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="absolute select-none"
      style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%` }}
      initial={{ opacity: 0, scale: 0.5, x: flip ? 30 : -30 }}
      whileInView={{ opacity: 1, scale: 1, x: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
    />
  ));
}

function SectionDecor({ id }) {
  const flip = SECTION_SIDES[id] === 1;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* kartu krem lembut di atas lukisan */}
      <motion.div
        className="absolute inset-x-3 bottom-5 top-5 rounded-[26px] border border-[#C9A55A]/35 bg-[#FBF9F3]/88 shadow-[0_20px_40px_-26px_rgba(40,60,100,0.45)] backdrop-blur-[3px]"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8% 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-x-6 top-8 h-px bg-gradient-to-r from-transparent via-[#B08A3E]/40 to-transparent" />
      <motion.img
        src={img("ornamentB")}
        alt=""
        className="absolute left-1/2 top-1 w-28 -translate-x-1/2 select-none"
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.2 }}
      />
      {/* rumpun bunga di sudut atas & bawah yang berseberangan */}
      <div className={`absolute top-0 aspect-square w-[30%] ${flip ? "right-[-3%]" : "left-[-3%]"}`}>
        <CornerCluster flip={flip} />
      </div>
      <div className={`absolute bottom-0 aspect-square w-[30%] ${flip ? "left-[-3%]" : "right-[-3%]"}`}>
        <CornerCluster flip={!flip} />
      </div>
    </div>
  );
}

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={8} />;
}

export const azureCascadeDecor = { Backdrop, HeroScene, Section: SectionDecor, Global: GlobalDecor, skipOpening: true };

/* thumbnail katalog: lukisan komposisi desainer */
export function AzureCascadeThumb() {
  return <img src={`${ASSET}/poster.webp`} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />;
}
