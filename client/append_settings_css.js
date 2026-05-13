const fs = require('fs');

const settingsCss = `
/* ---------- SETTINGS PANEL FIXES ---------- */
.settings-panel {
  width: 90vw;
  max-width: 440px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  background: var(--bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid var(--glass-border);
  background: rgba(0,0,0,0.4);
}

.settings-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.settings-close-x {
  background: transparent;
  border: none;
  color: var(--text-mute);
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
}

.settings-close-x:hover {
  color: var(--danger);
  background: rgba(255,107,107,0.1);
}

.settings-tabs {
  display: flex;
  overflow-x: auto;
  padding: 0 24px;
  border-bottom: 1px solid var(--glass-border);
  background: rgba(0,0,0,0.2);
}

.settings-tabs::-webkit-scrollbar {
  display: none;
}

.settings-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-mute);
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.settings-tab:hover {
  color: var(--text);
}

.settings-tab.settings-tab-active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.settings-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.settings-section {
  display: none;
}

.settings-section.settings-section-active {
  display: block;
}

.settings-body label {
  display: block;
  font-size: 11px;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 24px;
  margin-bottom: 8px;
}
.settings-body label:first-child { margin-top: 0; }

.settings-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  text-transform: none !important;
  letter-spacing: normal !important;
  color: var(--text) !important;
  font-size: 13px !important;
  margin-top: 16px !important;
  cursor: pointer;
}
.checkbox-label input { margin: 0; }

.modal-actions {
  padding: 16px 24px;
  border-top: 1px solid var(--glass-border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: rgba(0,0,0,0.4);
}

/* About Card styling */
.about-card {
  text-align: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 24px;
}
.about-logo {
  width: 48px; height: 48px; margin: 0 auto 16px auto;
  background: var(--accent); color: #fff; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 18px;
}
.about-card h3 { margin: 0 0 4px 0; font-size: 18px; }
.about-version { font-size: 12px; color: var(--text-mute); margin: 0 0 16px 0; }
.about-tagline { font-size: 13px; color: var(--text); margin: 0 0 16px 0; }
.about-divider { border: 0; border-top: 1px solid var(--glass-border); margin: 16px 0; }
.about-developer-label, .about-contact-label { font-size: 10px; text-transform: uppercase; color: var(--text-mute); margin: 0 0 8px 0; }
.about-developer-name { margin: 0 0 2px 0; }
.about-developer-sub { font-size: 12px; color: var(--text-mute); margin: 0; }
.about-contact-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px; font-size: 13px; }
.about-contact-row a { color: var(--accent); text-decoration: none; }
.about-copyright { font-size: 11px; color: var(--text-mute); margin: 0 0 4px 0; }
.about-copyright-sub { font-size: 10px; color: var(--text-mute); margin: 0; opacity: 0.6; }
`;

fs.appendFileSync('client/css/style.css', '\\n' + settingsCss, 'utf8');
console.log("Settings panel CSS appended.");
