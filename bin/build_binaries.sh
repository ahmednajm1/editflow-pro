#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  EditFlow Pro — AI Caption Engine Build Script
#  Builds two universal2 standalone binaries (Intel + Apple Silicon):
#    • whisper_runner   ← from transcriber.py
#    • caption_renderer ← from caption_renderer.py
#
#  Prerequisites (one-time):
#    pip3 install pyinstaller pillow arabic-reshaper python-bidi
#
#  Usage:
#    cd /path/to/EditFlowPro/bin
#    bash build_binaries.sh
#
#  Output goes to:  bin/dist/
#  Upload to GitHub Releases: whisper_runner  and  caption_renderer
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"

R='\033[0;31m' G='\033[0;32m' B='\033[0;34m' Y='\033[1;33m'
BOLD='\033[1m' NC='\033[0m'
step() { echo -e "\n${B}▶  $1${NC}"; }
ok()   { echo -e "${G}✓  $1${NC}"; }
die()  { echo -e "\n${R}✗  $1${NC}\n"; exit 1; }

# ── Require macOS ──────────────────────────────────────────────────────────────
[[ "$(uname)" == "Darwin" ]] || die "This script must run on macOS."

# ── Use the system universal2 Python (built-in, no install needed) ─────────────
PYTHON="/usr/bin/python3"
[[ -f "$PYTHON" ]] || die "System Python not found at $PYTHON"

PYTHON_ARCH=$("$PYTHON" -c "import platform; print(platform.machine())")
BINARY_TYPE=$(file "$PYTHON" | grep -o "universal binary" || echo "single-arch")
echo -e "\n  Python : $($PYTHON --version)"
echo    "  Binary : $(file "$PYTHON" | cut -d: -f2 | xargs)"
echo    "  Arch   : $PYTHON_ARCH"

# ── Venv setup ─────────────────────────────────────────────────────────────────
VENV_DIR="$SCRIPT_DIR/.build_venv"
step "Setting up build environment..."
if [[ ! -d "$VENV_DIR" ]]; then
    "$PYTHON" -m venv "$VENV_DIR"
    ok "Virtual environment created"
fi
source "$VENV_DIR/bin/activate"

# ── Install dependencies ───────────────────────────────────────────────────────
step "Installing build dependencies..."
pip install --quiet --upgrade pip
pip install --quiet pyinstaller
pip install --quiet pillow arabic-reshaper python-bidi
ok "Dependencies installed"
echo "  PyInstaller: $(pyinstaller --version)"

# ── Common PyInstaller flags ───────────────────────────────────────────────────
# --target-arch universal2 : output runs on both Intel and Apple Silicon
# --onefile               : single self-contained binary, no _MEIPASS folder
# --strip                 : reduce binary size
COMMON_FLAGS=(
    --onefile
    --strip
    --target-arch universal2
    --distpath "$DIST_DIR"
    --workpath "$SCRIPT_DIR/.build_work"
    --specpath "$SCRIPT_DIR/.build_spec"
    --noconfirm
    --clean
)

# ── Build whisper_runner (from transcriber.py) ─────────────────────────────────
step "Building whisper_runner (transcriber.py → standalone binary)..."
pyinstaller "${COMMON_FLAGS[@]}" \
    --name whisper_runner \
    "$SCRIPT_DIR/transcriber.py"
ok "whisper_runner built"

# ── Build caption_renderer (from caption_renderer.py) ─────────────────────────
step "Building caption_renderer (caption_renderer.py → standalone binary)..."
pyinstaller "${COMMON_FLAGS[@]}" \
    --name caption_renderer \
    --collect-all PIL \
    --hidden-import arabic_reshaper \
    --hidden-import bidi \
    --hidden-import bidi.algorithm \
    "$SCRIPT_DIR/caption_renderer.py"
ok "caption_renderer built"

# ── Verify and report ──────────────────────────────────────────────────────────
step "Verifying output..."
for BIN in whisper_runner caption_renderer; do
    BIN_PATH="$DIST_DIR/$BIN"
    if [[ -f "$BIN_PATH" ]]; then
        SIZE=$(du -sh "$BIN_PATH" | cut -f1)
        ARCH_INFO=$(file "$BIN_PATH" | grep -o "universal binary\|arm64\|x86_64" | head -1)
        echo -e "  ${G}✓${NC}  $BIN  ($SIZE · $ARCH_INFO)"
    else
        echo -e "  ${R}✗${NC}  $BIN — NOT FOUND"
    fi
done

deactivate

echo ""
echo -e "${G}${BOLD}"
echo "  ┌──────────────────────────────────────────────────────┐"
echo "  │   Build complete!                                    │"
echo "  │                                                      │"
echo "  │   Next steps:                                        │"
echo "  │   1. Go to GitHub → editflow-pro → Releases         │"
echo "  │   2. Create/edit release tag v16                    │"
echo "  │   3. Upload:  dist/whisper_runner                   │"
echo "  │              dist/caption_renderer                  │"
echo "  │   4. No need to touch the extension ZIP             │"
echo "  └──────────────────────────────────────────────────────┘"
echo -e "${NC}"
echo "  Binaries are at: $DIST_DIR/"
echo ""
