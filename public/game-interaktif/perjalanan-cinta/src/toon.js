// Gaya kartun: shading bertingkat (toon), garis tepi gelap, dan tekstur buatan kanvas (foto dummy, papan nama, hati).
import * as THREE from 'three';

const ramp = (() => {
  const d = new Uint8Array([95, 95, 95, 255, 165, 165, 165, 255, 225, 225, 225, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();

const cache = new Map();
export function toon(color, opts = {}) {
  const key = `${color}|${opts.map?.uuid || ''}|${opts.emissive || ''}|${opts.side || ''}|${opts.vc || ''}`;
  if (!opts.unique && cache.has(key)) return cache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: ramp, map: opts.map || null, side: opts.side ?? THREE.FrontSide, vertexColors: !!opts.vc });
  if (opts.emissive) { m.emissive.set(opts.emissive); m.emissiveIntensity = opts.ei ?? 0.6; }
  if (!opts.unique) cache.set(key, m);
  return m;
}

// garis tepi: salinan mesh yang didorong keluar sepanjang normal dan hanya sisi belakangnya yang digambar
const INK = new THREE.Color('#2a1a1f');
const outlineMats = new Map();
function outlineMat(w) {
  if (outlineMats.has(w)) return outlineMats.get(w);
  const m = new THREE.ShaderMaterial({
    uniforms: { w: { value: w }, ink: { value: INK } },
    vertexShader: `uniform float w;
      void main() {
        vec4 p = vec4(position + normal * w, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * p;
      }`,
    fragmentShader: 'uniform vec3 ink; void main() { gl_FragColor = vec4(ink, 1.0); }',
    side: THREE.BackSide,
  });
  outlineMats.set(w, m);
  return m;
}
export function outline(mesh, w = 0.025) {
  const o = mesh.isInstancedMesh
    ? new THREE.InstancedMesh(mesh.geometry, outlineMat(w), mesh.count)
    : new THREE.Mesh(mesh.geometry, outlineMat(w));
  if (mesh.isInstancedMesh) { o.instanceMatrix = mesh.instanceMatrix; o.frustumCulled = false; }
  o.raycast = () => {};
  o.userData.isOutline = true;
  mesh.add(o);
  // instanced: matriks instance sudah dalam ruang induk, jadi outline cukup menempel tanpa transform tambahan
  return mesh;
}

// buat mesh toon + garis tepi sekaligus
export function part(geo, color, { w = 0.02, shadow = true, receive = false, opts } = {}) {
  const m = new THREE.Mesh(geo, toon(color, opts));
  m.castShadow = shadow; m.receiveShadow = receive;
  if (w) outline(m, w);
  return m;
}

// ---------- tekstur kanvas ----------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData.canvas = c;
  return t;
}

export function signTexture(text, { bg = '#fff4dc', fg = '#5a2f22', w = 512, h = 160, font = 'Fredoka' } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(12, 12, w - 24, h - 24);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = h * 0.48; g.font = `700 ${size}px ${font}, sans-serif`;
    while (g.measureText(text).width > w - 70 && size > 10) { size -= 2; g.font = `700 ${size}px ${font}, sans-serif`; }
    g.fillText(text, w / 2, h / 2 + 4);
  });
}

// foto kenangan contoh (dummy) — nanti diganti foto asli pasangan
export function drawDummyPhoto(g, w, h, { emoji, title, colors }) {
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, colors[0]); gr.addColorStop(1, colors[1]);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // bukit & matahari kecil ala ikon "gambar"
  g.globalAlpha = 0.35; g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(w * 0.8, h * 0.22, h * 0.09, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.3, h * 0.6); g.lineTo(w * 0.55, h * 0.85); g.lineTo(w * 0.75, h * 0.55); g.lineTo(w, h * 0.9); g.lineTo(w, h); g.fill();
  g.globalAlpha = 1;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${h * 0.32}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  g.fillText(emoji, w / 2, h * 0.42);
  g.fillStyle = 'rgba(60,30,40,.85)'; g.font = `700 ${h * 0.075}px Fredoka, sans-serif`;
  g.fillText(title, w / 2, h * 0.72);
  g.fillStyle = 'rgba(60,30,40,.55)'; g.font = `600 ${h * 0.05}px Fredoka, sans-serif`;
  g.fillText('FOTO CONTOH · ganti dengan foto asli', w / 2, h * 0.84);
}
export function dummyPhotoTexture(mem) {
  return canvasTex(512, 384, (g, w, h) => drawDummyPhoto(g, w, h, mem));
}
export function dummyPhotoURL(mem) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 480;
  drawDummyPhoto(c.getContext('2d'), 640, 480, mem);
  return c.toDataURL('image/jpeg', 0.9);
}

export function heartTexture(color = '#ff5d8f') {
  return canvasTex(128, 128, (g) => {
    g.translate(64, 70); g.fillStyle = color; g.strokeStyle = '#2a1a1f'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(0, 38);
    g.bezierCurveTo(-60, -2, -44, -54, 0, -26); g.bezierCurveTo(44, -54, 60, -2, 0, 38);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(-18, -18, 9, 6, -0.6, 0, Math.PI * 2); g.fill();
  });
}

export function sparkleTexture() {
  return canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,240,180,.9)'); r.addColorStop(1, 'rgba(255,220,120,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  });
}

// geometri hati 3D (ekstrusi) untuk dekorasi & item koleksi
export function heartGeometry(size = 0.3, depth = 0.12) {
  const s = new THREE.Shape(), k = size;
  s.moveTo(0, -k * 0.9);
  s.bezierCurveTo(-k * 1.5, k * 0.05, -k * 0.95, k * 1.25, 0, k * 0.55);
  s.bezierCurveTo(k * 0.95, k * 1.25, k * 1.5, k * 0.05, 0, -k * 0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: k * 0.12, bevelSegments: 3, curveSegments: 14 });
  g.center(); g.computeVertexNormals();
  return g;
}
