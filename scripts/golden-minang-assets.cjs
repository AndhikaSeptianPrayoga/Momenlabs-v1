/* Menyiapkan aset template Golden Minangkabau (Minangkabau, senja keemasan):
   - sprite dari lembar layer desainer (assets-src/golden-minang/raw,
     "Minangkabau-Architectural-Asset-Sheet_00NN_Layer-N.png"). Tiap potongan masih
     membawa blok latar hitam di sekeliling objek → latar hitam dibuang:
       1. flood-fill dari area transparan ke piksel gelap yang tersambung (latar),
       2. tepi objek di pita 3 px dari latar diberi alpha lembut menurut terangnya
          & warnanya "dibersihkan" dari hitam (tanpa garis gelap di tepi),
       3. gumpalan kecil terpisah dibuang, lalu dipangkas ke batas objek;
   - langit (sky only) & lantai batu (ground only) dari lukisan desainer di
     assets-src/golden-minang/v2.
   Pakai: node scripts/golden-minang-assets.cjs */
const fs = require("fs");
const sharp = require("sharp");

sharp.cache(false);
const SRC = "assets-src/golden-minang/raw/";
const OUT = "public/templates/golden-minang/";
const SKY = "assets-src/golden-minang/v2/Golden Mist Over Reflective Stone.png";
const GROUND = "assets-src/golden-minang/v2/Wet Golden Stone Pavement.png";
const layer = (file) => `${SRC}Minangkabau-Architectural-Asset-Sheet_${file}.png`;

// [berkas, nama, opsi] — speck: buang gumpalan terpisah < px; cropW: buang serpihan di tepi kanan;
// glow: [atas, bawah, kiri, kanan] — pita (fraksi tinggi) tempat pendar cahaya yang dilukis di atas hitam
//   dijadikan semi-transparan, kecuali kolom kiri..kanan (fraksi lebar) = badan objek yang harus tetap padat
const ASSETS = [
  ["0000_Layer-1", "palace"],
  ["0001_Layer-2", "house"],
  ["0002_Layer-3", "pillar"],
  ["0003_Layer-4", "gable"],
  ["0004_Layer-5", "gableGate"],
  ["0006_Layer-6", "lintel"],
  ["0007_Layer-7", "mountain"],
  ["0008_Layer-8", "sun"],
  ["0010_Layer-9", "lantern", { glow: [0.28, 0.62, 0.29, 0.63] }],
  ["0011_Layer-10", "plant"],
  ["0012_Layer-11", "hedgeRock"],
  ["0013_Layer-12", "hedgeFlower"],
  ["0014_Layer-13", "grass"],
  ["0015_Layer-14", "kerb"],
  ["0016_Layer-15", "leafBig"],
  ["0018_Layer-16", "tree"],
  ["0019_Layer-17", "terrace"],
  ["0020_Layer-18", "flower", { cropW: 89 }],
  ["0021_Layer-19", "banner"],
  ["0022_Layer-20", "treeGold", { speck: 600 }],
  ["0023_Layer-21", "bushGold"],
];

const HARD = 44; // terang maksimum latar hitam
const SOFT = 96; // di atas ini tepi objek penuh
const BAND = 3; // lebar pita tepi (px)
const BG = 20; // warna rata-rata latar hitam
const GLOW = 120; // batas terang pendar yang dilukis di atas hitam

function removeBlack(data, w, h, glow) {
  const n = w * h;
  const bright = (p) => Math.max(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
  const nb = (p, fn) => {
    const x = p % w;
    if (x > 0) fn(p - 1);
    if (x < w - 1) fn(p + 1);
    if (p >= w) fn(p - w);
    if (p < n - w) fn(p + w);
  };
  // 1. latar = area transparan + piksel gelap yang tersambung dengannya
  const dist = new Int16Array(n).fill(-1);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let p = 0; p < n; p++) {
    if (data[p * 4 + 3] < 10) {
      dist[p] = 0;
      queue[tail++] = p;
    }
  }
  while (head < tail) {
    const p = queue[head++];
    nb(p, (q) => {
      if (dist[q] !== -1 || bright(q) >= HARD) return;
      dist[q] = 0;
      queue[tail++] = q;
    });
  }
  for (let p = 0; p < n; p++) if (dist[p] === 0) data[p * 4 + 3] = 0;
  // pendar: di pita ini piksel agak gelap yang tersambung ke latar = cahaya di atas hitam
  // → alpha mengikuti terangnya, warnanya dibersihkan dari hitam
  if (glow) {
    const y0 = Math.floor(glow[0] * h) * w;
    const y1 = Math.ceil(glow[1] * h) * w;
    const lit = new Uint8Array(n);
    const stack = [];
    for (let p = y0; p < y1; p++) if (dist[p] === 0) stack.push(p);
    while (stack.length) {
      const p = stack.pop();
      nb(p, (q) => {
        const qx = (q % w) / w;
        if (q < y0 || q >= y1 || dist[q] === 0 || lit[q] || bright(q) >= GLOW) return;
        if (qx > glow[2] && qx < glow[3]) return;
        lit[q] = 1;
        stack.push(q);
      });
    }
    for (let p = 0; p < n; p++) {
      if (!lit[p]) continue;
      const a = Math.pow(Math.max(0, (bright(p) - BG) / (GLOW - BG)), 1.4);
      for (let c = 0; c < 3; c++) data[p * 4 + c] = Math.min(255, Math.round((data[p * 4 + c] - BG * (1 - a)) / Math.max(a, 0.05)));
      data[p * 4 + 3] = Math.round(255 * a);
      dist[p] = 0;
    }
  }
  // 2. pita tepi: jarak (px) dari latar
  head = 0;
  const seeds = tail;
  while (head < tail) {
    const p = queue[head++];
    if (head > seeds && dist[p] >= BAND) continue;
    nb(p, (q) => {
      if (dist[q] !== -1) return;
      dist[q] = dist[p] + 1;
      queue[tail++] = q;
    });
  }
  for (let p = 0; p < n; p++) {
    const d = dist[p];
    if (d < 1 || d > BAND) continue;
    const b = bright(p);
    // makin dekat ke latar & makin gelap → makin transparan
    let a = Math.max(0, Math.min(1, (b - HARD) / (SOFT - HARD)));
    a = Math.min(1, a + (d - 1) * 0.35);
    if (a <= 0.02) {
      data[p * 4 + 3] = 0;
      continue;
    }
    for (let c = 0; c < 3; c++) {
      const v = (data[p * 4 + c] - BG * (1 - a)) / a;
      data[p * 4 + c] = Math.max(0, Math.min(255, Math.round(v)));
    }
    data[p * 4 + 3] = Math.round(data[p * 4 + 3] * a);
  }
}

// hapus gumpalan alpha terpisah yang luasnya < min piksel
function dropSpecks(data, w, h, min) {
  const seen = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || data[start * 4 + 3] <= 8) continue;
    const comp = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop();
      comp.push(p);
      const x = p % w;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || seen[q]) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
        if (data[q * 4 + 3] > 8) {
          seen[q] = 1;
          stack.push(q);
        }
      }
    }
    if (comp.length < min) for (const p of comp) data[p * 4 + 3] = 0;
  }
}

async function sprite(file, name, opt = {}) {
  let img = sharp(layer(file));
  if (opt.cropW) {
    const m = await img.metadata();
    img = sharp(await img.extract({ left: 0, top: 0, width: opt.cropW, height: m.height }).png().toBuffer());
  }
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  removeBlack(data, info.width, info.height, opt.glow);
  dropSpecks(data, info.width, info.height, opt.speck ?? 60);
  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  await sharp(png).trim({ threshold: 1 }).webp({ quality: 90, alphaQuality: 95 }).toFile(OUT + name + ".webp");
}

/* langit senja + laut keemasan desainer (cakrawala di 72% tinggi gambar) */
async function sky() {
  await sharp(SKY).webp({ quality: 84 }).toFile(OUT + "sky.webp");
}

/* lantai batu basah desainer: bagian atasnya berisi pola kotak-kotak "transparan" yang
   ikut tercetak (bukan alpha), jadi dipotong mulai baris GROUND_TOP, lalu tepi atasnya
   dibuat memudar agar lebur ke kabut cakrawala */
const GROUND_TOP = 762;
async function ground() {
  const meta = await sharp(GROUND).metadata();
  const top = GROUND_TOP;
  const w = meta.width;
  const h = meta.height - top;
  const fade = Buffer.from(
    `<svg width="${w}" height="${h}"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.08" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#f)"/></svg>`
  );
  const floor = await sharp(GROUND).extract({ left: 0, top, width: w, height: h }).ensureAlpha().png().toBuffer();
  await sharp(floor).composite([{ input: fade, blend: "dest-in" }]).webp({ quality: 86, alphaQuality: 90 }).toFile(OUT + "ground.webp");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [file, name, opt] of ASSETS) {
    await sprite(file, name, opt);
    const m = await sharp(OUT + name + ".webp").metadata();
    console.log(name.padEnd(12), `${m.width}×${m.height}`);
  }
  await sky();
  await ground();
  for (const n of ["sky", "ground"]) {
    const m = await sharp(OUT + n + ".webp").metadata();
    console.log(n.padEnd(12), `${m.width}×${m.height}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
