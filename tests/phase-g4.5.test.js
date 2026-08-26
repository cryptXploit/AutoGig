const { ConversationValidator } = require('../packages/engine/dist/ai/ConversationValidator.js');

const validator = new ConversationValidator();

const profile = { skills: ['Node.js', 'TypeScript', 'React'], userId: '1', name: 'Tester', resumeKey: '' };
const preferences = { minRate: 50, targetRate: 100, userId: '1', blockedClients: [], updatedAt: new Date() };

console.log("TEST 1: Valid message");
let result = validator.validate(
  { recommendedAction: 'SEND_REPLY', suggestedReply: 'I can help with Node.js.' },
  profile,
  preferences
);
console.assert(result.status === 'PASS', "Should pass");

console.log("TEST 2: Rate Violation");
result = validator.validate(
  { recommendedAction: 'NEGOTIATE', suggestedReply: 'I can do $40' },
  profile,
  preferences
);
console.assert(result.status === 'FAILED_RATE', "Should fail rate");

console.log("TEST 3: Skill Fabrication");
result = validator.validate(
  { recommendedAction: 'SEND_REPLY', suggestedReply: 'Yes, I am a kubernetes expert.' },
  profile,
  preferences
);
console.assert(result.status === 'FAILED_SKILL', "Should fail skill");
console.assert(result.blockedClaims.includes('kubernetes'), "Should block kubernetes");

console.log("ALL TESTS PASSED.");
