/**
 * MOMENLABS — pemotong aset ilustrasi
 * ------------------------------------------------------------
 * Memotong elemen dari satu lembar ilustrasi berlatar putih menjadi
 * PNG transparan (latar putih dihapus dengan flood-fill dari tepi,
 * jadi warna putih DI DALAM elemen tetap utuh), lalu mengompres foto.
 *
 * Pemakaian:
 *   node scripts/cutout-sprites.cjs <config.json>
 *
 * config.json:
 * {
 *   "sheet": "path/ke/sheet.jpg",
 *   "outDir": "public/templates/nama-template",
 *   "sprites": {
 *     "nama": [x, y, lebar, tinggi],
 *     "nama2": { "box": [x, y, w, h], "global": true, "clear": [[x, y, w, h]] }
 *   },
 *   global : hapus SEMUA area putih (untuk kristal/rantai yang membentuk celah tertutup)
 *   clear  : kotak (koordinat dalam potongan) yang dihapus, mis. serpihan elemen tetangga
 *   bgColor   : [r, g, b] warna latar selain putih (mis. [85, 1, 1] untuk merah tua)
 *   bgWeights : bobot jarak per kanal [r, g, b], bgSlack: toleransi gradasi latar,
 *   threshold / feather : ambang latar & lebar penghalusan tepi
 *   (semua opsi ini boleh diset di level config agar berlaku ke semua sprite)
 *   trimEdges : true / angka (default 0.2) — buang komponen yang menyentuh tepi potongan
 *               dan luasnya < angka × komponen terbesar (serpihan elemen tetangga).
 *               Bisa diset sekali di level config: "trimEdges": true
 *   "photos": { "nama": "path/ke/foto.jpg", ... }
 * }
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const BG_THRESHOLD = 26; // selisih maksimal dari putih agar dianggap latar
const FEATHER = 64; // rentang penghalusan tepi

async function cutout(sheet, spec, outFile) {
  const opt = Array.isArray(spec) ? { box: spec } : spec;
  const [x, y, w, h] = opt.box;
  const { data, info } = await sharp(sheet)
    .extract({ left: x, top: y, width: w, height: h })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  // jarak dari warna latar: default putih; bila bgColor diisi (mis. latar merah),
  // pakai jarak berbobot + toleransi gradasi latar (bgSlack)
  const bgc = opt.bgColor;
  const [wr, wg, wb] = opt.bgWeights ?? [1, 1, 1];
  const slack = opt.bgSlack ?? 0;
  const px = bgc
    ? (i) => {
        const dr = Math.max(0, Math.abs(data[i * 4] - bgc[0]) - slack);
        const dg = Math.max(0, Math.abs(data[i * 4 + 1] - bgc[1]) - slack / 4);
        const db = Math.max(0, Math.abs(data[i * 4 + 2] - bgc[2]) - slack / 4);
        return Math.sqrt((dr * wr) ** 2 + (dg * wg) ** 2 + (db * wb) ** 2);
      }
    : (i) => 255 - Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  const BG_T = opt.threshold ?? BG_THRESHOLD;
  const FEA = opt.feather ?? FEATHER;
  const bgRGB = bgc ?? [255, 255, 255];

  // flood-fill latar dari semua tepi (atau semua putih bila global)
  const bg = new Uint8Array(width * height);
  if (opt.global) for (let k = 0; k < width * height; k++) if (px(k) <= BG_T) bg[k] = 1;
  for (const [cx0, cy0, cw, ch] of opt.clear ?? [])
    for (let j = cy0; j < Math.min(height, cy0 + ch); j++)
      for (let i = cx0; i < Math.min(width, cx0 + cw); i++) bg[j * width + i] = 1;
  const stack = [];
  for (let i = 0; i < width; i++) stack.push(i, (height - 1) * width + i);
  for (let j = 0; j < height; j++) stack.push(j * width, j * width + width - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || px(i) > BG_T) continue;
    bg[i] = 1;
    const cx = i % width;
    const cy = (i / width) | 0;
    if (cx > 0) stack.push(i - 1);
    if (cx < width - 1) stack.push(i + 1);
    if (cy > 0) stack.push(i - width);
    if (cy < height - 1) stack.push(i + width);
  }

  // buang serpihan elemen tetangga: komponen kecil yang menyentuh tepi potongan
  if (opt.trimEdges) {
    const label = new Int32Array(width * height).fill(-1);
    const comps = [];
    for (let s = 0; s < width * height; s++) {
      if (bg[s] || label[s] !== -1) continue;
      const id = comps.length;
      const pixels = [];
      let edge = false;
      const st = [s];
      label[s] = id;
      while (st.length) {
        const k = st.pop();
        pixels.push(k);
        const cx = k % width;
        const cy = (k / width) | 0;
        if (cx === 0 || cy === 0 || cx === width - 1 || cy === height - 1) edge = true;
        for (const n of [cx > 0 ? k - 1 : -1, cx < width - 1 ? k + 1 : -1, cy > 0 ? k - width : -1, cy < height - 1 ? k + width : -1]) {
          if (n >= 0 && !bg[n] && label[n] === -1) {
            label[n] = id;
            st.push(n);
          }
        }
      }
      comps.push({ pixels, edge });
    }
    const maxArea = Math.max(...comps.map((c) => c.pixels.length));
    const ratio = typeof opt.trimEdges === "number" ? opt.trimEdges : 0.2;
    for (const c of comps) if (c.edge && c.pixels.length < maxArea * ratio) for (const k of c.pixels) bg[k] = 1;
  }

  // jarak ke latar (maks 3 px) untuk menghaluskan tepi
  const near = new Uint8Array(width * height);
  for (let pass = 0; pass < 3; pass++) {
    for (let j = 0; j < height; j++)
      for (let i = 0; i < width; i++) {
        const k = j * width + i;
        if (bg[k] || near[k]) continue;
        const nb = [k - 1, k + 1, k - width, k + width];
        if (nb.some((n) => n >= 0 && n < width * height && (bg[n] || near[n] === pass && pass > 0 && near[n])))
          near[k] = pass + 1;
      }
  }

  for (let k = 0; k < width * height; k++) {
    const o = k * 4;
    if (bg[k]) {
      data[o + 3] = 0;
      continue;
    }
    if (near[k]) {
      const a = Math.min(1, px(k) / FEA);
      if (a < 1) {
        // lepaskan campuran putih agar tepi tidak berpendar di latar gelap
        for (let c = 0; c < 3; c++) data[o + c] = Math.max(0, Math.min(255, Math.round((data[o + c] - bgRGB[c] * (1 - a)) / Math.max(a, 0.05))));
        data[o + 3] = Math.round(a * 255);
      }
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .resize({ width: Math.min(width, 900), withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: false })
    .toFile(outFile);
}

async function main() {
  const cfgPath = process.argv[2];
  if (!cfgPath) throw new Error("Pakai: node scripts/cutout-sprites.cjs <config.json>");
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  fs.mkdirSync(cfg.outDir, { recursive: true });

  for (const [name, spec] of Object.entries(cfg.sprites ?? {})) {
    const opt = Array.isArray(spec) ? { box: spec } : { ...spec };
    if (cfg.trimEdges && opt.trimEdges === undefined) opt.trimEdges = cfg.trimEdges;
    for (const k of ["bgColor", "bgWeights", "bgSlack", "threshold", "feather"]) if (cfg[k] !== undefined && opt[k] === undefined) opt[k] = cfg[k];
    await cutout(cfg.sheet, opt, path.join(cfg.outDir, `${name}.png`));
    console.log("sprite", name);
  }
  for (const [name, src] of Object.entries(cfg.photos ?? {})) {
    await sharp(src).rotate().resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(cfg.outDir, `${name}.jpg`));
    console.log("foto", name);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
