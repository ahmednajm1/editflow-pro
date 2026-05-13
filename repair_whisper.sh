#!/bin/bash
# EditFlow Pro — Quick Repair Script
# Fixes: ggml_backend_load_best / whisper-cli backend error
# Run: bash <(curl -fsSL "https://github.com/ahmednajm1/editflow-pro/releases/latest/download/repair_whisper.sh")

BOLD='\033[1m'; G='\033[0;32m'; B='\033[0;34m'; R='\033[0;31m'; NC='\033[0m'

clear
echo -e "${BOLD}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   EditFlow Pro — Whisper Repair       ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

BASE_URL="https://github.com/ahmednajm1/editflow-pro/releases/latest/download"
EFP_DATA="$HOME/Library/Application Support/EditFlowPro"
CEP_BIN="$HOME/Library/Application Support/Adobe/CEP/extensions/EditFlowPro/bin"

mkdir -p "$EFP_DATA/lib"

# ── Step 1: Download new EditFlowPro.zip and extract whisper-cli + libs ────────
echo -e "  ${B}▶  Downloading new whisper engine...${NC}"
TMP_ZIP="$(mktemp /tmp/efp_repair_XXXXXX.zip)"
TMP_DIR="$(mktemp -d /tmp/efp_repair_XXXXXX)"

if ! curl -fL --progress-bar "$BASE_URL/EditFlowPro.zip" -o "$TMP_ZIP"; then
  echo -e "  ${R}✗  Download failed. Check internet connection.${NC}"
  exit 1
fi

unzip -q "$TMP_ZIP" -d "$TMP_DIR"
rm -f "$TMP_ZIP"

# Copy whisper-cli + libs to EFP_DATA
if [[ -f "$TMP_DIR/EditFlowPro/bin/whisper-cli" ]]; then
  cp "$TMP_DIR/EditFlowPro/bin/whisper-cli" "$EFP_DATA/whisper-cli"
  chmod +x "$EFP_DATA/whisper-cli"
  xattr -d com.apple.quarantine "$EFP_DATA/whisper-cli" 2>/dev/null || true

  # Also update CEP extension bin
  mkdir -p "$CEP_BIN"
  cp "$TMP_DIR/EditFlowPro/bin/whisper-cli" "$CEP_BIN/whisper-cli"
  chmod +x "$CEP_BIN/whisper-cli"
  xattr -d com.apple.quarantine "$CEP_BIN/whisper-cli" 2>/dev/null || true

  echo -e "  ${G}✓  whisper-cli updated${NC}"
else
  echo -e "  ${R}✗  whisper-cli not found in zip${NC}"
  exit 1
fi

# Copy libs
if [[ -d "$TMP_DIR/EditFlowPro/bin/lib" ]]; then
  rm -rf "$EFP_DATA/lib"
  mkdir -p "$EFP_DATA/lib"
  cp "$TMP_DIR/EditFlowPro/bin/lib/"*.dylib "$EFP_DATA/lib/"
  xattr -dr com.apple.quarantine "$EFP_DATA/lib" 2>/dev/null || true
  chmod -R a+rX "$EFP_DATA/lib"

  mkdir -p "$CEP_BIN/lib"
  rm -rf "$CEP_BIN/lib"
  mkdir -p "$CEP_BIN/lib"
  cp "$TMP_DIR/EditFlowPro/bin/lib/"*.dylib "$CEP_BIN/lib/"
  xattr -dr com.apple.quarantine "$CEP_BIN/lib" 2>/dev/null || true

  echo -e "  ${G}✓  Libraries updated${NC}"
fi

rm -rf "$TMP_DIR"

# ── Step 2: Download new whisper_runner ────────────────────────────────────────
echo -e "  ${B}▶  Downloading new AI engine...${NC}"
if curl -fL --progress-bar "$BASE_URL/whisper_runner" -o "$EFP_DATA/whisper_runner"; then
  chmod +x "$EFP_DATA/whisper_runner"
  xattr -d com.apple.quarantine "$EFP_DATA/whisper_runner" 2>/dev/null || true
  echo -e "  ${G}✓  AI engine updated${NC}"
fi

# ── Done ────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}${BOLD}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   Repair complete!  ✓                 ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"
echo "  Restart Adobe Premiere Pro and try AI Captions again."
echo ""
read -p "  Press Enter to close..." _
