#!/bin/bash
cd "$(dirname "$0")"

echo "=========================================="
echo "  ONLYCLICK v1.9.1"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Please install from: https://nodejs.org/"
    exit 1
fi
echo "Node.js: $(node -v)"

# Install backend dependencies
echo ""
echo "[1/3] Installing backend dependencies..."
cd backend
npm install --quiet 2>/dev/null || npm install
if [ $? -ne 0 ]; then
    echo "WARNING: npm install had errors. Retrying with --force..."
    npm install --force
fi
cd ..

# Verify node_modules
if [ ! -d "backend/node_modules/express" ]; then
    echo "ERROR: Dependencies not installed. Please run: cd backend && npm install"
    read -p "Press Enter to exit..."
    exit 1
fi

# ── macOS Gatekeeper bypass (Ventura/Sonoma/Sequoia) ──────────────────────────
echo ""
echo "Clearing macOS quarantine from binaries..."

# Method 1: Remove quarantine attribute recursively
sudo xattr -rd com.apple.quarantine backend/bin 2>/dev/null || \
     xattr -rd com.apple.quarantine backend/bin 2>/dev/null || true

# Method 2: xattr -cr (clear all extended attrs)
xattr -cr backend/bin 2>/dev/null || true

# Method 3: Ad-hoc codesign each binary
if [ -d "backend/bin" ]; then
    for f in backend/bin/*; do
        if [ -f "$f" ]; then
            chmod +x "$f" 2>/dev/null
            codesign --force --deep --sign - "$f" 2>/dev/null || true
            # Also try spctl disable for this specific file
            spctl --add --label "ONLYCLICK" "$f" 2>/dev/null || true
        fi
    done
fi

# Method 4: Also clear quarantine from node_modules binaries
xattr -cr backend/node_modules/.bin 2>/dev/null || true

echo "Gatekeeper bypass complete."

# Run preflight (checks yt-dlp, ffmpeg, creates dirs)
echo ""
echo "[2/3] Running preflight checks..."
node backend/preflight.js

if [ $? -ne 0 ]; then
    echo ""
    echo "=========================================="
    echo "  Preflight failed. Manual fix:"
    echo "=========================================="
    echo ""
    echo "  Run this command, then restart:"
    echo "  sudo xattr -rd com.apple.quarantine $(pwd)/backend/bin"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Start server
echo ""
echo "[3/3] Starting ONLYCLICK..."
echo ""
echo "=========================================="
echo "  Open in browser: http://localhost:3002"
echo "  Press Ctrl+C to stop"
echo "=========================================="
echo ""

node backend/server.js
