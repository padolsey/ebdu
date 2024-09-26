// src/utils/textUtil.ts

import { fileTypeFromBuffer } from 'file-type';
import mammoth from 'mammoth';
import xlsx from 'xlsx';
import pkg from 'tesseract.js';
const { recognize } = pkg;
import { JSDOM } from 'jsdom';
import sanitizeHtml from 'sanitize-html';
import { pdfParser } from './pdfParser';

class TextUtil {
  async extractTextFromBuffer(buffer: Buffer, contentType: string): Promise<string> {
    // Detect content type if missing or octet-stream
    if (!contentType || contentType === 'application/octet-stream') {
      const fileTypeResult = await fileTypeFromBuffer(buffer);
      contentType = fileTypeResult?.mime || 'application/octet-stream';
    }

    console.log('TextUtil: Content type', contentType);

    try {
      switch (contentType) {
        case 'text/html':
          return this.extractTextFromHTML(buffer);
        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
          return buffer.toString('utf-8');
        case 'application/pdf':
          return this.extractTextFromPDF(buffer);
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          return this.extractTextFromExcel(buffer);
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractTextFromWord(buffer);
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
        case 'image/bmp':
        case 'image/tiff':
          return await this.extractTextFromImage(buffer);
        default:
          // Attempt to treat it as text
          const txt = buffer.toString('utf-8');
          console.log('TextUtil: Text', txt.length);
          if (/<\/?body>|<\/?html>/i.test(txt)) {
            return this.extractTextFromHTML(Buffer.from(txt, 'utf-8'));
          }
          return txt;
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      return '';
    }
  }

  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    const text = await pdfParser.parsePdf(buffer);
    console.log('TextUtil: PDF text length', text.length);
    return text;
  }
  
  async extractTextFromWord(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    console.log('TextUtil: Word text', result.value.length);
    return result.value;
  }

  extractTextFromExcel(buffer: Buffer): string {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    let csvData = '';
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      csvData += xlsx.utils.sheet_to_csv(worksheet);
    });
    return csvData;
  }

  extractTextFromHTML(buffer: Buffer): string {
    const html = buffer.toString('utf-8');
    const sanitizedHtml = sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
      allowedAttributes: {
        a: ['href', 'name', 'title'],
        img: ['src', 'alt', 'title'],
      },
      textFilter: (text) => text.replace(/[\r\n]+/g, ' ').trim(),
    });
    const dom = new JSDOM(sanitizedHtml);
    return dom.window.document.body.textContent || '';
  }

  async extractTextFromImage(buffer: Buffer): Promise<string> {
    const { data: { text } } = await recognize(buffer);
    return text;
  }
}

export const textUtil = new TextUtil();
