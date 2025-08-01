@echo off
REM 🚀 EC2 Deployment Platform - Quick Start Script (Windows)
REM This script helps you serve the frontend locally for testing

echo 🚀 EC2 Deployment Platform - Quick Start
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "index.html" (
    echo ❌ Error: index.html not found. Please run this script from the platform directory.
    pause
    exit /b 1
)

echo ✅ Found platform files
echo.

REM Try to start a local server
echo 🌐 Starting local web server...

REM Check for Python 3
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 📦 Using Python HTTP server on port 8000
    echo 🔗 Open your browser to: http://localhost:8000
    echo 🛑 Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
    goto :end
)

REM Check for Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    npx --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo 📦 Using Node.js HTTP server on port 8000
        echo 🔗 Open your browser to: http://localhost:8000
        echo 🛑 Press Ctrl+C to stop the server
        echo.
        npx http-server -p 8000
        goto :end
    )
)

REM No suitable server found
echo ❌ No suitable HTTP server found.
echo 💡 Please install one of the following:
echo    - Python 3: https://www.python.org/downloads/
echo    - Node.js: https://nodejs.org/
echo.
echo 🌐 Alternatively, you can:
echo    - Open index.html directly in your browser (limited functionality)
echo    - Deploy to GitHub Pages, Netlify, or Vercel
echo.
pause

:end
