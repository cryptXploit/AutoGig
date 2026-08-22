const fs = require('fs');
let code = fs.readFileSync('packages/ai/src/providers/MockAIProvider.ts', 'utf8');
code = code.replace(
  "return claims.map(c => {",
  "console.log('Mock verify claims:', claims);\n    return claims.map(c => {"
);
fs.writeFileSync('packages/ai/src/providers/MockAIProvider.ts', code);
