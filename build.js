const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Read all source files
const indexContent = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf8');
const parserContent = fs.readFileSync(path.join(__dirname, 'src/parser.js'), 'utf8');

// Create a bundled file
const bundled = `
${parserContent.replace('module.exports = { parseChangelog };', '')}

${indexContent.replace("const { parseChangelog } = require('./parser');", '')}
`.trim();

fs.writeFileSync(path.join(distDir, 'index.js'), bundled);

console.log('✓ Built action to dist/index.js');
