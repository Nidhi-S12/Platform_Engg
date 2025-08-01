#!/bin/bash

# 🚀 EC2 Deployment Platform - Quick Start Script
# This script helps you serve the frontend locally for testing

echo "🚀 EC2 Deployment Platform - Quick Start"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the platform directory."
    exit 1
fi

echo "✅ Found platform files"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Try to start a local server
echo "🌐 Starting local web server..."

if command_exists python3; then
    echo "📦 Using Python 3 HTTP server on port 8000"
    echo "🔗 Open your browser to: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
elif command_exists python; then
    echo "📦 Using Python HTTP server on port 8000"
    echo "🔗 Open your browser to: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    python -m http.server 8000
elif command_exists node; then
    if command_exists npx; then
        echo "📦 Using Node.js HTTP server on port 8000"
        echo "🔗 Open your browser to: http://localhost:8000"
        echo "🛑 Press Ctrl+C to stop the server"
        echo ""
        npx http-server -p 8000
    else
        echo "❌ npx not found. Please install Node.js properly or use Python."
        exit 1
    fi
else
    echo "❌ No suitable HTTP server found."
    echo "💡 Please install one of the following:"
    echo "   - Python 3: sudo apt install python3 (Linux) or brew install python3 (Mac)"
    echo "   - Node.js: https://nodejs.org/"
    echo ""
    echo "🌐 Alternatively, you can:"
    echo "   - Open index.html directly in your browser (limited functionality)"
    echo "   - Deploy to GitHub Pages, Netlify, or Vercel"
    exit 1
fi
