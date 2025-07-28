@echo off
title Environment Variables Debug
echo ============================================
echo    Debugging Environment Variables
echo ============================================
echo.

cd /d "%~dp0"

echo Checking .env file contents...
echo.
if exist .env (
    echo .env file exists
    echo.
    echo OPENAI_API_KEY line:
    findstr "OPENAI_API_KEY" .env
    echo.
    echo NODE_ENV line:
    findstr "NODE_ENV" .env
) else (
    echo .env file NOT found!
)

echo.
echo Creating test script to check what Node.js sees...

echo require('dotenv').config(); > test-env.js
echo console.log('=== Environment Check ==='); >> test-env.js
echo console.log('NODE_ENV:', process.env.NODE_ENV); >> test-env.js
echo console.log('PORT:', process.env.PORT); >> test-env.js
echo console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY); >> test-env.js
echo console.log('OPENAI_API_KEY starts with sk-proj:', process.env.OPENAI_API_KEY?.startsWith('sk-proj')); >> test-env.js
echo console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length); >> test-env.js
echo console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID); >> test-env.js
echo console.log('VITE_FIREBASE_API_KEY exists:', !!process.env.VITE_FIREBASE_API_KEY); >> test-env.js

echo.
echo Running Node.js environment test...
node test-env.js

echo.
echo Cleaning up...
del test-env.js

echo.
echo ============================================
pause