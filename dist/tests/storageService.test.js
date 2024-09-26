//======== START: ./src/tests/storageService.test.ts ========//
import { localStorageService } from '../services/localStorageService';
import fs from 'fs';
import path from 'path';
describe('LocalStorageService', () => {
    const testDir = path.join(process.cwd(), './local_storage');
    beforeAll(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        fs.mkdirSync(testDir);
    });
    afterAll(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });
    test('should save and retrieve embeddings', async () => {
        const embeddings = [
            {
                documentUrl: 'http://example.com/doc1',
                chunk: 'Test chunk',
                percentThroughDocument: 50,
                embedding: [0.1, 0.2, 0.3],
            },
        ];
        const documentsHash = 'test_hash';
        await localStorageService.saveEmbeddings(documentsHash, embeddings);
        const retrievedEmbeddings = await localStorageService.getEmbeddings(documentsHash);
        expect(retrievedEmbeddings).toEqual(embeddings);
    });
    test('should save and retrieve text chunks', async () => {
        const documentUrlHash = 'doc_hash';
        const chunkIndex = 0;
        const text = 'Sample text chunk';
        await localStorageService.saveTextChunk(documentUrlHash, chunkIndex, text);
        const retrievedText = await localStorageService.getTextChunk(documentUrlHash, chunkIndex);
        expect(retrievedText).toBe(text);
    });
});
//======== END: ./src/tests/storageService.test.ts ========//
//# sourceMappingURL=storageService.test.js.map