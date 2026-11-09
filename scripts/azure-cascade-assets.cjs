/* Menyiapkan aset template Azure Cascade (Modern Aesthetic · toile biru pudar, krem & emas — gaya "Skill 2"):
     - lembar aset desainer (assets-src/azure-cascade/lembar-aset.webp, alpha asli) → tiap objek dipotong per
       kotak (BOX), potongan tetangga yang terpotong tepi kotak dibuang, diperbesar 2× (lanczos) → .webp;
     - lukisan komposisi (komposisi.webp) → scene.webp (latar utama) + falls-mask.png (permukaan air terjun,
       untuk CSS mask animasi aliran air) + lake-mask.png (permukaan danau, untuk kilau riak);
     - water-strands.png: tekstur helai air jatuh yang bisa diulang vertikal tanpa sambungan.
   Pakai: node scripts/azure-cascade-assets.cjs */
const fs = require("fs");
const sharp = require("sharp");

sharp.cache(false);
const SRC = "assets-src/azure-cascade/";
const OUT = "public/templates/azure-cascade/";

// kotak potong di lembar 633×1125: [kiri, atas, lebar, tinggi]
const BOX = {
  branchL: [0, 0, 262, 212],
  branchR: [438, 0, 195, 150],
  cloudTop: [298, 78, 220, 90],
  cloudBig: [200, 138, 228, 94],
  cloudSmall: [430, 165, 108, 52],
  cloudL: [122, 188, 120, 58],
  birds: [536, 168, 97, 72],
  mountains: [268, 222, 360, 115],
  falls: [0, 400, 258, 238],
  smallFalls: [268, 536, 110, 72],
  rotunda: [492, 436, 141, 172],
  urn: [384, 542, 190, 145],
  cypress: [564, 615, 69, 125],
  blossom: [4, 638, 192, 112],
  orchidBig: [164, 688, 96, 94],
  orchidA: [6, 730, 98, 84],
  orchidB: [8, 804, 94, 78],
  orchidC: [74, 848, 98, 74],
  roseNavy: [98, 760, 100, 98],
  roseNavyB: [256, 784, 76, 76],
  roseWhite: [172, 810, 100, 90],
  hydrangea: [368, 758, 76, 80],
  leafGold: [268, 858, 100, 90],
  leafGoldB: [328, 860, 78, 90],
  ovalFrame: [6, 912, 74, 114],
  lantern: [88, 958, 28, 74],
  ornament: [90, 915, 102, 52],
  ornamentB: [370, 925, 100, 45],
  divider: [204, 962, 192, 28],
  ribbon: [8, 1056, 190, 58],
  landscape: [284, 1032, 342, 92],
  blueLeaves: [528, 948, 105, 98],
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
  // serpihan tetangga: komponen yang terpotong tepi kotak (kecuali objek utama) & remah kecil dibuang
  for (const c of comps) if (c.length < Math.max(20, big * 0.02) || (c.length < big && cut(c))) for (const p of c) data[p * 4 + 3] = 0;
}

const ramp = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));

/* mask dari lukisan komposisi: piksel terang (air) di dalam area elips berbulu */
async function areaMask(name, area, lum) {
  const { data, info } = await sharp(SRC + "komposisi.webp").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const out = Buffer.alloc(w * h * 4, 255);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      let inA = 0;
      for (const [x0, y0, x1, y1, f] of area) inA = Math.max(inA, ramp(x, x0, x0 + f) * (1 - ramp(x, x1 - f, x1)) * ramp(y, y0, y0 + f) * (1 - ramp(y, y1 - f, y1)));
      const l = Math.min(data[p], data[p + 1], data[p + 2]);
      out[p + 3] = Math.round(255 * inA * ramp(l, lum[0], lum[1]) * (data[p + 3] / 255));
    }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).blur(1).png().toFile(OUT + name);
  console.log(name, "ok");
}

/* helai air jatuh: tiap kolom satu helai, terang-redup berulang sepanjang tinggi (periodik → mulus digulir).
   Helai putih berkilau diselingi helai biru-kelabu ukiran agar gerak jatuh jelas terlihat di lukisan terang. */
async function waterTexture() {
  const W = 96, H = 384;
  const out = Buffer.alloc(W * H * 4);
  let seed = 9;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const st = Array.from({ length: W }, () => ({ s: rnd(), k: 1 + Math.floor(rnd() * 3), p: rnd() * Math.PI * 2, dark: rnd() < 0.42 }));
  const sm = st.map((_, x) => (st[(x + W - 1) % W].s + st[x].s * 2 + st[(x + 1) % W].s) / 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const s = st[x];
      const w1 = 0.5 + 0.5 * Math.sin((y / H) * Math.PI * 2 * s.k + s.p);
      const w2 = 0.5 + 0.5 * Math.sin((y / H) * Math.PI * 2 * (s.k + 3) + s.p * 1.9);
      const a = Math.max(0, Math.min(1, (sm[x] - 0.3) * 2.4)) * (0.25 + 0.75 * w1 * w2);
      const p = (y * W + x) * 4;
      if (s.dark) { out[p] = 92; out[p + 1] = 112; out[p + 2] = 145; out[p + 3] = Math.round(a * 190); }
      else { out[p] = 255; out[p + 1] = 255; out[p + 2] = 255; out[p + 3] = Math.round(a * 250); }
    }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).blur(0.5).png().toFile(OUT + "water-strands.png");
  console.log("water-strands ok");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const { data, info } = await sharp(SRC + "lembar-aset.webp").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [name, [left, top, width, height]] of Object.entries(BOX)) {
    const crop = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) data.copy(crop, y * width * 4, ((top + y) * info.width + left) * 4, ((top + y) * info.width + left + width) * 4);
    cleanCrop(crop, width, height);
    const png = await sharp(crop, { raw: { width, height, channels: 4 } }).png().toBuffer();
    const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    await sharp(trimmed.data).resize({ width: trimmed.info.width * 2, kernel: "lanczos3" }).webp({ quality: 88, alphaQuality: 92 }).toFile(OUT + name + ".webp");
    console.log(name, trimmed.info.width * 2, "×", trimmed.info.height * 2);
  }
  // latar utama: lukisan komposisi (bagian langit tengah memang transparan → diberi kertas krem di halaman)
  await sharp(SRC + "komposisi.webp").resize({ width: 1500, kernel: "lanczos3" }).webp({ quality: 86, alphaQuality: 90 }).toFile(OUT + "scene.webp");
  await sharp(SRC + "komposisi.webp").flatten({ background: "#FBF8F1" }).resize({ width: 720 }).webp({ quality: 84 }).toFile(OUT + "poster.webp");
  // air terjun utama + air terjun kecil kanan (koordinat komposisi 750×1125)
  await areaMask("falls-mask.png", [[86, 452, 202, 645, 8], [196, 548, 244, 642, 6]], [192, 236]);
  // danau: kilau riak
  await areaMask("lake-mask.png", [[80, 615, 720, 760, 40]], [170, 225]);
  await waterTexture();
}

main();
