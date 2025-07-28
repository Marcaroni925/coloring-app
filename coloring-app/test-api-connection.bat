@echo off
title API Connection Test
echo ============================================
echo    Testing API Connection
echo ============================================
echo.

cd /d "%~dp0"

echo Testing if backend server is running...
echo.

echo Checking port 3001...
netstat -an | findstr :3001
if errorlevel 1 (
    echo ✗ Backend server is NOT running on port 3001
    echo Please start the backend first with start-backend-debug.bat
) else (
    echo ✓ Something is listening on port 3001
)

echo.
echo Testing API endpoint...
echo Making a simple request to http://localhost:3001
echo.

curl -s http://localhost:3001 2>nul
if errorlevel 1 (
    echo ✗ Could not connect to backend API
    echo Make sure the backend server is running
) else (
    echo ✓ Backend API responded
)

echo.
echo Testing health check...
curl -s http://localhost:3001/api/health 2>nul
echo.

echo Testing auth endpoint...
curl -X POST http://localhost:3001/api/auth/save-image -H "Content-Type: application/json" -d "{}" 2>nul
echo.

echo.
echo ============================================
echo Test completed
pause