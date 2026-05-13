const fs = require('fs');
let css = fs.readFileSync('client/css/style.css', 'utf8');

// 1. Remove glass tokens
css = css.replace(/--glass-[^:]+:[^;]+;/g, '');

// 2. Replace glass variables with flat variables
css = css.replace(/var\(--glass-bg\)/g, 'var(--surface)');
css = css.replace(/var\(--glass-border\)/g, 'var(--border)');
css = css.replace(/var\(--glass-highlight\)/g, 'var(--border)');

// 3. Strip backdrop-filter completely
css = css.replace(/(-webkit-)?backdrop-filter:[^;]+;/g, '');

// 4. Strip crazy linear-gradients and replace with surface-2 or accent
css = css.replace(/background:\s*linear-gradient[^;]+;/g, 'background: var(--surface);');
css = css.replace(/background:\s*linear-gradient\([^,]+,\s*var\(--accent\)[^;]+;/g, 'background: var(--accent);');

// 5. Tone down huge border radiuses to match Premiere Pro (4px)
css = css.replace(/--r:\s*14px;/g, '--r: 4px;');

// 6. Remove excessive box-shadows (keep them subtle if necessary, but strip colored glows)
css = css.replace(/box-shadow:\s*0\s+[^;]+rgba\(31,143,255,[^;]+;/g, '');
css = css.replace(/box-shadow:\s*0\s+[^;]+rgba\(0,0,0,[^;]+;/g, 'box-shadow: 0 1px 3px rgba(0,0,0,0.3);');

// 7. Strip arbitrary !important borders
css = css.replace(/border:\s*1px\s+solid\s+var\(--glass-border\)\s*!important;/g, 'border: 1px solid var(--border);');

// 8. Fix the hardcoded "glass pill" comments
css = css.replace(/\(glass\)/g, '(native)');
css = css.replace(/glass pill/g, 'native pill');
css = css.replace(/glass accent/g, 'native accent');

fs.writeFileSync('client/css/style.css', css, 'utf8');
console.log("Glassmorphism stripped and UI polished.");
