/* Tekstur bidang bintang luar angkasa untuk Celestial Nocturne (transparan, ditumpuk di atas gradasi):
   ribuan bintang kecil beragam terang, sebagian bintang besar berpendar, debu emas & pita bima sakti tipis
   — meniru kepadatan bintang di lukisan langit desainer agar langit atas & bawah menyatu.
   Pakai: node scripts/celestial-starfield.cjs */
const sharp = require("sharp");
const W = 900, H = 1800;
const out = new Float32Array(W * H * 4);
let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
function dot(cx, cy, r, col, a) {
  const R = Math.ceil(r * 3);
  for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(H, cy + R); y++)
    for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(W, cx + R); x++) {
      const d2 = ((x - cx) ** 2 + (y - cy) ** 2) / (r * r);
      const k = a * Math.exp(-d2 * 1.6);
      if (k < 0.004) continue;
      const p = (y * W + x) * 4;
      // tumpuk "screen"
      out[p] = 1 - (1 - out[p]) * (1 - col[0] * k);
      out[p + 1] = 1 - (1 - out[p + 1]) * (1 - col[1] * k);
      out[p + 2] = 1 - (1 - out[p + 2]) * (1 - col[2] * k);
      out[p + 3] = Math.max(out[p + 3], k);
    }
}
const WHITE = [1, 0.97, 0.9], GOLD = [1, 0.85, 0.55], BLUE = [0.8, 0.88, 1];
// kabut pita bima sakti (cahaya lembut keemasan & ungu)
for (let i = 0; i < 160; i++) {
  const t = rnd();
  const off = (rnd() + rnd() - 1) * 140;
  dot(t * W * 1.2 - W * 0.1 + off * 0.5, H * 0.78 - t * H * 0.5 + off, 30 + rnd() * 50, rnd() < 0.55 ? [0.85, 0.65, 0.35] : [0.45, 0.35, 0.75], 0.05);
}
// pita bima sakti diagonal (kiri bawah → kanan atas): debu emas padat
for (let i = 0; i < 9000; i++) {
  const t = rnd();
  const off = (rnd() + rnd() + rnd() - 1.5) * 150;
  const x = t * W * 1.2 - W * 0.1 + off * 0.5;
  const y = H * 0.78 - t * H * 0.5 + off;
  dot(x, y, 0.8 + rnd() * 1.1, rnd() < 0.6 ? GOLD : WHITE, 0.2 + rnd() * 0.55);
}
// bintang kecil merata
for (let i = 0; i < 4200; i++) dot(rnd() * W, rnd() * H, 0.8 + rnd() * 1.1, rnd() < 0.25 ? GOLD : rnd() < 0.3 ? BLUE : WHITE, 0.3 + rnd() * 0.7);
// bintang terang berpendar
for (let i = 0; i < 110; i++) {
  const x = rnd() * W, y = rnd() * H, col = rnd() < 0.5 ? GOLD : WHITE;
  dot(x, y, 5 + rnd() * 5, col, 0.28);
  dot(x, y, 1.6 + rnd() * 1, WHITE, 1);
}
const buf = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
  const a = out[p * 4 + 3];
  for (let c = 0; c < 3; c++) buf[p * 4 + c] = Math.round(Math.min(1, a > 0 ? out[p * 4 + c] / Math.max(a, 0.001) * a + (1 - a) * out[p * 4 + c] : 0) * 255);
  buf[p * 4 + 3] = Math.round(Math.min(1, a) * 255);
}
sharp(buf, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 82, alphaQuality: 85 }).toFile("public/templates/celestial-nocturne/starfield.webp").then(() => console.log("starfield ok"));
