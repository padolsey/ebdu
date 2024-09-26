import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import { StorageService } from './storageService';
import { EmbeddingResult } from '../types';

dotenv.config();

AWS.config.update({
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

class S3RemoteService implements StorageService {
  async saveEmbeddings(documentsHash: string, embeddings: EmbeddingResult[]) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `embeddings/${documentsHash}.json`,
      Body: JSON.stringify(embeddings),
      ContentType: 'application/json'
    };

    await s3.putObject(params).promise();
  }

  async getEmbeddings(documentsHash: string): Promise<EmbeddingResult[] | null> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `embeddings/${documentsHash}.json`
    };

    try {
      const data = await s3.getObject(params).promise();
      if (data.Body) {
        const embeddings = JSON.parse(data.Body.toString('utf-8'));
        return embeddings;
      } else {
        return null;
      }
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        return null;
      } else {
        throw error;
      }
    }
  }

  async saveTextChunk(documentUrlHash: string, chunkIndex: number, text: string) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `text_chunks/${documentUrlHash}/chunk${chunkIndex}.txt`,
      Body: text,
      ContentType: 'text/plain'
    };

    await s3.putObject(params).promise();
  }

  async getTextChunk(documentUrlHash: string, chunkIndex: number): Promise<string | null> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `text_chunks/${documentUrlHash}/chunk${chunkIndex}.txt`
    };

    try {
      const data = await s3.getObject(params).promise();
      if (data.Body) {
        return data.Body.toString('utf-8');
      } else {
        return null;
      }
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        return null;
      } else {
        throw error;
      }
    }
  }

  async deleteAllData() {
    // No operation needed for S3RemoteService
  }
}

export const s3RemoteService = new S3RemoteService();
