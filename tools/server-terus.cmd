@echo off
rem Server website MomenLabs yang selalu hidup: kalau berhenti/crash, otomatis dinyalakan lagi.
rem Dijalankan tanpa jendela oleh server-terus.vbs.
rem Menyajikan VERSI BUILD (folder dist) yang ringan & cepat, bukan mode dev yang berat.
rem Setelah mengubah kode, jalankan "npm.cmd run build" agar perubahan tampil di sini.
rem Alamat: http://localhost:5174  (HP di Wi-Fi yang sama: http://<IP laptop>:5174)
cd /d "%~dp0.."
:ulang
if not exist "dist\index.html" call npm.cmd run build >> "%~dp0server.log" 2>&1
echo [%date% %time%] server dinyalakan >> "%~dp0server.log"
node node_modules\vite\bin\vite.js preview --port 5174 --strictPort --host >> "%~dp0server.log" 2>&1
echo [%date% %time%] server berhenti, dinyalakan lagi 5 detik lagi >> "%~dp0server.log"
rem "timeout" gagal tanpa jendela konsol (langsung lanjut = menyala-mati terus); ping selalu menunggu
ping -n 6 127.0.0.1 > nul
goto ulang
