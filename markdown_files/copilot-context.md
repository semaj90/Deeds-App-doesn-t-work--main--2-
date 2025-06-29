# Copilot Context for Prosecutor Legal CMS

## Stack Overview
- UI: SvelteKit (SSR-first, no VDOM), Tailwind or Vanilla CSS only
- Desktop: Tauri (Rust backend, secure command API)
- Mobile: Flutter + Riverpod + Tauri bridge
- Backend: Postgres + Drizzle ORM
- Vector Search: Qdrant (Docker)
- NLP Microservices: Python + FastAPI (NER, LLM masking)
- LLM Inference: Local via llama.cpp or Ollama (CLI or Tauri-integrated)
- Shared Logic: All UI and store logic in `/packages/`

---

## Project Goals
- 📂 JSON-first case management
- 🧠 Personalized LLM inference based on `user.history[]`
- 🖱️ Drag-and-drop evidence canvas (Svelte + Fabric.js)
- 🧾 Auto-saving + undo/redo of all case changes
- 🧠 Contextual search using Qdrant
- 📤 Export case summaries and visuals to PDF (via Rust or Puppeteer)
- 🔁 SSR-first; caching and deduplication of all LLM outputs
- 🧪 Full test coverage: Playwright + tokio + Flutter integration_test

---

## File and Feature Hints (for Copilot)

### SvelteKit UI

```ts
// File: CaseForm.svelte
// Instructions:
// SSR form handler with hidden user + case metadata.
// Submits via <form method="POST"> and saves with Drizzle.
// Auto-enhanced via SvelteKit use:enhance.
// JSON autosave + undo logic syncs with Tauri via stores.
```

### Rust Backend
```rust
// File: commands.rs
// Instructions:
// Tauri commands like `save_case`, `search_vectors`, `upload_llm`.
// All commands async using tokio. All input/output is JSON.
// Store LLM prompts + responses with md5(query+context) as key.
// Integrate with Qdrant via HTTP or client lib.
```

### Flutter Mobile
```dart
// File: evidence_timeline.dart
// Instructions:
// Stateless UI that mirrors desktop CaseEditor.
// Store user edits offline and sync to Tauri bridge.
// Load `user.history` from secure_storage for LLM queries.
```

### Data Flow Best Practices
Use user.history[] (recent edits, prior case summaries, annotations)

For each LLM request, include:

user_id

case_id

timestamp

current note / JSON state

Hash LLM prompt + metadata to deduplicate cache (md5)

### Component Sharing
```pgsql
/packages/
  ui/               → Drag/drop canvas, timeline, autosave forms
  stores/           → Undo/redo state, LLM cache
  rust-core/        → Vector helpers, file IO, PDF export
  flutter-core/     → Bridge-compatible widgets + storage
  llm-cache/        → Universal cache by md5(query+context)
```

### Vector Search (Qdrant)
Use semantic embeddings to group related case notes

Store in Qdrant as { user_id, case_id, embedding, type, tags[] }

Run search_vectors() in Rust to return relevant LLM context

### PDF Export
SSR route /export/pdf/[case_id]

Uses HTML + Tailwind → PDF via:

Puppeteer (Node)

or Tauri + wkhtmltopdf

Must include metadata, summary, timeline, evidence layout (canvas)

### Recommended Dev Commands
```bash
pnpm dev            # Web frontend (SvelteKit)
cargo tauri dev     # Desktop app (Rust + SvelteKit)
docker-compose up   # Postgres + Qdrant
uvicorn main:app    # Python NLP server
pnpm test:e2e       # Playwright
cargo test          # Rust unit tests
flutter test        # Mobile integration tests
```
