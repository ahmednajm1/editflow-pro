#!/bin/bash
# ============================================================
# Windows EXE Package Builder for EditFlow Pro
# Creates a professional single-file installer .exe using NSIS.
# ============================================================
set -e
cd "$(dirname "$0")"

echo "Building EditFlow Pro Windows EXE Installer..."

# Clean up temp folders
rm -rf build_win_tmp
mkdir -p build_win_tmp/EditFlowPro

# Copy extension files to clean subfolder
cp -R client build_win_tmp/EditFlowPro/
cp -R jsx build_win_tmp/EditFlowPro/
cp -R sfx build_win_tmp/EditFlowPro/
cp -R CSXS build_win_tmp/EditFlowPro/
cp -R bin build_win_tmp/EditFlowPro/ || true
cp package.json build_win_tmp/EditFlowPro/ || true
cp README.md build_win_tmp/EditFlowPro/ || true

# Remove Mac-specific files and DS_Store files
find build_win_tmp -name ".DS_Store" -delete
rm -rf build_win_tmp/EditFlowPro/bin/.build_*

# ── Obfuscate main.js (protection layer) ──────────────────────────
OBFUSCATOR="/Users/ahmed/.gemini/antigravity/scratch/node_modules/.bin/javascript-obfuscator"
OBF_CONFIG="$(dirname "$0")/obfuscator.config.json"
MAIN_JS="build_win_tmp/EditFlowPro/client/js/main.js"

if [ -f "$OBFUSCATOR" ] && [ -f "$OBF_CONFIG" ] && [ -f "$MAIN_JS" ]; then
    echo "🔒 Obfuscating main.js..."
    "$OBFUSCATOR" "$MAIN_JS" --output "$MAIN_JS" --config "$OBF_CONFIG"
    echo "✅ Code protection applied"
else
    echo "⚠️  Skipping obfuscation (obfuscator or config not found)"
fi

# Run NSIS compiler to generate the EXE
echo "🏗️  Compiling EXE Installer via NSIS..."
makensis installer.nsi

# Clean up temp build folder
rm -rf build_win_tmp

echo "Done! Created EditFlow Pro Installer.exe for Windows users."
