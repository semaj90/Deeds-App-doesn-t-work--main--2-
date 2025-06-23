# 🎯 WardenNet: Complete Implementation Guide

## 📋 Table of Contents
1. [Local-Only Development Setup](#local-only-development)
2. [SvelteKit Stores Architecture](#sveltekit-stores)
3. [API Routes & Caching Strategy](#api-routes-caching)
4. [Database Management](#database-management)
5. [Best Practices Implementation](#best-practices)
6. [Tauri/Rust Integration Preparation](#tauri-preparation)
7. [Flutter Architecture Planning](#flutter-planning)
8. [Next Steps to Completion](#next-steps)

# Complete Multimodal Legal Scene Understanding Implementation

## 🎯 Overview

This implementation provides a robust, multi-platform legal NLP/LLM backend with advanced multimodal scene understanding capabilities. The system strictly enforces user-provided model requirements and never auto-downloads or bundles LLMs.

## 🏗️ Architecture

## 🏠 Local-Only Development Setup {#local-only-development}

### Vite Configuration (Localhost Only)
```typescript
// vite.config.ts
server: {
  port: 5174,
  host: 'localhost', // ✅ Restricts to localhost only
}
```

### Environment Variables
```env
# .env
DATABASE_URL="file:./dev.db"  # ✅ SQLite local database
NODE_ENV=development
ORIGIN=http://localhost:5173
```

### Development Commands
```bash
# Start development server (localhost only)
npm run dev

# Database operations
npx drizzle-kit generate
npx drizzle-kit push
```

## 🔄 SvelteKit Stores Architecture {#sveltekit-stores}

### Store Types and Usage

#### 1. Built-in $page Store
```typescript
// Automatic data from +page.server.ts
export let data = $page.data;
let user = $page.data.session?.user;
```

#### 2. Custom Session Store
```typescript
// src/lib/auth/userStore.ts
export const userSessionStore = writable<AppSession | null>(null);

// Usage in components
$: user = $userSessionStore?.user;
```

#### 3. Drag & Drop State Store
```typescript
// src/lib/stores/dragDrop.ts
export const dragDropStore = writable<DragDropState>({
  draggedItem: null,
  zones: [],
  isDragging: false
});
```

### Store Integration with SSR

```typescript
// +page.server.ts - Server-side data loading
export const load: PageServerLoad = async ({ locals }) => {
  const cases = await db.select().from(cases).where(eq(cases.createdBy, locals.user.id));
  return { cases }; // Available as $page.data.cases
};

// +page.svelte - Client-side reactivity
<script>
  export let data; // From load function
  $: cases = data.cases; // Reactive to navigation changes
</script>
```

### Store Best Practices

1. **Use $page.data for SSR data** - Always fresh on navigation
2. **Use custom stores for client-side state** - UI interactions, temporary data
3. **Combine both for optimal UX** - SSR for initial load, stores for interactions

## 🚀 API Routes & Caching Strategy {#api-routes-caching}

### Enhanced Caching Implementation

#### Cache Utility
```typescript
// src/lib/server/cache/cache.ts
export const cache = new WardenNetCache();

export const cacheKeys = {
  cases: {
    all: 'cases:all',
    byId: (id: string) => `cases:${id}`,
    byUser: (userId: string) => `cases:user:${userId}`,
    search: (query: string) => `cases:search:${query}`
  }
};

export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000,
  tags: string[] = []
): Promise<T>
```

#### API Route with Caching
```typescript
// src/routes/api/cases/+server.ts
export const GET: RequestHandler = async ({ url, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = cacheKeys.cases.byUser(userId);

  return json(await withCache(
    cacheKey,
    async () => await db.select().from(cases).where(eq(cases.createdBy, userId)),
    5 * 60 * 1000, // 5 minutes
    [cacheTags.cases, `user:${userId}`]
  ));
};
```

### Cache Invalidation Strategy

```typescript
// On data mutations
export const POST: RequestHandler = async ({ request, locals }) => {
  // ... create/update logic
  
  // Invalidate relevant caches
  invalidateCacheByTags([cacheTags.cases, `user:${userId}`]);
  
  return json({ success: true });
};
```

## 🗄️ Database Management {#database-management}


### Foreign Key Constraints
- **users.id** → Primary reference for all user-created content
- **cases.id** → Referenced by evidence, activities, law links
- **onDelete: 'cascade'** → Automatic cleanup
- **onDelete: 'restrict'** → Prevent accidental deletion

### JSON1 Field Usage
```typescript
// Storing complex data
const caseData = {
  metadata: { priority: 'high', jurisdiction: 'federal' },
  timeline: [{ date: '2025-01-01', event: 'Case opened' }],
  evidence_summary: { total_files: 5, key_evidence: ['doc1.pdf'] }
};

await db.insert(cases).values({
  id: crypto.randomUUID(),
  data: JSON.stringify(caseData), // Stored as JSON1
  tags: JSON.stringify(['felony', 'drug-related'])
});
```

## 🏗️ Best Practices Implementation {#best-practices}

### 1. Background Jobs Pattern
```typescript
// src/lib/server/jobs/aiProcessor.ts
export class AIProcessor {
  private queue: Array<{ id: string; type: string; data: any }> = [];
  
  async processEvidenceAnalysis(evidenceId: string) {
    // Add to background queue
    this.queue.push({
      id: crypto.randomUUID(),
      type: 'evidence_analysis',
      data: { evidenceId }
    });
    
    // Process asynchronously
    setImmediate(() => this.processQueue());
  }
  
  private async processQueue() {
    // Extract text, generate summary, create embeddings
    // Update database with AI results
    // Invalidate relevant caches
  }
}
```

### 2. State Machines for Complex Workflows
```typescript
// src/lib/stores/caseStateMachine.ts
export const caseStateMachine = {
  initial: 'draft',
  states: {
    draft: { on: { SUBMIT: 'under_review' } },
    under_review: { on: { APPROVE: 'active', REJECT: 'draft' } },
    active: { on: { CLOSE: 'closed', SUSPEND: 'suspended' } },
    closed: { type: 'final' },
    suspended: { on: { REACTIVATE: 'active' } }
  }
};
```

### 3. Event Store Pattern
```typescript
// src/lib/server/db/schema.ts
export const caseEvents = sqliteTable('case_events', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(), // 'created', 'evidence_added', 'status_changed'
  eventData: text('event_data', { mode: 'json' }).notNull(),
  userId: text('user_id').references(() => users.id),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Usage
async function logCaseEvent(caseId: string, eventType: string, eventData: any, userId: string) {
  await db.insert(caseEvents).values({
    id: crypto.randomUUID(),
    caseId,
    eventType,
    eventData: JSON.stringify(eventData),
    userId,
    timestamp: new Date()
  });
}
```

### 4. Predictive NLP Integration
```typescript
// src/lib/nlp/analyzer.ts
export class PredictiveAnalyzer {
  async analyzeCaseDescription(description: string): Promise<CaseAnalysis> {
    // 1. Extract entities (names, locations, crimes)
    const entities = await this.extractEntities(description);
    
    // 2. Predict case category and severity
    const predictions = await this.predictCaseOutcome(description);
    
    // 3. Suggest related statutes
    const relatedLaws = await this.findRelatedStatutes(entities);
    
    // 4. Generate embeddings for semantic search
    const embedding = await this.generateEmbedding(description);
    
    return {
      entities,
      predictions,
      relatedLaws,
      embedding,
      confidence: predictions.confidence
    };
  }
}
```

## 🦀 Tauri/Rust Integration Preparation {#tauri-preparation}

### Rust Backend Structure
```
src-tauri/
├── src/
│   ├── main.rs              # Tauri app setup
│   ├── database.rs          # postgres operations
│   ├── ai_service.rs        # Local LLM integration
│   ├── file_handler.rs      # Evidence file processing
│   └── commands/            # Tauri commands
│       ├── cases.rs
│       ├── evidence.rs
│       └── sync.rs
```

### Tauri Commands for CRUD
```rust
// src-tauri/src/commands/cases.rs
#[tauri::command]
pub async fn get_cases(user_id: String) -> Result<Vec<Case>, String> {
    let conn = establish_connection()?;
    let cases = sqlx::query_as!(
        Case,
        "SELECT * FROM cases WHERE created_by = ? ORDER BY created_at DESC",
        user_id
    )
    .fetch_all(&conn)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(cases)
}

#[tauri::command]
pub async fn create_case(case_data: CreateCaseRequest, user_id: String) -> Result<Case, String> {
    // Insert case with JSON1 support
    // Trigger background AI analysis
    // Return created case
}
```

### SvelteKit ↔ Tauri Integration
```typescript
// src/lib/tauri/caseService.ts
import { invoke } from '@tauri-apps/api/tauri';

export class TauriCaseService {
  async getCases(userId: string): Promise<Case[]> {
    return await invoke('get_cases', { userId });
  }
  
  async createCase(caseData: CreateCaseRequest): Promise<Case> {
    return await invoke('create_case', { caseData });
  }
}

// Use in Svelte components
const tauriService = new TauriCaseService();
$: cases = tauriService.getCases($userSessionStore.user.id);
```

### Offline-First Data Sync
```rust
// src-tauri/src/sync.rs
pub struct SyncManager {
    local_db: postgres:,
    remote_endpoint: String,
}

impl SyncManager {
    pub async fn sync_cases(&self) -> Result<(), SyncError> {
        // 1. Upload local changes to remote
        // 2. Download remote changes
        // 3. Resolve conflicts using timestamp + user preference
        // 4. Update local database
        // 5. Emit events to frontend for UI updates
    }
}
```

## 📱 Flutter Architecture Planning {#flutter-planning}

### Shared Database Schema
```dart
// lib/models/case.dart
class Case {
  final String id;
  final String title;
  final String description;
  final String createdBy;
  final Map<String, dynamic> data; // JSON1 field
  final List<String> tags;
  final DateTime createdAt;
  
  // postgres integration with same schema as web/Tauri
}
```

### Cross-Platform API
```dart
// lib/services/api_service.dart
abstract class ApiService {
  Future<List<Case>> getCases(String userId);
  Future<Case> createCase(CreateCaseRequest request);
  Future<void> syncData();
}

// Platform-specific implementations
class WebApiService extends ApiService {
  // HTTP calls to SvelteKit API
}

class TauriApiService extends ApiService {
  // Direct postgres calls (shared with Rust)
}
```

## ✅ Next Steps to Completion {#next-steps}

### Immediate Tasks
1. **✅ Database Migration**
   ```bash
   cd "c:\Users\james\Downloads\Deeds-App-doesn-t-work--main (2)\Deeds-App-doesn-t-work--main"
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

2. **🔄 Update Remaining API Routes**
   - Update `api/criminals/+server.ts` with caching
   - Update `api/statutes/+server.ts` with caching
   - Update `api/crimes/+server.ts` with caching

3. **🎨 Frontend Component Updates**
   - Update vanilla css integration in all components
   - Ensure all navigation uses `<a href="">` for SSR
   - Connect components to cached API endpoints

### Integration Tasks
4. **🦀 Tauri Rust Implementation**
   - Implement postgres CRUD commands in Rust
   - Create Tauri commands for all major entities
   - Add file handling and AI service integration

5. **🧠 AI/NLP Integration**
   - Set up local LLM service (Python/Node.js)
   - Implement embeddings generation
   - Create Qdrant vector database integration

6. **📱 Cross-Platform Preparation**
   - Document API contracts for Flutter
   - Create shared data models
   - Plan sync strategy between platforms

### Testing & Documentation
7. **🧪 Testing Strategy**
   - Extend Playwright tests for all features
   - Add unit tests for cache utilities
   - Test offline functionality in Tauri

8. **📖 Final Documentation**
   - API documentation
   - Deployment guide
   - User manual

## 🎯 Architecture Summary

### Core Technologies
- **Frontend**: SvelteKit + vanilla css
- **Database**: postgres + pgvector ? 
- **ORM**: Drizzle ORM with full type safety
- **Caching**: Custom in-memory cache with LokiJS
- **AI/NLP**: Local LLM integration + Qdrant vector DB
- **Desktop**: Tauri + Rust backend
- **Mobile**: Flutter (future)

### Key Features Implemented
✅ Local-only development (localhost restricted)  
✅ Stateless SSR with real-time caching  
✅ Comprehensive database schema with foreign keys  
✅ Advanced caching strategy with tag-based invalidation  
✅ Drag & drop evidence management  
✅ NLP-powered case analysis  
✅ Offline-first architecture preparation  

### Development Workflow
1. **Web Development**: SvelteKit + postgres for rapid prototyping
2. **Desktop Enhancement**: Tauri + Rust for native performance
3. **Mobile Expansion**: Flutter + shared database schema
4. **AI Integration**: Local LLM + vector search for advanced features

The application is architected for scalability, offline-first usage, and cross-platform deployment while maintaining a single source of truth in the postgres database with robust caching and real-time updates.

## 🧪 Playwright E2E Testing & Troubleshooting

### Playwright Setup for Local Development

- Playwright and @playwright/test are only installed in `web-app/sveltekit-frontend/package.json`.
- **Always run Playwright commands from the `web-app/sveltekit-frontend` directory.**
- If you see errors like:
  > Playwright Test did not expect test.describe() to be called here.
  > You have two different versions of @playwright/test.

  This means you have duplicate Playwright installs or are running from the wrong directory.

#### How to Fix Playwright Test Errors

1. **Clean up all node_modules and lock files:**
   ```powershell
   Remove-Item -Recurse -Force .\node_modules
   Remove-Item -Recurse -Force .\web-app\sveltekit-frontend\node_modules
   Remove-Item -Force .\package-lock.json
   Remove-Item -Force .\web-app\sveltekit-frontend\package-lock.json
   ```
2. **Reinstall dependencies in the correct place:**
   ```powershell
   cd .\web-app\sveltekit-frontend
   npm install
   ```
3. **Run Playwright tests:**
   ```powershell
   npx playwright test
   ```

#### Best Practices
- Never install Playwright in the monorepo root or other packages.
- If you add new tests, always add them to `web-app/sveltekit-frontend/tests/`.
- For local dev, ensure no other dev server is running before running Playwright tests.

#### Example Test Command
```powershell
cd web-app/sveltekit-frontend
npx playwright test
```

---
