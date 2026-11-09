# Rencana Bisnis — Undangan Pernikahan Digital

> Angka pasar di bawah adalah **estimasi indikatif** untuk perhitungan model, bukan data
> tersitasi. Sebelum eksekusi, validasi ke BPS (jumlah peristiwa nikah per tahun) dan
> riset harga kompetitor terbaru.

## 1. Ukuran pasar (model kasar)

| Variabel | Asumsi | Catatan |
|---|---|---|
| Peristiwa nikah / tahun (Indonesia) | ±1,5 juta | BPS/Kemenag, tren menurun ~5%/thn |
| Pakai undangan digital | 25–35% | naik terus pasca-2020 |
| Pasar terlayani | ±400–500 ribu undangan/thn | |
| Harga rata-rata terjual | Rp 150.000–300.000 | kompetitor jual 280rb dari "harga coret" 800rb |
| Nilai pasar | **±Rp 60–150 miliar/tahun** | sangat terfragmentasi, puluhan pemain |

Target realistis tahun pertama: **0,2–0,5% pangsa** = 800–2.500 undangan =
**Rp 150–600 juta omzet**. Ini bisnis volume dengan margin kotor sangat tinggi, bukan bisnis
ticket besar.

## 2. Peta kompetitor & posisi

| Kelas | Contoh | Harga | Kelemahan |
|---|---|---|---|
| Platform besar | Owlink/our-wedding.link, Satumomen, Wedew | 150–500rb | berat, template seragam, support lambat |
| Marketplace template | penjual di Tokopedia/Shopee | 25–100rb | kualitas acak, tanpa dashboard, tanpa check-in |
| Agensi custom | studio web | 2–10 juta | mahal, lama, tak scalable |

**Posisi yang diambil:** platform kelas menengah-atas dengan **dua janji yang bisa dibuktikan
dalam 10 detik**: (a) undangan terbuka < 1,5 detik di HP 4G, (b) kelola 1.000 tamu tanpa
drama — paste dari Excel, kirim WA massal terjadwal, check-in offline.

## 3. Model pendapatan (berlapis — jangan hanya jual satu kali)

**A. Paket undangan (inti)**

| Paket | Harga | Isi |
|---|---|---|
| Basic | Rp 99.000 | 1 tema, tamu tak terbatas, RSVP, ucapan, amplop digital, aktif 3 bln |
| Premium | Rp 199.000 | semua tema, musik, galeri 30 foto, link+QR per tamu, export Excel, aktif 12 bln |
| Luxury | Rp 349.000 | sampul video, konten beda per-tamu, sesi/shift tamu, subdomain sendiri, buku tamu QR, souvenir tracking |

**B. Add-on margin tinggi (ini yang menaikkan ARPU 40–80%)**
- Blast WhatsApp resmi (WABA): Rp 75.000 / 500 pesan (HPP ±Rp 20–35rb) — lihat catatan risiko §6
- Kartu QR cetak + kirim: Rp 2.500/kartu
- Domain sendiri `.com` 1 tahun: Rp 250.000
- Petugas/alat scan hari-H (tablet + operator mitra): Rp 500.000–1.500.000
- Disposable camera tamu + galeri foto bersama: Rp 99.000
- Live streaming + guestbook layar di venue: Rp 300.000

**C. Reseller / white-label (jalur paling cepat ke volume)**
Wedding Organizer, percetakan, dan admin "jastip undangan" adalah distributor alami.
Beri dashboard vendor: harga modal 50–60% dari harga ritel, kuota prabayar, subdomain mereka.
Kompetitor sudah menyediakan field `vendor` — artinya jalur ini terbukti menghasilkan.
Target: 60% volume dari reseller pada bulan 9.

**D. Recurring tipis tapi nyata**
Perpanjangan masa aktif Rp 49.000/tahun + arsip galeri. Juga ekspansi ke
**khitanan, aqiqah, ulang tahun, reuni, seminar** — mesin yang sama, hanya template berbeda
(kompetitor sudah punya flag `is_not_wedding`).

## 4. Unit economics per undangan (Premium Rp 199.000)

| Pos | Biaya |
|---|---|
| Infrastruktur (hosting+DB+CDN+storage, dialokasikan) | ±Rp 2.000 |
| Payment gateway (Midtrans/Xendit ±2,9%) | ±Rp 6.000 |
| Support manusia (rata-rata 20 menit) | ±Rp 10.000 |
| **HPP total** | **±Rp 18.000 (9%)** |
| **Margin kotor** | **±Rp 181.000 (91%)** |
| CAC via iklan TikTok/Meta (target) | Rp 40.000–70.000 |
| **Kontribusi bersih** | **±Rp 110.000–140.000 / undangan** |

Break-even operasional (tim 2 orang + iklan Rp 10 jt/bln ≈ biaya Rp 25 jt/bln):
**±200 undangan/bulan**. Realistis dicapai bulan 5–8 bila iklan dan reseller jalan.

## 5. Kanal akuisisi (urut prioritas)

1. **TikTok organik + Spark Ads** — konten "before/after undangan", "cara kirim 1000 undangan
   dalam 10 menit". Kompetitor pasang 2 TikTok Pixel; pasarnya ada di sana.
2. **Reseller WO & percetakan** — margin 40%, mereka bawa klien berulang.
3. **Instagram/Meta Ads** retarget dari pengunjung demo.
4. **SEO jangka panjang** — "undangan digital gratis", "template undangan pernikahan".
   Butuh 6–9 bulan, jangan diandalkan di awal.
5. **Loyalitas produk**: setiap tamu yang membuka undangan melihat footer halus
   "Dibuat dengan <brand>" → 1 undangan = 300–1.000 impresi gratis. Ini kanal termurah
   dan sudah terbukti di pemain lama.

## 6. Risiko bisnis & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Nomor WhatsApp pribadi diblokir saat blast 1.000 pesan | layanan mati, reputasi hancur | **Jangan pakai WA pribadi/unofficial.** Pakai WhatsApp Cloud API resmi + template message terdaftar + opt-in. Alternatif default: generate pesan dan **user yang klik kirim** (aman, gratis) |
| Harga dibanting kompetitor | margin turun | jangan bersaing harga; jual kecepatan + layanan hari-H |
| Kegagalan di hari-H (undangan down, scanner mati) | refund + viral negatif | SLA teknis di §Arsitektur: static-first, offline-first, status page |
| Data tamu (nama, nomor HP ribuan orang) bocor | pidana UU PDP 27/2022 + kepercayaan hilang | enkripsi at-rest, hak akses per-undangan, retensi 12 bln + auto-purge, DPA dengan vendor cloud, audit log |
| Ketergantungan 1 orang (bus factor) | bisnis berhenti | semua infrastruktur as-code, dokumentasi, akun atas nama entitas, bukan pribadi |
| Klaim konten template (font/foto berlisensi) | takedown | hanya font OFL/Google Fonts, aset ilustrasi berlisensi komersial, simpan bukti lisensi |

## 7. Target 12 bulan

| Bulan | Milestone | Undangan/bln |
|---|---|---|
| 1–2 | MVP live, 5 tema, dashboard tamu, RSVP | 10 (teman/keluarga, gratis) |
| 3 | Pembayaran + 3 reseller pertama | 40 |
| 4–6 | Buku tamu QR offline, blast WA, 15 tema | 100 → 200 |
| 7–9 | White-label vendor, add-on cetak QR, ekspansi non-wedding | 300 |
| 10–12 | Editor tema sendiri, API partner, tim support 2 orang | 500 |

Kumulatif tahun-1: ±2.000 undangan ≈ **Rp 400–450 juta** omzet, margin kotor ±90%.
