const fs = require('fs');
let code = fs.readFileSync('packages/ai/src/providers/GeminiAIProvider.ts', 'utf8');

// Helper
const helper = `
const resolveThinkingLevel = (defaultLevel: string): 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' => {
  const lvl = (process.env.GEMINI_THINKING_LEVEL || defaultLevel).toUpperCase();
  if (['MINIMAL', 'LOW', 'MEDIUM', 'HIGH'].includes(lvl)) {
    return lvl as 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  }
  return defaultLevel.toUpperCase() as 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
};
`;
if (!code.includes('resolveThinkingLevel')) {
  code = code.replace("export class GeminiAIProvider {", helper + "\nexport class GeminiAIProvider {");
}

code = code.replace(
  /config: { temperature: [0-9\.]+, version: process\.env\.GEMINI_THINKING_LEVEL \|\| 'medium' }/g,
  "config: { provider: { thinkingConfig: { thinkingLevel: resolveThinkingLevel('MEDIUM') } } }"
);

code = code.replace(
  /config: { temperature: [0-9\.]+, version: process\.env\.GEMINI_THINKING_LEVEL \|\| 'low' }/g,
  "config: { provider: { thinkingConfig: { thinkingLevel: resolveThinkingLevel('LOW') } } }"
);

fs.writeFileSync('packages/ai/src/providers/GeminiAIProvider.ts', code);
