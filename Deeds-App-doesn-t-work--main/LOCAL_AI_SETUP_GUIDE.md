# 🤖 Local AI-Powered Prosecutor System Setup Guide

## 🎯 Overview
This guide sets up a completely self-hosted AI-powered prosecutor case management system with:
- **Local LLM** for document analysis and auto-tagging
- **PostgreSQL** with pgvector for structured data
- **Qdrant** for vector search and similarity matching
- **Rust Backend** for high-performance API
- **File Processing** with OCR and text extraction

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SvelteKit     │    │   Rust Backend  │    │   PostgreSQL    │
│   Frontend      │◄──►│   (Axum API)    │◄──►│   + pgvector    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │                 │
                ┌─────────────┐   ┌─────────────┐
                │   Qdrant    │   │  Local LLM  │
                │   Vector    │   │  (Candle)   │
                │   Search    │   │             │
                └─────────────┘   └─────────────┘
```

## 🚀 Quick Start

### 1. Start Infrastructure
```powershell
# Start PostgreSQL + Qdrant
docker-compose up -d

# Verify services
docker ps
```

### 2. Download Local LLM Model
```powershell
# Create models directory
mkdir backend\models

# Download a small efficient model (example)
# You can use models from Hugging Face in GGUF format
# Example: Llama-2-7B-Chat-GGUF or Mistral-7B-Instruct-GGUF
```

**Recommended Models:**
- **Mistral-7B-Instruct-v0.2** (7GB) - Good for legal text
- **CodeLlama-7B-Instruct** (7GB) - Good for structured analysis
- **Llama-2-7B-Chat** (7GB) - General purpose
- **TinyLlama-1.1B** (1GB) - For testing/low-resource systems

### 3. Configure Environment
```powershell
# Backend configuration
cd backend
copy .env.example .env
```

Update `backend/.env`:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prosecutor_db

# Qdrant
QDRANT_URL=http://localhost:6333

# Local LLM (update path to your downloaded model)
LOCAL_LLM_MODEL_PATH=./models/mistral-7b-instruct-v0.2.gguf
ENABLE_AI_TAGGING=true
ENABLE_AUTO_EMBEDDING=true

# File Processing
ENABLE_OCR=true
ENABLE_TEXT_EXTRACTION=true
SUPPORTED_FORMATS=pdf,txt,doc,docx,jpg,png,mp4,avi

# Performance
RUST_LOG=info
BCRYPT_ROUNDS=12
```

### 4. Setup Database
```powershell
cd backend\scripts
.\setup_db.ps1
```

### 5. Start Rust Backend
```powershell
cd backend
.\scripts\dev.ps1
```

### 6. Start SvelteKit Frontend
```powershell
# In project root
npm run dev
```

## 🔧 Advanced Configuration

### Local LLM Options

#### Option 1: Candle + GGUF (Recommended)
- **Pros**: Pure Rust, fast, efficient
- **Cons**: Limited model support
- **Setup**: Download GGUF models from Hugging Face

#### Option 2: Ollama Integration
```powershell
# Install Ollama
winget install Ollama.Ollama

# Pull a model
ollama pull mistral:7b

# Update backend/.env
LOCAL_LLM_HOST=127.0.0.1
LOCAL_LLM_PORT=11434
```

#### Option 3: llama.cpp Server
```powershell
# Download llama.cpp
# Start server with your model
.\llama-server.exe -m model.gguf -c 2048 --port 8081
```

### Database Schema Additions

The system automatically adds AI-specific columns to your evidence table:
```sql
ALTER TABLE evidence 
ADD COLUMN ai_tags JSONB,
ADD COLUMN ai_summary TEXT,
ADD COLUMN embeddings_indexed BOOLEAN DEFAULT FALSE;

-- Index for AI tags
CREATE INDEX idx_evidence_ai_tags ON evidence USING GIN (ai_tags);
```

### Qdrant Collections

Automatically creates collections:
- `prosecutor_evidence` - Vector embeddings of evidence files
- Dimensions: 384 (All-MiniLM-L6-v2)
- Distance: Cosine similarity

## 🎯 Features Enabled

### 1. Automatic AI Tagging
- Upload evidence → Auto-generate relevant tags
- Legal document classification
- Priority scoring based on content

### 2. Semantic Search
```http
GET /api/evidence/search?q=witness statement&case_id=uuid&min_score=0.7
```

### 3. Similar Evidence Detection
```http
GET /api/evidence/{id}/similar
```

### 4. File Processing Pipeline
1. **Upload** → File saved to storage
2. **Text Extraction** → OCR, PDF parsing, etc.
3. **AI Analysis** → Tags, summary, classification
4. **Vector Embedding** → Generate embeddings
5. **Index** → Store in Qdrant + PostgreSQL

### 5. AI-Powered APIs

#### Auto-Tag Evidence
```http
POST /api/evidence/upload
Content-Type: multipart/form-data

{
  "file": <evidence-file>,
  "case_id": "uuid",
  "title": "Witness Statement"
}
```

Response includes:
```json
{
  "evidence": {...},
  "ai_tags": ["witness", "statement", "high-priority"],
  "ai_summary": "Witness statement regarding incident...",
  "similar_evidence": ["uuid1", "uuid2"]
}
```

#### Semantic Search
```http
GET /api/evidence/search?q=DNA evidence from crime scene
```

## 📊 Performance Monitoring

### System Stats Endpoint
```http
GET /api/evidence/stats
```

Returns:
```json
{
  "database": {
    "total_evidence": 1250,
    "ai_processed_count": 1100,
    "total_file_size_bytes": 5242880000
  },
  "vector_search": {
    "points_count": 1100,
    "collection_name": "prosecutor_evidence"
  },
  "services": {
    "llm_available": true,
    "supported_formats": ["pdf", "txt", "doc", ...]
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. LLM Model Not Loading
```
Error: Failed to load embedding model
```
**Solution**: 
- Check model path in `.env`
- Ensure GGUF format model
- Try smaller model first

#### 2. Qdrant Connection Failed
```
Error: Connection refused (os error 10061)
```
**Solution**:
```powershell
docker-compose up qdrant -d
# Check: curl http://localhost:6333/health
```

#### 3. PostgreSQL Connection Issues
```
Error: Connection refused
```
**Solution**:
```powershell
docker-compose up db -d
# Check: psql -h localhost -U postgres -d prosecutor_db
```

#### 4. Out of Memory (LLM)
**Solution**: Use smaller model or adjust settings:
```env
# Use TinyLlama for testing
LOCAL_LLM_MODEL_PATH=./models/tinyllama-1.1b-chat.gguf
```

### Performance Tuning

#### For Large Evidence Collections:
```env
# Increase batch sizes
EMBEDDING_BATCH_SIZE=50
QDRANT_BATCH_SIZE=100

# Enable disk storage for Qdrant
QDRANT_ON_DISK=true
```

#### For Low-Resource Systems:
```env
# Disable AI features temporarily
ENABLE_AI_TAGGING=false
ENABLE_AUTO_EMBEDDING=false

# Use basic keyword extraction
FALLBACK_KEYWORD_EXTRACTION=true
```

## 🔐 Security Considerations

1. **Local Processing**: All AI processing happens locally
2. **No Data Leaks**: No data sent to external AI services
3. **Encrypted Storage**: Evidence files can be encrypted at rest
4. **Access Control**: JWT-based authentication for all APIs

## 📈 Scaling Options

### Horizontal Scaling:
- Multiple Rust backend instances (load balancer)
- Qdrant cluster mode
- PostgreSQL read replicas

### Performance Optimization:
- GPU acceleration for LLM inference
- Redis caching for search results
- CDN for static evidence files

## 🎉 Success Metrics

After setup, you should see:
- ✅ Evidence auto-tagged within seconds of upload
- ✅ Semantic search returning relevant results
- ✅ Similar evidence suggestions working
- ✅ Sub-second search response times
- ✅ 99%+ uptime for all services

This creates a completely self-hosted, AI-powered legal case management system with enterprise-grade performance and security! 🚀⚖️
