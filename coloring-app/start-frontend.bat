@echo off
echo ============================================
echo    Coloring Book Creator - Frontend Server
echo ============================================
echo.
echo Starting Vite development server...
echo This will open your browser automatically.
echo.
echo Frontend will be available at:
echo   http://localhost:5173/
echo.
echo Press Ctrl+C to stop the server
echo ============================================
echo.

REM Change to the project directory
cd /d "%~dp0"

REM Start the Vite development server
npm run dev

REM Keep the window open if there's an error
if errorlevel 1 (
    echo.
    echo ============================================
    echo ERROR: Failed to start the server
    echo ============================================
    echo Make sure you have installed dependencies:
    echo   npm install
    echo.
    pause
)