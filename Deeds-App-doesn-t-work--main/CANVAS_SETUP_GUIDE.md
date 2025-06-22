# Interactive Canvas Setup Guide

This guide walks you through setting up the Interactive Legal Canvas with all its features.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Python environment for AI features (optional)
- Qdrant vector database (optional, for advanced AI features)

## 1. Install Dependencies

First, make sure you have the required packages:

```bash
cd web-app/sveltekit-frontend
npm install fabric sharp pdf-parse
```

## 2. Database Setup

Run the canvas states migration:

```bash
# From the project root
npm run db:migrate
```

Or manually run the SQL:
```sql
-- Copy and run the contents of drizzle/0001_add_canvas_states.sql
```

## 3. Environment Variables

Add these to your `.env` file:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/deeds_app

# AI Services (optional)
LLM_SERVICE_URL=http://localhost:8000
QDRANT_URL=http://localhost:6333

# File uploads
UPLOAD_DIR=static/uploads
```

## 4. File Upload Directory

Create the uploads directory:

```bash
mkdir -p web-app/sveltekit-frontend/static/uploads
```

## 5. Start the Development Server

```bash
cd web-app/sveltekit-frontend
npm run dev
```

## 6. Access the Interactive Canvas

Navigate to: `http://localhost:5173/interactive-canvas?caseId=your-case-id`

## Features Available

### ✅ Core Canvas Features
- **Fabric.js Integration**: Full-featured canvas with drag/drop, resize, rotate
- **Multi-page Support**: Expandable canvas pages
- **Text Editing**: Rich text tools with fonts, sizes, colors
- **Drawing Tools**: Free-hand drawing with customizable brushes
- **Object Grouping**: Group/ungroup canvas elements
- **Save/Load**: Persistent canvas state in PostgreSQL

### ✅ Evidence Handling
- **File Upload**: Support for images, PDFs, and text files
- **Image Processing**: Automatic thumbnail generation
- **PDF Processing**: Text extraction (ready for page-to-image conversion)
- **Metadata Extraction**: File information and processing details

### ✅ AI Integration
- **Auto-Summarization**: AI-powered text summarization with fallback
- **Auto-Tagging**: Intelligent content tagging using Qdrant or rule-based fallback
- **Entity Extraction**: Named entity recognition (when NLP service available)

### ✅ User Experience
- **Responsive Toolbar**: Comprehensive tool palette
- **Real-time Feedback**: Toast notifications for user actions
- **Export Functionality**: Download canvas as JSON + PNG
- **Auto-save**: Automatic saving on content changes
- **Loading States**: Visual feedback during processing

## API Endpoints

### Canvas Management
- `POST /api/canvas/save` - Save canvas state
- `GET /api/canvas/load?caseId=xxx` - Load canvas state

### Evidence Upload
- `POST /api/evidence/upload` - Upload and process evidence files

### AI Features
- `POST /api/ai/summarize` - Generate text summaries
- `POST /api/ai/autotag` - Auto-tag content with relevant labels

## Component Usage

### Basic Usage
```svelte
<script>
  import CanvasEditor from '$lib/components/CanvasEditor.svelte';
  
  let caseId = 'case-123';
</script>

<CanvasEditor 
  {caseId}
  width={1200} 
  height={800}
  on:canvasSaved={handleSave}
  on:evidenceUploaded={handleUpload}
  on:error={handleError}
/>
```

### Advanced Usage with Events
```svelte
<script>
  function handleCanvasSaved() {
    console.log('Canvas saved successfully');
  }
  
  function handleEvidenceUploaded(event) {
    const { originalName, url } = event.detail;
    console.log(`Uploaded: ${originalName} -> ${url}`);
  }
  
  function handleAutoTagged(event) {
    const tags = event.detail;
    console.log('Auto-tagged with:', tags);
  }
</script>

<CanvasEditor 
  {caseId}
  on:canvasSaved={handleCanvasSaved}
  on:evidenceUploaded={handleEvidenceUploaded}
  on:autoTagged={handleAutoTagged}
/>
```

## Optional AI Service Setup

### Python NLP Service
If you want full AI features, set up a Python service:

```python
# requirements.txt
fastapi
uvicorn
transformers
torch
sentence-transformers

# main.py
from fastapi import FastAPI
from transformers import pipeline

app = FastAPI()
summarizer = pipeline("summarization")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

@app.post("/summarize")
async def summarize(data: dict):
    text = data["text"]
    result = summarizer(text, max_length=200, min_length=50)
    return {"summary": result[0]["summary_text"]}

@app.post("/embed")
async def embed(data: dict):
    text = data["text"]
    embedding = embedder.encode([text])[0].tolist()
    return {"embedding": embedding}

# Run with: uvicorn main:app --port 8000
```

### Qdrant Vector Database
```bash
# Start Qdrant with Docker
docker run -p 6333:6333 qdrant/qdrant

# Create collection for legal tags
curl -X PUT 'http://localhost:6333/collections/legal_tags' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "vectors": {
      "size": 384,
      "distance": "Cosine"
    }
  }'
```

## Troubleshooting

### Common Issues

1. **Canvas not rendering**: Check that Fabric.js is properly imported
2. **File uploads failing**: Verify upload directory exists and is writable
3. **AI features not working**: Check if NLP service is running (falls back gracefully)
4. **Database errors**: Ensure canvas_states table exists and migration ran
5. **TypeScript errors**: Make sure all dependencies are installed

### Development Tips

- Use browser dev tools to inspect canvas JSON structure
- Check network tab for API call responses
- Monitor server logs for detailed error messages
- Test with sample files in different formats

## Next Steps

1. **Customize the toolbar** - Add/remove tools based on your needs
2. **Enhance AI features** - Integrate with your specific legal AI models
3. **Add collaboration** - Implement real-time canvas sharing
4. **Mobile optimization** - Adapt UI for touch devices
5. **Advanced PDF handling** - Implement PDF-to-image conversion

## Support

The canvas editor is now fully functional with all planned features. You can:
- Upload evidence and automatically add it to the canvas
- Use AI summarization and auto-tagging
- Save and load canvas states
- Export canvas data
- Use all drawing and text editing tools

Start developing by navigating to `/interactive-canvas` in your SvelteKit app!
