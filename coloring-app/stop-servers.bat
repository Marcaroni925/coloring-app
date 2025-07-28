@echo off
echo ============================================
echo    Stopping All Coloring Book Servers
echo ============================================
echo.

echo Stopping Node.js processes on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1

echo Stopping Vite processes on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1

echo Stopping any Node.js processes with "server" or "vite" in command line...
taskkill /f /im node.exe /fi "WINDOWTITLE eq *server*" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq *vite*" >nul 2>&1

echo.
echo ============================================
echo All servers have been stopped!
echo You can now run start-app.bat safely.
echo ============================================
pause