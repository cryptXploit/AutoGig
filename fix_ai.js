const fs = require('fs');
['packages/ai/src/providers/GeminiAIProvider.ts', 'packages/ai/src/providers/MockAIProvider.ts'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("  async generateApplicationIntelligence", "  }\n\n  async generateApplicationIntelligence");
  fs.writeFileSync(file, content, 'utf8');
});
