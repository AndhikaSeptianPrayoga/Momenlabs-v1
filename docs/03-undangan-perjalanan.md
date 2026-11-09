# 03 — Undangan sebagai perjalanan kamera (Golden Minangkabau, Arunika, Botanical Glasshouse)

> Disusun 2026-11-03. Referensi gerak: video TikTok @invitingart.id "Royal Vintage Heritage"
> (dipelajari polanya saja — aset & gaya visual tetap milik MomenLabs).

## 1. Apa yang dipelajari dari referensi

| Pola di referensi | Artinya untuk kita |
|---|---|
| Kamera menyusuri satu dunia (langit → atap → gerbang → taman → ruang dalam) | scroll = gerak kamera, bukan sekadar menggulir kartu |
| Salam muncul di atas adegan yang dikaburkan | teks hidup di dalam adegan, latar tetap terlihat |
| Kamera menoleh ke mempelai pria lalu wanita | tiap konten punya "tempat" di dunia itu |
| Kartu acara naik dari bingkai lengkung berukir | bingkai konten dibangun dari aset adegan |
| Wayang masuk dari sisi, ornamen gantung berayun | benda bereaksi terhadap gerak & sentuhan |

## 2. Arsitektur

- `src/design/kit/rig.js` — satu kamera (`CAM`: pan, lift, push, dim, dusk) yang dihaluskan (LERP).
  Tiap bab mendaftarkan `pose(p)`; `poseAt(scrollY)` memilih bab yang sedang menempel,
  atau pose istirahat (hero / section biasa).
- `src/design/kit/journey.jsx` — `makeJourney(config)` → `{ Journey, Closing }`: bab-bab (section
  tinggi + panggung `sticky`) yang kontennya bergerak memakai `CAM` yang sama sehingga menyatu
  dengan dunia. Yang khas template hanya konfigurasi: aset, strip aksen adat, mahkota papan nama,
  lentera kenangan, susunan gerbang acara, teks adat.
- `src/design/kit/calendar.js` — zona WIB, format jam, tautan Google Calendar (dipakai juga DarkElegance).
- Adegan template (`goldenMinang.jsx`, `arunika.jsx`) membaca `CAM`; Glasshouse (satu lukisan WebGL)
  membaca `CAM` di shader: menoleh = geser per kedalaman piksel, menengadah = uniform `look`,
  melangkah = zoom ke pintu rumah kaca. Lapisan sprite: lapisan bergeser `(3 + k×22)%`
  saat menoleh (dekat lebih cepat = parallax), membesar dari titik hilang saat `push`, langit naik
  saat `lift`, rona malam saat `dusk`; selubung gelap = `dim` (menggantikan "wash" rata).
- `DarkElegance.jsx` — hook `decor.Journey` (mengganti salam, mempelai, kisah, acara) &
  `decor.Closing`; template lain tidak berubah.

### Konfigurasi per template

| | Golden Minangkabau | Arunika | Botanical Glasshouse |
|---|---|---|---|
| Strip aksen | marawa (hitam-merah-kuning) | kain sindur (merah berpinggir putih) | pita satin sage-blush |
| Mahkota papan nama | gonjong ukir | ornamen crest emas | besi tempa Victoria + mawar putih (SVG) |
| Gerbang acara | gonjong + 2 tiang ukir | crest + 2 lentera batu + undakan | besi tempa + 2 patung + balustrade |
| Penanda kenangan | lentera Minang | lentera batu Jawa | patung taman (kiri/kanan) |
| Teks | "Jejak Langkah", "Terimo kasih" | "Lampah Tresna", "Matur nuwun" | "Love in Bloom", "The Celebration", "With gratitude" |
| Mode | gelap | gelap | terang (`light`), malam tipis (`night: 0.55`) |

## 3. Alur bab

| Bab | Tinggi | Kamera | Konten di dunia | Interaksi |
|---|---|---|---|---|
| Salam | 260svh | menengadah ke langit senja | petuah adat muncul kata demi kata di kabut emas | sentuh kata → percik cahaya |
| Mempelai | 420svh | menoleh kiri → tengah ("&") → kanan | papan nama tergantung di bawah ornamen, berayun karena gerak kamera & kemiringan HP | sentuh papan → berayun + percik |
| Kisah | 130 + 85×n svh | berjalan maju di jalan batu, melenggang | tiap kenangan = lentera di sisi jalan (proyeksi kedalaman), menyala saat didekati | sentuh lentera/kartu → api berkobar |
| Acara | 150 + 110×n svh | melangkah ke pintu bangunan utama → silau | gerbang dibangun: sisi naik, mahkota turun, isi muncul; miring mengikuti HP | sentuh gonjong → percik; kalender & peta |
| Amplop, RSVP, Ucapan | — | pose istirahat (langit senja, selubung gelap) | section standar | — |
| Penutup | 220svh | malam turun, lentera menyala | ucapan terima kasih | "Terbangkan doa" / sentuh langit → cahaya doa terbang |

## 4. QA

- [x] Scroll penuh tanpa error & gambar rusak; kembali ke atas → kamera pulang ke pose hero
- [x] Semua interaksi bab merespons (375×812)
- [x] Konten acara terbaca (tiang di luar panel)
- [x] Arunika: semua bab & interaksi, teks penutup terbaca di depan langit fajar
- [x] Glasshouse: semua bab & interaksi, kamera menembus pintu rumah kaca
- [x] `poseAt` mengabaikan bab yang sudah terlepas dari halaman (sisa pemasangan ulang)
- [ ] Uji HP sungguhan: kelancaran scroll & gyroscope

## 5. Kupu-kupu (kit/creatures.jsx)

Ditulis ulang: satu SVG utuh per kupu-kupu, sayap kiri = cermin sayap kanan berporos di badan,
kepakan = lipatan sumbu badan (scaleX) — dua kepakan lalu melayang, sayap belakang sedikit
tertinggal; badan menghadap arah terbang. Versi lama memakai rotateY 3D CSS yang membuat
keempat sayap tergambar di sisi kanan badan.
