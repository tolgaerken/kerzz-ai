import { Injectable } from '@nestjs/common';
import { VectorService } from '../vector/vector.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as XLSX from 'xlsx'; // Yeni eklenecek

@Injectable()
export class DocumentsService {
  constructor(private vector: VectorService) {}

  private generateId(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  async addDocument(text: string, metadata: Record<string, any> = {}) {
    const id = this.generateId(text);
    await this.vector.addDocument(id, text, metadata);
    return { id, text: text.substring(0, 100) + '...', metadata };
  }

  async addQA(
    question: string, 
    customerAnswer: string, 
    technicianAnswer: string,
    metadata: Record<string, any> = {}
  ) {
    // Combine question and answers for better retrieval
    const text = `Soru: ${question}\n\nMüşteri Cevabı: ${customerAnswer}\n\nTeknisyen Cevabı: ${technicianAnswer}`;
    const qaMetadata = {
      ...metadata,
      type: 'qa',
      question,
      customerAnswer,
      technicianAnswer,
    };
    const id = this.generateId(text);
    await this.vector.addDocument(id, text, qaMetadata);
    return { 
      id, 
      question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
      customerAnswer: customerAnswer.substring(0, 50) + '...',
      technicianAnswer: technicianAnswer.substring(0, 50) + '...',
      metadata: qaMetadata 
    };
  }

  async addBulkDocuments(docs: Array<{ text: string; metadata?: Record<string, any> }>) {
    const results: Array<{ id: string; text: string; metadata: Record<string, any> }> = [];
    for (const doc of docs) {
      const result = await this.addDocument(doc.text, doc.metadata || {});
      results.push(result);
    }
    return { added: results.length, documents: results };
  }

  async parseAndAddFile(buffer: Buffer, filename: string, mimeType: string) {
    let text = '';
    let frontMatterMetadata: Record<string, any> = {};
    
    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      const rawText = buffer.toString('utf-8');
      if (mimeType === 'text/markdown') {
        const parsed = this.extractFrontMatter(rawText);
        text = parsed.content;
        frontMatterMetadata = parsed.metadata;
      } else {
        text = rawText;
      }
    } else if (mimeType === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
      mimeType === 'application/vnd.ms-excel' // .xls
    ) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      text = XLSX.utils.sheet_to_txt(worksheet);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Split into chunks (simple splitting by paragraphs)
    const chunks = this.splitIntoChunks(text, 500);
    
    const results: Array<{ id: string; text: string; metadata: Record<string, any> }> = [];
    for (let i = 0; i < chunks.length; i++) {
      const result = await this.addDocument(chunks[i], {
        ...frontMatterMetadata,
        filename,
        chunkIndex: i,
        totalChunks: chunks.length,
      });
      results.push(result);
    }
    
    return {
      filename,
      chunks: chunks.length,
      documents: results,
    };
  }

  private splitIntoChunks(text: string, maxChunkSize: number): string[] {
    const paragraphs = text.split(/\n\n+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + para).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(c => c.length > 50); // Filter very short chunks
  }

  private extractFrontMatter(text: string): {
    content: string;
    metadata: Record<string, any>;
  } {
    if (!text.startsWith('---')) {
      return { content: text, metadata: {} };
    }

    const endIndex = text.indexOf('\n---', 3);
    if (endIndex === -1) {
      return { content: text, metadata: {} };
    }

    const yamlBlock = text.slice(3, endIndex).trim();
    const content = text.slice(endIndex + 4).trimStart();
    return { content, metadata: this.parseSimpleYaml(yamlBlock) };
  }

  private parseSimpleYaml(yamlText: string): Record<string, any> {
    const metadata: Record<string, any> = {};
    const stack: Array<{ indent: number; target: Record<string, any> }> = [
      { indent: -1, target: metadata },
    ];

    for (const line of yamlText.split('\n')) {
      if (!line.trim() || line.trim().startsWith('#')) {
        continue;
      }
      const indent = line.match(/^\\s*/)?.[0].length ?? 0;
      const trimmed = line.trim();
      const [rawKey, ...rest] = trimmed.split(':');
      if (!rawKey || rest.length === 0) {
        continue;
      }
      const key = rawKey.trim();
      const rawValue = rest.join(':').trim();

      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }

      const current = stack[stack.length - 1].target;
      if (rawValue === '') {
        current[key] = {};
        stack.push({ indent, target: current[key] });
        continue;
      }

      current[key] = this.parseYamlValue(rawValue);
    }

    return metadata;
  }

  private parseYamlValue(value: string): string | number | boolean | null {
    const trimmed = value.trim();
    if (trimmed === 'null') {
      return null;
    }
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
    if (/^-?\\d+(\\.\\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    if ((trimmed.startsWith('\"') && trimmed.endsWith('\"')) || (trimmed.startsWith(\"'\") && trimmed.endsWith(\"'\"))) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }

  async listDocuments(limit = 100, offset = 0) {
    return this.vector.listDocuments(limit, offset);
  }

  async deleteDocument(id: string) {
    return this.vector.deleteDocument(id);
  }

  async updateDocument(id: string, text: string, metadata: Record<string, any> = {}) {
    await this.vector.deleteDocument(id);
    const newId = this.generateId(text);
    await this.vector.addDocument(newId, text, metadata);
    return { id: newId, text: text.substring(0, 100) + '...', metadata };
  }

  async updateQA(
    id: string,
    question: string,
    customerAnswer: string,
    technicianAnswer: string,
    metadata: Record<string, any> = {}
  ) {
    await this.vector.deleteDocument(id);
    return this.addQA(question, customerAnswer, technicianAnswer, metadata);
  }
}
