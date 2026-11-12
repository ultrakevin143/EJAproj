@echo off
echo ========================================================
echo   FitQuality DQM - Gym Member Health Screening System
echo   Next.js 14 + Express.js + PostgreSQL (Group 5)
echo ========================================================
echo.

echo Starting Express.js Backend on Port 3000...
start "FitQuality Backend (Port 3000)" cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Next.js 14 Frontend on Port 3001...
start "FitQuality Frontend (Port 3001)" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting!
echo Backend:  http://localhost:3000/api/health
echo Frontend: http://localhost:3001
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3001

