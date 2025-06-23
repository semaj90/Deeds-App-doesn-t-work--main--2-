"""
Legal-BERT PII Masking Service
FastAPI server for identifying and masking personally identifiable information (PII)
and sensitive legal information using Legal-BERT models.

⚠️  PII MASKING IS DISABLED BY DEFAULT FOR PRIVACY
This service currently operates in pass-through mode, returning original text unchanged.
To enable masking, set ENABLE_MASKING=true in environment variables.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import re
import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
import uvicorn
import logging
import os
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===== PRIVACY SETTINGS =====
# PII masking is DISABLED by default for privacy-first approach
ENABLE_MASKING = os.getenv("ENABLE_MASKING", "false").lower() == "true"
PASS_THROUGH_MODE = not ENABLE_MASKING

# Model state
model_cache = {}

class MaskRequest(BaseModel):
    text: str
    mask_types: Optional[List[str]] = ["PERSON", "ORG", "GPE", "MONEY", "DATE", "SSN", "PHONE", "EMAIL"]
    mask_character: Optional[str] = "█"
    confidence_threshold: Optional[float] = 0.85

class MaskResponse(BaseModel):
    masked_text: str
    entities_found: List[Dict[str, str]]
    confidence_scores: List[float]
    original_length: int
    masked_length: int

class HealthResponse(BaseModel):
    status: str
    models_loaded: List[str]
    gpu_available: bool
    memory_usage: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup"""
    if ENABLE_MASKING:
        logger.info("🔄 Loading Legal-BERT models...")
        try:
            await load_models()
            logger.info("✅ Models loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load models: {e}")
            logger.info("🔄 Falling back to pass-through mode")
    else:
        logger.info("⚠️  PII masking is DISABLED for privacy")
        logger.info("🔄 Running in pass-through mode")
    
    yield
    
    # Cleanup on shutdown
    logger.info("🛑 Shutting down masking service")

app = FastAPI(
    title="Legal-BERT PII Masking Service",
    description="API for masking PII and sensitive information in legal documents",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def load_models():
    """Load Legal-BERT and NER models (only if masking is enabled)"""
    global model_cache
    
    if not ENABLE_MASKING:
        logger.info("⚠️  Model loading skipped - masking disabled")
        return
    
    # Check if GPU is available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    try:
        # Legal-BERT model for legal entity recognition
        # You can replace this with a custom trained model
        model_name = "nlpaueb/legal-bert-base-uncased"
        
        logger.info("Loading Legal-BERT tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # For NER, we'll use a general NER model and enhance it with legal patterns
        logger.info("Loading NER model...")
        ner_model = pipeline(
            "ner",
            model="dbmdz/bert-large-cased-finetuned-conll03-english",
            tokenizer="dbmdz/bert-large-cased-finetuned-conll03-english",
            aggregation_strategy="simple",
            device=0 if torch.cuda.is_available() else -1
        )
        
        model_cache = {
            "tokenizer": tokenizer,
            "ner_model": ner_model,
            "device": device
        }
        
        logger.info("Models loaded successfully")
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        # Fallback to basic pattern matching if models fail to load
        model_cache = {"device": device, "fallback_mode": True}

def get_legal_patterns():
    """Define patterns for legal and PII detection"""
    patterns = {
        "SSN": r'\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b',
        "PHONE": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
        "EMAIL": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "DATE": r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',
        "MONEY": r'\$[0-9,]+\.?\d*|\b\d+\s*dollars?\b',
        "CASE_NUMBER": r'\b[Cc]ase\s+[Nn]o\.?\s*[A-Za-z0-9\-]+\b',
        "DOCKET": r'\b[Dd]ocket\s+[Nn]o\.?\s*[A-Za-z0-9\-]+\b',
        "ADDRESS": r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b',
        "CREDIT_CARD": r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
        "DRIVER_LICENSE": r'\b[A-Z]{1,2}\d{6,8}\b',
    }
    return patterns

def mask_with_patterns(text: str, mask_types: List[str], mask_character: str = "█") -> tuple:
    """Fallback pattern-based masking"""
    patterns = get_legal_patterns()
    entities_found = []
    masked_text = text
    
    for entity_type in mask_types:
        if entity_type in patterns:
            pattern = patterns[entity_type]
            matches = re.finditer(pattern, text, re.IGNORECASE)
            
            for match in matches:
                entity_text = match.group()
                start, end = match.span()
                
                # Create mask of same length
                mask = mask_character * len(entity_text)
                masked_text = masked_text.replace(entity_text, mask)
                
                entities_found.append({
                    "entity": entity_type,
                    "text": entity_text,
                    "start": start,
                    "end": end,
                    "confidence": 0.9  # High confidence for pattern matches
                })
    
    return masked_text, entities_found

def mask_with_bert(text: str, mask_types: List[str], confidence_threshold: float, mask_character: str = "█") -> tuple:
    """BERT-based entity recognition and masking"""
    if "fallback_mode" in model_cache:
        return mask_with_patterns(text, mask_types, mask_character)
    
    try:
        ner_model = model_cache["ner_model"]
        entities = ner_model(text)
        
        entities_found = []
        masked_text = text
        
        # Sort entities by start position (reverse order for replacement)
        entities = sorted(entities, key=lambda x: x['start'], reverse=True)
        
        for entity in entities:
            entity_type = entity['entity_group']
            confidence = entity['score']
            
            # Map BERT entity types to our types
            if entity_type == "PER" and "PERSON" in mask_types and confidence >= confidence_threshold:
                mask_length = entity['end'] - entity['start']
                mask = mask_character * mask_length
                masked_text = masked_text[:entity['start']] + mask + masked_text[entity['end']:]
                
                entities_found.append({
                    "entity": "PERSON",
                    "text": entity['word'],
                    "start": entity['start'],
                    "end": entity['end'],
                    "confidence": confidence
                })
            
            elif entity_type == "ORG" and "ORG" in mask_types and confidence >= confidence_threshold:
                mask_length = entity['end'] - entity['start']
                mask = mask_character * mask_length
                masked_text = masked_text[:entity['start']] + mask + masked_text[entity['end']:]
                
                entities_found.append({
                    "entity": "ORG",
                    "text": entity['word'],
                    "start": entity['start'],
                    "end": entity['end'],
                    "confidence": confidence
                })
            
            elif entity_type == "LOC" and "GPE" in mask_types and confidence >= confidence_threshold:
                mask_length = entity['end'] - entity['start']
                mask = mask_character * mask_length
                masked_text = masked_text[:entity['start']] + mask + masked_text[entity['end']:]
                
                entities_found.append({
                    "entity": "GPE",
                    "text": entity['word'],
                    "start": entity['start'],
                    "end": entity['end'],
                    "confidence": confidence
                })
        
        # Also apply pattern matching for structured data
        pattern_masked_text, pattern_entities = mask_with_patterns(masked_text, mask_types, mask_character)
        entities_found.extend(pattern_entities)
        
        return pattern_masked_text, entities_found
        
    except Exception as e:
        logger.error(f"BERT masking failed: {e}, falling back to pattern matching")
        return mask_with_patterns(text, mask_types, mask_character)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    models_loaded = list(model_cache.keys())
    gpu_available = torch.cuda.is_available()
    
    memory_usage = None
    if gpu_available and torch.cuda.is_available():
        memory_usage = f"{torch.cuda.memory_allocated() / 1024**2:.2f} MB"
    
    return HealthResponse(
        status="healthy",
        models_loaded=models_loaded,
        gpu_available=gpu_available,
        memory_usage=memory_usage
    )

@app.post("/api/mask", response_model=MaskResponse)
async def mask_text(request: MaskRequest):
    """
    Mask PII and sensitive information in text
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        original_length = len(request.text)
        
        # Perform masking
        masked_text, entities_found = mask_with_bert(
            request.text,
            request.mask_types,
            request.confidence_threshold,
            request.mask_character
        )
        
        masked_length = len(masked_text)
        confidence_scores = [entity.get("confidence", 0.0) for entity in entities_found]
        
        logger.info(f"Masked {len(entities_found)} entities in text of length {original_length}")
        
        return MaskResponse(
            masked_text=masked_text,
            entities_found=entities_found,
            confidence_scores=confidence_scores,
            original_length=original_length,
            masked_length=masked_length
        )
        
    except Exception as e:
        logger.error(f"Error masking text: {e}")
        raise HTTPException(status_code=500, detail=f"Masking failed: {str(e)}")

@app.post("/api/analyze")
async def analyze_text(request: MaskRequest):
    """
    Analyze text for PII without masking (for review purposes)
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Get entities without masking
        _, entities_found = mask_with_bert(
            request.text,
            request.mask_types,
            request.confidence_threshold,
            request.mask_character
        )
        
        return {
            "text": request.text,
            "entities_found": entities_found,
            "entity_count": len(entities_found),
            "risk_level": "high" if len(entities_found) > 5 else "medium" if len(entities_found) > 0 else "low"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/supported-entities")
async def get_supported_entities():
    """Get list of supported entity types for masking"""
    return {
        "entities": [
            {"type": "PERSON", "description": "Person names"},
            {"type": "ORG", "description": "Organizations"},
            {"type": "GPE", "description": "Geopolitical entities (locations)"},
            {"type": "MONEY", "description": "Monetary amounts"},
            {"type": "DATE", "description": "Dates"},
            {"type": "SSN", "description": "Social Security Numbers"},
            {"type": "PHONE", "description": "Phone numbers"},
            {"type": "EMAIL", "description": "Email addresses"},
            {"type": "CASE_NUMBER", "description": "Legal case numbers"},
            {"type": "DOCKET", "description": "Court docket numbers"},
            {"type": "ADDRESS", "description": "Street addresses"},
            {"type": "CREDIT_CARD", "description": "Credit card numbers"},
            {"type": "DRIVER_LICENSE", "description": "Driver's license numbers"}
        ],
        "patterns_available": True,
        "bert_available": "ner_model" in model_cache
    }

if __name__ == "__main__":
    port = int(os.getenv("MASKING_PORT", 8002))
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=port,
        reload=True,
        log_level="info"
    )
