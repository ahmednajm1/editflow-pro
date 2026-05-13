const fs = require('fs');
let css = fs.readFileSync('client/css/style.css', 'utf8');

// 1. Add Glass tokens to :root
const glassTokens = `
  /* Glass tokens */
  --glass-bg:       rgba(255,255,255,0.03);
  --glass-border:   rgba(255,255,255,0.08);
  --glass-blur:     24px;
  --glass-highlight: rgba(255,255,255,0.08);
`;
css = css.replace(/--warning:[^;]+;/, match => match + '\n' + glassTokens);

// 2. Change Action Groups to Glass
css = css.replace(/\.action-group {\n\s*background:[^;]+;/g, '.action-group {\n  background: var(--glass-bg);');
css = css.replace(/\.action-group {\n\s*background: var\(--glass-bg\);\n\s*border:[^;]+;/g, '.action-group {\n  background: var(--glass-bg);\n  border: 1px solid var(--glass-border);\n  backdrop-filter: blur(var(--glass-blur));\n  -webkit-backdrop-filter: blur(var(--glass-blur));\n  box-shadow: 0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 var(--glass-highlight);');

// 3. Update Inputs and Selects
css = css.replace(/input\[type="text"\], input\[type="number"\], select {\n\s*background:[^;]+;/g, 'input[type="text"], input[type="number"], select {\n  background: rgba(0,0,0,0.2);');
css = css.replace(/border: 1px solid var\(--border\);/g, 'border: 1px solid var(--glass-border);');

// 4. Update Main Buttons
css = css.replace(/button\.primary {[^}]+}/g, `button.primary {
  background: linear-gradient(135deg, var(--accent) 0%, #3B99FF 100%);
  color: #fff;
  border: none;
  box-shadow: 0 4px 16px rgba(31,143,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
}`);

// 5. Update normal buttons
css = css.replace(/button {\n\s*background:[^;]+;/g, 'button {\n  background: rgba(255,255,255,0.05);');

// 6. Header Glass
css = css.replace(/\.header {\n\s*background:[^;]+;/g, '.header {\n  background: rgba(12,12,14,0.6);\n  backdrop-filter: blur(24px);\n  -webkit-backdrop-filter: blur(24px);');

// 7. Border radius
css = css.replace(/--r:\s*4px;/g, '--r: 12px;');

fs.writeFileSync('client/css/style.css', css, 'utf8');
console.log("Glass added.");
