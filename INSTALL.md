# EditFlow Pro v16 — Installation Guide

## Requirements
- macOS (10.14+)
- Adobe Premiere Pro 2021 or later (CC 15.0+)
- Python 3 installed — required for AI Captions (`python3 --version` in Terminal to verify)

---

## Installation (Mac)

1. Extract `EditFlowPro_v16_install.zip`
2. Open the `EditFlowPro` folder
3. **Right-click** on `Install EditFlow Pro.command` → choose **Open**
4. A warning will appear — click **Open** to confirm
5. The installer runs and shows "Installation complete!"
6. Open Adobe Premiere Pro → **Window → Extensions → EditFlow Pro**

> **Why Right-click instead of double-click?**
> macOS blocks unrecognised scripts by default (Gatekeeper). Right-click → Open bypasses this once. The file is safe — it only copies the extension folder and sets a registry preference.
>
> If you see "Move to Trash / Done" with no Open option: click **Done**, then go to  
> **System Settings → Privacy & Security → scroll down → "Open Anyway"**

---

## Installation (Windows)

1. Extract `EditFlowPro_v16_install.zip`
2. Open the `EditFlowPro` folder
3. Double-click `Install EditFlow Pro.bat`
4. If SmartScreen appears, click **More info → Run anyway**
5. The installer runs and shows "Installation complete!"
6. Open Adobe Premiere Pro → **Window → Extensions → EditFlow Pro**

---

## Troubleshooting

**Panel doesn't appear in Window → Extensions**
- Make sure the installer ran successfully and Premiere was fully restarted
- Verify the folder is named exactly `EditFlowPro` (case-sensitive)

**AI Captions button is greyed out or fails**
- Install Python 3: `brew install python` or from python.org
- Make sure Premiere has permission to run shell scripts (System Settings → Privacy → Full Disk Access)

**CEP Debugger (for developers)**
Create a `.debug` file inside the `EditFlowPro/` folder with this content:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
  <Extension Id="com.editflowpro.panel.extension">
    <HostList>
      <Host Name="PPRO" Port="8088"/>
    </HostList>
  </Extension>
</ExtensionList>
```
Then open `http://localhost:8088` in Chrome while the panel is open in Premiere.
