/* Menyiapkan aset Baroque Grand Palace versi baru dari folder kiriman desainer
   (assets-src/baroque-palace/v2, tiap objek di kanvas 1536×1024):
   - dipangkas ke batas objek, diberi nama yang jelas, disimpan WebP;
   - "speck": buang gumpalan kecil terpisah (bintik/garis nyasar) di bawah luas ini (px);
   - ground: hanya pita rumput & jalan (bagian atas yang transparan dibuang).
   Pakai: node scripts/baroque-new-assets.cjs */
const fs = require("fs");
const sharp = require("sharp");

sharp.cache(false);
const SRC = "assets-src/baroque-palace/v2/";
const OUT = "public/templates/baroque-palace/v2/";

const ASSETS = [
  { src: "Dreamy Watercolour Sunset Backdrop.png", name: "sky", opaque: true },
  { src: "Watercolour Garden Path on Transparent Background.png", name: "ground", speck: 400, crop: { top: 640 } },
  { src: "Aset Taman Istana Barok Senja-Recovered.png", name: "clouds" },
  { src: "5.png", name: "palace", speck: 300 },
  { src: "1.png", name: "tree" },
  { src: "7.png", name: "cypress" },
  { src: "13.png", name: "statueL" },
  { src: "14.png", name: "statueR" },
  { src: "11.png", name: "fountain" },
  { src: "9.png", name: "roseLow" },
  { src: "10.png", name: "roseBush" },
  { src: "12.png", name: "roseSmall" },
  { src: "15.png", name: "balustrade" },
  { src: "4.png", name: "branch" },
];

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

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const a of ASSETS) {
    let img = sharp(SRC + a.src);
    const meta = await img.metadata();
    if (a.crop) img = img.extract({ left: 0, top: a.crop.top, width: meta.width, height: meta.height - a.crop.top });
    if (a.opaque) {
      await img.webp({ quality: 86 }).toFile(OUT + a.name + ".webp");
    } else {
      const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      if (a.speck) dropSpecks(data, info.width, info.height, a.speck);
      const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
      await sharp(png).trim({ threshold: 1 }).webp({ quality: 88, alphaQuality: 95 }).toFile(OUT + a.name + ".webp");
    }
    const m = await sharp(OUT + a.name + ".webp").metadata();
    console.log(a.name.padEnd(11), `${m.width}×${m.height}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
