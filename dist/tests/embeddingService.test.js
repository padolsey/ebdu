import embeddingsService from '../services/embeddingsService';
import { s3Service } from '../services/s3Service';
import { cacheService } from '../services/cacheService';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { hashUtil } from '../utils/hashUtil';
jest.setTimeout(30000);
const __dirname = process.cwd();
describe('EmbeddingsService', () => {
    beforeAll(async () => {
        // Clear any existing data
        await s3Service.deleteAllData();
        cacheService.clearAll();
        embeddingsService['embeddingPromises'].clear();
    });
    afterAll(async () => {
        // Clean up
        await s3Service.deleteAllData();
        const testDocumentsDir = path.resolve(__dirname, 'test_documents');
        if (fs.existsSync(testDocumentsDir)) {
            fs.rmSync(testDocumentsDir, { recursive: true, force: true });
        }
    });
    test('should return "embedding" progress when embeddings are not yet available', async () => {
        const documentUrls = ['https://blog.j11y.io/2023-12-13_akihabaras_ai/'];
        const tokens = 1000;
        const n = 3;
        const query = 'test query';
        const result = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
        expect(result.progress).toBe('embedding');
        expect(result.results).toHaveLength(0);
    });
    test('should eventually return "finished_embedding" after embeddings are created', async () => {
        const documentUrls = ['https://blog.j11y.io/2023-12-13_akihabaras_ai/'];
        const tokens = 500;
        const n = 3;
        const query = 'test query';
        const documentsHash = hashUtil.hashDocumentUrls(documentUrls);
        // Start the embedding process
        const initialResult = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
        expect(initialResult.progress).toBe('embedding');
        // Wait for the embedding process to complete
        const embeddingPromise = embeddingsService['embeddingPromises'].get(documentsHash);
        expect(embeddingPromise).toBeDefined();
        if (embeddingPromise) {
            await embeddingPromise;
        }
        // Now, handleSearch should return 'finished_embedding'
        const finalResult = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
        expect(finalResult.progress).toBe('finished_embedding');
        expect(finalResult.results.length).toBeGreaterThan(0);
    });
    test('should handle search when embeddings exist', async () => {
        const documentUrls = [
            // one slash is resolve path starts in slash
            'file://' + path.resolve(__dirname, 'test_documents/doc1.txt')
        ];
        const tokens = 1000;
        const n = 2;
        const query = 'Test query';
        // Prepare test document
        const testDocumentsDir = path.resolve(__dirname, 'test_documents');
        if (!fs.existsSync(testDocumentsDir)) {
            fs.mkdirSync(testDocumentsDir);
        }
        const doc1Path = path.join(testDocumentsDir, 'doc1.txt');
        fs.writeFileSync(doc1Path, 'This is a test document content.');
        // Start the embedding process
        const initialResult = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
        expect(initialResult.progress).toBe('embedding');
        // Polling for embeddings to be ready
        let finalResult = null;
        const maxAttempts = 3;
        const delay = 500;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            const result = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
            console.log('result88888', result);
            if (result.progress === 'finished_embedding') {
                finalResult = result;
                break;
            }
        }
        expect(finalResult).not.toBeNull();
        if (finalResult) {
            expect(finalResult.progress).toBe('finished_embedding');
            expect(finalResult.results.length).toBeGreaterThan(0);
            expect(finalResult.results[0]).toHaveProperty('documentUrl');
            expect(finalResult.results[0]).toHaveProperty('chunk');
        }
        else {
            fail('Embeddings were not created within the expected time.');
        }
    });
    test('should handle search when embeddings exist', async () => {
        const documentUrls = [
            'file://' + path.resolve(__dirname, 'test_documents/doc1.txt')
        ];
        const tokens = 1000;
        const n = 2;
        const query = 'Test query';
        // Prepare test document
        const testDocumentsDir = path.resolve(__dirname, 'test_documents');
        if (!fs.existsSync(testDocumentsDir)) {
            fs.mkdirSync(testDocumentsDir);
        }
        const doc1Path = path.join(testDocumentsDir, 'doc1.txt');
        fs.writeFileSync(doc1Path, 'This is a test document content.');
        // Ensure embeddings are created
        await embeddingsService.createEmbeddings(documentUrls, 'test_hash');
        const result = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
        expect(result.progress).toBe('finished_embedding');
        expect(result.results.length).toBeGreaterThan(0);
        expect(result.results[0]).toHaveProperty('documentUrl');
        expect(result.results[0]).toHaveProperty('chunk');
    });
    test('should handle search when embeddings do not exist', async () => {
        const documentUrls = [
            'file://' + path.resolve(__dirname, 'test_documents/doc2.txt')
        ];
        const tokens = 1000;
        const n = 2;
        const query = 'Test query';
        // Prepare test document
        const testDocumentsDir = path.resolve(__dirname, 'test_documents');
        if (!fs.existsSync(testDocumentsDir)) {
            fs.mkdirSync(testDocumentsDir);
        }
        const doc2Path = path.join(testDocumentsDir, 'doc2.txt');
        fs.writeFileSync(doc2Path, 'This is another test document content.');
        const initialResult = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
        expect(initialResult.progress).toBe('embedding');
        expect(initialResult.results).toHaveLength(0);
        // Polling for embeddings to be created
        let finalResult = null;
        const maxAttempts = 5;
        const delay = 300;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            const result = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
            if (result.progress === 'finished_embedding') {
                finalResult = result;
                break;
            }
        }
        expect(finalResult).not.toBeNull();
        if (finalResult) {
            expect(finalResult.progress).toBe('finished_embedding');
            expect(finalResult.results.length).toBeGreaterThan(0);
        }
        else {
            fail('Embeddings were not created within the expected time.');
        }
    });
    test('should handle search when embeddings do not exist', async () => {
        const documentUrls = [
            'file://test_documents/doc2.txt',
        ];
        const tokens = 1000;
        const n = 2;
        const query = 'Test query';
        // Prepare test document
        const testDocumentsDir = path.resolve(__dirname, 'test_documents');
        if (!fs.existsSync(testDocumentsDir)) {
            fs.mkdirSync(testDocumentsDir);
        }
        const doc2Path = path.join(testDocumentsDir, 'doc2.txt');
        fs.writeFileSync(doc2Path, 'This is another test document content.');
        const result = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
        expect(result.progress).toBe('embedding');
        expect(result.results).toHaveLength(0);
        // Wait for embeddings to be created
        // In a real-world scenario, you might poll or have a callback mechanism
        // For testing purposes, we'll wait for the embedding process to complete
        await embeddingsService.createEmbeddings(documentUrls, 'test_hash_2');
        const resultAfterEmbedding = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
        expect(resultAfterEmbedding.progress).toBe('finished_embedding');
        expect(resultAfterEmbedding.results.length).toBeGreaterThan(0);
    });
    test('should handle errors during embedding process', async () => {
        const documentUrls = [
            'file://test_documents/non_existent.txt',
        ];
        const tokens = 1000;
        const n = 2;
        const query = 'Test query';
        const initialResult = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
        expect(initialResult.progress).toBe('embedding');
        // Polling for the error
        let finalResult = null;
        const maxAttempts = 3;
        const delay = 400;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            const result = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
            if (result.progress === 'error') {
                finalResult = result;
                break;
            }
        }
        expect(finalResult).not.toBeNull();
        if (finalResult && finalResult.progress === 'error') {
            expect(finalResult.error).toContain('Error during embedding');
        }
        else {
            fail('Expected an error during embedding process');
        }
    });
    test('should handle errors during document fetching', async () => {
        const documentUrls = ['http://invalid-url'];
        const tokens = 1000;
        const n = 2;
        const query = 'Test query';
        const result = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
        // Since the embedding process is asynchronous, we need to wait for it to complete
        expect(result.progress).toBe('embedding');
        // Polling for the error
        let finalResult = null;
        for (let i = 0; i < 5; i++) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
            const checkResult = await embeddingsService.handleSearch(documentUrls, tokens, n, query);
            console.log('checkResult', checkResult, checkResult.progress === 'error');
            if (checkResult.progress === 'error') {
                finalResult = checkResult;
                break;
            }
        }
        console.log('finalResult??', finalResult);
        expect(finalResult).not.toBeNull();
        if (finalResult && finalResult.progress === 'error') {
            expect(finalResult.error).toContain('Error during embedding');
        }
        else {
            fail('Expected an error during embedding process');
        }
    });
});
//# sourceMappingURL=embeddingService.test.js.map