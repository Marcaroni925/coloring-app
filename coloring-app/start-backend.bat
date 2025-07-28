@echo off
echo ============================================
echo    Coloring Book Creator - Backend Server
echo ============================================
echo.
echo Starting Node.js backend server...
echo.
echo Backend API will be available at:
echo   http://localhost:3001/
echo.
echo Features enabled:
echo   - OpenAI DALL-E API Integration  
echo   - Firebase Authentication
echo   - Image Gallery Storage
echo   - Prompt Refinement Service
echo.
echo Press Ctrl+C to stop the server
echo ============================================
echo.

REM Change to the project directory
cd /d "%~dp0"

REM Start the backend server
npm run server

REM Keep the window open if there's an error
if errorlevel 1 (
    echo.
    echo ============================================
    echo ERROR: Failed to start the backend server
    echo ============================================
    echo Make sure you have installed dependencies:
    echo   npm install
    echo.
    echo Check your .env file has:
    echo   - OPENAI_API_KEY=your-api-key
    echo   - Firebase configuration
    echo.
    pause
)