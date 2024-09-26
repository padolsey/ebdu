import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs-node';
if (tf.getBackend() !== 'tensorflow') {
    tf.setBackend('tensorflow');
}
class EmbeddingModel {
    constructor() {
        this.model = null;
    }
    async loadModel() {
        if (!this.model) {
            this.model = await use.load();
        }
    }
    async createEmbeddings(chunks) {
        await this.loadModel();
        const embeddings = [];
        const batchSize = 10; // Adjust based on your requirements
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batchChunks = chunks.slice(i, i + batchSize);
            const batchTexts = batchChunks.map((chunk) => chunk.chunk);
            const embeddingTensor = await this.model.embed(batchTexts);
            const embeddingsArray = await embeddingTensor.array();
            embeddingTensor.dispose();
            embeddingsArray.forEach((embeddingArray, index) => {
                embeddings.push({
                    documentUrl: batchChunks[index].documentUrl,
                    chunk: batchChunks[index].chunk,
                    percentThroughDocument: batchChunks[index].percentThroughDocument,
                    embedding: embeddingArray,
                });
            });
        }
        return embeddings;
    }
    async createQueryEmbedding(query) {
        await this.loadModel();
        const embeddingTensor = await this.model.embed(query);
        const embeddingArray = embeddingTensor.arraySync()[0];
        return embeddingArray;
    }
}
export const embeddingModel = new EmbeddingModel();
//# sourceMappingURL=embeddingModel.js.map