import { s3Service } from './s3Service';
import { documentService } from './documentService';
import { chunkingService } from './chunkingService';
import { hashUtil } from '../utils/hashUtil';
import { cacheService } from './cacheService';
import { embeddingModel } from './embeddingModel';
class EmbeddingsService {
    constructor() {
        this.documentService = documentService;
        this.embeddingPromises = new Map();
    }
    async handleSearch(documentUrls, tokens, n, query) {
        const documentsHash = hashUtil.hashDocumentUrls(documentUrls);
        const embeddingError = cacheService.getEmbeddingError(documentsHash);
        if (embeddingError) {
            return {
                progress: 'error',
                error: `Error during embedding: ${embeddingError.message}`,
                results: [],
            };
        }
        let embeddings = await cacheService.getEmbeddings(documentsHash);
        console.log('EmbeddingsService: Embeddings', documentsHash, embeddings?.length);
        if (!embeddings?.length) {
            if (!this.embeddingPromises.has(documentsHash)) {
                console.log('EmbeddingsService: Starting embedding process', documentsHash);
                const embeddingPromise = this.createEmbeddings(documentUrls, documentsHash)
                    .catch((error) => {
                    console.error(`Error creating embeddings for hash ${documentsHash}:`, error);
                    cacheService.setEmbeddingError(documentsHash, error);
                })
                    .finally(() => {
                    this.embeddingPromises.delete(documentsHash);
                    console.log(`Embedding process finalized for hash: ${documentsHash}`);
                });
                this.embeddingPromises.set(documentsHash, embeddingPromise);
            }
            else {
                console.log('EmbeddingsService: Embedding process already started', documentsHash);
            }
            // Return immediately with 'embedding' status
            return {
                progress: 'embedding',
                results: [],
            };
        }
        else {
            console.log('EmbeddingsService: Embeddings exist, proceeding to search', documentsHash);
        }
        // Embeddings exist, proceed to search
        const results = await this.searchEmbeddings(embeddings, query, n, tokens);
        return {
            progress: 'finished_embedding',
            results,
        };
    }
    async handleSearch1(documentUrls, tokens, n, query) {
        // Create a unique key for this combination of documents
        const documentsHash = hashUtil.hashDocumentUrls(documentUrls);
        // Check if there was an error during embedding
        const embeddingError = cacheService.getEmbeddingError(documentsHash);
        if (embeddingError) {
            return {
                progress: 'error',
                error: `Error during embedding: ${embeddingError.message}`,
                results: [],
            };
        }
        // Check if embeddings already exist for this document set
        let embeddings = await cacheService.getEmbeddings(documentsHash);
        if (!embeddings?.length) {
            // Start the embedding process and store the promise
            if (!this.embeddingPromises.has(documentsHash)) {
                console.log('EmbeddingsService: Starting embedding process', documentsHash);
                const embeddingPromise = this.createEmbeddings(documentUrls, documentsHash);
                this.embeddingPromises.set(documentsHash, embeddingPromise);
            }
            else {
                // Wait for the existing embedding promise to complete
                console.log('EmbeddingsService: Waiting for existing embedding promise', documentsHash);
                await this.embeddingPromises.get(documentsHash);
            }
            // After waiting, check again for embeddings or errors
            embeddings = await cacheService.getEmbeddings(documentsHash);
            const embeddingError = cacheService.getEmbeddingError(documentsHash);
            if (embeddingError) {
                return {
                    progress: 'error',
                    error: `Error during embedding: ${embeddingError.message}`,
                    results: [],
                };
            }
            if (!embeddings?.length) {
                // Return immediately with 'embedding' status
                return {
                    progress: 'embedding',
                    results: [],
                };
            }
        }
        else {
            console.log('EmbeddingsService: Embeddings exist, proceeding to search', documentsHash);
        }
        // Embeddings exist, proceed to search
        const results = await this.searchEmbeddings(embeddings, query, n, tokens);
        return {
            progress: 'finished_embedding',
            results,
        };
    }
    async createEmbeddings(documentUrls, documentsHash) {
        // Check if embeddings are already being created
        if (cacheService.isEmbeddingInProgress(documentsHash)) {
            console.log(`Embedding already in progress for hash: ${documentsHash}`);
            return;
        }
        console.log(`Starting embedding process for hash: ${documentsHash}`);
        cacheService.setEmbeddingInProgress(documentsHash);
        try {
            // Fetch and process documents
            console.log(`Fetching documents for URLs: ${documentUrls.join(', ')}`);
            const documentTexts = await documentService.fetchDocuments(documentUrls);
            console.log(`Successfully fetched ${documentTexts.length} documents`);
            // Split documents into chunks
            console.log('Splitting documents into chunks');
            const chunks = await chunkingService.splitDocuments(documentTexts);
            console.log(`Created ${chunks.length} chunks`);
            // Create embeddings for chunks
            console.log('Creating embeddings for chunks');
            const embeddings = await embeddingModel.createEmbeddings(chunks);
            console.log(`Successfully created ${embeddings.length} embeddings`);
            // Save embeddings and chunks to S3
            console.log(`Saving embeddings to S3 for hash: ${documentsHash}`);
            await s3Service.saveEmbeddings(documentsHash, embeddings);
            console.log('Embeddings saved to S3');
            // Save embeddings to cache
            console.log('Saving embeddings to cache');
            cacheService.setEmbeddings(documentsHash, embeddings);
            console.log('Embeddings saved to cache');
            console.log(`Embedding process completed for hash: ${documentsHash}`);
        }
        catch (error) {
            console.error(`Error creating embeddings for hash ${documentsHash}:`, error);
            // Set the error in cache
            cacheService.setEmbeddingError(documentsHash, error);
        }
        finally {
            cacheService.clearEmbeddingInProgress(documentsHash);
            // Remove the promise from the map when done
            this.embeddingPromises.delete(documentsHash);
            console.log(`Embedding process finalized for hash: ${documentsHash}`);
        }
    }
    async searchEmbeddings(embeddings, query, n, tokens) {
        // Create embedding for the query
        const queryEmbedding = await embeddingModel.createQueryEmbedding(query);
        // Calculate similarity between query embedding and document embeddings
        const similarities = embeddings.map((embedding, index) => {
            const similarity = this.cosineSimilarity(queryEmbedding, embedding.embedding);
            return {
                ...embedding,
                similarity
            };
        });
        // Sort by similarity
        similarities.sort((a, b) => b.similarity - a.similarity);
        // Take top N results
        const topResults = similarities.slice(0, n);
        // Assemble the results
        const results = topResults.map(result => {
            return {
                documentUrl: result.documentUrl,
                chunk: result.chunk,
                percentThroughDocument: result.percentThroughDocument,
                score: result.similarity
            };
        });
        return results;
    }
    cosineSimilarity(a, b) {
        const dotProduct = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
        const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (normA * normB);
    }
}
export default new EmbeddingsService();
//# sourceMappingURL=embeddingsService.js.map