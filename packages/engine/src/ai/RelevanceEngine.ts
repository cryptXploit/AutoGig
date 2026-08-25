import { Profile, CanonicalOpportunity, Preference, ClientIntelligenceResult } from '@autogig/core';

export class RelevanceEngine {
  analyze(
    opportunity: CanonicalOpportunity,
    profile: Profile,
    preferences: Preference,
    clientIntel: ClientIntelligenceResult | null
  ) {
    const strongSkills: string[] = [];
    const moderateSkills: string[] = [];
    const missingSkills: string[] = [];
    const weakSkills: string[] = [];

    const oppSkills = opportunity.normalizedSkills || [];
    const profileSkillList = profile.skills.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
    const profileExperience = (profile.experience || []).join(' ').toLowerCase();
    const profileProjects = (profile.projects || []).join(' ').toLowerCase();
    const oppDesc = opportunity.description.toLowerCase();

    // 1. Skill Matching
    for (const req of oppSkills) {
      const reqL = req.toLowerCase();
      if (profileSkillList.includes(reqL)) {
        strongSkills.push(req);
      } else if (profileSkillList.some((s: string) => s.includes(reqL) || reqL.includes(s))) {
        moderateSkills.push(req);
      } else if (profileExperience.includes(reqL) || profileProjects.includes(reqL)) {
        // Not listed explicitly as a skill, but found in text
        moderateSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    }

    // 2. Identify Weak/Irrelevant user skills that don't match the opportunity
    for (const pSkill of profileSkillList) {
      if (!strongSkills.some((s: string) => s.toLowerCase() === pSkill) && 
          !moderateSkills.some((s: string) => s.toLowerCase() === pSkill) &&
          !oppDesc.includes(pSkill)) {
        weakSkills.push(pSkill);
      }
    }

    // 3. Readiness Score
    let readinessScore = 50;
    const matchRatio = oppSkills.length > 0 ? (strongSkills.length + (moderateSkills.length * 0.5)) / oppSkills.length : 1;
    readinessScore += (matchRatio * 30);
    
    if (clientIntel) {
      readinessScore += (clientIntel.trustScore / 100) * 10;
    }
    if (preferences.targetRate && opportunity.normalizedBudget) {
      if (opportunity.normalizedBudget >= preferences.targetRate) {
        readinessScore += 10;
      } else if (preferences.minRate && opportunity.normalizedBudget >= preferences.minRate) {
        readinessScore += 5;
      }
    }

    readinessScore = Math.min(100, Math.max(0, readinessScore));

    // 4. Rate Suggestion
    let suggestedRate = preferences.targetRate || null;
    if (opportunity.normalizedBudget && suggestedRate) {
       // if budget is higher, suggest up to budget
       if (opportunity.normalizedBudget > suggestedRate) {
         suggestedRate = opportunity.normalizedBudget;
       }
       // if budget is lower, don't drop below minRate
       if (opportunity.normalizedBudget < suggestedRate && preferences.minRate && opportunity.normalizedBudget >= preferences.minRate) {
         suggestedRate = opportunity.normalizedBudget;
       }
    }

    return {
      strongSkills,
      moderateSkills,
      weakSkills,
      missingSkills,
      readinessScore,
      suggestedRate
    };
  }
}
