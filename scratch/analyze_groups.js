
const fs = require('fs');

const content = fs.readFileSync('c:\\Renderbyte\\Belen\\Precios_Web.TXT', 'utf8');
const lines = content.split('\n');
const groups = {};

lines.forEach(line => {
    const parts = line.split(';');
    if (parts.length >= 4) {
        const groupCode = parts[3].trim();
        groups[groupCode] = (groups[groupCode] || 0) + 1;
    }
});

console.log(JSON.stringify(groups, null, 2));
