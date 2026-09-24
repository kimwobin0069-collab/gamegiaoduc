@echo off
title Gameshow Hoc Tap - THPT Le Thi Hong Gam
color 0B

echo ========================================================
echo       HE THONG TRO CHOI HOC TAP LOP HOC (GAMESHOW)
echo ========================================================
echo.
echo Dang kiem tra moi truong Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js tren may tinh!
    echo Vui long cai dat Node.js tu https://nodejs.org/
    pause
    exit /b
)

echo Dang khoi dong may chu Gameshow...
start http://localhost:3000/login
npm start
pause
