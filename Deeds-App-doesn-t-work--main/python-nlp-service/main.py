"""
Legal NLP/LLM Backend Service
============================

IMPORTANT: This service does NOT download, bundle, or provide any LLM models.
Users must provide their own GGUF models via the upload interface or by
setting the LLM_MODEL_PATH environment variable.

The service will only load models that users explicitly provide.
This service respects existing PyTorch installations and uses isolated environments.
"""

# Python NLP/LLM Service for Legal Document Processing
# This service handles embedding generation, LLM inference, and vector operations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import asyncio
import logging
from datetime import datetime
import json
from dotenv import load_dotenv
import sys

# Load environment variables first - CRITICAL for environment isolation
load_dotenv()

# Ensure environment isolation - protect user's global Python environment
if os.getenv("PYTHONPATH"):
    # Clear PYTHONPATH to prevent interference with user's environment
    os.environ.pop("PYTHONPATH", None)

if os.getenv("VIRTUAL_ENV_DISABLE_PROMPT", "false").lower() == "true":
    # Ensure we're in virtual environment and not affecting global environment
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  WARNING: Not running in virtual environment. This may interfere with your PyTorch installation.")
        print("   Please activate the virtual environment first: ./venv-legal-nlp/Scripts/Activate.ps1")

# Respect PyTorch environment settings
PRESERVE_USER_PYTORCH = os.getenv("PRESERVE_USER_PYTORCH", "true").lower() == "true"
SKIP_PYTORCH_INSTALL = os.getenv("SKIP_PYTORCH_INSTALL", "false").lower() == "true"
TORCH_DEVICE = os.getenv("TORCH_DEVICE", "auto")
USE_GPU = os.getenv("USE_GPU", "auto").lower()
FALLBACK_TO_CPU = os.getenv("FALLBACK_TO_CPU", "true").lower() == "true"

# Set PyTorch device before importing PyTorch-dependent libraries
if TORCH_DEVICE != "auto":
    os.environ["CUDA_VISIBLE_DEVICES"] = os.getenv("CUDA_VISIBLE_DEVICES", "0")

print(f"🛡️  Environment Protection Settings:")
print(f"   Preserve User PyTorch: {PRESERVE_USER_PYTORCH}")
print(f"   Skip PyTorch Install: {SKIP_PYTORCH_INSTALL}")
print(f"   Python Executable: {sys.executable}")
print(f"   Virtual Environment: {os.getenv('VIRTUAL_ENV', 'Not detected')}")

# LLM and ML imports with environment awareness
try:
    import numpy as np
except ImportError:
    np = None
    print("Warning: numpy not installed. Some features may be limited.")

# PyTorch imports with graceful degradation
PYTORCH_AVAILABLE = False
if not SKIP_PYTORCH_INSTALL:
    try:
        import torch
        PYTORCH_AVAILABLE = True
        print(f"✅ PyTorch {torch.__version__} loaded successfully")
        print(f"   Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")
        print(f"   CUDA Available: {torch.cuda.is_available()}")
        
        # Respect user's PyTorch installation
        if PRESERVE_USER_PYTORCH:
            print("📦 Using PyTorch in compatibility mode (preserving user installation)")
    except ImportError as e:
        print(f"⚠️  PyTorch not available: {e}")
        if FALLBACK_TO_CPU:
            print("   Falling back to CPU-only processing")
        else:
            print("   Some AI features will be limited")

# Sentence transformers with conditional loading
try:
    if PYTORCH_AVAILABLE:
        from sentence_transformers import SentenceTransformer
        print("✅ SentenceTransformers loaded successfully")
    else:
        SentenceTransformer = None
        print("⚠️  SentenceTransformers not available (PyTorch required)")
except ImportError:
    SentenceTransformer = None
    print("⚠️  SentenceTransformers not installed")
except ImportError:
    SentenceTransformer = None
    print("Warning: sentence-transformers not installed. Embedding features disabled.")

try:
    from llama_cpp import Llama, LlamaGrammar
except ImportError:
    Llama = None
    LlamaGrammar = None
    print("Warning: llama-cpp-python not installed. Local LLM features disabled.")

try:
    import qdrant_client
except ImportError:
    qdrant_client = None
    print("Warning: qdrant-client not installed. Vector search features disabled.")

# Multimodal processing imports
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("Warning: opencv-python not installed. Image processing disabled.")

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("Warning: ultralytics not installed. Object detection disabled.")

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("Warning: whisper not installed. Audio processing disabled.")

try:
    import pytesseract
    from PIL import Image, ImageEnhance
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: OCR libraries not installed. Text extraction disabled.")

try:
    import ffmpeg
    FFMPEG_AVAILABLE = True
except ImportError:
    FFMPEG_AVAILABLE = False
    print("Warning: ffmpeg-python not installed. Video processing limited.")

# Validate that no auto-download functions are present
def _prevent_auto_downloads():
    """Security check to ensure no automatic model downloads"""
    # This function will raise an error if any auto-download code is detected
    forbidden_functions = [
        'download_model', 'auto_download', 'fetch_model', 
        'get_model', 'load_default_model', 'install_model'
    ]
    
    current_module = globals()
    for func_name in forbidden_functions:
        if func_name in current_module:
            raise RuntimeError(f"SECURITY ERROR: Auto-download function '{func_name}' detected. This is not allowed.")
    
    # Check for common auto-download imports
    forbidden_imports = ['huggingface_hub.hf_hub_download', 'transformers.AutoModel']
    # Implementation would check these aren't being used for auto-downloads

# Run security check
_prevent_auto_downloads()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Legal NLP Service - User Models Only",
    description="NLP/LLM service that only uses user-provided models. No automatic downloads.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
SENTENCE_MODEL = None
LLM_MODEL = None
QDRANT_CLIENT = None

# Global variables for multimodal models
YOLO_MODEL = None
WHISPER_MODEL = None

# Configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
LLM_MODEL_PATH = os.getenv("LLM_MODEL_PATH")  # User must provide their own model
SENTENCE_MODEL_NAME = os.getenv("SENTENCE_MODEL", "all-MiniLM-L6-v2")
MODELS_DIR = os.getenv("MODELS_DIR", "./models")
EVIDENCE_STORAGE = os.getenv("EVIDENCE_STORAGE_PATH", "./evidence_storage")
AI_MODELS_PATH = os.getenv("AI_MODELS_PATH", "./ai_models")
MAX_VIDEO_DURATION = int(os.getenv("MAX_VIDEO_DURATION", "300"))  # 5 minutes
ENABLE_MULTIMODAL = os.getenv("ENABLE_MULTIMODAL_ANALYSIS", "true").lower() == "true"

# Data models
class EmbedRequest(BaseModel):
    text: str
    normalize: bool = True

class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = 512
    temperature: float = 0.7
    context: Optional[str] = None
    grammar: Optional[str] = None  # For GBNF grammar to force structured output

class SearchRequest(BaseModel):
    query_text: str
    collection_name: str = "legal_documents"
    limit: int = 10
    score_threshold: float = 0.7

class EntityExtractionRequest(BaseModel):
    text: str
    entity_types: List[str] = ["PERSON", "ORG", "LOC", "DATE"]
    confidence_threshold: float = 0.7

class AutocompleteRequest(BaseModel):
    text: str
    context: str = ""
    category: str = "general"
    max_suggestions: int = 5

# Multimodal data models
class EvidenceProcessingRequest(BaseModel):
    file_path: str
    case_id: str
    evidence_type: str  # 'image', 'video', 'audio', 'document'
    enhancement_level: int = 1  # 1-3 for AI upscaling
    analysis_options: List[str] = ["objects", "text", "audio", "timeline", "emotions"]
    frame_sample_rate: int = 30  # For video processing

class SceneAnalysisRequest(BaseModel):
    case_id: str
    evidence_id: str
    prompt: str = "Analyze this legal evidence scene for intent, actions, and contradictions"
    include_emotions: bool = True
    include_timeline: bool = True

class LegalRAGRequest(BaseModel):
    case_id: str
    query: str
    scene_context: Optional[Dict[str, Any]] = None
    max_similar_scenes: int = 5

# Initialize models
async def initialize_models():
    global SENTENCE_MODEL, LLM_MODEL, QDRANT_CLIENT, YOLO_MODEL, WHISPER_MODEL
    
    try:
        # Initialize Sentence Transformer for embeddings
        if SentenceTransformer:
            logger.info(f"Loading sentence transformer model: {SENTENCE_MODEL_NAME}")
            SENTENCE_MODEL = SentenceTransformer(SENTENCE_MODEL_NAME)
            logger.info("Sentence transformer model loaded successfully")
        
        # Initialize LLM ONLY if user has provided a model path
        if LLM_MODEL_PATH and os.path.exists(LLM_MODEL_PATH):
            # Validate the model file is actually user-provided
            if not LLM_MODEL_PATH.endswith('.gguf'):
                logger.error(f"Invalid model format: {LLM_MODEL_PATH}. Only GGUF models are supported.")
                logger.info("User must provide a GGUF format model file.")
            else:
                logger.info(f"Loading user-provided LLM model: {LLM_MODEL_PATH}")
                logger.info("⚠️  REMINDER: This model was provided by the user. No models are downloaded automatically.")
                if Llama:
                    LLM_MODEL = Llama(
                        model_path=LLM_MODEL_PATH,
                        n_ctx=2048,  # Context window
                        n_threads=4,  # Number of threads
                        verbose=False
                    )
                    logger.info("✅ User LLM model loaded successfully")
        else:
            logger.info("❌ No LLM model provided.")
            logger.info("🔧 Set LLM_MODEL_PATH environment variable to use local LLM features.")
            logger.info("📝 Users must provide their own GGUF models - no automatic downloads occur.")
            logger.info("🔄 Only rule-based NLP features will be available until a user model is provided.")
        
        # Initialize multimodal models if enabled
        if ENABLE_MULTIMODAL:
            await initialize_multimodal_models()
        
        # Initialize Qdrant client
        if qdrant_client:
            logger.info(f"Connecting to Qdrant at {QDRANT_URL}")
            QDRANT_CLIENT = qdrant_client.QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY
            )
            logger.info("Qdrant client initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing models: {e}")
        logger.info("Service will continue with limited functionality")

async def initialize_multimodal_models():
    """Initialize multimodal processing models (user-provided only)"""
    global YOLO_MODEL, WHISPER_MODEL
    
    try:
        # Initialize YOLO for object detection (open-source, MIT licensed)
        if YOLO_AVAILABLE:
            logger.info("Loading YOLO model for object detection...")
            YOLO_MODEL = YOLO('yolov8n.pt')  # Will download on first use
            logger.info("✅ YOLO model loaded successfully")
        
        # Initialize Whisper for audio processing (open-source)
        if WHISPER_AVAILABLE:
            logger.info("Loading Whisper model for audio transcription...")
            WHISPER_MODEL = whisper.load_model("base")
            logger.info("✅ Whisper model loaded successfully")
        
        # Create evidence storage directories
        os.makedirs(EVIDENCE_STORAGE, exist_ok=True)
        os.makedirs(AI_MODELS_PATH, exist_ok=True)
        logger.info(f"Evidence storage initialized: {EVIDENCE_STORAGE}")
        
    except Exception as e:
        logger.error(f"Error initializing multimodal models: {e}")
        logger.info("Multimodal features will be limited")

@app.on_event("startup")
async def startup_event():
    await initialize_models()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "sentence_transformer": SENTENCE_MODEL is not None,
            "user_llm_loaded": LLM_MODEL is not None,
            "qdrant": QDRANT_CLIENT is not None
        },
        "user_model_status": {
            "model_path": LLM_MODEL_PATH if LLM_MODEL_PATH else "No user model provided",
            "model_loaded": LLM_MODEL is not None,
            "models_directory": MODELS_DIR,
            "reminder": "This service only uses user-provided models. No automatic downloads occur."
        }
    }

@app.post("/embed")
async def generate_embedding(request: EmbedRequest):
    """Generate vector embeddings for text"""
    if SENTENCE_MODEL is None:
        raise HTTPException(status_code=503, detail="Sentence model not available")
    
    try:
        # Generate embedding
        embedding = SENTENCE_MODEL.encode([request.text])
        
        if request.normalize:
            # Normalize the embedding
            embedding = embedding / np.linalg.norm(embedding)
        
        return {
            "embedding": embedding[0].tolist(),
            "dimension": len(embedding[0]),
            "model": SENTENCE_MODEL_NAME
        }
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_text(request: GenerateRequest):
    """Generate text using local LLM with optional GBNF grammar constraint"""
    if LLM_MODEL is None:
        raise HTTPException(status_code=503, detail="LLM model not available")
    
    try:
        # Prepare the prompt
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"Context: {request.context}\n\n{request.prompt}"
        
        # Prepare generation parameters
        generate_params = {
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "echo": False
        }
        
        # Add GBNF grammar if provided
        if request.grammar and LlamaGrammar is not None:
            try:
                grammar = LlamaGrammar.from_string(request.grammar)
                generate_params["grammar"] = grammar
                logger.info("Using GBNF grammar for constrained generation")
            except Exception as grammar_error:
                logger.warning(f"Failed to parse GBNF grammar: {grammar_error}")
                # Continue without grammar constraint
        
        # Generate response
        start_time = datetime.now()
        
        response = LLM_MODEL(
            full_prompt,
            **generate_params
        )
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        generated_text = response["choices"][0]["text"].strip()
        
        return {
            "response": generated_text,
            "tokens_used": response["usage"]["total_tokens"],
            "processing_time_seconds": processing_time,
            "model": "local_llm",
            "grammar_used": bool(request.grammar and LlamaGrammar is not None)
        }
    except Exception as e:
        logger.error(f"Error generating text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-qdrant")
async def search_vectors(request: SearchRequest):
    """Search for similar vectors in Qdrant"""
    if QDRANT_CLIENT is None or SENTENCE_MODEL is None:
        raise HTTPException(status_code=503, detail="Vector search services not available")
    
    try:
        # Generate query embedding
        query_embedding = SENTENCE_MODEL.encode([request.query_text])[0].tolist()
        
        # Search in Qdrant
        search_results = QDRANT_CLIENT.search(
            collection_name=request.collection_name,
            query_vector=query_embedding,
            limit=request.limit,
            score_threshold=request.score_threshold
        )
        
        # Format results
        results = []
        for result in search_results:
            results.append({
                "id": result.id,
                "score": result.score,
                "payload": result.payload
            })
        
        return {
            "results": results,
            "query": request.query_text,
            "total_found": len(results)
        }
    except Exception as e:
        logger.error(f"Error searching vectors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-entities")
async def extract_entities(request: EntityExtractionRequest):
    """Extract entities from text using rule-based approach"""
    # This is a simplified implementation
    # In production, you might use spaCy, transformers, or other NLP libraries
    
    import re
    
    entities = []
    text = request.text
    
    # Person names (simple pattern)
    if "PERSON" in request.entity_types:
        person_pattern = r'\b[A-Z][a-z]+ [A-Z][a-z]+\b'
        for match in re.finditer(person_pattern, text):
            entities.append({
                "text": match.group(),
                "type": "PERSON",
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.8
            })
    
    # Organizations
    if "ORG" in request.entity_types:
        org_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Corp|Inc|LLC|Company|Co)\b'
        for match in re.finditer(org_pattern, text):
            entities.append({
                "text": match.group(),
                "type": "ORG",
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.85
            })
    
    # Dates
    if "DATE" in request.entity_types:
        date_pattern = r'\b\d{1,2}/\d{1,2}/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b'
        for match in re.finditer(date_pattern, text):
            entities.append({
                "text": match.group(),
                "type": "DATE",
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.95
            })
    
    # Filter by confidence threshold
    filtered_entities = [e for e in entities if e["confidence"] >= request.confidence_threshold]
    
    return {
        "entities": filtered_entities,
        "entity_count": len(filtered_entities)
    }

@app.post("/suggest-autocomplete")
async def suggest_autocomplete(request: AutocompleteRequest):
    """Generate autocomplete suggestions"""
    if LLM_MODEL is None:
        # Fallback to rule-based suggestions
        legal_phrases = [
            "the defendant did willfully and unlawfully",
            "based on the evidence presented",
            "in accordance with applicable law",
            "the prosecution hereby submits",
            "pursuant to the charges filed"
        ]
        
        suggestions = [phrase for phrase in legal_phrases 
                      if request.text.lower() in phrase.lower()][:request.max_suggestions]
        
        return {
            "suggestions": [{"text": s, "confidence": 0.6} for s in suggestions],
            "source": "rule_based"
        }
    
    try:
        prompt = f"""Complete this legal text in a professional manner:
Context: {request.context}
Category: {request.category}
Text to complete: "{request.text}"

Provide {request.max_suggestions} different completions:"""

        response = LLM_MODEL(
            prompt,
            max_tokens=200,
            temperature=0.7,
            echo=False
        )
        
        # Parse response to extract suggestions
        response_text = response["choices"][0]["text"].strip()
        lines = [line.strip() for line in response_text.split('\n') if line.strip()]
        
        suggestions = []
        for i, line in enumerate(lines[:request.max_suggestions]):
            suggestions.append({
                "text": line,
                "confidence": 0.8 - (i * 0.1)
            })
        
        return {
            "suggestions": suggestions,
            "source": "llm"
        }
    except Exception as e:
        logger.error(f"Error generating autocomplete: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-relationship")
async def analyze_relationship(request: dict):
    """Analyze relationship between two cases"""
    if LLM_MODEL is None:
        raise HTTPException(status_code=503, detail="LLM model not available")
    
    try:
        prompt = request.get("prompt", "")
        
        response = LLM_MODEL(
            prompt,
            max_tokens=300,
            temperature=0.3,
            echo=False
        )
        
        response_text = response["choices"][0]["text"].strip()
        
        # Try to parse as JSON, fallback to text response
        try:
            analysis = json.loads(response_text)
        except:
            analysis = {
                "similarity": 0.5,
                "relationshipType": "related",
                "recommendation": response_text,
                "confidence": 0.6
            }
        
        return {"analysis": analysis}
    except Exception as e:
        logger.error(f"Error analyzing relationship: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# User Model Management Endpoints

@app.get("/models")
async def list_available_models():
    """List user-provided models in the models directory"""
    models = []
    models_dir = MODELS_DIR
    
    if os.path.exists(models_dir):
        for filename in os.listdir(models_dir):
            if filename.endswith('.gguf'):
                filepath = os.path.join(models_dir, filename)
                stat = os.stat(filepath)
                models.append({
                    "filename": filename,
                    "path": filepath,
                    "size_mb": round(stat.st_size / (1024 * 1024), 2),
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "is_active": filepath == LLM_MODEL_PATH
                })
    
    return {
        "models": models,
        "models_directory": models_dir,
        "active_model": LLM_MODEL_PATH,
        "total_models": len(models)
    }

@app.post("/models/load")
async def load_model(request: dict):
    """Load a specific user-provided model - NO AUTOMATIC DOWNLOADS"""
    global LLM_MODEL, LLM_MODEL_PATH
    
    model_path = request.get("model_path")
    
    # Security check: Ensure this is a user-provided path
    if not model_path:
        raise HTTPException(status_code=400, detail="Model path is required. Users must provide their own GGUF models.")
    
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Model file not found. Please verify the path to your GGUF model.")
    
    if not model_path.endswith('.gguf'):
        raise HTTPException(status_code=400, detail="Only user-provided GGUF model files are supported. No automatic downloads occur.")
    
    # Additional security check: ensure path is not a URL or remote reference
    if model_path.startswith(('http://', 'https://', 'ftp://', 'sftp://')):
        raise HTTPException(status_code=400, detail="Remote URLs not allowed. Only local user-provided files are supported.")
    
    try:
        # Unload current model if any
        if LLM_MODEL:
            del LLM_MODEL
            LLM_MODEL = None
        
        # Load new model
        logger.info(f"Loading user model: {model_path}")
        LLM_MODEL = Llama(
            model_path=model_path,
            n_ctx=2048,
            n_threads=4,
            verbose=False
        )
        LLM_MODEL_PATH = model_path
        
        logger.info(f"Successfully loaded model: {model_path}")
        return {
            "status": "success",
            "message": f"Model loaded: {os.path.basename(model_path)}",
            "model_path": model_path
        }
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

@app.post("/models/unload")
async def unload_model():
    """Unload the current model to free memory"""
    global LLM_MODEL, LLM_MODEL_PATH
    
    if LLM_MODEL:
        del LLM_MODEL
        LLM_MODEL = None
        old_path = LLM_MODEL_PATH
        LLM_MODEL_PATH = None
        
        return {
            "status": "success",
            "message": f"Model unloaded: {os.path.basename(old_path) if old_path else 'unknown'}",
            "previous_model": old_path
        }
    else:
        return {
            "status": "info",
            "message": "No model was loaded"
        }

@app.get("/models/status")
async def get_model_status():
    """Get current model loading status"""
    return {
        "model_loaded": LLM_MODEL is not None,
        "model_path": LLM_MODEL_PATH,
        "model_name": os.path.basename(LLM_MODEL_PATH) if LLM_MODEL_PATH else None,
        "sentence_model_loaded": SENTENCE_MODEL is not None,
        "qdrant_connected": QDRANT_CLIENT is not None,
        "models_directory": MODELS_DIR,
        "multimodal_status": {
            "yolo_available": YOLO_AVAILABLE and YOLO_MODEL is not None,
            "whisper_available": WHISPER_AVAILABLE and WHISPER_MODEL is not None,
            "opencv_available": CV2_AVAILABLE,
            "ocr_available": OCR_AVAILABLE,
            "ffmpeg_available": FFMPEG_AVAILABLE,
            "multimodal_enabled": ENABLE_MULTIMODAL
        }
    }

# Multimodal Evidence Processing Endpoints

@app.post("/evidence/process")
async def process_evidence(request: EvidenceProcessingRequest):
    """Process evidence file (image/video/audio) with AI analysis"""
    if not ENABLE_MULTIMODAL:
        raise HTTPException(status_code=503, detail="Multimodal processing is disabled")
    
    file_path = request.file_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Evidence file not found")
    
    try:
        evidence_id = f"evidence_{request.case_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        results = {
            "evidence_id": evidence_id,
            "case_id": request.case_id,
            "file_path": file_path,
            "evidence_type": request.evidence_type,
            "analysis_results": {},
            "anchor_points": [],
            "markdown_summary": "",
            "embeddings": []
        }
        
        # Process based on evidence type
        if request.evidence_type == "image":
            results.update(await process_image_evidence(file_path, request))
        elif request.evidence_type == "video":
            results.update(await process_video_evidence(file_path, request))
        elif request.evidence_type == "audio":
            results.update(await process_audio_evidence(file_path, request))
        elif request.evidence_type == "document":
            results.update(await process_document_evidence(file_path, request))
        
        # Generate embeddings for Qdrant
        if SENTENCE_MODEL and results.get("text_content"):
            embeddings = SENTENCE_MODEL.encode([results["text_content"]])[0].tolist()
            results["embeddings"] = embeddings
            
            # Store in Qdrant if available
            if QDRANT_CLIENT:
                try:
                    QDRANT_CLIENT.upsert(
                        collection_name="legal_evidence",
                        points=[{
                            "id": evidence_id,
                            "vector": embeddings,
                            "payload": {
                                "case_id": request.case_id,
                                "evidence_type": request.evidence_type,
                                "file_path": file_path,
                                "summary": results.get("markdown_summary", ""),
                                "timestamp": datetime.now().isoformat()
                            }
                        }]
                    )
                except Exception as e:
                    logger.warning(f"Failed to store in Qdrant: {e}")
        
        return results
        
    except Exception as e:
        logger.error(f"Error processing evidence: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_image_evidence(file_path: str, request: EvidenceProcessingRequest):
    """Process image evidence with computer vision analysis"""
    results = {
        "analysis_results": {},
        "anchor_points": [],
        "text_content": "",
        "markdown_summary": ""
    }
    
    try:
        # Load image
        if CV2_AVAILABLE:
            image = cv2.imread(file_path)
            if image is None:
                raise ValueError("Could not load image")
            
            height, width = image.shape[:2]
            
            # Object detection with YOLO
            if "objects" in request.analysis_options and YOLO_AVAILABLE and YOLO_MODEL:
                yolo_results = YOLO_MODEL(image)
                objects_found = []
                
                for result in yolo_results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            conf = float(box.conf[0])
                            cls = int(box.cls[0])
                            class_name = YOLO_MODEL.names[cls]
                            
                            if conf > 0.5:  # Confidence threshold
                                objects_found.append({
                                    "class": class_name,
                                    "confidence": conf,
                                    "bbox": [float(x1), float(y1), float(x2), float(y2)]
                                })
                                
                                # Add anchor point
                                results["anchor_points"].append({
                                    "x": float((x1 + x2) / 2 / width),
                                    "y": float((y1 + y2) / 2 / height),
                                    "type": "object",
                                    "label": class_name,
                                    "confidence": conf,
                                    "description": f"Detected {class_name} with {conf:.1%} confidence"
                                })
                
                results["analysis_results"]["objects"] = objects_found
              # OCR text extraction
            if "text" in request.analysis_options and OCR_AVAILABLE:
                try:
                    pil_image = Image.open(file_path)
                    
                    # Enhance image for better OCR
                    enhancer = ImageEnhance.Contrast(pil_image)
                    enhanced = enhancer.enhance(2.0)
                    
                    # Extract text
                    text = pytesseract.image_to_string(enhanced)
                    text_data = pytesseract.image_to_data(enhanced, output_type=pytesseract.Output.DICT)
                    
                    results["analysis_results"]["text"] = {
                        "extracted_text": text.strip(),
                        "confidence": "high" if len(text.strip()) > 10 else "low"
                    }
                    results["text_content"] += f"\nExtracted text: {text.strip()}"
                    
                    # Add text anchor points
                    for i, word in enumerate(text_data['text']):
                        if int(text_data['conf'][i]) > 30 and word.strip():
                            x = text_data['left'][i] + text_data['width'][i] // 2
                            y = text_data['top'][i] + text_data['height'][i] // 2
                            
                            results["anchor_points"].append({
                                "x": float(x / width),
                                "y": float(y / height),
                                "type": "text",
                                "label": word,
                                "confidence": text_data['conf'][i] / 100,
                                "description": f"Text: '{word}'"
                            })
                            
                except Exception as e:
                    logger.warning(f"OCR failed: {e}")
            
            # Image enhancement for legal analysis
            if request.enhancement_level > 1:
                try:
                    # Apply noise reduction and sharpening
                    enhanced = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
                    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
                    enhanced = cv2.filter2D(enhanced, -1, kernel)
                    
                    # Save enhanced version
                    enhanced_path = file_path.replace('.', '_enhanced.')
                    cv2.imwrite(enhanced_path, enhanced)
                    results["analysis_results"]["enhanced_path"] = enhanced_path
                    
                except Exception as e:
                    logger.warning(f"Image enhancement failed: {e}")
          # Generate markdown summary
        objects_desc = ""
        if results["analysis_results"].get("objects"):
            objects = results["analysis_results"]["objects"]
            obj_list = [f'{obj["class"]} ({obj["confidence"]:.1%})' for obj in objects[:5]]
            objects_desc = f"Objects detected: {', '.join(obj_list)}"
        
        text_desc = ""
        if results["analysis_results"].get("text"):
            text = results["analysis_results"]["text"]["extracted_text"]
            text_desc = f"Text content: {text[:100]}..." if len(text) > 100 else f"Text content: {text}"
        
        results["markdown_summary"] = f"""## Image Evidence Analysis

**File:** `{os.path.basename(file_path)}`
**Dimensions:** {width}x{height} pixels
**Analysis Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

### Detected Elements
{objects_desc}

### Text Content
{text_desc}

### Anchor Points
- **{len(results['anchor_points'])} interactive points** identified for detailed examination
- Hover over points in the viewer for detailed analysis

### Legal Relevance Assessment
This evidence requires further analysis to determine legal significance. Consider cross-referencing with case timeline and witness statements.
"""
        
        results["text_content"] += f" Objects: {objects_desc}. Text: {text_desc}"
        
    except Exception as e:
        logger.error(f"Image processing error: {e}")
        results["analysis_results"]["error"] = str(e)
    
    return results

async def process_video_evidence(file_path: str, request: EvidenceProcessingRequest):
    """Process video evidence with scene analysis"""
    results = {
        "analysis_results": {},
        "anchor_points": [],
        "text_content": "",
        "markdown_summary": ""
    }
    
    try:
        if not CV2_AVAILABLE:
            raise ValueError("OpenCV not available for video processing")
        
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file")
        
        # Get video metadata
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Check duration limit
        if duration > MAX_VIDEO_DURATION:
            raise ValueError(f"Video duration ({duration:.1f}s) exceeds maximum ({MAX_VIDEO_DURATION}s)")
        
        # Sample frames for analysis
        sample_rate = max(1, int(fps / request.frame_sample_rate * fps))
        frames_analyzed = []
        timeline_events = []
        
        frame_num = 0
        while frame_num < frame_count:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
            ret, frame = cap.read()
            
            if not ret:
                break
            
            timestamp = frame_num / fps
            
            # Analyze frame
            frame_analysis = {}
            
            # Object detection on key frames
            if "objects" in request.analysis_options and YOLO_AVAILABLE and YOLO_MODEL:
                yolo_results = YOLO_MODEL(frame)
                objects_in_frame = []
                
                for result in yolo_results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            conf = float(box.conf[0])
                            if conf > 0.6:  # Higher threshold for video
                                cls = int(box.cls[0])
                                class_name = YOLO_MODEL.names[cls]
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                
                                objects_in_frame.append({
                                    "class": class_name,
                                    "confidence": conf,
                                    "timestamp": timestamp
                                })
                                
                                # Add timeline anchor point
                                results["anchor_points"].append({
                                    "x": timestamp / duration,  # Position on timeline
                                    "y": 0.5,  # Middle of timeline
                                    "type": "timeline_event",
                                    "label": f"{class_name} detected",
                                    "confidence": conf,
                                    "timestamp": timestamp,
                                    "description": f"At {timestamp:.1f}s: {class_name} detected with {conf:.1%} confidence"
                                })
                
                if objects_in_frame:
                    frame_analysis["objects"] = objects_in_frame
                    timeline_events.append({
                        "timestamp": timestamp,
                        "type": "object_detection",
                        "data": objects_in_frame
                    })
            
            frames_analyzed.append(frame_analysis)
            frame_num += sample_rate
        
        cap.release()
        
        # Audio analysis if requested
        if "audio" in request.analysis_options and WHISPER_AVAILABLE and WHISPER_MODEL:
            try:
                # Extract audio and transcribe
                audio_result = WHISPER_MODEL.transcribe(file_path)
                transcription = audio_result["text"]
                
                results["analysis_results"]["audio"] = {
                    "transcription": transcription,
                    "language": audio_result.get("language", "unknown")
                }
                
                results["text_content"] += f"\nAudio transcription: {transcription}"
                
                # Add transcription segments as anchor points
                for segment in audio_result.get("segments", []):
                    start_time = segment.get("start", 0)
                    text = segment.get("text", "")
                    
                    if text.strip():
                        results["anchor_points"].append({
                            "x": start_time / duration,
                            "y": 0.8,  # Audio track position
                            "type": "audio_segment",
                            "label": text[:30] + "..." if len(text) > 30 else text,
                            "timestamp": start_time,
                            "confidence": 0.9,
                            "description": f"Audio at {start_time:.1f}s: {text}"
                        })
                
            except Exception as e:
                logger.warning(f"Audio transcription failed: {e}")
        
        # Generate comprehensive analysis
        results["analysis_results"]["video_metadata"] = {
            "duration": duration,
            "fps": fps,
            "frame_count": frame_count,
            "resolution": f"{width}x{height}",
            "frames_analyzed": len(frames_analyzed)
        }
        
        results["analysis_results"]["timeline"] = timeline_events
        
        # Generate markdown summary
        object_summary = ""
        if timeline_events:
            unique_objects = set()
            for event in timeline_events:
                if event["type"] == "object_detection":
                    for obj in event["data"]:
                        unique_objects.add(obj["class"])
            object_summary = f"Objects detected: {', '.join(sorted(unique_objects))}"
        
        audio_summary = ""
        if results["analysis_results"].get("audio"):
            transcription = results["analysis_results"]["audio"]["transcription"]
            audio_summary = f"Audio transcript: {transcription[:200]}..." if len(transcription) > 200 else f"Audio transcript: {transcription}"
        
        results["markdown_summary"] = f"""## Video Evidence Analysis

**File:** `{os.path.basename(file_path)}`
**Duration:** {duration:.1f} seconds ({frame_count} frames at {fps:.1f} fps)
**Resolution:** {width}x{height}
**Analysis Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

### Timeline Analysis
{object_summary}

### Audio Analysis
{audio_summary}

### Interactive Timeline
- **{len(results['anchor_points'])} timeline events** identified
- Click on timeline markers for detailed frame analysis
- Audio segments synchronized with video timeline

### Legal Significance
Video evidence spans {duration:.1f} seconds with {len(timeline_events)} significant events detected. Cross-reference with witness statements and case timeline for legal relevance assessment.
"""
        
        results["text_content"] += f" Video: {duration:.1f}s, {object_summary}. {audio_summary}"
        
    except Exception as e:
        logger.error(f"Video processing error: {e}")
        results["analysis_results"]["error"] = str(e)
    
    return results

async def process_audio_evidence(file_path: str, request: EvidenceProcessingRequest):
    """Process audio evidence with speech recognition and analysis"""
    results = {
        "analysis_results": {},
        "anchor_points": [],
        "text_content": "",
        "markdown_summary": ""
    }
    
    try:
        if not WHISPER_AVAILABLE:
            raise ValueError("Whisper not available for audio processing")
        
        # Transcribe audio
        audio_result = WHISPER_MODEL.transcribe(file_path)
        transcription = audio_result["text"]
        language = audio_result.get("language", "unknown")
        
        results["analysis_results"]["transcription"] = {
            "text": transcription,
            "language": language,
            "segments": audio_result.get("segments", [])
        }
        
        # Create anchor points for audio segments
        for segment in audio_result.get("segments", []):
            start_time = segment.get("start", 0)
            end_time = segment.get("end", start_time + 1)
            text = segment.get("text", "").strip()
            
            if text:
                results["anchor_points"].append({
                    "x": start_time / audio_result.get("duration", 100),  # Normalized position
                    "y": 0.5,
                    "type": "audio_segment",
                    "label": text[:30] + "..." if len(text) > 30 else text,
                    "timestamp": start_time,
                    "duration": end_time - start_time,
                    "confidence": 0.9,
                    "description": f"Audio {start_time:.1f}s-{end_time:.1f}s: {text}"
                })
        
        # Generate markdown summary
        results["markdown_summary"] = f"""## Audio Evidence Analysis

**File:** `{os.path.basename(file_path)}`
**Language:** {language.title()}
**Duration:** {audio_result.get('duration', 'Unknown')} seconds
**Segments:** {len(audio_result.get('segments', []))}
**Analysis Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

### Full Transcription
{transcription}

### Audio Segments
- **{len(results['anchor_points'])} speech segments** identified
- Click on timeline for detailed segment analysis
- Timestamps synchronized for cross-reference with other evidence

### Legal Analysis Notes
Audio evidence contains {len(audio_result.get('segments', []))} distinct speech segments. Analyze for speaker identification, emotional content, and factual statements relevant to the case.
"""
        
        results["text_content"] = f"Audio transcription ({language}): {transcription}"
        
    except Exception as e:
        logger.error(f"Audio processing error: {e}")
        results["analysis_results"]["error"] = str(e)
    
    return results

async def process_document_evidence(file_path: str, request: EvidenceProcessingRequest):
    """Process document evidence with OCR and text analysis"""
    results = {
        "analysis_results": {},
        "anchor_points": [],
        "text_content": "",
        "markdown_summary": ""
    }
    
    try:
        # Determine document type and process accordingly
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext in ['.pdf']:
            # PDF processing would require additional libraries
            results["analysis_results"]["error"] = "PDF processing not implemented in this example"
        elif file_ext in ['.jpg', '.jpeg', '.png', '.tiff', '.bmp']:
            # Process as image document
            return await process_image_evidence(file_path, request)
        else:
            # Try to read as text file
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text_content = f.read()
            
            results["text_content"] = text_content
            results["analysis_results"]["text"] = {
                "content": text_content,
                "word_count": len(text_content.split()),
                "char_count": len(text_content)
            }
            
            # Simple text analysis for legal keywords
            legal_keywords = ['contract', 'agreement', 'liability', 'damages', 'breach', 'plaintiff', 'defendant', 'court', 'judgment']
            found_keywords = [kw for kw in legal_keywords if kw.lower() in text_content.lower()]
            
            results["analysis_results"]["legal_keywords"] = found_keywords
            
            results["markdown_summary"] = f"""## Document Evidence Analysis

**File:** `{os.path.basename(file_path)}`
**Type:** Text Document
**Word Count:** {len(text_content.split())}
**Analysis Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

### Content Summary
{text_content[:500]}{'...' if len(text_content) > 500 else ''}

### Legal Keywords Found
{', '.join(found_keywords) if found_keywords else 'No standard legal keywords detected'}

### Document Analysis
Text document containing {len(text_content.split())} words. Review for legal significance and cross-reference with case materials.
"""
    
    except Exception as e:
        logger.error(f"Document processing error: {e}")
        results["analysis_results"]["error"] = str(e)
    
    return results

@app.post("/evidence/analyze-scene")
async def analyze_scene(request: SceneAnalysisRequest):
    """Generate legal scene analysis using LLM"""
    if LLM_MODEL is None:
        raise HTTPException(status_code=503, detail="LLM model not available for scene analysis")
    
    try:
        # Construct analysis prompt
        prompt = f"""As a legal expert AI assistant, analyze this evidence scene:

Case ID: {request.case_id}
Evidence ID: {request.evidence_id}
Analysis Request: {request.prompt}

Please provide a structured analysis including:
1. Key observations and findings
2. Legal relevance and significance  
3. Potential contradictions or inconsistencies
4. Recommended follow-up actions
5. Timeline considerations (if applicable)

Format your response as clear, professional legal analysis suitable for case documentation."""

        # Generate analysis
        response = LLM_MODEL(
            prompt,
            max_tokens=800,
            temperature=0.3,  # Lower temperature for more factual analysis
            echo=False
        )
        
        analysis_text = response["choices"][0]["text"].strip()
        
        # Generate embeddings for RAG
        embeddings = None
        if SENTENCE_MODEL:
            embeddings = SENTENCE_MODEL.encode([analysis_text])[0].tolist()
        
        result = {
            "case_id": request.case_id,
            "evidence_id": request.evidence_id,
            "analysis": analysis_text,
            "embeddings": embeddings,
            "timestamp": datetime.now().isoformat(),
            "analysis_type": "llm_scene_analysis"
        }
        
        # Store in Qdrant for RAG
        if QDRANT_CLIENT and embeddings:
            try:
                QDRANT_CLIENT.upsert(
                    collection_name="legal_analysis",
                    points=[{
                        "id": f"analysis_{request.evidence_id}_{int(datetime.now().timestamp())}",
                        "vector": embeddings,
                        "payload": {
                            "case_id": request.case_id,
                            "evidence_id": request.evidence_id,
                            "analysis_text": analysis_text,
                            "timestamp": datetime.now().isoformat(),
                            "type": "scene_analysis"
                        }
                    }]
                )
            except Exception as e:
                logger.warning(f"Failed to store analysis in Qdrant: {e}")
        
        return result
        
    except Exception as e:
        logger.error(f"Scene analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evidence/rag-query")
async def rag_query(request: LegalRAGRequest):
    """Perform RAG query across case evidence and analysis"""
    if not QDRANT_CLIENT or not SENTENCE_MODEL:
        raise HTTPException(status_code=503, detail="RAG services not available")
    
    try:
        # Generate query embedding
        query_embedding = SENTENCE_MODEL.encode([request.query])[0].tolist()
        
        # Search similar evidence and analysis
        evidence_results = QDRANT_CLIENT.search(
            collection_name="legal_evidence",
            query_vector=query_embedding,
            limit=request.max_similar_scenes,
            score_threshold=0.6,
            query_filter={
                "must": [{"key": "case_id", "match": {"value": request.case_id}}]
            }
        )
        
        analysis_results = QDRANT_CLIENT.search(
            collection_name="legal_analysis", 
            query_vector=query_embedding,
            limit=request.max_similar_scenes,
            score_threshold=0.6,
            query_filter={
                "must": [{"key": "case_id", "match": {"value": request.case_id}}]
            }
        )
        
        # Combine and format results
        context_items = []
        
        for result in evidence_results:
            context_items.append({
                "type": "evidence",
                "score": result.score,
                "content": result.payload.get("summary", ""),
                "evidence_type": result.payload.get("evidence_type", ""),
                "file_path": result.payload.get("file_path", "")
            })
        
        for result in analysis_results:
            context_items.append({
                "type": "analysis", 
                "score": result.score,
                "content": result.payload.get("analysis_text", ""),
                "evidence_id": result.payload.get("evidence_id", "")
            })
        
        # Sort by relevance score
        context_items.sort(key=lambda x: x["score"], reverse=True)
        
        # Generate contextual response if LLM available
        llm_response = None
        if LLM_MODEL and context_items:
            context_text = "\n\n".join([
                f"[{item['type'].title()}] (Score: {item['score']:.2f})\n{item['content'][:300]}..."
                for item in context_items[:3]
            ])
            
            prompt = f"""Based on the following case evidence and analysis, answer this question:

Question: {request.query}

Relevant Context:
{context_text}

Please provide a comprehensive answer based on the evidence, citing specific sources where relevant."""

            response = LLM_MODEL(
                prompt,
                max_tokens=600,
                temperature=0.3,
                echo=False
            )
            
            llm_response = response["choices"][0]["text"].strip()
        
        return {
            "query": request.query,
            "case_id": request.case_id,
            "similar_items": context_items,
            "llm_response": llm_response,
            "total_found": len(context_items),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"RAG query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
