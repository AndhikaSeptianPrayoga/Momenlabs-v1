// Dunia kartun: jalan berkelok melewati 5 bab (perpustakaan, warung, taman, pantai, taman pernikahan).
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
import { toon, part, outline, signTexture, dummyPhotoTexture, heartGeometry, heartTexture } from './toon.js';
import { MEMORIES } from './content.js';

export const ZONES = {
  start: -2,
  awal: { c: -15, gate: -28 },
  kencan: { c: -42, gate: -56 },
  jadian: { c: -70, gate: -84 },
  lamaran: { c: -98, gate: -112 },
  nikah: { c: -130, end: -146 },
};
export const pathX = (z) => Math.sin(z * 0.045) * 2.2;

const RB = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 3, r);
const rand = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

export function buildWorld(scene) {
  const colliders = [];   // lingkaran penghalang {x, z, r}
  const anim = [];        // fungsi animasi per frame
  const add = (o, parent = scene) => { parent.add(o); return o; };
  const block = (x, z, r) => colliders.push({ x, z, r });

  // ---------- langit ----------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color('#59b8ff') }, mid: { value: new THREE.Color('#a8dcff') }, bot: { value: new THREE.Color('#ffe3ef') } },
    vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, mid, bot; varying vec3 vp;
      void main(){ float h = vp.y; vec3 c = mix(bot, mid, smoothstep(-0.02, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.6, h)); gl_FragColor = vec4(c, 1.); }`,
  }));
  sky.renderOrder = -1; add(sky);
  scene.fog = new THREE.Fog('#ffe3ef', 70, 170);

  // ---------- tanah ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 360).rotateX(-Math.PI / 2), toon('#8ed36b'));
  ground.position.set(0, 0, -70); ground.receiveShadow = true; add(ground);
  // bercak rumput lebih tua supaya tidak polos
  {
    const g = new THREE.CircleGeometry(1, 18).rotateX(-Math.PI / 2);
    const im = new THREE.InstancedMesh(g, toon('#7cc35c'), 90), m = new THREE.Matrix4();
    for (let i = 0; i < 90; i++) {
      const x = (rand() - 0.5) * 70, z = 10 - rand() * 160, s = 1.5 + rand() * 4;
      m.compose(new THREE.Vector3(x, 0.005, z), new THREE.Quaternion(), new THREE.Vector3(s, 1, s * (0.5 + rand() * 0.6)));
      im.setMatrixAt(i, m);
    }
    im.receiveShadow = true; add(im);
  }

  // ---------- jalan setapak ----------
  {
    const pts = [], W = 1.8, segs = 180, z0 = 12, z1 = ZONES.nikah.c + 13;
    const pos = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const z = z0 + (z1 - z0) * (i / segs), x = pathX(z);
      pos.push(x - W, 0.02, z, x + W, 0.02, z);
      pts.push([x, z]);
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const road = new THREE.Mesh(g, toon('#f4dca6', { side: THREE.DoubleSide })); road.receiveShadow = true; add(road);
    // batu pijakan di tepi jalan
    const sg = new THREE.CylinderGeometry(0.22, 0.26, 0.08, 9);
    const im = new THREE.InstancedMesh(sg, toon('#e2c48b'), 160), m = new THREE.Matrix4();
    let n = 0;
    for (let z = z0; z > z1 && n < 160; z -= 1.9) {
      for (const sx of [-1, 1]) { if (n >= 160) break; m.compose(new THREE.Vector3(pathX(z) + sx * (W + 0.25), 0.03, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); im.setMatrixAt(n++, m); }
    }
    im.count = n; im.receiveShadow = true; add(im);
  }
  const plaza = (x, z, r, color = '#f4dca6') => { const p = new THREE.Mesh(new THREE.CircleGeometry(r, 40).rotateX(-Math.PI / 2), toon(color)); p.position.set(x, 0.018, z); p.receiveShadow = true; add(p); return p; };

  // ---------- pohon, semak, bunga (instanced supaya ringan di HP) ----------
  const treeSpots = [];
  for (let z = 14; z > -152; z -= 3.2) {
    for (const sx of [-1, 1]) {
      if (sx > 0 && z < -84 && z > -114) continue;            // sisi laut di bab pantai
      const x = sx * (13 + rand() * 14);
      treeSpots.push([x, z + rand() * 2]);
    }
  }
  for (let i = 0; i < 22; i++) treeSpots.push([(rand() - 0.5) * 50, 18 + rand() * 20]);
  for (let i = 0; i < 18; i++) treeSpots.push([(rand() - 0.5) * 60, -150 - rand() * 25]);
  {
    const n = treeSpots.length;
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.24, 1.6, 8), toon('#8a5a3b'), n);
    const crown = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), toon('#ffffff'), n * 3);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    const greens = ['#4fb35a', '#5fc46a', '#3fa152', '#7fd36b', '#58b86e'];
    treeSpots.forEach(([x, z], i) => {
      const s = 0.9 + rand() * 0.7;
      m.compose(new THREE.Vector3(x, 0.8 * s, z), q, new THREE.Vector3(s, s, s)); trunk.setMatrixAt(i, m);
      const blobs = [[0, 2.1, 0, 1.15], [0.55, 1.75, 0.2, 0.8], [-0.5, 1.8, -0.15, 0.85]];
      blobs.forEach(([bx, by, bz, bs], k) => {
        m.compose(new THREE.Vector3(x + bx * s, by * s, z + bz * s), q, new THREE.Vector3(bs * s, bs * s * 0.92, bs * s)); crown.setMatrixAt(i * 3 + k, m);
        crown.setColorAt(i * 3 + k, c.set(greens[(i + k) % greens.length]));
      });
      block(x, z, 0.5 * s);
    });
    trunk.castShadow = crown.castShadow = true;
    outline(trunk, 0.04); outline(crown, 0.05);
    add(trunk); add(crown);
  }
  {
    const n = 140, im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 9), toon('#ffffff'), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const z = 12 - rand() * 160, side = rand() < 0.5 ? -1 : 1;
      if (side > 0 && z < -84 && z > -114) { im.setMatrixAt(i, m.makeScale(0, 0, 0)); continue; }
      const x = pathX(z) + side * (4 + rand() * 7), s = 0.35 + rand() * 0.45;
      m.compose(new THREE.Vector3(x, s * 0.55, z), q, new THREE.Vector3(s * 1.3, s, s * 1.1)); im.setMatrixAt(i, m);
      im.setColorAt(i, c.set(['#4fb35a', '#64c46c', '#8bd46f'][i % 3]));
    }
    im.castShadow = true; outline(im, 0.06); add(im);
  }
  {
    const n = 420, im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), toon('#ffffff', { emissive: '#ffffff', ei: 0.15 }), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    const cols = ['#ff7aa2', '#ffd447', '#ffffff', '#b58cff', '#ff9a5c', '#7fd0ff'];
    for (let i = 0; i < n; i++) {
      const z = 12 - rand() * 162, side = rand() < 0.5 ? -1 : 1;
      let x = pathX(z) + side * (2.6 + rand() * 9);
      if (side > 0 && z < -84 && z > -114) x = pathX(z) - (2.6 + rand() * 6);
      m.compose(new THREE.Vector3(x, 0.12, z), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m);
      im.setColorAt(i, c.set(cols[i % cols.length]));
    }
    add(im);
  }
  // bukit di kejauhan
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, r = 120;
    const h = part(new THREE.SphereGeometry(1, 20, 12), ['#76c46a', '#88d077', '#6bb862'][i % 3], { w: 0, shadow: false });
    h.scale.set(30 + rand() * 20, 14 + rand() * 10, 26); h.position.set(Math.cos(a) * r, -4, -70 + Math.sin(a) * r * 1.3); add(h);
  }
  // awan
  const clouds = new THREE.Group(); add(clouds);
  for (let i = 0; i < 14; i++) {
    const cl = new THREE.Group();
    for (let k = 0; k < 4; k++) { const b = part(new THREE.SphereGeometry(1, 14, 10), '#ffffff', { w: 0.05, shadow: false, opts: { emissive: '#ffffff', ei: 0.35 } }); b.position.set(k * 1.3 - 2, Math.sin(k * 2) * 0.3, rand() * 0.6); b.scale.setScalar(1 + (k % 2) * 0.5); cl.add(b); }
    cl.position.set((rand() - 0.5) * 120, 22 + rand() * 12, 20 - rand() * 190); cl.scale.setScalar(1.2 + rand());
    clouds.add(cl);
  }
  anim.push((t, dt) => { for (const cl of clouds.children) { cl.position.x += dt * 0.6; if (cl.position.x > 70) cl.position.x = -70; } });

  // lampu taman di sepanjang jalan
  const lamp = (x, z) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const post = part(new THREE.CylinderGeometry(0.06, 0.09, 2.4, 10), '#3e3550', { w: 0.02 }); post.position.y = 1.2; g.add(post);
    const head = part(new THREE.SphereGeometry(0.2, 14, 10), '#fff2b0', { w: 0.02, opts: { emissive: '#ffe28a', ei: 0.8 } }); head.position.y = 2.5; g.add(head);
    const capm = part(new THREE.ConeGeometry(0.24, 0.18, 12), '#3e3550', { w: 0.02 }); capm.position.y = 2.72; g.add(capm);
    add(g); block(x, z, 0.2); return g;
  };
  for (let z = 4; z > ZONES.nikah.c + 14; z -= 9) lamp(pathX(z) + (z % 18 === 0 ? 2.6 : -2.6), z);

  // ---------- kanvas foto kenangan (tertutup sampai bab selesai) ----------
  const easels = {};
  const coverTex = signTexture('?', { w: 256, h: 192, bg: '#ffe9f1', fg: '#c9577a' });
  const easel = (id, x, z, yaw = 0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw;
    for (const sx of [-1, 1]) { const leg = part(new THREE.BoxGeometry(0.07, 1.9, 0.07), '#9a6a43', { w: 0.015 }); leg.position.set(sx * 0.55, 0.9, 0); leg.rotation.z = -sx * 0.08; g.add(leg); }
    const back = part(new THREE.BoxGeometry(0.07, 1.9, 0.07), '#9a6a43', { w: 0.015 }); back.position.set(0, 0.85, -0.35); back.rotation.x = 0.35; g.add(back);
    const frame = part(RB(1.5, 1.2, 0.08, 0.03), '#ffffff', { w: 0.02 }); frame.position.set(0, 1.45, 0.06); g.add(frame);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.99), new THREE.MeshBasicMaterial({ map: coverTex, toneMapped: false }));
    photo.position.set(0, 1.47, 0.105); g.add(photo);
    const ledge = part(new THREE.BoxGeometry(1.3, 0.06, 0.18), '#9a6a43', { w: 0.015 }); ledge.position.set(0, 0.82, 0.08); g.add(ledge);
    add(g); block(x, z, 0.6);
    easels[id] = {
      group: g,
      reveal() { photo.material.map = dummyPhotoTexture(MEMORIES[id]); photo.material.needsUpdate = true; },
    };
  };

  // ---------- gerbang pita antar bab ----------
  const gates = [];
  const heartGeo = heartGeometry(0.42, 0.16);
  const gate = (z) => {
    const x = pathX(z), g = new THREE.Group(); g.position.set(x, 0, z); add(g);
    for (const sx of [-1, 1]) {
      const p = part(new THREE.CylinderGeometry(0.14, 0.17, 2.2, 12), '#ffffff', { w: 0.025 }); p.position.set(sx * 2.6, 1.1, 0); g.add(p);
      const top = part(new THREE.SphereGeometry(0.22, 14, 10), '#ff6f9a', { w: 0.02 }); top.position.set(sx * 2.6, 2.32, 0); g.add(top);
    }
    const ribbon = new THREE.Group(); g.add(ribbon);
    for (const sx of [-1, 1]) { const r = part(new THREE.BoxGeometry(2.3, 0.16, 0.04), '#ff8fb1', { w: 0.015 }); r.position.set(sx * 1.3, 1.2, 0); r.rotation.z = sx * 0.08; ribbon.add(r); }
    const heart = part(heartGeo, '#ff4f81', { w: 0.03 }); heart.position.set(0, 1.25, 0.05); heart.rotation.z = Math.PI; ribbon.add(heart);
    const lock = part(new THREE.TorusGeometry(0.1, 0.03, 8, 16, Math.PI), '#ffd447', { w: 0.012 }); lock.position.set(0, 1.62, 0.05); ribbon.add(lock);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: signTexture('Selesaikan bab ini dulu', { w: 640, h: 160 }), toneMapped: false }));
    sign.position.set(0, 0.62, 0.06); ribbon.add(sign);
    const st = { open: false, k: 0 };
    anim.push((t, dt) => {
      heart.rotation.y = Math.sin(t * 2 + z) * 0.3;
      if (st.open && st.k < 1) { st.k = Math.min(1, st.k + dt * 1.4); ribbon.scale.setScalar(1 - st.k); ribbon.position.y = st.k * 1.5; ribbon.rotation.z = st.k * 2; }
    });
    const gt = { z, x, get open() { return st.open; }, openIt() { st.open = true; } };
    gates.push(gt); return gt;
  };

  // ================= BAB 1 · Perpustakaan kampus =================
  const Z1 = ZONES.awal.c;
  plaza(pathX(Z1) - 1, Z1, 6.5);
  {
    const g = new THREE.Group(); g.position.set(-10.5, 0, Z1); g.rotation.y = Math.PI / 2; add(g);
    const wall = part(RB(7, 3.6, 5, 0.15), '#fff1d6', { w: 0.04 }); wall.position.y = 1.8; g.add(wall);
    const roof = part(new THREE.CylinderGeometry(3.1, 3.1, 7.6, 3, 1).rotateZ(Math.PI / 2).rotateX(Math.PI / 6), '#e05a5a', { w: 0.05 });
    roof.scale.set(1, 0.55, 1); roof.position.set(0, 4.35, 0); roof.rotation.x = 0; g.add(roof);
    const door = part(RB(1.3, 2.1, 0.2, 0.06), '#8a5236', { w: 0.03 }); door.position.set(0, 1.05, 2.55); g.add(door);
    const knob = part(new THREE.SphereGeometry(0.07, 10, 8), '#ffd447', { w: 0.01 }); knob.position.set(0.42, 1.05, 2.68); g.add(knob);
    for (const sx of [-1, 1]) {
      const win = part(RB(1.2, 1.1, 0.12, 0.05), '#8fd6ff', { w: 0.03, opts: { emissive: '#bfe9ff', ei: 0.3 } }); win.position.set(sx * 2.2, 2.0, 2.53); g.add(win);
      const bar = part(new THREE.BoxGeometry(0.06, 1.1, 0.06), '#ffffff', { w: 0 }); bar.position.set(sx * 2.2, 2.0, 2.6); g.add(bar);
      const col = part(new THREE.CylinderGeometry(0.16, 0.18, 3.4, 12), '#ffffff', { w: 0.025 }); col.position.set(sx * 1.05, 1.7, 2.75); g.add(col);
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.7), new THREE.MeshBasicMaterial({ map: signTexture('PERPUSTAKAAN', { w: 768, h: 160, bg: '#5a2f22', fg: '#ffe9b8' }), toneMapped: false }));
    sign.position.set(0, 3.25, 2.56); g.add(sign);
    const step = part(RB(3, 0.25, 1.2, 0.05), '#d9c7a8', { w: 0.02 }); step.position.set(0, 0.12, 3.0); g.add(step);
    for (let z = Z1 - 3.4; z <= Z1 + 3.4; z += 1.1) block(-8.3, z, 0.9);
  }
  // kereta buku & tumpukan buku
  const books = (x, z, n, yaw = 0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; add(g);
    const cols = ['#e85d75', '#4fa3e8', '#ffd447', '#6cc56f', '#b58cff', '#ff9a5c'];
    for (let i = 0; i < n; i++) { const b = part(RB(0.5, 0.12, 0.36, 0.02), cols[i % cols.length], { w: 0.012 }); b.position.y = 0.06 + i * 0.125; b.rotation.y = (rand() - 0.5) * 0.5; g.add(b); }
    block(x, z, 0.35); return g;
  };
  {
    const cart = new THREE.Group(); cart.position.set(-4.6, 0, Z1 - 1.8); cart.rotation.y = 0.3; add(cart);
    const box = part(RB(1.6, 0.7, 0.8, 0.05), '#b57846', { w: 0.025 }); box.position.y = 0.75; cart.add(box);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = part(new THREE.TorusGeometry(0.13, 0.05, 8, 16), '#3e3550', { w: 0.01 }); w.position.set(sx * 0.6, 0.18, sz * 0.38); cart.add(w); }
    const cols = ['#e85d75', '#4fa3e8', '#ffd447', '#6cc56f', '#b58cff'];
    for (let i = 0; i < 9; i++) { const b = part(RB(0.13, 0.42, 0.32, 0.02), cols[i % 5], { w: 0.01 }); b.position.set(-0.6 + i * 0.15, 1.3, 0); b.rotation.z = (rand() - 0.5) * 0.25; cart.add(b); }
    block(-4.6, Z1 - 1.8, 1.0);
    books(-5.2, Z1 + 2.4, 5); books(3.6, Z1 + 3.6, 4, 0.7);
  }
  // bangku & papan pengumuman kampus
  const bench = (x, z, yaw) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; add(g);
    const seat = part(RB(2, 0.12, 0.6, 0.04), '#c9844f', { w: 0.02 }); seat.position.y = 0.48; g.add(seat);
    const back = part(RB(2, 0.5, 0.1, 0.04), '#c9844f', { w: 0.02 }); back.position.set(0, 0.85, -0.26); back.rotation.x = -0.12; g.add(back);
    for (const sx of [-1, 1]) { const l = part(new THREE.BoxGeometry(0.1, 0.48, 0.5), '#3e3550', { w: 0.015 }); l.position.set(sx * 0.85, 0.24, 0); g.add(l); }
    block(x, z, 0.9); return g;
  };
  bench(4.5, Z1 - 4, -Math.PI / 2);
  easel('awal', 4.2, Z1 + 0.6, -Math.PI / 2 + 0.25);

  // ================= BAB 2 · Warung mie ayam =================
  const Z2 = ZONES.kencan.c;
  plaza(pathX(Z2) + 1.5, Z2, 6.5, '#f0d39a');
  {
    const cx = 6.2, cz = Z2 - 1;
    const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = -Math.PI / 2 - 0.2; add(g);
    const body = part(RB(2.6, 1.1, 1.2, 0.08), '#ffd447', { w: 0.03 }); body.position.y = 0.95; g.add(body);
    const stripe = part(RB(2.62, 0.18, 1.22, 0.04), '#e8423f', { w: 0 }); stripe.position.y = 1.2; g.add(stripe);
    const glass = new THREE.Mesh(RB(1.4, 0.7, 0.9, 0.05), new THREE.MeshToonMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.55 })); glass.position.set(-0.4, 1.85, 0); g.add(glass); outline(glass, 0.02);
    for (let i = 0; i < 3; i++) { const bowl = part(new THREE.SphereGeometry(0.16, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#ffffff', { w: 0.01 }); bowl.position.set(-0.8 + i * 0.4, 1.72, 0); bowl.rotation.x = Math.PI; g.add(bowl); }
    for (const sx of [-1, 1]) { const w = part(new THREE.TorusGeometry(0.28, 0.08, 10, 20), '#3e3550', { w: 0.015 }); w.position.set(sx * 0.8, 0.3, 0.62); g.add(w); }
    const pole = part(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), '#ffffff', { w: 0.01 }); pole.position.set(0.8, 2.4, 0); g.add(pole);
    const umb = new THREE.Group(); umb.position.set(0.8, 3.5, 0); g.add(umb);
    for (let i = 0; i < 8; i++) {
      const seg = part(new THREE.ConeGeometry(1.7, 0.7, 3, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4), i % 2 ? '#ffffff' : '#e8423f', { w: 0.02, opts: { side: THREE.DoubleSide } });
      umb.add(seg);
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), new THREE.MeshBasicMaterial({ map: signTexture('MIE AYAM', { w: 512, h: 128, bg: '#e8423f', fg: '#fff4dc' }), toneMapped: false, side: THREE.DoubleSide }));
    sign.position.set(0, 0.95, 0.62); g.add(sign);
    block(cx, cz, 1.6);
    // meja & kursi
    const tx = 1.8, tz = Z2 + 1.2;
    const top = part(new THREE.CylinderGeometry(0.8, 0.8, 0.1, 24), '#ffffff', { w: 0.02 }); top.position.set(tx, 0.8, tz); add(top);
    const leg = part(new THREE.CylinderGeometry(0.08, 0.12, 0.8, 10), '#3e3550', { w: 0.015 }); leg.position.set(tx, 0.4, tz); add(leg);
    for (const sx of [-1, 1]) {
      const bowl = part(new THREE.SphereGeometry(0.17, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#ffffff', { w: 0.01 }); bowl.rotation.x = Math.PI; bowl.position.set(tx + sx * 0.32, 1.02, tz); add(bowl);
      const noodle = part(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 16), '#ffd56b', { w: 0 }); noodle.position.set(tx + sx * 0.32, 1.01, tz); add(noodle);
      const stool = part(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 16), '#e8423f', { w: 0.015 }); stool.position.set(tx + sx * 1.25, 0.5, tz); add(stool);
      const sl = part(new THREE.CylinderGeometry(0.06, 0.08, 0.45, 8), '#3e3550', { w: 0.01 }); sl.position.set(tx + sx * 1.25, 0.22, tz); add(sl);
    }
    block(tx, tz, 1.0);
    // lampion
    for (let i = 0; i < 6; i++) {
      const l = part(new THREE.SphereGeometry(0.18, 12, 10).scale(1, 1.2, 1), i % 2 ? '#ffd447' : '#ff6f9a', { w: 0.015, opts: { emissive: '#ffcf70', ei: 0.4 } });
      l.position.set(-0.6 + i * 1.3, 2.9 - Math.sin((i / 5) * Math.PI) * 0.35, Z2 - 4.6); add(l);
    }
    for (const x of [-1.4, 7.2]) { const p = part(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), '#3e3550', { w: 0.015 }); p.position.set(x, 1.6, Z2 - 4.6); add(p); block(x, Z2 - 4.6, 0.2); }
  }
  easel('kencan', -4.6, Z2 + 2.2, Math.PI / 2 - 0.2);

  // ================= BAB 3 · Taman kota =================
  const Z3 = ZONES.jadian.c;
  plaza(pathX(Z3), Z3, 7, '#f4dca6');
  {
    const fx = 3.6, fz = Z3 + 1.5;
    const base = part(new THREE.CylinderGeometry(1.6, 1.8, 0.45, 28), '#d8d2e8', { w: 0.03 }); base.position.set(fx, 0.22, fz); add(base);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.05, 28), toon('#6fd0ff', { emissive: '#9be3ff', ei: 0.3 })); water.position.set(fx, 0.43, fz); add(water);
    const mid = part(new THREE.CylinderGeometry(0.18, 0.25, 1.2, 12), '#d8d2e8', { w: 0.02 }); mid.position.set(fx, 0.9, fz); add(mid);
    const bowl = part(new THREE.CylinderGeometry(0.7, 0.35, 0.25, 20), '#d8d2e8', { w: 0.025 }); bowl.position.set(fx, 1.55, fz); add(bowl);
    const jet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), toon('#bdeeff', { emissive: '#bdeeff', ei: 0.5 })); jet.position.set(fx, 1.8, fz); add(jet);
    anim.push((t) => { jet.scale.set(1, 0.8 + Math.sin(t * 6) * 0.25, 1); });
    block(fx, fz, 1.9);
  }
  const parkBench = bench(-3.4, Z3 - 1.5, Math.PI / 2);
  for (const [x, z] of [[-4.5, Z3 + 4.5], [5.5, Z3 - 4.5], [-5, Z3 - 5.5]]) {
    // bedeng bunga
    const bed = part(new THREE.CylinderGeometry(1, 1.1, 0.3, 20), '#a8714a', { w: 0.02 }); bed.position.set(x, 0.15, z); add(bed);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const f = part(new THREE.SphereGeometry(0.17, 10, 8), ['#ff7aa2', '#ffffff', '#ffd447'][i % 3], { w: 0.012 }); f.position.set(x + Math.cos(a) * 0.6, 0.42, z + Math.sin(a) * 0.6); add(f); }
    const c = part(new THREE.SphereGeometry(0.35, 12, 10), '#5fc46a', { w: 0.02 }); c.position.set(x, 0.5, z); add(c);
    block(x, z, 1.1);
  }
  // balon hati melayang
  const hearts3 = [];
  for (let i = 0; i < 5; i++) {
    const h = part(heartGeo, ['#ff4f81', '#ff8fb1', '#ffffff'][i % 3], { w: 0.025 });
    h.rotation.z = Math.PI; h.scale.setScalar(0.7); h.position.set(-6 + i * 3, 4 + (i % 2), Z3 - 6); add(h); hearts3.push(h);
  }
  anim.push((t) => hearts3.forEach((h, i) => { h.position.y = 4 + (i % 2) + Math.sin(t * 1.5 + i) * 0.3; h.rotation.y = Math.sin(t + i) * 0.5; }));
  easel('jadian', 5.2, Z3 - 2.6, -Math.PI / 2 - 0.2);

  // ================= BAB 4 · Pantai senja =================
  const Z4 = ZONES.lamaran.c;
  {
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(70, 30).rotateX(-Math.PI / 2), toon('#ffe2a1'));
    sand.position.set(30, 0.012, Z4); sand.receiveShadow = true; add(sand);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 34, 60, 12).rotateX(-Math.PI / 2), toon('#3fc1e8', { emissive: '#2aa6d6', ei: 0.25 }));
    sea.position.set(108, -0.05, Z4); add(sea);
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 30).rotateX(-Math.PI / 2), toon('#ffffff', { emissive: '#ffffff', ei: 0.4 }));
    foam.position.set(8.2, 0.03, Z4); add(foam);
    const sp = sea.geometry.attributes.position, base = sp.array.slice();
    anim.push((t) => {
      for (let i = 0; i < sp.count; i++) sp.setY(i, base[i * 3 + 1] + Math.sin(base[i * 3] * 0.4 + t * 1.6) * 0.08 + Math.cos(base[i * 3 + 2] * 0.5 + t) * 0.06);
      sp.needsUpdate = true; foam.position.x = 8.2 + Math.sin(t * 0.9) * 0.35; foam.scale.x = 1 + Math.sin(t * 0.9) * 0.3;
    });
    // matahari terbenam besar di cakrawala
    const sun = new THREE.Mesh(new THREE.CircleGeometry(14, 40), new THREE.MeshBasicMaterial({ color: '#ffb067', fog: false }));
    sun.position.set(150, 10, Z4); sun.lookAt(0, 10, Z4); add(sun);
    // dermaga kayu
    const pier = new THREE.Group(); pier.position.set(9, 0, Z4 + 7); add(pier);
    for (let i = 0; i < 7; i++) { const plank = part(RB(1.1, 0.12, 2.6, 0.03), '#c08552', { w: 0.015 }); plank.position.set(i * 1.15, 0.35, 0); pier.add(plank); }
    for (let i = 0; i < 4; i++) for (const sz of [-1, 1]) { const p = part(new THREE.CylinderGeometry(0.1, 0.1, 1, 8), '#8a5a3b', { w: 0.012 }); p.position.set(i * 2.2, 0.1, sz * 1.2); pier.add(p); }
    // pohon kelapa
    const palm = (x, z, lean) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.z = lean; add(g);
      for (let i = 0; i < 6; i++) { const s = part(new THREE.CylinderGeometry(0.17 - i * 0.012, 0.2 - i * 0.012, 0.65, 10), i % 2 ? '#a8714a' : '#8a5a3b', { w: 0.015 }); s.position.set(i * i * 0.012, 0.32 + i * 0.6, 0); s.rotation.z = -i * 0.03; g.add(s); }
      for (let i = 0; i < 6; i++) {
        const leaf = part(new THREE.SphereGeometry(1, 12, 8).scale(1.3, 0.12, 0.35), '#3fae58', { w: 0.02 });
        const a = (i / 6) * Math.PI * 2; leaf.position.set(0.4 + Math.cos(a) * 0.9, 3.75, Math.sin(a) * 0.9); leaf.rotation.set(0, -a, -0.35); g.add(leaf);
      }
      block(x, z, 0.4);
    };
    palm(4.6, Z4 + 6, -0.12); palm(5.8, Z4 - 7, -0.08); palm(-5, Z4 + 4, 0.1); palm(-6.5, Z4 - 6, 0.06);
    // payung pantai
    const umb = new THREE.Group(); umb.position.set(-3.5, 0, Z4 + 8); add(umb);
    const up = part(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), '#ffffff', { w: 0.01 }); up.position.y = 1.1; umb.add(up);
    for (let i = 0; i < 8; i++) { const seg = part(new THREE.ConeGeometry(1.3, 0.5, 3, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4), i % 2 ? '#ffffff' : '#4fa3e8', { w: 0.02, opts: { side: THREE.DoubleSide } }); seg.position.y = 2.3; umb.add(seg); }
    block(-3.5, Z4 + 8, 0.3);
  }
  // titik lamaran: lingkaran lilin dan kelopak
  const proposalSpot = new THREE.Vector3(3.2, 0, Z4 - 1.5);
  {
    const g = new THREE.Group(); g.position.copy(proposalSpot); add(g);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, r = 1.9;
      const c = part(new THREE.CylinderGeometry(0.07, 0.07, 0.22 + (i % 3) * 0.08, 8), '#fff6e0', { w: 0.01 }); c.position.set(Math.cos(a) * r, 0.15, Math.sin(a) * r); g.add(c);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6).scale(1, 1.6, 1), new THREE.MeshBasicMaterial({ color: '#ffb54a' })); fl.position.set(Math.cos(a) * r, 0.34 + (i % 3) * 0.08, Math.sin(a) * r); g.add(fl);
      anim.push((t) => { fl.scale.y = 1 + Math.sin(t * 12 + i) * 0.25; });
    }
    const petals = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4).scale(1, 0.25, 0.7), toon('#ff4f81'), 60), m = new THREE.Matrix4();
    for (let i = 0; i < 60; i++) { const a = rand() * Math.PI * 2, r = rand() * 1.6; m.compose(new THREE.Vector3(Math.cos(a) * r, 0.03, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand() * 6, 0)), new THREE.Vector3(1, 1, 1)); petals.setMatrixAt(i, m); }
    g.add(petals);
    // gapura balon hati
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI;
      const b = part(new THREE.SphereGeometry(0.28, 12, 10).scale(1, 1.15, 1), ['#ff4f81', '#ffffff', '#ff8fb1'][i % 3], { w: 0.02 });
      b.position.set(Math.cos(a) * 2.3 * 0, 0.4 + Math.sin(a) * 2.6, -2.3 + Math.cos(a) * 0); b.position.x = Math.cos(a) * 2.3; b.position.z = -2.4; g.add(b);
    }
  }
  easel('lamaran', -3.6, Z4 - 3.5, Math.PI / 2 - 0.15);

  // ================= BAB 5 · Taman pernikahan =================
  const Z5 = ZONES.nikah.c;
  const archPos = new THREE.Vector3(0, 0, Z5 - 10);
  {
    const lawn = new THREE.Mesh(new THREE.CircleGeometry(14, 48).rotateX(-Math.PI / 2), toon('#a6e08a')); lawn.position.set(0, 0.015, Z5 - 2); lawn.receiveShadow = true; add(lawn);
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 22).rotateX(-Math.PI / 2), toon('#e8506f')); carpet.position.set(0, 0.025, Z5); carpet.receiveShadow = true; add(carpet);
    // kelopak di karpet
    const pet = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4).scale(1, 0.25, 0.7), toon('#ffffff'), 120), m = new THREE.Matrix4(), c = new THREE.Color();
    for (let i = 0; i < 120; i++) { m.compose(new THREE.Vector3((rand() - 0.5) * 2, 0.04, Z5 + 11 - rand() * 22), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand() * 6, 0)), new THREE.Vector3(1, 1, 1)); pet.setMatrixAt(i, m); pet.setColorAt(i, c.set(i % 3 ? '#ffffff' : '#ffb3c8')); }
    add(pet);
    // gapura bunga
    const arch = new THREE.Group(); arch.position.copy(archPos); add(arch);
    const ring = part(new THREE.TorusGeometry(2.4, 0.16, 12, 40, Math.PI), '#ffffff', { w: 0.03 }); ring.position.y = 1.4; arch.add(ring);
    for (const sx of [-1, 1]) { const p = part(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 12), '#ffffff', { w: 0.03 }); p.position.set(sx * 2.4, 0.7, 0); arch.add(p); block(archPos.x + sx * 2.4, archPos.z, 0.35); }
    for (let i = 0; i < 26; i++) {
      const a = (i / 25) * Math.PI;
      const f = part(new THREE.SphereGeometry(0.22 + (i % 3) * 0.05, 12, 10), ['#ff8fb1', '#ffffff', '#ffd1dc', '#ff6f9a'][i % 4], { w: 0.015 });
      f.position.set(Math.cos(a) * 2.4 + (rand() - 0.5) * 0.2, 1.4 + Math.sin(a) * 2.4 + (rand() - 0.5) * 0.2, (rand() - 0.5) * 0.3); arch.add(f);
    }
    for (let i = 0; i < 10; i++) { const l = part(new THREE.SphereGeometry(0.2, 10, 8).scale(1.4, 0.5, 1), '#4fb35a', { w: 0.012 }); const a = (i / 9) * Math.PI; l.position.set(Math.cos(a) * 2.6, 1.4 + Math.sin(a) * 2.6, 0.1); l.rotation.z = a; arch.add(l); }
    const stage = part(new THREE.CylinderGeometry(3.2, 3.4, 0.2, 40), '#ffffff', { w: 0.03 }); stage.position.set(archPos.x, 0.1, archPos.z); stage.receiveShadow = true; add(stage);
    // kue pengantin
    const cake = new THREE.Group(); cake.position.set(4.3, 0, archPos.z + 1); add(cake);
    const tbl = part(new THREE.CylinderGeometry(0.9, 0.9, 0.85, 20), '#fff4f8', { w: 0.02 }); tbl.position.y = 0.42; cake.add(tbl);
    [[0.6, 0.4], [0.45, 0.35], [0.3, 0.3]].reduce((y, [r, h], i) => { const t = part(new THREE.CylinderGeometry(r, r, h, 24), i % 2 ? '#ffd1dc' : '#ffffff', { w: 0.02 }); t.position.y = y + h / 2; cake.add(t); return y + h; }, 0.85);
    const topper = part(heartGeometry(0.12, 0.05), '#ff4f81', { w: 0.01 }); topper.rotation.z = Math.PI; topper.position.y = 2.05; cake.add(topper);
    block(4.3, archPos.z + 1, 1);
    // kursi tamu
    const chairs = [];
    for (let row = 0; row < 4; row++) for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
      const x = sx * (1.9 + k * 1.05), z = Z5 - 4 + row * 2.3;
      const ch = new THREE.Group(); ch.position.set(x, 0, z); ch.rotation.y = Math.PI; add(ch);
      const seat = part(RB(0.75, 0.1, 0.7, 0.03), '#ffffff', { w: 0.015 }); seat.position.y = 0.48; ch.add(seat);
      const back = part(RB(0.75, 0.65, 0.08, 0.03), '#ffffff', { w: 0.015 }); back.position.set(0, 0.85, 0.33); ch.add(back);
      const bow = part(new THREE.SphereGeometry(0.1, 8, 6).scale(1.6, 1, 0.6), '#ff8fb1', { w: 0.01 }); bow.position.set(0, 0.95, 0.4); ch.add(bow);
      for (const lx of [-1, 1]) for (const lz of [-1, 1]) { const l = part(new THREE.CylinderGeometry(0.035, 0.035, 0.48, 6), '#e0d6c8', { w: 0 }); l.position.set(lx * 0.3, 0.24, lz * 0.28); ch.add(l); }
      block(x, z, 0.45); chairs.push({ x, z });
    }
    // lampu gantung
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 6; i++) { const p = part(new THREE.CylinderGeometry(0.05, 0.05, 3, 8), '#ffffff', { w: 0.012 }); p.position.set(sx * 5.6, 1.5, Z5 + 9 - i * 3.6); add(p); block(sx * 5.6, Z5 + 9 - i * 3.6, 0.15); }
      for (let i = 0; i < 40; i++) { const t = i / 39, z = Z5 + 9 - t * 18; const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: ['#fff2b0', '#ffd1dc', '#c9f0ff'][i % 3] })); b.position.set(sx * 5.6, 2.9 - Math.abs(Math.sin(t * Math.PI * 5)) * 0.45, z); add(b); }
    }
    // balon
    for (let i = 0; i < 12; i++) {
      const sx = i % 2 ? -1 : 1, b = part(new THREE.SphereGeometry(0.32, 12, 10).scale(1, 1.2, 1), ['#ff8fb1', '#ffffff', '#ffd447', '#9fd8ff'][i % 4], { w: 0.02 });
      b.position.set(sx * (3 + (i % 3) * 0.4), 3.4 + (i % 4) * 0.35, archPos.z + 0.5 + (i % 3) * 0.3); add(b);
      anim.push((t) => { b.position.y = 3.4 + (i % 4) * 0.35 + Math.sin(t * 1.2 + i) * 0.12; });
    }
    buildWorld.chairs = chairs;
  }
  easel('nikah', -4.4, archPos.z + 1.5, 0.6);

  // gerbang tiap bab
  const g1 = gate(ZONES.awal.gate), g2 = gate(ZONES.kencan.gate), g3 = gate(ZONES.jadian.gate), g4 = gate(ZONES.lamaran.gate);

  // ---------- area boleh dilalui ----------
  function walkable(x, z) {
    if (z > 16 || z < ZONES.nikah.end) return false;
    if (Math.abs(x) > 12) return false;
    if (z < -84 && z > -112 && x > 7.4 && !(x < 17 && z > ZONES.lamaran.c + 5.5 && z < ZONES.lamaran.c + 8.5)) return false; // laut (kecuali dermaga)
    for (const g of gates) if (!g.open && Math.abs(z - g.z) < 0.6) return false;
    for (const c of colliders) { const dx = x - c.x, dz = z - c.z; if (dx * dx + dz * dz < (c.r + 0.3) ** 2) return false; }
    return true;
  }

  // ---------- hati untuk mini game ----------
  const collectGeo = heartGeometry(0.26, 0.1);
  function spawnHearts(n, zc) {
    const list = [];
    for (let i = 0; i < n; i++) {
      let x, z, tries = 0;
      do { x = (rand() - 0.5) * 16; z = zc + (rand() - 0.5) * 18; tries++; } while ((!walkable(x, z) || Math.abs(z - zc) < 1) && tries < 60);
      const h = part(collectGeo, '#ff4f81', { w: 0.02 }); h.rotation.z = Math.PI; h.position.set(x, 0.8, z); add(h);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTexture('#ffb3c8'), transparent: true, opacity: 0.35, depthWrite: false })); glow.scale.setScalar(1.1); h.add(glow);
      list.push(h);
    }
    return list;
  }

  return {
    walkable, sky, gates: [g1, g2, g3, g4], easels, colliders, proposalSpot, archPos, parkBench,
    chairs: buildWorld.chairs, spawnHearts,
    update(t, dt) { for (const f of anim) f(t, dt); },
  };
}
