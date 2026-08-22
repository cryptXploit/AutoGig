import { GeminiAIProvider } from './packages/ai/src/providers/GeminiAIProvider';

async function main() {
  if (process.env.AI_PROVIDER !== 'gemini') {
    console.error('Error: AI_PROVIDER must be gemini');
    process.exit(1);
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is required');
    process.exit(1);
  }

  const ai = new GeminiAIProvider();
  
  console.log('Running real Gemini smoke test...');
  console.log(`Using model: ${process.env.GEMINI_MODEL || 'google-genai/gemini-3.5-flash'}`);
  console.log(`Using thinking level: ${process.env.GEMINI_THINKING_LEVEL || 'LOW'}`);
  
  try {
    const claims = await ai.extractClaims("I have 5 years of TypeScript experience and built a scalable backend.");
    console.log('Structured Extraction Success:');
    console.log(JSON.stringify(claims, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Gemini Execution Failed:', err.message);
    process.exit(1);
  }
}

main();
