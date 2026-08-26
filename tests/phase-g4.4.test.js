const { ApplicationIntelligenceEngine } = require('../packages/engine/dist/ai/ApplicationIntelligenceEngine');
const { RelevanceEngine } = require('../packages/engine/dist/ai/RelevanceEngine');
const { MockAIProvider } = require('../packages/ai/dist/providers/MockAIProvider');

async function runG44Tests() {
  console.log("Running G4.4 Relevance & Application Intelligence Tests...");

  const engine = new RelevanceEngine();

  const mockOpp = {
    id: 'opp-1',
    title: 'Senior Software Engineer',
    description: 'Looking for a TypeScript and Node.js expert with Kubernetes experience. Some Python is nice.',
    normalizedSkills: ['typescript', 'node.js', 'kubernetes', 'python'],
    normalizedBudget: 150
  };

  const mockProfile = {
    userId: 'u1',
    skills: ['typescript', 'node.js', 'react', 'aws'],
    experience: ['Built massive node.js services'],
    projects: ['Deployed a kubernetes cluster for fun']
  };

  const mockPref = {
    targetRate: 100,
    minRate: 80
  };

  // Test 1: Relevance Match
  const rel = engine.analyze(mockOpp, mockProfile, mockPref, { trustScore: 90 });
  console.log("Strong:", rel.strongSkills);
  console.log("Moderate:", rel.moderateSkills);
  console.log("Missing:", rel.missingSkills);
  console.log("Weak/Irrelevant:", rel.weakSkills);

  if (!rel.strongSkills.includes('typescript')) throw new Error("Expected typescript to be strong match");
  if (!rel.moderateSkills.includes('kubernetes')) throw new Error("Expected kubernetes to be moderate match based on projects");
  if (!rel.missingSkills.includes('python')) throw new Error("Expected python to be missing");
  if (!rel.weakSkills.includes('aws')) throw new Error("Expected aws to be weak");
  
  if (rel.suggestedRate !== 150) throw new Error("Expected suggested rate to match budget since it's > targetRate");

  // Test 2: AI Orchestration (Truth / Evidence Gate)
  const aiProvider = new MockAIProvider();
  const appEngine = new ApplicationIntelligenceEngine(aiProvider);
  
  const result = await appEngine.generate({
    opportunity: mockOpp,
    profile: mockProfile,
    preferences: mockPref,
    evidence: [],
    evaluation: {}
  }, null);

  if (result.missingRequirements.length !== 1 || result.missingRequirements[0] !== 'python') {
     throw new Error("Application Intel should explicitly mark python as missing");
  }

  const hasPython = result.tailoredResume.skills.find(s => s.skill === 'python');
  if (hasPython) {
     throw new Error("AI should NOT invent Python skill in tailored resume");
  }

  // Find typescript in tailored
  const ts = result.tailoredResume.skills.find(s => s.skill === 'typescript');
  if (!ts || !ts.emphasis) {
     throw new Error("TypeScript should be explicitly emphasized");
  }

  console.log("✅ Phase G4.4 Tests Passed!");
}

runG44Tests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
