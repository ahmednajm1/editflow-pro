const fs = require('fs');
const glob = require('glob'); // Not sure if glob is installed, use native
const paths = [
    '/Applications/Adobe Premiere Pro 2026/Adobe Premiere Pro 2026.app/Contents/MediaIO/systempresets',
    '/Applications/Adobe Premiere Pro 2025/Adobe Premiere Pro 2025.app/Contents/MediaIO/systempresets',
    '/Applications/Adobe Premiere Pro 2024/Adobe Premiere Pro 2024.app/Contents/MediaIO/systempresets',
    '/Applications/Adobe Premiere Pro (Beta)/Adobe Premiere Pro (Beta).app/Contents/MediaIO/systempresets'
];
let found = null;
for (let base of paths) {
    if (fs.existsSync(base)) {
        let dirs = fs.readdirSync(base);
        for (let d of dirs) {
            let fullD = base + '/' + d;
            if (fs.statSync(fullD).isDirectory()) {
                let files = fs.readdirSync(fullD);
                for (let f of files) {
                    if (f.includes('PNG Sequence') && f.endsWith('.epr')) {
                        found = fullD + '/' + f;
                        break;
                    }
                }
            }
            if (found) break;
        }
    }
    if (found) break;
}
console.log("Found preset: " + found);
