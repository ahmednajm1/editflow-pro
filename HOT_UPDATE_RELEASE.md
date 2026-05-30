# EditFlow Pro — Hot-Update Release Runbook

How to ship an **instant fast-update (hot-update)** to all installed panels
(macOS + Windows) **without users reinstalling**. Follow this exactly. It
corrects an earlier, inaccurate description that pointed at a stale v17 backup.

---

## 0. Source of truth (read before editing anything)

- **The real, editable, unobfuscated source of `main.js` is the git-tracked
  file**: `client/js/main.js`.
  - If it looks obfuscated (starts with `var a0_0x...`, ~320 KB), it was
    overwritten (e.g. by extracting `client.zip` over it). Restore it:
    ```bash
    git restore client/js/main.js
    ```
    The readable source is ~135 KB and has `var CURRENT_VERSION = "1.3.20";`
    around **line 11**.
- **Do NOT use** `EditFlowPro_BACKUP_v17_pre_cleanup/` — it is an old **v17**
  copy, has **no `CURRENT_VERSION`**, and is **un-gated**. Building from it
  rolls the tool back ~20 versions and removes the license gate.
- `client/`, `jsx/`, `sfx/` are **shared** across macOS, Windows, and the
  hot-update zip. One edit propagates to all three on build.

## The license gate (must always survive)

The Lemon Squeezy gate is pure `client/` code, in **three** places — all must
stay present and committed:

1. `client/js/license.js` — the gate engine.
2. `client/index.html` — loads it: `<script src="js/license.js?v=NN"></script>`,
   plus `css/style.css?v=NN`, the `proBadge` element, and the `licenseOverlay`
   div.
3. `client/css/style.css` — the gate CSS (`.license-overlay`, `.license-card`,
   `.license-btn`, etc.).

The gate only blocks users **without** an active license. Activated users
(including test-mode keys) are unaffected.

---

## 1. Release steps (instant hot-update, no reinstall)

1. **Edit** the readable `client/js/main.js` (and any other `client/` files) for
   your change.
2. **Bump the version in TWO places to the SAME number** (example: `1.3.21`):
   - `client/js/main.js` ~line 11: `var CURRENT_VERSION = "1.3.21";`
   - `version.json` (project root): `"version": "1.3.21"`
3. **Build** (these obfuscate `main.js` automatically; the gate is preserved
   because it lives in separate files):
   - macOS:   `./build_pkg.sh`   → `EditFlow Pro Installer.pkg` + `EditFlowPro.zip`
   - Windows: `./build_win_exe.sh` → `EditFlow Pro Installer.exe`
   - macOS note: this Mac's Homebrew `makensis` has a broken unicode stub. If
     `build_win_exe.sh` crashes with `std::bad_alloc`, add `Unicode false` near
     the top of `installer.nsi` and rebuild. (A native Windows build does not
     hit this.)
4. **Verify the build still has the gate** before deploying:
   ```bash
   unzip -p EditFlowPro.zip "client/index.html" | grep -c license.js   # must be 1
   unzip -l EditFlowPro.zip | grep -c client/js/license.js             # must be 1
   ```
   And that `main.js` inside the zip carries the new `CURRENT_VERSION`.
5. **Deploy** — copy these four files to the website's public folder:
   `EditFlow Pro Installer.pkg`, `EditFlow Pro Installer.exe`,
   `EditFlowPro.zip`, `version.json`
   → `/Users/ahmed/Desktop/My Code Projects/najmedia-website/public/editflow/`
6. **Commit + push** the `najmedia-website` repo (branch `main`). Vercel
   auto-deploys. (Allow ~1–2 min; the CDN serves the new file once redeployed.)
7. **Result:** each installed panel sees `version.json` ≠ its `CURRENT_VERSION`,
   downloads `EditFlowPro.zip`, applies it in place (no reinstall), and the
   version badge updates to the new number.

---

## 2. CRITICAL safeguards (these are how things break)

- **`version.json` MUST equal `CURRENT_VERSION` exactly.** If `version.json` is
  higher than the number actually shipped inside the zip, every panel re-downloads
  forever → **infinite update loop**.
- **The hot-update `EditFlowPro.zip` MUST be gated.** It replaces each user's
  `client/`. An un-gated zip strips the license gate from everyone on the next
  update and re-opens free access.
- **Never `git restore` / `git checkout` the gate files carelessly**
  (`style.css`, `index.html`, `license.js`) — that wipes the gate. Keep them
  committed.
- **The `pkg`/`exe`/`zip` are all built from the same `client/`.** Verify the
  gate in the build output every release; do not assume.

---

## 3. Quick reference — paths

| Thing | Path |
|---|---|
| Project root | `/Users/ahmed/Downloads/Remotion/EditFlowPro/` |
| Editable source main.js | `client/js/main.js` (git-tracked, readable) |
| Version constant | `client/js/main.js` ~line 11 + `version.json` |
| macOS build | `./build_pkg.sh` |
| Windows build | `./build_win_exe.sh` |
| Website deploy folder | `/Users/ahmed/Desktop/My Code Projects/najmedia-website/public/editflow/` |
| Live version feed | `https://www.najmedia.com/editflow/version.json` |
