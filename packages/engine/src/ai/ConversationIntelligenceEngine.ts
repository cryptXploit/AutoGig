import { AIProvider, CanonicalOpportunity, Profile, Preference, ConversationMessage, ConversationIntelligence } from '@autogig/core';
import { ConversationValidator } from './ConversationValidator';

export class ConversationIntelligenceEngine {
  private validator = new ConversationValidator();

  constructor(private ai: AIProvider) {}

  async generate(
    opportunity: CanonicalOpportunity,
    profile: Profile,
    preferences: Preference,
    messages: ConversationMessage[]
  ): Promise<{ intelligence: ConversationIntelligence, validationResult: import('@autogig/core').ConversationValidationResult }> {
    
    // Call AI to analyze conversation and draft a response
    const draftIntelligence = await this.ai.generateConversationIntelligence(opportunity, profile, preferences, messages);
    
    // Hard deterministic boundary check
    const validationResult = this.validator.validate(draftIntelligence, profile, preferences);

    if (validationResult.status !== 'PASS') {
      draftIntelligence.recommendedAction = 'STOP_COMMUNICATION';
      draftIntelligence.requiresHumanApproval = true;
      draftIntelligence.suggestedReply = '[REDACTED: AI generated unsupported claims. Manual review required.]';
    }

    return { intelligence: draftIntelligence, validationResult };
  }
}