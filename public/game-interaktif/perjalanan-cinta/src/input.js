// Keyboard (WASD / panah, Shift lari) + joystick sentuh untuk HP.
export const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

export function createInput({ joystick, knob, onAction }) {
  const keys = new Set();
  const stick = { x: 0, y: 0, active: false, id: null };
  let enabled = true, virt = null; // virt: gerakan dari perekam demo (joystick ikut bergerak di layar)

  addEventListener('keydown', (e) => {
    if (!enabled || e.target.closest?.('textarea, input')) return;
    const k = e.key.toLowerCase();
    if (['e', ' ', 'enter'].includes(k)) { e.preventDefault(); onAction(); return; }
    keys.add(k);
    if (k.startsWith('arrow')) e.preventDefault();
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());

  const R = 46;
  const setKnob = (x, y) => { knob.style.transform = `translate(${x * R}px, ${y * R}px)`; };
  const move = (e) => {
    const r = joystick.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / R;
    let dy = (e.clientY - (r.top + r.height / 2)) / R;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    stick.x = dx; stick.y = dy; setKnob(dx, dy);
  };
  joystick.addEventListener('pointerdown', (e) => {
    stick.active = true; stick.id = e.pointerId; joystick.setPointerCapture(e.pointerId); move(e);
  });
  joystick.addEventListener('pointermove', (e) => { if (stick.active && e.pointerId === stick.id) move(e); });
  const end = () => { stick.active = false; stick.x = stick.y = 0; setKnob(0, 0); };
  joystick.addEventListener('pointerup', end);
  joystick.addEventListener('pointercancel', end);

  return {
    set enabled(v) { enabled = v; if (!v) { keys.clear(); end(); } },
    get enabled() { return enabled; },
    setVirtual(v) { virt = v; if (v) setKnob(v.x, v.z); else setKnob(0, 0); },
    // x: kanan layar (+X dunia), z: bawah layar (+Z dunia)
    read() {
      if (!enabled) return { x: 0, z: 0, mag: 0, run: false };
      if (virt) { const m = Math.min(1, Math.hypot(virt.x, virt.z)); return { x: virt.x, z: virt.z, mag: m < 0.15 ? 0 : m, run: m > 0.92 }; }
      let x = 0, z = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) z -= 1;
      if (keys.has('s') || keys.has('arrowdown')) z += 1;
      let run = keys.has('shift');
      if (stick.active) { x = stick.x; z = stick.y; run = Math.hypot(x, z) > 0.92; }
      const mag = Math.min(1, Math.hypot(x, z));
      if (mag > 0 && !stick.active) { const l = Math.hypot(x, z); x /= l; z /= l; }
      return { x, z, mag: mag < 0.15 ? 0 : mag, run };
    },
  };
}
