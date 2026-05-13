const fs = require('fs');

const welcomeCss = `
/* ---------- WELCOME SCREEN ---------- */
.welcome-content {
  background: var(--bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  width: 320px;
  text-align: center;
}
.welcome-glow {
  position: absolute;
  top: -50px; left: 50%;
  transform: translateX(-50%);
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(31,143,255,0.4) 0%, transparent 70%);
  z-index: 0;
  pointer-events: none;
  filter: blur(20px);
}
.welcome-logo {
  position: relative;
  z-index: 1;
  width: 64px; height: 64px;
  margin: 0 auto 16px auto;
  background: linear-gradient(135deg, #3B99FF 0%, var(--accent) 100%);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(31,143,255,0.4), inset 0 2px 4px rgba(255,255,255,0.3);
  color: #fff;
}
.welcome-title {
  position: relative; z-index: 1;
  font-size: 24px; font-weight: 700; margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}
.welcome-pro { color: var(--accent); }
.welcome-tagline {
  position: relative; z-index: 1;
  font-size: 13px; color: var(--text-mute); margin: 0 0 24px 0;
}
.welcome-features {
  position: relative; z-index: 1;
  text-align: left;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}
.welcome-feature {
  display: flex; align-items: flex-start; gap: 12px;
  margin-bottom: 12px; font-size: 12px; line-height: 1.4;
  color: #fff;
}
.welcome-feature:last-child { margin-bottom: 0; }
.welcome-feature-icon {
  font-size: 14px; opacity: 0.8;
}
.welcome-dont-show {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 11px; color: var(--text-mute); text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 24px; cursor: pointer;
}
.welcome-dont-show input { margin: 0; }
.welcome-btn {
  width: 100%; padding: 14px; font-size: 14px; font-weight: 600;
  border-radius: 12px;
}
.welcome-credit {
  position: relative; z-index: 1;
  font-size: 11px; color: var(--text-mute); margin: 16px 0 0 0; opacity: 0.6;
}
.welcome-credit a { color: var(--text-mute); text-decoration: underline; }
`;

const presetChipsCss = fs.readFileSync('client/css/preset_chips.css', 'utf8');
let styleCss = fs.readFileSync('client/css/style.css', 'utf8');

styleCss += '\n' + presetChipsCss + '\n' + welcomeCss;

fs.writeFileSync('client/css/style.css', styleCss, 'utf8');
console.log("Appended missing CSS modules.");
