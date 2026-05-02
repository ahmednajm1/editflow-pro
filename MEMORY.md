# EditFlow Pro - Active Memory & Context

*This file acts as the persistent memory across sessions.*

## 📌 Current State & Achieved Milestones
1. **🔊 Audio Nudge**: Replaced reset button with precise `+1 dB / -1 dB` nudge controls.
2. **🖼️ Static Scale**: Implemented direct scale cut-ins.
3. **📐 Transform**: Pixel nudging, manual position/scale.
4. **📤 Export Engine**: Fully functional export options.
5. **🎵 AI Beat Detection**: Operational.

## 🚧 Current Work in Progress / Next Steps
- **Audio Gain Fix**: Moving from Volume Level meter to Audio Gain via QE DOM (`setAudioClipGain`).
- **Full Alignment System**: Building a complete alignment matrix (Left, Right, Center H/V) to replace old centering buttons.
- **Speed Ramping (v15)**: Planning to implement a cinematic speed ramping feature using QE DOM cut segments (Approach 3) as the primary engine.

## 💡 Important Discoveries
- **Coordinate System**: MOGRTs use normalized coordinates (0.0 - 1.0), while standard clips use pixel coordinates. `hostscript.jsx` must handle this disparity.
- **Audio API Constraint**: Premiere API uses linear audio scaling. To convert dB to linear, use `Math.pow(10, db/20)`.
- **QE DOM**: Often required for functions missing in the standard API (like Audio Gain and true Speed Changes).
