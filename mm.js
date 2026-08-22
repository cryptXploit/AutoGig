const fs = require('fs');
let code = fs.readFileSync('packages/ai/src/PromptContextBuilder.ts', 'utf8');
if (!code.includes('buildMultimodalEvidenceContext')) {
    code = code.replace(
      "static buildEvidenceContext(evidence: EvidenceContext[]): string {",
      "static buildMultimodalEvidenceContext(evidence: EvidenceContext[]): any[] {\n    return evidence.map(e => ({\n      text: `[Evidence ID: ${e.evidenceId}]\\nSource: ${e.provenance}\\nFacts: ${(e.extractedFacts||[]).join(', ')}`,\n      media: e.storageKey?.startsWith('gs://') ? { url: e.storageKey } : undefined\n    })).filter(x => x !== undefined);\n  }\n\n  static buildEvidenceContext(evidence: EvidenceContext[]): string {"
    );
    fs.writeFileSync('packages/ai/src/PromptContextBuilder.ts', code);
}
