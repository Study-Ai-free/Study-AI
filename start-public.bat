@echo off
echo 🚀 Creating PUBLIC access to StudyAI Platform...
echo.
echo Starting localtunnel for frontend (port 3000)...
start "StudyAI Frontend - Public Access" cmd /k "npx localtunnel --port 3000 --subdomain studyai-frontend"

timeout /t 2 /nobreak >nul

echo Starting localtunnel for backend (port 3001)...  
start "StudyAI Backend - Public Access" cmd /k "npx localtunnel --port 3001 --subdomain studyai-backend"

echo.
echo ✅ PUBLIC TUNNELS CREATED!
echo.
echo 🌍 Your StudyAI Platform is now accessible WORLDWIDE at:
echo 👉 Frontend: https://studyai-frontend.loca.lt
echo 👉 Backend:  https://studyai-backend.loca.lt
echo.
echo 🎉 Share the frontend URL with anyone around the world!
echo.
echo Press any key to continue...
pause >nul