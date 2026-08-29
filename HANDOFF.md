# EditFlow Pro — Session Handoff (2026-08-22)

Paste this file's path to a new session:
`/Users/ahmed/Downloads/Remotion/EditFlowPro/HANDOFF.md`

---

## UI Scope Reduction — Audio Level and Caption QA Hidden (2026-08-27)

Ahmed chose to keep the panel focused on capabilities Premiere does not already
make faster through native shortcuts. The **Audio Level** card (±1 dB and
Voice/SFX/BGM presets) and the **Caption QA** card are therefore removed from
the panel for now.

- This is a UI-only removal: the audio, Caption QA, plan-only and playhead-jump
  code remains in place for a low-risk future restore.
- The expected-button self-check no longer reports the intentionally absent
  audio buttons as a critical defect.
- `main.js` cache is now `v=64`; fully restart Premiere to load this leaner UI.

## Sync Prep Undo — Zero-byte Manifest Fallback (2026-08-27)

### Real Premiere failure and root cause

Ahmed confirmed **Prepare Sync Lanes** moved clips successfully, but **Undo last
prep** immediately reported: “There is no Sync Prep action to undo.” The live
manifest was found at:

`~/Library/Application Support/.editflowpro/sync_prep_undo.json`

but it was **0 bytes**. The original JSX trusted `File.write()` and returned
success without reopening the file. In this CEP/ExtendScript runtime that can
create an empty file, so the next undo-state read correctly found no valid data.

### Fix

- `_syncPrepWriteUndo()` now serializes a structured manifest and stores it in
  `$._editflow._syncPrepUndoMemory` before file I/O.
- It writes UTF-8, reopens the file, reads and parses it before treating the
  persistent copy as confirmed.
- If the runtime again produces an empty/unreadable file, Undo still works for
  the **current Premiere session** from the in-memory manifest. A valid disk
  manifest continues to survive a CEP-panel reload.
- Once undo finishes, it removes both the disk manifest and the memory copy.

### Verification

- A mocked ExtendScript `File` runtime reproduced a zero-byte `write()` exactly.
  The new code still recovered the selected item from memory for immediate undo.
- The same test then allowed a real write, cleared memory, and recovered the
  item from a reopened/parsed disk manifest.
- `node --check` passed on the JSX copy, `node --check client/js/main.js` and
  `git diff --check` passed.

### Important live-test note

The already-prepared timeline cannot be reconstructed safely from a 0-byte
manifest because its original track numbers were never recorded. Use Premiere’s
own Edit > Undo for that existing prep if it is still available. Then fully
restart Premiere (JSX reload requires restart), perform a new throwaway Sync
Prep, and immediately press **Undo last prep** before closing Premiere.

## Caption QA — Local Pre-delivery Caption Review (2026-08-27)

This is an additive, non-destructive review step directly below **Fast Captions**.
It does not change captions, tracks, clips, or the source transcript.

### What it does

- **Run Caption QA** reopens the final caption JSON used for placement (including
  the AI-refined/translated version when refinement succeeded), asks Premiere to
  generate its `planOnly` caption plan, and checks that exact final grouping.
- It flags reading speed, overly long captions/layout risk, very short caption
  durations, overlaps, repeated adjacent captions, three-or-more-word repetition,
  remaining Arabic script when the requested output is a non-Arabic-script
  language, and captions that cross a protected multi-clip timeline cut.
- Long gaps are reported only as **review** items, not errors: transcript timing
  can show a gap but cannot prove whether it is intentional silence without a
  separate waveform/AI audio pass.
- Each finding is clickable and moves Premiere's playhead to the relevant time
  through `$._editflow.jumpToTimelineTime()`. The helper only changes player
  position; it does not modify the sequence.
- The latest final transcript path and grouping choices are stored in
  `settings.captionQa`, so the QA button also works after a CEP panel reload as
  long as the generated JSON still exists.

### Important product decision

Version one is deliberately **local deterministic QA**, not a paid AI review.
It is instant, needs no API key, and has no cost. An optional future AI pass can
judge semantic translation quality and natural phrasing; it should supplement,
not replace, these reliable timing/layout checks.

### Verification completed outside Premiere

- `node --check client/js/main.js` passed.
- A JavaScript copy of `jsx/hostscript.jsx` passed `node --check`.
- A mocked Premiere test ran `placeAnimatedCaptions(..., {planOnly:true})` over
  two transcript fragments 59 seconds apart. The generated plan had two groups,
  preserving both `timelineBreak` boundaries with no caption across the cut.
- `git diff --check` passed and HTML duplicate-ID check passed.

### Still required in Premiere

Generate a short translated caption set with **Full Sentence**, click **Run
Caption QA**, and confirm the report appears. Click at least one finding to
confirm the playhead jumps to its time. Also test a multi-clip sequence with a
large timeline gap: the gap should be a blue review item at most, while no
caption should ever span across the edit.

## Sync Prep — Separate Lanes Before Premiere Synchronize (2026-08-27)

This is an additive timeline utility for the workflow where several video and
audio sources must be separated before using Premiere's native **Synchronize**.

### What it does

- **Prepare Sync Lanes** accepts only the selected Video/Audio TrackItems.
- It appends one empty video lane per selected video item and one empty audio
  lane per selected audio item, then moves each selected item to its own lane.
  Start time and source instance remain unchanged, so all items keep their exact
  relative timing and are ready for **Clip > Synchronize** in Premiere.
- No media is re-imported, no source is duplicated, no trim/ripple edit is used,
  and unselected clips are not touched. Moving the original TrackItem rather
  than inserting its ProjectItem preserves that item's visible trim/effects.
- **Undo last prep** restores the selected items to their original tracks. The
  undo manifest is saved under the EditFlow user-data directory, so it survives
  a CEP panel reload. It deliberately does not delete empty lanes afterwards:
  removing tracks through Premiere's undocumented APIs could remove user lanes.
- The panel intentionally does **not** call `Synchronize` itself. Premiere offers
  several sync criteria and the editor must select the appropriate native command
  after the lanes are prepared.

### Implementation note

Premiere's documented CEP DOM can insert/recreate a clip but cannot move an
existing timeline item to another track. Sync Prep uses QE's `moveToTrack()` only
for this narrow operation because it keeps the existing TrackItem intact. QE is
undocumented by Adobe, so this feature needs a real short-sequence test in each
supported Premiere generation before release.

### Verification completed outside Premiere

- `node --check client/js/main.js` passed.
- A JavaScript copy of `jsx/hostscript.jsx` passed `node --check`.
- `git diff --check` passed.
- The actual `prepareSyncLanes()` / `undoSyncLanes()` JSX functions ran against
  a mocked Premiere sequence. One selected video plus one selected audio moved
  from V1/A1 to unique V2/A2 lanes with matching start ticks, then both returned
  to V1/A1 and the persisted undo state was cleared.
- Wide and narrow panel previews confirmed the compact action flow, primary
  action, Undo state and safe-scope explanation. The design detector reported
  only pre-existing project warnings.

### Still required in Premiere

Fully restart Premiere so CEP loads `main.js v=64` / `css v=63`, then test first on a
throwaway sequence: select two video clips and two audio clips, run **Prepare
Sync Lanes**, confirm each item has its own new track at the exact same time,
run Premiere's native **Synchronize**, then use **Undo last prep**. Verify clip
effects/trims remain intact. Do not first run it on the documentary master.

## Fast Audio Export — MP3/WAV (2026-08-25)

The existing Export Engine now supports three explicit formats: **Video · MP4**,
**Audio · MP3**, and **Audio · WAV**. This is additive; video export still uses
the existing editable Mbps field and behavior.

### What was added

- A persisted format selector in the Export Engine. The primary button changes
  between **Export Selected Clip** and **Export Selected Audio**, and the UI shows
  only the quality information relevant to the selected format.
- MP3 prefers Adobe's native **256 kbps High Quality** preset, with 192/128 kbps
  fallbacks. The visible badge reflects the bitrate of the preset actually found.
- WAV uses Adobe's native **Waveform Audio 48 kHz 16-bit** preset.
- Preset discovery covers Premiere Pro, Premiere Pro Beta, Media Encoder and
  Media Encoder Beta for releases 2020–2029 on macOS and Windows.
- Audio export calls Premiere's `sequence.exportAsMediaDirect()` with the native
  audio-only preset. It does not render an intermediate video or run FFmpeg, so
  it remains the fast path while preserving the sequence mix, effects, speed
  changes and the selected clip's timeline In/Out range.
- `exportCustom()` remains backward-compatible when no format is passed. It now
  normalizes `.mp4`, `.mp3` and `.wav` extensions and applies collision numbering
  with the chosen extension.
- The responsive row was visually checked in wide and narrow layouts; below
  560 px the quality badge moves below the format selector instead of clipping.

### Verification completed outside Premiere

- `node --check client/js/main.js` passed.
- A JavaScript copy of `jsx/hostscript.jsx` passed `node --check`.
- `git diff --check` passed.
- The actual preset-discovery function found Premiere Pro 2026's installed MP3
  256 kbps and WAV 48 kHz/16-bit presets.
- The actual `exportCustom()` implementation ran against Premiere mocks for all
  three formats. It produced `.mp3`, `.wav` and `.mp4`, retained selection ticks
  `100–250`, and exported work area `1`.
- HTML duplicate-ID check passed with 166 unique IDs.
- Headless Chrome confirmed MP3/WAV quality labels, format-specific button text,
  hidden video bitrate in audio modes, and the narrow-panel layout.

### Still required in Premiere

Fully restart Premiere so CEP loads `main.js v=64` / `css v=63`. Select a short 5–10 second
timeline clip, export MP3 and WAV, then verify duration, audible timeline effects,
mix and speed changes. Also test once with no selected clip to confirm the existing
whole-sequence fallback is still the desired product behavior.

## Animated Captions (CapCut-style) — OPTIONAL BETA built 2026-08-23

This is an additive path. The existing editable/native-caption workflow remains
the default and is unchanged when **Animated captions** is disabled.

### What was added

- A panel toggle plus eight visual preset cards. The original three remain
  compatible, and five researched/common caption families were added:
  - `Clean Film` — quiet documentary subtitle with a restrained fade;
  - `TikTok Pop` — yellow active word plus a short pop;
  - `Reels Cyan` — cyan active word with a smooth upward entrance;
  - `Yellow Box` — a compact yellow box behind the active word;
  - `Karaoke Build` — builds the phrase word by word;
  - `One Word` — shows only the current word at a larger center position;
  - `Drop Bounce` — downward entry with a soft bounce;
  - `Neon Glow` — timed cyan highlight and glow.
- The generate button changes to **Generate Animated Captions** only while the
  optional mode is enabled.
- `placeAnimatedCaptions()` now has a `planOnly` mode. It returns the exact same
  phrase/full-sentence grouping, word timings, multi-clip timeline restoration,
  hard edit boundaries and non-overlap sanitation used by editable captions.
  The animation engine therefore does not maintain a second, divergent caption
  segmentation implementation.
- The CEP panel renders deterministic Canvas frames with transparent backgrounds,
  encodes each caption as QuickTime Animation (`qtrle`, `argb`) using FFmpeg, then
  calls the previously-unused `placeRenderedCaptions()` JSX route.
- Animated media is persisted below the EditFlow config directory under
  `animated_captions/run_<id>/`; deleting a temp directory cannot take the clips
  offline.
- JSX refuses to overwrite user footage. It uses an empty top video track, tries
  to create one via QE when needed, and otherwise returns a clear “add one empty
  video track” message.
- Explicit rollback button: **Remove generated animation** removes only timeline
  clips whose names begin `efp_anim_`. It leaves editable captions and source media
  untouched. Turning the option off restores the original native-caption path.

### Control/authoring pass — 2026-08-23

Ahmed confirmed the animated clips render correctly in Premiere, but the three
preset cards did not visibly change selection and the button continued to say
**Generate Editable Subtitles**. The root cause was a real JavaScript scope bug:
global `updateAnimatedCaptionUI()` called `t()`, but `t()` exists only inside the
downloader IIFE. The resulting `ReferenceError` stopped the function before the
card classes and button text could update. It now uses the global, scope-safe i18n
lookup and re-applies animated state after language changes.

The beta now also includes:

- an unmistakable selected preset state (blue border, bottom marker, check icon,
  `aria-checked`, roving tab focus and arrow-key navigation);
- an installed-font text field with suggestions, 60–150% size, Low/Middle/High
  placement, text/active/outline colors;
- background mode: **Style default**, **None**, or **Custom**, with custom color
  and opacity controls;
- optional **Review and edit every caption before rendering**. The editor shows
  each caption beside its absolute timecode and supports Arabic RTL plus Latin
  scripts. If edited text keeps the same word count, exact word timestamps are
  retained; if the count changes, timing is redistributed only inside that
  caption's existing start/end range. Cancel changes no timeline clips;
- all appearance values persist in settings and are written into the generated
  manifest for traceability.

### Preset/UI v2 simplification — 2026-08-24

The first control pass exposed too many low-level color fields, and its saved
Arial/palette values overrode the visual identity of every preset. That made the
cards look different while the rendered results could converge or feel
internally inconsistent.

The current UI deliberately treats a preset as a complete, one-click look:

- eight compact cards replace the original three-card gallery;
- `Clean Film` is the safe default for documentaries and long-form work;
- only the selected card animates in the panel, and the selected state keeps the
  blue border, check icon, bottom marker, `aria-checked` and keyboard navigation;
- advanced controls are hidden under **Fine tune (Optional)**;
- only four useful overrides remain: optional installed font, size, position and
  background (`Style default`, `None`, or `Black box`);
- individual text/active/outline/background colors and opacity were removed from
  the panel. Each preset now owns its palette, typography, position and motion;
- animated settings have `animatedUiVersion: 2`. On the first load after this
  change, only old animated-style overrides migrate to the new `Clean Film`
  defaults. Translation, caption grouping and all unrelated settings are left
  untouched;
- the renderer implements the eight looks directly in the existing deterministic
  Canvas path. No third-party source code was copied.

### Verification completed outside Premiere

- `node --check client/js/main.js` passed.
- A JavaScript copy of `jsx/hostscript.jsx` passed `node --check`.
- `git diff --check` passed.
- The actual JSX `planOnly` code was executed with a mocked ExtendScript `File`
  runtime: a 3-word fixture shifted from `0s` to `50s` retained all three exact
  word timings and wrote a valid plan.
- The actual rollback function was executed against mocked video tracks and
  removed only the two `efp_anim_*` clips, preserving unrelated footage/title
  clips.
- The actual Canvas renderer was extracted and rendered Arabic, German and English
  frames for all three styles. Transparent corner alpha remained `0`; visible text
  pixels were present in every frame.
- A real 42-frame `Drop Bounce` sequence was encoded with the same FFmpeg command.
  `ffprobe` confirmed `qtrle`, `argb`, `1280x720`, `1.4s`, and exactly 42 frames.
- After the control pass, the actual panel HTML was exercised in headless Chrome:
  clicking `Drop Bounce` moved the selected state and changed its active palette;
  the generate button changed to **Generate Animated Captions** without an error.
- The actual review editor was tested with Arabic, German and English. Changing a
  4-word Arabic caption to 6 words kept the original `0–2.4s` bounds and produced
  six contiguous word ranges ending exactly at `2.4s`.
- The actual Canvas renderer was extracted again and rendered Arabic with a 130%
  custom size, High position, custom navy 72% background, pink active word and
  custom outline; RTL order and all visual overrides were correct.
- The new UI was visually inspected at wide and narrow panel sizes. The Impeccable
  detector found only pre-existing project-wide warnings, no new control defect.
- Preset/UI v2 passed `node --check`, `git diff --check`, and an HTML duplicate-ID
  check (163 unique IDs).
- Headless Chrome selected `Yellow Box` and confirmed both the visible selected
  state and `aria-checked=true`.
- The actual Canvas renderer produced visible Arabic/RTL frames for all eight
  presets. The comparison confirmed distinct output for quiet documentary,
  active-color, active-box, build, single-word, drop and neon families.
- The review editor was re-run after the simplification: changing a four-word
  Arabic caption to six words kept the exact `0–2.4s` caption bounds and ended the
  final redistributed word at exactly `2.4s`.

### Still required in Premiere

Fully restart Premiere so CEP loads `main.js v=64` / `css v=63`. The base render/placement
path already passed Ahmed's real Premiere test. Preset/UI v2 still needs one short
5–15 second real-panel test: switch among the eight cards, render `Clean Film`,
`Yellow Box`, `Karaoke Build` and `One Word`, optionally test Font/Position/Black
box under **Fine tune**, then test **Remove generated animation**. Do not start
this first style test with the hour-long documentary: the beta deliberately
renders one transparent MOV per caption for clean rollback and long-form
performance has not yet been optimized.

---

## Git

| | |
|---|---|
| **Current HEAD at this handoff** | `6451b8e` |
| Release version | `1.3.30` (deliberately pinned) |

The working tree contains active caption/animated-caption changes. Do not reset or
overwrite unrelated edits; inspect `git diff` before any future commit.

**Version is deliberately pinned at 1.3.30** (local `CURRENT_VERSION`, local
`version.json`, and the live server all read 1.3.30). Do **not** bump it while
developing: the update check compares with `!==`, not "server is newer", and
Ahmed's CEP extension is a **symlink to this source folder** — a mismatch makes
the panel download the live zip *over the source* and destroy uncommitted work.
This already happened once. Bump only as the final step of a deploy.

---

## ✅ THE OPEN BUG — FIXED (2026-08-22, session 2)

It was never the cache. It was a **type mismatch on `summary.json`**, plus four
more real defects stacked behind it. All five are fixed and verified against
Ahmed's own 17:15 transcript with the live Groq and Claude APIs.

### Root cause
`summary.json` is a **file path** everywhere:
- `transcriber.py:485` writes `"json": json_path`
- `hostscript.jsx:2121` reads it with `new File(efpJsonPath)`
- `main.js` `fallbackSRT` / `placeSecondSubtitle` pass it straight through

but `efpRefineCaptions` did `JSON.parse(summary.json)` — parsing a path. That
throws on every run, and the catch returned the **original** summary:

```js
try { doc = JSON.parse(summary.json); }
catch (e) { return cb("Could not read the transcription", summary); }
```

So refinement was a guaranteed no-op. The previous session's `vm` harness passed
because it fed JSON *text*, which the panel never does — rule 8, exactly.

**Why it looked silent:** the error did reach `showStatus(...,"orange")`, but
that banner self-clears after 5 s (`main.js:2506`) and caption placement takes
far longer. The run always ended on a green success line.

### The four defects behind it
| # | Defect | Fix |
|---|---|---|
| 2 | `groq/compound-mini` returns `message.content` **empty** (agentic model) — every batch died on "did not return valid JSON" | default model → `openai/gpt-oss-20b` |
| 3 | `max_tokens: 8000` counts against the 8,000 TPM cap *before* the call, so every request was permanently "too large" | `max_tokens: 3000` + `reasoning_effort: "low"` (358 → 73 output tokens, same quality) |
| 4 | Translation was one bullet at the end of a long "correct the Arabic" prompt — models returned corrected **Arabic** | `buildSystemPrompt` now leads with the target language in translate mode |
| 5 | Models silently returned only part of a 12-segment batch; skipped segments stayed in the source language | `BATCH_SIZE` 12 → 8, plus a repair pass over untouched indices in batches of 3 |

### Verified result (real API, real transcript, 26 segments)
| Engine | Changed | Still Arabic | Note |
|---|---|---|---|
| Groq `gpt-oss-20b` | 25/26 | **0** | free tier, needs the rate-limit wait |
| Claude `claude-opus-5` | 25/26 | **0** | better: recovered "لجوء" → "asylum seekers" |

Output file is schema-identical to the raw one — same keys, same segment count,
**identical start/end timings**, every word array intact.

### Also added
- Rate-limit retry that honours the API's own "try again in Xs" hint, and does
  **not** retry permanent "request too large" 429s.
- `window._efpRefineError` — a refinement failure is now appended to the final
  status line and re-shown, so it can never be wiped by a later success.
- `console.error` prints the first 400 chars of any unparseable model reply.
- `LANG_NAME_TO_CODE` fallback: when the language probe is inconclusive the
  spoken language is recovered from Whisper's own report, so the translate rule
  still fires (this is the only case where reading `summary.language` is safe —
  an inconclusive probe means the transcription ran on auto-detect).
- `.debug` (gitignored) enabling CEP remote debugging on **port 8088**. Needs a
  full Premiere restart, then open `http://localhost:8088` in a browser to read
  the panel's real console.

Cache buster after that session was `v=54`; the current value is documented below.

---

## Multi-clip captions collapsed at project start — FIXED in code (2026-08-23)

Ahmed selected many clips scattered across an approximately one-hour Premiere
sequence. Translation quality was good, but all caption items landed contiguously
near the first selected clip.

### Decisive real-run evidence

`efp_caps_1787435486918.efp.json` contained 253 segments from `0` to `1040.94s`
(compact speech duration `1042.08s`). Its generated German SRT was then shifted by
only the first clip's timeline start (`~127s`), so it ran from about `02:07` to
`19:27` even though the selected clips are scattered much farther across the
project. Premiere placed exactly the timestamps it was given.

### Root cause

The multi-clip path extracted every selected clip to WAV, concatenated those WAVs
back-to-back with no silence, and called:

`runTranscriber(combinedFile, firstTlStart, ...)`

No clip-boundary/timeline map survived the concat. `firstTlStart` can position the
first word only; it cannot reconstruct later gaps.

### Fix

- `getAudioMedia()` now returns each selected clip's `timelineEnd` and
  `timelineDuration` as well as its start/source range.
- The panel reads each normalized WAV's exact PCM duration and builds a compact
  audio-time → Premiere-timeline map before concat.
- Immediately after transcription, `restoreTimelineMap()` splits any Whisper
  segment that crossed a concat boundary and remaps every word/segment to its
  original clip location. Speed-changed clips are scaled to their timeline
  duration.
- The last fragment of each physical clip is marked `timelineBreak`; Claude/Groq
  are told not to continue context across it, and Full Sentence/Phrase grouping
  must close there. Captions can no longer span empty minutes between edits.
- Dual-subtitle placement now receives the same timeline offset as the primary
  subtitle instead of always using zero.
- The confirmed Full Sentence de-dup defect was corrected at the same boundary:
  adjacent legitimate repetitions such as German `die die` survive; only words
  occupying substantially the same timestamp are collapsed.
- JS cache buster is now `v=56`. No Python changed, so no binary rebuild is needed.

### Verification

- Actual `restoreTimelineMap()` code was extracted and run against a three-clip
  synthetic fixture at relative timeline starts `0s`, `50s`, and `200s`, including
  a Whisper segment crossing a concat boundary and a 2× speed/duration scale.
- Output starts were restored at all three ranges, the crossing segment was split,
  and every clip ended with a hard boundary.
- The actual Full Sentence and Phrase grouping bodies were extracted from
  `hostscript.jsx` and run on the mapped fixture: neither bridged either gap.
- WAV parser returned exactly `1.25s` for a generated PCM fixture.
- Adjacent `die die` is preserved while true timestamp-overlap duplicates are still
  removed.
- `node --check` passed for `main.js` and a `.js` copy of `hostscript.jsx`;
  `git diff --check` passed.

**Still required:** fully restart Premiere (loads both `v=56` and JSX), delete the
old wrongly placed caption track, select the same scattered clips and run once in
the real panel. That is the only remaining end-to-end verification.

---

## Mixed Arabic/German captions — empty segment text (2026-08-22, session 4)

Ahmed's real three-minute Claude/German run still produced a few Arabic islands.
The provider did run and most of the file was German. The decisive fixture was:

`/var/folders/g_/c8t03nsx0zn22p9k2tngf9gw0000gn/T/efp_caps_1787413792663.refined.german.efp.json`

Segment 25 had `text: ""` but 25 timed Arabic entries in `words`. Refinement
submitted `batch[k].text || ""`, so Claude received nothing for that interval.
The Full Sentence placer correctly preferred the populated word array and exposed
the old Arabic words on the timeline. This was not a spoken-language selection bug.

Fixes:
- `bin/transcriber.py::build_efp` reconstructs empty segment text from its words;
- `client/js/main.js` uses the same word fallback for existing/old transcript files;
- short word overlaps at an empty-segment boundary are removed before refinement
  (`جوب` + `جوب سنتر` no longer becomes `Job` + `Jobcenter`);
- translated output for a non-Arabic-script target is rejected and retried if it
  still contains Arabic letters;
- main caption language/model/style selections are now persisted when Generate is
  clicked (the config misleadingly showed `auto` after panel reloads);
- cache buster bumped to `v=55`;
- `bin/dist/whisper_runner` rebuilt successfully after the Python change.

Static verification passed (`node --check`, Python AST parse, `git diff --check`).
The exact failing fixture now yields a non-empty 148-character Arabic source string
for segment 25, so Claude will receive it on the next German run.

### Live re-verification (session 5) — refinement layer now PASSES
The same fixture (`efp_caps_1787413792663.efp.json`, 45 segments) was run through
the current `efpRefineCaptions` against the live Anthropic API, Arabic → German:

| | |
|---|---|
| Segments changed | **45 / 45** |
| Untouched | **0** |
| Arabic islands remaining | **0** |
| Start/end timings | identical to source |
| Segment 25 (the empty one) | now proper German — "des Landes, in dem sie leben, okay. Dazu die Leute, die die Leistungen oder Vergünstigungen ausnutzen…" |

So the empty-segment reconstruction, the overlap trim and the Arabic-script retry
all work on real data. **What is still unverified is only the JSX placement** —
`hostscript.jsx` changed, so a full Premiere restart plus one real panel run is
needed to confirm the timeline result.

---

## Full Sentence — cinematic segmentation follow-up (2026-08-22, session 3)

Claude's German translation was semantically better than Groq's, but Claude
correctly returned continuing fragments without final punctuation. The old Full
Sentence grouper flattened those segments, waited until its 90-character cap,
then cut at the last available word. In the real panel this produced grammatical
hangers such as `auf eine | Art` and `Eigentum das | verbreitet...`.

`jsx/hostscript.jsx` now:
- treats each AI/source segment end as a strong soft subtitle boundary;
- uses an 84-character ceiling (about two 42-character cinema lines);
- penalizes breaks after German/English/Arabic articles, prepositions and
  conjunctions.

Verified against Ahmed's actual Claude German `.refined.german.efp.json`. The
same 40-second passage now produces eight complete captions (38–82 characters)
with identical source timings and no grammatical hangers. CEP must be fully
restarted once to reload `hostscript.jsx`; no binary rebuild or JS cache bump is
needed for this JSX-only change.

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
7. **Groq free tier is 8k TPM** on every usable model. `groq/compound-mini`
   advertises 70k but is agentic and returns an EMPTY `message.content`, so it
   cannot be used here. `max_tokens` is counted against the cap before the call
   runs, so keep it small. Verify a model is live *and* returns content before
   trusting it — the catalog rotates fast.
9. **`summary.json` is a PATH, never JSON text.** The transcriber, the JSX and
   every placement helper agree on that. Anything that transforms the transcript
   must read the file and write a new one, returning the new path.
10. **A `showStatus` banner disappears after 5 seconds.** Anything that must
   survive a long operation belongs in the status line, not the banner.
11. **Check that a model returned every segment it was given.** Silently dropping
   part of a batch is normal model behaviour; treating it as success puts
   untranslated lines on the timeline.
8. **Verify against the panel, not a Node harness.** A `vm` test proves the
   module; it cannot see stale caching, an unrebuilt binary, or a removed DOM
   control. Every real failure this session lived in that gap.

---

## Context
Ahmed is finishing a **documentary about Syrians in Germany** — mixed Arabic and
German audio. Accuracy matters more than speed. Claude preserves his Levantine
dialect; Groq flattens it to MSA, so Claude is the right engine for this project.
