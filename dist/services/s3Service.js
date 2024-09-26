import { localStorageService } from './localStorageService';
import { s3RemoteService } from './s3RemoteService';
import dotenv from 'dotenv';
dotenv.config();
const isTestMode = process.env.NODE_ENV === 'test';
class S3Service {
    constructor() {
        this.service = isTestMode ? localStorageService : s3RemoteService;
    }
    async saveEmbeddings(documentsHash, embeddings) {
        return this.service.saveEmbeddings(documentsHash, embeddings);
    }
    async getEmbeddings(documentsHash) {
        return this.service.getEmbeddings(documentsHash);
    }
    async saveTextChunk(documentUrlHash, chunkIndex, text) {
        return this.service.saveTextChunk(documentUrlHash, chunkIndex, text);
    }
    async getTextChunk(documentUrlHash, chunkIndex) {
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
//# sourceMappingURL=s3Service.js.map