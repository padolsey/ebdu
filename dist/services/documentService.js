import { textUtil } from '../utils/textUtil';
import { s3Service } from './s3Service';
import { hashUtil } from '../utils/hashUtil';
import fs from 'fs';
class DocumentService {
    async fetchDocuments(documentUrls) {
        const documents = [];
        for (const url of documentUrls) {
            const documentUrlHash = hashUtil.hashString(url);
            let textContent = await s3Service.getTextChunk(documentUrlHash, 0); // Check if already stored
            console.log('document url 77777', url);
            if (!textContent) {
                if (url.startsWith('file://')) {
                    // Read from local file system
                    const filePath = url.replace('file://', '');
                    textContent = fs.readFileSync(filePath, 'utf-8');
                }
                else {
                    // Fetch document
                    const response = await fetch(url);
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer
                    console.log('DocumentService: Fetched document', url, response.headers.get('content-type'));
                    console.log('DocumentService: Size', buffer.length);
                    // Extract text from buffer
                    textContent = await textUtil.extractTextFromBuffer(buffer, response.headers.get('content-type') || '');
                    console.log('DocumentService: Extracted text', textContent);
                }
                // Save text to local storage or S3
                await s3Service.saveTextChunk(documentUrlHash, 0, textContent);
            }
            documents.push({
                url,
                text: textContent,
            });
        }
        return documents;
    }
}
export const documentService = new DocumentService();
//# sourceMappingURL=documentService.js.map