const fs = require('fs');
let t = fs.readFileSync('scratch.txt', 'utf-8');
const obj = JSON.parse(t);
let content = obj.content || (obj.tool_calls && obj.tool_calls[0] && obj.tool_calls[0].args.CommandLine);
if (!content) content = JSON.stringify(obj);
const start = content.indexOf('"use client";');
const end = content.lastIndexOf("'@");
if (start !== -1) {
  let fileContent = content.substring(start, end !== -1 ? end : content.length);
  fileContent = fileContent.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"');
  fs.writeFileSync('apps/web-app/app/opportunity/[id]/page.tsx', fileContent);
  console.log('Restored!');
}
