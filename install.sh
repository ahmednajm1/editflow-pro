#!/bin/bash
set -e

# ─── Config ───────────────────────────────────────────────────────────────────
EFP_VERSION="v16"
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
[[ -f "$EFP_DEST/bin/whisper-cli" ]] && chmod +x "$EFP_DEST/bin/whisper-cli"
[[ -d "$EFP_DEST/bin/lib"         ]] && chmod +x "$EFP_DEST/bin/lib/"*.dylib 2>/dev/null || true
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

if curl -fL --progress-bar "${EFP_AI_BASE}/caption_renderer" -o "$EFP_DATA_DIR/caption_renderer" 2>/dev/null; then
  chmod +x "$EFP_DATA_DIR/caption_renderer"
  xattr -d com.apple.quarantine "$EFP_DATA_DIR/caption_renderer" 2>/dev/null || true
  ok "Caption renderer installed"
else
  warn "Caption renderer download failed — animated captions (MOV mode) unavailable"
fi

# whisper_runner needs whisper-cli alongside it in the same directory
if [[ -f "$EFP_DEST/bin/whisper-cli" ]]; then
  cp "$EFP_DEST/bin/whisper-cli" "$EFP_DATA_DIR/"
  chmod +x "$EFP_DATA_DIR/whisper-cli"
  xattr -d com.apple.quarantine "$EFP_DATA_DIR/whisper-cli" 2>/dev/null || true
  if [[ -d "$EFP_DEST/bin/lib" ]]; then
    mkdir -p "$EFP_DATA_DIR/lib"
    cp "$EFP_DEST/bin/lib/"*.dylib "$EFP_DATA_DIR/lib/" 2>/dev/null || true
    xattr -dr com.apple.quarantine "$EFP_DATA_DIR/lib" 2>/dev/null || true
  fi
  ok "whisper-cli engine ready"
fi

# ─── GGML backend plugins (shared, system-wide writable location) ──────────────
# libggml.0.dylib hardcodes /Users/Shared/EditFlowPro/lib for plugin search.
# Install BLAS/Metal/CPU backends + libomp + libggml-base there.
SHARED_LIB="/Users/Shared/EditFlowPro/lib"
mkdir -p "$SHARED_LIB"
TMP_PLUGINS="$(mktemp /tmp/efp_plugins_XXXXXX.tar.gz)"
if curl -fL --progress-bar "${EFP_AI_BASE}/ggml_plugins.tar.gz" -o "$TMP_PLUGINS"; then
  tar xzf "$TMP_PLUGINS" -C "$SHARED_LIB"
  rm -f "$TMP_PLUGINS"
  xattr -dr com.apple.quarantine "$SHARED_LIB" 2>/dev/null || true
  chmod -R a+rX "$SHARED_LIB"         # readable by ALL users
  chmod a+x "$SHARED_LIB"/*.so 2>/dev/null || true  # dlopen needs +x on .so
  ok "GGML backends installed"
else
  warn "GGML backend download failed — AI Captions may fail"
fi

# ─── Intel Mac: warn about whisper-cli ────────────────────────────────────────
if [[ "$ARCH" == "x86_64" ]]; then
  warn "Intel Mac detected — AI Captions requires whisper-cpp:"
  warn "Run:  brew install whisper-cpp ffmpeg"
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
