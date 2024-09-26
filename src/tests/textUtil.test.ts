import { textUtil } from '../utils/textUtil';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TextUtil', () => {
  const testDocumentsDir = path.resolve(__dirname, 'test_documents');

  beforeAll(() => {
    if (!fs.existsSync(testDocumentsDir)) {
      fs.mkdirSync(testDocumentsDir);
    }
  });

  afterAll(() => {
    // Clean up test documents if necessary
  });

  test('should extract text from plain text file', async () => {
    const textContent = 'This is a test text file.';
    const filePath = path.join(testDocumentsDir, 'test.txt');
    fs.writeFileSync(filePath, textContent);

    const buffer = fs.readFileSync(filePath);
    const extractedText = await textUtil.extractTextFromBuffer(buffer, 'text/plain');

    expect(extractedText).toBe(textContent);
  });

  test('should extract text from HTML file', async () => {
    const htmlContent = '<html><body><p>This is a test HTML file.</p></body></html>';
    const filePath = path.join(testDocumentsDir, 'test.html');
    fs.writeFileSync(filePath, htmlContent);

    const buffer = fs.readFileSync(filePath);
    const extractedText = await textUtil.extractTextFromBuffer(buffer, 'text/html');

    expect(extractedText).toBe('This is a test HTML file.');
  });

  test('should extract text from PDF file using pdf2json', async () => {
    const pdfFilePath = path.join(testDocumentsDir, 'test.pdf');
    // Use a sample PDF file that you include in your test_documents directory
    // Ensure that the PDF contains known text content for assertion
    // For this example, let's assume we have a test.pdf file

    if (!fs.existsSync(pdfFilePath)) {
      // Skip the test if the PDF file is not available
      console.warn('PDF file not found, skipping test.');
      return;
    }

    const buffer = fs.readFileSync(pdfFilePath);
    const extractedText = await textUtil.extractTextFromBuffer(buffer, 'application/pdf');

    // Replace 'Expected text content' with the actual text you expect from test.pdf
    expect(extractedText).toContain('Expected text content');
  });

  test('should handle unsupported content types gracefully', async () => {
    const buffer = Buffer.from('Random binary data');
    const extractedText = await textUtil.extractTextFromBuffer(buffer, 'application/octet-stream');

    // Since the content type is unsupported, we might get back the raw text
    expect(extractedText).toBe('Random binary data');
  });
});
//======== END: ./src/tests/textUtil.test.ts ========//
