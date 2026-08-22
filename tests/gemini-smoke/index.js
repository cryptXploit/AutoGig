const { z } = require('genkit');
const { GeminiAIProvider } = require('../../packages/ai/dist/index.js');

async function main() {
  if (process.env.AI_PROVIDER !== 'gemini') {
    console.log('SKIPPED: AI_PROVIDER is not gemini');
    process.exit(0);
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('REAL GEMINI TEST: NOT RUN');
    console.log('REASON: No valid GEMINI_API_KEY available.');
    process.exit(0);
  }

  const provider = new GeminiAIProvider();

  console.log('Request started');
  console.log('Model identifier:', process.env.GEMINI_MODEL || 'gemini-3.5-flash');
  
  try {
    const claims = await provider.extractClaims('I have 5 years of experience in React.');
    
    if (Array.isArray(claims)) {
      console.log('Success');
      console.log('Returned structured fields:', JSON.stringify(claims));
      console.log('REAL GEMINI TEST: PASS');
      process.exit(0);
    } else {
      console.error('Failure: malformed structured output.', claims);
      console.log('REAL GEMINI TEST: FAIL');
      process.exit(1);
    }
  } catch(err) {
    const errStr = String(err);
    if (errStr.includes('API_KEY_INVALID') || errStr.includes('API key not valid')) {
      console.error('Failure: authentication failure.', err.message);
    } else if (errStr.includes('NOT_FOUND') || errStr.includes('Model not found')) {
      console.error('Failure: model-not-found/provider configuration failure.', err.message);
    } else if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('rate limit')) {
      console.error('Failure: quota/rate-limit failure.', err.message);
    } else if (errStr.includes('ENOTFOUND') || errStr.includes('ECONNREFUSED')) {
      console.error('Failure: network failure.', err.message);
    } else {
      console.error('Failure: unexpected error.', err.message);
    }
    console.log('REAL GEMINI TEST: FAIL');
    process.exit(1);
  }
}

main();
