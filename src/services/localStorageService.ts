// src/services/localStorageService.ts
import fs from 'fs';
import path from 'path';
import { EmbeddingResult } from '../types';
import { StorageService } from './storageService';

const storageDir = path.join(process.cwd(), './local_storage');

class LocalStorageService implements StorageService {
  private storageDir: string = storageDir;

  constructor() {}

  private getFilePath(key: string): string {
    return path.join(this.storageDir, key);
  }

  async saveEmbeddings(documentsHash: string, embeddings: EmbeddingResult[]) {
    const filePath = this.getFilePath(`embeddings_${documentsHash}.json`);
    fs.writeFileSync(filePath, JSON.stringify(embeddings), 'utf-8');
  }

  async getEmbeddings(documentsHash: string): Promise<EmbeddingResult[] | null> {
    const filePath = this.getFilePath(`embeddings_${documentsHash}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const embeddings = JSON.parse(data);
      return embeddings;
    } else {
      return null;
    }
  }

  async saveTextChunk(documentUrlHash: string, chunkIndex: number, text: string) {
    const textChunkDirPath = this.getFilePath(`text_chunks_${documentUrlHash}`);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir);
    }
    if (!fs.existsSync(textChunkDirPath)) {
      fs.mkdirSync(textChunkDirPath);
    }
    const filePath = path.join(textChunkDirPath, `chunk${chunkIndex}.txt`);
    fs.writeFileSync(filePath, text, 'utf-8');
  }

  async getTextChunk(documentUrlHash: string, chunkIndex: number): Promise<string | null> {
    const filePath = path.join(this.getFilePath(`text_chunks_${documentUrlHash}`), `chunk${chunkIndex}.txt`);
    if (fs.existsSync(filePath)) {
      const text = fs.readFileSync(filePath, 'utf-8');
      return text;
    } else {
      return null;
    }
  }

  async deleteAllData() {
    if (fs.existsSync(this.storageDir)) {
      fs.rmSync(this.storageDir, { recursive: true, force: true });
    }
  }
}

export const localStorageService = new LocalStorageService();
