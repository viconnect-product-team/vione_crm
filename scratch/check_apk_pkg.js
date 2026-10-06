const fs = require('fs');

const buf = fs.readFileSync('release_apk/ViOne-PWA-latest.apk');
const str = buf.toString('latin1');
const matches = str.match(/[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+){2,}/g);
const vioneMatches = matches ? matches.filter(m => m.toLowerCase().includes('vione')) : [];
console.log('Unique matches with vione:', [...new Set(vioneMatches)].slice(0, 20));
