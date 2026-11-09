# Roadmap Eksekusi & Kebutuhan Resource

## 1. Tim minimum

| Peran | Kapan dibutuhkan | Catatan |
|---|---|---|
| Full-stack TS (Next.js + Postgres) | Bulan 0 | bisa Anda sendiri; ini peran inti |
| Desainer tema (UI + ilustrasi/motion) | Bulan 1, paruh waktu | kualitas tema = alasan orang membeli |
| Support / admin (WA, onboarding klien) | Bulan 3 | 1 orang sanggup ±150 undangan/bulan |
| Marketing konten TikTok/IG | Bulan 2, paruh waktu | kanal akuisisi utama |

Dua orang pertama (developer + desainer) sudah cukup untuk sampai 200 undangan/bulan.

## 2. Timeline 16 minggu

**Fase 0 — Fondasi (minggu 1–2)**
Repo Next.js + TS + Tailwind + Drizzle; skema DB inti; auth; deploy pipeline; Sentry;
anggaran performa di CI. *Selesai = halaman undangan dummy live dengan skor Lighthouse 95+.*

**Fase 1 — Undangan bisa dipakai (minggu 3–6)**
Mesin tema berbasis token; 3 tema; editor konten (wizard: pasangan → acara → galeri → musik);
halaman undangan + `?to=`; RSVP; ucapan; amplop digital (QRIS/rekening); countdown;
add-to-calendar; OG image otomatis. *Selesai = 5 pernikahan teman memakainya gratis.*

**Fase 2 — Manajemen tamu skala besar (minggu 7–10)** ← pembeda utama
Import tempel-dari-Excel + normalisasi + deteksi duplikat + undo; tabel tamu virtualized
(10.000 baris mulus); edit massal; generator link & QR; "kirim berikutnya" via `wa.me`;
export Excel; statistik RSVP realtime. *Selesai = 1.000 tamu masuk dalam < 5 menit,
diuji dengan data sintetis.*

**Fase 3 — Hari-H & monetisasi (minggu 11–14)**
PWA scanner offline-first + multi-perangkat + souvenir; cetak PDF kartu QR & daftar tamu;
Midtrans; paket & kuota fitur; dashboard vendor/reseller white-label.
*Selesai = simulasi 300 check-in dalam mode pesawat berhasil, lalu sinkron tanpa duplikat.*

**Fase 4 — Skala (minggu 15–16 dan seterusnya)**
WhatsApp Cloud API resmi; disposable camera; live streaming; tema beda per-tamu;
sesi/shift tamu; domain kustom; template non-wedding (khitanan, aqiqah, ulang tahun).

## 3. Urutan prioritas fitur (jangan dibalik)

1. Kecepatan + keindahan tema — alasan orang membeli
2. Import & kelola tamu — alasan orang tidak minta refund
3. Check-in hari-H — alasan reseller/WO merekomendasikan Anda
4. Blast WA resmi — add-on margin tinggi, tapi butuh verifikasi bisnis (mulai urus dari bulan 1,
   prosesnya lama)
5. Editor tema mandiri — baru relevan setelah 500+ undangan

## 4. Definisi "siap jual"

- [ ] Lighthouse mobile ≥ 95, LCP < 1,5 dtk pada throttle 4G
- [ ] 1.000 tamu diimpor < 5 menit, nol duplikat, bisa di-undo
- [ ] 300 check-in berurutan dalam mode pesawat → sinkron bersih, nol duplikat
- [ ] Uji E2E hijau untuk buka-undangan / RSVP / check-in
- [ ] Restore backup teruji
- [ ] Halaman kebijakan privasi + persetujuan pemrosesan data tamu (UU PDP 27/2022)
- [ ] Preview WhatsApp & Instagram tampil benar di Android dan iOS

## 5. Investasi awal (indikatif)

| Pos | Biaya |
|---|---|
| Infrastruktur 4 bulan pertama | ±Rp 4 juta |
| Domain + SSL + email bisnis | ±Rp 1 juta |
| Aset desain (ilustrasi, font komersial, foto stok) | ±Rp 3–8 juta |
| Iklan uji coba (TikTok/Meta) bulan 3–4 | ±Rp 10 juta |
| Badan usaha (CV/PT) + rekening bisnis | ±Rp 3–6 juta |
| **Total modal awal** | **±Rp 20–30 juta** (di luar gaji/waktu sendiri) |
