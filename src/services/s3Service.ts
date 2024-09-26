// src/services/s3Service.ts
import { EmbeddingResult } from '../types';
import { localStorageService } from './localStorageService';
import { s3RemoteService } from './s3RemoteService';
import { StorageService } from './storageService';
import dotenv from 'dotenv';

dotenv.config();

const isTestMode = process.env.NODE_ENV === 'test';

class S3Service implements StorageService {
  private service: StorageService;

  constructor() {
    this.service = isTestMode ? localStorageService : s3RemoteService;
  }

  async saveEmbeddings(documentsHash: string, embeddings: EmbeddingResult[]) {
    return this.service.saveEmbeddings(documentsHash, embeddings);
  }

  async getEmbeddings(documentsHash: string): Promise<EmbeddingResult[] | null> {
    return this.service.getEmbeddings(documentsHash);
  }

  async saveTextChunk(documentUrlHash: string, chunkIndex: number, text: string) {
    return this.service.saveTextChunk(documentUrlHash, chunkIndex, text);
  }

  async getTextChunk(documentUrlHash: string, chunkIndex: number): Promise<string | null> {
    return this.service.getTextChunk(documentUrlHash, chunkIndex);
  }

  async deleteAllData() {
    console.log('S3Service: Deleting all data', this.service);
    if (this.service.deleteAllData) {
      return this.service.deleteAllData();
    }
  }
}

export const s3Service = new S3Service();
