// src/services/chunkingService.ts
import { DocumentText, TextChunk } from '../types';
import { s3Service } from './s3Service';
import { hashUtil } from '../utils/hashUtil';

class ChunkingService {
  async splitDocuments(documents: DocumentText[]): Promise<TextChunk[]> {
    const chunks: TextChunk[] = [];
    const chunkSize = 6000; // Number of characters per chunk
    const overlap = 400;    // Overlap between chunks

    const promises: Promise<void>[] = [];

    console.log('documents', documents);
    for (const doc of documents) {
      console.log('ChunkingService: Splitting document', doc.url, doc.text?.length);
      const documentUrlHash = hashUtil.hashString(doc.url);

      const text = doc.text;
      const totalLength = text.length;
      let start = 0;
      let chunkIndex = 0;

      while (start < totalLength) {
        const end = Math.min(start + chunkSize, totalLength);
        const chunkText = text.substring(start, end);

        const percentThroughDocument = (end / totalLength) * 100;

        const chunk: TextChunk = {
          documentUrl: doc.url,
          documentUrlHash,
          chunk: chunkText,
          percentThroughDocument,
          chunkIndex,
        };

        chunks.push(chunk);

        // Save chunk asynchronously
        const savePromise = s3Service.saveTextChunk(
          documentUrlHash,
          chunkIndex,
          chunkText
        );
        promises.push(savePromise);

        // Update start position
        if (end >= totalLength) {
          // We've reached the end of the document
          break;
        }
        start += chunkSize - overlap;
        chunkIndex++;
      }
    }

    // Wait for all save operations to complete
    await Promise.all(promises);

    return chunks;
  }
}

export const chunkingService = new ChunkingService();
