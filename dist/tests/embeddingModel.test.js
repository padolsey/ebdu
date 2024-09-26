import { embeddingModel } from '../services/embeddingModel';
import { jest } from '@jest/globals';
jest.setTimeout(30000);
describe('EmbeddingModel', () => {
    beforeAll(async () => {
        await embeddingModel.loadModel();
    });
    test('should create embeddings for given text chunks', async () => {
        const chunks = [
            {
                documentUrl: 'http://example.com/doc1',
                documentUrlHash: 'hash1',
                chunk: 'This is a test chunk.',
                percentThroughDocument: 50,
                chunkIndex: 0,
            },
            {
                documentUrl: 'http://example.com/doc2',
                documentUrlHash: 'hash2',
                chunk: 'Another test chunk.',
                percentThroughDocument: 75,
                chunkIndex: 0,
            },
        ];
        const embeddings = await embeddingModel.createEmbeddings(chunks);
        expect(embeddings).toHaveLength(2);
        embeddings.forEach((embeddingResult) => {
            expect(embeddingResult.embedding).toBeInstanceOf(Array);
            expect(embeddingResult.embedding.length).toBeGreaterThan(0);
        });
    });
    test('should create query embedding', async () => {
        const query = 'Test query string';
        const embedding = await embeddingModel.createQueryEmbedding(query);
        expect(embedding).toBeInstanceOf(Array);
        expect(embedding.length).toBeGreaterThan(0);
    });
});
//======== END: ./src/tests/embeddingModel.test.ts ========//
//# sourceMappingURL=embeddingModel.test.js.map