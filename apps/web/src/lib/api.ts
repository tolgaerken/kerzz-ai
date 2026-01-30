import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface FunctionCallResult {
  name: string;
  args: Record<string, any>;
  result: {
    success: boolean;
    message: string;
    data?: Record<string, any>;
  };
}

export interface ChatResponse {
  action: 'ask_clarification' | 'answer' | 'create_ticket' | 'troubleshoot' | 'schedule_appointment' | 'escalate' | 'function_result' | 'get_printer_status' | 'send_test_print' | 'get_order_info' | 'cancel_order' | 'escalate_to_tech';
  answer: string;
  parameters?: {
    issue_type?: string;
    urgency?: 'low' | 'medium' | 'high';
    next_steps?: string[];
    suggested_solution?: string;
    suggested_logs?: string[];
    missing_info?: string[];
  };
  sources: Array<{ text: string; score: number }>;
  confidence: 'low' | 'medium' | 'high';
  functionCall?: FunctionCallResult;
}

export const documentsApi = {
  list: async (limit = 100, offset = 0) => {
    const { data } = await api.get<Document[]>('/documents', {
      params: { limit, offset },
    });
    return data;
  },

  add: async (text: string, metadata?: Record<string, any>) => {
    const { data } = await api.post('/documents', { text, ...metadata });
    return data;
  },

  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  addQA: async (
    question: string, 
    customerAnswer: string, 
    technicianAnswer: string,
    metadata?: { category?: string; tags?: string[] }
  ) => {
    const { data } = await api.post('/documents/qa', { 
      question, 
      customerAnswer, 
      technicianAnswer,
      ...metadata 
    });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/documents/${id}`);
    return data;
  },

  update: async (id: string, text: string, metadata?: Record<string, any>) => {
    const { data } = await api.post(`/documents/${id}`, { text, ...metadata });
    return data;
  },

  updateQA: async (
    id: string,
    question: string,
    customerAnswer: string,
    technicianAnswer: string,
    metadata?: { category?: string; tags?: string[] }
  ) => {
    const { data } = await api.post(`/documents/${id}/qa`, {
      question,
      customerAnswer,
      technicianAnswer,
      ...metadata,
    });
    return data;
  },
};

export const chatApi = {
  send: async (
    query: string, 
    mode: 'customer' | 'technician' = 'customer',
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<ChatResponse> => {
    const { data } = await api.post<ChatResponse>('/chat', { query, mode, history });
    return data;
  },

  sendStream: async (
    query: string,
    mode: 'customer' | 'technician' = 'customer',
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    onToken: (token: string) => void,
    onDone: (metadata: any) => void,
  ) => {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, mode, history }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'));

      for (const line of lines) {
        const data = line.replace('data:', '').trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'token') {
            onToken(parsed.content);
          } else if (parsed.type === 'done') {
            onDone(parsed);
          }
        } catch {}
      }
    }
  },

  search: async (query: string, limit = 5) => {
    const { data } = await api.get('/chat/search', {
      params: { q: query, limit },
    });
    return data;
  },
};

export interface KBDocument {
  metadata: {
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
  };
  content: string;
  filePath: string;
}

export interface KBStats {
  total: number;
  byType: Record<string, number>;
  byModule: Record<string, number>;
  byLang: Record<string, number>;
  byPriority: Record<string, number>;
}

export const kbApi = {
  list: async () => {
    const { data } = await api.get<KBDocument[]>('/kb');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<KBDocument>(`/kb/${id}`);
    return data;
  },

  stats: async () => {
    const { data } = await api.get<KBStats>('/kb/stats');
    return data;
  },

  search: async (filters: {
    lang?: string;
    docType?: string;
    module?: string;
    role?: string;
    priority?: string;
    tags?: string[];
    intent?: string;
  }) => {
    const { data } = await api.post<KBDocument[]>('/kb/search', filters);
    return data;
  },

  find: async (query: string, filters?: {
    lang?: string;
    docType?: string;
    module?: string;
    role?: string;
  }, limit = 5) => {
    const { data } = await api.post<KBDocument[]>('/kb/find', { query, filters, limit });
    return data;
  },

  sync: async () => {
    const { data } = await api.post('/kb/sync');
    return data;
  },

  reload: async () => {
    const { data } = await api.post('/kb/reload');
    return data;
  },

  create: async (metadata: {
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
  }, content: string) => {
    const { data } = await api.post('/kb/create', { metadata, content });
    return data;
  },

  update: async (id: string, metadata: {
    title?: string;
    module?: string;
    intent?: string;
    role?: string;
    tags?: string[];
    priority?: string;
    [key: string]: any;
  }, content: string) => {
    const { data } = await api.post(`/kb/${id}/update`, { metadata, content });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.post(`/kb/${id}/delete`);
    return data;
  },

  upload: async (file: File) => {
    const content = await file.text();
    const { data } = await api.post('/kb/upload', { 
      filename: file.name, 
      content 
    });
    return data;
  },
};

export default api;
