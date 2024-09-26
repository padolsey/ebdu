// src/services/__mocks__/embeddingModel.ts
export const embeddingModel = {
    loadModel: jest.fn(),
    createEmbeddings: jest.fn(async (chunks) => {
        console.log('Creating fake embeddings');
        // Return fake embeddings
        return chunks.map((chunk) => ({
            documentUrl: chunk.documentUrl,
            chunk: chunk.chunk,
            percentThroughDocument: chunk.percentThroughDocument,
            embedding: new Array(512).fill(0.1), // Fake embedding vector
        }));
    }),
    createQueryEmbedding: jest.fn(async (query) => {
        // Return a fake embedding vector
        return new Array(512).fill(0.1);
    }),
};
//# sourceMappingURL=embeddingModel.js.map