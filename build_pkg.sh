#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "Building One Panel Installer..."

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

# The folder name stays EditFlowPro on purpose. CEP identifies an extension
# by the ExtensionBundleId in its manifest, not by the folder, so keeping the
# path means an existing install upgrades in place instead of appearing twice
# in Premiere alongside the old one. Users never see this path.
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

# Create OnePanel.zip for Hot-Updates
echo "📦 Packaging OnePanel.zip for Hot-Updates..."
rm -f OnePanel.zip
(cd build_installer/root && zip -q -r ../../OnePanel.zip .)

# Build the PKG
pkgbuild --root build_installer/root \
         --identifier com.najmmedia.editflowpro \
         --version 17.0 \
         --scripts build_installer/scripts \
         --install-location "/Library/Application Support/Adobe/CEP/extensions/EditFlowPro" \
         "One Panel Installer.pkg"

rm -rf build_installer
echo "Done! Created One Panel Installer.pkg and OnePanel.zip"
