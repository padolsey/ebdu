import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import embeddingsController from '../controllers/embeddingsController';
import { s3Service } from '../services/s3Service';
import { cacheService } from '../services/cacheService';

const app = express();
app.use(bodyParser.json());
app.get('/search', embeddingsController.search);

describe('EmbeddingsController', () => {
  beforeAll(async () => {
    // Clear any existing data
    await s3Service.deleteAllData();
    cacheService.clearAll();
  });

  test('should return 400 if required parameters are missing', async () => {
    const res = await request(app).get('/search');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('documentUrls and query are required');
  });

  test('should handle search request successfully', async () => {
    const res = await request(app)
      .get('/search')
      .query({
        documentUrls: 'file://test_documents/doc1.txt',
        query: 'Test query',
      });

    expect(res.status).toBe(200);
    expect(res.body.progress).toBeDefined();
  });

  test('should handle errors in the embeddings service after retrying', async () => {
    const res = await request(app)
      .get('/search')
      .query({
        documentUrls: 'file://test_documents/non_existent.txt',
        query: 'Test query',
      });

    // Assert that the initial response has a status code of 200 and no error
    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();

    // Wait for 500ms before retrying the same request
    // This gives the implementation time to establish that the file
    // does not exist.
    await new Promise(resolve => setTimeout(resolve, 500));

    const retryRes = await request(app)
      .get('/search')
      .query({
        documentUrls: 'file://test_documents/non_existent.txt',
        query: 'Test query',
      });

    // Assert that the retry response has a status code of 500 and an error message
    expect(retryRes.status).toBe(500);
    expect(retryRes.body.error).toContain('Error during embedding');
  });
});