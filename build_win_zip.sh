#!/bin/bash
# ============================================================
# Windows ZIP Package Builder for EditFlow Pro
# Creates a clean distribution ZIP containing the extension and the .bat installer.
# ============================================================
set -e
cd "$(dirname "$0")"

echo "Building EditFlow Pro Windows Distribution Package..."

# Clean up temp build folder
rm -rf build_win
mkdir -p build_win/EditFlowPro

# Copy extension files to clean subfolder
cp -R client build_win/EditFlowPro/
cp -R jsx build_win/EditFlowPro/
cp -R sfx build_win/EditFlowPro/
cp -R CSXS build_win/EditFlowPro/
cp -R bin build_win/EditFlowPro/ || true
cp package.json build_win/EditFlowPro/ || true
cp README.md build_win/EditFlowPro/ || true

# Remove Mac-specific files and DS_Store files
find build_win -name ".DS_Store" -delete
rm -rf build_win/EditFlowPro/bin/.build_*

# ── Obfuscate main.js (protection layer) ──────────────────────────
OBFUSCATOR="/Users/ahmed/.gemini/antigravity/scratch/node_modules/.bin/javascript-obfuscator"
OBF_CONFIG="$(dirname "$0")/obfuscator.config.json"
MAIN_JS="build_win/EditFlowPro/client/js/main.js"

if [ -f "$OBFUSCATOR" ] && [ -f "$OBF_CONFIG" ] && [ -f "$MAIN_JS" ]; then
    echo "🔒 Obfuscating main.js..."
    "$OBFUSCATOR" "$MAIN_JS" --output "$MAIN_JS" --config "$OBF_CONFIG"
    echo "✅ Code protection applied"
else
    echo "⚠️  Skipping obfuscation (obfuscator or config not found)"
fi


# Copy Windows installer script and installation guide to the root of the ZIP
cp "Install EditFlow Pro.bat" build_win/
cat << 'EOF' > build_win/HOW_TO_INSTALL.txt
EditFlow Pro — Windows Installation Guide
========================================

STEP 1 — Extract the ZIP
Extract/Unzip this downloaded file ("EditFlow Pro Installer.zip") fully.
Do NOT run the installer directly from inside the ZIP file.

STEP 2 — Run the Installer
Double-click "Install EditFlow Pro.bat".
If Windows SmartScreen blocks it (since it's a batch script), click "More info" and then "Run anyway".

STEP 3 — Restart Premiere Pro
Close and reopen Adobe Premiere Pro.

STEP 4 — Open the panel
Go to: Window -> Extensions -> EditFlow Pro

----------------------------------------
SUPPORT: najmediaa@gmail.com
EOF

# Package it into a single ZIP file for Windows distribution
OUTPUT_ZIP="EditFlow Pro Installer.zip"
rm -f "$OUTPUT_ZIP"
(cd build_win && zip -q -r "../$OUTPUT_ZIP" .)

rm -rf build_win
echo "Done! Created $OUTPUT_ZIP for Windows users."
