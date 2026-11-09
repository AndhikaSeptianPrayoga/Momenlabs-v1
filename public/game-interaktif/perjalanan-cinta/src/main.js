// Demo "Perjalanan Cinta" — game 3D kartun: jalan dari awal kenal sampai hari pernikahan.
import * as THREE from 'three';
import { buildWorld, ZONES, pathX } from './world.js';
import { createCharacter, LOOKS } from './character.js';
import { COUPLE, TEXT, CHAPTERS, MEMORIES } from './content.js';
import { dummyPhotoURL, heartTexture, sparkleTexture } from './toon.js';
import { createInput, isTouch } from './input.js';
import { createSfx } from './sfx.js';
import { createMusic } from './music.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const touch = isTouch || params.has('touch');
if (touch) document.body.classList.add('touch');

// ---------- teks awal ----------
$('tDemo').textContent = TEXT.demo; $('tTitle').textContent = TEXT.title; $('tSub').textContent = TEXT.subtitle;
$('tTag').textContent = TEXT.tagline; $('btnStart').textContent = TEXT.start; $('tHint').textContent = touch ? TEXT.hintTouch : TEXT.hint;
$('fAsk').textContent = TEXT.finaleAsk; $('fMsg').placeholder = TEXT.finalePlaceholder; $('fSend').textContent = TEXT.finaleSend;
$('aText').textContent = TEXT.amen; $('aRoam').textContent = TEXT.roam; $('aReplay').textContent = TEXT.replay;
$('fTitle').textContent = `${COUPLE.him} & ${COUPLE.her}`;

await document.fonts.load('700 40px Fredoka').catch(() => {});

// ---------- renderer ----------
const mobile = touch || innerWidth < 800;
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 2 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 600);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

const hemi = new THREE.HemisphereLight('#ffffff', '#9ccf7a', 1.35); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3dc', 2.1);
sun.position.set(-8, 16, 6); sun.castShadow = true;
sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 });
sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

const world = buildWorld(scene);

// ---------- tokoh ----------
const him = createCharacter(LOOKS.cowok); scene.add(him.root);
const her = createCharacter(LOOKS.cewek); scene.add(her.root);
him.root.position.set(pathX(8), 0, 8); him.root.rotation.y = Math.PI;

// tamu di kursi pernikahan
const guests = [];
world.chairs.filter((_, i) => [0, 2, 4, 7, 9, 13, 15, 18, 20, 23].includes(i)).forEach((c, i) => {
  const g = createCharacter(LOOKS.tamu(i)); g.root.position.set(c.x, 0.1, c.z + 0.05); g.root.rotation.y = Math.PI; g.setPose('sit');
  scene.add(g.root); guests.push(g);
});

// potret dialog dibuat dari model 3D-nya sendiri
function portrait(ch) {
  const ps = new THREE.Scene(); ps.background = new THREE.Color('#ffe3ef');
  ps.add(new THREE.HemisphereLight('#ffffff', '#ffd6e0', 1.6)); const dl = new THREE.DirectionalLight('#ffffff', 1.6); dl.position.set(1, 2, 3); ps.add(dl);
  const clone = ch.root.clone(); clone.position.set(0, 0, 0); clone.rotation.set(0, 0.25, 0); ps.add(clone);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20); cam.position.set(0, 1.42, 2.3); cam.lookAt(0, 1.32, 0);
  const S = 256, rt = new THREE.WebGLRenderTarget(S, S, { samples: 4, colorSpace: THREE.SRGBColorSpace });
  renderer.setRenderTarget(rt); renderer.render(ps, cam);
  const px = new Uint8Array(S * S * 4); renderer.readRenderTargetPixels(rt, 0, 0, S, S, px); renderer.setRenderTarget(null);
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) img.data.set(px.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
  g.putImageData(img, 0, 0); rt.dispose();
  return cv.toDataURL();
}
him.update(0.016, 0); her.update(0.016, 0);
const PORTRAIT = { him: portrait(him), her: portrait(her) };
const NAMES = { him: COUPLE.him, her: COUPLE.her };

// ---------- efek partikel (hati & kilau) ----------
const heartTex = heartTexture(), heartTex2 = heartTexture('#ffffff'), sparkTex = sparkleTexture();
const parts = [];
function burst(pos, n = 24, { up = 4, spread = 3, tex = null, size = 0.35 } = {}) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex || [heartTex, heartTex2, sparkTex][i % 3], transparent: true, depthWrite: false }));
    s.position.copy(pos); s.scale.setScalar(size * (0.6 + Math.random() * 0.8));
    s.userData = { v: new THREE.Vector3((Math.random() - 0.5) * spread, up * (0.6 + Math.random() * 0.7), (Math.random() - 0.5) * spread), life: 1.6 + Math.random() };
    scene.add(s); parts.push(s);
  }
}
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const s = parts[i], u = s.userData; u.life -= dt;
    u.v.y -= (u.g ?? 3.2) * dt; if (u.drag) u.v.multiplyScalar(Math.max(0, 1 - u.drag * dt)); s.position.addScaledVector(u.v, dt);
    s.material.opacity = Math.min(1, u.life);
    if (u.life <= 0) { scene.remove(s); s.material.dispose(); parts.splice(i, 1); }
  }
}
// kembang api untuk perayaan
const fwTex = sparkleTexture();
function fireworks(pos, { n = 70, speed = 7, colors = ['#ff5d8f', '#ffd447', '#7fd0ff', '#b58cff', '#ffffff', '#7bd389'] } = {}) {
  const col = colors[Math.floor(Math.random() * colors.length)], col2 = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fwTex, color: i % 3 ? col : col2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    const v = new THREE.Vector3().randomDirection().multiplyScalar(speed * (0.75 + Math.random() * 0.25));
    s.position.copy(pos); s.scale.setScalar(0.9 + Math.random() * 0.6);
    s.userData = { v, life: 1.4 + Math.random() * 0.6, g: 2.2, drag: 1.4 };
    scene.add(s); parts.push(s);
  }
  sfx.play('pop');
}
// penanda interaksi (hati memantul di atas kepala)
const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, depthTest: false, transparent: true }));
marker.scale.setScalar(0.5); marker.renderOrder = 10; scene.add(marker);

// ---------- audio & input ----------
const sfx = createSfx(), music = createMusic();
const input = createInput({ joystick: $('joy'), knob: $('knob'), onAction: () => action() });

// ---------- status permainan ----------
const G = {
  mode: 'title', ch: 0, step: 'talk', score: 0, quizRight: 0, mem: 0, follow: false,
  speed: 0, yaw: Math.PI, stepT: 0, t: 0, cut: null, hearts: [], mgTime: 0,
};
const chapter = () => CHAPTERS[G.ch];
const zoneOf = (id) => ZONES[id];

// posisi Alya untuk tiap bab
function placeHer() {
  const c = chapter(); if (!c || G.follow) return;
  her.setPose(null); her.root.userData.sitting = false;
  if (c.id === 'awal') { her.root.position.set(-3, 0, ZONES.awal.c + 0.6); }
  if (c.id === 'kencan') { her.root.position.set(3.4, 0, ZONES.kencan.c + 2.7); }
  if (c.id === 'jadian') { const b = world.parkBench.position; her.root.position.set(b.x + 0.05, 0.02, b.z + 0.45); her.root.rotation.y = Math.PI / 2; her.setPose('sit'); her.root.userData.sitting = true; }
}
function interactPoint() {
  const c = chapter(); if (!c) return null;
  if (c.proposal) return world.proposalSpot.clone().setY(0);
  if (c.wedding) return new THREE.Vector3(0, 0, ZONES.nikah.c + 10.5);
  return her.root.position.clone();
}

// ---------- UI helpers ----------
function toast(msg, ms = 2200) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms); }
function banner(title, place) {
  $('bTitle').textContent = title; $('bPlace').textContent = place; const b = $('banner');
  b.classList.add('show'); sfx.play('chapter'); clearTimeout(b._h); b._h = setTimeout(() => b.classList.remove('show'), 2800);
}
function hud() {
  const c = chapter();
  $('hChapter').textContent = c ? c.name : '💞 Jalan-jalan';
  $('hMem').textContent = `📷 ${G.mem}/${CHAPTERS.length}`;
  $('hScore').textContent = `💖 ${G.score}`;
}
function addScore(n) { G.score += n; hud(); const h = $('hScore'); h.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 350 }); }

// ---------- dialog ----------
let D = null;
function dialog(lines, done) {
  G.mode = 'dialog'; input.enabled = true; D = { lines, i: -1, done, typing: null };
  $('dialog').hidden = false; $('prompt').hidden = true; sfx.play('dialog'); nextLine();
}
function nextLine() {
  if (D.typing) { clearInterval(D.typing.id); $('dText').textContent = D.typing.full; D.typing = null; return; }
  D.i++;
  if (D.i >= D.lines.length) { $('dialog').hidden = true; him.talk(false); her.talk(false); const d = D.done; D = null; G.mode = 'play'; d?.(); return; }
  const [who, text] = D.lines[D.i];
  $('dName').textContent = NAMES[who]; $('dName').className = who; $('dPortrait').src = PORTRAIT[who];
  him.talk(who === 'him'); her.talk(who === 'her'); sfx.play('line');
  let k = 0; $('dText').textContent = '';
  D.typing = { full: text, id: setInterval(() => { k++; $('dText').textContent = text.slice(0, k); if (k % 2) sfx.play('type'); if (k >= text.length) { clearInterval(D.typing.id); D.typing = null; } }, 28) };
}
$('dialog').addEventListener('click', () => { if (D) nextLine(); });

// ---------- kuis ----------
function quiz(q, done) {
  G.mode = 'quiz'; $('quiz').hidden = false; $('prompt').hidden = true; sfx.play('question');
  $('qText').textContent = q.q; $('qFeed').textContent = ''; $('qOpts').innerHTML = '';
  let tries = 0, locked = false;
  q.options.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'opt'; b.innerHTML = `<b>${'ABCD'[i]}</b><span></span>`; b.lastChild.textContent = o;
    b.onclick = () => {
      if (locked) return;
      if (i === q.answer) {
        locked = true; b.classList.add('right'); sfx.play('right');
        const pts = tries === 0 ? 100 : 50; if (tries === 0) G.quizRight++; addScore(pts);
        $('qFeed').textContent = `Betul! +${pts} poin 🎉`;
        burst(him.root.position.clone().setY(1.8), 18);
        setTimeout(() => { $('quiz').hidden = true; G.mode = 'play'; done(); }, 1100);
      } else {
        tries++; b.classList.add('wrong'); b.disabled = true; sfx.play('wrong');
        $('qFeed').textContent = 'Hmm, kurang tepat. Coba lagi, ya! 😅';
      }
    };
    $('qOpts').appendChild(b);
  });
}

// ---------- foto kenangan ----------
function memory(id, done) {
  const m = MEMORIES[id];
  G.mode = 'memory'; $('memory').hidden = false; $('prompt').hidden = true;
  $('mTitle').textContent = m.title; $('mImg').src = m.photo || dummyPhotoURL(m); $('mCap').textContent = m.caption;
  sfx.play('photo'); world.easels[id]?.reveal(); G.mem++; hud();
  $('mOk').onclick = () => { sfx.play('click'); $('memory').hidden = true; G.mode = 'play'; done?.(); };
}

// ---------- alur bab ----------
function finishChapter() {
  const c = chapter();
  memory(c.id, () => {
    const gate = world.gates[G.ch];
    if (gate) { gate.openIt(); sfx.play('gate'); burst(new THREE.Vector3(gate.x, 1.4, gate.z), 30, { up: 5 }); toast('Jalan ke bab berikutnya terbuka! ➜'); }
    if (c.follow) { G.follow = true; her.setPose(null); her.root.userData.sitting = false; }
    G.ch++; G.step = 'talk'; placeHer(); hud();
    if (c.wedding) startFinale();
  });
}

function action() {
  if (G.mode === 'dialog') { nextLine(); return; }
  if (G.mode === 'memory') { $('mOk').click(); return; }
  if (G.mode !== 'play' || !G.near) return;
  sfx.play('click');
  const c = chapter();
  faceEachOther();
  dialog(c.dialog, () => {
    if (c.minigame) startMinigame(c, () => quiz(c.quiz, finishChapter));
    else if (c.proposal) quiz(c.quiz, () => proposal(finishChapter));
    else if (c.wedding) quiz(c.quiz, () => weddingWalk(finishChapter));
    else quiz(c.quiz, finishChapter);
  });
}
$('prompt').addEventListener('click', () => action());

function faceEachOther() {
  const a = him.root.position, b = her.root.position;
  if (chapter()?.wedding || chapter()?.proposal) return;
  G.yaw = Math.atan2(b.x - a.x, b.z - a.z); him.root.rotation.y = G.yaw;
  if (her.root.userData.sitting) return;
  if (chapter()?.id !== 'jadian') her.root.rotation.y = Math.atan2(a.x - b.x, a.z - b.z);
}

// ---------- mini game: kumpulkan hati ----------
function startMinigame(c, done) {
  G.mode = 'minigame';
  toast(c.minigame.intro, 2600); sfx.play('fanfare');
  if (!G.hearts.length) G.hearts = world.spawnHearts(c.minigame.count, ZONES.kencan.c);
  G.mgTime = c.minigame.time; G.mgDone = done; G.mgTotal = c.minigame.count;
  $('mg').hidden = false; updMg();
}
function updMg() { $('mgCount').textContent = `💗 ${G.mgTotal - G.hearts.length}/${G.mgTotal}`; $('mgTime').textContent = `⏱ ${Math.ceil(G.mgTime)}`; }
function tickMinigame(dt) {
  G.mgTime -= dt;
  const p = him.root.position;
  for (let i = G.hearts.length - 1; i >= 0; i--) {
    const h = G.hearts[i];
    h.rotation.y += dt * 2.5; h.position.y = 0.8 + Math.sin(G.t * 3 + i) * 0.15;
    if (Math.hypot(h.position.x - p.x, h.position.z - p.z) < 1.0) {
      burst(h.position, 10, { size: 0.3 }); scene.remove(h); G.hearts.splice(i, 1); sfx.play('collect'); addScore(10);
    }
  }
  if (!G.hearts.length) {
    $('mg').hidden = true; G.mode = 'play'; sfx.play('success'); toast('Yeay, semua hati terkumpul! 💖');
    // kembali ke dekat Alya untuk kuis
    const h = her.root.position;
    for (const [ox, oz] of [[-1.6, 0], [0, 1.6], [1.6, 0], [0, -1.6]]) if (world.walkable(h.x + ox, h.z + oz)) { him.root.position.set(h.x + ox, 0, h.z + oz); break; }
    faceEachOther(); setTimeout(() => G.mgDone(), 700); return;
  }
  if (G.mgTime <= 0) { G.mgTime = 20; toast('Waktu habis — ditambah 20 detik, semangat! 💪'); sfx.play('wrong'); }
  updMg();
}

// ---------- adegan lamaran ----------
function proposal(done) {
  const s = world.proposalSpot;
  G.mode = 'cut'; input.enabled = false;
  him.root.position.set(s.x, 0, s.z + 0.7); G.yaw = Math.PI; him.root.rotation.y = Math.PI;
  her.root.position.set(s.x, 0, s.z - 0.75); her.root.rotation.y = 0; her.setPose(null);
  // kotak cincin di tangan Raka
  const box = new THREE.Group();
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.16), new THREE.MeshToonMaterial({ color: '#e8423f' })); lid.position.y = 0.09; lid.rotation.x = -1.1; box.add(lid);
  box.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.16), new THREE.MeshToonMaterial({ color: '#e8423f' })));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 20), new THREE.MeshToonMaterial({ color: '#ffd447', emissive: '#ffcc33', emissiveIntensity: 0.5 })); ring.position.y = 0.09; box.add(ring);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.03), new THREE.MeshBasicMaterial({ color: '#e6fbff' })); gem.position.y = 0.14; box.add(gem);
  scene.add(box);
  G.cut = {
    t: 0, done, box,
    cam: () => { const d = camera.aspect < 1 ? 5.4 : 3.2; return { pos: new THREE.Vector3(s.x + d, 1.7, s.z + 0.1), look: new THREE.Vector3(s.x, 0.95, s.z) }; },
    update(dt) {
      const k = this.t;
      if (k > 0.4) him.setPose('kneel');
      box.position.set(s.x, 0.62 + Math.min(1, k) * 0.15, s.z + 0.28); box.rotation.y = k;
      if (k > 1.6 && !this.a) { this.a = 1; her.setPose('hands'); sfx.play('pop'); }
      if (k > 3.0 && !this.b) { this.b = 1; her.setPose('cheer'); her.hop(); burst(new THREE.Vector3(s.x, 1.8, s.z), 50, { up: 6, spread: 4 }); sfx.play('cheer'); }
      if (k > 5.2) { him.setPose(null); her.setPose(null); scene.remove(box); input.enabled = true; G.mode = 'play'; G.cut = null; done(); }
    },
  };
}

// ---------- adegan pernikahan ----------
function weddingWalk(done) {
  G.mode = 'cut'; input.enabled = false; G.follow = false;
  const z0 = ZONES.nikah.c + 10, z1 = world.archPos.z + 1.4;
  G.cut = {
    t: 0, done,
    cam(t) {
      const k = Math.min(1, t / 7), z = z0 + (z1 - z0) * k;
      return t < 7.5
        ? { pos: new THREE.Vector3(0.9, 2.5, z - 4.2), look: new THREE.Vector3(0, 1.1, z + 0.5) }
        : { pos: new THREE.Vector3(0.5, 2.2, z1 - 5.5), look: new THREE.Vector3(0, 1.2, z1) };
    },
    update(dt) {
      const t = this.t, k = Math.min(1, t / 7), z = z0 + (z1 - z0) * k, moving = t < 7;
      him.root.position.set(0.42, 0, z); her.root.position.set(-0.42, 0, z);
      him.root.rotation.y = her.root.rotation.y = Math.PI; G.yaw = Math.PI;
      G.npcSpeed = moving ? 1.0 : 0; G.speed = moving ? 1.0 : 0;
      if (t > 0.3 && !this.a) { this.a = 1; guests.forEach((g, i) => setTimeout(() => { g.setPose('cheer'); }, i * 120)); sfx.play('cheer'); }
      if (moving && Math.floor(t * 3) !== this.pf) { this.pf = Math.floor(t * 3); burst(new THREE.Vector3((Math.random() - 0.5) * 4, 3.5, z - 1), 4, { up: 0.5, spread: 1.5, size: 0.25 }); }
      if (t > 7.4 && !this.b) { this.b = 1; him.root.rotation.y = -Math.PI / 2; her.root.rotation.y = Math.PI / 2; }
      if (t > 7.6) { him.root.rotation.y = -Math.PI / 2; her.root.rotation.y = Math.PI / 2; G.yaw = -Math.PI / 2; }
      if (t > 8.2 && !this.c) { this.c = 1; burst(new THREE.Vector3(0, 2.2, z1), 70, { up: 7, spread: 5, size: 0.4 }); sfx.play('burst'); him.hop(); her.hop(); }
      if (t > 10.5) { guests.forEach((g) => g.setPose('sit')); G.npcSpeed = 0; G.speed = 0; G.cut = null; G.mode = 'play'; input.enabled = true; done(); }
    },
  };
}

function startFinale() {
  G.mode = 'finale'; input.enabled = false;
  $('fScore').textContent = G.score; $('fQuiz').textContent = `${G.quizRight}/${CHAPTERS.length}`; $('fMem').textContent = `${G.mem}/${CHAPTERS.length}`;
  setTimeout(() => { $('finale').hidden = false; sfx.play('fanfare'); }, 400);
}
$('fSend').addEventListener('click', () => {
  const msg = $('fMsg').value.trim();
  if (!msg) { $('fMsg').focus(); toast('Tulis pesannya dulu, ya ✍️'); return; }
  $('finale').hidden = true; sfx.play('whoosh');
  const f = document.createElement('div'); f.id = 'fly'; f.textContent = `💌 ${msg}`; document.body.appendChild(f);
  G.sky = { t: 0 };
  // lentera cahaya naik ke langit dari tempat pengantin berdiri
  const p = him.root.position.clone().add(her.root.position).multiplyScalar(0.5).setY(1.8);
  const lantern = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  lantern.position.copy(p); lantern.scale.setScalar(1.6); scene.add(lantern); G.sky.lantern = lantern;
  setTimeout(() => { f.remove(); $('amen').hidden = false; sfx.play('success'); burst(p, 40, { up: 6, spread: 4 }); }, 3400);
});
$('aRoam').addEventListener('click', () => {
  sfx.play('click'); $('amen').hidden = true; G.mode = 'play'; input.enabled = true; G.follow = true; G.sky = null; hud();
  toast('Selamat jalan-jalan berdua! 💞');
});
$('aReplay').addEventListener('click', () => { location.href = location.pathname; });

// ---------- mulai ----------
placeHer();
$('loading').hidden = true; $('btnStart').hidden = false;
$('btnStart').addEventListener('click', () => {
  sfx.unlock(); sfx.play('open'); music.play();
  $('title').hidden = true; $('hud').hidden = false; G.mode = 'play'; placeHer(); hud();
  setTimeout(() => banner(chapter().name, chapter().place), 500);
});
// lompat ke bab tertentu (pengujian ?bab=3, dan dipakai perekam video)
function jumpTo(bab) {
  const n = Math.min(CHAPTERS.length, Math.max(1, bab)) - 1;
  for (let i = G.ch; i < n; i++) { world.gates[i]?.openIt(); world.easels[CHAPTERS[i].id].reveal(); G.mem++; if (CHAPTERS[i].follow) G.follow = true; }
  G.ch = n; G.step = 'talk'; const z = n ? world.gates[n - 1].z - 2 : 6; him.root.position.set(pathX(z), 0, z);
  if (G.follow) { her.setPose(null); her.root.userData.sitting = false; her.root.position.set(pathX(z) + 1, 0, z + 1); } else placeHer();
  hud();
}
if (params.has('bab')) jumpTo(+params.get('bab'));

if (params.has('skip')) $('btnStart').click();


// ---------- loop ----------
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
let lastChapterSeen = -1;
const clock = new THREE.Clock();
camPos.set(him.root.position.x, 7, him.root.position.z + 9); camLook.copy(him.root.position);

function update(dt) {
  G.t += dt;
  const p = him.root.position;

  // gerak pemain
  let speed = 0;
  if ((G.mode === 'play' || G.mode === 'minigame') && input.enabled) {
    const i = input.read();
    if (i.mag > 0) {
      const sp = (i.run ? 5.2 : 3.2) * i.mag;
      const want = Math.atan2(i.x, i.z);
      let d = want - G.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); G.yaw += d * Math.min(1, dt * 12);
      const nx = p.x + Math.sin(want) * sp * dt, nz = p.z + Math.cos(want) * sp * dt;
      if (world.walkable(nx, nz)) { p.x = nx; p.z = nz; speed = sp; }
      else if (world.walkable(nx, p.z)) { p.x = nx; speed = sp * 0.6; }
      else if (world.walkable(p.x, nz)) { p.z = nz; speed = sp * 0.6; }
      else {
        const g = world.gates.find((g) => !g.open && Math.abs(nz - g.z) < 0.8);
        if (g && !G.gateWarn) { G.gateWarn = 1; toast(`🔒 ${TEXT.locked}`); setTimeout(() => (G.gateWarn = 0), 2500); }
      }
      him.root.rotation.y = G.yaw;
    }
  } else if (G.mode === 'cut') speed = G.speed || 0;
  G.speed = G.mode === 'cut' ? G.speed : speed;
  him.update(dt, speed);

  // langkah kaki
  if (speed > 0.3) { G.stepT -= dt * (speed / 3.2); if (G.stepT <= 0) { G.stepT = 0.34; sfx.step(Math.abs(p.x - pathX(p.z)) < 2 ? 'gravel' : 'grass', 0.8); } }

  // Alya: diam di tempat, atau ikut berjalan setelah jadian
  let herSpeed = 0;
  if (G.mode === 'cut') herSpeed = G.npcSpeed || 0;
  else if (G.follow) {
    const h = her.root.position, side = new THREE.Vector3(Math.cos(G.yaw), 0, -Math.sin(G.yaw));
    const goal = p.clone().addScaledVector(side, -0.9).add(new THREE.Vector3(-Math.sin(G.yaw) * 0.5, 0, -Math.cos(G.yaw) * 0.5));
    const dx = goal.x - h.x, dz = goal.z - h.z, d = Math.hypot(dx, dz);
    if (d > 0.35) {
      herSpeed = Math.min(5.5, d * 2.6); const nx = h.x + (dx / d) * herSpeed * dt, nz = h.z + (dz / d) * herSpeed * dt;
      if (world.walkable(nx, nz) || d > 4) { h.x = nx; h.z = nz; } else herSpeed = 0;
      her.root.rotation.y = Math.atan2(dx, dz);
    } else her.root.rotation.y += Math.atan2(Math.sin(G.yaw - her.root.rotation.y), Math.cos(G.yaw - her.root.rotation.y)) * Math.min(1, dt * 4);
    if (d > 14) h.set(p.x - 1, 0, p.z + 1);
  } else if (G.mode === 'play' && chapter() && chapter().id !== 'jadian') {
    const h = her.root.position;
    if (Math.hypot(p.x - h.x, p.z - h.z) < 6) {
      const want = Math.atan2(p.x - h.x, p.z - h.z), cur = her.root.rotation.y;
      her.root.rotation.y = cur + Math.atan2(Math.sin(want - cur), Math.cos(want - cur)) * Math.min(1, dt * 4);
    }
  }
  her.update(dt, herSpeed);
  for (const g of guests) if (Math.abs(g.root.position.z - p.z) < 30) g.update(dt, 0);

  // bab baru saat melewati gerbang
  const c = chapter();
  if (c && G.mode === 'play' && lastChapterSeen !== G.ch) {
    const zc = zoneOf(c.id).c;
    if (p.z < zc + 12) { lastChapterSeen = G.ch; if (G.ch > 0) banner(c.name, c.place); }
  }

  // titik interaksi
  const ip = interactPoint();
  G.near = false;
  if (ip && G.mode === 'play' && G.step === 'talk') {
    const d = Math.hypot(p.x - ip.x, p.z - ip.z);
    G.near = d < (c.wedding || c.proposal ? 2.2 : 2.8);
    marker.visible = true;
    marker.position.set(ip.x, (c.wedding || c.proposal ? 1.4 : her.root.userData.sitting ? 2.0 : 2.25) + Math.sin(G.t * 4) * 0.12, ip.z);
    if (c.id === 'jadian') marker.position.y = 2.0 + Math.sin(G.t * 4) * 0.12;
  } else marker.visible = false;
  $('prompt').hidden = !G.near;
  if (G.near) $('pText').textContent = `💬 ${c.talk}`;

  if (G.mode === 'minigame') tickMinigame(dt);
  if (G.cut) { G.cut.t += dt; G.cut.update(dt); }
  if (G.sky?.lantern) { const l = G.sky.lantern; l.position.y += dt * 4; l.material.opacity = Math.max(0, 1 - (l.position.y - 2) / 30); if (l.position.y > 34) { scene.remove(l); G.sky.lantern = null; } }

  world.update(G.t, dt);
  updateParts(dt);

  // kamera
  let wantPos, wantLook, rate = 4;
  if (G.cut) { const v = G.cut.cam(G.cut.t); wantPos = v.pos; wantLook = v.look; rate = 2.5; }
  else if (G.mode === 'dialog' || G.mode === 'quiz' || (G.mode === 'memory' && D)) {
    // dari balik bahu pemain, menghadap lawan bicara
    const target = c?.wedding ? new THREE.Vector3(0, 0, world.archPos.z) : her.root.position;
    const dir = new THREE.Vector3(target.x - p.x, 0, target.z - p.z); const len = dir.length() || 1; dir.divideScalar(len);
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const portraitCam = camera.aspect < 1;
    wantPos = p.clone().addScaledVector(dir, portraitCam ? -3.3 : -2.5).addScaledVector(side, portraitCam ? 0.8 : 1.25).setY(portraitCam ? 2.4 : 2.15);
    wantLook = p.clone().addScaledVector(dir, Math.min(len, 3) * 0.75).setY(1.2); rate = 3;
  } else if (G.sky) {
    wantPos = new THREE.Vector3(0.5, 1.6, world.archPos.z + 7); wantLook = new THREE.Vector3(0, 6 + Math.min(10, G.sky.t * 3), world.archPos.z - 10); G.sky.t += dt; rate = 1.5;
  } else {
    const far = mobile && innerHeight > innerWidth ? 1.25 : 1;
    wantPos = new THREE.Vector3(p.x, 7.2 * far, p.z + 9.5 * far); wantLook = new THREE.Vector3(p.x, 0.9, p.z - 1.5);
  }
  const k = G.snap ? 1 : 1 - Math.exp(-dt * rate); G.snap = false;
  camPos.lerp(wantPos, k); camLook.lerp(wantLook, k);
  camera.position.copy(camPos); camera.lookAt(camLook);

  // bayangan mengikuti pemain
  sun.position.set(p.x - 8, 16, p.z + 6); sun.target.position.set(p.x, 0, p.z);
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(0.05, clock.getDelta());
  update(dt);
  renderer.render(scene, camera);
});
window.__demo = { G, scene, hemi, sun, world, him, her, burst, fireworks, jumpTo, input, sfx, dialog, proposal, weddingWalk, startMinigame, startFinale, CHAPTERS, ZONES, pathX, snapCamera: () => { G.snap = true; } };
if (params.has('rekam')) import('./director.js');
