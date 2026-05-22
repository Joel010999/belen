
const fs = require('fs');

const content = fs.readFileSync('c:\\Renderbyte\\Belen\\Precios_Web.TXT', 'utf8');
const lines = content.split('\n');
const indicators = {};

lines.forEach(line => {
    const parts = line.split(';');
    if (parts.length >= 6) {
        const indicator = parts[5].trim();
        indicators[indicator] = (indicators[indicator] || 0) + 1;
    }
});

console.log(JSON.stringify(indicators, null, 2));
