import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { CATEGORY_LABEL, TEMPLATES, TIERS, TemplateCover, demoUrl, tierOf } from "./catalog.jsx";
import {
  ArrowRight,
  BookOpen,
  Box,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Crown,
  Eye,
  Globe,
  Hand,
  Heart,
  Instagram,
  Layers,
  MapPin,
  Menu,
  Mic,
  Music2,
  Navigation,
  Pause,
  PenTool,
  Play,
  Quote,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";

/* ============================================================
   KONFIGURASI
   ============================================================ */

const WA_NUMBER = "6281234567890"; // ganti dengan nomor WhatsApp admin Momenlabs
const waLink = (text) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const EVENT_DATE = new Date("2026-12-12T09:00:00+07:00");
const GCAL_LINK =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent("Pernikahan Nadia & Arga") +
  "&dates=20261212T020000Z/20261212T060000Z" +
  "&location=" + encodeURIComponent("The Glasshouse, Jakarta");
const MAPS_LINK = "https://maps.google.com/?q=The+Glasshouse+Jakarta";

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Template", href: "#template" },
  { label: "Harga", href: "#harga" },
  { label: "Game Interaktif", href: "#game" },
  { label: "Testimoni", href: "#testimoni" },
  { label: "FAQ", href: "#faq" },
];

const ease = [0.22, 1, 0.36, 1];

/* ============================================================
   UTIL
   ============================================================ */

function useCountdown(target) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      hari: Math.floor(diff / 86400000),
      jam: Math.floor((diff / 3600000) % 24),
      menit: Math.floor((diff / 60000) % 60),
      detik: Math.floor((diff / 1000) % 60),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const pad = (n) => String(n).padStart(2, "0");

function Reveal({ children, delay = 0, y = 28, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ kicker, title, desc, dark = false, align = "center" }) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <Reveal>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            dark
              ? "border-white/15 bg-white/5 text-rose-soft"
              : "border-rose-brand/20 bg-rose-brand/5 text-rose-brand"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {kicker}
        </span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2
          className={`mt-5 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl ${
            dark ? "text-ivory" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {desc && (
        <Reveal delay={0.16}>
          <p className={`mt-5 text-base leading-relaxed sm:text-lg ${dark ? "text-white/60" : "text-ink-mute"}`}>
            {desc}
          </p>
        </Reveal>
      )}
    </div>
  );
}

function WhatsAppIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.38 9.38 0 0 1-1.44-5c0-5.19 4.23-9.42 9.43-9.42 2.52 0 4.88.98 6.66 2.76a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.42 9.42zm8.02-17.44A11.27 11.27 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.52 5.66L.62 23.25l5.64-1.48a11.3 11.3 0 0 0 5.78 1.48h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.31-8z" />
    </svg>
  );
}

function Logo({ className = "h-10 sm:h-11" }) {
  return (
    <a href="#top" className="group flex items-center" aria-label="MomenLabs — kembali ke atas">
      <img
        src="/brand/logo.png"
        alt="MomenLabs"
        draggable={false}
        className={`w-auto select-none transition duration-500 group-hover:brightness-125 ${className}`}
      />
    </a>
  );
}

/* ============================================================
   NAVBAR
   ============================================================ */

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6">
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-5 ${
          scrolled
            ? "border border-ink/5 bg-cream/80 shadow-soft backdrop-blur-xl"
            : "border border-transparent bg-transparent"
        }`}
      >
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-ink/5 hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href={waLink("Halo Momenlabs, saya mau buat undangan digital!")}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-full bg-foil px-5 py-2.5 text-sm font-semibold text-noir transition hover:brightness-110"
          >
            Buat Undangan
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="grid h-10 w-10 place-items-center rounded-xl bg-foil text-noir md:hidden"
          aria-label="Buka menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.3, ease }}
            className="mx-auto mt-2 max-w-6xl rounded-2xl border border-ink/5 bg-cream/95 p-3 shadow-soft backdrop-blur-xl md:hidden"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-base font-medium text-ink/80 hover:bg-ink/5"
              >
                {l.label}
              </a>
            ))}
            <a
              href={waLink("Halo Momenlabs, saya mau buat undangan digital!")}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-foil px-4 py-3 font-semibold text-noir"
            >
              Buat Undangan <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ============================================================
   PHONE FRAME + STORY MODE (HERO)
   ============================================================ */

function PhoneFrame({ children, className = "" }) {
  return (
    <div
      className={`relative aspect-[9/19] w-[260px] rounded-[46px] bg-[#1C1916] p-[10px] shadow-phone ring-1 ring-gold/30 sm:w-[290px] ${className}`}
    >
      <div className="absolute -left-[3px] top-28 h-14 w-[3px] rounded-l bg-[#2A2620]" />
      <div className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r bg-[#2A2620]" />
      <div className="relative h-full w-full overflow-hidden rounded-[37px] bg-cream">
        <div className="absolute left-1/2 top-2.5 z-40 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}

function ArchPortrait({ initial, from, to, className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-t-full border border-white/40 ${className}`}
      style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
    >
      <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay" />
      <svg viewBox="0 0 100 130" className="absolute inset-x-0 bottom-0 w-full opacity-30" aria-hidden="true">
        <circle cx="50" cy="52" r="20" fill="white" />
        <path d="M12 130 C 14 92, 30 80, 50 80 C 70 80, 86 92, 88 130 Z" fill="white" />
      </svg>
      <span className="absolute inset-x-0 bottom-3 text-center font-display text-3xl italic text-white drop-shadow">
        {initial}
      </span>
    </div>
  );
}

function StoryCover({ guestName }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#2A2318_0%,#141215_55%,#0B0A0C_100%)] px-6 pt-12 text-center text-ivory">
      <div className="absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-rose-brand/40 blur-3xl" />
      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-violet-brand/40 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
        className="relative"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-soft/80">The Wedding of</p>
        <h3 className="mt-3 font-script text-[54px] leading-none text-ivory">Nadia</h3>
        <p className="my-1 font-display text-2xl italic text-peach">&amp;</p>
        <h3 className="font-script text-[54px] leading-none text-ivory">Arga</h3>
        <div className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-transparent via-peach to-transparent" />
        <p className="mt-4 text-xs tracking-[0.3em] text-white/70">12 · 12 · 2026</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease }}
        className="relative mt-8 w-full rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur"
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Kepada Yth.</p>
        <p className="mt-1 truncate text-sm font-semibold text-ivory">{guestName || "Bapak/Ibu/Saudara/i"}</p>
        <p className="mt-0.5 text-[10px] text-white/40">di Tempat</p>
      </motion.div>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative mt-5 flex items-center gap-1.5 rounded-full bg-cream px-5 py-2.5 text-xs font-bold text-ink"
      >
        <Heart className="h-3.5 w-3.5 fill-rose-brand text-rose-brand" /> Buka Undangan
      </motion.div>
    </div>
  );
}

function StoryCouple() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-cream px-5 text-center">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-rose-soft/50 to-transparent" />
      <p className="relative text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-brand">Mempelai</p>
      <p className="relative mt-2 px-2 font-display text-[13px] italic leading-snug text-ink-mute">
        “Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan untukmu…”
      </p>
      <div className="relative mt-5 flex w-full gap-3">
        {[
          { n: "Nadia Putri", i: "N", p: "Putri dari Bpk. Hendra & Ibu Sari", f: "#E9D29A", t: "#C9A45C" },
          { n: "Arga Mahendra", i: "A", p: "Putra dari Bpk. Rudi & Ibu Wati", f: "#B08A4A", t: "#8C6A2F" },
        ].map((c, idx) => (
          <motion.div
            key={c.n}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: idx * 0.15, ease }}
            className="flex-1"
          >
            <ArchPortrait initial={c.i} from={c.f} to={c.t} className="aspect-[3/4] w-full" />
            <p className="mt-2.5 font-display text-lg leading-tight text-ink">{c.n}</p>
            <p className="mt-1 text-[9.5px] leading-snug text-ink-mute">{c.p}</p>
            <p className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-semibold text-rose-brand">
              <Instagram className="h-2.5 w-2.5" /> @{c.n.split(" ")[0].toLowerCase()}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StoryDate() {
  const t = useCountdown(EVENT_DATE);
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1A1714] via-cream to-[#141215] px-5 text-center">
      <div className="absolute -right-16 top-16 h-44 w-44 rounded-full border border-rose-brand/20" />
      <div className="absolute -left-10 bottom-24 h-28 w-28 rounded-full border border-violet-brand/20" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-brand">Save The Date</p>
      <div className="mt-3 flex items-end gap-2 font-display text-ink">
        <span className="text-6xl leading-none">12</span>
        <div className="mb-1 text-left text-xs leading-tight">
          <p className="font-sans font-bold uppercase tracking-widest">Desember</p>
          <p className="font-sans text-ink-mute">Sabtu, 2026</p>
        </div>
      </div>
      <div className="mt-5 grid w-full grid-cols-4 gap-1.5">
        {Object.entries(t).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-paper/80 py-2 shadow-sm ring-1 ring-ink/5">
            <p className="font-display text-xl leading-none text-ink">{pad(v)}</p>
            <p className="mt-1 text-[8px] font-semibold uppercase tracking-wider text-ink-mute">{k}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 w-full space-y-2 text-left">
        {[
          { e: "Akad Nikah", j: "09.00 – 10.00 WIB" },
          { e: "Resepsi", j: "11.00 – 14.00 WIB" },
        ].map((a) => (
          <div key={a.e} className="flex items-center justify-between rounded-xl bg-paper px-3.5 py-2.5 text-ink">
            <span className="text-xs font-semibold">{a.e}</span>
            <span className="flex items-center gap-1 text-[10px] text-white/60">
              <Clock className="h-3 w-3" /> {a.j}
            </span>
          </div>
        ))}
      </div>
      <a
        href={GCAL_LINK}
        target="_blank"
        rel="noreferrer"
        className="relative z-20 mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-brand px-4 py-2 text-[11px] font-bold text-noir shadow-glow"
      >
        <CalendarDays className="h-3.5 w-3.5" /> Simpan ke Google Calendar
      </a>
    </div>
  );
}

function MiniMap({ className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-[#1A1815] ${className}`}>
      <svg viewBox="0 0 300 200" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="300" height="200" fill="#1A1815" />
        <path d="M0 140 C 60 120, 90 160, 160 130 S 260 90, 300 110 L300 200 L0 200Z" fill="#1E2219" />
        <circle cx="240" cy="40" r="34" fill="#1E2219" />
        <path d="M-10 60 L 310 95" stroke="#2F2B25" strokeWidth="14" />
        <path d="M120 -10 L 150 210" stroke="#2F2B25" strokeWidth="10" />
        <path d="M-10 170 C 80 150, 200 190, 310 160" stroke="#2F2B25" strokeWidth="7" />
        <path d="M210 -10 L 190 210" stroke="#2F2B25" strokeWidth="6" />
        <path d="M-10 60 L 310 95" stroke="#8C6A2F" strokeWidth="3" />
        <path d="M60 30 L 140 82 L 150 120" stroke="#C9A45C" strokeWidth="3.5" strokeDasharray="6 5" fill="none" strokeLinecap="round" />
        <rect x="20" y="105" width="40" height="22" rx="4" fill="#25221D" />
        <rect x="165" y="125" width="30" height="40" rx="4" fill="#25221D" />
        <rect x="225" y="105" width="50" height="28" rx="4" fill="#25221D" />
      </svg>
      <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-full">
        <span className="absolute left-1/2 top-full h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-rose-brand/40" />
        <MapPin className="relative h-8 w-8 fill-rose-brand text-white drop-shadow-lg" />
      </div>
    </div>
  );
}

function StoryLocation() {
  return (
    <div className="relative flex h-full flex-col bg-cream">
      <MiniMap className="h-[55%] w-full" />
      <div className="relative -mt-6 flex flex-1 flex-col rounded-t-[28px] bg-cream px-5 pt-5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-brand">Lokasi Acara</p>
        <h4 className="mt-2 font-display text-2xl leading-tight text-ink">The Glasshouse</h4>
        <p className="mt-1 text-[11px] leading-snug text-ink-mute">Jl. Kemang Raya No. 8, Jakarta Selatan</p>
        <div className="mt-3 flex justify-center gap-4 text-[10px] text-ink-mute">
          <span className="flex items-center gap-1"><Navigation className="h-3 w-3" /> 4,2 km</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 14 mnt</span>
        </div>
        <a
          href={MAPS_LINK}
          target="_blank"
          rel="noreferrer"
          className="relative z-20 mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-foil px-4 py-2 text-[11px] font-bold text-noir"
        >
          <MapPin className="h-3.5 w-3.5" /> Buka Google Maps
        </a>
      </div>
    </div>
  );
}

function Waveform({ bars = 28, playing = false, progress = 0, light = false, className = "h-8" }) {
  const heights = useRef(
    Array.from({ length: bars }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * 0.55) + (i % 3) * 0.08)
  ).current;
  return (
    <div className={`flex items-center gap-[2px] ${className}`}>
      {heights.map((h, i) => {
        const active = i / bars <= progress;
        return (
          <motion.span
            key={i}
            className={`w-[3px] flex-shrink-0 rounded-full ${
              active ? "bg-rose-brand" : light ? "bg-white/25" : "bg-ink/15"
            }`}
            animate={
              playing
                ? { height: [`${h * 100}%`, `${Math.min(1, h + 0.35) * 100}%`, `${h * 100}%`] }
                : { height: `${h * 100}%` }
            }
            transition={playing ? { duration: 0.6 + (i % 4) * 0.12, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
          />
        );
      })}
    </div>
  );
}

function StoryWishes() {
  const wishes = [
    { n: "Tante Rina", d: "0:12", c: "#C9A45C" },
    { n: "Dimas & Sasa", d: "0:15", c: "#8C6A2F" },
    { n: "Pak Joko", d: "0:09", c: "#C9A45C" },
  ];
  return (
    <div className="relative flex h-full flex-col bg-[linear-gradient(180deg,#141215_0%,#1A1714_100%)] px-4 pb-6 pt-14 text-ivory">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-soft">Voice Wishes</p>
      <h4 className="mt-1.5 text-center font-display text-2xl">Doa dalam Suara</h4>
      <div className="mt-5 space-y-2.5">
        {wishes.map((w, i) => (
          <motion.div
            key={w.n}
            initial={{ opacity: 0, x: i % 2 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: i * 0.15, ease }}
            className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-2.5"
          >
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold" style={{ background: w.c }}>
              {w.n[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold">{w.n}</p>
              <Waveform bars={20} light playing={i === 0} progress={i === 0 ? 0.45 : 0} className="mt-1 h-4" />
            </div>
            <span className="text-[9px] text-white/50">{w.d}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-auto flex flex-col items-center">
        <div className="relative">
          <span className="absolute inset-0 animate-ping rounded-full bg-rose-brand/40" />
          <span className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-rose-brand to-peach shadow-glow">
            <Mic className="h-6 w-6 text-white" />
          </span>
        </div>
        <p className="mt-2.5 text-[10px] text-white/60">Tahan untuk rekam · maks 15 detik</p>
      </div>
    </div>
  );
}

const STORY_SLIDES = [
  { key: "cover", label: "Cover" },
  { key: "couple", label: "Mempelai" },
  { key: "date", label: "Acara" },
  { key: "location", label: "Lokasi" },
  { key: "wishes", label: "Ucapan" },
];

function StoryPhone({ guestName }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const DURATION = 4800;

  useEffect(() => {
    if (paused) return;
    let raf;
    const start = performance.now() - progress * DURATION;
    const tick = (now) => {
      const p = Math.min((now - start) / DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        setIndex((i) => (i + 1) % STORY_SLIDES.length);
        setProgress(0);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused]);

  const go = (dir) => {
    setIndex((i) => (i + dir + STORY_SLIDES.length) % STORY_SLIDES.length);
    setProgress(0);
  };

  const handleTap = (e) => {
    if (e.target.closest("a,button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    go(e.clientX - rect.left < rect.width * 0.33 ? -1 : 1);
  };

  const slide = STORY_SLIDES[index].key;

  return (
    <PhoneFrame>
      <div
        className="relative h-full w-full cursor-pointer select-none"
        onClick={handleTap}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {/* progress bar ala Instagram Story */}
        <div className="absolute inset-x-3 top-11 z-30 flex gap-1">
          {STORY_SLIDES.map((s, i) => (
            <div key={s.key} className="h-[3px] flex-1 overflow-hidden rounded-full bg-black/15 backdrop-blur">
              <div
                className="h-full rounded-full bg-white shadow"
                style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-3 top-[52px] z-30 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-rose-brand to-violet-brand text-[9px] font-bold text-noir ring-2 ring-white/70">
              N&A
            </span>
            <span className={`text-[10px] font-semibold drop-shadow ${slide === "cover" || slide === "wishes" ? "text-white" : "text-ink"}`}>
              nadia.arga · {STORY_SLIDES[index].label}
            </span>
          </div>
          <Music2 className={`h-3.5 w-3.5 ${slide === "cover" || slide === "wishes" ? "text-white" : "text-ink"}`} />
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={slide}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease }}
          >
            {slide === "cover" && <StoryCover guestName={guestName} />}
            {slide === "couple" && <StoryCouple />}
            {slide === "date" && <StoryDate />}
            {slide === "location" && <StoryLocation />}
            {slide === "wishes" && <StoryWishes />}
          </motion.div>
        </AnimatePresence>
      </div>
    </PhoneFrame>
  );
}

/* ============================================================
   HERO
   ============================================================ */

function Hero() {
  const [guestName, setGuestName] = useState("");

  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-28 sm:pt-32 lg:pb-28 lg:pt-36">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute -right-40 top-20 h-[480px] w-[480px] rounded-full bg-gold-deep/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-peach/5 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,164,92,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(201,164,92,0.07) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        {/* copy */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper/70 py-1 pl-1 pr-4 text-xs font-semibold text-ink shadow-sm backdrop-blur"
          >
            <span className="rounded-full bg-foil px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-noir">Baru</span>
            Interactive &amp; Parallax Digital Invitation
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.08, ease }}
            className="mt-6 font-display text-[44px] leading-[0.98] tracking-tight text-ink sm:text-6xl lg:text-[76px]"
          >
            Undangan yang tak hanya dibaca, tapi <span className="italic text-gradient">dirasakan.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.16, ease }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-mute sm:text-lg lg:mx-0"
          >
            Momenlabs mengubah undangan pernikahanmu jadi pengalaman interaktif: tap-tap ala Instagram Story,
            ucapan lewat pesan suara, hingga efek parallax sinematik yang membuat setiap lapisan undangan terasa hidup. Tamu tidak hanya datang, mereka ikut terkesan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.24, ease }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <a
              href="#template"
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-foil px-7 py-4 text-sm font-semibold text-noir shadow-soft transition hover:shadow-glow sm:w-auto"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-rose-brand via-peach to-violet-brand opacity-90 transition-transform duration-700 group-hover:translate-x-0" />
              <Layers className="relative h-4 w-4" />
              <span className="relative">Pilih Template</span>
            </a>
            <a
              href={waLink("Halo Momenlabs, saya mau buat undangan digital!")}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-paper/70 px-7 py-4 text-sm font-semibold text-ink backdrop-blur transition hover:border-ink/30 hover:bg-paper sm:w-auto"
            >
              Buat Undangan
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
          </motion.div>

          {/* personalisasi nama tamu */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.32, ease }}
            className="mx-auto mt-8 max-w-md lg:mx-0"
          >
            <label htmlFor="guest" className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-mute">
              Coba sekarang · ketik namamu
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-ink/10 bg-paper/80 p-1.5 shadow-sm backdrop-blur focus-within:border-rose-brand/50 focus-within:ring-4 focus-within:ring-rose-brand/10">
              <Users className="ml-2.5 h-4 w-4 flex-shrink-0 text-ink-mute" />
              <input
                id="guest"
                value={guestName}
                maxLength={32}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="mis. Kak Rizky & Partner"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink/35"
              />
              <span className="hidden rounded-xl bg-rose-brand/10 px-3 py-2 text-[11px] font-semibold text-rose-brand sm:block">
                Live di HP →
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.45 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:justify-start"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {["#C9A45C", "#8C6A2F", "#E9D29A", "#B08A4A"].map((c, i) => (
                  <span
                    key={c}
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-cream text-xs font-bold text-white"
                    style={{ background: c }}
                  >
                    {["R", "D", "S", "A"][i]}
                  </span>
                ))}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-ink">2.400+ pasangan</p>
                <p className="text-xs text-ink-mute">sudah sebar undangan</p>
              </div>
            </div>
            <div className="h-8 w-px bg-ink/10" />
            <div className="text-left">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
                <span className="ml-1.5 text-sm font-bold text-ink">4.9</span>
              </div>
              <p className="text-xs text-ink-mute">rating dari klien</p>
            </div>
          </motion.div>
        </div>

        {/* mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease }}
          className="relative mx-auto"
        >
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/5" />
          <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-ink/5" />

          <StoryPhone guestName={guestName} />

          {/* floating chips */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-28 top-24 hidden items-center gap-3 rounded-2xl border border-gold/20 bg-paper/90 p-3 pr-4 shadow-soft backdrop-blur sm:flex"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-brand/10">
              <Mic className="h-5 w-5 text-rose-brand" />
            </span>
            <div>
              <p className="text-xs font-bold text-ink">Pesan suara baru</p>
              <Waveform bars={16} playing progress={0.6} className="mt-1 h-4" />
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -right-24 top-1/2 hidden items-center gap-2.5 rounded-2xl border border-gold/20 bg-paper/90 p-3 pr-4 shadow-soft backdrop-blur sm:flex"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10">
              <Check className="h-5 w-5 text-emerald-600" />
            </span>
            <div>
              <p className="text-xs font-bold text-ink">RSVP: Hadir</p>
              <p className="text-[11px] text-ink-mute">+128 tamu konfirmasi</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 4, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-16 bottom-16 hidden items-center gap-2 rounded-full bg-foil px-4 py-2.5 text-xs font-semibold text-noir shadow-soft sm:flex"
          >
            <Hand className="h-4 w-4 text-peach" /> Tap-tap story mode
          </motion.div>

          <p className="mt-6 text-center text-xs text-ink-mute">
            <span className="font-semibold text-ink">Tap kanan/kiri</span> untuk pindah slide · tahan untuk jeda
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   MARQUEE
   ============================================================ */

function Marquee() {
  const items = [
    "Story Mode",
    "Voice Note Wishes",
    "Cinematic Parallax",
    "Google Calendar",
    "Google Maps",
    "Unlimited Nama Tamu",
    "Musik Latar",
    "RSVP Real-time",
    "Amplop Digital",
    "Template Adat Nusantara",
  ];
  return (
    <div className="relative overflow-hidden border-y border-ink/5 bg-paper/50 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-cream to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-cream to-transparent" />
      <div className="flex w-max animate-marquee gap-10">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap font-display text-2xl italic text-ink/70 sm:text-3xl">
            {t}
            <Sparkles className="h-4 w-4 text-rose-brand" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   FEATURES (BENTO)
   ============================================================ */

function FeatureCard({ icon: Icon, tag, title, desc, children, className = "", delay = 0 }) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-6 transition duration-500 hover:border-white/20 hover:bg-white/[0.06] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rose-brand/20 opacity-0 blur-3xl transition duration-700 group-hover:opacity-100" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-rose-brand/90 to-violet-brand/90 shadow-glow">
            <Icon className="h-5 w-5 text-white" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">{tag}</span>
        </div>
        <h3 className="relative mt-5 font-display text-3xl leading-tight text-ivory sm:text-[34px]">{title}</h3>
        <p className="relative mt-3 max-w-md text-sm leading-relaxed text-white/60 sm:text-[15px]">{desc}</p>
        <div className="relative mt-8 flex flex-1 items-end">{children}</div>
      </div>
    </Reveal>
  );
}

function StoryDemoVisual() {
  const cards = [
    { t: "The Wedding of", s: "Nadia & Arga", g: "from-[#2A2318] to-[#C9A45C]" },
    { t: "Save the Date", s: "12 · 12 · 2026", g: "from-[#E9D29A] to-[#C9A45C]" },
    { t: "Our Story", s: "Sejak 2019", g: "from-[#8C6A2F] to-[#2A2318]" },
    { t: "Kirim Doa", s: "Voice Wishes", g: "from-[#C9A45C] to-[#7A4B2A]" },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % cards.length), 2200);
    return () => clearInterval(id);
  }, [cards.length]);

  return (
    <div className="flex w-full items-end justify-center gap-3 sm:gap-4">
      {[-1, 0, 1].map((offset) => {
        const idx = (i + offset + cards.length) % cards.length;
        const c = cards[idx];
        const center = offset === 0;
        return (
          <motion.div
            key={offset}
            layout
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.g} ${
              center ? "h-56 w-32 sm:h-64 sm:w-36" : "h-44 w-24 opacity-50 sm:h-52 sm:w-28"
            }`}
            transition={{ duration: 0.6, ease }}
          >
            <div className="absolute inset-x-2 top-2 flex gap-1">
              {cards.map((_, k) => (
                <span key={k} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/30">
                  {center && (
                    <motion.span
                      key={`${i}-${k}`}
                      className="block h-full bg-white"
                      initial={{ width: k < idx ? "100%" : "0%" }}
                      animate={{ width: k <= idx ? "100%" : "0%" }}
                      transition={{ duration: k === idx ? 2.2 : 0, ease: "linear" }}
                    />
                  )}
                </span>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={c.s}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-x-0 bottom-4 px-3 text-center"
              >
                <p className="text-[8px] uppercase tracking-[0.25em] text-white/70">{c.t}</p>
                <p className={`mt-1 font-display italic text-white ${center ? "text-xl" : "text-sm"}`}>{c.s}</p>
              </motion.div>
            </AnimatePresence>
            {center && (
              <motion.span
                className="absolute right-3 top-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/25 backdrop-blur"
                animate={{ scale: [1, 0.85, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2.2, repeat: Infinity }}
              >
                <Hand className="h-4 w-4 text-white" />
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function VoicePlayer() {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const LIMIT = 15;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        if (e + 0.1 >= LIMIT) {
          setPlaying(false);
          return 0;
        }
        return e + 0.1;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 sm:gap-4 sm:p-4">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-brand to-peach text-noir shadow-glow transition active:scale-95"
          aria-label={playing ? "Jeda pesan suara" : "Putar pesan suara"}
        >
          {playing ? <Pause className="h-5 w-5 fill-white" /> : <Play className="ml-0.5 h-5 w-5 fill-white" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="truncate text-sm font-semibold text-ivory">Om Bambang &amp; Keluarga</p>
            <span className="ml-2 text-xs tabular-nums text-white/50">
              0:{pad(Math.floor(elapsed))} / 0:{LIMIT}
            </span>
          </div>
          <Waveform bars={34} light playing={playing} progress={elapsed / LIMIT} className="mt-2 h-7 overflow-hidden" />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 p-3">
        <span className="relative grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-white/10">
          <Mic className="h-4 w-4 text-rose-soft" />
        </span>
        <div className="flex-1">
          <p className="text-xs font-semibold text-ivory">Tahan untuk merekam</p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-brand to-peach"
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
        <span className="text-[11px] font-semibold text-white/50">15s</span>
      </div>
    </div>
  );
}

function CalendarMapVisual() {
  const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const offset = 1; // 1 Desember 2026 jatuh pada hari Selasa
  const cells = [...Array(offset).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)];
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <div className="rounded-2xl bg-cream p-4 text-ink">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">Desember 2026</p>
          <CalendarDays className="h-4 w-4 text-rose-brand" />
        </div>
        <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-[10px]">
          {days.map((d) => (
            <span key={d} className="font-semibold text-ink-mute">{d[0]}</span>
          ))}
          {cells.map((d, i) => (
            <span
              key={i}
              className={`mx-auto grid h-6 w-6 place-items-center rounded-full ${
                d === 12 ? "bg-rose-brand font-bold text-noir shadow-glow" : d ? "text-ink/70" : ""
              }`}
            >
              {d}
            </span>
          ))}
        </div>
        <a
          href={GCAL_LINK}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-foil py-2 text-[11px] font-semibold text-noir"
        >
          <CalendarDays className="h-3.5 w-3.5" /> Add to Google Calendar
        </a>
      </div>
      <div className="flex flex-col overflow-hidden rounded-2xl bg-cream">
        <MiniMap className="min-h-[150px] flex-1" />
        <a
          href={MAPS_LINK}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-4 py-3 text-ink"
        >
          <span>
            <span className="block text-xs font-bold">The Glasshouse</span>
            <span className="block text-[10px] text-ink-mute">Navigasi langsung ke lokasi</span>
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-brand text-noir">
            <Navigation className="h-3.5 w-3.5" />
          </span>
        </a>
      </div>
    </div>
  );
}

function LeafCluster({ className = "", flip = false }) {
  return (
    <svg viewBox="0 0 200 200" className={`${className} ${flip ? "-scale-x-100" : ""}`} aria-hidden="true">
      <defs>
        <linearGradient id="leafGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3A2F1E" />
          <stop offset="100%" stopColor="#0E0C0A" />
        </linearGradient>
      </defs>
      {[
        { r: -35, s: 1, x: 10, y: 120 },
        { r: -5, s: 0.85, x: 40, y: 110 },
        { r: 25, s: 0.7, x: 70, y: 125 },
        { r: -60, s: 0.75, x: 0, y: 150 },
      ].map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}>
          <path d="M0 0 C 20 -60, 70 -100, 120 -110 C 100 -60, 60 -20, 0 0Z" fill="url(#leafGold)" stroke="#C9A45C" strokeOpacity="0.45" strokeWidth="1" />
          <path d="M0 0 C 40 -45, 80 -85, 120 -110" fill="none" stroke="#C9A45C" strokeOpacity="0.35" strokeWidth="0.8" />
        </g>
      ))}
    </svg>
  );
}

const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 37) % 100,
  y: (i * 53) % 60,
  s: 1 + (i % 3),
  d: 2 + (i % 5),
}));

function useParallaxLayer(depth, scroll, mx, my, k) {
  const y = useTransform([scroll, my, k], ([p, m, i]) => ((0.5 - p) * depth * 1.6 + m * depth * 0.3) * i);
  const x = useTransform([mx, k], ([m, i]) => m * depth * 0.3 * i);
  return { x, y };
}

function ParallaxDemo() {
  const ref = useRef(null);
  const [mode, setMode] = useState("luxury");
  const lux = mode === "luxury";

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  // intensitas: Premium = parallax halus, Luxury = sinematik
  const intensity = useMotionValue(1);
  useEffect(() => {
    const c = animate(intensity, lux ? 1 : 0.35, { duration: 0.8, ease });
    return () => c.stop();
  }, [lux, intensity]);

  const sky = useParallaxLayer(12, scrollYProgress, sx, sy, intensity);
  const moon = useParallaxLayer(24, scrollYProgress, sx, sy, intensity);
  const gate = useParallaxLayer(45, scrollYProgress, sx, sy, intensity);
  const text = useParallaxLayer(70, scrollYProgress, sx, sy, intensity);
  const mid = useParallaxLayer(100, scrollYProgress, sx, sy, intensity);
  const front = useParallaxLayer(110, scrollYProgress, sx, sy, intensity);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * -2);
    py.set(((e.clientY - r.top) / r.height - 0.5) * -2);
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-center">
        <div className="flex gap-1 rounded-full border border-white/10 bg-black/30 p-1">
          {[
            { id: "premium", l: "Premium · halus" },
            { id: "luxury", l: "Luxury · sinematik" },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => setMode(o.id)}
              className={`relative rounded-full px-4 py-2 text-[11px] font-semibold transition ${mode === o.id ? "text-noir" : "text-white/60"}`}
            >
              {mode === o.id && <motion.span layoutId="parallax-mode" className="absolute inset-0 rounded-full bg-foil" />}
              <span className="relative">{o.l}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => {
          px.set(0);
          py.set(0);
        }}
        className="relative mx-auto h-[360px] w-full max-w-md overflow-hidden rounded-[26px] border border-gold/25 bg-[radial-gradient(90%_70%_at_50%_0%,#2A2216_0%,#0E0C0B_60%,#070607_100%)]"
      >
        {/* langit & bintang */}
        <motion.div style={sky} className="absolute -inset-10">
          {STARS.map((s, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-gold-light"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }}
              animate={{ opacity: [0.2, 0.9, 0.2] }}
              transition={{ duration: s.d, repeat: Infinity, delay: i * 0.13 }}
            />
          ))}
        </motion.div>

        {/* bulan */}
        <motion.div style={moon} className="absolute right-[14%] top-[10%]">
          <div className="h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,#F6E7B8,#C9A45C_60%,#8C6A2F)] shadow-[0_0_60px_10px_rgba(201,164,92,0.35)]" />
        </motion.div>

        {/* cahaya sinematik (Luxury) */}
        <AnimatePresence>
          {lux && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute -inset-1/2"
            >
              <motion.div
                className="h-full w-full bg-[conic-gradient(from_200deg_at_70%_20%,transparent_0deg,rgba(233,210,154,0.12)_20deg,transparent_40deg,rgba(233,210,154,0.08)_70deg,transparent_95deg)]"
                animate={{ rotate: [0, 8, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* gerbang / gapura */}
        <motion.div style={gate} className="absolute inset-x-0 top-[6%] flex justify-center">
          <svg viewBox="0 0 200 240" className="h-[300px] text-gold" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M20 240 V 100 C 20 50, 60 18, 100 8 C 140 18, 180 50, 180 100 V 240" strokeWidth="1.2" strokeOpacity="0.6" />
            <path d="M34 240 V 104 C 34 62, 66 34, 100 24 C 134 34, 166 62, 166 104 V 240" strokeWidth="0.8" strokeOpacity="0.35" />
            <path d="M100 8 L 106 20 L 100 32 L 94 20Z" fill="currentColor" fillOpacity="0.8" stroke="none" />
            {[60, 90, 120, 150, 180, 210].map((y) => (
              <g key={y} strokeOpacity="0.25">
                <path d={`M20 ${y} h 14`} />
                <path d={`M166 ${y} h 14`} />
              </g>
            ))}
          </svg>
        </motion.div>

        {/* teks */}
        <motion.div style={text} className="absolute inset-x-0 top-[34%] text-center">
          <p className="text-[9px] uppercase tracking-[0.4em] text-gold/80">The Wedding of</p>
          <p className="mt-2 whitespace-nowrap font-script text-[36px] leading-none text-foil sm:text-[44px]">Nadia &amp; Arga</p>
          <p className="mt-2 text-[10px] tracking-[0.3em] text-white/60">12 · 12 · 2026</p>
        </motion.div>

        {/* ornamen gantung */}
        <motion.div style={mid} className="absolute inset-x-0 top-0">
          {[
            { l: "12%", h: 70 },
            { l: "84%", h: 110 },
            { l: "26%", h: 40 },
          ].map((o, i) => (
            <div key={i} className="absolute flex flex-col items-center" style={{ left: o.l }}>
              <span className="w-px bg-gradient-to-b from-transparent to-gold/60" style={{ height: o.h }} />
              <motion.span
                className="h-3 w-3 border border-gold/70 bg-gold/20"
                animate={{ rotate: [45, 55, 45] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          ))}
        </motion.div>

        {/* dedaunan depan */}
        <motion.div style={front} className="pointer-events-none absolute inset-x-0 -bottom-10 h-48">
          <LeafCluster className="absolute -left-8 bottom-0 w-[55%]" />
          <LeafCluster className="absolute -right-8 bottom-0 w-[55%]" flip />
        </motion.div>

        {/* partikel emas (Luxury) */}
        <AnimatePresence>
          {lux &&
            STARS.slice(0, 14).map((s, i) => (
              <motion.span
                key={`p${i}`}
                className="pointer-events-none absolute h-1 w-1 rounded-full bg-gold-light shadow-[0_0_6px_rgba(233,210,154,0.9)]"
                style={{ left: `${(s.x * 1.3) % 100}%`, bottom: "-4%" }}
                initial={{ opacity: 0 }}
                animate={{ y: [0, -380], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 6 + (i % 4), repeat: Infinity, delay: i * 0.45, ease: "linear" }}
              />
            ))}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
      <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-white/50">
        <Layers className="h-4 w-4 flex-shrink-0 text-peach" /> Scroll halaman atau gerakkan kursor untuk merasakan kedalamannya
      </p>
    </div>
  );
}

function Features() {
  return (
    <section id="fitur" className="relative overflow-hidden bg-noir-800 py-24 text-ivory sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-violet-brand/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-rose-brand/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grain opacity-[0.06] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          dark
          kicker="Kenapa Momenlabs"
          title={
            <>
              Bukan undangan biasa. <br className="hidden sm:block" />
              <span className="italic text-gradient">Ini pengalaman.</span>
            </>
          }
          desc="Empat fitur unggulan yang membuat tamu betah membuka undanganmu berkali-kali, dan bercerita tentangnya."
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-12">
          <FeatureCard
            className="lg:col-span-7"
            icon={Smartphone}
            tag="Interactive Motion UI"
            title="Story Mode, tap-tap ala Instagram Story"
            desc="Tamu cukup tap kanan-kiri untuk menjelajahi setiap momen. Transisi sinematik, musik latar, dan progress bar yang terasa familiar sejak detik pertama."
          >
            <StoryDemoVisual />
          </FeatureCard>

          <FeatureCard
            className="lg:col-span-5"
            delay={0.08}
            icon={Mic}
            tag="Voice Note Wishes"
            title="Doa restu dalam pesan suara 15 detik"
            desc="Ucapan yang lebih hangat dari sekadar teks. Tamu merekam langsung dari browser, tanpa aplikasi tambahan."
          >
            <VoicePlayer />
          </FeatureCard>

          <FeatureCard
            className="lg:col-span-5"
            icon={CalendarDays}
            tag="Google Calendar & Maps"
            title="Tak ada lagi tamu yang lupa atau tersesat"
            desc="Satu tap untuk menyimpan jadwal ke Google Calendar dan langsung bernavigasi ke lokasi lewat Google Maps."
          >
            <CalendarMapVisual />
          </FeatureCard>

          <FeatureCard
            className="lg:col-span-7"
            delay={0.08}
            icon={Layers}
            tag="Cinematic Parallax"
            title="Undangan berlapis yang hidup saat di-scroll"
            desc="Ornamen, foto, dan teks disusun berlapis lalu bergerak dengan kecepatan berbeda, sehingga undanganmu terasa punya kedalaman. Premium: parallax halus. Luxury: parallax sinematik dengan cahaya & partikel emas."
          >
            <ParallaxDemo />
          </FeatureCard>
        </div>

        {/* mini features */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { i: Users, t: "Unlimited Nama Tamu", d: "Link personal per tamu" },
            { i: Music2, t: "Musik Latar", d: "Pilih atau upload sendiri" },
            { i: Zap, t: "Super Ringan", d: "Cepat di jaringan 4G" },
            { i: ShieldCheck, t: "RSVP Real-time", d: "Pantau dari dashboard" },
          ].map(({ i: I, t, d }, k) => (
            <Reveal key={t} delay={k * 0.06}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <I className="h-5 w-5 text-peach" />
                <p className="mt-3 text-sm font-semibold text-ivory">{t}</p>
                <p className="mt-0.5 text-xs text-white/50">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HOW IT WORKS
   ============================================================ */

function HowItWorks() {
  const steps = [
    { n: "01", t: "Pilih Template", d: `Jelajahi ${TEMPLATES.length} tema adat & modern, lalu coba demo langsung dari HP-mu.`, i: Layers },
    { n: "02", t: "Isi Data & Foto", d: "Lengkapi data mempelai, acara, dan galeri. Atau serahkan ke tim kami.", i: PenTool },
    { n: "03", t: "Sebar ke Tamu", d: "Bagikan link personal ke setiap tamu via WhatsApp dalam sekali klik.", i: Send },
  ];
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading kicker="Cara Kerja" title={<>Siap disebar dalam <span className="italic text-rose-brand">hitungan menit</span></>} />
        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent md:block" />
          {steps.map((s, k) => (
            <Reveal key={s.n} delay={k * 0.1}>
              <div className="relative text-center">
                <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-ink/5 bg-paper shadow-soft">
                  <s.i className="h-7 w-7 text-rose-brand" />
                  <span className="absolute -right-2 -top-2 rounded-full bg-foil px-2 py-0.5 text-[10px] font-bold text-noir">{s.n}</span>
                </div>
                <h3 className="mt-6 font-display text-2xl text-ink">{s.t}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-mute">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TEMPLATE CATALOG
   ============================================================ */

const TemplateCard = React.forwardRef(function TemplateCard({ t, onPreview }, ref) {
  const isAdat = t.category === "adat";
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease }}
      className="group flex flex-col"
    >
      <button
        type="button"
        onClick={() => onPreview(t)}
        className="relative aspect-[3/4] overflow-hidden rounded-[22px] text-left shadow-soft ring-1 ring-ink/5"
        aria-label={`Preview cepat ${t.name}`}
      >
        <div className="absolute inset-0 transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]">
          <TemplateCover t={t} compact />
        </div>
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5 sm:p-3">
          <span
            className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider backdrop-blur sm:text-[10px] ${
              isAdat ? "bg-gold/90 text-noir" : "bg-black/50 text-ivory/90"
            }`}
          >
            {CATEGORY_LABEL[t.category]}
          </span>
          <span
            className={`hidden items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider backdrop-blur sm:flex ${
              t.tier === "luxury"
                ? "bg-foil text-noir"
                : t.tier === "premium"
                ? "bg-black/70 text-gold ring-1 ring-gold/40"
                : "bg-black/50 text-ivory/90"
            }`}
          >
            {t.tier !== "basic" && <Crown className="h-2.5 w-2.5" />} {tierOf(t.tier).name}
          </span>
        </div>
        <div className="absolute inset-0 hidden items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 opacity-0 transition duration-500 group-hover:opacity-100 md:flex">
          <span className="flex w-full items-center justify-center gap-2 rounded-full bg-paper py-2.5 text-sm font-semibold text-ink">
            <Eye className="h-4 w-4" /> Preview Cepat
          </span>
        </div>
      </button>
      <div className="mt-3.5 px-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-brand sm:text-[11px]">{t.region}</p>
        <h3 className="mt-0.5 font-display text-xl leading-tight text-ink sm:text-2xl">{t.name}</h3>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={demoUrl(t)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-full border border-ink/15 py-2.5 text-[11px] font-semibold text-ink transition hover:border-gold/50 hover:bg-paper sm:text-xs"
        >
          <Eye className="h-3.5 w-3.5" /> <span className="hidden min-[380px]:inline">Coba</span> Demo
        </a>
        <a
          href={waLink(`Halo Momenlabs, saya mau pilih template "${t.name}" (${t.region}) paket ${tierOf(t.tier).name}.`)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-full bg-foil py-2.5 text-[11px] font-semibold text-noir transition hover:brightness-110 sm:text-xs"
        >
          Pilih <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </motion.div>
  );
});

function PreviewModal({ t, onClose }) {
  const [name, setName] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const demo = `${demoUrl(t)}${name.trim() ? `${demoUrl(t).includes("?") ? "&" : "?"}to=${encodeURIComponent(name.trim())}` : ""}`;

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ duration: 0.5, ease }}
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto grid w-full max-w-4xl items-center gap-8 rounded-[32px] bg-cream p-6 shadow-2xl ring-1 ring-gold/20 sm:p-10 md:grid-cols-[auto_1fr]"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-ink/5 text-ink transition hover:bg-ink/10"
          aria-label="Tutup preview"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto">
          <PhoneFrame className="!w-[240px] sm:!w-[270px]">
            <TemplateCover t={t} guestName={name} />
          </PhoneFrame>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-brand/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-brand">
            Paket {tierOf(t.tier).name} · {CATEGORY_LABEL[t.category]} · {t.region}
          </span>
          <h3 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">{t.name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-mute sm:text-base">
            Ketik nama tamu, lalu buka demo lengkapnya untuk merasakan undangan ini dari cover sampai RSVP.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-ink/10 bg-paper p-1.5">
            <Users className="ml-2.5 h-4 w-4 text-ink-mute" />
            <input
              value={name}
              maxLength={32}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama tamu…"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-ink/35"
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              "Countdown",
              "RSVP",
              "Musik",
              "Maps",
              ...(t.tier === "basic" ? [] : ["Story Mode", "Voice Wishes"]),
              ...(t.tier === "premium" ? ["Parallax"] : []),
              ...(t.tier === "luxury" ? ["Cinematic Parallax", "Opening Eksklusif"] : []),
            ].map((f) => (
              <span key={f} className="flex items-center gap-1 rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/70">
                <Check className="h-3 w-3 text-emerald-500" /> {f}
              </span>
            ))}
          </div>
          <a
            href={demo}
            target="_blank"
            rel="noreferrer"
            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-foil py-4 text-sm font-semibold text-noir transition hover:brightness-110"
          >
            <Eye className="h-4 w-4" /> Buka Demo Lengkap
          </a>
          <a
            href={waLink(`Halo Momenlabs, saya mau pilih template "${t.name}" (${t.region}) paket ${tierOf(t.tier).name}.`)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-full border border-ink/15 py-3.5 text-sm font-semibold text-ink transition hover:border-gold/50"
          >
            <WhatsAppIcon className="h-4 w-4" /> Pilih Template Ini
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

const TIER_RANK = { basic: 0, premium: 1, luxury: 2 };
const PREMIUM_TABS = [
  { id: "adat", label: "Adat Nusantara" },
  { id: "kontemporer", label: "European Classic" },
  { id: "heritage", label: "Modern Aesthetic" },
];

function TierBlock({ tier, index, onPreview }) {
  const own = TEMPLATES.filter((t) => t.tier === tier.id);
  const lux = tier.id === "luxury";
  const premium = tier.id === "premium";
  const [tab, setTab] = useState("adat");
  const shown = premium ? own.filter((t) => t.category === tab) : own;

  return (
    <div id={`paket-${tier.id}`} data-tier={tier.id} className="scroll-mt-44">
      <Reveal>
        <div
          className={`relative overflow-hidden rounded-[28px] p-6 sm:p-8 ${
            lux
              ? "bg-gradient-to-br from-[#2A2216] via-noir-800 to-noir ring-1 ring-gold/50 shadow-[0_30px_80px_-30px_rgba(201,164,92,0.45)]"
              : premium
              ? "bg-paper ring-1 ring-gold/25"
              : "bg-paper/70 ring-1 ring-ink/10"
          }`}
        >
          {lux && <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />}
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-4">
                <span className="font-display text-6xl italic leading-[0.8] text-gold/40 sm:text-7xl">0{index + 1}</span>
                <h3
                  className={`inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border px-5 py-2.5 font-display text-[30px] leading-none min-[400px]:text-[34px] sm:px-6 sm:text-5xl ${
                    lux
                      ? "border-gold/60 bg-gold/10 text-foil shadow-[0_0_30px_-8px_rgba(212,175,106,0.6)]"
                      : premium
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-ink/15 bg-ink/[0.04] text-ink"
                  }`}
                >
                  Paket {tier.name}
                  {tier.id !== "basic" && <Crown className={`h-5 w-5 flex-shrink-0 sm:h-7 sm:w-7 ${lux ? "text-gold-light" : "text-gold"}`} />}
                </h3>
              </div>
              <p className="mt-4 text-lg font-semibold tracking-wide text-gold sm:text-xl">{tier.tagline}</p>
            </div>
            <div className="flex flex-shrink-0 flex-col items-start gap-3 md:items-end">
              <p className="flex items-baseline gap-1 text-ink">
                <span className="text-sm text-ink-mute">Rp</span>
                <span className="font-display text-5xl leading-none">{tier.price}</span>
              </p>
              <div className="flex gap-2">
                <a
                  href="#harga"
                  className="rounded-full border border-ink/15 px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-gold/50"
                >
                  Detail fitur
                </a>
                <a
                  href={waLink(`Halo Momenlabs, saya mau pesan paket ${tier.name} (Rp ${tier.price}).`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-foil px-4 py-2.5 text-xs font-semibold text-noir transition hover:brightness-110"
                >
                  Pilih {tier.name} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {premium && (
        <div className="mt-8 flex justify-center">
          <div className="flex gap-1 rounded-full border border-ink/10 bg-paper/70 p-1.5">
            {PREMIUM_TABS.map((o) => (
              <button
                key={o.id}
                onClick={() => setTab(o.id)}
                className={`relative rounded-full px-5 py-2.5 text-xs font-semibold transition sm:text-sm ${
                  tab === o.id ? "text-noir" : "text-ink/60 hover:text-ink"
                }`}
              >
                {tab === o.id && (
                  <motion.span layoutId="premium-tab" className="absolute inset-0 rounded-full bg-foil" transition={{ duration: 0.35, ease }} />
                )}
                <span className="relative">
                  {o.label}
                  <span className={`ml-1.5 text-[10px] ${tab === o.id ? "text-noir/60" : "text-ink/40"}`}>
                    {own.filter((t) => t.category === o.id).length}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-5">
        {shown.map((t) => (
          <TemplateCard key={t.id} t={t} onPreview={onPreview} />
        ))}
        {lux && (
          <Reveal className="flex">
            <div className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-[22px] border border-dashed border-gold/30 p-4 text-center">
              <Sparkles className="h-6 w-6 text-gold" />
              <p className="mt-3 font-display text-xl leading-tight text-ink">Koleksi Luxury terus bertambah</p>
              <p className="mt-1.5 text-[11px] leading-snug text-ink-mute">Template eksklusif baru hadir untuk pemilik paket Luxury.</p>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}

/* tier yang sedang terlihat di layar → untuk menyorot tombol paket */
function useActiveTier() {
  const [active, setActive] = useState("basic");
  useEffect(() => {
    const els = TIERS.map((t) => document.getElementById(`paket-${t.id}`)).filter(Boolean);
    const onScroll = () => {
      const line = window.innerHeight * 0.4;
      let current = TIERS[0].id;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.dataset.tier;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return active;
}

function TemplateCatalog() {
  const [preview, setPreview] = useState(null);
  const active = useActiveTier();

  return (
    <section id="template" className="relative bg-cream-deep/60 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          kicker="Katalog Template"
          title={
            <>
              Pilih paket, <span className="italic text-rose-brand">temukan temamu</span>
            </>
          }
          desc="Katalog dibagi per paket supaya jelas template mana yang kamu dapatkan. Paket yang lebih tinggi selalu mendapat semua template paket di bawahnya. Tap “Coba Demo” untuk membuka undangan lengkapnya."
        />

        <div className="sticky top-20 z-30 mx-auto mt-10 max-w-2xl">
          <div className="grid grid-cols-3 gap-2 rounded-[22px] border border-ink/10 bg-cream/85 p-1.5 shadow-soft backdrop-blur-xl">
            {TIERS.map((tier) => {
              const on = active === tier.id;
              const count = TEMPLATES.filter((t) => t.tier === tier.id).length;
              return (
                <a key={tier.id} href={`#paket-${tier.id}`} className="relative rounded-2xl px-2 py-3 text-center">
                  {on && (
                    <motion.span layoutId="tier-pill" className="absolute inset-0 rounded-2xl bg-foil" transition={{ duration: 0.4, ease }} />
                  )}
                  <span className={`relative block text-sm font-bold sm:text-base ${on ? "text-noir" : "text-ink"}`}>{tier.name}</span>
                  <span className={`relative block text-[10px] sm:text-[11px] ${on ? "text-noir/70" : "text-ink-mute"}`}>
                    {tier.id === "luxury" ? "Semua template" : `${count} template`}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-14 space-y-20">
          {TIERS.map((tier, i) => (
            <TierBlock key={tier.id} tier={tier} index={i} onPreview={setPreview} />
          ))}
        </div>
      </div>

      <AnimatePresence>{preview && <PreviewModal t={preview} onClose={() => setPreview(null)} />}</AnimatePresence>
    </section>
  );
}

/* ============================================================
   PRICING
   ============================================================ */

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "50.000",
    desc: "Untuk yang ingin undangan cantik, simpel, dan cepat jadi.",
    cta: "Pilih Basic",
    features: [
      { t: "5 template Basic (Modern)", ok: true, strong: true },
      { t: "Masa aktif 3–6 bulan", ok: true },
      { t: "Countdown menuju hari-H", ok: true },
      { t: "RSVP teks", ok: true },
      { t: "Google Maps & musik latar", ok: true },
      { t: "Amplop digital & QRIS", ok: true },
      { t: "Maks. 2× revisi", ok: true },
      { t: "Efek parallax", ok: false },
      { t: "Voice Note Wishes", ok: false },
      { t: "Tap-tap Story Mode", ok: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "100.000",
    desc: "Paling favorit. Template adat, parallax & fitur interaktif terbuka.",
    cta: "Pilih Premium",
    featured: true,
    features: [
      { t: "12 template: 5 Adat Nusantara + 7 European Classic", ok: true, strong: true },
      { t: "Termasuk semua template Basic", ok: true },
      { t: "Efek parallax halus saat di-scroll", ok: true, strong: true },
      { t: "Countdown menuju hari-H", ok: true },
      { t: "Aktif selamanya (Lifetime)", ok: true },
      { t: "Voice Note Wishes 15 detik", ok: true },
      { t: "Tap-tap Story Mode", ok: true },
      { t: "Unlimited nama tamu", ok: true },
      { t: "Google Calendar, Maps, RSVP & musik custom", ok: true },
      { t: "Amplop digital & QRIS", ok: true },
      { t: "Maks. 5× revisi", ok: true, strong: true },
    ],
  },
  {
    id: "luxury",
    name: "Luxury",
    price: "150.000",
    desc: "Koleksi eksklusif dengan parallax sinematik, dan kamu tinggal terima beres.",
    cta: "Pilih Luxury",
    features: [
      { t: "Semua template + koleksi eksklusif Luxury", ok: true, strong: true },
      { t: "Cinematic parallax berlapis-lapis", ok: true, strong: true },
      { t: "Opening animation eksklusif", ok: true, strong: true },
      { t: "Aktif selamanya (Lifetime)", ok: true },
      { t: "Countdown menuju hari-H", ok: true },
      { t: "Voice Note Wishes 15 detik", ok: true },
      { t: "Tap-tap Story Mode", ok: true },
      { t: "Unlimited nama tamu", ok: true },
      { t: "Google Calendar, Maps, RSVP & musik custom", ok: true },
      { t: "Amplop digital & QRIS", ok: true },
      { t: "Custom warna & ornamen sesuai tema", ok: true },
      { t: "Bantuan input data (terima beres)", ok: true },
      { t: "Maks. 10× revisi", ok: true, strong: true },
    ],
  },
];

function Pricing() {
  return (
    <section id="harga" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-40 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gold/10 blur-[140px]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          kicker="Harga"
          title={
            <>
              Investasi kecil untuk <span className="italic text-rose-brand">kesan seumur hidup</span>
            </>
          }
          desc="Bayar sekali, tanpa biaya tersembunyi. Upgrade paket kapan saja."
        />

        <div className="mt-16 grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
          {PLANS.map((p, k) => (
            <Reveal key={p.id} delay={k * 0.08} className={p.featured ? "lg:-mt-4 lg:mb-[-16px]" : ""}>
              <div
                className={`relative flex h-full flex-col rounded-[30px] p-7 sm:p-8 ${
                  p.featured
                    ? "bg-gradient-to-b from-[#1F1A12] to-noir-800 ring-1 ring-gold/50 shadow-[0_40px_80px_-30px_rgba(201,164,92,0.35)]"
                    : p.id === "luxury"
                    ? "border border-violet-brand/20 bg-gradient-to-b from-[#1C1813] to-paper shadow-soft"
                    : "border border-ink/10 bg-paper/80 shadow-soft"
                }`}
              >
                {p.featured && (
                  <>
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30px]">
                      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-rose-brand/40 blur-3xl" />
                      <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-violet-brand/40 blur-3xl" />
                    </div>
                    <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-rose-brand via-peach to-violet-brand px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow">
                      <Star className="h-3 w-3 fill-white" /> Best Seller
                    </span>
                  </>
                )}

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${p.featured ? "text-ivory" : "text-ink"}`}>{p.name}</h3>
                    {p.id === "luxury" && (
                      <span className="flex items-center gap-1 rounded-full bg-violet-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-brand">
                        <Crown className="h-3 w-3" /> Luxury
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 text-sm ${p.featured ? "text-white/60" : "text-ink-mute"}`}>{p.desc}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className={`text-sm font-semibold ${p.featured ? "text-white/60" : "text-ink-mute"}`}>Rp</span>
                    <span className={`font-display text-6xl tracking-tight ${p.featured ? "text-ivory" : "text-ink"}`}>{p.price}</span>
                  </div>
                  <p className={`mt-1 text-xs ${p.featured ? "text-white/40" : "text-ink-mute"}`}>sekali bayar</p>
                </div>

                <ul className="relative mt-7 flex-1 space-y-3.5">
                  {p.features.map((f) => (
                    <li key={f.t} className="flex items-start gap-3 text-sm">
                      <span
                        className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full ${
                          f.ok
                            ? p.featured
                              ? "bg-gradient-to-br from-rose-brand to-peach text-noir"
                              : p.id === "luxury"
                              ? "bg-violet-brand text-white"
                              : "bg-foil text-noir"
                            : "bg-ink/5 text-ink/30"
                        }`}
                      >
                        {f.ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span
                        className={`${!f.ok ? "text-ink/35 line-through decoration-ink/20" : p.featured ? "text-white/85" : "text-ink/80"} ${
                          f.strong ? "font-semibold" : ""
                        } ${f.strong && p.featured ? "!text-ivory" : ""}`}
                      >
                        {f.t}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={waLink(`Halo Momenlabs, saya mau pesan paket ${p.name} (Rp ${p.price}).`)}
                  target="_blank"
                  rel="noreferrer"
                  className={`relative mt-8 flex items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold transition ${
                    p.featured
                      ? "bg-foil text-noir hover:brightness-110"
                      : p.id === "luxury"
                      ? "bg-violet-brand text-white hover:bg-violet-brand/90"
                      : "border border-ink/15 text-ink hover:border-transparent hover:bg-foil hover:text-noir"
                  }`}
                >
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        {/* add-ons */}
        <Reveal delay={0.1}>
          <div className="mt-12 rounded-[28px] border border-dashed border-ink/15 bg-paper/60 p-6 backdrop-blur sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="md:w-56">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-brand">Add-On</p>
                <p className="mt-1 font-display text-3xl text-ink">Bikin makin spesial</p>
              </div>
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    i: PenTool,
                    t: "Custom Digital Illustration Wajah",
                    d: "Ilustrasi wajah kalian berdua, digambar tangan oleh ilustrator kami.",
                  },
                  { i: Globe, t: "Custom Domain .com", d: "Alamat eksklusif, mis. nadiaarga.com" },
                ].map(({ i: I, t, d }) => (
                  <a
                    key={t}
                    href={waLink(`Halo Momenlabs, saya mau tanya add-on: ${t}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-4 rounded-2xl border border-ink/5 bg-paper p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-foil">
                      <I className="h-5 w-5 text-noir" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-ink">{t}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-mute">{d}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-brand">
                        Tanya harga <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */

const TESTIMONIALS = [
  {
    n: "Rizka & Fajar",
    r: "Menikah di Bandung",
    t: "Tamu-tamu pada heboh sama fitur voice note! Banyak ucapan dari keluarga jauh yang bikin nangis pas diputar ulang.",
    c: "#C9A45C",
  },
  {
    n: "Dinda & Yoga",
    r: "Template Jawa · Sekar Prambanan",
    t: "Ornamen Jawanya detail banget dan tetap modern. Orang tua kami yang biasanya prefer undangan cetak pun langsung suka.",
    c: "#C9A45C",
  },
  {
    n: "Sarah & Kevin",
    r: "Paket Luxury",
    t: "Efek parallax-nya bikin undangan kami kayak film pendek, jadi bahan obrolan di grup keluarga. Tinggal kirim data, semuanya diurus.",
    c: "#8C6A2F",
  },
  {
    n: "Putri & Andre",
    r: "Template Korean · Seoul Bloom",
    t: "Story mode-nya kayak buka IG Story, gampang dipakai semua umur. Setup cepat dan adminnya responsif.",
    c: "#F08BA6",
  },
  {
    n: "Ulfa & Hendra",
    r: "Template Minang · Rumah Gadang",
    t: "Akhirnya ada undangan digital adat Minang yang elegan. Fitur RSVP-nya bantu banget hitung katering.",
    c: "#8E1F24",
  },
  {
    n: "Nabila & Rafi",
    r: "Template Islamic · Nur Elegance",
    t: "Desainnya teduh dan berkelas. Tombol Google Calendar bikin tamu nggak ada yang lupa tanggal.",
    c: "#0F4236",
  },
];

function Testimonials() {
  return (
    <section id="testimoni" className="relative overflow-hidden bg-cream-deep/60 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          kicker="Testimoni"
          title={
            <>
              Cerita dari mereka yang <span className="italic text-rose-brand">sudah bahagia</span>
            </>
          }
        />
        <div className="mt-16 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {TESTIMONIALS.map((t, k) => (
            <Reveal key={t.n} delay={(k % 3) * 0.08} className="mb-5 break-inside-avoid">
              <figure className="relative rounded-[26px] border border-ink/5 bg-paper p-6 shadow-soft">
                <Quote className="absolute right-5 top-5 h-8 w-8 text-ink/5" />
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                  ))}
                </div>
                <blockquote className="mt-4 text-[15px] leading-relaxed text-ink/80">“{t.t}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" style={{ background: t.c }}>
                    {t.n[0]}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink">{t.n}</span>
                    <span className="block text-xs text-ink-mute">{t.r}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ
   ============================================================ */

const FAQS = [
  {
    q: "Berapa lama proses pembuatan undangan?",
    a: "Setelah data lengkap kami terima, undangan siap dalam 1×24 jam. Di paket Luxury, tim kami yang menginput seluruh data, jadi kamu tinggal terima beres.",
  },
  {
    q: "Bagaimana cara kerja Voice Note Wishes?",
    a: "Tamu cukup menekan tombol mikrofon di halaman undangan dan merekam ucapan maksimal 15 detik langsung dari browser HP, tanpa install aplikasi. Semua pesan suara bisa kamu dengarkan dan unduh dari dashboard.",
  },
  {
    q: "Apa bedanya parallax Premium dan Luxury?",
    a: "Premium memakai parallax halus: ornamen dan foto bergerak lembut saat di-scroll. Luxury memakai cinematic parallax dengan lebih banyak lapisan, cahaya dan partikel emas, serta opening animation eksklusif. Keduanya tetap ringan dibuka di HP.",
  },
  {
    q: "Apakah nama tamu bisa dibuat berbeda-beda?",
    a: "Bisa. Di paket Premium dan Luxury kamu mendapat unlimited nama tamu. Setiap tamu menerima link personal dengan namanya sendiri di halaman cover, siap dikirim lewat WhatsApp.",
  },
  {
    q: "Berapa kali bisa revisi?",
    a: "Basic maksimal 2× revisi, Premium maksimal 5× revisi, dan Luxury maksimal 10× revisi. Revisi mencakup data seperti jam acara, lokasi, foto, dan musik, dan perubahannya langsung tampil tanpa perlu mengirim ulang link ke tamu.",
  },
  {
    q: "Metode pembayaran apa saja yang tersedia?",
    a: "Kami menerima transfer bank, QRIS, dan e-wallet (GoPay, OVO, DANA, ShopeePay). Konfirmasi pembayaran cukup lewat WhatsApp admin.",
  },
];

/* ============================================================
   LAYANAN TAMBAHAN: GAME INTERAKTIF CUSTOM
   (halaman lengkap: public/game-interaktif/index.html)
   ============================================================ */

const GAME_PAGE = "/game-interaktif/";
// contoh game yang bisa langsung dimainkan di dalam bingkai HP
const GAME_DEMOS = [
  {
    id: "kartun",
    t: "Perjalanan Cinta",
    d: "Gaya kartun · kisah fiktif Raka & Alya",
    src: "/game-interaktif/perjalanan-cinta/index.html?touch",
    poster: "/game-interaktif/posters/perjalanan-cinta.jpg",
  },
  {
    id: "realistis",
    t: "Anniversary Pernikahan",
    d: "Gaya realistis · karya asli kami",
    src: "/game-interaktif/anniversary/index.html",
    poster: "/game-interaktif/posters/anniversary.jpg",
  },
];
// lebar layar HP "asli" di dalam bingkai; game dirender di ukuran ini lalu diperkecil agar tampilannya tetap versi HP
const PHONE_VIEW_W = 390;

function PlayablePhone({ game, active, onPlay, onStop }) {
  const screenRef = useRef(null);
  const [box, setBox] = useState({ w: 260, h: 550 });

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = box.w / PHONE_VIEW_W;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="pointer-events-none absolute -inset-8 rounded-full bg-gold/15 blur-3xl" />
        <PhoneFrame className="!w-[260px] sm:!w-[280px]">
          <div ref={screenRef} className="absolute inset-0 bg-noir">
            {active ? (
              <iframe
                title={`Game ${game.t}`}
                src={game.src}
                allow="autoplay; fullscreen; gamepad"
                className="absolute left-0 top-0 origin-top-left border-0"
                style={{ width: PHONE_VIEW_W, height: box.h / scale, transform: `scale(${scale})` }}
              />
            ) : (
              <button
                type="button"
                onClick={onPlay}
                className="group absolute inset-0 h-full w-full text-left"
                aria-label={`Mainkan ${game.t}`}
              >
                <img src={game.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-noir via-noir/30 to-noir/10" />
                <span className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3">
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-foil text-noir shadow-[0_15px_40px_-10px_rgba(201,164,92,0.9)] transition group-hover:scale-110">
                    <Play className="ml-1 h-8 w-8 fill-noir" />
                  </span>
                  <span className="rounded-full bg-noir/70 px-4 py-1.5 text-xs font-semibold text-cream backdrop-blur">
                    Ketuk untuk main
                  </span>
                </span>
              </button>
            )}
          </div>
        </PhoneFrame>
      </div>
      <p className="mt-5 font-display text-xl italic text-ink">{game.t}</p>
      <p className="text-xs text-ink-mute">{game.d}</p>
      <div className="mt-2 flex items-center gap-3 text-xs">
        <a href={game.src} target="_blank" rel="noreferrer" className="font-semibold text-gold hover:underline">
          Buka layar penuh ↗
        </a>
        {active && (
          <button type="button" onClick={onStop} className="text-ink-mute hover:text-ink">
            Tutup game
          </button>
        )}
      </div>
    </div>
  );
}

function GameTeaser() {
  // hanya satu game yang berjalan sekaligus, supaya HP pengunjung tidak berat
  const [active, setActive] = useState(null);

  const types = [
    { Icon: Box, t: "Game 3D Custom", d: "Dunia 3D, karakter, dialog & mini game" },
    { Icon: Heart, t: "Quiz Cinta", d: "Kuis kisah kalian dengan skor & kenangan" },
    { Icon: BookOpen, t: "Story Adventure", d: "Petualangan dengan pilihan & kejutan" },
  ];

  return (
    <section id="game" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          kicker="Layanan Baru"
          title={
            <>
              Game Interaktif <span className="italic text-rose-brand">Custom</span>
            </>
          }
          desc="Ubah momen spesialmu jadi game yang bisa dimainkan orang tersayang, untuk anniversary, ulang tahun, lamaran, pernikahan, dan momen lainnya. Semua bisa dikustom sesuai kisah kalian."
        />

        <Reveal delay={0.1}>
          <p className="mt-12 text-center text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Coba mainkan langsung di sini
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-14 sm:flex-row sm:items-start sm:gap-12 lg:gap-20">
            {GAME_DEMOS.map((g) => (
              <PlayablePhone
                key={g.id}
                game={g}
                active={active === g.id}
                onPlay={() => setActive(g.id)}
                onStop={() => setActive(null)}
              />
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-ink-mute">
            Di HP: geser joystick di layar · Di laptop: klik game-nya, lalu WASD untuk jalan &amp; E untuk bicara
          </p>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-4xl gap-3 sm:grid-cols-3">
          {types.map(({ Icon, t, d }, i) => (
            <Reveal key={t} delay={i * 0.08}>
              <div className="flex h-full items-center gap-4 rounded-2xl border border-ink/10 bg-paper/70 p-4">
                <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">{t}</span>
                  <span className="block text-xs text-ink-mute">{d}</span>
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={GAME_PAGE}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foil px-7 py-4 text-sm font-semibold text-noir transition hover:brightness-110"
            >
              Lihat Detail Layanan <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={waLink("Halo MomenLabs, saya tertarik membuat Game Interaktif Custom. Boleh diskusi?")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-7 py-4 text-sm font-semibold text-ink transition hover:border-gold/50"
            >
              <WhatsAppIcon className="h-4 w-4" /> Konsultasi Gratis
            </a>
          </div>
          <p className="mt-4 text-center text-xs text-ink-mute">Harga menyesuaikan konsep, diskusikan langsung dengan admin.</p>
        </Reveal>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            align="left"
            kicker="FAQ"
            title={
              <>
                Masih ada yang <span className="italic text-rose-brand">ditanyakan?</span>
              </>
            }
            desc="Jawaban singkat untuk pertanyaan yang paling sering masuk ke admin kami."
          />
          <Reveal delay={0.2}>
            <a
              href={waLink("Halo Momenlabs, saya mau bertanya.")}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_15px_40px_-12px_rgba(37,211,102,0.6)] transition hover:brightness-105"
            >
              <WhatsAppIcon /> Tanya langsung ke Admin
            </a>
          </Reveal>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 0.05}>
                <div
                  className={`overflow-hidden rounded-3xl border transition-colors duration-300 ${
                    isOpen ? "border-ink/10 bg-paper shadow-soft" : "border-ink/5 bg-paper/50 hover:bg-paper/80"
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[15px] font-semibold text-ink sm:text-base">{f.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full ${isOpen ? "bg-foil text-noir" : "bg-ink/5 text-ink"}`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                      >
                        <p className="px-5 pb-6 text-sm leading-relaxed text-ink-mute sm:px-6 sm:text-[15px]">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA + FOOTER
   ============================================================ */

function FinalCTA() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-noir-800 ring-1 ring-gold/25 px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-rose-brand/40 blur-[100px]" />
            <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-violet-brand/40 blur-[100px]" />
            <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-peach/20 blur-[90px]" />
            <div className="absolute inset-0 bg-grain opacity-10 mix-blend-overlay" />
          </div>
          <div className="relative">
            <p className="font-script text-4xl text-peach sm:text-5xl">Your moment, reimagined</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-[1.05] text-ivory sm:text-6xl">
              Siap bikin tamu bilang <span className="italic text-gradient">“wow”</span>?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-white/60">
              Mulai dari Rp 50.000. Pilih template, kirim data, dan undanganmu siap disebar hari ini juga.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="#template"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foil px-8 py-4 text-sm font-semibold text-noir transition hover:brightness-110"
              >
                <Layers className="h-4 w-4" /> Pilih Template
              </a>
              <a
                href={waLink("Halo Momenlabs, saya mau buat undangan digital!")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-sm font-semibold text-ivory transition hover:bg-white/10"
              >
                <WhatsAppIcon className="h-4 w-4" /> Buat Undangan
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink/5 bg-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo className="h-14" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-mute">
            Interactive &amp; Parallax Digital Invitation. Merayakan setiap momen dengan desain yang hidup dan berkesan.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { i: Instagram, l: "Instagram", h: "https://instagram.com/" },
              { i: WhatsAppIcon, l: "WhatsApp", h: waLink("Halo Momenlabs!") },
            ].map(({ i: I, l, h }) => (
              <a
                key={l}
                href={h}
                target="_blank"
                rel="noreferrer"
                aria-label={l}
                className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 text-ink transition hover:bg-foil hover:text-noir"
              >
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {[
          { h: "Produk", l: [["Fitur", "#fitur"], ["Template", "#template"], ["Harga", "#harga"]] },
          { h: "Bantuan", l: [["FAQ", "#faq"], ["Testimoni", "#testimoni"], ["Hubungi Admin", waLink("Halo Momenlabs!")]] },
          { h: "Template", l: [["Adat Jawa", "#template"], ["Islamic", "#template"], ["Korean", "#template"]] },
        ].map((col) => (
          <div key={col.h}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink">{col.h}</p>
            <ul className="mt-4 space-y-2.5">
              {col.l.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-sm text-ink-mute transition hover:text-rose-brand">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ink/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-ink-mute sm:flex-row sm:px-6">
          <p>© 2026 Momenlabs. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Dibuat dengan <Heart className="h-3 w-3 fill-rose-brand text-rose-brand" /> di Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}

function FloatingWhatsApp() {
  const [show, setShow] = useState(false);
  const [tip, setTip] = useState(true);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const t = setTimeout(() => setTip(false), 9000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          transition={{ duration: 0.4, ease }}
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 sm:bottom-7 sm:right-7"
        >
          <AnimatePresence>
            {tip && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="hidden items-center gap-2 rounded-2xl bg-paper px-4 py-3 text-sm shadow-soft ring-1 ring-ink/5 sm:flex"
              >
                <span>
                  <span className="block font-bold text-ink">Butuh bantuan?</span>
                  <span className="block text-xs text-ink-mute">Admin online, balas cepat ✨</span>
                </span>
                <button onClick={() => setTip(false)} className="text-ink/30 hover:text-ink" aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <a
            href={waLink("Halo Momenlabs, saya mau tanya soal undangan digital.")}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat WhatsApp"
            className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_15px_40px_-10px_rgba(37,211,102,0.7)] transition hover:scale-105"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40" />
            <WhatsAppIcon className="relative h-7 w-7" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function LandingPage() {
  return (
    <div className="theme-noir relative overflow-x-clip bg-cream text-ink">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Features />
        <HowItWorks />
        <TemplateCatalog />
        <Pricing />
        <Testimonials />
        <GameTeaser />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
