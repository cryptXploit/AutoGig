import { AIProvider, ApplicationIntelligenceInput, ApplicationIntelligenceResult } from '@autogig/core';

export class ApplicationIntelligenceEngine {
  constructor(private ai: AIProvider) {}

  async generate(input: ApplicationIntelligenceInput): Promise<ApplicationIntelligenceResult> {
    return await this.ai.generateApplicationIntelligence(input);
  }
}
