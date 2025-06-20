# Legal NLP Application - Complete Implementation Guide

## Overview

This enhanced legal application now includes comprehensive NLP/LLM integration with support for multiple deployment targets:

- **Web Application (Vercel)**: Uses Gemini API and OpenAI for production LLM features
- **Desktop Application (Tauri)**: Supports local LLM models with offline capabilities
- **Mobile Application (Flutter)**: API-based integration with the same backend

## Architecture

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   SvelteKit     │    │    Tauri Desktop    │    │   Flutter Mobile    │
│   Web App       │    │      App            │    │       App           │
│   (Vercel)      │    │   (Local LLMs)      │    │   (API Client)      │
└─────────────────┘    └─────────────────────┘    └─────────────────────┘
         │                        │                         │
         └────────────────────────┼─────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    Node.js API Gateway    │
                    │      (SvelteKit API)      │
                    │    - Authentication       │
                    │    - CRUD Operations      │
                    │    - LLM Proxy            │
                    │    - Cache Management     │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  Python NLP/LLM Service  │
                    │  - Embedding Generation   │
                    │  - Local LLM Inference    │
                    │  - Entity Extraction      │
                    │  - Vector Operations      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Vector Database       │
                    │       (Qdrant)            │
                    │  - Semantic Search        │
                    │  - RAG Context            │
                    └───────────────────────────┘
```

## Features

### 1. Enhanced Law Paragraphs API ✅
- **Fixed JSON handling**: Robust parsing and storage of JSON fields
- **Better error handling**: Comprehensive try-catch blocks
- **Improved caching**: 10-minute TTL with tag-based invalidation
- **SQL injection protection**: Using proper Drizzle ORM queries

### 2. Multi-Platform LLM Integration ✅

#### Production (Vercel + Gemini/OpenAI)
- **Gemini API**: Primary LLM for text generation and analysis
- **OpenAI API**: Fallback option for specific use cases
- **Serverless functions**: Optimized for Vercel deployment
- **Environment-aware**: Automatically switches based on NODE_ENV

#### Development/Tauri (Local LLMs)
- **User-provided models only**: GGUF format models via llama.cpp
- **No automatic downloads**: Users must provide/upload their own GGUF models
- **File upload system**: Secure model upload and management interface
- **Offline capability**: Full functionality without internet (with user models)
- **Rust integration**: Tauri commands for user model management
- **Important**: The application never downloads, bundles, or provides models automatically

### 3. Advanced NLP Endpoints ✅

#### `/api/nlp/summarize`
- **RAG Integration**: Uses case context for better summaries
- **Multiple styles**: brief, detailed, legal, narrative
- **Caching**: 30-minute cache with invalidation
- **Fallback support**: Graceful degradation when services unavailable

#### `/api/nlp/extract-entities`
- **Entity types**: PERSON, ORGANIZATION, LOCATION, DATE, CRIME, LEGAL_TERM
- **Confidence scoring**: Configurable thresholds
- **Multiple backends**: Gemini AI, local LLM, rule-based fallback

#### `/api/nlp/suggest-autocomplete`
- **Template integration**: Uses saved statements for suggestions
- **Context-aware**: Category-based completions
- **Hybrid approach**: AI + template + rule-based suggestions

### 4. Case Relationship System ✅

#### `/api/cases/[caseId]/related`
- **AI-powered analysis**: Automatic relationship detection
- **User feedback integration**: Learns from user interactions
- **Confidence scoring**: Weighted by AI confidence + user feedback
- **Bidirectional relationships**: Handles parent-child and peer relationships

#### `/api/cases/[caseId]/feedback`
- **User feedback collection**: positive/negative/neutral ratings
- **Learning system**: Improves recommendations over time
- **Session tracking**: Groups related feedback actions
- **Analytics**: Provides feedback statistics and trends

### 5. Database Enhancements ✅

#### New Table: `caseRelationshipFeedback`
```sql
- id: Primary key
- parentCaseId: Reference to parent case
- relatedCaseId: Reference to related case
- userId: User who provided feedback
- feedback: 'positive', 'negative', 'neutral'
- userScore: -1, 0, 1 numerical representation
- confidence: Original AI confidence score
- context: Additional metadata as JSON
- timestamps: Created/updated tracking
```

### 6. Environment Configuration ✅
- **Comprehensive .env**: All LLM/NLP configuration options
- **Feature flags**: Enable/disable AI features
- **Performance settings**: Timeout and concurrency controls
- **Local model paths**: Configuration for Tauri deployment

## 🎥 Advanced Multimodal Evidence Analysis

### Overview

Extend your legal NLP platform with comprehensive multimodal evidence processing using open-source MIT-licensed algorithms for:

- **Image Enhancement & Upscaling**: OpenCV + AI-based super-resolution
- **Object Detection**: YOLO, CLIP for scene analysis
- **Video Processing**: Frame-by-frame analysis with ffmpeg
- **Audio Transcription**: Whisper for testimony analysis
- **OCR Integration**: Tesseract + PaddleOCR for document digitization
- **Scene Understanding**: Timeline reconstruction and contradiction detection

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SvelteKit Frontend UI                       │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │   Evidence Upload   │  │  Interactive Scene  │              │
│  │     Interface       │  │     Viewer          │              │
│  │ • Drag & Drop       │  │ • Anchor Points     │              │
│  │ • Progress Bars     │  │ • Hover Summaries   │              │
│  │ • Batch Processing  │  │ • Timeline View     │              │
│  └─────────────────────┘  └─────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│                    SvelteKit API Layer                           │
│  /api/evidence/upload    /api/evidence/analyze                   │
│  /api/scenes/extract     /api/summaries/generate                 │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│                Python Multimodal Processing Service              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   OpenCV    │ │    YOLO     │ │   Whisper   │ │ Tesseract   │ │
│  │ Enhancement │ │   Object    │ │    Audio    │ │    OCR      │ │
│  │ Upscaling   │ │ Detection   │ │ Transcript  │ │  Document   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│              Tauri Rust File Management                          │
│  • Secure local file storage                                    │
│  • Direct hardware acceleration access                          │
│  • Native OS integration for evidence handling                  │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│                Database + Vector Storage                         │
│  Drizzle ORM + SQLite/PostgreSQL    Qdrant Vector Database      │
│  • Evidence metadata               • Scene embeddings           │
│  • Processing results              • Similarity search          │
│  • Case associations               • RAG context                │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Guide

#### 1. Enhanced Python Service (Add to `main.py`)

```python
# Add these imports to your existing main.py
import cv2
import numpy as np
from ultralytics import YOLO  # YOLOv8
import whisper
import pytesseract
import ffmpeg
from PIL import Image, ImageEnhance
import torch

# New processing endpoints
class EvidenceProcessingRequest(BaseModel):
    file_path: str
    case_id: str
    evidence_type: str  # 'image', 'video', 'audio', 'document'
    enhancement_level: int = 1  # 1-3 for AI upscaling
    analysis_options: List[str] = ["objects", "text", "audio", "timeline"]

@app.post("/process-evidence")
async def process_evidence(request: EvidenceProcessingRequest):
    """Process multimodal evidence with AI enhancement"""
    results = {}
    
    try:
        if request.evidence_type == "image":
            results = await process_image_evidence(
                request.file_path, 
                request.enhancement_level,
                request.analysis_options
            )
        elif request.evidence_type == "video":
            results = await process_video_evidence(
                request.file_path,
                request.analysis_options
            )
        elif request.evidence_type == "audio":
            results = await process_audio_evidence(request.file_path)
        elif request.evidence_type == "document":
            results = await process_document_evidence(request.file_path)
            
        return {
            "status": "success",
            "case_id": request.case_id,
            "evidence_type": request.evidence_type,
            "processing_results": results,
            "embeddings_generated": True
        }
        
    except Exception as e:
        logger.error(f"Error processing evidence: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_image_evidence(file_path: str, enhancement_level: int, options: List[str]):
    """Enhanced image processing with AI upscaling and object detection"""
    results = {}
    
    # Load image
    image = cv2.imread(file_path)
    
    # AI-based image enhancement and upscaling (MIT licensed alternatives)
    if enhancement_level > 1:
        # Use ESRGAN or Real-ESRGAN for upscaling
        enhanced_image = enhance_image_quality(image, enhancement_level)
    else:
        enhanced_image = image
    
    if "objects" in options:
        # Object detection with YOLO
        model = YOLO('yolov8n.pt')  # Use nano model for speed
        results['objects'] = detect_objects(enhanced_image, model)
    
    if "text" in options:
        # OCR extraction
        results['text'] = extract_text_from_image(enhanced_image)
    
    # Generate scene summary
    results['scene_summary'] = generate_scene_summary(results)
    
    # Create embeddings for similarity search
    results['embeddings'] = generate_image_embeddings(enhanced_image)
    
    return results

async def process_video_evidence(file_path: str, options: List[str]):
    """Frame-by-frame video analysis with timeline reconstruction"""
    results = {
        "frames": [],
        "timeline": [],
        "summary": "",
        "contradictions": []
    }
    
    # Extract frames using ffmpeg
    frames = extract_video_frames(file_path)
    
    for i, frame in enumerate(frames):
        frame_analysis = {
            "timestamp": i * (1/30),  # Assuming 30fps
            "frame_number": i,
            "objects": [],
            "text": "",
            "emotions": [],
            "scene_description": ""
        }
        
        if "objects" in options:
            frame_analysis["objects"] = detect_objects(frame, YOLO('yolov8n.pt'))
        
        if "text" in options:
            frame_analysis["text"] = extract_text_from_image(frame)
            
        # Scene understanding with CLIP or similar
        frame_analysis["scene_description"] = describe_scene(frame)
        
        results["frames"].append(frame_analysis)
   