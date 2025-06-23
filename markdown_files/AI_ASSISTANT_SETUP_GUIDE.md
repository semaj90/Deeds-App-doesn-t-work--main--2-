# AI Legal Assistant Setup Guide

This guide explains how to set up and use the secure, offline-friendly AI Legal Assistant with your trained Gemma QAT model.

**Note:** PII masking features are currently commented out to focus on core functionality. The system now prioritizes privacy-first local inference without external processing.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   SvelteKit     │    │   Tauri+Rust    │
│   Frontend      │◄──►│   Backend       │
│                 │    │                 │
│ • Chat UI       │    │ • Model Decrypt │
│ • Voice Input   │    │ • GGUF Inference│
│ • TTS Output    │    │ • AES-256 Enc   │
│ • History Mgmt  │    │ • Key Management│
└─────────────────┘    └─────────────────┘
        │                       │
        │                       │
        v                       v
┌─────────────────┐    ┌─────────────────┐
│ Local Storage   │    │ ~/.deeds/       │
│ • Chat History  │    │ • models/       │
│ • User Prefs    │    │ • keys/         │
└─────────────────┘    └─────────────────┘
```

<!-- PII Masking Service (Currently Commented Out)
┌─────────────────┐
│  Python FastAPI │
│  Masking Service │
│                 │
│ • Legal-BERT    │
│ • PII Masking   │
│ • NER Analysis  │
└─────────────────┘
        │
        v
┌─────────────────┐
│ Local Models    │
│ • Legal-BERT    │
│ • NER Models    │
└─────────────────┘
-->

## 🚀 Quick Start

### 1. Upload Your Gemma QAT Model

```bash
# Option A: Place your GGUF model directly
cp your-gemma-qat.gguf ~/.deeds/models/

# Option B: Use the app's upload interface
# 1. Go to AI Assistant page
# 2. Click "Upload Model"
# 3. Select your .gguf file
```

### 2. Launch the Main App

```bash
cd web-app/sveltekit-frontend
npm run dev
```

### 4. Start Using the AI Assistant

1. Navigate to `/ai-assistant`
2. Upload your model if not done already
3. Start chatting with voice commands or text input
4. Enable TTS for spoken responses

## 🔧 Detailed Setup

### Prerequisites

- **Node.js 18+** for SvelteKit frontend
- **Rust 1.70+** for Tauri backend  
<!-- PII Masking Service (Currently Commented Out)
- **Python 3.8+** for masking service
-->
- **Your trained Gemma QAT model** in GGUF format

### Backend Setup (Rust + Tauri)

1. **Install Rust dependencies:**
```bash
cd src-tauri
cargo build
```

2. **Key features:**
   - ✅ AES-256-GCM encryption for model storage
   - ✅ Secure key generation in `~/.deeds/keys/model.key`
   - ✅ GGUF model decryption and inference
   - ✅ Tauri commands for frontend integration

3. **Model encryption (optional):**
```bash
# Encrypt your model (recommended for production)
invoke('plugin:llm|encrypt_model_file', { 
  modelPath: '/path/to/your-model.gguf' 
})
```

### Frontend Setup (SvelteKit)

1. **Install dependencies:**
```bash
cd web-app/sveltekit-frontend
npm install
```

2. **Key components:**
   - `LLMAssistant.svelte` - Main chat interface
   - `VoiceAssistant.svelte` - Voice command integration
   - Chat history with sidebar   - TTS integration for responses

3. **Voice features:**
   - 🎤 Voice input with command recognition
   - 🔊 Text-to-speech responses
   - 🎯 Smart command processing ("send message", "clear text")

<!-- 
### Python Masking Service Setup (Currently Commented Out)

Note: PII masking functionality is currently disabled to focus on core features.
The service code remains available for future implementation if needed.

1. **Install the service:**
```bash
cd python-masking-service
python setup.py
```

2. **Manual installation:**
```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

3. **Download Legal-BERT models:**
```bash
# Models will auto-download on first run, or manually:
python -c "
from transformers import AutoTokenizer, pipeline
AutoTokenizer.from_pretrained('nlpaueb/legal-bert-base-uncased')
pipeline('ner', model='dbmdz/bert-large-cased-finetuned-conll03-english')
"
```
-->

4. **Start the service:**
```bash
python main.py
# Service runs on http://127.0.0.1:8002
# API docs: http://127.0.0.1:8002/docs
```

## 🔒 Security Features

### Model Encryption
- **AES-256-GCM** encryption for GGUF models
- **Per-install keys** in `~/.deeds/keys/model.key`
- **Runtime decryption** - models never stored unencrypted

### Privacy Protection
- **Offline-first** - no external API calls required
- **Local processing** - all inference happens on device
<!-- **PII masking** - automatic detection and redaction of sensitive info (Currently Commented Out) -->
- **Secure storage** - encrypted models and secure key management

### CORS and API Security
- **SameSite policies** for cookie security
- **CORS whitelist** for trusted origins only
- **Request validation** with Pydantic models
- **Error sanitization** to prevent info leakage

## 🎯 Usage Guide

### Basic Chat
```typescript
// Simple text chat
await fetch('/api/llm/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: "Analyze this contract clause...",
    model: "gemma-qat-legal"
  })
});
```

### Voice Commands
- **"Start listening"** - Begin voice input
- **"Send message"** - Send current text
- **"Clear text"** - Clear input field
- **"Help"** - List available commands
- **Direct questions** - Just ask legal questions naturally

<!-- 
### PII Masking (Currently Commented Out)
```python
# Automatic masking of sensitive information
POST /api/mask
{
  "text": "John Smith called from 555-123-4567",  "mask_types": ["PERSON", "PHONE"]
}
# Returns: "███████████ called from ████████████"
```
-->

### Text-to-Speech
- Click 🔊 next to any AI response
- Uses OpenTTS if available, falls back to browser TTS
- Adjustable voice settings and playback controls

## 🧪 API Endpoints

### Tauri Commands (Rust Backend)
```typescript
// Model management
await invoke('plugin:llm|list_local_models')
await invoke('plugin:llm|upload_llm_model', { filePath, modelName })
await invoke('plugin:llm|encrypt_model_file', { modelPath })

// Inference
await invoke('plugin:llm|run_llama_inference', { 
  request: { prompt, max_tokens, temperature },
  modelName 
})

// Health checks
await invoke('plugin:llm|check_inference_health')
```

### SvelteKit API Routes
```bash
# Chat endpoint
POST /api/llm/chat
{
  "message": "Legal question...",
  "context": [...],
  "model": "gemma-qat"
}

# Chat uses enhanced RAG with personalized retrieval
# Combines user saved items + global knowledge base
```

<!--
### Python Masking Service (Currently Commented Out)
```bash
# Health check
GET /health

# Mask PII
POST /api/mask
{
  "text": "Sensitive document text...",
  "mask_types": ["PERSON", "SSN", "PHONE"],
  "confidence_threshold": 0.85
}

# Analyze without masking
POST /api/analyze

# Supported entity types
GET /api/supported-entities
```
-->

## 🚀 Performance Optimization

### Model Loading
- Models are cached after first load
- Encryption/decryption happens in background threads
- GPU acceleration via CUDA if available

### Memory Management
- Lazy loading of Legal-BERT models
- Streaming responses for large outputs
- Automatic cleanup of old chat sessions

### Network Optimization
- Local-first architecture minimizes network usage
- CORS optimized for same-origin requests
- Compressed model storage

## 🐛 Troubleshooting

### Common Issues

**Model not loading:**
```bash
# Check model format
file ~/.deeds/models/your-model.gguf
# Should show: data (GGUF format)

# Check permissions
ls -la ~/.deeds/models/
chmod 644 ~/.deeds/models/*.gguf
```

**Voice recognition not working:**
- Enable microphone permissions in browser
- Use HTTPS or localhost (required for Web Speech API)
- Check browser compatibility (Chrome/Edge recommended)

<!--
**Masking service offline:** (Currently Commented Out)
```bash
# Check service status
curl http://127.0.0.1:8002/health

# Restart service
cd python-masking-service
python main.py
```
-->

**Tauri commands failing:**
```bash
# Check Rust compilation
cd src-tauri
cargo check

# Verify Tauri is running
ps aux | grep tauri  # Unix
tasklist | findstr tauri  # Windows
```

### Log Locations
- **Frontend:** Browser developer console
- **Rust Backend:** Tauri console output
<!-- **Python Service:** Console output or `masking_service.log` (Currently Commented Out) -->

## 📈 Advanced Configuration

### Custom Model Settings
```json
// ~/.deeds/models/config.json
{
  "active_model": "gemma-qat-legal",
  "default_temperature": 0.7,
  "default_max_tokens": 512,
  "context_window": 4096,
  "gpu_layers": 35
}
```

### Voice Recognition Tuning
```javascript
// In VoiceAssistant.svelte
recognition.continuous = true;      // Keep listening
recognition.interimResults = true;  // Show partial results
recognition.maxAlternatives = 3;    // Multiple interpretations
```

### TTS Configuration
```javascript
// Custom voice settings
utterance.rate = 0.8;     // Speech speed
utterance.pitch = 1.0;    // Voice pitch
utterance.volume = 0.8;   // Volume level
```

## 🔮 Next Steps

1. **Enhanced RAG Integration:** Connect with existing case/evidence database
2. **Multi-language Support:** Add support for additional legal languages
3. **Advanced Voice Commands:** Custom legal command vocabulary
4. **Offline Model Updates:** Secure model versioning and updates
5. **Mobile App:** React Native or Flutter implementation

## 📚 Additional Resources

- [Legal-BERT Paper](https://arxiv.org/abs/2010.02559)
- [GGUF Format Specification](https://github.com/ggerganov/ggml/blob/master/docs/gguf.md)
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 🤝 Support

For issues and questions:
1. Check this documentation first
2. Review browser/console logs
3. Test with minimal examples
4. Check model compatibility and format

Your secure, offline legal AI assistant is ready! 🎉
