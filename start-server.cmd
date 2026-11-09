@echo off
title Momenlabs dev server
cd /d "%~dp0"
echo Menyalakan server Momenlabs...
echo Buka di browser: http://localhost:5173
echo (Tutup jendela ini untuk mematikan server)
echo.
start "" http://localhost:5173
npm.cmd run dev -- --port 5173
pause
