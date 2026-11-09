/* awan: kabut tipis semi-transparan di sekitar awan (sisa latar lembar) dibuang — alpha rendah
   diramp ke 0, hanya komponen terbesar (badan awan) yang disimpan, tepi kotak dilunakkan. */
function softCloud(data, w, h) {
  for (let p = 0; p < w * h; p++) {
    const a = data[p * 4 + 3] / 255;
    const t = Math.max(0, Math.min(1, (a - 0.42) / 0.4));
    data[p * 4 + 3] = Math.round(255 * t * t * (3 - 2 * t));
  }
  keepLargest(data, w, h);
  feather(data, w, h, 0.06);
}
function keepLargest(data, w, h) {
  const seen = new Uint8Array(w * h);
  let best = null;
  const comps = [];
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || data[s * 4 + 3] <= 20) continue;
    const comp = [s];
    seen[s] = 1;
    for (let i = 0; i < comp.length; i++) {
      const p = comp[i], x = p % w;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || seen[q]) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
        if (data[q * 4 + 3] > 20) { seen[q] = 1; comp.push(q); }
      }
    }
    comps.push(comp);
    if (!best || comp.length > best.length) best = comp;
  }
  for (const c of comps) if (c !== best) for (const p of c) data[p * 4 + 3] = 0;
}
// tepi kotak memudar halus (tak ada garis lurus potongan)
function feather(data, w, h, f) {
  const fx = w * f, fy = h * f;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = Math.min(1, x / fx, (w - 1 - x) / fx, y / fy, (h - 1 - y) / fy);
    const s = Math.max(0, k);
    data[(y * w + x) * 4 + 3] = Math.round(data[(y * w + x) * 4 + 3] * s * s * (3 - 2 * s));
  }
}

/* Menyiapkan aset template Celestial Nocturne (langit malam navy & emas):
     - lembar aset desainer (assets-src/celestial-nocturne/lembar-aset.png, PNG beralpha asli)
       → tiap objek dipotong per kotak (BOX), potongan tetangga yang terpotong tepi kotak dibuang,
         opsi erase = kotak (koordinat potongan) milik objek tetangga; diperbesar 2× (lanczos);
     - lukisan komposisi desainer (komposisi.png) → bagian langitnya (bulan sabit, rasi bintang,
       bima sakti) dipakai sebagai langit latar (sky.webp), utuhnya sebagai poster katalog.
   Pakai: node scripts/celestial-nocturne-assets.cjs */
const fs = require("fs");
const sharp = require("sharp");

sharp.cache(false);
const SRC = "assets-src/celestial-nocturne/";
const OUT = "public/templates/celestial-nocturne/";

// kotak potong di lembar 941×1672: [kiri, atas, lebar, tinggi, opsi]
const BOX = {
  moon: [0, 16, 236, 228],
  star: [228, 28, 108, 128],
  starburst: [396, 148, 112, 112],
  milkyway: [528, 116, 380, 284, { erase: [[0, 230, 140, 54]], feather: 0.22 }],
  cloudA: [8, 216, 496, 205, { erase: [[0, 0, 240, 30], [352, 130, 144, 75]], soft: true }],
  cloudB: [360, 348, 524, 136, { soft: true }],
  cloudC: [648, 492, 296, 108, { soft: true }],
  frame: [14, 392, 376, 540, { erase: [[0, 0, 376, 26]] }],
  medallion: [404, 496, 232, 334],
  moonRing: [678, 616, 132, 214],
  chains: [832, 598, 96, 284],
  bouquet: [14, 930, 404, 552],
  pampas: [388, 902, 282, 396, { erase: [[0, 0, 110, 150]] }],
  palm: [690, 898, 132, 188],
  monstera: [598, 1054, 156, 176],
  featherSpray: [762, 994, 168, 452],
  leafNavy: [290, 970, 116, 172],
  blossoms: [534, 1250, 192, 260],
  flowerSprig: [394, 1282, 128, 204],
  anemoneSmall: [502, 1414, 100, 88],
  wave: [10, 1450, 720, 212],
  sparkleTrail: [770, 1550, 148, 92, { feather: 0.25 }],
};

function cleanCrop(data, w, h) {
  const seen = new Uint8Array(w * h);
  const comps = [];
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || data[s * 4 + 3] <= 12) continue;
    const comp = [s];
    seen[s] = 1;
    for (let i = 0; i < comp.length; i++) {
      const p = comp[i], x = p % w;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || seen[q]) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
        if (data[q * 4 + 3] > 12) { seen[q] = 1; comp.push(q); }
      }
    }
    comps.push(comp);
  }
  if (!comps.length) return;
  const big = Math.max(...comps.map((c) => c.length));
  const cut = (c) => c.some((p) => { const x = p % w, y = (p / w) | 0; return x === 0 || y === 0 || x === w - 1 || y === h - 1; });
  for (const c of comps) if (c.length < 20 || (c.length < big && cut(c) && c.length < big * 0.6)) for (const p of c) data[p * 4 + 3] = 0;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const { data, info } = await sharp(SRC + "lembar-aset.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [name, [left, top, width, height, opt = {}]] of Object.entries(BOX)) {
    const crop = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) data.copy(crop, y * width * 4, ((top + y) * info.width + left) * 4, ((top + y) * info.width + left + width) * 4);
    for (const [ex, ey, ew, eh] of opt.erase || []) for (let y = ey; y < Math.min(height, ey + eh); y++) for (let x = ex; x < Math.min(width, ex + ew); x++) crop[(y * width + x) * 4 + 3] = 0;
    cleanCrop(crop, width, height);
    if (opt.soft) softCloud(crop, width, height);
    if (opt.feather) feather(crop, width, height, opt.feather);
    const png = await sharp(crop, { raw: { width, height, channels: 4 } }).png().toBuffer();
    const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    await sharp(trimmed.data).resize({ width: trimmed.info.width * 2, kernel: "lanczos3" }).webp({ quality: 88, alphaQuality: 92 }).toFile(OUT + name + ".webp");
    console.log(name, trimmed.info.width * 2, "×", trimmed.info.height * 2);
  }
  // langit: 18,5% atas lukisan komposisi (bulan sabit, rasi bintang, bima sakti) — di bawahnya bingkai
  const meta = await sharp(SRC + "komposisi.png").metadata();
  await sharp(SRC + "komposisi.png").extract({ left: 0, top: 0, width: meta.width, height: Math.round(meta.height * 0.185) }).webp({ quality: 86 }).toFile(OUT + "sky.webp");
  await sharp(SRC + "komposisi.png").resize({ width: 720 }).webp({ quality: 84 }).toFile(OUT + "poster.webp");
  console.log("sky & poster ok");
}

main();
