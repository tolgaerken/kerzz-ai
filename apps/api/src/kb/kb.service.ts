import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { VectorService } from '../vector/vector.service';

export interface KBMetadata {
  id: string;
  title: string;
  lang: string;
  docType: string;
  intent: string;
  role: string;
  product: string;
  module: string;
  version: { min: string | null; max: string | null };
  tags: string[];
  priority: string;
  updated_at: string;
  [key: string]: any;
}

export interface KBDocument {
  metadata: KBMetadata;
  content: string;
  filePath: string;
}

@Injectable()
export class KBService {
  private kbRoot: string;
  private documents: Map<string, KBDocument> = new Map();

  constructor(private vector: VectorService) {
    // Monorepo root'taki kb/ klasörüne bak (apps/api'den iki üst dizin)
    this.kbRoot = path.join(process.cwd(), '..', '..', 'kb');
    this.loadAllDocuments();
  }

  /**
   * Load all KB documents from filesystem
   * Scans entire kb/ directory recursively to support:
   * - Language-based structure: kb/tr/, kb/en/
   * - Module-based structure: kb/printing/, kb/payment/, etc.
   */
  private loadAllDocuments() {
    if (fs.existsSync(this.kbRoot)) {
      this.scanDirectory(this.kbRoot);
    }
    
    console.log(`✅ KB: Loaded ${this.documents.size} documents`);
  }

  /**
   * Recursively scan directory for .md files
   */
  private scanDirectory(dir: string) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        this.scanDirectory(fullPath);
      } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
        this.loadDocument(fullPath);
      }
    }
  }

  /**
   * Load single document and parse frontmatter
   */
  private loadDocument(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { metadata, body } = this.parseFrontmatter(content);
      
      if (!metadata || !metadata.id) {
        console.warn(`⚠️  KB: No valid metadata in ${filePath}`);
        return;
      }
      
      const doc: KBDocument = {
        metadata,
        content: body,
        filePath: path.relative(this.kbRoot, filePath),
      };
      
      this.documents.set(metadata.id, doc);
    } catch (error) {
      console.error(`❌ KB: Error loading ${filePath}:`, error.message);
    }
  }

  /**
   * Parse YAML frontmatter from markdown
   */
  private parseFrontmatter(content: string): { metadata: KBMetadata | null; body: string } {
    const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
    
    if (!match) {
      return { metadata: null, body: content };
    }
    
    try {
      const metadata = yaml.load(match[1]) as KBMetadata;
      const body = match[2].trim();
      return { metadata, body };
    } catch (error) {
      console.error('YAML parse error:', error.message);
      return { metadata: null, body: content };
    }
  }

  /**
   * Get all documents
   */
  getAllDocuments(): KBDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Get document by ID
   */
  getDocumentById(id: string): KBDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Search documents by filters
   */
  searchDocuments(filters: {
    lang?: string;
    docType?: string;
    module?: string;
    role?: string;
    priority?: string;
    tags?: string[];
    intent?: string;
  }): KBDocument[] {
    let results = this.getAllDocuments();
    
    if (filters.lang) {
      results = results.filter(d => d.metadata.lang === filters.lang);
    }
    
    if (filters.docType) {
      results = results.filter(d => d.metadata.docType === filters.docType);
    }
    
    if (filters.module) {
      results = results.filter(d => d.metadata.module === filters.module);
    }
    
    if (filters.role) {
      results = results.filter(d => d.metadata.role === filters.role);
    }
    
    if (filters.priority) {
      results = results.filter(d => d.metadata.priority === filters.priority);
    }
    
    if (filters.intent) {
      results = results.filter(d => d.metadata.intent === filters.intent);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(d => 
        filters.tags?.some(tag => d.metadata.tags?.includes(tag))
      );
    }
    
    // Sort by priority: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    results.sort((a, b) => {
      const aPriority = priorityOrder[a.metadata.priority] || 0;
      const bPriority = priorityOrder[b.metadata.priority] || 0;
      return bPriority - aPriority;
    });
    
    return results;
  }

  /**
   * Find relevant document by semantic search (using vector similarity)
   */
  async findRelevantDocuments(query: string, filters?: {
    lang?: string;
    docType?: string;
    module?: string;
    role?: string;
  }, limit = 5) {
    // First, filter by metadata
    const candidates = this.searchDocuments(filters || {});
    
    if (candidates.length === 0) {
      return [];
    }
    
    // Then, use vector similarity for ranking
    // We'll search using the query and filter results
    const searchResults = await this.vector.search(query, limit * 2);
    
    // Match vector results with KB documents
    const matched = searchResults
      .map(result => {
        const resultText = result.text as string;
        const resultId = (result.metadata as any)?.id;
        const doc = Array.from(this.documents.values()).find(d => 
          d.content.includes(resultText.substring(0, 100)) ||
          d.metadata.id === resultId
        );
        return doc ? { ...doc, score: result.score } : null;
      })
      .filter(d => d !== null)
      .slice(0, limit);
    
    return matched;
  }

  /**
   * Sync all KB documents to vector store
   */
  async syncToVectorStore() {
    console.log('🔄 Syncing KB to vector store...');
    
    const crypto = require('crypto');
    let synced = 0;
    
    for (const doc of this.documents.values()) {
      // Combine metadata and content for better retrieval
      const text = `${doc.metadata.title}\n\n${doc.content}`;
      const metadata = {
        ...doc.metadata,
        kb_type: 'knowledge_base',
        kb_path: doc.filePath,
        kb_original_id: doc.metadata.id, // Store original ID in metadata
      };
      
      // Use MD5 hash of original ID as vector store ID (to avoid special characters)
      const vectorId = crypto.createHash('md5').update(doc.metadata.id).digest('hex');
      
      try {
        await this.vector.addDocument(vectorId, text, metadata);
        synced++;
      } catch (error) {
        console.error(`❌ Failed to sync ${doc.metadata.id}:`, error.message);
      }
    }
    
    console.log(`✅ Synced ${synced}/${this.documents.size} documents to vector store`);
    return { synced, total: this.documents.size };
  }

  /**
   * Reload all documents from filesystem
   */
  reload() {
    this.documents.clear();
    this.loadAllDocuments();
    return { loaded: this.documents.size };
  }

  /**
   * Get statistics
   */
  getStats() {
    const docs = this.getAllDocuments();
    
    const byType = {};
    const byModule = {};
    const byLang = {};
    const byPriority = {};
    
    for (const doc of docs) {
      byType[doc.metadata.docType] = (byType[doc.metadata.docType] || 0) + 1;
      byModule[doc.metadata.module] = (byModule[doc.metadata.module] || 0) + 1;
      byLang[doc.metadata.lang] = (byLang[doc.metadata.lang] || 0) + 1;
      byPriority[doc.metadata.priority] = (byPriority[doc.metadata.priority] || 0) + 1;
    }
    
    return {
      total: docs.length,
      byType,
      byModule,
      byLang,
      byPriority,
    };
  }

  /**
   * Create new KB document
   */
  async createDocument(metadata: Partial<KBMetadata>, content: string) {
    // Generate slug from title
    const slug = metadata.title
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Generate ID
    const id = `kb_${metadata.lang}_${metadata.docType}_${slug}_v1`;
    
    // Set defaults
    const now = new Date().toISOString().split('T')[0];
    const fullMetadata: KBMetadata = {
      id,
      title: metadata.title || 'Untitled',
      lang: metadata.lang || 'tr',
      docType: metadata.docType || 'howto',
      intent: metadata.intent || slug || 'general',
      role: metadata.role || 'user',
      product: metadata.product || 'kerzz_pos',
      module: metadata.module || 'general',
      version: metadata.version || { min: null, max: null },
      tags: metadata.tags || [],
      priority: metadata.priority || 'medium',
      updated_at: now,
      ...metadata,
    };
    
    // Create file content with frontmatter
    const frontmatter = yaml.dump(fullMetadata);
    const fileContent = `---\n${frontmatter}---\n\n${content}`;
    
    // Determine file path
    const docTypeDir = fullMetadata.docType === 'release-note' ? 'release-notes' : fullMetadata.docType;
    const dir = path.join(this.kbRoot, fullMetadata.lang, docTypeDir);
    const filePath = path.join(dir, `${slug}.md`);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    // Load into memory
    this.loadDocument(filePath);
    
    // Add to vector store (use hash as ID to avoid special characters)
    const crypto = require('crypto');
    const vectorId = crypto.createHash('md5').update(id).digest('hex');
    const text = `${fullMetadata.title}\n\n${content}`;
    await this.vector.addDocument(vectorId, text, {
      ...fullMetadata,
      kb_type: 'knowledge_base',
      kb_path: path.relative(this.kbRoot, filePath),
      kb_original_id: id,
    });
    
    console.log(`✅ KB: Created ${id}`);
    
    return { id, filePath: path.relative(this.kbRoot, filePath) };
  }

  /**
   * Update KB document
   */
  async updateDocument(id: string, metadata: Partial<KBMetadata>, content: string) {
    const doc = this.documents.get(id);
    if (!doc) {
      throw new Error(`Document not found: ${id}`);
    }
    
    // Update metadata
    const now = new Date().toISOString().split('T')[0];
    const updatedMetadata: KBMetadata = {
      ...doc.metadata,
      ...metadata,
      id, // Keep original ID
      updated_at: now,
    };
    
    // Create updated file content
    const frontmatter = yaml.dump(updatedMetadata);
    const fileContent = `---\n${frontmatter}---\n\n${content}`;
    
    // Write to file
    const fullPath = path.join(this.kbRoot, doc.filePath);
    fs.writeFileSync(fullPath, fileContent, 'utf8');
    
    // Update in memory
    this.documents.set(id, {
      metadata: updatedMetadata,
      content,
      filePath: doc.filePath,
    });
    
    // Update vector store (use hash as ID)
    const crypto = require('crypto');
    const vectorId = crypto.createHash('md5').update(id).digest('hex');
    await this.vector.deleteDocument(vectorId);
    const text = `${updatedMetadata.title}\n\n${content}`;
    await this.vector.addDocument(vectorId, text, {
      ...updatedMetadata,
      kb_type: 'knowledge_base',
      kb_path: doc.filePath,
      kb_original_id: id,
    });
    
    console.log(`✅ KB: Updated ${id}`);
    
    return { id, filePath: doc.filePath };
  }

  /**
   * Delete KB document
   */
  async deleteDocument(id: string) {
    const doc = this.documents.get(id);
    if (!doc) {
      throw new Error(`Document not found: ${id}`);
    }
    
    // Delete file
    const fullPath = path.join(this.kbRoot, doc.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    // Remove from memory
    this.documents.delete(id);
    
    // Remove from vector store (use hash as ID)
    const crypto = require('crypto');
    const vectorId = crypto.createHash('md5').update(id).digest('hex');
    await this.vector.deleteDocument(vectorId);
    
    console.log(`✅ KB: Deleted ${id}`);
    
    return { id, deleted: true };
  }

  /**
   * Upload markdown file
   */
  async uploadMarkdownFile(filename: string, content: string) {
    // Parse frontmatter
    const { metadata, body } = this.parseFrontmatter(content);
    
    if (!metadata || !metadata.id) {
      throw new Error('Invalid markdown file: missing frontmatter or id');
    }
    
    // Determine file path from metadata
    const docTypeDir = metadata.docType === 'release-note' ? 'release-notes' : metadata.docType;
    const dir = path.join(this.kbRoot, metadata.lang, docTypeDir);
    const slug = metadata.id.split('_').slice(-2, -1)[0]; // Extract slug from id
    const filePath = path.join(dir, `${slug}.md`);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, content, 'utf8');
    
    // Load into memory
    this.loadDocument(filePath);
    
    // Add to vector store (use hash as ID)
    const crypto = require('crypto');
    const vectorId = crypto.createHash('md5').update(metadata.id).digest('hex');
    const text = `${metadata.title}\n\n${body}`;
    await this.vector.addDocument(vectorId, text, {
      ...metadata,
      kb_type: 'knowledge_base',
      kb_path: path.relative(this.kbRoot, filePath),
      kb_original_id: metadata.id,
    });
    
    console.log(`✅ KB: Uploaded ${metadata.id}`);
    
    return { id: metadata.id, filePath: path.relative(this.kbRoot, filePath) };
  }
}
