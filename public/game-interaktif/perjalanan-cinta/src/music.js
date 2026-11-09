// Musik latar. Kalau ada file public/music/lagu.mp3, file itu yang diputar.
// Kalau tidak ada, dimainkan melodi kotak musik yang dibuat langsung di browser.
export function createMusic() {
  let ctx, master, timer, audio, playing = false, step = 0, nextTime = 0;

  // F – Dm – Bb – C (lembut, khas kotak musik)
  const chords = [
    [53, 57, 60, 65, 69, 72], [50, 57, 62, 65, 69, 74],
    [46, 53, 58, 62, 65, 70], [48, 55, 60, 64, 67, 72],
  ];
  const melody = [72, 0, 74, 72, 69, 0, 65, 0, 69, 0, 72, 69, 74, 0, 72, 0,
                  70, 0, 69, 65, 62, 0, 65, 0, 67, 0, 64, 67, 72, 0, 0, 0];
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);

  function reverb() {
    const len = ctx.sampleRate * 2.6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    }
    const cv = ctx.createConvolver(); cv.buffer = buf; return cv;
  }

  function bell(t, midi, vol) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o2.type = 'sine';
    o.frequency.value = hz(midi); o2.frequency.value = hz(midi) * 3.01;
    const g2 = ctx.createGain(); g2.gain.value = 0.12;
    o.connect(g); o2.connect(g2).connect(g); g.connect(master);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 2.2);
    o.start(t); o2.start(t); o.stop(t + 2.3); o2.stop(t + 2.3);
  }

  function schedule() {
    const beat = 0.3;
    while (nextTime < ctx.currentTime + 0.6) {
      const bar = Math.floor(step / 8) % 4, i = step % 8;
      const ch = chords[bar];
      bell(nextTime, ch[[0, 2, 3, 4, 5, 4, 3, 2][i]] - 12, 0.05);
      const m = melody[step % 32];
      if (m) bell(nextTime, m, 0.075);
      nextTime += beat; step++;
    }
  }

  async function startSynth() {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();
    if (!master) {
      master = ctx.createGain(); master.gain.value = 0.7;
      const rv = reverb(), wet = ctx.createGain(); wet.gain.value = 0.45;
      const out = ctx.createGain();
      master.connect(out); master.connect(rv).connect(wet).connect(out); out.connect(ctx.destination);
    }
    master.gain.setTargetAtTime(0.7, ctx.currentTime, 0.4);
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 120);
  }

  let fileChecked = false, hasFile = false;
  async function checkFile() {
    if (fileChecked) return hasFile;
    fileChecked = true;
    try {
      const r = await fetch('music/lagu.mp3', { method: 'HEAD' });
      hasFile = r.ok && (r.headers.get('content-type') || '').includes('audio');
    } catch { hasFile = false; }
    return hasFile;
  }

  return {
    get playing() { return playing; },
    async play() {
      if (playing) return;
      playing = true;
      if (await checkFile()) {
        audio = audio || Object.assign(new Audio('music/lagu.mp3'), { loop: true, volume: 0.55 });
        audio.play().catch(() => {});
      } else {
        await startSynth();
      }
    },
    pause() {
      if (!playing) return;
      playing = false;
      if (audio) audio.pause();
      if (timer) { clearInterval(timer); timer = null; master.gain.setTargetAtTime(0, ctx.currentTime, 0.2); }
    },
    // dipelankan sebentar saat video diputar
    duck(on) {
      if (audio) audio.volume = on ? 0.05 : 0.55;
      if (master) master.gain.setTargetAtTime(on ? 0.03 : 0.7, ctx.currentTime, 0.3);
    },
  };
}
