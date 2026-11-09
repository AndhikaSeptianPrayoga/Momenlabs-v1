# MomenLabs

Landing page & demo undangan pernikahan digital interaktif (parallax, perjalanan kamera, Story Mode),
plus lini **Game Interaktif Custom** (game 3D yang bisa dimainkan dari HP).

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Demo template: `/?template=sekar-prambanan` (id lain di `src/catalog.jsx`),
paket: tambahkan `&plan=basic|premium|luxury`, nama tamu: `&to=Nama+Tamu`.

Build produksi: `npm run build` → folder `dist/` (hosting statis).

Konteks lengkap project (struktur, pola template, pipeline aset, catatan terakhir): lihat [CLAUDE.md](CLAUDE.md).
