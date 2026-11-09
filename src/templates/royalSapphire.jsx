import React, { useEffect, useRef, useState } from "react";
import { animate, motion, motionValue, useReducedMotion, useScroll, useSpring, useTime, useTransform } from "framer-motion";
import { TONES, MOTION, FONTS } from "../design/tokens.js";
import { CoverTitle, Dust, GuestPanel, Petals, useCountdown, useStageBox, tiltX, tiltY, useTiltInput, requestTiltPermission } from "../design/kit/index.js";

/* ============================================================
   MOMENLABS — TEMPLATE "ROYAL SAPPHIRE" (Botanical Heritage · toile de Jouy biru & emas)
   ------------------------------------------------------------
   Tiga lapisan kedalaman (2.5D), semua sprite utuh dari kolase desainer
   (assets-src/royal-sapphire → scripts/sapphire-assets.cjs):
     1. Latar  — lanskap ukiran (istana, air terjun, danau), pohon, cemara, awan
                 di atas kertas krem; air terjun mengalir, danau beriak (SVG
                 displacement), awan berarak. Parallax scroll ×0,2.
     2. Tengah — bingkai lengkung emas Barok tempat nama & hitung mundur; kilau emas
                 menyapu permukaannya (mask sprite). Bergerak normal ×1,0.
     3. Depan  — rangkaian anggrek putih & mawar navy di sudut bawah, bergoyang pelan.
                 Bergerak ×1,5 ke bawah-luar dengan blur kedalaman.
   Urutan pembukaan ("Buka Undangan"):
     0,0 s  latar zoom halus 1,05 → 1,0
     0,3 s  bingkai emas fade-in + kilau menyapu
     0,6 s  bunga meluncur naik dari luar layar (spring, sedikit memantul) + fade-in
     1,4 s  teks muncul bertahap (fade + scale-up), hitung mundur menyusul
   Ambient: debu emas & kilauan melayang, kelopak berjatuhan, riak danau, kabut air terjun.
   ============================================================ */

const ASSET = "/templates/royal-sapphire";
const tone = TONES.sapphire;
const ease = MOTION.ease;

/* nilai pembukaan bersama cover & hero */
const OPEN = {
  bg: motionValue(1), // 0 = zoom 1,05 → 1 = 1,0
  frame: motionValue(1),
  bloom: motionValue(1),
  text: motionValue(1),
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/* ============================================================
   LAPISAN LATAR — lanskap toile di atas kertas krem (koordinat panggung 9:16, %)
   ============================================================ */

const CLOUDS = [
  { src: "cloudA", top: 3, w: 78, dur: 140, delay: -30, o: 0.9 },
  { src: "cloudB", top: 12, w: 52, dur: 110, delay: -70, o: 0.85, mirror: true },
  { src: "cloudB", top: -4, w: 46, dur: 160, delay: -110, o: 0.7 },
];

/* ============================================================
   AIR TERJUN — aliran air hanya tampil di permukaan dua air terjun lukisan.
   falls-mask.png (dibuat dari piksel air putih sprite lanskap) menjadi CSS mask;
   di dalamnya dua lapis serat air (SVG turbulence memanjang vertikal) meluncur
   ke bawah dengan kecepatan berbeda, ditambah kabut & percikan di kaki air terjun.
   Koordinat = % kotak sprite lanskap.
   ============================================================ */

const FALLS_MASK = {
  WebkitMaskImage: `url(${ASSET}/falls-mask.png)`,
  maskImage: `url(${ASSET}/falls-mask.png)`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};
// kaki tiap air terjun: [x %, y %, lebar kabut %]
const FALL_FEET = [
  [61.8, 79, 7],
  [68.8, 77, 8],
];

/* satu lapis helai air: tekstur water-strands.png yang diulang & digulir ke bawah terus
   (tanpa filter SVG → ringan & tampil di semua HP, termasuk Safari) */
function WaterSheet({ size, dur, opacity, offset = 0 }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, backgroundImage: `url(${ASSET}/water-strands.png)`, backgroundSize: `${size[0]}px ${size[1]}px`, backgroundRepeat: "repeat" }}
      initial={{ backgroundPosition: `${offset}px 0px` }}
      animate={{ backgroundPosition: [`${offset}px 0px`, `${offset}px ${size[1]}px`] }}
      transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
    />
  );
}

function Waterfall({ still }) {
  const uid = useRef(Math.random().toString(36).slice(2, 7)).current;
  if (still) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* aliran air tepat di permukaan air terjun */}
      {/* aliran air tepat di permukaan air terjun: dua lapis helai dengan skala & kecepatan berbeda */}
      <div className="absolute inset-0 overflow-hidden" style={FALLS_MASK}>
        <WaterSheet size={[40, 160]} dur={0.9} opacity={0.95} />
        <WaterSheet size={[64, 256]} dur={1.5} opacity={0.6} offset={17} />
        {/* kilau cahaya yang ikut meluncur */}
        <motion.div
          className="absolute inset-x-0 h-[30%] bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.55),transparent)]"
          animate={{ top: ["-30%", "100%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      </div>
      {/* kabut & percikan di kaki air terjun */}
      {FALL_FEET.map(([fx, fy, fw], i) => (
        <React.Fragment key={i}>
          {[0, 1].map((k) => (
            <motion.div
              key={k}
              className="absolute aspect-[2/1] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.85),rgba(240,244,252,0.35)_55%,transparent)] blur-[2px]"
              style={{ left: `${fx + (k ? 1.2 : -1.2)}%`, top: `${fy}%`, width: `${fw}%` }}
              animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.9, 1.25, 0.9], y: [0, -4, 0] }}
              transition={{ duration: 2.6 + k * 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 + k * 0.4 }}
            />
          ))}
          {Array.from({ length: 6 }, (_, j) => (
            <motion.span
              key={`p${j}`}
              className="absolute h-[3px] w-[3px] rounded-full bg-white/90"
              style={{ left: `${fx - fw / 3 + (j * fw) / 9}%`, top: `${fy}%` }}
              animate={{ y: [0, -10 - (j % 3) * 5, 2], x: [0, (j % 2 ? 1 : -1) * 4], opacity: [0, 0.9, 0] }}
              transition={{ duration: 1.4 + (j % 3) * 0.3, repeat: Infinity, delay: j * 0.25 + i * 0.4, ease: "easeOut" }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

/* danau ukiran: garis-garis air bergelombang (displacement SVG) & kilau */
function Lake({ still }) {
  const id = useRef(`rs-wave-${Math.random().toString(36).slice(2, 7)}`).current;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-10%] top-[55%] bottom-[-45%]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(170,186,214,0.5),rgba(190,202,224,0.28)_25%,rgba(236,231,220,0)_55%)]" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.08" numOctaves="2" seed="3">
              {!still && <animate attributeName="baseFrequency" dur="12s" values="0.012 0.08;0.016 0.11;0.012 0.08" repeatCount="indefinite" />}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="3" />
          </filter>
        </defs>
        <g filter={`url(#${id})`} stroke="rgba(52,74,120,0.14)" strokeWidth="0.1" fill="none">
          {Array.from({ length: 10 }, (_, i) => {
            const y = 1 + Math.pow(i / 9, 1.8) * 16;
            return <path key={i} d={`M0 ${y} C 25 ${y - 0.6}, 50 ${y + 0.6}, 75 ${y - 0.4} S 100 ${y + 0.3}, 100 ${y}`} />;
          })}
        </g>
      </svg>
      {!still &&
        Array.from({ length: 9 }, (_, i) => (
          <motion.span
            key={i}
            className="absolute h-[0.6%] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.95),transparent)]"
            style={{ left: `${12 + ((i * 41) % 76)}%`, top: `${3 + ((i * 17) % 22)}%`, width: `${5 + (i % 3) * 4}%` }}
            animate={{ opacity: [0, 0.9, 0], x: ["-20%", "20%"] }}
            transition={{ duration: 2.6 + (i % 4) * 0.6, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          />
        ))}
    </div>
  );
}

function Sprite({ src, style, className = "", mirror, sway = 0, origin = "50% 100%", still, phase = 0 }) {
  const time = useTime();
  const rotate = useTransform(time, (t) => (still || !sway ? 0 : Math.sin(t / 1000 * 0.6 + phase) * sway + Math.sin(t / 1000 * 2.1 + phase) * sway * 0.25));
  return (
    <motion.img
      src={`${ASSET}/${src}.webp`}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pointer-events-none absolute select-none ${className}`}
      style={{ ...style, rotate, scaleX: mirror ? -1 : 1, transformOrigin: origin }}
    />
  );
}

function ToileBackground({ still }) {
  const x = useTransform(tiltX, (v) => -v * 4);
  const y = useTransform(tiltY, (v) => -v * 3);
  return (
    <motion.div className="absolute inset-0" style={{ x, y }}>
      {/* kertas krem dengan serat ukiran halus */}
      <div className="absolute inset-x-0 top-[-20%] bottom-[-45%] bg-[radial-gradient(120%_80%_at_50%_35%,#FBF8F1_0%,#F2EDE2_55%,#E3DDCF_100%)]" />
      <div className="absolute inset-x-0 top-[-20%] bottom-[-45%] opacity-[0.05] [background-image:repeating-linear-gradient(0deg,rgba(60,80,130,0.35)_0px,rgba(60,80,130,0.35)_1px,transparent_1px,transparent_3px)]" />
      {/* langit: awan toile berarak */}
      {CLOUDS.map((c, i) => (
        <motion.div key={i} className="absolute left-0" style={{ top: `${c.top}%`, width: `${c.w}%`, opacity: c.o }}>
          <motion.img
            src={`${ASSET}/${c.src}.webp`}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="block w-full select-none"
            style={{ scaleX: c.mirror ? -1 : 1 }}
            initial={{ x: "-10%" }}
            animate={still ? { x: "20%" } : { x: ["-60%", "150%"] }}
            transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      ))}
      {/* lanskap: istana, jembatan, air terjun, danau */}
      <div className="absolute left-1/2 w-[150%] -translate-x-1/2" style={{ top: "24%" }}>
        <img src={`${ASSET}/landscape.webp`} alt="" aria-hidden="true" draggable={false} className="block w-full select-none" />
        <Waterfall still={still} />
      </div>
      <Lake still={still} />
      {/* pohon besar kiri & cemara kanan membingkai */}
      <Sprite src="tree" still={still} sway={0.6} style={{ left: "-14%", top: "-3%", width: "64%" }} />
      <Sprite src="cypress" still={still} sway={0.4} phase={1.7} style={{ right: "-6%", top: "14%", width: "26%" }} />
      {/* kabut tipis di kaki lanskap */}
      {!still && (
        <motion.div
          className="absolute left-[-30%] top-[50%] h-[9%] w-[160%] bg-[radial-gradient(40%_50%_at_30%_50%,rgba(255,255,255,0.85),transparent_70%),radial-gradient(35%_50%_at_72%_50%,rgba(245,246,250,0.8),transparent_70%)]"
          animate={{ x: ["-5%", "5%", "-5%"], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

/* kilauan bintang kecil yang berkelip di udara */
const SPARKS = Array.from({ length: 18 }, (_, i) => ({ x: (i * 37 + 5) % 96, y: (i * 23 + 7) % 92, s: 4 + (i % 3) * 3, d: 2.2 + (i % 5) * 0.6 }));

function Sparkles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {SPARKS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#FFF3C8] shadow-[0_0_8px_2px_rgba(240,200,110,0.9)]"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }}
          animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.3], y: [0, -14] }}
          transition={{ duration: s.d, repeat: Infinity, delay: i * 0.37, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* panggung latar 9:16 yang selalu menutupi layar */
function Stage({ children, focusY = 0.5 }) {
  const [ref, box] = useStageBox(9 / 16, focusY);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#F1ECE2]">
      {box && (
        <div className="absolute" style={{ width: box.W, height: box.H, left: box.left, top: box.top }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LAPISAN TENGAH — bingkai lengkung emas dengan kilau menyapu
   ============================================================ */

const FRAME_MASK = { WebkitMaskImage: `url(${ASSET}/frame.webp)`, maskImage: `url(${ASSET}/frame.webp)`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };

function GoldFrame({ still, children }) {
  const opacity = useTransform(OPEN.frame, [0, 1], [0, 1]);
  const scale = useTransform(OPEN.frame, (v) => 0.94 + v * 0.06);
  const y = useTransform(OPEN.frame, (v) => (1 - v) * 18);
  return (
    <motion.div className="relative mx-auto aspect-[728/948] w-[min(80vw,350px)]" style={{ opacity, scale, y }}>
      {/* kertas di dalam bingkai: krem tembus pandang agar lanskap samar terlihat */}
      <div className="absolute inset-[8%_9%_7%_9%] rounded-[50%_50%_10%_10%/30%_30%_5%_5%] bg-[radial-gradient(90%_70%_at_50%_40%,rgba(253,251,245,0.94),rgba(247,243,233,0.86))] shadow-[inset_0_0_30px_rgba(176,138,62,0.18)]" />
      <img src={`${ASSET}/frame.webp`} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none drop-shadow-[0_10px_18px_rgba(40,50,80,0.35)]" />
      {!still && (
        <motion.div
          className="absolute inset-0 mix-blend-screen"
          style={{ ...FRAME_MASK, backgroundImage: "linear-gradient(115deg, transparent 38%, rgba(255,250,225,0.95) 49%, rgba(255,236,170,0.6) 52%, transparent 62%)", backgroundSize: "260% 100%" }}
          initial={{ backgroundPosition: "160% 0%" }}
          animate={{ backgroundPosition: ["160% 0%", "-60% 0%"] }}
          transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 6, ease: [0.45, 0, 0.25, 1], delay: 0.8 }}
        />
      )}
      {/* titik kilau di ornamen puncak & dasar bingkai */}
      {!still &&
        [
          [50, 4],
          [50, 96],
          [14, 40],
          [86, 40],
        ].map(([px, py], i) => (
          <motion.span
            key={i}
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white shadow-[0_0_10px_3px_rgba(255,226,150,0.95)]"
            style={{ left: `${px}%`, top: `${py}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 1 + i * 0.9, ease: "easeInOut" }}
          />
        ))}
      <div className="absolute inset-[16%_14%_12%_14%] flex flex-col items-center justify-center text-center">{children}</div>
    </motion.div>
  );
}

/* ============================================================
   LAPISAN DEPAN — rangkaian bunga di sudut bawah
   ============================================================ */

function Blooms({ still }) {
  // meluncur naik dari luar layar dengan sedikit memantul
  const y = useTransform(OPEN.bloom, (v) => `${(1 - v) * 60}%`);
  const opacity = useTransform(OPEN.bloom, [0, 0.4], [0, 1]);
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ y, opacity }}>
      <Sprite src="goldLeaves" still={still} sway={2} phase={0.5} style={{ left: "-6%", bottom: "26%", width: "30%" }} />
      <Sprite src="bouquet" still={still} sway={0.8} style={{ left: "-22%", bottom: "-6%", width: "92%" }} origin="20% 100%" />
      <Sprite src="blueLily" still={still} sway={1.6} phase={2.2} mirror style={{ right: "-4%", bottom: "16%", width: "28%" }} />
      <Sprite src="bouquet" still={still} sway={0.8} phase={1.3} mirror style={{ right: "-26%", bottom: "-9%", width: "86%" }} origin="80% 100%" />
      <Sprite src="navyRose" still={still} sway={1} phase={3.1} style={{ right: "22%", bottom: "-2%", width: "22%" }} />
    </motion.div>
  );
}

/* ============================================================
   COVER
   ============================================================ */

export function RoyalSapphireCover({ t, guestName, onOpen }) {
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  useTiltInput(!reduce);
  const bgScale = useTransform(OPEN.bg, (v) => 1.05 - v * 0.05);

  useEffect(() => {
    Object.values(OPEN).forEach((v) => v.set(0));
  }, []);

  const open = () => {
    if (leaving) return;
    setLeaving(true);
    requestTiltPermission();
    if (reduce) {
      Object.values(OPEN).forEach((v) => v.set(1));
      onOpen();
      return;
    }
    animate(OPEN.bg, 1, { duration: 2.4, ease: [0.3, 0, 0.2, 1] });
    animate(OPEN.frame, 1, { delay: 0.3, duration: 1.6, ease });
    animate(OPEN.bloom, 1, { delay: 0.6, type: "spring", stiffness: 70, damping: 11, mass: 0.9 });
    animate(OPEN.text, 1, { delay: 1.4, duration: 1.4, ease });
    setTimeout(onOpen, 500);
  };

  return (
    <motion.div className={`fixed inset-0 z-[100] flex justify-center overflow-hidden ${tone.coverBg}`} exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}>
      <div className="relative h-full w-full max-w-[440px] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: bgScale }} animate={reduce ? undefined : { scale: [1.05, 1.08, 1.05] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}>
          <Stage>
            <ToileBackground still={!!reduce} />
          </Stage>
        </motion.div>
        <Dust palette={tone.dust} count={14} />
        <Sparkles />
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
   HERO — bingkai emas (×1,0) berisi nama & hitung mundur, bunga depan (×1,5 + blur)
   ============================================================ */

const pad = (n) => String(n).padStart(2, "0");

function Stagger({ i, children, className = "" }) {
  const k = useTransform(OPEN.text, (v) => clamp01(v * 1.6 - i * 0.18));
  const opacity = k;
  const scale = useTransform(k, (v) => 0.92 + v * 0.08);
  const y = useTransform(k, (v) => (1 - v) * 14);
  const filter = useTransform(k, (v) => `blur(${(1 - v) * 6}px)`);
  return (
    <motion.div className={className} style={{ opacity, scale, y, filter }}>
      {children}
    </motion.div>
  );
}

function HeroScene({ data }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollY } = useScroll();
  const smoothY = useSpring(scrollY, { stiffness: 120, damping: 30, mass: 0.4 });
  // bunga depan bergerak lebih cepat (×1,5): +0,5× ke bawah-luar, makin kabur saat menjauh
  const bloomY = useTransform(smoothY, (v) => v * 0.5);
  const bloomBlur = useTransform(smoothY, (v) => `blur(${clamp01(v / 600) * 4}px)`);
  const bloomScale = useTransform(smoothY, (v) => 1 + clamp01(v / 900) * 0.12);
  const first = data.events[0];
  const t = useCountdown(first.start);
  const date = new Date(first.start).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  const countOpacity = useTransform(OPEN.text, [0.6, 1], [0, 1]);

  return (
    <section ref={ref} className="pointer-events-none relative h-[100svh] overflow-hidden">
      <div className="absolute inset-x-0 top-[7svh]">
        <GoldFrame still={!!reduce}>
          <Stagger i={0}>
            <p className={`${FONTS.caps} text-[9px] tracking-[0.42em] ${tone.kicker}`}>THE WEDDING OF</p>
          </Stagger>
          <Stagger i={1} className="mt-3">
            <h1 className={`${FONTS.script} text-[46px] leading-[0.95] ${tone.title}`}>{data.groom.nickname}</h1>
          </Stagger>
          <Stagger i={2}>
            <p className={`${FONTS.body} text-2xl italic ${tone.amp}`}>&amp;</p>
          </Stagger>
          <Stagger i={3}>
            <h1 className={`${FONTS.script} text-[46px] leading-[0.95] ${tone.title}`}>{data.bride.nickname}</h1>
          </Stagger>
          <Stagger i={4} className="mt-3">
            <img src={`${ASSET}/scrollMid.webp`} alt="" aria-hidden="true" className="mx-auto w-[62%] opacity-90" />
            <p className={`mt-2 ${FONTS.body} text-[15px] italic ${tone.body}`}>{date}</p>
          </Stagger>
        </GoldFrame>
        <motion.div style={{ opacity: countOpacity }} className={`mx-auto mt-3 grid w-[min(72vw,300px)] grid-cols-4 gap-1 rounded-[18px] border px-3 py-2 backdrop-blur-md ${tone.panel}`}>
          {Object.entries(t).map(([k, v]) => (
            <div key={k} className="text-center">
              <p className={`${FONTS.body} text-[24px] font-medium leading-none ${tone.count}`}>{pad(v)}</p>
              <p className={`mt-1 ${FONTS.caps} text-[7px] tracking-[0.2em] ${tone.countLabel}`}>{k.toUpperCase()}</p>
            </div>
          ))}
        </motion.div>
      </div>
      <motion.div className="absolute inset-0" style={{ y: bloomY, filter: bloomBlur, scale: bloomScale, transformOrigin: "50% 100%" }}>
        <Blooms still={!!reduce} />
      </motion.div>
    </section>
  );
}

/* ============================================================
   LATAR TETAP — lanskap bergerak lambat (×0,2), debu emas, selubung krem setelah hero
   ============================================================ */

function Backdrop() {
  const reduce = useReducedMotion();
  useTiltInput(!reduce);
  const { scrollY } = useScroll();
  const vh = useRef(typeof window === "undefined" ? 800 : window.innerHeight);
  useEffect(() => {
    const r = () => (vh.current = window.innerHeight);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);
  // ×0,2 — lanskap naik pelan (paling jauh 40% layar; kertas & danau sudah diperpanjang ke bawah)
  const y = useTransform(scrollY, (v) => -Math.min(v * 0.2, vh.current * 0.4));
  const bgScale = useTransform(OPEN.bg, (v) => 1.05 - v * 0.05);
  const wash = useTransform(scrollY, (v) => clamp01((v - vh.current * 0.6) / vh.current) * tone.washMax);
  return (
    <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden" aria-hidden="true">
      <motion.div className="absolute inset-0" style={{ y, scale: bgScale }}>
        <Stage>
          <ToileBackground still={!!reduce} />
        </Stage>
      </motion.div>
      <motion.div style={{ opacity: wash }} className={`absolute inset-0 ${tone.wash}`} />
      {!reduce && (
        <>
          <Dust palette={tone.dust} count={16} />
          <Sparkles />
        </>
      )}
    </div>
  );
}

/* ornamen emas di kepala tiap section + garis & pendar tone */
function SectionDecor() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <img src={`${ASSET}/scrollTop.webp`} alt="" className="absolute left-1/2 top-3 w-[46%] max-w-[200px] -translate-x-1/2 opacity-80" />
      <div
        className="absolute left-1/2 top-[18%] h-[50%] w-[120%] -translate-x-1/2 rounded-full"
        style={{ background: `radial-gradient(closest-side, ${tone.glow}, transparent)` }}
      />
    </div>
  );
}

function GlobalDecor() {
  return <Petals palette={tone.petals} fixed count={10} />;
}

export const royalSapphireDecor = { Backdrop, HeroScene, Section: SectionDecor, Global: GlobalDecor, skipOpening: true };

/* thumbnail katalog: lukisan komposisi desainer (lanskap + bingkai + bunga) */
export function RoyalSapphireThumb() {
  return <img src={`${ASSET}/poster.webp`} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />;
}
