# 02 — Riset Desain Undangan Digital (dasar perombakan desain MomenLabs)

> Disusun 2026-11-03. Gabungan riset web + pelajaran dari 8 template yang sudah dibuat
> (Dark Elegance, Wayang Kencana, Secret Garden, Villa Aurelia, Sekar Prambanan,
> Botanical Glasshouse, Celestial Luxury, Baroque Grand Palace).
> Catatan: sebagian besar sumber tren adalah blog vendor/percetakan, jadi tren di bawah
> diperlakukan sebagai arah, bukan data survei.

---

## 1. Peta pasar singkat

| Pemain | Posisi | Yang bisa dipelajari |
|---|---|---|
| Enviory | premium, tema editorial | RSVP otomatis, galeri, peta, amplop digital, dibagikan 1 link WhatsApp |
| Menica | Gratis / Premium / Gold | jenjang paket jelas (mirip Basic/Premium/Luxury kita) |
| WebNikah | gratis + berbayar | versi gratis pakai watermark & subdomain — celah: kesan murah |
| Canva / template Tokopedia | DIY, murah | ribuan template statis; kualitas & dukungan tidak konsisten |

**Celah MomenLabs:** undangan yang terasa seperti *pengalaman* (adegan ilustrasi hidup,
parallax, pembukaan sinematik), bukan sekadar halaman berisi foto + teks.

## 2. Tren desain 2026 yang relevan

1. **Quiet luxury & tipografi editorial** — banyak ruang kosong, serif besar, sedikit ornamen
   tapi berkualitas. → cocok untuk paket Basic & bagian isi undangan.
2. **Ilustrasi lukis (watercolor / painterly)** — taman, istana, candi bergaya lukisan.
   → arah utama paket Premium & Luxury kita.
3. **Gerak halus, bukan gimmick** — parallax pelan, fade-in per bagian, pembukaan bertahap.
4. **Hybrid cetak + digital** — kartu fisik dengan QR ke situs undangan.
5. **Personal & interaktif** — cerita cinta, voice note, galeri, wishes; AR mulai muncul.

## 3. Taksonomi gaya untuk katalog

| Keluarga | Contoh di katalog | Palet | Tipografi | Gerak |
|---|---|---|---|---|
| **Adat Nusantara** | Sekar Prambanan, Wayang Kencana, Sunda, Minang, Batak, Bugis | emas, cokelat, merah bata, krem | serif klasik + script, aksen aksara | gapura membuka, ornamen bergoyang |
| **European Classic** | Baroque Grand Palace, Villa Aurelia, Botanical Glasshouse, Secret Garden | maroon-emas / krem-sage / senja | Cinzel / Cormorant + script | kamera masuk taman/istana, tirai, burung |
| **Modern Minimal** | (Basic) | monokrom, sage, dusty pink | sans geometris + serif tipis | fade & slide pendek |
| **Celestial / Night** | Celestial Luxury, Dark Elegance | navy/hitam + emas | serif tinggi kontras | bintang, kilau, cahaya |
| **Kontemporer** | Korean, Islamic, Botanical | pastel / hijau / putih | sans humanis | ilustrasi ringan |

## 4. Prinsip visual MomenLabs (dari umpan balik klien selama pengerjaan)

1. **Jangan terlihat "tempelan".** Aset harus terasa satu lukisan:
   - ilustrasi utuh lebih aman daripada memotong satu lukisan jadi beberapa lapisan
     (potongan terlihat saat lapisan bergerak dengan laju berbeda);
   - jika berlapis, tiap lapisan harus **objek utuh** (sprite bersih) atau **plate bersih**
     (latar yang objeknya sudah dihapus), bukan potongan wilayah;
   - jangan menimpa lukisan yang sama di belakang sprite (istana ganda).
2. **Latar tidak boleh flat vector.** Langit & tanah harus bergaya lukisan yang sama
   dengan asetnya (contoh: plate langit & jalan Baroque dari lukisan istana).
3. **Lapisan terpisah yang benar:** langit → jalan/tanah → bangunan → tanaman → objek depan.
4. **Burung & kupu-kupu beranatomi** (kepala, paruh, sayap berjari, ekor; kupu-kupu bersegmen,
   antena bergada, sayap depan/belakang) — bukan siluet "M".
5. **Ramai tapi elegan:** banyak elemen kecil (bokeh, debu emas, kelopak, lampu peri)
   dengan opasitas rendah & palet sempit.
6. **Nuansa sesuai nama template** (mis. Royal Burgundy ≠ taman keemasan → ganti nama).

## 5. Panduan gerak & parallax

| Hal | Aturan |
|---|---|
| Geser parallax mouse/gyro | langit 2–3px, bangunan 6–9px, tengah 10–12px, depan 15–18px; LERP 0.06 |
| Pembukaan | bertahap: objek muncul (scale 0.86→1 + blur→jelas) → gerbang/tirai membuka → kamera maju → nama muncul |
| Scroll | kamera maju pelan (zoom 0.1–0.3 total), objek dekat lebih cepat |
| Loop ambient | goyang pohon/tirai 6–9 dtk, air mancur 0.5 dtk, burung 14–46 dtk |
| Performa | hindari blend-mode, filter blur besar & animasi background-position; pakai transform/opacity; canvas/WebGL untuk efek per-piksel |
| Aksesibilitas | `prefers-reduced-motion` → lewati animasi; kontras teks di atas lukisan pakai gradasi gelap/terang |
| Layar HP | panggung 9:16 / 2:3 menutupi layar; uji di 375×812 dulu |

## 6. Alur UX undangan (standar semua template)

Cover (nama tamu, tombol buka) → pembukaan sinematik → hero (nama + tanggal + hitung mundur)
→ mempelai → kisah → acara (peta) → galeri → amplop digital/QRIS → RSVP → ucapan →
penutup. Musik latar & tombol navigasi bawah selalu tersedia.

## 7. Checklist QA tiap template

- [ ] Tidak ada garis potongan / gambar ganda saat bergerak (cover, buka, scroll, miring)
- [ ] Latar bergaya lukisan, bukan gradasi/vektor flat
- [ ] Teks terbaca di atas ilustrasi (cek 375×812 & desktop)
- [ ] Animasi 60fps (tanpa blend-mode/blur besar), reduced-motion aman
- [ ] Nama & palet sesuai nuansa; thumbnail katalog tampil benar
- [ ] Tanpa error console; build `npx vite build` sukses

## 8. Rencana perombakan (usulan)

1. **Design system bersama**: token warna per keluarga gaya, pasangan font, komponen panel
   kaca, hitung mundur, tombol foil — satu sumber untuk semua template.
2. **Mesin adegan bersama**: komponen `Stage` (panggung 9:16), `Layer`, `Plate`, `Sprite`,
   `Bird`, `Butterfly`, `Petals`, `Tilt` — sekarang masih terduplikasi di tiap file template.
3. **Pipeline aset**: `crop-sprites.cjs` (sprite ber-alpha), `garden-layers.cjs` (lapisan &
   clean plate), `baroque-new-assets.cjs`, `arunika-assets.cjs` & `golden-minang-assets.cjs` (aset utuh desainer → WebP bersih; Golden Minangkabau juga membuang latar hitam potongan sprite) — dijadikan satu
   alur terdokumentasi. Aset mentah selalu di `assets-src/`, hasil siap pakai di `public/templates/`.
4. **Isi undangan** (section mempelai, acara, dst.) dirombak mengikuti tipografi editorial
   per keluarga gaya, bukan satu gaya Dark Elegance untuk semua.

**Status (2026-11-03):** langkah 1 & 2 selesai untuk template berbasis adegan.
- Token: `src/design/tokens.js` (tone `maroon`, `espresso`, `javanese`, `sunrise`, `goldenHour`, `ivory`; FONTS; MOTION).
- Kit: `src/design/kit/` — `creatures` (burung & kupu-kupu), `particles` (kelopak, debu, bokeh), `rig` & `journey` (isi undangan sebagai perjalanan kamera, lihat docs/03), `calendar`,
  `stage` (panggung & kemiringan), `invitation` (CoverTitle, GuestPanel, makeHeroScene,
  makeBackdrop, makeSectionDecor, useCountdown).
- Sudah memakai kit: Baroque Grand Palace, Botanical Glasshouse, Sekar Prambanan, Villa Aurelia, Arunika (tone `sunrise`), Golden Minangkabau (tone `goldenHour`).
- Belum: Secret Garden, Celestial Luxury, Dark Elegance, Wayang Kencana, template katalog bertema.
- Review visual: buka `/?design=1` (style guide).

## 9. Skill & alat pendukung

| Skill / alat | Sumber | Status |
|---|---|---|
| frontend-design | Anthropic (katalog plugin) | tersedia untuk dipasang dari kartu |
| Design (critique, design system, UX copy, aksesibilitas) | Anthropic (katalog plugin) | tersedia untuk dipasang |
| design-skills (design-elevation, interaction-design, dll.) | komunitas (katalog plugin) | tersedia untuk dipasang |
| ui-ux-pro-max | GitHub nextlevelbuilder/ui-ux-pro-max-skill (pihak ketiga) | pasang manual oleh pemilik |
| graphify | GitHub safishamsi/graphify (pihak ketiga) | pasang manual oleh pemilik |

## Sumber

- https://www.stationeryhq.com/pages/the-10-best-wedding-invitation-trends-of-2026
- https://juliakaydesign.com/blogs/juliakaydesign/luxury-wedding-invitation-trends-for-2026-couples
- https://www.womangettingmarried.com/2026-wedding-trends-youll-love-and-the-digital-wedding-invitations-to-match/
- https://blog.1invites.com/top-wedding-invitation-trends/
- https://bridestoday.in/wedding-ideas/story/wedding-vows-1060533-2024-07-31
- https://hunted.space/product/enviory
- https://www.cermati.com/artikel/jadi-lebih-hemat-ini-10-situs-membuat-undangan-pernikahan-gratis
- https://claudemarketplaces.com/skills/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max
- https://www.augmentcode.com/learn/graphify-knowledge-graph-codebase-skill
