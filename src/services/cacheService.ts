import NodeCache from 'node-cache';
import { EmbeddingResult } from '../types';
import { s3Service } from './s3Service';

class CacheService {
  private embeddingsCache = new NodeCache({ stdTTL: 3600 }); // Cache embeddings for 1 hour
  private embeddingInProgress = new Set<string>();
  private embeddingErrors = new Map<string, Error>(); // Map to store errors for document hashes

  async getEmbeddings(documentsHash: string): Promise<EmbeddingResult[] | null> {
    const embeddings = this.embeddingsCache.get<EmbeddingResult[]>(documentsHash);
    if (embeddings) {
      console.log('Cache hit for embeddings', documentsHash);
      return embeddings;
    } else {
      console.log('Cache miss for embeddings', documentsHash);
      // Try to load from S3
      const embeddingsFromS3 = await s3Service.getEmbeddings(documentsHash);
      if (embeddingsFromS3) {
        this.setEmbeddings(documentsHash, embeddingsFromS3);
        console.log('Embeddings loaded from S3', documentsHash, embeddingsFromS3?.length);
        return embeddingsFromS3;
      } else {
        console.log('No embeddings found in S3', documentsHash);
        return null;
      }
    }
  }

  setEmbeddings(documentsHash: string, embeddings: EmbeddingResult[]) {
    this.embeddingsCache.set(documentsHash, embeddings);
    // Clear any existing error for this hash
    this.embeddingErrors.delete(documentsHash);
  }

  isEmbeddingInProgress(documentsHash: string): boolean {
    return this.embeddingInProgress.has(documentsHash);
  }

  setEmbeddingInProgress(documentsHash: string) {
    this.embeddingInProgress.add(documentsHash);
    // Clear any existing error for this hash
    this.embeddingErrors.delete(documentsHash);
  }

  clearEmbeddingInProgress(documentsHash: string) {
    this.embeddingInProgress.delete(documentsHash);
  }

  // Implementing setEmbeddingError
  setEmbeddingError(documentsHash: string, error: Error) {
    this.embeddingErrors.set(documentsHash, error);
    // Ensure that embedding is not marked as in progress
    this.embeddingInProgress.delete(documentsHash);
    // Optionally, clear embeddings cache for this hash
    this.embeddingsCache.del(documentsHash);
  }

  getEmbeddingError(documentsHash: string): Error | null {
    return this.embeddingErrors.get(documentsHash) || null;
  }

  clearAll() {
    this.embeddingsCache.flushAll();
    this.embeddingInProgress.clear();
    this.embeddingErrors.clear();
  }
}

export const cacheService = new CacheService();
