#!/bin/bash
# ZXP Build Script for EditFlow Pro
# Requires Adobe ZXPSignCmd to be installed and available in PATH or same directory.

PLUGIN_NAME="EditFlowPro"
VERSION="1.1.0"
OUTPUT_FILE="${PLUGIN_NAME}_v${VERSION}.zxp"
CERT_FILE="certificate.p12"
CERT_PASS="editflow123"

echo "==================================="
echo "  Packaging $PLUGIN_NAME v$VERSION  "
echo "==================================="

# 1. Check for ZXPSignCmd
if ! command -v ZXPSignCmd &> /dev/null
then
    echo "[ERROR] ZXPSignCmd could not be found."
    echo "Please download it from https://github.com/Adobe-CEP/CEP-Resources"
    exit 1
fi

# 2. Automatically generate a self-signed certificate if not present
if [ ! -f "$CERT_FILE" ]; then
    echo "[INFO] Certificate not found. Generating $CERT_FILE..."
    ZXPSignCmd -selfSignedCert US NY "$PLUGIN_NAME" "$PLUGIN_NAME" "$CERT_PASS" "$CERT_FILE"
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to generate certificate."
        exit 1
    fi
fi

# 3. Clean previous builds
if [ -f "$OUTPUT_FILE" ]; then
    echo "[INFO] Removing old build..."
    rm "$OUTPUT_FILE"
fi

# 4. Package ZXP
echo "[INFO] Signing and building ZXP format..."
ZXPSignCmd -sign . "$OUTPUT_FILE" "$CERT_FILE" "$CERT_PASS" -tsa https://timestamp.geotrust.com/tsa

if [ $? -eq 0 ]; then
    echo "[SUCCESS] Build Complete: $OUTPUT_FILE"
else
    echo "[ERROR] Build Failed."
fi
