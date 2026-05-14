#!/bin/bash
# EditFlow Pro — Installer
# Double-click to install. No Terminal knowledge needed.

# ── Keep Terminal open on any error ───────────────────────────────────────────
trap 'echo ""; echo "  ✗ Something went wrong."; echo "  Contact support: najmmediaa@gmail.com"; echo ""; read -p "  Press Enter to close..." _; exit 1' ERR

# ── Colors ────────────────────────────────────────────────────────────────────
BOLD='\033[1m'; G='\033[0;32m'; B='\033[0;34m'; Y='\033[1;33m'; R='\033[0;31m'; NC='\033[0m'

clear
echo ""
echo -e "${BOLD}  ╔═══════════════════════════════════════╗"
echo    "  ║       EditFlow Pro  ·  v17            ║"
echo    "  ║           by Najm Media               ║"
echo -e "  ╚═══════════════════════════════════════╝${NC}"
echo ""

# ── macOS only ────────────────────────────────────────────────────────────────
[[ "$(uname)" == "Darwin" ]] || { echo "  This installer is for macOS only."; read -p "  Press Enter..." _; exit 1; }

# ── Paths ─────────────────────────────────────────────────────────────────────
CEP_PATH="$HOME/Library/Application Support/Adobe/CEP/extensions"
EFP_DEST="$CEP_PATH/EditFlowPro"
EFP_DATA="$HOME/Library/Application Support/EditFlowPro"
BASE_URL="https://github.com/ahmednajm1/editflow-pro/releases/latest/download"

# ── Internet check ────────────────────────────────────────────────────────────
echo -e "  ${B}▶  Checking internet connection...${NC}"
curl -fsS --max-time 5 https://github.com >/dev/null 2>&1 \
  || { echo -e "  ${R}✗  No internet. Please connect and try again.${NC}"; read -p "  Press Enter..." _; exit 1; }
echo -e "  ${G}✓  Connected${NC}"

# ── Download extension ────────────────────────────────────────────────────────
echo ""
echo -e "  ${B}▶  Downloading EditFlow Pro...${NC}"
TMP_ZIP="$(mktemp /tmp/efp_XXXXXX.zip)"
curl -fL --progress-bar "${BASE_URL}/EditFlowPro.zip" -o "$TMP_ZIP"
echo -e "  ${G}✓  Download complete${NC}"

# ── Install extension ─────────────────────────────────────────────────────────
echo ""
echo -e "  ${B}▶  Installing extension...${NC}"
mkdir -p "$CEP_PATH"
rm -rf "$EFP_DEST"
unzip -q "$TMP_ZIP" -d "$CEP_PATH"
rm -f "$TMP_ZIP"
echo -e "  ${G}✓  Extension installed${NC}"

# ── Remove quarantine ─────────────────────────────────────────────────────────
xattr -dr com.apple.quarantine "$EFP_DEST" 2>/dev/null || true
chmod -R u+rX "$EFP_DEST"

# ── Download AI Caption Engine (persistent — survives extension updates) ───────
echo ""
echo -e "  ${B}▶  Downloading AI Caption Engine (~25 MB)...${NC}"
mkdir -p "$EFP_DATA"

if curl -fL --progress-bar "${BASE_URL}/whisper_runner" -o "$EFP_DATA/whisper_runner"; then
  chmod +x "$EFP_DATA/whisper_runner"
  xattr -d com.apple.quarantine "$EFP_DATA/whisper_runner" 2>/dev/null || true
  echo -e "  ${G}✓  AI engine installed${NC}"
else
  echo -e "  ${Y}⚠  AI engine download failed — download it later from inside the panel${NC}"
fi

# ── Enable in Adobe Premiere ──────────────────────────────────────────────────
echo ""
echo -e "  ${B}▶  Enabling in Adobe Premiere Pro...${NC}"
for v in 9 10 11 12; do
  defaults write com.adobe.CSXS.$v PlayerDebugMode 1
done
echo -e "  ${G}✓  Enabled for all Premiere versions${NC}"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}${BOLD}"
echo    "  ╔═══════════════════════════════════════╗"
echo    "  ║   Installation complete!  ✓           ║"
echo    "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"
echo    "  Next:"
echo    "  1. Open Adobe Premiere Pro"
echo    "  2. Window → Extensions → EditFlow Pro"
echo    ""
read -p "  Press Enter to close this window..." _
