import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs-node';
import { TextChunk, EmbeddingResult } from '../types';

if (tf.getBackend() !== 'tensorflow') {
  tf.setBackend('tensorflow');
}

class EmbeddingModel {
  private model: use.UniversalSentenceEncoder | null = null;

  async loadModel() {
    if (!this.model) {
      this.model = await use.load();
    }
  }

  async createEmbeddings(chunks: TextChunk[]): Promise<EmbeddingResult[]> {
    await this.loadModel();
  
    const embeddings: EmbeddingResult[] = [];
    const batchSize = 10; // Adjust based on your requirements
  
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      const batchTexts = batchChunks.map((chunk) => chunk.chunk);
  
      const embeddingTensor = await this.model!.embed(batchTexts);
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

  async createQueryEmbedding(query: string): Promise<number[]> {
    await this.loadModel();

    const embeddingTensor = await this.model!.embed(query);
    const embeddingArray = embeddingTensor.arraySync()[0];
    return embeddingArray;
  }
}

export const embeddingModel = new EmbeddingModel();
