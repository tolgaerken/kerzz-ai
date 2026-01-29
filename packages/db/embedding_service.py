"""
Embedding Service - FastAPI wrapper for sentence-transformers
Provides embeddings for the NestJS API
"""

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn

app = FastAPI(title="Kerzz AI Embedding Service")

# Load model at startup
print("🔄 Loading embedding model...")
model = SentenceTransformer("BAAI/bge-m3")
print("✅ Embedding model ready")


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]


class BulkEmbedRequest(BaseModel):
    texts: list[str]


class BulkEmbedResponse(BaseModel):
    embeddings: list[list[float]]


@app.get("/health")
async def health():
    return {"status": "ok", "model": "BAAI/bge-m3"}


@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    embedding = model.encode(request.text).tolist()
    return EmbedResponse(embedding=embedding)


@app.post("/embed/bulk", response_model=BulkEmbedResponse)
async def embed_bulk(request: BulkEmbedRequest):
    embeddings = model.encode(request.texts).tolist()
    return BulkEmbedResponse(embeddings=embeddings)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
