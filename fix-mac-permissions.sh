#!/bin/bash
# ── ONLYCLICK: macOS Permission Fixer ──────────────────────────
# Jalankan script ini jika yt-dlp masih "Network Error" di Settings
# Usage: bash fix-mac-permissions.sh

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$APP_DIR/backend/bin"

echo "ONLYCLICK - macOS Permission Fixer"
echo "==================================="
echo ""

echo "Removing quarantine from all binaries..."
sudo xattr -rd com.apple.quarantine "$BIN_DIR" 2>/dev/null && echo "  ✓ sudo xattr done" || \
     xattr -rd com.apple.quarantine "$BIN_DIR" 2>/dev/null && echo "  ✓ xattr done" || \
     echo "  ⚠ xattr had issues (may need sudo password)"

echo ""
echo "Setting execute permissions..."
chmod +x "$BIN_DIR"/* 2>/dev/null && echo "  ✓ chmod done"

echo ""
echo "Ad-hoc codesigning..."
for f in "$BIN_DIR"/*; do
    [ -f "$f" ] && codesign --force --sign - "$f" 2>/dev/null && echo "  ✓ Signed: $(basename $f)"
done

echo ""
echo "Testing yt-dlp..."
if "$BIN_DIR/yt-dlp" --version 2>/dev/null; then
    echo "✓ yt-dlp works!"
else
    echo "✗ yt-dlp still blocked."
    echo ""
    echo "Manual fix:"
    echo "  1. Open System Settings → Privacy & Security"
    echo "  2. Scroll down and look for blocked items"
    echo "  3. Click 'Allow Anyway' next to yt-dlp"
    echo "  OR run: sudo spctl --master-disable (temporarily disable Gatekeeper)"
fi
echo ""
echo "Done. Restart ONLYCLICK now."
