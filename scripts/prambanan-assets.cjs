/* Menyiapkan aset template Sekar Prambanan dari lembar aset desainer
   (public/templates/sekar-prambanan/Aset Taman Candi Jawa Fantasi.png → dipindah ke assets-src).
   Lembar itu RGB tanpa alpha: pola kotak-kotak "transparan" ikut tercetak. Maka:
     1. latar = piksel abu-abu terang (hampir tanpa warna) yang tersambung ke tepi lembar
        atau ke celah antar objek (flood-fill),
     2. pita tepi 2 px diberi alpha lembut & warnanya dibersihkan dari putih latar,
     3. tiap objek = gumpalan piksel padat; dipotong per kotak (BOX) & disimpan .webp.
   Pakai: node scripts/prambanan-assets.cjs          → potong semua sprite
          node scripts/prambanan-assets.cjs --boxes  → peta gumpalan (untuk menentukan BOX) */
const fs = require("fs");
const sharp = require("sharp");

sharp.cache(false);
const SHEET = "assets-src/sekar-prambanan/aset-taman-candi.png";
const TERRACE = "assets-src/sekar-prambanan/teras-batu.png"; // lantai batu & tangga depan (atasnya kotak-kotak tercetak)
const OUT = "public/templates/sekar-prambanan/";

// kotak potong di lembar 1536×1024: [kiri, atas, lebar, tinggi, opsi]
// opsi.erase: kotak (koordinat potongan) berisi bagian objek tetangga yang ikut terpotong
// opsi.water: sisa kotak-kotak di balik tirai air → kilau air tembus pandang yang rata
const BOX = {
  tree: [0, 10, 460, 505],
  gateL: [330, 30, 244, 525],
  temple: [574, 0, 400, 550],
  gateRa: [972, 10, 142, 548],
  gateRb: [1110, 10, 264, 548],
  banner: [1318, 56, 140, 400],
  pennant: [1458, 14, 64, 420],
  shrine: [1366, 372, 158, 300],
  bannerSmall: [1398, 676, 126, 190],
  wallTree: [8, 524, 412, 330, { erase: [[292, 0, 120, 255]] }],
  roseTree: [314, 560, 256, 292, { erase: [[0, 218, 104, 74]] }],
  cloud: [548, 556, 446, 148],
  cloudSmall: [676, 716, 220, 80],
  fern: [526, 730, 200, 140],
  fountain: [876, 566, 428, 306, { erase: [[0, 0, 122, 140], [0, 196, 26, 70]], water: true }],
  garland: [1206, 560, 194, 314],
  bush: [10, 862, 228, 160],
  plant: [232, 864, 254, 158],
  stairs: [486, 866, 512, 158],
  pond: [998, 852, 538, 172],
};

// sprite tanaman: daun keemasan di lembar desainer diubah ke hijau daun alami
// nilai = hue terendah yang dianggap daun; tanaman tanpa batang kayu boleh mulai lebih rendah (daun jingga ikut hijau)
const GREEN = { tree: 31, wallTree: 31, roseTree: 31, fountain: 31, pond: 31, fern: 22, bush: 24, plant: 22, garland: 26 };

const BG_BRIGHT = 214; // latar kotak-kotak: putih & abu-abu muda
const BG_CHROMA = 14; // ...dan nyaris tanpa warna
const BAND = 2;

function removeChecker(data, w, h) {
  const n = w * h;
  const at = (p) => [data[p * 4], data[p * 4 + 1], data[p * 4 + 2]];
  const isBg = (p) => {
    const [r, g, b] = at(p);
    return Math.min(r, g, b) >= BG_BRIGHT && Math.max(r, g, b) - Math.min(r, g, b) <= BG_CHROMA;
  };
  const nb = (p, fn) => {
    const x = p % w;
    if (x > 0) fn(p - 1);
    if (x < w - 1) fn(p + 1);
    if (p >= w) fn(p - w);
    if (p < n - w) fn(p + w);
  };
  const dist = new Int16Array(n).fill(-1);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  for (let p = 0; p < n; p++) {
    const x = p % w, y = (p / w) | 0;
    if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && isBg(p)) { dist[p] = 0; queue[tail++] = p; }
  }
  while (head < tail) {
    const p = queue[head++];
    nb(p, (q) => { if (dist[q] === -1 && isBg(q)) { dist[q] = 0; queue[tail++] = q; } });
  }
  // celah tertutup (sela batang pohon, di balik air mancur): gumpalan latar yang tidak tersambung
  // ke tepi, tapi berpola kotak-kotak (campuran putih & abu-abu muda) → ikut dibuang
  const seen = new Uint8Array(n);
  for (let s = 0; s < n; s++) {
    if (seen[s] || dist[s] === 0 || !isBg(s)) continue;
    const comp = [s];
    seen[s] = 1;
    for (let i = 0; i < comp.length; i++) nb(comp[i], (q) => { if (!seen[q] && dist[q] !== 0 && isBg(q)) { seen[q] = 1; comp.push(q); } });
    if (comp.length < 120) continue;
    let hi = 0, lo = 0;
    for (const p of comp) { const v = Math.min(...at(p)); if (v >= 249) hi++; else if (v <= 244) lo++; }
    if (hi / comp.length > 0.2 && lo / comp.length > 0.2) for (const p of comp) { dist[p] = 0; queue[tail++] = p; }
  }
  for (let p = 0; p < n; p++) if (dist[p] === 0) data[p * 4 + 3] = 0;
  // pita tepi: piksel terang dekat latar → semi-transparan, warna dibersihkan dari putih
  head = 0;
  const seeds = tail;
  while (head < tail) {
    const p = queue[head++];
    if (head > seeds && dist[p] >= BAND) continue;
    nb(p, (q) => { if (dist[q] === -1) { dist[q] = dist[p] + 1; queue[tail++] = q; } });
  }
  const BGV = 246;
  for (let p = 0; p < n; p++) {
    const d = dist[p];
    if (d < 1 || d > BAND) continue;
    const [r, g, b] = at(p);
    const lum = Math.min(r, g, b);
    let a = Math.max(0, Math.min(1, (BGV - lum) / 90));
    a = Math.min(1, a + (d - 1) * 0.45);
    if (a <= 0.03) { data[p * 4 + 3] = 0; continue; }
    for (let c = 0; c < 3; c++) data[p * 4 + c] = Math.max(0, Math.min(255, Math.round((data[p * 4 + c] - BGV * (1 - a)) / a)));
    data[p * 4 + 3] = Math.round(255 * a);
  }
}

/* daun keemasan → hijau alami: hanya warna jenuh ber-hue 33–64° (daun) yang digeser ke
   hue 80–105°; kulit kayu & batu (kurang jenuh / hue lebih rendah), bunga merah & krem tidak
   tersentuh. Kilau paling terang tetap sedikit hangat seperti tersorot matahari senja. */
function greenify(data, lo = 31) {
  for (let p = 0; p < data.length; p += 4) {
    if (!data[p + 3]) continue;
    const r = data[p] / 255, g = data[p + 1] / 255, b = data[p + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d < 0.05) continue;
    let h = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
    const sat = d / mx;
    const ramp = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));
    let w = ramp(h, lo, lo + 7) * (1 - ramp(h, 64, 74)) * ramp(sat, 0.28, 0.42);
    if (!w) continue;
    w *= 1 - 0.45 * ramp(mx, 0.82, 0.97);
    const nh = h + w * (78 + Math.max(0, h - 33) * 0.85 - h);
    const ns = sat * (1 - 0.12 * w);
    const nv = mx * (1 - 0.1 * w);
    const c = nv * ns, x = c * (1 - Math.abs(((nh / 60) % 2) - 1)), m = nv - c;
    const [r1, g1, b1] = nh < 60 ? [c, x, 0] : nh < 120 ? [x, c, 0] : nh < 180 ? [0, c, x] : [0, x, c];
    data[p] = Math.round((r1 + m) * 255);
    data[p + 1] = Math.round((g1 + m) * 255);
    data[p + 2] = Math.round((b1 + m) * 255);
  }
}

/* lantai teras: pola kotak-kotak di atasnya dibuang (flood-fill dari tepi), lalu dipangkas */
async function terrace() {
  const { data, info } = await sharp(TERRACE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  removeChecker(data, info.width, info.height);
  keepMain(data, info.width, info.height, 2000);
  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  const out = await sharp(png).trim({ threshold: 1 }).webp({ quality: 86, alphaQuality: 92 }).toFile(OUT + "terrace.webp");
  console.log("terrace", out.width, "×", out.height);
}

// buang serpihan kecil & potongan objek tetangga yang terpotong tepi kotak
function keepMain(data, w, h, min) {
  const seen = new Uint8Array(w * h);
  const comps = [];
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || data[s * 4 + 3] <= 8) continue;
    const comp = [], stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const p = stack.pop(); comp.push(p);
      const x = p % w;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || seen[q]) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
        if (data[q * 4 + 3] > 8) { seen[q] = 1; stack.push(q); }
      }
    }
    comps.push(comp);
  }
  const big = Math.max(...comps.map((c) => c.length));
  const cut = (c) => c.some((p) => { const x = p % w, y = (p / w) | 0; return x === 0 || y === 0 || x === w - 1 || y === h - 1; });
  for (const c of comps) if (c.length < min || (c.length < big && cut(c) && c.length < big * 0.6)) c.forEach((p) => (data[p * 4 + 3] = 0));
}

async function main() {
  const { data, info } = await sharp(SHEET).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  removeChecker(data, info.width, info.height);
  if (process.argv.includes("--boxes")) {
    const svg = Object.entries(BOX).map(([k, [x, y, w, h]]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="red" stroke-width="2"/><text x="${x + 4}" y="${y + 16}" fill="red" font-size="16" font-family="sans-serif">${k}</text>`).join("");
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .flatten({ background: "#2b6cb0" })
      .composite([{ input: Buffer.from(`<svg width="${info.width}" height="${info.height}">${svg}</svg>`) }])
      .jpeg({ quality: 80 })
      .toFile(process.argv[process.argv.indexOf("--boxes") + 1] || "boxes.jpg");
    return;
  }
  for (const [name, [left, top, width, height, opt = {}]] of Object.entries(BOX)) {
    const crop = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) data.copy(crop, y * width * 4, ((top + y) * info.width + left) * 4, ((top + y) * info.width + left + width) * 4);
    for (const [ex, ey, ew, eh] of opt.erase || []) for (let y = ey; y < Math.min(height, ey + eh); y++) for (let x = ex; x < Math.min(width, ex + ew); x++) crop[(y * width + x) * 4 + 3] = 0;
    if (opt.water) {
      for (let p = 0; p < width * height; p++) {
        const r = crop[p * 4], g = crop[p * 4 + 1], b = crop[p * 4 + 2];
        if (crop[p * 4 + 3] && Math.min(r, g, b) >= 200 && Math.max(r, g, b) - Math.min(r, g, b) <= 18) {
          crop[p * 4] = 236; crop[p * 4 + 1] = 242; crop[p * 4 + 2] = 248; crop[p * 4 + 3] = 120;
        }
      }
    }
    keepMain(crop, width, height, 900);
    if (GREEN[name]) greenify(crop, GREEN[name]);
    const png = await sharp(crop, { raw: { width, height, channels: 4 } }).png().toBuffer();
    // diperbesar 2× (lanczos) agar tetap tajam di layar HP beresolusi tinggi
    const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    await sharp(trimmed.data)
      .resize({ width: trimmed.info.width * 2, kernel: "lanczos3" })
      .webp({ quality: 88, alphaQuality: 92 })
      .toFile(OUT + name + ".webp");
    console.log(name, trimmed.info.width * 2, "×", trimmed.info.height * 2);
  }
  await terrace();
}

main();
