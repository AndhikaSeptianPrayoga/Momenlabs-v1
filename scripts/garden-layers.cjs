/* Memecah satu ilustrasi menjadi lapisan kedalaman untuk parallax.
   Tiap lapisan berukuran sama dengan gambar asli (agar posisinya pas),
   hanya bagian di dalam poligonnya yang terlihat (tepi dilembutkan).
   Pakai: node scripts/garden-layers.cjs <config.json>
   Opsi config:
   - "tint"       : nuansa warna (multiply + soft-light warna solid)
   - "background" : false → tanpa bg.webp
   - "plate"      : { polygons, blur, dilate, patches } → bg.webp menjadi "clean plate": area yang
                    nanti bergerak keluar (gapura, bunga) diisi pantulan isi di
                    sebelahnya, agar tidak ada gambar kembar saat lapisan bergeser
   - "bgBlur"     : blur ringan latar (kedalaman bidang)
   Opsi per lapisan: "feather", "blur" (kedalaman bidang),
   "keyBright": { from, to, maxY } buang piksel terang (langit) di atas maxY,
   "shadow": { dx, dy, blur, opacity, color } bayangan lembut ke belakang. */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const svgPolys = (W, H, polygons) =>
  Buffer.from(`<svg width="${W}" height="${H}">${polygons.map((pts) => `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="white"/>`).join("")}</svg>`);

// isi area bertopeng per baris dengan pantulan piksel di luar topeng (cermin pada tepi topeng)
async function cleanPlate(src, W, H, plate) {
  const { data } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const hard = await sharp(svgPolys(W, H, plate.polygons)).blur(plate.dilate ?? 4).extractChannel(0).raw().toBuffer();
  const masked = (x, y) => hard[y * W + x] > 8;
  const filled = Buffer.from(data);
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      if (!masked(x, y)) {
        x++;
        continue;
      }
      let e = x;
      while (e + 1 < W && masked(e + 1, y)) e++;
      // topeng di tepi kiri dicerminkan dari kanannya, di tepi kanan dari kirinya.
      // Pantulan bolak-balik (ping-pong) di dalam rentang bebas tetangga, jadi tidak
      // pernah mengambil piksel yang juga bertopeng (tidak ada garis-garis seret).
      const fromRight = x === 0 || (e !== W - 1 && x < W / 2);
      let u0 = fromRight ? e + 1 : x - 1;
      let u1 = u0;
      if (fromRight) while (u1 + 1 < W && !masked(u1 + 1, y)) u1++;
      else while (u1 - 1 >= 0 && !masked(u1 - 1, y)) u1--;
      const len = Math.abs(u1 - u0) + 1;
      for (let i = x; i <= e; i++) {
        const k = fromRight ? e - i : i - x;
        const m = k % (2 * len);
        const off = m < len ? m : 2 * len - 1 - m;
        const s = Math.max(0, Math.min(W - 1, fromRight ? u0 + off : u0 - off));
        for (let c = 0; c < 3; c++) filled[(y * W + i) * 3 + c] = data[(y * W + s) * 3 + c];
      }
      x = e + 1;
    }
  }
  // tambalan: hapus benda yang ikut terpantul (mis. matahari kembar) dengan
  // interpolasi mendatar antara tepi kiri & kanan kotak [x0, y0, x1, y1]
  for (const [x0, y0, x1, y1] of plate.patches ?? []) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const t = (x - x0) / (x1 - x0);
        for (let c = 0; c < 3; c++) filled[(y * W + x) * 3 + c] = Math.round(filled[(y * W + x0) * 3 + c] * (1 - t) + filled[(y * W + x1) * 3 + c] * t);
      }
    }
  }
  // isi dihaluskan agar pola cermin tidak terbaca, lalu dicampur lewat topeng lembut
  const soft = await sharp(filled, { raw: { width: W, height: H, channels: 3 } }).blur(plate.blur ?? 3).raw().toBuffer();
  const feather = await sharp(svgPolys(W, H, plate.polygons)).blur((plate.dilate ?? 4) + 4).extractChannel(0).raw().toBuffer();
  const out = Buffer.alloc(W * H * 3);
  for (let p = 0; p < W * H; p++) {
    const a = Math.max(feather[p], hard[p]) / 255;
    for (let c = 0; c < 3; c++) out[p * 3 + c] = Math.round(data[p * 3 + c] * (1 - a) + soft[p * 3 + c] * a);
  }
  return sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
}

async function main() {
  const cfgPath = process.argv[2];
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  const dir = path.dirname(cfgPath);
  let src = path.join(dir, cfg.source);
  const { width: W, height: H } = await sharp(src).metadata();
  // nuansa warna opsional: multiply + soft-light warna solid, lalu atur saturasi & terang
  if (cfg.tint) {
    const t = cfg.tint;
    const solid = (c) => sharp({ create: { width: W, height: H, channels: 4, background: { r: c[0], g: c[1], b: c[2], alpha: c[3] } } }).png().toBuffer();
    const layers = [];
    if (t.multiply) layers.push({ input: await solid(t.multiply), blend: "multiply" });
    if (t.softLight) layers.push({ input: await solid(t.softLight), blend: "soft-light" });
    const tinted = await sharp(src).modulate({ saturation: t.saturation ?? 1 }).composite(layers).png().toBuffer();
    src = await sharp(tinted).modulate({ brightness: t.brightness ?? 1 }).png().toBuffer();
  }
  fs.mkdirSync(cfg.out, { recursive: true });
  const q = cfg.quality ?? 82;

  // latar penuh tanpa alpha (lewati dengan "background": false)
  if (cfg.background !== false) {
    let bg = cfg.plate ? await cleanPlate(src, W, H, cfg.plate) : await sharp(src).png().toBuffer();
    if (cfg.bgBlur) bg = await sharp(bg).blur(cfg.bgBlur).png().toBuffer();
    await sharp(bg).webp({ quality: q }).toFile(path.join(cfg.out, "bg.webp"));
    console.log("layer bg");
  }

  const rgb = await sharp(src).removeAlpha().toBuffer();
  for (const [name, layer] of Object.entries(cfg.layers)) {
    const mask = await sharp(svgPolys(W, H, layer.polygons))
      .blur(layer.feather ?? 6)
      .extractChannel(0)
      .toBuffer();
    let alpha = mask;
    // buang piksel terang (langit) dari lapisan, mis. sela-sela puncak candi
    if (layer.keyBright) {
      const { from, to, maxY } = layer.keyBright;
      const m = await sharp(mask).extractChannel(0).raw().toBuffer();
      const px = await sharp(rgb).raw().toBuffer();
      for (let p = 0; p < W * H; p++) {
        if (Math.floor(p / W) > maxY) continue;
        const l = 0.3 * px[p * 3] + 0.59 * px[p * 3 + 1] + 0.11 * px[p * 3 + 2];
        const k = Math.max(0, Math.min(1, (l - from) / (to - from)));
        m[p] = Math.round(m[p] * (1 - k));
      }
      alpha = await sharp(m, { raw: { width: W, height: H, channels: 1 } }).blur(0.8).png().toBuffer();
    }
    let img = await sharp(rgb).joinChannel(alpha).png().toBuffer();
    if (layer.blur) img = await sharp(img).blur(layer.blur).png().toBuffer();
    if (layer.shadow) {
      const s = layer.shadow;
      const [r, g, b] = s.color ?? [30, 16, 8];
      const alpha = await sharp(img).extractChannel(3).blur(s.blur ?? 12).linear(s.opacity ?? 0.35, 0).toBuffer();
      const solid = await sharp({ create: { width: W, height: H, channels: 3, background: { r, g, b } } }).png().toBuffer();
      const dx = s.dx ?? 0;
      const dy = s.dy ?? 0;
      const none = { r: 0, g: 0, b: 0, alpha: 0 };
      // geser bayangan tanpa mengubah ukuran kanvas
      // sharp menerapkan extract sebelum extend dalam satu pipeline, jadi dipisah dua langkah
      const extended = await sharp(await sharp(solid).joinChannel(alpha).png().toBuffer())
        .extend({ left: Math.max(0, dx), right: Math.max(0, -dx), top: Math.max(0, dy), bottom: Math.max(0, -dy), background: none })
        .png()
        .toBuffer();
      const shadow = await sharp(extended)
        .extract({ left: Math.max(0, -dx), top: Math.max(0, -dy), width: W, height: H })
        .png()
        .toBuffer();
      img = await sharp(shadow).composite([{ input: img }]).png().toBuffer();
    }
    await sharp(img).webp({ quality: q, alphaQuality: 90 }).toFile(path.join(cfg.out, `${name}.webp`));
    console.log("layer", name);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
