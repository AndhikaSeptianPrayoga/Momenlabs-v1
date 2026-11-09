# Analisis Teknis & Produk — our-wedding.link (Owlink)

Diambil langsung dari halaman `https://our-wedding.link/chintia-firman?to=hans-di-tempat`
(inspeksi DOM, `window.__NUXT__`, network waterfall, 19 Okt 2026).

## 1. Stack yang mereka pakai

| Lapisan | Teknologi terdeteksi |
|---|---|
| Frontend | **Nuxt 2 (Vue 2), SSR** — `window.__NUXT__`, `data-n-head="ssr"`, bundle `/_nuxt/*.js` |
| Animasi/UI | jQuery 3.5.1, GSAP TweenMax 2.1.2, ScrollMagic, fullPage.js 4, Owl Carousel, Fancybox 4, WOW.js, lax.js, Masonry, typed.js, parallax.js |
| Backend | API terpisah `api.our-wedding.link` — ID dokumen bergaya **MongoDB ObjectId** (`6acf32ccb9dfd227d5211504`) → Node/Express + MongoDB |
| Media | CDN sendiri `cdn-uploads.owlink.id` (brand aslinya **Owlink**) |
| Edge/CDN | **Cloudflare** (rocket-loader, `/cdn-cgi/rum`) |
| Realtime | ada state `socket_status` → WebSocket untuk RSVP/guestbook live |
| Push | OneSignal (notifikasi RSVP masuk ke HP mempelai) |
| Anti-spam | Google reCAPTCHA |
| Analytics/Ads | GTM, GA4, Google Ads (AW-402506034), **TikTok Pixel (2 pixel)**, Meta Pixel, Amplitude, Hotjar |
| Tema | CSS per-undangan di-serve dinamis: `/css-tema/custom-YIpe1teqRO30DhhH8dsf?v=...` |

Catatan bisnis dari stack: **mereka beriklan agresif di TikTok + Google Ads**, dan
mengukur funnel dengan Amplitude + Hotjar. Artinya channel akuisisi utama di pasar ini
adalah paid social, bukan SEO.

## 2. Performa — ini celah terbesar mereka

Hasil ukur di sesi ini:

- **164 request**, **~2.0 MB transfer**
- `navigation.duration` **≈ 7.2 detik**
- Script pihak ketiga ≈ 783 KB (reCAPTCHA 347 KB, FB pixel 112 KB, dst.)
- Font **.ttf/.otf mentah** (Roboto Black/Light/Regular + aire.otf ≈ 370 KB) — bukan WOFF2
- GIF loading 142 KB
- Banyak library tumpang tindih (jQuery + GSAP + ScrollMagic + lax + WOW untuk tujuan yang sama)

Di HP mid-range dengan 4G Indonesia, ini 8–15 detik sampai undangan bisa dibuka.
Produk yang sama dengan **LCP < 1,5 detik dan < 400 KB** adalah diferensiasi yang
langsung terasa oleh 100% tamu — dan itu bisa dicapai tanpa mengurangi satu fitur pun.

## 3. Model data & fitur mereka (hasil dekode `__NUXT__.state`)

Schema undangan mereka punya ±150 field. Yang penting untuk ditiru/dilampaui:

**Identitas & paket**
`user_code` (slug undangan), `UserType` (paket: LUXURY harga coret 800.000 → jual 280.000),
`user_level` (bronze/…), `user_version` 2.0, `vendor` (mode white-label untuk reseller/WO),
`is_active`, `has_lock`, `feature_ekslusif`, `disallow_feature[]`.

**Per-tamu (inti bisnisnya)**
```
invitation_to: {
  _id, name: "Hans", slug: "hans-di-tempat", location: "di Tempat",
  type: "private", guest_type: "REG",
  total_guest: 2, use_max_guest: true, allowed_group_rsvp: false,
  do_checkin: "2026-10-18T05:47:32Z",
  has_rsvp: { response: "yes", participant: 2, token: "g2ws1P41NE...", rundown_selection: [] }
}
```
→ satu baris tamu = slug unik + kuota orang + token RSVP + stempel check-in.
URL `?to=hans-di-tempat`, dan `restrict_open_without_guest` bisa memblokir akses tanpa slug.

**Acara**: `akad_*`, `resepsi_*`, `custom_schedule[]`, `is_resepsi_session` + `resepsi_session[]`
(sesi/shift tamu), `tz_event`/`tz_label` (WIB/WITA/WIT), `wedding_location_embed`.

**Modul yang bisa dimatikan satu-satu**: `disabled_music`, `disabled_gallery`, `disabled_amplop`,
`disabled_guestbook`, `disabled_rsvp`, `disabled_qris`, `disabled_form_wishes`,
`disabled_photo_wishes`, `disabled_parent_info`, `enabled_live_streaming`.

**RSVP lanjutan**: `max_rsvp`, `max_attendance`, `auto_acc_public_rsvp`, `paid_rsvp` +
`rsvp_payment_duration` (tiket berbayar!), `enable_rsvp_rundown_selection`, `rsvp_hide_phone`,
`hide_count_rsvp`, `rsvp_notification`, `bypass_code`.

**Buku tamu hari-H**: `app_guestbook_ison`, `app_guestbook_pin`, `app_guestbook_token`,
`app_guestbook_ticket_template`, `app_guestbook_gift_template`, `auto_checkin_on_scanqr`,
`using_photo_checkin`, `using_souvenir` + `max_souvenir`/`total_souvenir`,
`app_guestbook_attendance_no_format` → aplikasi scanner QR terpisah, cetak tiket/label souvenir.

**Amplop digital**: `amplop_account_number`, `disabled_qris`, `kado_tampil_nama`,
`kado_amplop_tetap`, `kado_tutup_otomatis`.

**Lain-lain**: `Preset`/`TemplateSetting`/`client_css` (tema + warna custom), `sort_elements`
(urutan section bisa di-drag), `need_wizard` (onboarding), `default_english`/`english_format` (i18n),
`no_index` (privasi SEO), `share_text` + `preview_image_share` (OG per undangan),
`background_music`, `galleries`, `quotes`, `data_pengisi`.

Fitur paket Luxury yang mereka iklankan sendiri: semua desain, **sampul video**,
**isi undangan beda per tamu**, alamat web tanpa kode acak, **disposable camera (15 jepretan/tamu)**.

## 4. Kesimpulan kompetitif

Yang sudah matang di mereka: kedalaman fitur operasional (sesi tamu, souvenir, tiket berbayar,
check-in, white-label vendor). **Jangan** bersaing di jumlah fitur sejak hari pertama.

Yang lemah dan bisa diserang:
1. **Kecepatan buka undangan** (7 detik, 2 MB) — paling terasa, paling mudah menang.
2. **Stack lama** (Nuxt 2 + jQuery) → biaya maintenance tinggi, sulit tambah fitur.
3. **Alur input 1000 tamu** masih berbasis form/upload klasik — ruang untuk menang lewat
   paste-dari-Excel + normalisasi nomor otomatis + deteksi duplikat.
4. **Tidak ada yang benar-benar offline-first saat hari-H** (venue sering tanpa sinyal).
