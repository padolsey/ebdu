
// import pkg from 'tesseract.js';
// const { recognize } = pkg;
import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import puppeteer from 'puppeteer';
import PDFParser from 'pdf2json';

class PDFParserClass {
  private extractionMethods: Array<(buffer: Buffer) => Promise<string>>;

  constructor() {
    this.extractionMethods = [
      // Method 1: Using `pdf-parse`
      async (buffer: Buffer) => {
        console.log('pdfParser: Debug: method 1');
        const data = await pdfParse(buffer);
        return data.text;
      },

      // Method 2: Using `pdf-lib`
      async (buffer: Buffer) => {
        console.log('pdfParser: Debug: method 2');
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();
        let textContent = '';

        for (const page of pages) {
          const { width, height } = page.getSize();
          // pdf-lib does not support getText. Consider using another library for text extraction.
          // textContent += page.getText() + '\n';
          // {{ Removed unsupported getText method }}
        }

        return textContent;
      },

      // Method 3: Using `pdf2json`
      async (buffer: Buffer) => {
        console.log('pdfParser: Debug: method 2 - pdf2json');
        const pdfParser = new PDFParser();

        return new Promise<string>((resolve, reject) => {
          pdfParser.on('pdfParser_dataError', (errData: any) => {
            console.error('pdf2json parsing error:', errData.parserError);
            reject(errData.parserError);
          });

          pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            // Extract text content from pdfData
            const rawTextContent = pdfParser.getRawTextContent();
            console.log('pdf2json extracted text length:', rawTextContent.length);
            resolve(rawTextContent);
          });

          // Parse the PDF buffer
          pdfParser.parseBuffer(buffer);
        });
      },

      // Method N: Using OCR with Tesseract.js
      async (buffer: Buffer) => {
        console.log('PDFParser: Using OCR with Tesseract.js');
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        const pdfContent = buffer.toString('base64');
        await page.goto(`data:application/pdf;base64,${pdfContent}`, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });
        const screenshotBuffer = await page.screenshot();
        await browser.close();
        // const { data } = await recognize(Buffer.from(screenshotBuffer));
        const { data } = await Tesseract.recognize(screenshotBuffer as any);
        return data.text;
      },
    ];
  }

  async parsePdf(buffer: Buffer): Promise<string> {
    for (const method of this.extractionMethods) {
      try {
        const text = await method(buffer);
        if (text && text.trim()) {
          return text;
        }
      } catch (error) {
        console.warn(
          'A PDF parsing method failed. Trying the next method...',
          String(error).slice(0, 500) + ' [... truncated ...]'
        );
      }
    }

    console.error('All PDF parsing methods failed.');
    return 'This PDF was unable to be parsed';
  }
}

export const pdfParser = new PDFParserClass();

//======== END: ./src/utils/pdfParser.ts ========//
