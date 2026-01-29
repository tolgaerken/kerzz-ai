import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PromptsService } from '../prompts/prompts.service';

@Injectable()
export class VectorService implements OnModuleInit {
  private qdrant: QdrantClient;
  private openai: OpenAI;
  private readonly collectionName = 'kerzz_docs';

  constructor(
    private config: ConfigService,
    private promptsService: PromptsService,
  ) {
    this.qdrant = new QdrantClient({
      host: config.get('QDRANT_HOST', 'localhost'),
      port: config.get('QDRANT_PORT', 6333),
    });
    
    this.openai = new OpenAI({
      baseURL: config.get('LLM_BASE_URL', 'http://localhost:8000/v1'),
      apiKey: 'not-needed',
    });
  }

  async onModuleInit() {
    await this.ensureCollection();
  }

  private async ensureCollection() {
    try {
      const collections = await this.qdrant.getCollections();
      const exists = collections.collections.some(c => c.name === this.collectionName);
      
      if (!exists) {
        await this.qdrant.createCollection(this.collectionName, {
          vectors: { size: 1024, distance: 'Cosine' },
        });
        console.log(`✅ Collection '${this.collectionName}' created`);
      }
    } catch (error) {
      console.error('Failed to init collection:', error);
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    // Call local embedding endpoint or use a simple hash for now
    // In production, call the Python embedding service
    const response = await fetch('http://localhost:8001/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error('Embedding service unavailable');
    }
    
    const data = await response.json();
    return data.embedding;
  }

  async addDocument(id: string, text: string, metadata: Record<string, any>) {
    const embedding = await this.getEmbedding(text);
    
    await this.qdrant.upsert(this.collectionName, {
      wait: true,
      points: [{
        id,
        vector: embedding,
        payload: { text, ...metadata },
      }],
    });
    
    return { id, success: true };
  }

  async search(query: string, limit = 3) {
    const queryEmbedding = await this.getEmbedding(query);
    
    const results = await this.qdrant.search(this.collectionName, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
    });
    
    return results.map(r => ({
      text: r.payload?.text,
      score: r.score,
      metadata: r.payload,
    }));
  }

  async deleteDocument(id: string) {
    await this.qdrant.delete(this.collectionName, {
      wait: true,
      points: [id],
    });
    return { id, deleted: true };
  }

  async listDocuments(limit = 100, offset = 0) {
    const result = await this.qdrant.scroll(this.collectionName, {
      limit,
      offset,
      with_payload: true,
      with_vector: false,
    });
    
    return result.points.map(p => ({
      id: p.id,
      text: (p.payload?.text as string)?.substring(0, 200) + '...',
      metadata: p.payload,
    }));
  }

  async chat(
    query: string, 
    mode: 'customer' | 'technician' = 'customer',
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ) {
    // Check for greetings early (bypass vector search score)
    const greetings = ['merhaba', 'selam', 'günaydın', 'iyi günler', 'iyi akşamlar', 'hey', 'hi', 'hello'];
    const normalizedQuery = query.toLowerCase().trim();
    if (greetings.includes(normalizedQuery)) {
      return {
        action: 'answer',
        answer: 'Merhaba! Size nasıl yardımcı olabilirim?',
        sources: [],
        confidence: 'high',
        mode,
      };
    }

    const docs = await this.search(query, 3);
    
    if (!docs.length || docs[0].score < 0.3) {
      return {
        action: 'ask_clarification',
        answer:
          'Bu konuda net bilgi oluşturmak için biraz daha ayrıntı paylaşır mısınız? Hangi cihaz/özellik, hangi işlem sırasında ve ekranda görünen bir hata mesajı var mı?',
        parameters: {
          missing_info: ['device_type', 'operation_context', 'error_details'],
          urgency: 'medium',
        },
        sources: [],
        confidence: 'low',
        mode,
      };
    }

    // QA tipindeki dökümanlar için doğrudan ilgili cevabı döndür (yüksek skor gerekli)
    const qaDoc = docs.find(d => d.metadata?.type === 'qa');
    if (qaDoc && qaDoc.score > 0.75 && qaDoc.metadata) {
      const answerField = mode === 'customer' ? 'customerAnswer' : 'technicianAnswer';
      const answer = qaDoc.metadata[answerField] as string;
      
      if (answer) {
        return {
          action: 'answer',
          answer,
          sources: docs.map(d => ({ 
            text: (d.text as string)?.substring(0, 200), 
            score: d.score 
          })),
          confidence: qaDoc.score > 0.7 ? 'high' : 'medium',
          mode,
        };
      }
    }

    // Format context intelligently - KB documents should be formatted naturally
    const context = docs.map((d, i) => {
      const isKB = d.metadata?.kb_type === 'knowledge_base';
      if (isKB) {
        // KB documents: extract only the content part (skip YAML frontmatter if present)
        let text = d.text as string;
        // If text contains frontmatter, extract content after "---"
        const parts = text.split(/^---$/m);
        if (parts.length >= 3) {
          // Has frontmatter: use content after second ---
          text = parts.slice(2).join('---').trim();
        }
        return `[KB Dökümanı ${i + 1}]\n${text}`;
      } else {
        // Regular documents
        return `[Kaynak ${i + 1}]\n${d.text}`;
      }
    }).join('\n\n');
    
    // Load system prompts from file
    const prompts = this.promptsService.getPrompts();
    const systemPrompt = mode === 'customer' ? prompts.customer : prompts.technician;
    
    // Old hardcoded version (keep as fallback)
    const fallbackPrompt = mode === 'customer'
      ? `Sen Kerzz teknik destek asistanısın. Müşteri sorularını analiz edip aksiyon belirle.

ZORUNLU: Cevabını JSON formatında ver.

ÖNEMLİ: Context kısmındaki "Kaynak 1, Kaynak 2" gibi referansları ASLA müşteriye gösterme. Bunlar senin internal bilgin.

Selamlama mesajlarını tanı:
- "Merhaba", "Selam", "İyi günler", "Günaydın" gibi basit selamlamalara karşılık ver
- Örnek: {"action": "answer", "answer": "Merhaba! Size nasıl yardımcı olabilirim?"}

ÖNCE BİLGİ TOPLA! Eğer müşterinin mesajı belirsiz veya eksikse (ama selamlama değilse), MUTLAKA soru sor:

Belirsiz mesaj örnekleri:
- "Sorun var" → "Ne sorununuz var? Hangi cihaz veya işlemle ilgili?"
- "Çalışmıyor" → "Ne çalışmıyor? Hangi cihaz veya özellikten bahsediyorsunuz?"
- "Kağıt çıkmıyor" → "Hangi yazıcıdan bahsediyorsunuz? Fiş yazıcı mı yoksa rapor yazıcısı mı?"
- "Hata alıyorum" → "Ne tür bir hata alıyorsunuz? Ekranda ne yazıyor?"
- "Bağlanmıyor" → "Ne bağlanmıyor? Yazıcı mı, internet mi, başka bir cihaz mı?"

Bilgi toplanmalı (ne, nerede, nasıl, ne zaman):
- Hangi cihaz/özellik?
- Ne zaman başladı?
- Hata mesajı var mı?
- Daha önce çalışıyor muydu?

Sadece YETERLI BİLGİ varsa çözüm sun!

JSON formatı:
{
  "action": "ask_clarification", // veya answer/troubleshoot/create_ticket/escalate
  "answer": "Hangi yazıcıdan bahsediyorsunuz? Fiş yazıcı mı yoksa rapor yazıcısı mı?",
  "parameters": {
    "missing_info": ["device_type", "error_details"],
    "urgency": "medium"
  }
}

Action tipleri:
- ask_clarification: Bilgi eksik, soru sor (EN ÖNCELİKLİ!)
- answer: Basit bilgi sorusu, direkt cevap ver
- troubleshoot: Sorun giderme adımları başlat (yeterli bilgi varsa)
- create_ticket: Teknik sorun, destek talebi oluştur
- escalate: Acil durum

Kurallar:
- Selamlama mesajlarına doğal karşılık ver (Merhaba/Selam/İyi günler)
- Belirsiz mesajlarda MUTLAKA soru sor (ama selamlama değilse)
- MÜŞTERİ için basit ve anlaşılır dil kullan
- Sadece verilen context'teki bilgileri kullan
- Context'teki "Kaynak 1, Kaynak 2" gibi internal referansları ASLA müşteriye söyleme
- Kullanıcıya kaynak numarası sorma
- Türkçe cevap ver`
      : `Sen Kerzz teknik destek asistanısın. TEKNİK PERSONEL için detaylı analiz ve aksiyon belirle.

ZORUNLU: Cevabını JSON formatında ver.

Teknisyenlerden bile eksik bilgi varsa soru sor:
- "Yazıcı sorunu" → "Hangi model? Bağlantı tipi (USB/Network)? Hata kodu?"
- "POS takılıyor" → "Hangi işlem sırasında? RAM/CPU kullanımı? Log kayıtları?"

JSON formatı:
{
  "action": "troubleshoot",
  "answer": "Yazıcı bağlantı hatası. Driver ve port ayarlarını kontrol edin.",
  "parameters": {
    "issue_type": "printer_connection",
    "urgency": "high",
    "suggested_logs": ["/var/log/cups/error_log"],
    "next_steps": ["Driver version kontrol", "Port ayarlarını doğrula", "Test print"]
  }
}

Action tipleri:
- ask_clarification: Eksik teknik detay, soru sor
- troubleshoot: Teknik sorun giderme (detaylı bilgi varsa)
- answer: Bilgi sorusu
- escalate: Destek ekibine yönlendir

Kurallar:
- TEKNİK DETAYLAR ekle (log dosyaları, ayar parametreleri, sistem gereksinimleri)
- Olası nedenler ve çözümleri listele
- Sadece verilen context'teki bilgileri kullan
- Context'teki kaynak referanslarını (Kaynak 1, Kaynak 2) kullanıcıya söyleme
- Türkçe cevap ver`;
    
    // Build conversation messages with history
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add conversation history (last 6 messages to keep context manageable)
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current query with context
    messages.push({
      role: 'user',
      content: `Context (dokümantasyon):\n${context}\n\nSoru: ${query}\n\nCevap (JSON formatında):`,
    });

    const response = await this.openai.chat.completions.create({
      model: this.config.get('LLM_MODEL', 'nvidia/Qwen3-32B-FP4'),
      messages,
      max_tokens: 700,
      temperature: 0.3,
    });

    try {
      // Parse JSON response (handle DeepSeek R1 <think> tags)
      let content = response.choices[0].message.content || '{}';
      
      // Remove <think>...</think> tags if present (DeepSeek R1)
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      
      // Extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      
      // Format sources for display (extract content, remove metadata)
        const formattedSources = docs.map(d => {
          let text = d.text as string;
          const isKB = d.metadata?.kb_type === 'knowledge_base';
          if (isKB) {
            // Extract content after frontmatter
            const parts = text.split(/^---$/m);
            if (parts.length >= 3) {
              text = parts.slice(2).join('---').trim();
            }
          }
          return { text: text.substring(0, 200), score: d.score };
        });

        return {
        action: parsed.action || 'answer',
        answer: parsed.answer || content,
        parameters: parsed.parameters,
        sources: formattedSources,
        confidence: docs[0].score > 0.6 ? 'high' : 'medium',
        mode,
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      let content = response.choices[0].message.content || 'Cevap oluşturulamadı.';
      // Strip think tags from fallback too
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      
      // Format sources for fallback too
      const formattedSources = docs.map(d => {
        let text = d.text as string;
        const isKB = d.metadata?.kb_type === 'knowledge_base';
        if (isKB) {
          const parts = text.split(/^---$/m);
          if (parts.length >= 3) {
            text = parts.slice(2).join('---').trim();
          }
        }
        return { text: text.substring(0, 200), score: d.score };
      });
      
      return {
        action: 'answer',
        answer: content,
        sources: formattedSources,
        confidence: docs[0].score > 0.6 ? 'high' : 'medium',
        mode,
      };
    }
  }

  async *chatStream(
    query: string,
    mode: 'customer' | 'technician' = 'customer',
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ) {
    // Check for greetings early
    const greetings = ['merhaba', 'selam', 'günaydın', 'iyi günler', 'iyi akşamlar', 'hey', 'hi', 'hello'];
    const normalizedQuery = query.toLowerCase().trim();
    if (greetings.includes(normalizedQuery)) {
      const response = 'Merhaba! Size nasıl yardımcı olabilirim?';
      for (const char of response) {
        yield { type: 'token', content: char };
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      yield { type: 'done', action: 'answer', confidence: 'high' };
      return;
    }

    const docs = await this.search(query, 3);

    if (!docs.length || docs[0].score < 0.3) {
      const response =
        'Bu konuda net bilgi oluşturmak için biraz daha ayrıntı paylaşır mısınız? Hangi cihaz/özellik, hangi işlem sırasında ve ekranda görünen bir hata mesajı var mı?';
      for (const char of response) {
        yield { type: 'token', content: char };
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      yield {
        type: 'done',
        action: 'ask_clarification',
        confidence: 'low',
        sources: [],
        parameters: {
          missing_info: ['device_type', 'operation_context', 'error_details'],
          urgency: 'medium',
        },
      };
      return;
    }

    // QA documents
    const qaDoc = docs.find(d => d.metadata?.type === 'qa');
    if (qaDoc && qaDoc.score > 0.5 && qaDoc.metadata) {
      const answerField = mode === 'customer' ? 'customerAnswer' : 'technicianAnswer';
      const answer = qaDoc.metadata[answerField] as string;

      if (answer) {
        for (const char of answer) {
          yield { type: 'token', content: char };
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        yield {
          type: 'done',
          action: 'answer',
          confidence: qaDoc.score > 0.7 ? 'high' : 'medium',
          sources: docs.map(d => ({ text: (d.text as string)?.substring(0, 200), score: d.score })),
        };
        return;
      }
    }

    // Format context intelligently - KB documents should be formatted naturally
    const context = docs.map((d, i) => {
      const isKB = d.metadata?.kb_type === 'knowledge_base';
      if (isKB) {
        // KB documents: extract only the content part (skip YAML frontmatter if present)
        let text = d.text as string;
        // If text contains frontmatter, extract content after second ---
        const parts = text.split(/^---$/m);
        if (parts.length >= 3) {
          // Has frontmatter: use content after second ---
          text = parts.slice(2).join('---').trim();
        }
        return `[KB Dökümanı ${i + 1}]\n${text}`;
      } else {
        // Regular documents
        return `[Kaynak ${i + 1}]\n${d.text}`;
      }
    }).join('\n\n');
    const prompts = this.promptsService.getPrompts();
    const systemPrompt = mode === 'customer' ? prompts.customer : prompts.technician;

    const messages: any[] = [{ role: 'system', content: systemPrompt }];
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({
      role: 'user',
      content: `Context (dokümantasyon):\n${context}\n\nSoru: ${query}\n\nCevap (JSON formatında):`,
    });

    const stream = await this.openai.chat.completions.create({
      model: this.config.get('LLM_MODEL', 'nvidia/Qwen3-32B-FP4'),
      messages,
      max_tokens: 700,
      temperature: 0.3,
      stream: true,
    });

    let fullContent = '';
    let thinkingContent = '';
    let inThinkTag = false;
    let answerContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      fullContent += delta;

      // Track <think> tags and extract thinking
      if (delta.includes('<think>')) {
        inThinkTag = true;
        const thinkStart = delta.indexOf('<think>') + 7;
        thinkingContent += delta.slice(thinkStart);
        continue;
      }
      
      if (delta.includes('</think>')) {
        const thinkEnd = delta.indexOf('</think>');
        thinkingContent += delta.slice(0, thinkEnd);
        inThinkTag = false;
        answerContent += delta.slice(thinkEnd + 8);
        continue;
      }

      if (inThinkTag) {
        thinkingContent += delta;
      } else {
        answerContent += delta;
        // Don't stream yet - wait for JSON parse
      }
    }

    // Parse final JSON first
    const cleanContent = fullContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);

    try {
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { action: 'answer', answer: answerContent };
      
      // Now stream the answer field only
      const answerToStream = parsed.answer || answerContent || 'Cevap oluşturulamadı.';
      for (const char of answerToStream) {
        yield { type: 'token', content: char };
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      yield {
        type: 'done',
        action: parsed.action || 'answer',
        parameters: parsed.parameters,
        confidence: docs[0].score > 0.6 ? 'high' : 'medium',
        sources: docs.map(d => ({ text: (d.text as string)?.substring(0, 200), score: d.score })),
        thinking: thinkingContent.trim(),
        rawJson: parsed,
      };
    } catch {
      // Fallback: stream raw content
      for (const char of answerContent) {
        yield { type: 'token', content: char };
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      yield {
        type: 'done',
        action: 'answer',
        confidence: 'medium',
        sources: docs.map(d => ({ text: (d.text as string)?.substring(0, 200), score: d.score })),
        thinking: thinkingContent.trim(),
        rawJson: null,
      };
    }
  }
}
