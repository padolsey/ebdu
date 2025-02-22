import crypto from 'crypto';

class HashUtil {
  hashDocumentUrls(documentUrls: string[]): string {
    const concatenatedUrls = documentUrls.sort().join('|');
    return this.hashString(concatenatedUrls);
  }

  hashString(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}

export const hashUtil = new HashUtil();
