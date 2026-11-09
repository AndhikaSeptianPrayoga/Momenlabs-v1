/* Menyiapkan aset template Gebyok Kencana (Adat Jawa klasik · gebyok ukir emas — gaya "Skill 3"):
     - lembar aset desainer (assets-src/gebyok-kencana/lembar-aset.webp, alpha asli) → sprite per kotak (BOX),
       serpihan tetangga dibuang, diperbesar 2× (lanczos) → .webp;
     - lukisan komposisi 9:16 (komposisi.webp) → scene.webp (latar utama) + poster.webp (thumbnail)
       + gold-mask.png (ukiran emas terang → mask kilau cahaya yang menyapu ukiran).
   Pakai: node scripts/gebyok-kencana-assets.cjs */
const fs = require("fs");
const sharp = require("sharp");

sharp.cache(false);
const SRC = "assets-src/gebyok-kencana/";
const OUT = "public/templates/gebyok-kencana/";

// kotak potong di lembar 562×843: [kiri, atas, lebar, tinggi]
const BOX = {
  batikStrip: [4, 4, 64, 612],
  awanL: [66, 8, 162, 72],
  gunungan: [166, 6, 194, 278, { openwork: true }],
  awanR: [298, 6, 218, 68],
  awanS1: [484, 13, 78, 46],
  awanS2: [484, 54, 78, 48],
  awanS3: [488, 98, 70, 44],
  cloudLines: [328, 74, 158, 56],
  gate: [364, 120, 198, 294],
  vine: [70, 78, 138, 334],
  crest: [181, 274, 164, 78],
  finial: [328, 224, 64, 172],
  rose: [158, 348, 94, 96],
  melati: [254, 348, 104, 96],
  goldFlower: [72, 420, 70, 74],
  ronceA: [74, 438, 100, 104],
  ronceB: [146, 476, 138, 116],
  redFlower: [176, 450, 64, 56],
  leafSprig: [280, 436, 104, 166],
  leafSprigB: [350, 422, 138, 124],
  acanthus: [4, 558, 210, 180],
  gunungan2: [374, 458, 184, 294],
  waves: [4, 678, 556, 162],
  petals: [498, 462, 62, 134],
};

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
  // serpihan tetangga (terpotong tepi kotak, bukan objek utama) & remah kecil dibuang
  for (const c of comps) if (c.length < Math.max(20, big * 0.015) || (c.length < big && cut(c))) for (const p of c) data[p * 4 + 3] = 0;
}

const ramp = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));

/* ukiran tembus (openwork): lubang ukiran yang berisi cokelat gelap dijadikan transparan,
   hanya ukiran emas yang terang yang tersisa — latar adegan terlihat menembus kayon */
function openwork(data, w, h) {
  for (let p = 0; p < w * h; p++) {
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    const a = Math.round(data[p * 4 + 3] * ramp(lum, 58, 100));
    data[p * 4 + 3] = a < 40 ? 0 : a; // sisa kabut tipis di sekitar kayon ikut dibuang
  }
}

/* ukiran emas terang di lukisan → mask (kilau cahaya hanya menyapu emas, bukan latar batik gelap) */
async function goldMask() {
  const { data, info } = await sharp(SRC + "komposisi.webp").raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const out = Buffer.alloc(w * h * 4, 255);
  for (let p = 0; p < w * h; p++) {
    const r = data[p * c], g = data[p * c + 1], b = data[p * c + 2];
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    const warm = ramp(r - b, 25, 70); // emas: merah jauh di atas biru
    out[p * 4 + 3] = Math.round(255 * ramp(lum, 85, 165) * warm);
  }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).resize({ width: 540 }).blur(0.6).webp({ quality: 70, alphaQuality: 70 }).toFile(OUT + "gold-mask.webp");
  console.log("gold-mask ok");
}

/* kayon HD untuk cover layar penuh: gambar gunungan HD terpisah dari desainer
   (assets-src/gebyok-kencana/gunungan-hd.webp, 1024×1536, alpha asli) — dirapikan tepinya & disimpan .webp */
async function gununganHD() {
  const t = await sharp(SRC + "gunungan-hd.webp").ensureAlpha().trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  await sharp(t.data).sharpen({ sigma: 0.6, m1: 0.5, m2: 1 }).webp({ quality: 82, alphaQuality: 90 }).toFile(OUT + "gunungan-hd.webp");
  console.log("gunungan-hd", t.info.width, "×", t.info.height);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const { data, info } = await sharp(SRC + "lembar-aset.webp").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [name, [left, top, width, height, opt = {}]] of Object.entries(BOX)) {
    const crop = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) data.copy(crop, y * width * 4, ((top + y) * info.width + left) * 4, ((top + y) * info.width + left + width) * 4);
    cleanCrop(crop, width, height);
    if (opt.openwork) openwork(crop, width, height);
    const png = await sharp(crop, { raw: { width, height, channels: 4 } }).png().toBuffer();
    const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    await sharp(trimmed.data).resize({ width: trimmed.info.width * 2, kernel: "lanczos3" }).webp({ quality: 88, alphaQuality: 92 }).toFile(OUT + name + ".webp");
    console.log(name, trimmed.info.width * 2, "×", trimmed.info.height * 2);
  }
  await sharp(SRC + "komposisi.webp").resize({ width: 1080, kernel: "lanczos3" }).webp({ quality: 86 }).toFile(OUT + "scene.webp");
  await sharp(SRC + "komposisi.webp").resize({ width: 720 }).webp({ quality: 84 }).toFile(OUT + "poster.webp");
  await goldMask();
  await gununganHD();
}

main();
