import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class EvidenceIngester {
  constructor(private evidenceRepo: import('@autogig/core').EvidenceRepository, private baseDir: string) {}

  async ingestAll(): Promise<void> {
    if (!fs.existsSync(this.baseDir)) return;
    const files = fs.readdirSync(this.baseDir);
    for (const file of files) {
      await this.ingestFile(path.join(this.baseDir, file));
    }
  }

  async ingestFile(filePath: string): Promise<void> {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return;

    const originalFilename = path.basename(filePath);
    const ext = path.extname(originalFilename).toLowerCase();
    
    let type: 'TEXT' | 'PDF' | 'IMAGE' | 'LINK' = 'TEXT';
    let mimeType = 'text/plain';
    if (ext === '.pdf') { type = 'PDF'; mimeType = 'application/pdf'; }
    if (ext === '.png' || ext === '.jpg') { type = 'IMAGE'; mimeType = 'image/jpeg'; }
    if (ext === '.json') { type = 'TEXT'; mimeType = 'application/json'; }

    const id = `ev-${crypto.createHash('md5').update(filePath).digest('hex')}`;
    
    // Check if exists
    const existing = await this.evidenceRepo.findById(id);
    if (existing) return;

    let extractedText = '';
    let extractionStatus: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';
    
    try {
       if (type === 'TEXT') {
         extractedText = fs.readFileSync(filePath, 'utf-8');
         extractionStatus = 'SUCCESS';
       } else {
         // Placeholder for PDF/Image extraction
         extractionStatus = 'FAILED'; 
       }
    } catch (e) {
       extractionStatus = 'FAILED';
    }

    
    let extractionError = undefined;
    if (extractionStatus === 'FAILED') extractionError = type === 'TEXT' ? 'Read Error' : 'No native extraction library available';
    const record: import('@autogig/core').Evidence = {
      id,
      userId: 'u1',
      type,
      storageKey: filePath,
      createdAt: new Date(),
      metadata: {
        originalFilename,
        mimeType,
        extractedText,
        extractedFacts: [],
        relevantSkills: [],
        confidence: extractionStatus === 'SUCCESS' ? 1.0 : 0.0,
        extractionStatus,
        extractionError
      }
    };


    await this.evidenceRepo.save(record);
  }
}
