# Debug & Manual Installation Guide (Developer Mode)

Because ZXP Compilation requires specific Adobe CMD binaries (ZXPSignCmd), installing the extension manually via Developer Mode is standard for beta versions.

## 1. Entering Developer Mode (Mac)
Adobe prevents unsigned plugins from running unless debug mode is active.
1. Open up the `Terminal` application on your Mac.
2. Run this command:
   ```bash
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   ```
   *(Note: Depending on your exact Premiere Pro version year, the CSXS number changes. Run it for `.11`, `.10`, `.9`, etc., to be safe).*

## 2. Moving the Plugin Folder
Instead of a `.zxp` file, Adobe reads direct system folders.
1. Copy the entire `EditFlowPro` folder.
2. Open Finder. In the top bar, click **Go > Go to Folder...**
3. Type: `~/Library/Application Support/Adobe/CEP/extensions/`
4. Paste the `EditFlowPro` folder there.
5. Restart Adobe Premiere Pro.
6. Look under **Window > Extensions > EditFlow Pro**.

---

## Technical Debugging

### Where do logs appear?
EditFlow Pro has a built-in `logger.js`. Errors in the DSP or frontend layer are automatically funneled there. If you want to view live Javascript readouts or trace execution:

### Opening the Local CEP Console (Chromium Debugger)
1. Since we bypass UXP utilizing CEP, you can connect an external Chrome browser to inspect the panel while it runs!
2. Create a file named `.debug` inside the `EditFlowPro` plugin folder.
3. Add this code into it:
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
4. Restart Premiere and open the EditFlow Pro panel.
5. Open your standard **Google Chrome** browser and navigate to: `http://localhost:8088`.
6. You will see the familiar Chrome Developer Tools panel linked directly live to your Premiere Extension. 

### Why did "Smart Edit" abort?
If the confirmation modal showed zero cut estimates and failed, it means `dspWorker.js` threw a math error analyzing the offline buffer. Open the CEF port (`localhost:8088`) console to view the exact error stack trace.
