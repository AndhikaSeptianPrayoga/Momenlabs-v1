/* Menyiapkan aset template Arunika (Jawa, fajar jingga):
   - sprite dari lembar layer desainer (assets-src/arunika/raw,
     "Javanese-Temple-Parallax-Asset-Sheet_00NN_Layer-N.png") dipangkas ke batas
     objeknya & disimpan WebP dengan nama yang jelas;
   - langit (sky only) & lantai (ground only) dari lukisan desainer di assets-src/arunika/v2.
   Pakai: node scripts/arunika-assets.cjs */
const fs = require("fs");
const sharp = require("sharp");

sharp.cache(false);
const SRC = "assets-src/arunika/raw/";
const OUT = "public/templates/arunika/";
const SKY = "assets-src/arunika/v2/Ethereal Crimson Sky and Reflections.png";
const GROUND = "assets-src/arunika/v2/Ornate Reflective Mahogany Stage Floor.png";
const layer = (n) => `${SRC}Javanese-Temple-Parallax-Asset-Sheet_${String(n - 1).padStart(4, "0")}_Layer-${n}.png`;

const ASSETS = [
  [2, "sun"],
  [3, "cloudGold"],
  [4, "cloudCream"],
  [5, "gate"],
  [6, "pagoda"],
  [7, "railing"],
  [8, "platform"],
  [9, "crest"],
  [10, "lotus"],
  [12, "cloudA"],
  [13, "cloudB"],
  [14, "mountain"],
  [15, "cloudC"],
  [16, "cloudD"],
  [17, "cloudE"],
  [18, "cloudF"],
  [19, "cloudG"],
  [20, "branch"],
  [21, "tree"],
  [22, "pendopo"],
  [23, "lantern"],
  [24, "bush"],
  [25, "bushLotus"],
];

/* langit fajar desainer (cakrawala lautnya di 71% tinggi gambar; bagian bawah
   nanti tertutup lantai) */
async function sky() {
  await sharp(SKY).webp({ quality: 84 }).toFile(OUT + "sky.webp");
}

/* lantai mahoni desainer: bagian atasnya berisi pola kotak-kotak "transparan" yang
   ikut tercetak (bukan alpha), jadi dipotong mulai baris 452, lalu tepi atasnya
   dibuat memudar agar lebur ke kabut cakrawala */
async function ground() {
  const meta = await sharp(GROUND).metadata();
  const top = 452;
  const w = meta.width;
  const h = meta.height - top;
  const fade = Buffer.from(
    `<svg width="${w}" height="${h}"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.06" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#f)"/></svg>`
  );
  const floor = await sharp(GROUND).extract({ left: 0, top, width: w, height: h }).ensureAlpha().png().toBuffer();
  await sharp(floor).composite([{ input: fade, blend: "dest-in" }]).webp({ quality: 86, alphaQuality: 90 }).toFile(OUT + "ground.webp");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [n, name] of ASSETS) {
    await sharp(layer(n)).trim({ threshold: 1 }).webp({ quality: 90, alphaQuality: 95 }).toFile(OUT + name + ".webp");
    const m = await sharp(OUT + name + ".webp").metadata();
    console.log(name.padEnd(11), `${m.width}×${m.height}`);
  }
  await sky();
  await ground();
  for (const n of ["sky", "ground"]) {
    const m = await sharp(OUT + n + ".webp").metadata();
    console.log(n.padEnd(11), `${m.width}×${m.height}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
