import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motionValue } from "framer-motion";

/* ============================================================
   MOMENLABS KIT — PANGGUNG & KEMIRINGAN
   ============================================================ */

/* Panggung berrasio tetap (mis. 9:16 atau 2:3) yang selalu menutupi layar.
   focusY: posisi vertikal titik fokus (0 = atas, 1 = bawah) saat panggung lebih tinggi dari layar.
   Kembalikan [ref, box] — box = { W, H, left, top } dalam px. */
export function useStageBox(ratio, focusY = 0.5) {
  const ref = useRef(null);
  const [box, setBox] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      const W = Math.max(w, h * ratio);
      const H = W / ratio;
      setBox({ W, H, left: (w - W) / 2, top: (h - H) * focusY });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ratio, focusY]);
  return [ref, box];
}

/* ---------- kemiringan halus: mouse di desktop, gyroscope di HP ----------
   Target dari input didekati pelan tiap frame (LERP) agar bergerak dengan inersia. */

const LERP = 0.06;
export const tiltX = motionValue(0);
export const tiltY = motionValue(0);
const target = { x: 0, y: 0 };
let users = 0;
let frame = 0;

function step() {
  const x = tiltX.get() + (target.x - tiltX.get()) * LERP;
  const y = tiltY.get() + (target.y - tiltY.get()) * LERP;
  tiltX.set(x);
  tiltY.set(y);
  const settled = Math.abs(target.x - x) < 0.0005 && Math.abs(target.y - y) < 0.0005;
  frame = settled ? 0 : requestAnimationFrame(step);
}
function aim(x, y) {
  target.x = Math.max(-1, Math.min(1, x));
  target.y = Math.max(-1, Math.min(1, y));
  if (!frame) frame = requestAnimationFrame(step);
}
const onPointer = (e) => {
  if (e.pointerType === "touch") return;
  aim((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
};
const onOrient = (e) => {
  if (e.gamma == null || e.beta == null) return;
  aim(e.gamma / 22, (e.beta - 45) / 22);
};

export function useTiltInput(enabled) {
  useEffect(() => {
    if (!enabled) return;
    if (users++ === 0) {
      window.addEventListener("pointermove", onPointer);
      window.addEventListener("deviceorientation", onOrient);
    }
    return () => {
      if (--users === 0) {
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("deviceorientation", onOrient);
      }
    };
  }, [enabled]);
}

// iOS hanya memberi data gyroscope setelah izin yang diminta dari ketukan pengguna
export function requestTiltPermission() {
  const D = typeof window !== "undefined" ? window.DeviceOrientationEvent : null;
  if (D && typeof D.requestPermission === "function") D.requestPermission().catch(() => {});
}
