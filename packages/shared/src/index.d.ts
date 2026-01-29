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
export declare const PRODUCTS: readonly [{
    readonly value: "kerzz-pos";
    readonly label: "Kerzz POS";
}, {
    readonly value: "kerzz-cloud";
    readonly label: "Kerzz Cloud";
}, {
    readonly value: "genel";
    readonly label: "Genel";
}];
export declare const CATEGORIES: readonly ["donanım", "yazıcı", "menü", "raporlar", "rezervasyon", "giriş", "ödeme", "entegrasyon", "diğer"];
