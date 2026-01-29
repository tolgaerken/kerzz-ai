# Kerzz AI - Teknik Destek Chatbot

Kerzz POS ve Kerzz Cloud için RAG (Retrieval-Augmented Generation) tabanlı teknik destek chatbot sistemi.

## 📦 Proje Yapısı

```
kerzz-ai/
├── apps/
│   ├── api/          # NestJS backend API
│   └── web/          # React frontend (Vite)
├── packages/
│   └── shared/       # Ortak tipler ve yardımcılar
└── prompts/          # System promptları (düzenlenebilir)
```

## 🚀 Özellikler

- **RAG Sistemi**: Qdrant vector database + Ollama LLM
- **Akıllı Sohbet**: Konuşma geçmişi takibi, aksiyon belirleme
- **Streaming**: Cevaplar kelime kelime akıyor
- **Prompt Yönetimi**: Web arayüzünden system promptları düzenle
- **İki Mod**: Müşteri ve Teknisyen modları
- **Debug UI**: Reasoning process ve raw JSON görüntüleme

## 🛠️ Teknoloji Stack

### Backend
- **NestJS**: API framework
- **Qdrant**: Vector database
- **Ollama**: Local LLM (qwen3:8b)
- **OpenAI SDK**: LLM interface

### Frontend
- **React + TypeScript**
- **Vite**: Build tool
- **TanStack Query**: Data fetching
- **Tailwind CSS**: Styling

### Embedding Service
- **Python + FastAPI**
- **Sentence Transformers**: mGTE model

## 📋 Gereksinimler

- Node.js 18+
- Python 3.9+
- Ollama
- Qdrant

## 🔧 Kurulum

### 1. Dependencies

```bash
npm install
```

### 2. Environment Variables

```bash
# Backend
cp apps/api/.env.example apps/api/.env
```

### 3. Qdrant

```bash
# Docker ile
docker run -p 6333:6333 qdrant/qdrant
```

### 4. Ollama

```bash
# Model indir
ollama pull qwen3:8b
ollama serve
```

### 5. Embedding Service

```bash
cd /path/to/embedding-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 6. Build & Run

```bash
# Development
npm run dev

# Production build
npm run build

# PM2 ile çalıştırma
pm2 start ecosystem.config.js
```

## 🌐 Erişim

- **Frontend**: http://localhost:5173 (dev) / http://localhost:3000 (prod)
- **API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api

## 📝 Kullanım

### Doküman Ekleme

1. Web arayüzünde **Yükle** sekmesine git
2. Metin gir veya dosya yükle
3. QA formatında eklemek için **QA Ekle** kullan

### Prompt Düzenleme

1. **Promptlar** sekmesine git
2. Müşteri veya Teknisyen promptunu düzenle
3. **Kaydet** - Değişiklikler anında aktif olur

### Chat Test

1. **Chat Test** sekmesine git
2. Müşteri/Teknisyen modunu seç
3. Sohbet et

## 🏗️ Deployment

### PM2 ile Production

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### Environment Variables (Production)

```bash
# API
QDRANT_HOST=your-qdrant-host
LLM_BASE_URL=your-ollama-url
LLM_MODEL=qwen3:8b
```

## 📊 API Endpoints

### Chat
- `POST /chat` - Normal chat
- `POST /chat/stream` - Streaming chat (SSE)
- `GET /chat/search` - Vector search only

### Documents
- `GET /documents` - List documents
- `POST /documents` - Add document
- `POST /documents/qa` - Add QA pair
- `POST /documents/upload` - Upload file
- `DELETE /documents/:id` - Delete document

### Prompts
- `GET /prompts` - Get current prompts
- `POST /prompts` - Update prompts

## 🐞 Debug

### Reasoning Process

Chat mesajlarının altında:
- **🧠 Reasoning Process** - LLM'in düşünce süreci
- **📄 JSON Response** - Raw JSON output

### Logs

```bash
pm2 logs kerzz-api
pm2 logs kerzz-web
pm2 logs kerzz-embedding
```

## 🔒 Güvenlik

- `.env` dosyası git'e yüklenmiyor
- Sensitive data encryption gerekirse eklenebilir
- CORS production'da kısıtlanmalı

## 📄 Lisans

MIT

## 👥 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing`)
5. Pull Request açın

## 📞 İletişim

- **Proje Sahibi**: Tolga
- **Şirket**: Kerzz
