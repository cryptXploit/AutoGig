const { GeminiAIProvider } = require('./packages/ai/dist/providers/GeminiAIProvider.js');

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.log('Skipping real Gemini test: No GEMINI_API_KEY found.');
    process.exit(0);
  }

  process.env.AI_PROVIDER = 'gemini'; // Ensure it runs the real path
  const ai = new GeminiAIProvider();
  
  console.log('Running real Gemini smoke test...');
  console.log(`Using model: ${process.env.GEMINI_MODEL || 'gemini-3.5-flash'}`);
  
  try {
    const claims = await ai.extractClaims("I have 5 years of TypeScript experience.");
    console.log('Structured Extraction Success:');
    console.log(JSON.stringify(claims, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Gemini Execution Failed:', err.message);
    process.exit(1);
  }
}

main();
