// src/services/storageService.ts
import { EmbeddingResult } from '../types';

export interface StorageService {
  saveEmbeddings(documentsHash: string, embeddings: EmbeddingResult[]): Promise<void>;
  getEmbeddings(documentsHash: string): Promise<EmbeddingResult[] | null>;
  saveTextChunk(documentUrlHash: string, chunkIndex: number, text: string): Promise<void>;
  getTextChunk(documentUrlHash: string, chunkIndex: number): Promise<string | null>;
  deleteAllData?(): Promise<void>; // Optional method
}
