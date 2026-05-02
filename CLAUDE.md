# EditFlow Pro - AI Assistant Directives

## 🎯 Project Overview
- **Type**: Adobe Premiere Pro CEP Extension
- **Tech Stack**: HTML, CSS, JavaScript (Frontend) / ExtendScript JSX (Backend)
- **Installation Path**: `$HOME/Library/Application Support/Adobe/CEP/extensions/EditFlowPro/`

## 📋 Coding Rules & Constraints
1. **ExtendScript (hostscript.jsx)**:
   - MUST use **ES3 ONLY**. No `const`, `let`, arrow functions `=>`, template literals, async/await, or classes.
   - DO NOT use `app.beginUndoGroup()` (it breaks Premiere silently, only works in After Effects).
   - Use `var` for all variables.
2. **Frontend (main.js)**:
   - Use `document.getElementById` + `addEventListener`. Avoid event delegation.
   - Every `csInterface.evalScript` MUST have a callback with `console.log`.
   - String arguments in `evalScript` must be properly quoted: `'$._editflow.myFunction("' + val + '")'`.
3. **General**:
   - Focus on performance and reliability.
   - Never break working functionality.

## 📁 Directory Structure
- `/client/`: HTML, CSS, and JS for the panel UI.
- `/jsx/`: ExtendScript files interacting with Premiere Pro API.

## 🔄 AI Agent Workflow
- Always refer to `MEMORY.md` for context before starting new tasks.
- Adhere to communication guidelines in `voice-principles.md`.
