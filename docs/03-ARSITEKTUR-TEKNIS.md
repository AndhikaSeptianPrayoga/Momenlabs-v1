# Arsitektur Teknis & Pilihan Bahasa

Prinsip utama: **halaman undangan tidak boleh menyentuh database saat tamu membukanya.**
Hampir semua skenario buruk di dokumen ini berakar dari pelanggaran prinsip itu.

## 1. Pilihan stack (dan alasannya)

| Bagian | Pilihan | Alasan |
|---|---|---|
| Bahasa | **TypeScript** di seluruh stack | satu bahasa untuk web, API, worker, scanner → cukup 1–2 developer. Hindari polyglot di awal |
| Framework web | **Next.js 15 (App Router) + React Server Components** | SSG/ISR bawaan untuk halaman undangan, Server Actions untuk form, satu repo untuk sisi publik + dashboard |
| Styling | **Tailwind CSS** + CSS variables per-tema | tema = satu set token warna/font, bukan satu file CSS per klien |
| Animasi | **CSS / Web Animations API + Motion One** (±5 KB) | pengganti jQuery + GSAP + ScrollMagic + WOW milik kompetitor (±300 KB) |
| Database | **PostgreSQL** (Supabase atau Neon) | relasional cocok untuk undangan→tamu→rsvp→checkin; constraint & transaksi mencegah double-RSVP/double-checkin |
| ORM | **Drizzle ORM** | SQL-first, migrasi jelas, tipe aman |
| Auth | Supabase Auth / Auth.js (OTP WhatsApp atau Google) | pengantin bukan pengguna teknis — hindari password |
| Media | **Cloudflare R2** (egress gratis) + `next/image` atau Cloudflare Images | foto & video sampul adalah komponen biaya terbesar |
| CDN/Edge | **Cloudflare** di depan Vercel/VPS | cache HTML undangan di edge, WAF, rate limit, anti-bot |
| Antrian/job | **Upstash QStash** atau BullMQ + Redis | blast WA, render OG image, export Excel, email |
| Realtime | Supabase Realtime (Postgres changes) | notifikasi RSVP & ucapan masuk; opsional, bukan kritikal |
| Pembayaran | **Midtrans** atau Xendit (QRIS, VA, e-wallet) | standar Indonesia |
| WhatsApp | **Meta WhatsApp Cloud API** (resmi) | lihat §5.3 — jangan pernah unofficial |
| Scanner hari-H | **PWA offline-first** (IndexedDB + Service Worker) + `@zxing/browser` | tanpa install aplikasi, jalan tanpa sinyal |
| Monitoring | Sentry + Better Stack (uptime) + Umami/Plausible | bukan Hotjar + Amplitude + 5 pixel seperti kompetitor |
| CI/CD | GitHub Actions → Vercel/Cloudflare | preview deploy tiap PR |

**Yang sengaja TIDAK dipakai di awal:** microservice, Kubernetes, GraphQL, aplikasi mobile
native, WebSocket custom. Semuanya menambah biaya operasional tanpa menambah nilai bagi pengantin.

## 2. Topologi

```
Tamu  ──► Cloudflare Edge (HTML undangan ter-cache, TTL panjang)
             │ miss
             ▼
        Next.js (ISR, revalidate on-demand saat pengantin menyimpan)
             │
             ├── Postgres (tamu, rsvp, ucapan, checkin)
             ├── R2 (foto/video/musik)
             └── QStash (job: blast WA, OG image, export)

Pengantin ──► /dashboard (auth, SSR, tidak di-cache)
Penjaga   ──► /scan (PWA offline, sinkron saat online)
buku tamu
```

## 3. Model data inti (Postgres)

```sql
create table invitations (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references users(id),
  slug          citext unique not null,          -- "chintia-firman"
  package       text not null,                   -- basic|premium|luxury
  theme_id      text not null,
  status        text not null default 'draft',   -- draft|active|expired
  content       jsonb not null,                  -- semua teks/section/urutan
  settings      jsonb not null default '{}',     -- modul on/off, zona waktu, privasi
  published_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz default now()
);

create table guests (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  name          text not null,
  slug          citext not null,                 -- "hans-di-tempat"
  phone_e164    text,                            -- +62812...
  salutation    text,                            -- "Bapak/Ibu"
  address_label text default 'di Tempat',
  category      text,                            -- keluarga|kantor|teman
  session_code  text,                            -- shift/sesi resepsi
  quota         int  not null default 2,
  groups        text[],
  note          text,
  import_batch  uuid,
  created_at    timestamptz default now(),
  unique (invitation_id, slug),
  unique (invitation_id, phone_e164)             -- cegah duplikat nomor
);
create index on guests (invitation_id, category);

create table rsvps (
  id            uuid primary key default gen_random_uuid(),
  guest_id      uuid not null unique references guests(id) on delete cascade,
  response      text not null check (response in ('yes','no','maybe')),
  participants  int  not null default 1,
  sessions      text[],
  message       text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);                                               -- unique guest_id = anti double-RSVP

create table checkins (
  id            uuid primary key default gen_random_uuid(),
  guest_id      uuid not null references guests(id) on delete cascade,
  device_id     text not null,
  client_uid    text not null,                   -- UUID dibuat di perangkat (idempotensi)
  scanned_at    timestamptz not null,            -- waktu perangkat, bukan server
  synced_at     timestamptz default now(),
  souvenir      int default 0,
  unique (client_uid)                            -- sinkron ulang tidak menggandakan
);
create unique index one_checkin_per_guest on checkins (guest_id);

create table wishes (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  guest_id uuid references guests(id),
  name text not null, origin text, body text not null,
  status text default 'approved',                -- approved|pending|hidden
  created_at timestamptz default now()
);
create index on wishes (invitation_id, created_at desc);

create table message_jobs (                      -- blast WA/undangan
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid, guest_id uuid, channel text,
  status text default 'queued',                  -- queued|sent|delivered|failed
  provider_msg_id text, error text,
  attempt int default 0, scheduled_at timestamptz,
  unique (guest_id, channel, scheduled_at)       -- idempotensi: tamu tak dikirimi 2x
);
```

Dua keputusan desain yang penting:

- `content` dan `settings` sebagai **JSONB** supaya menambah fitur tema tidak butuh migrasi DB.
  (Kelemahan kompetitor: ±150 kolom datar yang makin sulit dikembangkan.)
- Semua pencegahan duplikasi ada **di level constraint database**, bukan di kode aplikasi.
  Inilah yang menyelamatkan saat ratusan tamu menekan tombol bersamaan.

## 4. Strategi render — kunci agar tidak lambat

| Halaman | Render | Cache |
|---|---|---|
| `/{slug}` (tanpa tamu) | SSG/ISR | edge, 1 jam, purge saat pengantin menyimpan |
| `/{slug}?to={guest}` | **HTML sama persis**, nama tamu disuntik di klien | HTML dari edge; nama tamu via `GET /api/g/{slug}/{guest}` (JSON < 1 KB, cache 60 dtk) |
| Gambar | `next/image` → AVIF/WebP, lazy, srcset | CDN immutable |
| Font | 2 keluarga, WOFF2 subset latin, `font-display: swap`, self-host | immutable 1 tahun |
| Dashboard | SSR, `no-store` | tidak di-cache |

**Anggaran performa (CI harus gagal bila dilanggar):**

- HTML awal ≤ 60 KB, JS ≤ 120 KB gzip, total muat pertama ≤ 400 KB
- LCP ≤ 1,5 dtk (4G, HP mid-range), TTI ≤ 2,5 dtk, CLS ≤ 0,05
- Request pihak ketiga pada halaman undangan: **0** (analytics first-party; Turnstile hanya di form)
- Musik, galeri, dan video **tidak** dimuat sebelum tamu menekan "Buka Undangan"

Bandingkan kompetitor: 2 MB / 164 request / 7,2 detik.

## 5. Skenario terburuk 1.000 undangan — dan penanganannya

### 5.1 Memasukkan 1.000 tamu tanpa menyiksa pengantin

Realitanya daftar tamu tersebar di WhatsApp, Excel, dan kertas, dengan format berantakan:
`pak budi & istri`, `081 234 567 89`, `Keluarga Bpk. H. Sulaiman`.

Solusi — **import pintar, bukan sekadar upload CSV**:

1. **Tempel langsung dari Excel/Sheets** (area paste menangkap TSV) atau unggah .xlsx/.csv.
2. **Pemetaan kolom otomatis** dengan tebakan nama kolom + layar konfirmasi.
3. **Normalisasi otomatis**: nomor → E.164 (`08xx` / `62xx` / `+62` → `+628xx`), Title Case nama,
   rapikan gelar, pisah "Bapak X & Ibu Y" bila diminta.
4. **Deteksi duplikat** dari nomor ter-normalisasi + kemiripan nama (`pg_trgm`) → ditandai
   "mungkin duplikat", bukan ditolak diam-diam.
5. **Slug unik otomatis**: `hans-di-tempat`, `hans-di-tempat-2` (dicek ke DB).
6. **Impor transaksional & dapat dibatalkan**: satu `import_batch`, tombol "Urungkan impor ini".
7. **Baris bermasalah tidak menggagalkan 999 lainnya** — tabel error yang bisa diperbaiki di tempat,
   lalu "impor ulang yang gagal saja".
8. Kinerja: 1.000 baris lewat satu bulk insert / `COPY` < 1 detik. Jangan pernah 1.000 INSERT terpisah.

Setelah impor: edit massal (pilih 200 baris → ubah kategori/kuota/sesi sekaligus), pencarian
instan, filter, dan **ekspor Excel** kapan saja.

### 5.2 Membuat & membagikan 1.000 link + QR

- Link deterministik dari slug → **tidak perlu digenerate dan disimpan satu per satu**.
- QR dibuat **di klien** sebagai SVG; untuk cetak massal, satu job background menghasilkan
  PDF 1.000 kartu (±20–40 detik di worker), bukan 1.000 permintaan browser.
- "Salin semua pesan" menghasilkan berkas berisi 1.000 pesan siap tempel, plus
  `wa.me/<nomor>?text=...` per tamu.

### 5.3 Mengirim 1.000 pesan WhatsApp — sumber kegagalan paling umum di industri ini

| Pendekatan | Risiko | Rekomendasi |
|---|---|---|
| WA pribadi, manual satu per satu | aman, tapi 1.000 × 20 dtk ≈ 5,5 jam | sediakan antarmuka "kirim berikutnya" dengan progres — tetap jadi opsi default & gratis |
| Library unofficial (Baileys, whatsapp-web.js) | **nomor diblokir permanen**, melanggar ToS | jangan dijual sebagai fitur berbayar |
| **WhatsApp Cloud API resmi** | perlu verifikasi bisnis + template disetujui + biaya per percakapan | **jalur produksi** |

Teknis pengiriman massal:

- Semua pesan masuk **antrian** dengan `scheduled_at` dan pembatas laju (mis. 10 pesan/detik,
  menyesuaikan tier Meta) — bukan loop `for` di route handler.
- **Idempoten** lewat `unique (guest_id, channel, scheduled_at)`: klik ganda tidak mengirim dua kali.
- Retry **exponential backoff**, maksimum 3 percobaan; kegagalan masuk daftar "perlu ditindak".
- Webhook status (sent/delivered/read/failed) → dashboard menampilkan status nyata per tamu.
- Pecah per kategori dan jadwalkan (mis. 300/hari) agar kualitas nomor tidak diturunkan Meta.

### 5.4 Lonjakan trafik setelah blast

Hitungan: 1.000 tamu, 60% membuka dalam 2 jam, puncaknya di 10 menit pertama →
±100 pembukaan/menit ≈ **2 request/detik**. Kecil. Yang membunuh server bukan jumlahnya,
melainkan **kalau setiap pembukaan memicu query DB + render SSR**.

Pengaman berlapis:

1. HTML undangan di-cache di edge → origin hanya dihubungi sekali per revalidasi.
2. Endpoint nama tamu ringan, cache 60 detik, **wajib** rate limit per IP (mis. 60/menit) agar
   daftar tamu tidak bisa dipanen orang luar.
3. Satu undangan viral (100.000 pembukaan) tetap aman karena halaman statis;
   `stale-while-revalidate` menjaga layanan walau origin lambat.
4. Alarm: p95 latency > 800 ms atau error rate > 1% → notifikasi ke Telegram/Slack.

### 5.5 RSVP bersamaan, kuota, dan double-submit

- `unique (guest_id)` + `INSERT ... ON CONFLICT DO UPDATE` → tidak ada RSVP ganda.
- Kuota acara dihitung dengan counter atomik / `SELECT ... FOR UPDATE`, bukan `count()` lalu
  `insert` (race condition klasik).
- Tombol dikunci optimistis di klien + token idempotensi per permintaan.
- Form ucapan: Cloudflare Turnstile (jauh lebih ringan dari reCAPTCHA) + rate limit + filter kata
  kasar + mode moderasi (`status: pending`) untuk acara publik/pejabat.

### 5.6 Hari-H: check-in 1.000 tamu di gedung tanpa sinyal — **skenario paling berbahaya**

Realita: ballroom di basement, WiFi venue penuh, 300 tamu datang dalam 30 menit
(≈ 1 scan tiap 6 detik, biasanya 3 petugas paralel).

Desain wajib **offline-first**:

1. PWA scanner mengunduh **seluruh daftar tamu** ke IndexedDB selagi masih ada sinyal
   (1.000 tamu ≈ 150 KB — sepele).
2. Pemindaian, pencarian nama manual, pencatatan jumlah hadir, dan hitungan souvenir berjalan
   **100% lokal**. Tidak ada permintaan jaringan di jalur kritis.
3. Tiap check-in dicatat dengan `client_uid` (UUID lokal) + waktu perangkat, lalu disinkronkan;
   `unique (client_uid)` membuat sinkron berulang aman.
4. **Multi-perangkat**: konflik (tamu sama di 2 alat) diselesaikan "yang pertama menang"
   berdasarkan `scanned_at`; sisanya ditandai duplikat — data tidak dibuang, hanya dilabeli.
5. QR berisi token acak per tamu yang ditandatangani (HMAC), bukan nomor urut → tidak bisa ditebak
   dan bisa divalidasi offline tanpa server.
6. Cadangan manual: daftar tamu dapat dicetak PDF A4 urut abjad + mode "cari nama".
   Kalau semua teknologi gagal, acara tetap jalan.
7. Fitur **"Mode simulasi hari-H"** supaya tim bisa latihan H-3.

### 5.7 Unggahan foto tamu (disposable camera)

- Unggah **langsung ke R2** dengan presigned URL, tidak lewat server aplikasi.
- Kompresi di browser sebelum unggah (≤ 1600 px, WebP) → hemat ±80% bandwidth.
- Batas 15 foto/tamu, 10 MB/foto, antrian unggah dengan retry saat sinyal buruk.
- Galeri tamu default `pending` untuk acara publik.

### 5.8 Biaya & batas skala (ribuan undangan aktif)

| Pos | Perkiraan/bulan |
|---|---|
| Postgres (Supabase Pro / Neon) | ±Rp 400.000 |
| Hosting Next.js (Vercel Pro / VPS 4 vCPU) | ±Rp 350.000 |
| R2 storage 500 GB (egress gratis) | ±Rp 120.000 |
| Cloudflare Pro + Turnstile | ±Rp 350.000 |
| Queue/Redis (Upstash) | ±Rp 150.000 |
| Sentry + uptime monitor | ±Rp 150.000 |
| **Total** | **±Rp 1,5 juta/bulan** |

### 5.9 Kehilangan data & bencana

- PITR (point-in-time recovery) aktif; **uji restore tiap bulan** — backup yang tak pernah diuji
  bukan backup.
- Ekspor mandiri: pengantin bisa mengunduh seluruh datanya kapan saja.
- Snapshot R2 lintas-wilayah untuk media.
- Semua domain, akun cloud, dan metode pembayaran atas nama **badan usaha**, 2FA aktif, akses
  darurat tersimpan di password manager tim.

### 5.10 Masalah teknis lain yang sering menimpa produk sejenis

| Masalah | Pencegahan |
|---|---|
| Musik tidak jalan di iOS | putar hanya setelah interaksi "Buka Undangan"; tombol bisu jelas |
| Preview WhatsApp kosong/jelek | OG image otomatis per undangan (Satori / `@vercel/og`), 1200×630, di-cache |
| Nama tamu rusak karena emoji/tanda kutip | sanitasi + encoding URL benar; uji nama Arab, Tionghoa, emoji |
| Undangan "hilang" karena slug diubah | simpan slug lama → redirect 301 |
| Tamu membuka di WebView (IG/WA) | uji eksplisit; sediakan "buka di browser" |
| Zona waktu salah (WIB/WITA/WIT) | simpan UTC + `tz_event`; tampilkan label zona |
| Layar ekstrem kecil/besar | uji 320 px → tablet; pakai `dvh`, bukan `vh` |
| Pengantin menghapus foto yang sudah dibagikan | soft delete 30 hari |

## 6. Kualitas & proses rilis

- **Uji end-to-end (Playwright)** untuk tiga alur yang tak boleh rusak: buka undangan,
  kirim RSVP, check-in offline lalu sinkron.
- **Lighthouse CI** sebagai gerbang: build gagal bila skor performa < 90 atau anggaran byte terlampaui.
- **Feature flag** per undangan — fitur baru diuji di sebagian pengguna lebih dulu.
- **Freeze deploy H-1 sampai H+1** untuk undangan yang acaranya berlangsung hari itu
  (tanggal acara ada di DB — otomatiskan peringatannya).
- Status page publik + nomor WhatsApp darurat khusus klien yang acaranya hari itu.
