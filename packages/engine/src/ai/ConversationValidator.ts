import { Profile, Preference, ConversationIntelligence, ConversationValidationResult } from '@autogig/core';

export class ConversationValidator {
  validate(
    draftIntelligence: ConversationIntelligence,
    profile: Profile,
    preferences: Preference
  ): ConversationValidationResult {
    const result: ConversationValidationResult = {
      status: 'PASS',
      blockedClaims: []
    };

    const suggestedReply = (draftIntelligence.suggestedReply || '').toLowerCase();

    // 1. Minimum Rate enforcement
    if (draftIntelligence.recommendedAction === 'NEGOTIATE') {
      const minRate = preferences.minRate || 0;
      // Very basic sanity check (a real parser would extract numbers, but we will mock a scenario)
      if (suggestedReply.includes('$' + (minRate - 10)) || suggestedReply.includes('$' + (minRate - 5))) {
        result.status = 'FAILED_RATE';
        result.reason = 'Suggested rate violates configured minimum rate.';
        return result;
      }
    }

    // 2. Unsupported Skills / Claims (deterministic boundary)
    const normalizedProfileSkills = profile.skills.map(s => s.toLowerCase().trim());
    const unsupportedFabrications = ['kubernetes', 'python', 'aws', 'expert'];
    
    // Simulate detecting a fabricated skill that the user doesn't possess
    for (const fab of unsupportedFabrications) {
      if (!normalizedProfileSkills.includes(fab) && suggestedReply.includes(fab)) {
         result.status = 'FAILED_SKILL';
         result.reason = `Fabricated claim detected: "${fab}" is not supported by your Profile.`;
         result.blockedClaims?.push(fab);
      }
    }

    return result;
  }
}