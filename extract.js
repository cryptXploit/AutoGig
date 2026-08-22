const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\omars\\.gemini\\antigravity\\brain\\ef7e1c75-d932-45b6-838a-b99808386dfd\\.system_generated\\logs\\transcript_full.jsonl', 'utf-8').split('\n');
let maxLen = 0;
let bestLine = '';
for (const line of lines) {
  if (line.includes('OpportunityDetail') && !line.includes('const searchStr') && line.includes('function')) {
    if (line.length > maxLen) { maxLen = line.length; bestLine = line; }
  }
}
fs.writeFileSync('D:\\Gemini-AI-Global-Hackathon\\scratch.txt', bestLine);
