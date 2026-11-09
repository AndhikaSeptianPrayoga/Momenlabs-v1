# MomenLabs — konteks untuk Claude

Dibaca otomatis oleh Claude Code di awal sesi. Ringkasan dari sesi kerja sebelumnya (Okt–Nov 2026)
supaya Claude milik siapa pun di tim langsung paham project ini.

## Bisnis

- **MomenLabs** = usaha undangan pernikahan digital (3 founder, salah satunya Hans).
- Paket: **Basic / Premium / Luxury** (`TIERS` di `src/catalog.jsx`). Luxury sudah termasuk semua fitur Premium.
  Fitur Premium mis. Story Mode foto (tap-tap ala Instagram), Voice Wishes.
- Lini terpisah: **Game Interaktif Custom** (game 3D, Quiz Cinta, Story Adventure) untuk anniversary,
  ulang tahun, lamaran, pernikahan, dll. **Tanpa harga** di web — pengunjung diarahkan chat admin WhatsApp.
- Nomor WA admin masih placeholder `6281234567890` (`public/game-interaktif/index.html`, `waLink` di landing).
- Bahasa UI, copy & komentar kode: **Bahasa Indonesia**.

## Stack & menjalankan

- Vite 5 + React 18 + Tailwind 3 + framer-motion 11 + lucide-react. Tanpa backend.
- `npm install` lalu `npm run dev` (Windows: `npm.cmd run dev`, atau `start-server.cmd`).
  Wajib dijalankan **dari folder repo** (kalau tidak, Tailwind/PostCSS gagal: "bg-noir does not exist").
- Build: `npm run build` → `dist/` (siap hosting statis: Netlify / Cloudflare Pages / Vercel).
- **Server tetap di laptop Hans** (`http://localhost:5174`, HP: `http://<IP laptop>:5174`): `tools/server-terus.cmd` menyajikan
  **versi build** (`vite preview`), dijalankan tanpa jendela lewat `wscript tools\server-terus.vbs`. Mode dev di port itu dulu
  membuat web freeze/berat. **Setelah mengubah kode, jalankan `npm.cmd run build`** agar perubahan tampil di 5174.
  Server dev untuk pengujian memakai port 5175. Jeda di loop pakai `ping -n 6` (`timeout` gagal tanpa jendela → menyala-mati terus).
- `vite.config.js` mengizinkan host `.trycloudflare.com` untuk link publik sementara:
  `cloudflared tunnel --url http://127.0.0.1:5175` (pakai 127.0.0.1, bukan localhost).

## Peta kode

| Path | Isi |
|---|---|
| `src/main.jsx` | Router query: `/?template=<id>&plan=basic\|premium\|luxury&to=Nama+Tamu`, `/?design=1` = style guide |
| `src/LandingPage.jsx` | Landing page (hero, fitur, katalog, harga, Game Interaktif, FAQ, testimoni). Section game: `GameTeaser` + `PlayablePhone` (2 HP berisi iframe game, klik untuk main, satu game aktif sekaligus) |
| `src/catalog.jsx` | `TEMPLATES` (id, nama, region, kategori, tier, warna), thumbnail tiap template, `demoUrl` |
| `src/templates/DarkElegance.jsx` | Undangan dasar (semua section: salam, mempelai, StoryMode, acara, hadiah, RSVP, voice, penutup). Template lain menyuntik `decor` |
| `src/templates/ThemedDemo.jsx` | Peta id template → `{ Cover, decor, data }` |
| `src/templates/*.jsx` | Template adegan: `prambanan` (Sekar Prambanan), `goldenMinang`, `arunika`, `glasshouse` (WebGL), `baroque`, `aurelia`, `celestial`, `garden`, `WayangKencana` |
| `src/design/tokens.js` | `TONES` (palet per template), `MOTION` (easing: `door`, `dolly`, `ease`), `FONTS` |
| `src/design/kit/` | Kit bersama: `stage.js` (useStageBox 9:16, tilt/gyro), `rig.js` (kamera `CAM` pan/lift/push/dim/dusk + `poseAt` dari scroll), `journey.jsx` (`makeJourney` → bab Salam, Mempelai, Kisah + **Album Kenangan** (StoryAlbum, Premium), Acara, Penutup), `invitation.jsx` (CoverTitle, GuestPanel, Hero, Backdrop), `creatures.jsx` (Bird beranatomi, Butterflies), `particles.jsx` (Petals, Dust, Bokeh) |
| `scripts/*-assets.cjs` | Pipeline aset (sharp): `assets-src/<template>` → `public/templates/<template>/*.webp` |
| `public/templates/<id>/` | Sprite hasil pipeline (jangan edit manual — jalankan ulang skripnya) |
| `public/game-interaktif/` | Halaman statis Game Interaktif (`index.html`, teks di objek `CONFIG`), video contoh, `posters/`, dan 2 game hasil build: `perjalanan-cinta/` (demo kartun Raka & Alya) & `anniversary/` (game asli Hans & Manda) |
| `docs/` | Riset undangan digital & desain perjalanan kamera (`03-undangan-perjalanan.md`) |
| `assets-src/` | Bahan mentah desainer (lembar aset, lukisan langit/lantai) |
| `Assets/` | **Tidak ada di repo** (gitignore): foto prewed & video mentah, hanya di laptop Hans |

## Pola template "adegan" (paling imersif: Golden Minang & Sekar Prambanan)

- Panggung 9:16 (`useStageBox`), lapisan sprite simetris `pair()` (kanan dicerminkan), `landed()` menghitung
  posisi awal karena tiap lapisan membesar dari titik hilang `VP` saat kamera masuk (`dolly`).
- Nilai gerak bersama cover ↔ hero ↔ latar: `motionValue` di level modul (`LIVE = { gate|part, descend, sun, build, dolly }`),
  `heroReveal`. Thumbnail katalog memakai `STILL` (tanpa animasi).
- Interaksi: angin dari kecepatan kursor (`gust`), parallax tilt, sentuhan sadar-alpha (`tapAt` membaca alpha piksel sprite),
  reaksi per jenis (`tap: "tree" | "rose" | "lamp" | "banner" | "plant" | "pond" | "fountain" | "floor" | "glow"`).
- Isi undangan = `makeJourney({ tone, asset, accent, crown, lantern, portal, copy })`. Hati-hati memilih sprite
  `portal.side`: harus ramping (mis. tiang/pilar). Sprite lebar menumpuk dan menutupi papan acara.

### Sekar Prambanan (dibangun ulang 4–5 Nov 2026)

- Sumber: `assets-src/sekar-prambanan/aset-taman-candi.png` (lembar 1536×1024), `teras-batu.png`, `langit-senja.png`.
  Jalankan `node scripts/prambanan-assets.cjs` (opsi `--boxes out.jpg` = peta kotak potong).
- **Lembar aset desainer sering RGB tanpa alpha dengan pola kotak-kotak "transparan" tercetak** → skrip membuang
  latar via flood-fill dari tepi + gumpalan kotak-kotak tertutup, opsi per sprite `erase` & `water`, lalu sprite ×2 (lanczos).
- Daun di lembar desainer keemasan → `greenify()` menggeser hue 31–64° ke hijau alami (per sprite di objek `GREEN`).
- Adegan: langit lukisan (Ken Burns, matahari tenggelam, sinar & starburst di posisi matahari lukisan), pegunungan SVG,
  candi, tembok berpohon, mawar, air mancur (tirai air SVG), kolam teratai, teras batu (kilau), lentera, umbul-umbul,
  bingkai pohon/bunga. Cover: gapura candi bentar **bercelah** bercahaya (bukan rapat — sisi dalam sprite terpotong lurus),
  saat dibuka: flare anamorfik, sinar, percikan emas, kilau emas menyapu batu (mask), 36 burung melintas kiri→kanan.
- File lama tak terpakai: `public/templates/sekar-prambanan/scene.webp`, `gateR.webp`.
- Data demo: foto busana Minang (`AURELIA_PHOTOS`) & teks kisah menyebut "Bima/Clara" padahal nama "Raden & Ayu" — perlu dirapikan.

### Botanical Glasshouse (dibangun ulang 6 Nov 2026)

- Sumber: `assets-src/botanical-glasshouse/v2/` (lembar aset taman klasik — **alpha asli**, langit senja, teras kerikil).
  `node scripts/glasshouse-assets.cjs` → `public/templates/botanical-glasshouse/v2/` (kotak potong di `BOX`, opsi `erase`).
- Pola sama dengan Sekar Prambanan (sprite berlapis), ditambah tirai putih + lampu peri lama (`SideDrapes`, `curtain`),
  rumah kaca hidup (jendela berpendar & kilau atap lewat mask), **merpati putih** keluar dari pintu saat dibuka (`DoveFlight`),
  dan **kupu-kupu kaca ekor walet** khas template ini (`GlassButterflies`, bukan `Butterflies` kit).
- Lantai taman = lukisan `jalur-taman.png` (kotak-kotak dibuang di `lawn()`); jalan setapak sengaja dikosongkan.
- Scroll menuju bab kisah: `Backdrop` men-zoom taman ke pintu (`DOOR_ORIGIN`), garis cahaya + kilatan putih, lalu menampilkan **interior rumah kaca** = lukisan konservatori `interior.webp` yang dihidupkan (`InteriorPainting`: kandelir, lilin, sinar jendela, kilau lantai/kaca, merpati). Rentang dihitung dari posisi `#story`.
- `public/templates/botanical-glasshouse/scene.webp` (lukisan WebGL lama) tidak dipakai lagi.

### Royal Sapphire (kategori `heritage` — label tab kini **Modern Aesthetic**, Premium, 6 Nov 2026)

- Kategori `heritage` (`CATEGORY_LABEL`, tab "Modern Aesthetic" di `PREMIUM_TABS` LandingPage; dulu bernama "Botanical Heritage"). Tone `TONES.sapphire`.
- Sumber: `assets-src/royal-sapphire/kolase-aset.png` (latar PUTIH tanpa alpha) & `komposisi.png` (referensi → `poster.webp` untuk thumbnail).
  `node scripts/sapphire-assets.cjs` membuang putih (flood dari tepi + putih tertutup > `holeMin`; `keepHoles` untuk awan/anggrek).
- Bukan template "perjalanan kamera": memakai section bawaan DarkElegance + `decor` (Backdrop lanskap ×0,2, HeroScene bingkai emas ×1,0, bunga ×1,5 + blur).
  Urutan pembukaan di `OPEN` (bg → frame → bloom spring → text bertahap).

### Celestial Nocturne (Modern Aesthetic / `heritage`, Premium, 7 Nov 2026)

- `src/templates/celestialNocturne.jsx`, tone `TONES.nocturne`, ornament `nocturne` (thumbnail = `poster.webp`).
- Sumber: `assets-src/celestial-nocturne/lembar-aset.png` (alpha asli) & `komposisi.png` → `node scripts/celestial-nocturne-assets.cjs`
  (sprite per `BOX`; awan `soft` = kabut kotak semi-transparan dibuang + tepi di-feather; `sky.webp` = 18,5% atas komposisi).
  cloudA tidak dipakai (bekas potongan tetangga terlihat). `starfield.webp` = bidang bintang padat + pita bima sakti (`node scripts/celestial-starfield.cjs`);
  warna dasar langit sengaja hitam kebiruan (#020D19) agar menyatu dengan lukisan `sky.webp`. Judul cover di tengah (`CoverTitle position`).
- Pembukaan (`OPEN.cam/frame/bloom/text`): kamera zoom 1,8× di bulan → 1,0; bingkai 0,7→1 + garis kilau; bunga y 80→0; teks bertahap (`Lift`).
- Isi = **perjalanan kamera** (`makeJourney` + `CAM`, sama seperti template rumah adat). `WorldLayer` membaca pan (toleh, `panShift(k)`),
  lift (menengadah: lapisan turun sesuai kedalaman), push (terbang menembus bingkai, origin `PUSH_ORIGIN`), dusk (bintang makin terang).
  Lapisan: langit 0 (bidang diperluas ke atas: rasi bintang tergambar, bintang jatuh, nebula, bima sakti) · astrolab 0,15 · awan berarak 0,25 ·
  InnerSanctum 0,35 (tampak saat push) · bingkai 0,5 · kabut 0,8 · bunga 1 (gugus luar kiri/kanan untuk saat menoleh; mekar keluar + blur saat push).
- Gerak waktu: awan & komet kiri→kanan (`useTime`), `Breath` (±1°, ±5px), tilt mouse/gyro.

### Azure Cascade (Modern Aesthetic / `heritage`, Premium, 9 Nov 2026) — template pertama gaya **Skill 2**

- `src/templates/azureCascade.jsx`, tone `TONES.sapphire`, ornament `cascade` (thumbnail = `poster.webp`).
- Sumber: `assets-src/azure-cascade/lembar-aset.webp` (alpha asli) & `komposisi.webp` → `node scripts/azure-cascade-assets.cjs`
  (sprite per `BOX`, serpihan tetangga dibuang; `scene.webp` lukisan utama; `falls-mask.png` & `lake-mask.png` dari piksel terang lukisan;
  `water-strands.png` tekstur helai air). orchidB & cloudL sebaiknya tidak dipakai (masih ada sisa tetangga).
- Lukisan 2:3 selebar kolom (bukan stage 9:16) agar air terjun & rotunda selalu terlihat; area bawahnya kertas krem + rumpun bunga.
- `OPEN.doors/reveal/assemble/text`: cover = kartu kertas berjendela lengkung (`HOLE_MASK` SVG), dua daun pintu (`clip-path` separuh)
  bergeser + rotateY; lukisan Ken Burns; dekor dirakit bertahap (`Piece` dengan jendela `at`); bingkai kaca `GlassFrame` + teks `Lift`.
  Nilai `OPEN` di-reset di initializer `useState` cover (bukan effect) — kalau di effect, transformasi turunan tetap memakai nilai lama.
- Air terjun: 3 lapis `WaterSheet` (background-position bergulir ke bawah, 0,55–1,15 s) di dalam mask + kilau jatuh, kabut, percikan, riak.
- Isi: `SectionDecor` = kartu krem + ornamen emas + rumpun bunga sudut (`whileInView`, sisi berselang lewat `SECTION_SIDES`).

### Gebyok Kencana (Adat · Jawa Klasik, Premium, 9 Nov 2026) — template pertama gaya **Skill 3**

- `src/templates/gebyokKencana.jsx`, tone `TONES.javanese`, ornament `gebyok` (thumbnail = `poster.webp`).
- Sumber: `assets-src/gebyok-kencana/lembar-aset.webp` (alpha asli) & `komposisi.webp` (9:16 = panggung) → `node scripts/gebyok-kencana-assets.cjs`
  (sprite per `BOX`; `scene.webp`; `gold-mask.webp` = ukiran emas terang untuk kilau menyapu; `gunungan-hd.webp` = kayon cover HD dari `assets-src/gebyok-kencana/gunungan-hd.webp` (1024×1536, merah-emas, alpha asli); efek cahaya (sorot, kilau diagonal, kilatan) ada di dalam tiap belahan `Kayon`). gunungan2/petals/acanthus masih membawa sisa tetangga.
- Cover: sepasang kayon (gunungan) bersilang, kamera zoom 1,6 di puncak gebyok (`APEX`). Buka: kayon tersibak (`OPEN.kayon`),
  dolly zoom-out power3.out (`OPEN.cam`), bingkai terang + kilau emas menyapu (`OPEN.frame`), ronce meluncur naik dengan pegas (`OPEN.bloom`),
  teks bertahap (`OPEN.text`, 0,4 s setelah bingkai mapan). Nilai OPEN di-reset di initializer `useState` cover.
- Isi = perjalanan kamera (`makeJourney` + `CAM`) dengan `WorldLayer` bertilt kuat (latar 5 px … bunga 30 px).
  `HERO` (naik 0→1 selama hero lalu kembali 0): latar membesar pelan, ronce atas keluar ke atas, bunga bawah keluar ke bawah + blur.
  Push acara: latar ×1,35 (menembus gerbang), bunga terbang ke samping. Ronce atas memudar saat kamera menengadah.
- Cahaya bergerak: `GodRays` (berkas berayun), `GoldSweep`, `Glints` (kilatan di titik ukiran), `Lamps` (pelita berkedip + bocoran cahaya), Bokeh & Dust.

### Sunting Rajo (Adat · Minang Royal, Premium, 9 Nov 2026) — pola animasi sama dengan Gebyok Kencana (Skill 3)

- `src/templates/suntingRajo.jsx`, tone `TONES.minang` (marun & emas), ornament `sunting` (thumbnail = `poster.webp`).
- Sumber: `assets-src/sunting-rajo/lembar-aset.webp` (RGB, kotak-kotak "transparan" TERCETAK → dibuang seperti Prambanan) & `komposisi.webp` (9:16)
  → `node scripts/sunting-rajo-assets.cjs` (`--preview <file>` = lembar bersih bergaris untuk menentukan `BOX`).
- Cover: tirai berkain `songket-fabric.webp` (pita songket dijajarkan 4 kolom, cermin atas-bawah agar tak bersambung; dibuat skrip aset) + lipatan + garis emas tepi + rumbai + lambrekin ukiran `crest`; panel nama marun di tengah.
  Buka: tirai tersibak (`OPEN.curtain`), dolly 1,7 → 1 dari puncak gonjong, kilau emas, sunting/songket naik (pegas), teks bertahap + letter-spacing.
- Cahaya: `Backlight` (pendar berdenyut dari balik gonjong), `GoldSweep` (gold-mask), `Glints` (ujung gonjong & ukiran), kilatan payet sunting
  (`SUNTING_SPARKS` di dalam sprite sunting), `GodRays`, `Lamps`.
- Keterbacaan: lift latar 44 (salam di atas langit gelap), `scrim` gelap di atas layar setelah hero, teks hero di `top-[53.5%]` (di atas sunting),
  pilar `column` kartu acara di luar tepi kartu.

## Game interaktif (sumber di luar repo ini)

- Game anniversary (three.js, Vite) & demo kartun (three.js statis, importmap) dibuat di folder lain milik Hans
  (`D:\Gift Anniv\game`, `D:\Gift Anniv\demo-cinta-3d`). Yang ada di repo ini hanya **hasil build**.
  Update: build ulang game dengan `--base=./`, salin ke `public/game-interaktif/<nama>/`.
- Game anniversary berisi foto/video/nama asli Hans & Manda (data pribadi) → **tidak ikut ke repo publik** (`public/game-interaktif/anniversary/` di-gitignore). Di clone repo, HP kedua di landing ("Anniversary Pernikahan") akan kosong/404 sampai build-nya disalin manual dari Hans.
- Link ke game pakai path lengkap `.../index.html` (dev server Vite tidak melayani index folder di `public/` dengan query).

## Gaya animasi: "Skill 1", "Skill 2" & "Skill 3" (istilah Hans)

- **Skill 1** — gaya kita sendiri (Golden Minang, Prambanan, Glasshouse, Celestial Nocturne): satu dunia ilustrasi 3D di belakang
  seluruh undangan; scroll = perjalanan kamera (`rig.js` CAM lift/pan/push/dusk + `makeJourney`), parallax kedalaman, tilt/gyro,
  transisi menembus pintu/bingkai, konten hidup di dalam dunia, sprite bisa disentuh.
- **Skill 2** — referensi TikTok @wekita.id "Premium Vintage 09" (https://www.tiktok.com/@wekita.id/video/7563968413475949831):
  reveal berlapis ala buku cerita (2D).
  1. **Cover:** kartu kertas krem timbul dengan "jendela" motif budaya (gunungan batik); pohon ilustrasi tumbuh dari balik tepi kartu,
     ornamen batik kecil di sudut, isi motif berganti warna/tekstur.
  2. **Pembukaan:** kartu/motif terbuka seperti portal (panel bergeser), menyingkap lukisan toile penuh (air terjun + danau), Ken Burns zoom pelan.
  3. **Perakitan adegan:** pohon masuk dari kiri/kanan bertahap, rumpun bunga mekar dari sudut bawah, kupu-kupu terbang;
     bingkai kaca buram (backdrop-blur) berlekuk berisi nama + tombol "Save The Date" muncul di tengah. Ayunan & kilau terus-menerus.
  4. **Isi:** halaman kartu-kartu elegan bertepi dekoratif. Tiap bagian punya strip header ilustrasi, pembatas motif emas kecil,
     judul script, bingkai foto lengkung/oval; kartu acara/hadiah/ucapan diapit rumpun bunga di sudut atas-bawah.
     Semua muncul saat di-scroll (fade/slide up, bunga masuk dari samping).
  5. **Palet di referensi:** biru toile pudar + krem + emas. Template pertama: **Azure Cascade**.
- **Skill 3** — referensi TikTok @putriagstini "Undangan Digital 3D" (https://www.tiktok.com/@putriagstini/video/7438853453033524487):
  "sinema karakter 3D berlapis". Undangan berjalan seperti film pendek dari lapisan PNG datar berbeda kedalaman, berpusat pada
  **ilustrasi karakter pasangan** (kartun/semi-realis, busana asli mereka, mis. beskap + kebaya biru).
  - **Ciri khas "meleng dikit ternyata muncul":** memiringkan HP menggeser lapisan sangat kuat satu sama lain (parallax gyro/mouse = efek wow utama).
    Bunga & tirai depan bergeser paling jauh, pasangan sedang, lengkung latar paling sedikit.
  - **Lapisan (depan → belakang):** tirai satin emas · rangkaian bunga oval/lengkung (mawar biru pudar + daun emas) · kabut/awan putih ·
    ilustrasi pasangan · jendela lengkung bergaris emas dengan latar cat air pastel + bokeh/kilau emas.
  - **Cover:** tirai membingkai rangkaian bunga oval berisi tipografi ("Save the Date · The Wedding of · NAMA · tanggal").
  - **Transisi 1:** tirai tersibak, kamera menembus rangkaian bunga (rangkaian membesar melewati lensa + blur), nama memudar;
    pasangan di bawah lengkung tersingkap dalam kabut, bunga depan terbang melewati kamera.
  - **Adegan per shot dengan teks:**
    - bismillah + kutipan di atas awan (pasangan di atas);
    - kamera **zoom ke pasangan**, lalu **pan ke mempelai pria** (close-up + nama & orang tua di sisi kosong);
    - **pan ke mempelai wanita** (nama di sisi lain);
    - lengkung bunga berayun masuk dari atas membingkai kartu acara ("Resepsi", garis lengkung emas, bunga di sudut);
    - ayat Al-Qur'an di atas pasangan seluruh badan;
    - kembali ke cover bertirai.
  - **Selalu bergerak:** kabut berarak, bunga bergoyang, kilau berkedip, zoom bernapas pelan.
  - **Butuh:** ilustrasi karakter pasangan + lapisan terpisah (pasangan, rangkaian bunga, tirai, awan, lengkung, bunga) per klien.

## Cara kerja yang disukai pemilik

- Visual premium, imersif, banyak animasi halus; realistis (bukan kaku). Selalu cek tampilan **HP (375×812)** dulu.
- Perbaiki bug dari screenshot yang dikirim; jelaskan singkat penyebabnya dalam Bahasa Indonesia.
- Jangan tampilkan harga untuk lini Game Interaktif; CTA ke WhatsApp admin.
