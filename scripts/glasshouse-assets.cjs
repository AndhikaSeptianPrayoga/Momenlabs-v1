/* Menyiapkan aset template Botanical Glasshouse dari bahan desainer (Assets/Parralax Premium →
   assets-src/botanical-glasshouse/v2):
     - lembar aset taman klasik (PNG beralpha asli) → tiap objek dipotong per kotak (BOX),
       potongan objek tetangga yang terpotong tepi kotak dibuang, lalu diperbesar 2× (lanczos);
     - langit senja (sky only) → sky.webp;
     - teras batu & tangga kerikil (atas transparan) → dipangkas → terrace.webp.
   Pakai: node scripts/glasshouse-assets.cjs */
const sharp = require("sharp");

sharp.cache(false);
const SRC = "assets-src/botanical-glasshouse/v2/";
const SHEET = SRC + "aset-taman-klasik.png";
const OUT = "public/templates/botanical-glasshouse/v2/";

// kotak potong di lembar 1536×1024: [kiri, atas, lebar, tinggi, opsi]; opsi.erase = kotak (koordinat potongan) milik objek tetangga
const BOX = {
  glasshouse: [28, 6, 672, 492],
  fountain: [694, 84, 302, 412, { erase: [[250, 0, 52, 338], [0, 300, 14, 112]] }],
  statueFlora: [944, 88, 118, 374],
  statueMuse: [1060, 146, 96, 318],
  urnPedestal: [1172, 94, 146, 368],
  cornerL: [0, 0, 252, 288],
  cornerR: [1204, 0, 332, 210],
  lamp: [1346, 146, 62, 312],
  urnSmall: [1406, 270, 128, 188],
  cypressA: [6, 478, 92, 344],
  cypressB: [90, 508, 76, 314],
  cypressC: [156, 508, 90, 314],
  balustrade: [288, 518, 520, 224],
  hedgeA: [212, 748, 290, 94],
  hedgeB: [512, 752, 240, 90],
  topiary: [802, 568, 104, 176],
  pedestalUrn: [902, 498, 116, 250],
  tree: [1018, 452, 506, 424],
  roseBush: [788, 748, 284, 112],
  roseClump: [792, 858, 180, 150],
  sprig: [972, 858, 104, 150],
  lampPost: [1112, 726, 80, 284],
  hydrangea: [1186, 878, 212, 130],
  shrub: [1342, 742, 188, 168],
  leafSprig: [1390, 914, 136, 96],
};

// buang gumpalan kecil & potongan objek tetangga yang terpotong tepi kotak
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
  const big = Math.max(...comps.map((c) => c.length));
  const cut = (c) => c.some((p) => { const x = p % w, y = (p / w) | 0; return x === 0 || y === 0 || x === w - 1 || y === h - 1; });
  for (const c of comps) if (c.length < 40 || (c.length < big && cut(c) && c.length < big * 0.6)) for (const p of c) data[p * 4 + 3] = 0;
  // sisa kabut alpha yang sangat tipis (pendar latar desainer) ikut dibuang
  for (let p = 0; p < w * h; p++) if (data[p * 4 + 3] < 18) data[p * 4 + 3] = 0;
}

async function sprites() {
  const { data, info } = await sharp(SHEET).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [name, [left, top, width, height, opt = {}]] of Object.entries(BOX)) {
    const crop = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) data.copy(crop, y * width * 4, ((top + y) * info.width + left) * 4, ((top + y) * info.width + left + width) * 4);
    for (const [ex, ey, ew, eh] of opt.erase || []) for (let y = ey; y < Math.min(height, ey + eh); y++) for (let x = ex; x < Math.min(width, ex + ew); x++) crop[(y * width + x) * 4 + 3] = 0;
    cleanCrop(crop, width, height);
    const png = await sharp(crop, { raw: { width, height, channels: 4 } }).png().toBuffer();
    const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    await sharp(trimmed.data)
      .resize({ width: trimmed.info.width * 2, kernel: "lanczos3" })
      .webp({ quality: 88, alphaQuality: 92 })
      .toFile(OUT + name + ".webp");
    console.log(name, trimmed.info.width * 2, "×", trimmed.info.height * 2);
  }
}

/* jalur taman formal (halaman rumput, pagar semak, guci & jalan batu berperspektif): RGB dengan pola
   kotak-kotak "transparan" tercetak di langitnya → latar = piksel abu-abu terang nyaris tanpa warna yang
   tersambung ke tepi atas (flood-fill), tepinya dilembutkan 2 px, lalu dipangkas */
async function lawn() {
  const { data, info } = await sharp(SRC + "jalur-taman.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;
  const isBg = (p) => {
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
    return Math.min(r, g, b) >= 214 && Math.max(r, g, b) - Math.min(r, g, b) <= 14;
  };
  const dist = new Int16Array(n).fill(-1);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  for (let x = 0; x < w; x++) if (isBg(x)) { dist[x] = 0; queue[tail++] = x; }
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { const p = y * w + x; if (dist[p] === -1 && isBg(p)) { dist[p] = 0; queue[tail++] = p; } }
  const nb = (p, fn) => { const x = p % w; if (x > 0) fn(p - 1); if (x < w - 1) fn(p + 1); if (p >= w) fn(p - w); if (p < n - w) fn(p + w); };
  while (head < tail) { const p = queue[head++]; nb(p, (q) => { if (dist[q] === -1 && isBg(q)) { dist[q] = 0; queue[tail++] = q; } }); }
  for (let p = 0; p < n; p++) if (dist[p] === 0) data[p * 4 + 3] = 0;
  head = 0;
  const seeds = tail;
  while (head < tail) { const p = queue[head++]; if (head > seeds && dist[p] >= 2) continue; nb(p, (q) => { if (dist[q] === -1) { dist[q] = dist[p] + 1; queue[tail++] = q; } }); }
  for (let p = 0; p < n; p++) {
    const d = dist[p];
    if (d < 1 || d > 2) continue;
    const lum = Math.min(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    let a = Math.max(0, Math.min(1, (246 - lum) / 90));
    a = Math.min(1, a + (d - 1) * 0.45);
    if (a <= 0.03) { data[p * 4 + 3] = 0; continue; }
    for (let c = 0; c < 3; c++) data[p * 4 + c] = Math.max(0, Math.min(255, Math.round((data[p * 4 + c] - 246 * (1 - a)) / a)));
    data[p * 4 + 3] = Math.round(255 * a);
  }
  // serpihan kotak-kotak yang tersisa di langit (di atas cakrawala) ikut dibuang
  for (let y = 0; y < Math.round(h * 0.55); y++) for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = 0;
  const png = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const out = await sharp(png).webp({ quality: 86, alphaQuality: 92 }).toFile(OUT + "lawn.webp");
  console.log("lawn", out.width, "×", out.height);
}

async function main() {
  require("fs").mkdirSync(OUT, { recursive: true });
  await sprites();
  await lawn();
  await sharp(SRC + "langit-senja.png").webp({ quality: 84 }).toFile(OUT + "sky.webp");
  await sharp(SRC + "interior.png").webp({ quality: 86 }).toFile(OUT + "interior.webp"); // lukisan konservatori (adegan interior)
  const t = await sharp(SRC + "teras-kerikil.png").trim({ threshold: 1 }).webp({ quality: 86, alphaQuality: 92 }).toFile(OUT + "terrace.webp");
  console.log("sky ok · terrace", t.width, "×", t.height);
}

main();
