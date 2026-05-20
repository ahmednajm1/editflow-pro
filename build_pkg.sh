#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "Building EditFlow Pro Installer..."

# Clean up
rm -rf build_installer
mkdir -p build_installer/root
mkdir -p build_installer/scripts

# Copy extension files
cp -R client build_installer/root/
cp -R jsx build_installer/root/
cp -R sfx build_installer/root/
cp -R CSXS build_installer/root/
cp -R bin build_installer/root/ || true
cp *.py build_installer/root/ || true
cp .debug build_installer/root/ || true
cp package.json build_installer/root/ || true
cp README.md build_installer/root/ || true

# Remove unwanted files
find build_installer/root -name ".DS_Store" -delete
rm -rf build_installer/root/bin/.build_*

# ── Obfuscate main.js (protection layer) ──────────────────────────
OBFUSCATOR="/Users/ahmed/.gemini/antigravity/scratch/node_modules/.bin/javascript-obfuscator"
OBF_CONFIG="$(dirname "$0")/obfuscator.config.json"
MAIN_JS="build_installer/root/client/js/main.js"

if [ -f "$OBFUSCATOR" ] && [ -f "$OBF_CONFIG" ] && [ -f "$MAIN_JS" ]; then
    echo "🔒 Obfuscating main.js..."
    "$OBFUSCATOR" "$MAIN_JS" --output "$MAIN_JS" --config "$OBF_CONFIG"
    echo "✅ Code protection applied"
else
    echo "⚠️  Skipping obfuscation (obfuscator or config not found)"
fi

# Create postinstall script to enable PlayerDebugMode & set directory permissions
cat << 'EOF' > build_installer/scripts/postinstall
#!/bin/bash
echo "Enabling PlayerDebugMode for all Premiere Pro versions..."

# Define all possible CSXS versions
VERSIONS=(9 10 11 12 13 14 15 16)

# Global preferences
for v in "${VERSIONS[@]}"; do
    defaults write /Library/Preferences/com.adobe.CSXS.$v PlayerDebugMode 1 || true
done

# Current User preferences
USER=$(stat -f "%Su" /dev/console)
for v in "${VERSIONS[@]}"; do
    su - "$USER" -c "defaults write com.adobe.CSXS.$v PlayerDebugMode 1" || true
done

# Set permissions for self-updates
TARGET_DIR="/Library/Application Support/Adobe/CEP/extensions/EditFlowPro"
echo "Setting write permissions for self-updates at: $TARGET_DIR"
if [ -d "$TARGET_DIR" ]; then
    if [ -n "$USER" ] && [ "$USER" != "root" ]; then
        chown -R "$USER:staff" "$TARGET_DIR" || true
    fi
    chmod -R 777 "$TARGET_DIR" || true
fi

exit 0
EOF
chmod +x build_installer/scripts/postinstall

# Create EditFlowPro.zip for Hot-Updates
echo "📦 Packaging EditFlowPro.zip for Hot-Updates..."
rm -f EditFlowPro.zip
(cd build_installer/root && zip -q -r ../../EditFlowPro.zip .)

# Build the PKG
pkgbuild --root build_installer/root \
         --identifier com.najmmedia.editflowpro \
         --version 17.0 \
         --scripts build_installer/scripts \
         --install-location "/Library/Application Support/Adobe/CEP/extensions/EditFlowPro" \
         "EditFlow Pro Installer.pkg"

rm -rf build_installer
echo "Done! Created EditFlow Pro Installer.pkg and EditFlowPro.zip"
