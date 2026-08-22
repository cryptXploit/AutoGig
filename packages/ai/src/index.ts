
export * from './providers/MockAIProvider';
export * from './providers/GeminiAIProvider';
export * from './PromptContextBuilder';

import { MockAIProvider } from './providers/MockAIProvider';
import { GeminiAIProvider } from './providers/GeminiAIProvider';
import { AIProvider } from '@autogig/core';

export function getAIProvider(): AIProvider {
  if (process.env.AI_PROVIDER === 'gemini') {
    return new GeminiAIProvider();
  }
  return new MockAIProvider();
}
