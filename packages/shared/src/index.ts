// Shared types for Kerzz AI

export interface Document {
  id: string;
  text: string;
  metadata?: DocumentMetadata;
}

export interface DocumentMetadata {
  category?: string;
  product?: 'kerzz-pos' | 'kerzz-cloud' | 'genel';
  filename?: string;
  chunkIndex?: number;
  totalChunks?: number;
  tags?: string[];
  createdAt?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  answer: string;
  sources: Array<{
    text: string;
    score: number;
    metadata?: DocumentMetadata;
  }>;
  confidence: 'low' | 'medium' | 'high';
}

export interface SearchResult {
  text: string;
  score: number;
  metadata?: DocumentMetadata;
}

export const PRODUCTS = [
  { value: 'kerzz-pos', label: 'Kerzz POS' },
  { value: 'kerzz-cloud', label: 'Kerzz Cloud' },
  { value: 'genel', label: 'Genel' },
] as const;

export const CATEGORIES = [
  'donanım',
  'yazıcı',
  'menü',
  'raporlar',
  'rezervasyon',
  'giriş',
  'ödeme',
  'entegrasyon',
  'diğer',
] as const;
