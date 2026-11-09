import { useEffect, useState } from "react";
import { motionValue } from "framer-motion";

/* ============================================================
   MOMENLABS KIT — RIG KAMERA PERJALANAN
   ------------------------------------------------------------
   Dipakai template berbasis adegan yang isinya berupa "perjalanan"
   (Golden Minangkabau, Arunika). Satu kamera untuk seluruh undangan. Tiap bab (salam, mempelai,
   kisah, acara, penutup) mendaftarkan "pose" kamera sebagai fungsi
   progres scroll-nya; adegan latar & konten bab membaca nilai CAM
   yang sama sehingga konten benar-benar bergerak bersama dunianya.

   pose = { pan, lift, push, dim, dusk }
     pan  : -1 menoleh ke kiri … 0 tengah … 1 menoleh ke kanan
     lift : 0 menatap halaman … 1 menengadah ke langit
     push : 0 diam … 1 melangkah masuk ke bangunan utama
     dim  : 0 … 1 selubung gelap agar teks terbaca
     dusk : 0 senja … 1 malam (lentera & kunang-kunang)
   ============================================================ */

const KEYS = ["pan", "lift", "push", "dim", "dusk"];

// nilai kamera yang sudah dihaluskan (dibaca adegan & bab)
export const CAM = Object.fromEntries(KEYS.map((k) => [k, motionValue(0)]));

export const REST_TOP = { pan: 0, lift: 0, push: 0, dim: 0, dusk: 0 }; // hero
export const REST_PAGE = { pan: 0, lift: 0.35, push: 0, dim: 0.55, dusk: 0.35 }; // amplop, RSVP, ucapan

/* ---------- penghalus: target didekati tiap frame (inersia kamera) ---------- */

const target = { ...REST_TOP };
const LERP = 0.085;
let frame = 0;

function step() {
  let moving = false;
  for (const k of KEYS) {
    const v = CAM[k].get();
    const n = v + (target[k] - v) * LERP;
    if (Math.abs(target[k] - n) > 0.0004) {
      moving = true;
      CAM[k].set(n);
    } else CAM[k].set(target[k]);
  }
  frame = moving ? requestAnimationFrame(step) : 0;
}

export function aimRig(pose) {
  for (const k of KEYS) target[k] = pose[k] ?? 0;
  if (!frame) frame = requestAnimationFrame(step);
}

// langsung ke pose tanpa transisi (mis. saat cover dibuka ulang)
export function snapRig(pose = REST_TOP) {
  for (const k of KEYS) {
    target[k] = pose[k] ?? 0;
    CAM[k].set(target[k]);
  }
}

/* ---------- daftar bab ---------- */

const chapters = new Set(); // { ref, pose(p) }

export function registerChapter(ch) {
  chapters.add(ch);
  return () => chapters.delete(ch);
}

// pose kamera pada posisi scroll ini: bab yang sedang menempel, atau pose istirahat
export function poseAt(scrollY, vh) {
  let first = Infinity;
  for (const ch of chapters) {
    const el = ch.ref.current;
    // abaikan bab yang sudah terlepas dari halaman (mis. sisa pemasangan ulang)
    if (!el || !el.isConnected) continue;
    const r = el.getBoundingClientRect();
    if (r.height <= vh) continue;
    const top = r.top + scrollY;
    first = Math.min(first, top);
    const len = Math.max(1, r.height - vh);
    const p = (scrollY - top) / len;
    if (p >= 0 && p <= 1) return ch.pose(p);
  }
  // sebelum bab pertama = hero; sesudahnya = section biasa (amplop, RSVP, ucapan)
  return scrollY < first ? REST_TOP : REST_PAGE;
}

/* ---------- bantuan kurva ---------- */

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const seg = (p, a, b) => clamp01((p - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);

// interpolasi bertahap: keys = [[p, nilai], …] urut naik
export function track(p, keys) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i];
    const [p0, v0] = keys[i - 1];
    if (p <= p1) return v0 + (v1 - v0) * smooth((p - p0) / (p1 - p0));
  }
  return keys[keys.length - 1][1];
}

/* ---------- geser lapisan saat kamera menoleh ----------
   Lapisan berkedalaman k (0 jauh … 1 dekat) bergeser (3 + k × 22)% lebar panggung per satu
   satuan pan. Lebar panggung = max(lebar kolom, tinggi × 9/16) seperti useStageBox. */
export const panShift = (k) => 3 + k * 22;

export function useStageWidth() {
  const calc = () => (typeof window === "undefined" ? 440 : Math.max(Math.min(window.innerWidth, 440), (window.innerHeight * 9) / 16));
  const [w, setW] = useState(calc);
  useEffect(() => {
    const on = () => setW(calc());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}
