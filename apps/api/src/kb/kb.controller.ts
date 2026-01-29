import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { KBService } from './kb.service';

@Controller('kb')
export class KBController {
  constructor(private readonly kbService: KBService) {}

  /**
   * Get all KB documents
   */
  @Get()
  getAllDocuments() {
    return this.kbService.getAllDocuments();
  }

  /**
   * Get KB statistics
   */
  @Get('stats')
  getStats() {
    return this.kbService.getStats();
  }

  /**
   * Get single document by ID
   */
  @Get(':id')
  getDocumentById(@Param('id') id: string) {
    const doc = this.kbService.getDocumentById(id);
    if (!doc) {
      return { error: 'Document not found', id };
    }
    return doc;
  }

  /**
   * Search KB documents by metadata filters
   */
  @Post('search')
  searchDocuments(@Body() filters: {
    lang?: string;
    docType?: string;
    module?: string;
    role?: string;
    priority?: string;
    tags?: string[];
    intent?: string;
  }) {
    return this.kbService.searchDocuments(filters);
  }

  /**
   * Find relevant documents using semantic search
   */
  @Post('find')
  async findRelevantDocuments(@Body() body: {
    query: string;
    filters?: {
      lang?: string;
      docType?: string;
      module?: string;
      role?: string;
    };
    limit?: number;
  }) {
    return this.kbService.findRelevantDocuments(
      body.query,
      body.filters,
      body.limit || 5
    );
  }

  /**
   * Sync all KB documents to vector store
   */
  @Post('sync')
  async syncToVectorStore() {
    return this.kbService.syncToVectorStore();
  }

  /**
   * Reload KB from filesystem
   */
  @Post('reload')
  reloadKB() {
    return this.kbService.reload();
  }

  /**
   * Create new KB document
   */
  @Post('create')
  async createDocument(@Body() body: {
    metadata: {
      title: string;
      lang?: string;
      docType?: string;
      intent?: string;
      role?: string;
      product?: string;
      module: string;
      tags?: string[];
      priority?: string;
      [key: string]: any;
    };
    content: string;
  }) {
    return this.kbService.createDocument(body.metadata, body.content);
  }

  /**
   * Update KB document
   */
  @Post(':id/update')
  async updateDocument(
    @Param('id') id: string,
    @Body() body: {
      metadata: {
        title?: string;
        module?: string;
        intent?: string;
        role?: string;
        tags?: string[];
        priority?: string;
        [key: string]: any;
      };
      content: string;
    }
  ) {
    return this.kbService.updateDocument(id, body.metadata, body.content);
  }

  /**
   * Delete KB document
   */
  @Post(':id/delete')
  async deleteDocument(@Param('id') id: string) {
    return this.kbService.deleteDocument(id);
  }

  /**
   * Upload markdown file
   */
  @Post('upload')
  async uploadMarkdownFile(@Body() body: {
    filename: string;
    content: string;
  }) {
    return this.kbService.uploadMarkdownFile(body.filename, body.content);
  }
}
