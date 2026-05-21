#!/bin/bash
# ============================================================
# ZXP Build Script for EditFlow Pro
# Builds a ZXP package independently — does NOT affect PKG.
# Requires: ./ZXPSignCmd (included in project root)
# ============================================================

PLUGIN_NAME="EditFlowPro"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ZXPSIGN="$SCRIPT_DIR/ZXPSignCmd"

# Auto-read version from version.json
VERSION=$(python3 -c "import json; print(json.load(open('$SCRIPT_DIR/version.json'))['version'])" 2>/dev/null)
if [ -z "$VERSION" ]; then
    VERSION="1.0.0"
    echo "[WARN] Could not read version.json, defaulting to $VERSION"
fi

OUTPUT_FILE="$SCRIPT_DIR/EditFlow.Pro.v${VERSION}.zxp"
CERT_FILE="$SCRIPT_DIR/editflow_cert.p12"
CERT_PASS="editflow_zxp_2024"

# Temp dir to build a clean copy (excludes build artifacts & ZXPSignCmd itself)
BUILD_DIR="$SCRIPT_DIR/.zxp_build_tmp"

echo "==================================================="
echo "  EditFlow Pro ZXP Builder"
echo "  Version : $VERSION"
echo "  Output  : $OUTPUT_FILE"
echo "==================================================="

# 1. Check ZXPSignCmd
if [ ! -f "$ZXPSIGN" ]; then
    echo "[ERROR] ZXPSignCmd not found at: $ZXPSIGN"
    exit 1
fi
chmod +x "$ZXPSIGN"

# 2. Generate self-signed cert if not present
if [ ! -f "$CERT_FILE" ]; then
    echo "[INFO] Generating self-signed certificate..."
    "$ZXPSIGN" -selfSignedCert US CA "EditFlowPro" "EditFlow Pro" "$CERT_PASS" "$CERT_FILE"
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to generate certificate."
        exit 1
    fi
    echo "[OK] Certificate created: $CERT_FILE"
fi

# 3. Build clean temp copy (exclude dev-only files)
echo "[INFO] Preparing clean build directory..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

rsync -a "$SCRIPT_DIR/" "$BUILD_DIR/" \
    --exclude=".git" \
    --exclude=".gitignore" \
    --exclude=".DS_Store" \
    --exclude="*.sh" \
    --exclude="*.pkg" \
    --exclude="*.zxp" \
    --exclude="*.py" \
    --exclude="*.p12" \
    --exclude="*.md" \
    --exclude="*.txt" \
    --exclude="*.bat" \
    --exclude="ZXPSignCmd" \
    --exclude=".zxp_build_tmp" \
    --exclude=".build_venv" \
    --exclude=".build_venv_x86" \
    --exclude=".build_work" \
    --exclude=".build_spec" \
    --exclude="bin/.build_*" \
    --exclude="node_modules" \
    --exclude="ADOBE_EXCHANGE_AUDIT.md" \
    --exclude="USER_GUIDE.md" \
    --exclude="INSTALL.md" \
    --exclude="HOW TO INSTALL.txt" \
    --exclude="Install EditFlow Pro.bat" \
    --exclude="Install EditFlow Pro.command" \
    --exclude="install.sh"

# 4. Obfuscate main.js in temporary build directory (protection layer)
OBFUSCATOR="/Users/ahmed/.gemini/antigravity/scratch/node_modules/.bin/javascript-obfuscator"
OBF_CONFIG="$SCRIPT_DIR/obfuscator.config.json"
MAIN_JS="$BUILD_DIR/client/js/main.js"

if [ -f "$OBFUSCATOR" ] && [ -f "$OBF_CONFIG" ] && [ -f "$MAIN_JS" ]; then
    echo "[INFO] 🔒 Obfuscating main.js..."
    "$OBFUSCATOR" "$MAIN_JS" --output "$MAIN_JS" --config "$OBF_CONFIG"
    echo "[INFO] ✅ Code protection applied"
else
    echo "[WARN] ⚠️ Skipping obfuscation (obfuscator or config not found)"
fi

# 5. Remove old ZXP if exists
if [ -f "$OUTPUT_FILE" ]; then
    echo "[INFO] Removing old ZXP build..."
    rm "$OUTPUT_FILE"
fi

# 6. Sign and package ZXP
echo "[INFO] Signing and packaging ZXP..."
"$ZXPSIGN" -sign "$BUILD_DIR" "$OUTPUT_FILE" "$CERT_FILE" "$CERT_PASS"

STATUS=$?

# 7. Cleanup
rm -rf "$BUILD_DIR"

if [ $STATUS -eq 0 ]; then
    SIZE=$(du -sh "$OUTPUT_FILE" | cut -f1)
    echo ""
    echo "==================================================="
    echo "  ✅ ZXP Build Complete!"
    echo "  File : $(basename $OUTPUT_FILE)"
    echo "  Size : $SIZE"
    echo "  Install via: ZXP Installer (zxpinstaller.com)"
    echo "==================================================="
else
    echo ""
    echo "[ERROR] ZXP Build Failed (exit: $STATUS)"
    exit 1
fi
