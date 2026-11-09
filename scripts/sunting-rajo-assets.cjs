/* Menyiapkan aset template Sunting Rajo (Adat Minang · rumah gadang, songket marun & sunting emas — gaya "Skill 3"):
     - lembar aset desainer (assets-src/sunting-rajo/lembar-aset.webp) RGB tanpa alpha: pola kotak-kotak "transparan"
       ikut tercetak → dibuang (flood-fill dari tepi + celah berpola kotak-kotak; cara sama dengan Sekar Prambanan),
       lalu tiap objek dipotong per kotak (BOX), serpihan tetangga dibuang, diperbesar 2× (lanczos) → .webp;
     - lukisan komposisi 9:16 (komposisi.webp) → scene.webp + poster.webp + gold-mask.webp (ukiran emas → mask kilau).
   Pakai: node scripts/sunting-rajo-assets.cjs           → semua aset
          node scripts/sunting-rajo-assets.cjs --preview → lembar bersih bergaris (untuk menentukan BOX) */
const fs = require("fs");
const sharp = require("sharp");

sharp.cache(false);
const SRC = "assets-src/sunting-rajo/";
const OUT = "public/templates/sunting-rajo/";

// kotak potong di lembar 941×1672: [kiri, atas, lebar, tinggi]
const BOX = {
  rumah: [8, 4, 645, 388],
  awanA: [684, 22, 254, 98],
  awanB: [658, 124, 280, 108],
  ornTri: [653, 238, 120, 160],
  gonjong: [772, 188, 169, 260],
  column: [4, 403, 134, 600],
  songketHang: [140, 403, 162, 368],
  crest: [310, 393, 504, 131],
  songketStrip: [846, 458, 95, 446],
  arch: [286, 518, 580, 565],
  drape: [0, 848, 292, 524],
  roseDuo: [198, 1082, 166, 196],
  rose: [18, 1288, 180, 160],
  roseB: [284, 1278, 170, 146],
  leafSprig: [174, 1238, 194, 254],
  leafSmall: [392, 1382, 122, 120],
  sunting: [398, 1012, 390, 398],
  goldLeaves: [770, 1082, 168, 254],
  bouquet: [583, 1288, 358, 384],
  songketWave: [0, 1450, 784, 222],
};

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
    if (comp.length < 40) continue;
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


function cleanCrop(data, w, h) {
  const seen = new Uint8Array(w * h);
  const comps = [];
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || data[s * 4 + 3] <= 50) continue;
    const comp = [s];
    seen[s] = 1;
    for (let i = 0; i < comp.length; i++) {
      const p = comp[i], x = p % w;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || seen[q]) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
        if (data[q * 4 + 3] > 50) { seen[q] = 1; comp.push(q); }
      }
    }
    comps.push(comp);
  }
  if (!comps.length) return;
  const big = Math.max(...comps.map((c) => c.length));
  const cut = (c) => c.some((p) => { const x = p % w, y = (p / w) | 0; return x === 0 || y === 0 || x === w - 1 || y === h - 1; });
  for (const c of comps) if (c.length < Math.max(20, big * 0.015) || (c.length < big && cut(c))) for (const p of c) data[p * 4 + 3] = 0;
}

const ramp = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));

async function goldMask() {
  const { data, info } = await sharp(SRC + "komposisi.webp").raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const out = Buffer.alloc(w * h * 4, 255);
  for (let p = 0; p < w * h; p++) {
    const r = data[p * c], g = data[p * c + 1], b = data[p * c + 2];
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    // emas: terang & hijau cukup tinggi (merah marun gelap tidak ikut)
    out[p * 4 + 3] = Math.round(255 * ramp(lum, 95, 170) * ramp(g / Math.max(1, r), 0.45, 0.62));
  }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).resize({ width: 540 }).blur(0.6).webp({ quality: 70, alphaQuality: 70 }).toFile(OUT + "gold-mask.webp");
  console.log("gold-mask ok");
}

/* kain songket untuk tirai & langit: pita songket (motif belah ketupat) dijajarkan 4 kolom menjadi kain,
   lalu disusun cermin atas-bawah agar bisa diulang vertikal tanpa sambungan. */
async function songketFabric() {
  const strip = await sharp(OUT + "songketStrip.webp").metadata();
  // buang ujung atas & bawah pita (tepi kain), sisakan bagian motif berulang
  const top = Math.round(strip.height * 0.06), h = Math.round(strip.height * 0.88), w = strip.width - 30;
  const piece = await sharp(OUT + "songketStrip.webp").extract({ left: 15, top, width: w, height: h }).flatten({ background: "#5A0F14" }).png().toBuffer();
  const flipped = await sharp(piece).flip().png().toBuffer();
  const cols = 4, W = w * cols, H = h * 2;
  const comp = [];
  for (let c = 0; c < cols; c++) {
    comp.push({ input: c % 2 ? flipped : piece, left: c * w, top: 0 });
    comp.push({ input: c % 2 ? piece : flipped, left: c * w, top: h });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: "#5A0F14" } }).composite(comp).webp({ quality: 80 }).toFile(OUT + "songket-fabric.webp");
  console.log("songket-fabric", W, "×", H);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const { data, info } = await sharp(SRC + "lembar-aset.webp").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  removeChecker(data, info.width, info.height);
  if (process.argv.includes("--preview")) {
    const W = info.width, H = info.height;
    let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
    for (let x = 0; x < W; x += 50) svg += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="cyan" stroke-width="0.7"/><text x="${x + 1}" y="11" font-size="11" fill="cyan">${x}</text>`;
    for (let y = 0; y < H; y += 50) svg += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="cyan" stroke-width="0.7"/><text x="1" y="${y + 11}" font-size="11" fill="cyan">${y}</text>`;
    svg += "</svg>";
    const png = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
    await sharp({ create: { width: W, height: H, channels: 4, background: "#1d2a44" } }).composite([{ input: png }, { input: Buffer.from(svg) }]).png().toFile(process.argv[3] || "preview.png");
    return;
  }
  for (const [name, [left, top, width, height]] of Object.entries(BOX)) {
    const crop = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) data.copy(crop, y * width * 4, ((top + y) * info.width + left) * 4, ((top + y) * info.width + left + width) * 4);
    cleanCrop(crop, width, height);
    const png = await sharp(crop, { raw: { width, height, channels: 4 } }).png().toBuffer();
    const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    await sharp(trimmed.data).resize({ width: trimmed.info.width * 2, kernel: "lanczos3" }).webp({ quality: 86, alphaQuality: 90 }).toFile(OUT + name + ".webp");
    console.log(name, trimmed.info.width * 2, "×", trimmed.info.height * 2);
  }
  await sharp(SRC + "komposisi.webp").resize({ width: 1080, kernel: "lanczos3" }).webp({ quality: 84 }).toFile(OUT + "scene.webp");
  await sharp(SRC + "komposisi.webp").resize({ width: 600 }).webp({ quality: 80 }).toFile(OUT + "poster.webp");
  await goldMask();
  await songketFabric();
}

main();
