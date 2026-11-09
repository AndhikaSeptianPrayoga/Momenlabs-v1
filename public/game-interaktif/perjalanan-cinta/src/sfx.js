// Efek suara yang disintesis langsung di browser (tanpa file): UI, dialog, kuis, mini game, langkah kaki.
export function createSfx() {
  let ctx = null, out = null, verb = null, noise = null, enabled = true;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    out = ctx.createGain(); out.gain.value = 0.55;
    out.connect(comp).connect(ctx.destination);
    // gema ruangan pendek supaya suara terasa "hangat"
    const len = ctx.sampleRate * 1.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4; }
    const cv = ctx.createConvolver(); cv.buffer = ir;
    verb = ctx.createGain(); verb.gain.value = 0.25;
    verb.connect(cv).connect(comp);
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    noise = nb;
  }
  const now = () => ctx.currentTime;
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);

  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone({ f = 880, type = 'sine', t = 0, a = 0.005, d = 0.3, vol = 0.2, glide = 0, wet = 0.4, detune = 0 }) {
    const s = now() + t, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, s); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * glide), s + a + d);
    env(g, s, a, vol, d);
    o.connect(g); g.connect(out); if (wet) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(verb); }
    o.start(s); o.stop(s + a + d + 0.05);
  }
  function hiss({ t = 0, a = 0.005, d = 0.1, vol = 0.2, type = 'bandpass', f = 2000, q = 1, sweep = 0, wet = 0.1, rate = 1 }) {
    const s = now() + t, src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise; src.playbackRate.value = rate;
    fl.type = type; fl.frequency.setValueAtTime(f, s); fl.Q.value = q;
    if (sweep) fl.frequency.exponentialRampToValueAtTime(Math.max(40, f * sweep), s + a + d);
    env(g, s, a, vol, d);
    src.connect(fl).connect(g).connect(out); if (wet) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(verb); }
    src.start(s, Math.random() * 1.5); src.stop(s + a + d + 0.05);
  }
  const chord = (notes, opts = {}) => notes.forEach((m, i) => tone({ f: hz(m), t: (opts.step ?? 0.06) * i, d: opts.d ?? 0.5, vol: opts.vol ?? 0.12, type: opts.type ?? 'sine', wet: 0.5 }));

  const SOUNDS = {
    click: () => { tone({ f: 1400, type: 'triangle', d: 0.05, vol: 0.12, wet: 0.05 }); },
    open: () => { hiss({ f: 1200, sweep: 3, d: 0.25, vol: 0.06, q: 0.7 }); chord([76, 83, 88], { step: 0.04, d: 0.6, vol: 0.07 }); },
    close: () => { hiss({ f: 2500, sweep: 0.4, d: 0.18, vol: 0.05 }); tone({ f: hz(72), d: 0.2, vol: 0.06 }); },
    photo: () => { // rana kamera + kilau
      hiss({ type: 'highpass', f: 3000, d: 0.03, vol: 0.25, wet: 0 }); hiss({ type: 'bandpass', f: 1800, t: 0.06, d: 0.05, vol: 0.2, wet: 0 });
      [88, 92, 95, 100].forEach((m, i) => tone({ f: hz(m), t: 0.08 + i * 0.045, d: 0.35, vol: 0.05, wet: 0.6 }));
    },
    paper: () => { hiss({ type: 'bandpass', f: 3500, q: 0.8, d: 0.22, vol: 0.12, sweep: 0.6 }); hiss({ type: 'bandpass', f: 2600, q: 0.8, t: 0.12, d: 0.18, vol: 0.09 }); },
    dialog: () => { tone({ f: hz(79), type: 'triangle', d: 0.12, vol: 0.09 }); tone({ f: hz(86), type: 'triangle', t: 0.07, d: 0.2, vol: 0.08 }); },
    line: () => { tone({ f: hz(84), d: 0.08, vol: 0.05, wet: 0.2 }); },
    type: () => { tone({ f: 1800 + Math.random() * 400, type: 'square', d: 0.012, vol: 0.012, wet: 0 }); },
    question: () => { chord([72, 76, 79, 84], { step: 0.07, d: 0.7, vol: 0.08, type: 'triangle' }); },
    right: () => { chord([72, 76, 79, 84, 88], { step: 0.06, d: 0.8, vol: 0.1 }); [96, 100].forEach((m, i) => tone({ f: hz(m), t: 0.32 + i * 0.05, d: 0.5, vol: 0.04 })); },
    wrong: () => { tone({ f: hz(58), type: 'triangle', d: 0.25, vol: 0.12, glide: 0.92 }); tone({ f: hz(55), type: 'triangle', t: 0.16, d: 0.4, vol: 0.12, glide: 0.9 }); },
    collect: () => { tone({ f: hz(88), d: 0.25, vol: 0.09 }); tone({ f: hz(95), t: 0.05, d: 0.35, vol: 0.08 }); },
    fanfare: () => { chord([67, 72, 76], { step: 0.1, d: 0.3, vol: 0.09, type: 'triangle' }); chord([72, 76, 79, 84], { step: 0.0, d: 0.9, vol: 0.06, type: 'triangle' }); },
    success: () => { chord([72, 76, 79, 84, 88, 91], { step: 0.08, d: 1.2, vol: 0.08 }); },
    gate: () => { hiss({ type: 'bandpass', f: 400, q: 6, d: 0.7, vol: 0.12, sweep: 1.8, rate: 0.5 }); chord([79, 84, 88], { step: 0.12, d: 0.9, vol: 0.07 }); },
    door: () => { [0, 0.16].forEach((t) => { tone({ f: 140, type: 'sine', t, d: 0.12, vol: 0.25, glide: 0.6, wet: 0.2 }); hiss({ type: 'lowpass', f: 900, t, d: 0.06, vol: 0.12 }); }); hiss({ type: 'bandpass', f: 600, q: 5, t: 0.45, d: 0.6, vol: 0.06, sweep: 1.5, rate: 0.6 }); },
    chapter: () => { [84, 88, 91, 96, 100].forEach((m, i) => tone({ f: hz(m), t: i * 0.09, d: 1.0, vol: 0.05, wet: 0.7 })); hiss({ type: 'highpass', f: 6000, d: 1.2, vol: 0.03, a: 0.3, wet: 0.5 }); },
    camera: () => { tone({ f: 900, type: 'triangle', d: 0.04, vol: 0.08, wet: 0 }); hiss({ f: 1500, sweep: 2, d: 0.15, vol: 0.04 }); },
    pop: () => { hiss({ type: 'lowpass', f: 1800, d: 0.08, vol: 0.16, wet: 0.1 }); tone({ f: 600, glide: 2.4, d: 0.08, vol: 0.06, wet: 0.1 }); },
    cheer: () => { // tepuk tangan & sorakan pelan dari tamu
      for (let i = 0; i < 70; i++) hiss({ type: 'bandpass', f: 1800 + Math.random() * 1800, q: 1.5, t: Math.random() * 2.6, d: 0.04, vol: 0.05 + Math.random() * 0.05, wet: 0.3 });
      hiss({ type: 'bandpass', f: 700, q: 0.7, a: 0.4, d: 2.2, vol: 0.05, wet: 0.5 });
      chord([72, 76, 79, 84, 88], { step: 0.12, d: 1.6, vol: 0.06 });
    },
    blow: () => { hiss({ type: 'bandpass', f: 900, q: 0.6, a: 0.1, d: 0.6, vol: 0.18, sweep: 0.5 }); },
    whoosh: () => { hiss({ type: 'bandpass', f: 300, q: 0.8, a: 0.6, d: 2.8, vol: 0.12, sweep: 8, wet: 0.5 }); [79, 84, 88, 91].forEach((m, i) => tone({ f: hz(m), t: 0.4 + i * 0.35, d: 1.2, vol: 0.04, wet: 0.7 })); },
    burst: () => {
      hiss({ type: 'lowpass', f: 600, d: 0.6, vol: 0.3, wet: 0.6 });
      for (let i = 0; i < 40; i++) tone({ f: hz(86 + Math.floor(Math.random() * 18)), t: 0.05 + Math.random() * 1.6, d: 0.4, vol: 0.025, wet: 0.8 });
      chord([60, 67, 72, 76, 79, 84], { step: 0.0, d: 3, vol: 0.05, type: 'triangle' });
    },
  };

  // langkah kaki per permukaan
  function step(surface, loud = 1) {
    if (!ctx || !enabled) return;
    const v = (0.7 + Math.random() * 0.3) * loud, r = 0.9 + Math.random() * 0.2;
    if (surface === 'grass') { hiss({ type: 'bandpass', f: 2600 * r, q: 0.6, d: 0.09, vol: 0.05 * v, wet: 0.05 }); hiss({ type: 'lowpass', f: 400, d: 0.05, vol: 0.05 * v, wet: 0 }); }
    else if (surface === 'gravel') { hiss({ type: 'bandpass', f: 3200 * r, q: 1.2, d: 0.12, vol: 0.07 * v, wet: 0.05 }); hiss({ type: 'lowpass', f: 600, d: 0.05, vol: 0.06 * v, wet: 0 }); }
    else if (surface === 'wood') { tone({ f: 120 * r, d: 0.07, vol: 0.12 * v, glide: 0.7, wet: 0.25 }); hiss({ type: 'bandpass', f: 900, q: 2, d: 0.04, vol: 0.05 * v, wet: 0.2 }); }
    else { tone({ f: 2400 * r, type: 'triangle', d: 0.03, vol: 0.03 * v, wet: 0.5 }); tone({ f: 180 * r, d: 0.05, vol: 0.08 * v, glide: 0.6, wet: 0.4 }); }
  }

  return {
    unlock() { init(); if (ctx.state !== 'running') ctx.resume(); },
    play(name) { if (!ctx || !enabled || !SOUNDS[name]) return; try { SOUNDS[name](); } catch { /* audio belum siap */ } },
    step,
    set enabled(v) { enabled = v; },
    get enabled() { return enabled; },
  };
}
