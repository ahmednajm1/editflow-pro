# EditFlow Pro — Session Handoff (2026-08-22)

Paste this file's path to a new session:
`/Users/ahmed/Downloads/Remotion/EditFlowPro/HANDOFF.md`

---

## Git

| | |
|---|---|
| **Last commit** | `ba6f5f1` — Captions: language rule, 99-language support, cinematic Full Sentence, UI cleanup |
| Previous | `3b3f85b` — Import from Link + AI caption refinement |
| Before that | `843952d` — Release 1.3.30 |

Everything from this session is committed. Working tree clean apart from
PyInstaller build scratch under `bin/.build_*`.

**Version is deliberately pinned at 1.3.30** (local `CURRENT_VERSION`, local
`version.json`, and the live server all read 1.3.30). Do **not** bump it while
developing: the update check compares with `!==`, not "server is newer", and
Ahmed's CEP extension is a **symlink to this source folder** — a mismatch makes
the panel download the live zip *over the source* and destroy uncommitted work.
This already happened once. Bump only as the final step of a deploy.

---

## 🔴 THE OPEN BUG — start here

**AI caption refinement silently does not run in the panel.**

Ahmed selects `Spoken: English` on Arabic audio with "Refine with a stronger AI"
ticked. Expected: an English translation. Actual: the raw, uncorrected Arabic,
and the second (German) subtitle layer never appears.

### Proof it is not running (from the panel's own artifacts)
```
/var/folders/g_/.../T/efp_caps_1787403710552.efp.line.srt   ← what the JSX placed
/var/folders/g_/.../T/efp_caps_1787403710552.efp.json       ← raw Whisper output
```
These are **byte-identical**. So `withRefinement()` (client/js/main.js) took an
early `next(summary)` path and never called the LLM.

### Already ruled out — do not re-test these
| Checked | Result |
|---|---|
| Transcriber reports `detectedLang` / `requestedLang` | correct (`ar` / `en`) |
| `efpRefineOptions()` with a stubbed DOM | returns a valid object |
| Module loads, exports `efpRefineCaptions` | yes |
| The decision rule | 8/8 cases correct |
| Groq and Claude translating when called directly | both work |
| Code mtime (15:41) vs Ahmed's run (17:02) | code was current |
| CEP renderer log | native font notes only, no JS errors |
| Saved config | `refineEnabled: true`, `dualSubtitle: true` |

### Leading hypothesis — applied, NOT yet confirmed
CEP was serving **stale cached JS**. Cache buster bumped `v=52` → `v=53` in
`client/index.html` as the last action of the session. Ahmed has not retested.

### If it still fails after a genuine reload
`withRefinement` has exactly two early-return paths. Instrument both and read
the panel's own console (not the CSXS log, which never carries JS errors):
```js
if (!opts) console.log("[refine] SKIP: opts null (checkbox off?)");
if (typeof window.efpRefineCaptions !== "function")
    console.log("[refine] SKIP: module missing");
```

### Second, separate symptom
Saved config says `refineProvider: 'groq'` while the panel displayed **Claude** —
the Engine dropdown may not be persisting. Worth checking alongside.

---

## What this session built

**Import from Link** (`3b3f85b`) — YouTube/Instagram → timeline. yt-dlp
provisioned on first use, clip-range download, three placement modes, save-folder
picker.

**AI caption refinement** (`3b3f85b`, `ba6f5f1`) — Groq / Claude / GPT correct
the transcript and optionally translate; timings preserved (1:1 when word count
holds, proportional otherwise).

**Cinematic "Full Sentence"** (`ba6f5f1`) — closes on real sentence-end
punctuation only, ~90-char ceiling. Previously passed Whisper's raw segment
bounds through with no length control at all.

**Language handling** (`ba6f5f1`) — probe the spoken language before
transcribing; "Spoken" doubles as the output choice; 99 languages in both maps.

---

## Non-obvious rules (each one cost real debugging)

1. **Rebuild the binary.** macOS runs compiled `bin/dist/whisper_runner`, never
   `transcriber.py`. `cd bin && bash build_binaries.sh` after any Python change.
2. **Bump `?v=NN`** in `client/index.html` after editing `main.js` — CEP caches.
3. **Never compare against `summary.language`** for language decisions. When a
   language is forced it echoes the user's own choice back, making the comparison
   circular. Use `summary.detectedLang`.
4. **`--ffmpeg-location` is mandatory** for yt-dlp — CEP's minimal PATH excludes
   Homebrew, and without it the merge is silently skipped (video with no sound).
5. **Drain stderr on every spawn** — an unread pipe deadlocks ffmpeg at 0% CPU.
6. **Match Premiere project items by node-id or media path, never by name** —
   macOS NFD vs Premiere NFC breaks accented filenames.
7. **Groq free tier is 8k TPM** on most models; `groq/compound-mini` gives 70k.
   Its catalog rotates fast — verify a model is live before trusting it.
8. **Verify against the panel, not a Node harness.** A `vm` test proves the
   module; it cannot see stale caching, an unrebuilt binary, or a removed DOM
   control. Every real failure this session lived in that gap.

---

## Context
Ahmed is finishing a **documentary about Syrians in Germany** — mixed Arabic and
German audio. Accuracy matters more than speed. Claude preserves his Levantine
dialect; Groq flattens it to MSA, so Claude is the right engine for this project.
