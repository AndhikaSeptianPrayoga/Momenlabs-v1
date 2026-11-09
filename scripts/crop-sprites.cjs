/* Memotong sprite dari lembar aset yang SUDAH transparan (PNG/WebP ber-alpha).
   Pakai: node scripts/crop-sprites.cjs <config.json>
   config: {
     "sheet": "...", "outDir": "...", "quality": 86,
     "sprites": {
       "nama": [x, y, lebar, tinggi],
       "nama2": { "box": [x, y, w, h], "erase": [[x, y, w, h], ...], "patch": [...], "clean": 0.25 }
     }
   }
   erase : kotak (koordinat lembar) yang dihapus, mis. serpihan elemen tetangga
   patch : kotak yang diisi interpolasi mendatar dari tepinya (menutup benda yang menembus)
   clean : buang gumpalan yang menyentuh tepi potongan & luasnya < clean × gumpalan
           terbesar (default 0.25, 0 = matikan) — sisa elemen tetangga yang terpotong
   Sisa transparan di tepi dibuang, hasil disimpan WebP. */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

sharp.cache(false);

function cleanEdges(data, w, h, frac) {
  const label = new Int32Array(w * h).fill(-1);
  const comps = [];
  const solid = (i) => data[i * 4 + 3] > 16;
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== -1 || !solid(start)) continue;
    const id = comps.length;
    const stack = [start];
    label[start] = id;
    let area = 0;
    let edge = false;
    while (stack.length) {
      const p = stack.pop();
      area++;
      const x = p % w;
      const y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
        if (label[q] === -1 && solid(q)) {
          label[q] = id;
          stack.push(q);
        }
      }
    }
    comps.push({ area, edge });
  }
  const largest = Math.max(0, ...comps.map((c) => c.area));
  for (let i = 0; i < w * h; i++) {
    const c = comps[label[i]];
    if (c && c.edge && c.area < largest * frac) data[i * 4 + 3] = 0;
    else if (!c) data[i * 4 + 3] = Math.min(data[i * 4 + 3], data[i * 4 + 3] > 16 ? 255 : 0);
  }
}

async function main() {
  const cfg = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  fs.mkdirSync(cfg.outDir, { recursive: true });
  const sheet = fs.readFileSync(cfg.sheet);
  for (const [name, spec] of Object.entries(cfg.sprites)) {
    const opt = Array.isArray(spec) ? { box: spec } : spec;
    const [left, top, width, height] = opt.box;
    const { data } = await sharp(sheet).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const [ex, ey, ew, eh] of opt.erase ?? []) {
      for (let y = Math.max(0, ey - top); y < Math.min(height, ey - top + eh); y++)
        for (let x = Math.max(0, ex - left); x < Math.min(width, ex - left + ew); x++) data[(y * width + x) * 4 + 3] = 0;
    }
    // tambal: isi kotak dengan interpolasi mendatar dari piksel tepi kiri & kanannya
    for (const [px, py, pw, ph] of opt.patch ?? []) {
      const x0 = Math.max(0, px - left - 1);
      const x1 = Math.min(width - 1, px - left + pw);
      for (let y = Math.max(0, py - top); y < Math.min(height, py - top + ph); y++)
        for (let x = x0 + 1; x < x1; x++) {
          const t = (x - x0) / (x1 - x0);
          for (let c = 0; c < 4; c++) data[(y * width + x) * 4 + c] = Math.round(data[(y * width + x0) * 4 + c] * (1 - t) + data[(y * width + x1) * 4 + c] * t);
        }
    }
    const frac = opt.clean ?? 0.25;
    if (frac > 0) cleanEdges(data, width, height, frac);
    const out = await sharp(await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer())
      .trim({ threshold: 1 })
      .webp({ quality: cfg.quality ?? 86, alphaQuality: 95 })
      .toBuffer();
    fs.writeFileSync(path.join(cfg.outDir, `${name}.webp`), out);
    const m = await sharp(out).metadata();
    console.log(name, m.width, m.height);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
