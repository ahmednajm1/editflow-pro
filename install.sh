#!/bin/bash
set -e

# ─── Config ───────────────────────────────────────────────────────────────────
EFP_VERSION="v1.3.32"
EFP_ZIP_URL="https://github.com/ahmednajm1/editflow-pro/releases/latest/download/EditFlowPro.zip"
CEP_PATH="$HOME/Library/Application Support/Adobe/CEP/extensions"
EFP_DEST="$CEP_PATH/EditFlowPro"

# ─── Colors ───────────────────────────────────────────────────────────────────
R='\033[0;31m' G='\033[0;32m' B='\033[0;34m' Y='\033[1;33m'
BOLD='\033[1m' NC='\033[0m'

step()  { echo -e "\n${B}▶  $1${NC}"; }
ok()    { echo -e "${G}✓  $1${NC}"; }
warn()  { echo -e "${Y}⚠  $1${NC}"; }
die()   { echo -e "\n${R}✗  $1${NC}\n"; exit 1; }

# ─── Header ───────────────────────────────────────────────────────────────────
clear
echo -e "${BOLD}"
echo "  ┌─────────────────────────────────────┐"
echo "  │       EditFlow Pro  •  $EFP_VERSION         │"
echo "  │          by Najm Media              │"
echo "  └─────────────────────────────────────┘"
echo -e "${NC}"

# ─── macOS check ──────────────────────────────────────────────────────────────
[[ "$(uname)" == "Darwin" ]] || die "This installer is for macOS only."

ARCH="$(uname -m)"   # arm64 or x86_64

# ─── Download ─────────────────────────────────────────────────────────────────
step "Downloading EditFlow Pro $EFP_VERSION..."
TMP_ZIP="$(mktemp /tmp/efp_XXXXXX.zip)"
curl -fL --progress-bar "$EFP_ZIP_URL" -o "$TMP_ZIP" \
  || die "Download failed. Check your internet connection and try again."
ok "Download complete"

# ─── Install ──────────────────────────────────────────────────────────────────
step "Installing extension..."
mkdir -p "$CEP_PATH"
rm -rf "$EFP_DEST"
unzip -q "$TMP_ZIP" -d "$CEP_PATH"
rm -f "$TMP_ZIP"
ok "Extension files installed"

# ─── Permissions & quarantine ─────────────────────────────────────────────────
step "Configuring permissions..."
xattr -dr com.apple.quarantine "$EFP_DEST" 2>/dev/null || true
chmod -R u+rX "$EFP_DEST"
ok "Permissions set"

# ─── AI Caption Engine (standalone binaries — persistent location) ─────────────
# Binaries are installed to a persistent directory that survives extension updates.
EFP_AI_BASE="https://github.com/ahmednajm1/editflow-pro/releases/latest/download"
EFP_DATA_DIR="$HOME/Library/Application Support/EditFlowPro"
mkdir -p "$EFP_DATA_DIR"

step "Downloading AI Caption Engine..."
if curl -fL --progress-bar "${EFP_AI_BASE}/whisper_runner" -o "$EFP_DATA_DIR/whisper_runner" 2>/dev/null; then
  chmod +x "$EFP_DATA_DIR/whisper_runner"
  xattr -d com.apple.quarantine "$EFP_DATA_DIR/whisper_runner" 2>/dev/null || true
  ok "AI transcription engine installed"
else
  warn "AI engine download failed — open Premiere and follow the in-panel download prompt"
fi

# ─── Adobe PlayerDebugMode ────────────────────────────────────────────────────
step "Enabling extension in Adobe Premiere Pro..."
for v in 9 10 11 12; do
  defaults write com.adobe.CSXS.$v PlayerDebugMode 1
done
ok "Extension enabled for all Premiere versions (CEP 9–12)"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}${BOLD}"
echo "  ┌─────────────────────────────────────┐"
echo "  │   EditFlow Pro installed!  ✓        │"
echo "  └─────────────────────────────────────┘"
echo -e "${NC}"
echo -e "  ${BOLD}Next:${NC} Restart Adobe Premiere Pro"
echo -e "  Then: ${BOLD}Window → Extensions → EditFlow Pro${NC}"
echo ""
