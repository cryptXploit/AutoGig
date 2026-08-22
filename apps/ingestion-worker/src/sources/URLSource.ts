import { OpportunitySource, RawOpportunity } from '@autogig/core';
import dns from 'dns/promises';
import http from 'http';
import https from 'https';

export class URLSource implements OpportunitySource {
  name = 'url-source';
  private targetUrl: string;

  constructor(targetUrl: string) {
    this.targetUrl = targetUrl;
  }

  private isPrivateIP(ip: string): boolean {
    if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) return true;
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    const [a, b] = parts.map(Number);
    if (a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return true;
    if (a === 0 || a === 169 || a === 224 || a === 240 || a === 255) return true; // Multicast, link-local, broadcast
    return false;
  }

  public async fetchSafe(urlStr: string, redirects = 0): Promise<string> {
    if (redirects > 5) throw new Error('Too many redirects');
    
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr);
    } catch {
      throw new Error('Invalid URL');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }

    const hostname = parsedUrl.hostname;
    const addresses = await dns.lookup(hostname);
    if (this.isPrivateIP(addresses.address)) {
      throw new Error('SSRF blocked: Private IP address');
    }

    return new Promise((resolve, reject) => {
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = client.request(parsedUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'Autogig/1.0', 'Host': hostname },
        timeout: 5000,
        lookup: (hostname, options, callback) => {
          if (options.all) {
            callback(null, [{ address: addresses.address, family: addresses.family }]);
          } else {
            callback(null, addresses.address, addresses.family);
          }
        }
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          return resolve(this.fetchSafe(nextUrl, redirects + 1));
        }
        
        if (res.statusCode !== 200) {
          return reject(new Error(`Status ${res.statusCode}`));
        }
        
        const contentType = res.headers['content-type'] || '';
        if (!contentType.includes('text/') && !contentType.includes('application/json')) {
           return reject(new Error('Unsupported content type'));
        }

        const contentLength = res.headers['content-length'];
        if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
           return reject(new Error('Response too large'));
        }

        let body = '';
        let bytesRead = 0;
        const limit = 1024 * 1024; // 1MB limit

        res.on('data', chunk => {
          bytesRead += chunk.length;
          if (bytesRead > limit) {
             res.destroy();
             reject(new Error('Stream exceeded size limit'));
             return;
          }
          body += chunk.toString('utf-8');
        });

        res.on('end', () => {
          resolve(body);
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.end();
    });
  }

  async fetch(): Promise<RawOpportunity[]> {
    try {
      const body = await this.fetchSafe(this.targetUrl);
      return []; // Real parsing omitted for demo
    } catch (e: any) {
      console.error(`[URLSource] Error: ${e.message}`);
      return [];
    }
  }
}
