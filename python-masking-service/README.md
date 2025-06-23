## PII Masking Service - Currently Inactive

**Status:** This service is currently commented out and not used in the main application.

The AI Legal Assistant now focuses on core functionality with privacy-first local inference. PII masking features have been temporarily disabled to prioritize:

- ✅ Secure local GGUF model inference
- ✅ Encrypted model storage (AES-256)
- ✅ Voice input and TTS output
- ✅ Chat history and personalized RAG
- ✅ Offline-first privacy protection

### Future Implementation

The masking service code remains available for future implementation if needed:

- **FastAPI server** for Legal-BERT integration
- **NER (Named Entity Recognition)** for PII detection
- **Configurable masking patterns** for different entity types
- **RESTful API** for integration with the main app

### Files in this directory:

- `main.py` - FastAPI server implementation
- `requirements.txt` - Python dependencies
- `setup.py` - Installation script

### To re-enable (if needed):

1. Uncomment PII masking code in:
   - `web-app/sveltekit-frontend/src/lib/components/LLMAssistant.svelte`
   - `web-app/sveltekit-frontend/src/routes/api/llm/chat/+server.ts`
   - `web-app/sveltekit-frontend/src/routes/ai-assistant/+page.svelte`

2. Install and run this service:
   ```bash
   python setup.py
   python main.py
   ```

3. Update documentation to reflect the re-enabled feature.

---

**Current Focus:** The main application prioritizes privacy-first local processing without external dependencies.
