const fs = require('fs');
let code = fs.readFileSync('e2e-test.js', 'utf8');
code = code.replace(/console\.log\('\/\/ Phase D Assertions\n/, '// Phase D Assertions\n');
code = code.replace(/console\.log\('Phase D E2E TEST PASSED!'\);'\);/g, "console.log('Phase D E2E TEST PASSED!');");

// Also check opp-demo-1 expStatus which was EVALUATING in Phase C but is now PENDING_APPROVAL in Phase D!
// We need to update the Phase C checks or remove them for opp-demo-1/4/6/7!
code = code.replace("{ id: 'opp-demo-1', expStatus: 'EVALUATING' }", "{ id: 'opp-demo-1', expStatus: 'PENDING_APPROVAL' }");
code = code.replace("{ id: 'opp-demo-4', expStatus: 'EVALUATING' }", "{ id: 'opp-demo-4', expStatus: 'PENDING_APPROVAL' }");
code = code.replace("{ id: 'opp-demo-6', expStatus: 'EVALUATING' }", "{ id: 'opp-demo-6', expStatus: 'PENDING_APPROVAL' }");
code = code.replace("{ id: 'opp-demo-7', expStatus: 'EVALUATING' }", "{ id: 'opp-demo-7', expStatus: 'PENDING_APPROVAL' }");

fs.writeFileSync('e2e-test.js', code);
