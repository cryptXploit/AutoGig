import fs from 'fs';
import path from 'path';
import { ObjectStorage, StorageMetadata } from '@autogig/core';

export class LocalObjectStorage implements ObjectStorage {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  private resolveKey(key: string): string {
    // Path safety validation
    if (path.isAbsolute(key)) throw new Error('Absolute paths are not allowed');
    if (/^[A-Za-z]:\\/.test(key)) throw new Error('Windows drive paths are not allowed');
    if (key.startsWith('\\\\')) throw new Error('UNC paths are not allowed');
    if (key.includes('..')) throw new Error('Path traversal is not allowed');
    
    const finalPath = path.resolve(this.basePath, key);
    if (!finalPath.startsWith(this.basePath)) {
      throw new Error('Resolved path is outside the storage root');
    }
    return finalPath;
  }

  async put(key: string, data: Uint8Array | string): Promise<void> {
    const finalPath = this.resolveKey(key);
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.writeFileSync(finalPath, data);
  }

  async get(key: string): Promise<Uint8Array | string | null> {
    const finalPath = this.resolveKey(key);
    if (!fs.existsSync(finalPath)) return null;
    return new Uint8Array(fs.readFileSync(finalPath));
  }

  async delete(key: string): Promise<void> {
    const finalPath = this.resolveKey(key);
    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    }
  }

  async exists(key: string): Promise<boolean> {
    const finalPath = this.resolveKey(key);
    return fs.existsSync(finalPath);
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    const finalPath = this.resolveKey(key);
    if (!fs.existsSync(finalPath)) return null;
    const stats = fs.statSync(finalPath);
    return {
      size: stats.size,
      contentType: 'application/octet-stream', // Defaulting for local
      updatedAt: stats.mtime
    };
  }
}

