@echo off
echo ============================================
echo    Coloring Book Creator - Full Application
echo ============================================
echo.
echo This will start both frontend and backend servers
echo in separate windows.
echo.
echo Frontend: http://localhost:5173/
echo Backend:  http://localhost:3001/
echo.
echo ============================================
echo.

REM Change to the project directory
cd /d "%~dp0"

echo Stopping any existing servers first...
call stop-servers.bat

echo Starting backend server...
start "Coloring Book Backend" cmd /k "npm run server"

echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak > nul

echo Starting frontend server...
start "Coloring Book Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo Both servers are starting!
echo.
echo Frontend: http://localhost:5173/
echo Backend:  http://localhost:3001/
echo.
echo Two command windows should have opened.
echo Close this window or press any key to continue.
echo ============================================
pause