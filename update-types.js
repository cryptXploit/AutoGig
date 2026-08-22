const fs = require('fs');
let code = fs.readFileSync('packages/core/src/types/index.ts', 'utf-8');

code = code.replace(
  "export interface Preference {",
  `export type ThemeSetting = 'SYSTEM' | 'LIGHT' | 'DARK' | 'HACKER';
export type LanguageSetting = 'EN' | 'BN';
export type StrictnessLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Preference {`
);

code = code.replace(
  "blockedClients?: string[];",
  `blockedClients?: string[];
  theme?: ThemeSetting;
  language?: LanguageSetting;
  reasoningDepth?: StrictnessLevel;
  proposalStrictness?: StrictnessLevel;
  evidenceStrictness?: StrictnessLevel;
  humanApprovalRequired?: boolean;
  learningEnabled?: boolean;
  refreshInterval?: number;`
);

fs.writeFileSync('packages/core/src/types/index.ts', code);
