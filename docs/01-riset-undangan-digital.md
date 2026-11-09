# MomentLabs — Riset Bisnis Undangan Digital

> Dokumen dasar untuk landing page & desain template. Versi 1 · 19 Okt 2026

---

## 1. Peta Pasar Singkat

- **Pasarnya sudah matang.** Survei Bridestory 2023 (dikutip Bloomberg Technoz) mencatat **86,65% pengantin di Indonesia** memakai undangan digital atau wedding website. Artinya orang tidak perlu dididik lagi soal "apa itu undangan digital". Yang perlu kita jual adalah **kenapa harus MomentLabs**.
- **Harga pasar** (kisaran umum, perlu dicek ulang ke penyedia langsung):
  - Gratis / template dasar: Rp0–49rb (sebarundangan, Invitee free)
  - Standar: **Rp75rb–250rb**
  - Lengkap / premium: **Rp250rb–500rb**
  - Custom / eksklusif + guest management + QR check-in: Rp1jt+ (Invitera, Ze Guest Management bermain di segmen ini)
- **Hambatan budaya:** sebagian orang (terutama generasi orang tua) masih menganggap undangan digital kurang sopan. Solusinya: **nama tamu personal**, bahasa yang santun, dan opsi hybrid (cetak + QR).

### Posisi yang disarankan untuk MomentLabs
Di tengah pasar banyak pemain murah dengan template seragam. Peluang kita: **"desain kelas premium, harga mid-range, setup cepat."** Bersaingnya lewat kualitas desain & animasi dan pengalaman tamu, bukan harga termurah.

---

## 2. ISI — Struktur Konten Undangan (standar pasar Indonesia)

Urutan section yang sudah jadi "bahasa umum" undangan digital di Indonesia. Tamu sudah terbiasa dengan alur ini, jadi kita ikuti alurnya dan baru berinovasi di cara penyajiannya.

| # | Section | Isi | Catatan |
|---|---------|-----|---------|
| 0 | **Cover / Opening** | "Kepada Yth. Bapak/Ibu/Saudara/i **[Nama Tamu]**", nama mempelai, tombol **Buka Undangan** | Nama tamu diambil dari URL `?to=Nama`. Tombol ini sekaligus memicu musik (browser memblokir autoplay sebelum ada interaksi). |
| 1 | **Hero** | Nama panggilan mempelai, tanggal, foto utama | Momen "wow" pertama. |
| 2 | **Salam / Ayat / Quote** | QS Ar-Rum:21, ayat Alkitab, atau quote bebas | Sediakan varian per agama (Islam, Kristen, Katolik, Hindu, Buddha, umum). |
| 3 | **Profil Mempelai** | Nama lengkap, "Putra/Putri ke-X dari Bapak … & Ibu …", foto, link IG | Wajib ada nama orang tua karena ini penting secara budaya. |
| 4 | **Countdown** | Hari : Jam : Menit : Detik | |
| 5 | **Detail Acara** | Akad/Pemberkatan + Resepsi: hari, tanggal, jam, lokasi | Tombol **Simpan ke Kalender** (Google/ICS). Jam & sesi bisa dibedakan per tamu. |
| 6 | **Lokasi** | Embed peta + tombol **Buka Google Maps** | |
| 7 | **Love Story** | Timeline: pertama bertemu, lamaran, dst. | Opsional. Banyak diminati generasi Z/milenial. |
| 8 | **Galeri** | Foto prewedding + video | Lightbox, lazy-load. |
| 9 | **Live Streaming** | Link YouTube/IG Live/Zoom | Untuk tamu jauh. |
| 10 | **RSVP** | Nama, hadir/tidak, jumlah orang | Bisa dibatasi jumlah pax per tamu. |
| 11 | **Ucapan & Doa** | Wall komentar publik | Fitur paling "hidup" dan paling sering dilihat. |
| 12 | **Wedding Gift / Amplop Digital** | No. rekening/e-wallet (tombol **Salin**), QRIS, alamat kirim kado | Tulis dengan halus, misalnya "Doa restu Anda merupakan karunia terindah… namun jika ingin memberi tanda kasih…". |
| 13 | **Protokol / Info Tamu** | Dress code, parkir, catatan khusus | Opsional. |
| 14 | **Turut Mengundang** | Daftar keluarga besar | Opsional. Penting untuk keluarga Jawa/Batak/Minang dll. |
| 15 | **Penutup** | Ucapan terima kasih, nama mempelai & keluarga | |
| — | **Elemen melayang** | Tombol musik play/pause, navigasi bawah (bottom nav ikon) | Bottom nav memudahkan tamu langsung lompat ke Acara / Lokasi / RSVP / Gift. |

### Di luar pernikahan (ekspansi produk nanti)
Khitanan, ulang tahun, aqiqah, tasyakuran, wisuda, engagement/lamaran, syukuran rumah, event kantor. Strukturnya sama, cukup ganti section & copy.

---

## 3. TEKNIS — Arsitektur & Fitur

### 3.1 Fitur inti (harus ada)
1. **Link personal per tamu** → `momentlabs.id/rina-dimas?to=Bapak+Andi`
2. **Generator pesan WhatsApp**: admin upload daftar tamu (CSV/Excel), sistem membuat link unik + template pesan, lalu tinggal klik `wa.me/…?text=` per tamu
3. **Preview link WhatsApp yang cantik**: Open Graph image + title + description. Saat dibagikan di WA, link harus tampil sebagai kartu bergambar. Ini first impression yang sering diabaikan pesaing.
4. **RSVP + Ucapan** tersimpan di database, bisa dilihat & diekspor klien
5. **Dashboard klien**: edit data, lihat RSVP, kelola tamu, moderasi ucapan
6. **Musik latar** (pilih dari library atau upload)
7. **Salin rekening 1-klik** + QRIS

### 3.2 Fitur premium (pembeda harga)
- **QR check-in hari H**: tamu yang RSVP hadir mendapat QR, lalu discan panitia lewat HP (web app)
- Sesi/jam acara berbeda per tamu (misal: tamu VIP sesi 1, umum sesi 2)
- Domain custom (`rinadimas.com`)
- Multi-bahasa (ID/EN, atau bahasa daerah)
- Video undangan / animasi opening sinematik
- Layar ucapan live di venue (wall ucapan diproyeksikan di gedung)
- Buku tamu digital (tablet di meja penerima tamu)

### 3.3 Stack yang direkomendasikan
| Lapisan | Pilihan | Alasan |
|---|---|---|
| Frontend | **Next.js (App Router)** + Tailwind CSS | SSR untuk OG image per undangan, cepat, ekosistem besar |
| Animasi | **GSAP + ScrollTrigger** atau Framer Motion; Lenis untuk smooth scroll | Animasi scroll yang halus adalah nilai jual utama |
| Backend/DB | **Supabase** (Postgres + Auth + Storage) | RSVP, ucapan, auth dashboard, upload foto, semua dalam satu layanan |
| OG image | `@vercel/og` / `next/og` | Generate kartu preview WA dinamis per undangan |
| Hosting | Vercel / Cloudflare | Global CDN, gratis di awal |
| Gambar | Next/Image atau Cloudinary, format AVIF/WebP | Foto prewedding biasanya 5–10 MB, wajib dikompres |
| Pembayaran | Midtrans / Xendit / Tripay (QRIS, VA, e-wallet) | Otomasi order |

### 3.4 Model data inti (sketsa)
```
invitations (id, slug, template_id, status, event_date, data jsonb, music_url, owner_id)
guests      (id, invitation_id, name, slug_param, session, max_pax, qr_token, checked_in_at)
rsvps       (id, invitation_id, guest_id, name, attendance, pax, created_at)
wishes      (id, invitation_id, name, message, is_hidden, created_at)
templates   (id, name, category, tier, preview_url, config jsonb)
```
**Prinsip penting:** template = kode, isi = data (JSON). Satu template bisa dipakai ratusan klien tanpa coding ulang. Ini kunci supaya bisnis bisa diskalakan.

### 3.5 Standar kualitas teknis
- **Mobile-first absolut.** Di atas 95% tamu membuka dari HP lewat WhatsApp. Desain di 390px dulu, desktop belakangan (di desktop tampil sebagai "kartu HP" di tengah layar dengan latar foto blur).
- **Cepat di 4G:** LCP < 2,5 detik, bundle awal ringan, musik di-load setelah tombol "Buka Undangan".
- **Dibuka di in-app browser WhatsApp/Instagram.** Uji di sana, karena beberapa API terbatas.
- `prefers-reduced-motion` dihormati, font & kontras terbaca oleh tamu lansia (ukuran teks minimal 16px).
- Anti-spam ucapan (rate limit, filter kata kasar, moderasi).
- Halaman otomatis berubah setelah acara lewat ("Terima kasih atas doa & kehadirannya") dan diarsipkan setelah X bulan.

---

## 4. DESAIN — Arah Visual Modern 2026

### 4.1 Tren yang relevan
- **Personal & ekspresif > template "Pinterest-perfect".** Pasangan ingin undangan yang terasa "kami banget".
- **Minimalis mewah (quiet luxury):** banyak ruang kosong, tipografi besar, sedikit ornamen.
- **Tipografi oversized** + layout editorial (gaya majalah).
- **Fotografi sinematik**: foto full-bleed, grain halus, crop dramatis.
- **Ilustrasi tangan** (line-art bunga, potret ilustrasi pasangan).
- **Palet warna berani 2026:** *Terracotta & Olive*, *Cobalt & Marigold*, *Dusty Rose & Chocolate Brown*; juga **opalescent/iridescent** dan biru kobalt.
- **Interaktif tapi tidak ribet.** Animasi yang melayani cerita, bukan sekadar pamer. Navigasi berbelit dan animasi berlebihan justru dikeluhkan tamu.

### 4.2 Koleksi template awal yang disarankan (6 tema)
| Nama kerja | Gaya | Palet | Font (Google Fonts) | Target |
|---|---|---|---|---|
| **Editorial** | Layout majalah, tipografi raksasa, foto B/W + 1 warna aksen | Off-white, hitam, aksen cobalt | *Playfair Display* / *Instrument Serif* + *Inter* | Urban, kreatif |
| **Terracotta Garden** | Earthy, ilustrasi daun, tekstur kertas | Terracotta, olive, krem | *Cormorant Garamond* + *DM Sans* | Garden/outdoor, boho |
| **Javanese Heritage** | Ornamen batik/gunungan modern, gold foil halus | Cokelat tua, emas, krem | *Cinzel* + *Lora* | Adat Jawa |
| **Quiet Luxury** | Super minimal, banyak ruang kosong, serif tipis | Ivory, taupe, champagne | *Bodoni Moda* + *Jost* | Ballroom, mewah |
| **Opal Dream** | Gradien iridescent, glassmorphism, efek kilau | Pastel opal, lilac, mint | *Italiana* + *Manrope* | Gen-Z, romantis |
| **Islamic Elegance** | Pola geometri islami, arch/kubah, kaligrafi | Sage/emerald, emas, putih | *Amiri* + *Montserrat* | Muslim, akad-centric |

*(Untuk script/kaligrafi nama: Great Vibes, Pinyon Script, Parisienne. Gunakan hanya untuk nama mempelai.)*

### 4.3 Prinsip desain template
1. **Opening yang sinematik** (amplop terbuka, tirai/gerbang terbuka, foto fade-in). Ini 3 detik paling menentukan.
2. **Ritme scroll:** selang-seling section foto penuh dengan section teks lapang.
3. **Satu signature animation per tema** (misal kelopak bunga jatuh, garis emas menggambar sendiri, parallax foto). Jangan semua efek dipakai sekaligus.
4. **Hierarki jelas:** nama mempelai > tanggal > lokasi > CTA (RSVP).
5. **Ornamen = SVG**, bukan PNG berat, supaya bisa diganti warna sesuai palet klien.
6. Sistem **design token** per tema (warna, font, radius, ornamen) supaya klien bisa ganti warna tanpa merusak desain.

---

## 5. LANDING PAGE MomentLabs — Rancangan

### 5.1 Tujuan
Ubah pengunjung (umumnya dari IG/TikTok, di HP) menjadi **chat WhatsApp / order**.

### 5.2 Struktur section
1. **Hero:** headline + mockup HP yang memutar demo undangan asli + CTA "Lihat Demo" & "Pesan via WhatsApp"
   - Ide headline: *"Undangan digital yang bikin tamu berhenti scroll."* / *"Setiap momen layak dirayakan dengan indah."*
2. **Social proof bar:** jumlah pasangan yang sudah pakai, rating, logo/foto klien
3. **Galeri tema:** kartu template yang bisa difilter (Adat, Islami, Minimalis, Modern), tiap kartu ada tombol **Live Demo**. Ini section terpenting.
4. **Fitur unggulan:** ikon + teks singkat (Nama tamu personal, RSVP, Amplop digital, Musik, Peta, Galeri, QR Check-in, Live streaming)
5. **Cara kerja 3 langkah:** Pilih tema → Kirim data → Undangan jadi dalam 1×24 jam
6. **Demo interaktif:** pengunjung ketik nama sendiri, lalu langsung melihat cover "Kepada Yth. [nama mereka]". Ini efek "aha" yang kuat.
7. **Harga:** 3 paket (lihat 5.3), paket tengah ditandai "Paling Laris"
8. **Testimoni:** screenshot chat WA + foto pasangan
9. **FAQ:** revisi, lama pengerjaan, masa aktif, bisa ganti musik?, aman tidak?
10. **CTA akhir + footer:** tombol WA melayang (sticky) di seluruh halaman

### 5.3 Usulan paket harga (draf, untuk divalidasi)
| | **Basic** | **Premium** ⭐ | **Exclusive** |
|---|---|---|---|
| Harga | Rp99rb | Rp199rb | Rp449rb+ |
| Tema | Koleksi basic | Semua tema | Semua + custom warna/ornamen |
| Nama tamu personal | ✅ | ✅ | ✅ |
| Galeri | 6 foto | 20 foto + video | Unlimited |
| RSVP & Ucapan | ✅ | ✅ | ✅ |
| Amplop digital | — | ✅ | ✅ |
| Musik custom | Library | Upload sendiri | Upload sendiri |
| Love story & Live stream | — | ✅ | ✅ |
| Dashboard tamu + WA generator | — | ✅ | ✅ |
| QR Check-in | — | — | ✅ |
| Domain custom | — | — | ✅ |
| Masa aktif | 3 bulan | 6 bulan | 12 bulan |
| Revisi | 1× | 3× | Unlimited (H-3) |

**Add-on:** filter Instagram custom, video undangan, cetak QR fisik, layar ucapan live di venue.

### 5.4 Identitas brand (usulan awal)
- **Nama:** MomentLabs. Kesannya "lab kreatif yang meracik momen". Visual landing page sebaiknya *modern-editorial*, bukan floral klise, supaya beda dari pesaing.
- **Palet brand:** ink hitam-biru (#14141F), ivory (#F7F3EC), aksen **cobalt** (#2D4BFF) atau **terracotta** (#C8643B)
- **Font brand:** *Instrument Serif* (display) + *Inter* / *Geist* (body)
- **Tone bahasa:** hangat, santai-sopan, bahasa Indonesia yang rapi (bukan alay)

---

## 6. Roadmap Eksekusi yang Disarankan

1. **Fase 1 — Fondasi (minggu 1–2):** brand kit, landing page, 2 template unggulan (mis. *Editorial* & *Islamic Elegance*), dengan isi diedit manual oleh kita
2. **Fase 2 — Produk (minggu 3–5):** sistem template berbasis data JSON, RSVP + ucapan (Supabase), link tamu + WA generator, OG image
3. **Fase 3 — Skala (minggu 6+):** dashboard klien self-service, pembayaran otomatis, QR check-in, tambah tema & kategori acara lain

---

## 7. Pertanyaan Terbuka (perlu keputusan)
- Model layanan: **jasa dikerjakan tim** (klien kirim data via WA) atau **self-service** (klien isi sendiri di dashboard)? Saran: mulai dari jasa, lalu bertahap ke self-service.
- Target utama: pasar umum mid-range, atau niche (mis. adat tertentu / premium)?
- Domain: `momentlabs.id` / `.com` / `.co`?

---

### Sumber
- [Bloomberg Technoz — Invitera (data survei Bridestory 86,65%)](https://www.bloombergtechnoz.com/detail-referensi/135/invitera-punya-undangan-pernikahan-digital-yang-aman-elegan)
- [Times Indonesia — Ze Guest Management (WA blast, QR check-in)](https://timesindonesia.co.id/indonesia-positif/529870/platform-undangan-digital-ze-guest-management-jadi-favorit-pesohor)
- [Cermati — 10 situs undangan pernikahan (harga sebarundangan, Invitee)](https://www.cermati.com/artikel/jadi-lebih-hemat-ini-10-situs-membuat-undangan-pernikahan-gratis)
- [UKM Indonesia — Bisnis undangan digital (struktur paket)](https://ukmindonesia.id/baca-deskripsi-posts/mau-cuan-dari-kreativitas-coba-bisnis-undangan-pernikahan-digital)
- [Romi Saputra — Memilih jasa undangan digital 2026](https://www.romisaputra.com/2026/05/cara-memilih-jasa-undangan-digital-pernikahan-terpercaya-di-2026.html)
- [GNFI — Mengenal undangan digital](https://www.goodnewsfromindonesia.id/2022/11/22/mengenal-apa-itu-undangan-digital-trending-di-media-sosial)
- [detik — Invita & QR code](https://inet.detik.com/cyberlife/d-3807131/lewat-invita-kirim-undangan-cukup-pakai-qr-code)
- [Paperlust — Wedding Trends 2026 (palet warna)](https://paperlust.co/blog/wedding-trends-2026/)
- [Joy — 2026 Wedding Trends (website sebagai hub, opalescent)](https://withjoy.com/blog/2026-wedding-trends-what-couples-are-actually-doing-this-year/)
- [Photobox — 2026 wedding design trends (tipografi oversized, sinematik)](https://www.photobox.co.uk/blog/special-occasions/2026-wedding-trends-design)
- [Stationery HQ — Stationery Trends 2026 (minimalis mewah)](https://www.stationeryhq.com/pages/wedding-stationery-trends-2026-what-designers-need-to-know)
- [Popbela — Tren pernikahan 2026](https://www.popbela.com/relationship/married/tren-pernikahan-tahun-2026-00-jclkf-ymjdps)
