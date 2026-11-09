/* Menyiapkan aset template Royal Sapphire (Botanical Heritage, toile de Jouy biru & emas):
   lembar kolase desainer (assets-src/royal-sapphire/kolase-aset.png) berlatar PUTIH tanpa alpha →
     1. latar = piksel putih nyaris tanpa warna yang tersambung ke tepi lembar (flood-fill),
     2. putih tertutup yang luas (dalam bingkai emas, lubang lengkung jembatan) ikut dibuang
        (> holeMin px; bawaan 60) kecuali sprite bertanda keepHoles (awan & anggrek: memang putih),
     3. pita tepi 2 px diberi alpha lembut & warnanya dibersihkan dari putih,
     4. tiap objek dipotong per kotak (BOX), potongan tetangga yang terpotong tepi dibuang,
        diperbesar 2× (lanczos) & disimpan .webp.
   Pakai: node scripts/sapphire-assets.cjs */
const fs = require("fs");
const sharp = require("sharp");

sharp.cache(false);
const SRC = "assets-src/royal-sapphire/";
const OUT = "public/templates/royal-sapphire/";

// kotak potong di lembar 1241×1268: [kiri, atas, lebar, tinggi, opsi]
const BOX = {
  tree: [0, 0, 428, 476],
  cloudA: [374, 11, 509, 194, { keepHoles: true }],
  cloudB: [788, 23, 353, 140, { keepHoles: true }],
  cypress: [1064, 23, 176, 446],
  landscape: [266, 161, 803, 338, { keepHoles: true }],
  frame: [863, 464, 374, 482],
  bridge: [2, 476, 377, 251],
  ornSmall: [1193, 479, 48, 95],
  pillar: [383, 491, 95, 266],
  scrollTop: [476, 500, 347, 107],
  corner: [788, 503, 119, 134],
  scrollMid: [473, 605, 365, 104],
  scrollL: [485, 695, 68, 119],
  scrollR: [779, 695, 83, 206],
  crest: [548, 701, 239, 152],
  bouquet: [0, 728, 752, 536, { holeMin: 400 }],
  hydrangea: [452, 830, 179, 182],
  orchid: [647, 842, 122, 95, { keepHoles: true }],
  orchidSpray: [689, 914, 182, 137, { keepHoles: true }],
  blueLily: [863, 920, 182, 182],
  goldLeaves: [1052, 932, 188, 185],
  rose: [740, 1037, 185, 218],
  navyRose: [980, 1067, 125, 116],
  navyLeaf: [1133, 1088, 107, 56],
  goldSprig: [887, 1115, 149, 143],
  navyLeaves: [1049, 1148, 188, 107],
};

const WHITE_MIN = 240; // terang minimum latar putih
const WHITE_CHROMA = 12; // ...dan nyaris tanpa warna
const BGV = 253;

function removeWhite(data, w, h, keepHoles, holeMin = 60) {
  const n = w * h;
  const isBg = (p) => {
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
    return Math.min(r, g, b) >= WHITE_MIN && Math.max(r, g, b) - Math.min(r, g, b) <= WHITE_CHROMA;
  };
  const nb = (p, fn) => { const x = p % w; if (x > 0) fn(p - 1); if (x < w - 1) fn(p + 1); if (p >= w) fn(p - w); if (p < n - w) fn(p + w); };
  const dist = new Int16Array(n).fill(-1);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  for (let p = 0; p < n; p++) {
    const x = p % w, y = (p / w) | 0;
    if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && isBg(p)) { dist[p] = 0; queue[tail++] = p; }
  }
  while (head < tail) { const p = queue[head++]; nb(p, (q) => { if (dist[q] === -1 && isBg(q)) { dist[q] = 0; queue[tail++] = q; } }); }
  // putih tertutup yang luas: bagian dalam bingkai, lubang jembatan
  if (!keepHoles) {
    const seen = new Uint8Array(n);
    for (let s = 0; s < n; s++) {
      if (seen[s] || dist[s] === 0 || !isBg(s)) continue;
      const comp = [s];
      seen[s] = 1;
      for (let i = 0; i < comp.length; i++) nb(comp[i], (q) => { if (!seen[q] && dist[q] !== 0 && isBg(q)) { seen[q] = 1; comp.push(q); } });
      if (comp.length > holeMin) for (const p of comp) { dist[p] = 0; queue[tail++] = p; }
    }
  }
  for (let p = 0; p < n; p++) if (dist[p] === 0) data[p * 4 + 3] = 0;
  head = 0;
  const seeds = tail;
  while (head < tail) { const p = queue[head++]; if (head > seeds && dist[p] >= 2) continue; nb(p, (q) => { if (dist[q] === -1) { dist[q] = dist[p] + 1; queue[tail++] = q; } }); }
  for (let p = 0; p < n; p++) {
    const d = dist[p];
    if (d < 1 || d > 2) continue;
    const lum = Math.min(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    let a = Math.max(0, Math.min(1, (BGV - lum) / 80));
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
  for (const c of comps) if (c.length < 30 || (c.length < big && cut(c) && c.length < big * 0.6)) for (const p of c) data[p * 4 + 3] = 0;
}

/* mask air terjun: piksel air putih di sprite lanskap (hanya di area dua air terjun) → alpha.
   Dipakai sebagai CSS mask agar animasi aliran air tampil persis di permukaan air terjun lukisan. */
async function fallsMask() {
  const { data, info } = await sharp(OUT + "landscape.webp").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const out = Buffer.alloc(w * h * 4, 255);
  const ramp = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const u = x / w, v = y / h;
      // area dua air terjun (lebar x 58–74%, dari bibir tebing ±40% sampai kaki ±82% tinggi lanskap)
      const inArea = ramp(u, 0.575, 0.59) * (1 - ramp(u, 0.73, 0.745)) * ramp(v, 0.38, 0.42) * (1 - ramp(v, 0.8, 0.86));
      const lum = Math.min(data[p], data[p + 1], data[p + 2]);
      const water = ramp(lum, 195, 235);
      out[p + 3] = Math.round(255 * inArea * water * (data[p + 3] / 255));
    }
  }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).blur(1.2).png().toFile(OUT + "falls-mask.png");
  console.log("falls-mask ok");
}

/* tekstur helai air terjun (bisa diulang vertikal tanpa sambungan): tiap kolom = satu helai
   dengan kekuatan acak, terang-redup berulang sepanjang tinggi (gelombang periodik → mulus saat
   digulir). Helai putih berkilau berselang dengan helai biru ukiran agar gerak jatuh terlihat. */
async function waterTexture() {
  const W = 128, H = 512;
  const out = Buffer.alloc(W * H * 4);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const strands = Array.from({ length: W }, () => ({ s: rnd(), k: 1 + Math.floor(rnd() * 3), p: rnd() * Math.PI * 2, blue: rnd() < 0.35 }));
  // haluskan kekuatan antar kolom agar helai selebar 2–4 px
  const sm = strands.map((_, x) => (strands[(x + W - 1) % W].s + strands[x].s * 2 + strands[(x + 1) % W].s) / 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const st = strands[x];
      const wave = 0.5 + 0.5 * Math.sin((y / H) * Math.PI * 2 * st.k + st.p);
      const wave2 = 0.5 + 0.5 * Math.sin((y / H) * Math.PI * 2 * (st.k + 2) + st.p * 1.7);
      const a = Math.max(0, Math.min(1, (sm[x] - 0.35) * 2.2)) * (0.35 + 0.65 * wave * wave2);
      const p = (y * W + x) * 4;
      if (st.blue) { out[p] = 108; out[p + 1] = 128; out[p + 2] = 170; out[p + 3] = Math.round(a * 200); }
      else { out[p] = 255; out[p + 1] = 255; out[p + 2] = 255; out[p + 3] = Math.round(a * 235); }
    }
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).blur(0.6).png().toFile(OUT + "water-strands.png");
  console.log("water-strands ok");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const { data, info } = await sharp(SRC + "kolase-aset.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [name, [left, top, width, height, opt = {}]] of Object.entries(BOX)) {
    const crop = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) data.copy(crop, y * width * 4, ((top + y) * info.width + left) * 4, ((top + y) * info.width + left + width) * 4);
    removeWhite(crop, width, height, opt.keepHoles, opt.holeMin);
    cleanCrop(crop, width, height);
    const png = await sharp(crop, { raw: { width, height, channels: 4 } }).png().toBuffer();
    const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    await sharp(trimmed.data).resize({ width: trimmed.info.width * 2, kernel: "lanczos3" }).webp({ quality: 88, alphaQuality: 92 }).toFile(OUT + name + ".webp");
    console.log(name, trimmed.info.width * 2, "×", trimmed.info.height * 2);
  }
  await fallsMask();
  await waterTexture();
  // lukisan komposisi desainer → gambar sampul/referensi (poster katalog)
  await sharp(SRC + "komposisi.png").resize({ width: 720 }).webp({ quality: 84 }).toFile(OUT + "poster.webp");
  console.log("poster ok");
}

main();
