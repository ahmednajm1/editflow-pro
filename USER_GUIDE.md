# EditFlow Pro - User Guide

Welcome to EditFlow Pro! Let's get your editing workflow supercharged.

## Core Features

### 1. 1-Click Smart Export
Select any sequence, and click **Smart Export**. The plugin will automatically:
1. Grab your default export preset.
2. Route it to your Desktop / Exports folder.
3. Automatically name it using the sequence name + today's date.
*(Available in Pro and Studio).*

### 2. Batch Export
Ideal for short-form content. 
1. Enter the number of clips you have on your timeline (e.g., 5).
2. The sequence will be chopped based on markers or silences.
3. All 5 clips are sent to Adobe Media Encoder automatically.
*(Available in Studio).*

### 3. Audio Tools
*   **Normalize Dialogue:** Select your dialogue track and hit the button. We apply a Dynamics processor targeting -6dB.
*   **Auto-Duck Music:** Click this to automatically fade your background music down to -20dB whenever someone is speaking.

### 4. Smart AI Features ✨
*   **Silence Removal:** Analyzes the audio waveform of the selected track, cuts out the dead air, deletes the gap, and crossfades the audio so it sounds perfectly natural.
*   **Beat Markers:** Adds visual markers to your selected music track exactly where the strong beats hit, so you can easily cut your video to the rhythm.

## Troubleshooting
**"Extension Signature is Invalid" Error on Mac:**
If you forcefully installed the plugin locally without using the ZXP installer, ensure you have enabled `PlayerDebugMode` via the terminal as instructed in the Install manual.

**UI not loading / Whitescreen:**
Usually indicates a missing local `CSInterface.js` file if run in a heavily sandboxed mode. Wait 5 seconds, or try clicking the panel menu and hitting "Refresh".
