# KB Integration Guide

kerzz-ai API'sine KB entegrasyonu tamamlandı. 🎉

## API Endpoints

### 1. Get All Documents
```bash
GET /kb
```
Tüm KB dökümanlarını döner (metadata + content).

### 2. Get Document by ID
```bash
GET /kb/:id
```
Belirli bir dökümanı id ile getirir.

### 3. Get Statistics
```bash
GET /kb/stats
```
KB istatistikleri (docType, module, lang, priority bazlı dağılım).

### 4. Search by Metadata
```bash
POST /kb/search
Content-Type: application/json

{
  "lang": "tr",
  "docType": "troubleshooting",
  "module": "printing",
  "role": "technician",
  "priority": "high",
  "tags": ["yazıcı", "mutfak"],
  "intent": "printer_not_printing"
}
```
Metadata filtrelerine göre döküman arar.

### 5. Semantic Search (AI-Powered)
```bash
POST /kb/find
Content-Type: application/json

{
  "query": "yazıcı yazdırmıyor ethernet",
  "filters": {
    "lang": "tr",
    "docType": "troubleshooting",
    "module": "printing"
  },
  "limit": 5
}
```
Kullanıcı sorusuna göre en ilgili dökümanları bulur (vector similarity).

### 6. Sync to Vector Store
```bash
POST /kb/sync
```
Tüm KB dökümanlarını vector store'a yükler (embedding oluşturur).

### 7. Reload from Filesystem
```bash
POST /kb/reload
```
KB'yi dosya sisteminden tekrar yükler (yeni dökümanlar eklendiyinde).

## Chat Integration

Chat service'den KB kullanımı:

```typescript
import { KBService } from '../kb/kb.service';

@Injectable()
export class ChatService {
  constructor(private kbService: KBService) {}

  async handleUserMessage(message: string, context: any) {
    // 1. Kullanıcı mesajına göre ilgili KB dökümanlarını bul
    const relevantDocs = await this.kbService.findRelevantDocuments(
      message,
      {
        lang: context.lang || 'tr',
        role: context.role || 'user',
      },
      3 // top 3 en ilgili döküman
    );

    // 2. Dökümanları context'e ekle
    if (relevantDocs.length > 0) {
      const kbContext = relevantDocs
        .map(doc => `## ${doc.metadata.title}\n\n${doc.content}`)
        .join('\n\n---\n\n');

      // 3. AI'a gönder
      const prompt = `
Kullanıcı sorusu: ${message}

İlgili KB dökümanları:
${kbContext}

Yukarıdaki KB dökümanlarını kullanarak kullanıcıya yardımcı ol.
`;

      // ... AI'a gönder
    }
  }
}
```

## Workflow

### Yeni Döküman Ekleme

1. **Döküman oluştur:**
   ```bash
   cd kb/scripts
   ./create-doc.js
   ```
   Interaktif olarak döküman bilgilerini gir.

2. **Dökümanı düzenle:**
   ```bash
   nano kb/tr/troubleshooting/my-doc.md
   ```

3. **Vector store'a senkronize et:**
   ```bash
   curl -X POST http://localhost:3000/kb/sync
   ```

4. **Test et:**
   ```bash
   curl -X POST http://localhost:3000/kb/find \
     -H "Content-Type: application/json" \
     -d '{"query": "yazıcı yazdırmıyor", "limit": 3}'
   ```

### Otomatik Sync (Production)

Startup'ta veya cron ile otomatik sync:

```typescript
// main.ts veya onModuleInit
const kbService = app.get(KBService);
await kbService.syncToVectorStore();
console.log('✅ KB synced to vector store');
```

## Best Practices

### 1. Intent-Based Matching
Her dökümanın `intent` field'ı var. AI bu intent'i kullanarak doğru dökümanı bulabilir:

```typescript
// Kullanıcı: "yazıcı yazdırmıyor"
const docs = kbService.searchDocuments({
  intent: 'printer_not_printing',
  lang: 'tr'
});
```

### 2. Progressive Disclosure
Önce troubleshooting dökümanının **triage sorularını** sor:

```typescript
const doc = kbService.getDocumentById('kb_tr_troubleshooting_printer_not_printing_v1');

// İlk adım: Triage soruları
const triageSection = extractSection(doc.content, '## Triage Soruları');
// Kullanıcıya soruları sor...

// İkinci adım: Senaryoya göre yönlendir
const scenarioSection = extractSection(doc.content, '## Belirtiye Göre Eleme');
// İlgili senaryoyu seç...
```

### 3. Multi-Document Context
Birden fazla döküman tipini birlikte kullan:

```typescript
const troubleshooting = await kbService.searchDocuments({
  docType: 'troubleshooting',
  module: 'printing'
});

const faq = await kbService.searchDocuments({
  docType: 'faq',
  module: 'printing'
});

const knownIssues = await kbService.searchDocuments({
  docType: 'known-issue',
  module: 'printing'
});

// Combine and prioritize
```

### 4. Version Awareness
Dökümanlar versiyon kısıtlarına sahip. Kullanıcının POS versiyonuna göre filtrele:

```typescript
const userVersion = '1.5.2';
const docs = kbService.getAllDocuments().filter(doc => {
  const { min, max } = doc.metadata.version;
  if (!min && !max) return true; // Tüm versiyonlar
  // Version comparison logic
  return isVersionInRange(userVersion, min, max);
});
```

## Monitoring

KB durumunu kontrol et:

```bash
# Stats
curl http://localhost:3000/kb/stats

# Response:
{
  "total": 10,
  "byType": {
    "troubleshooting": 5,
    "faq": 3,
    "howto": 2
  },
  "byModule": {
    "printing": 4,
    "payment": 3,
    "sync": 3
  },
  "byLang": {
    "tr": 10
  },
  "byPriority": {
    "high": 3,
    "medium": 5,
    "low": 2
  }
}
```

## Troubleshooting

### Döküman görünmüyor
```bash
# KB'yi reload et
curl -X POST http://localhost:3000/kb/reload

# Stats kontrol et
curl http://localhost:3000/kb/stats
```

### Semantic search çalışmıyor
```bash
# Vector store'a sync et
curl -X POST http://localhost:3000/kb/sync
```

### Metadata hatası
- YAML formatını kontrol et (frontmatter düzgün kapalı mı?)
- Required field'lar eksik mi? (id, title, docType, intent...)

## Next Steps

- [ ] Chat service'e KB entegrasyonu ekle
- [ ] AI'a KB kullanımı için prompt ekle
- [ ] Auto-sync on startup
- [ ] Webhook for KB updates (git push → reload)
- [ ] KB analytics (hangi dökümanlar çok kullanılıyor?)
