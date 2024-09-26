//======== START: ./src/tests/hashUtil.test.ts ========//
import { hashUtil } from '../utils/hashUtil';

describe('HashUtil', () => {
  test('should produce consistent hash for the same document URLs', () => {
    const urls = ['http://example.com/doc1', 'http://example.com/doc2'];
    const hash1 = hashUtil.hashDocumentUrls(urls);
    const hash2 = hashUtil.hashDocumentUrls(urls);

    expect(hash1).toBe(hash2);
  });

  test('should produce different hashes for different document URLs', () => {
    const urls1 = ['http://example.com/doc1', 'http://example.com/doc2'];
    const urls2 = ['http://example.com/doc1', 'http://example.com/doc3'];
    const hash1 = hashUtil.hashDocumentUrls(urls1);
    const hash2 = hashUtil.hashDocumentUrls(urls2);

    expect(hash1).not.toBe(hash2);
  });
});
//======== END: ./src/tests/hashUtil.test.ts ========//
