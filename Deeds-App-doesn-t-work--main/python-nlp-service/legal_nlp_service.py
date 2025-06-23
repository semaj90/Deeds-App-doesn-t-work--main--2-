"""
Legal NLP Service with Legal-BERT for entity recognition and masking
This service provides NLP analysis for legal documents and case text.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import re
import os
from typing import List, Dict, Any, Optional

# Try to import transformers, fallback to basic NLP if unavailable
try:
    from transformers import (
        pipeline, 
        AutoTokenizer, 
        AutoModelForTokenClassification,
        AutoModelForSequenceClassification
    )
    HAS_TRANSFORMERS = True
    print("✅ Transformers library loaded successfully")
except ImportError:
    HAS_TRANSFORMERS = False
    print("❌ Transformers not available, using fallback NLP")

# Try to import spaCy for advanced NLP
try:
    import spacy
    HAS_SPACY = True
    print("✅ spaCy library loaded successfully")
except ImportError:
    HAS_SPACY = False
    print("❌ spaCy not available, using basic analysis")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LegalNLPService:
    def __init__(self):
        self.ner_pipeline = None
        self.sentiment_pipeline = None
        self.spacy_nlp = None
        self.initialize_models()
    
    def initialize_models(self):
        """Initialize NLP models with fallbacks"""
        logger.info("Initializing NLP models...")
        
        if HAS_TRANSFORMERS:
            try:
                # Try to load Legal-BERT for NER
                logger.info("Loading Legal-BERT model...")
                tokenizer = AutoTokenizer.from_pretrained("nlpaueb/legal-bert-base-uncased")
                
                # For NER, we'll use a general NER model since Legal-BERT base doesn't have NER head
                self.ner_pipeline = pipeline(
                    "ner", 
                    model="dbmdz/bert-large-cased-finetuned-conll03-english",
                    aggregation_strategy="simple"
                )
                
                # For sentiment analysis
                self.sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    model="nlptown/bert-base-multilingual-uncased-sentiment"
                )
                
                logger.info("✅ Transformers models loaded successfully")
                
            except Exception as e:
                logger.error(f"Failed to load transformers models: {e}")
                self.ner_pipeline = None
                self.sentiment_pipeline = None
        
        if HAS_SPACY:
            try:
                # Load spaCy model for additional NLP features
                self.spacy_nlp = spacy.load("en_core_web_sm")
                logger.info("✅ spaCy model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load spaCy model: {e}")
                try:
                    # Try alternative model names
                    self.spacy_nlp = spacy.load("en")
                    logger.info("✅ spaCy alternative model loaded")
                except:
                    self.spacy_nlp = None
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Comprehensive text analysis"""
        result = {
            "original_text": text,
            "entities_found": [],
            "sentiment": {"polarity": 0.0, "subjectivity": 0.0, "label": "neutral"},
            "keywords": [],
            "masked_text": text,
            "analysis_method": "fallback"
        }
        
        # Named Entity Recognition
        if self.ner_pipeline:
            try:
                entities = self.ner_pipeline(text)
                result["entities_found"] = self.process_entities(entities)
                result["masked_text"] = self.mask_entities(text, result["entities_found"])
                result["analysis_method"] = "transformers"
            except Exception as e:
                logger.error(f"NER pipeline error: {e}")
        
        # Fallback to spaCy NER
        elif self.spacy_nlp:
            try:
                doc = self.spacy_nlp(text)
                entities = []
                for ent in doc.ents:
                    entities.append({
                        "entity_group": ent.label_,
                        "score": 0.9,  # spaCy doesn't provide confidence
                        "word": ent.text,
                        "start": ent.start_char,
                        "end": ent.end_char
                    })
                result["entities_found"] = entities
                result["masked_text"] = self.mask_entities(text, entities)
                result["analysis_method"] = "spacy"
            except Exception as e:
                logger.error(f"spaCy NER error: {e}")
        
        # Fallback to regex-based entity detection
        else:
            entities = self.extract_entities_regex(text)
            result["entities_found"] = entities
            result["masked_text"] = self.mask_entities(text, entities)
        
        # Sentiment Analysis
        if self.sentiment_pipeline:
            try:
                sentiment_result = self.sentiment_pipeline(text)[0]
                result["sentiment"] = self.process_sentiment(sentiment_result)
            except Exception as e:
                logger.error(f"Sentiment analysis error: {e}")
        else:
            result["sentiment"] = self.analyze_sentiment_basic(text)
        
        # Keyword extraction
        result["keywords"] = self.extract_keywords(text)
        
        return result
    
    def process_entities(self, entities: List[Dict]) -> List[Dict]:
        """Process and filter entities from transformers pipeline"""
        processed = []
        for entity in entities:
            # Filter entities with high confidence and relevant types
            if entity.get("score", 0) > 0.7:
                processed.append({
                    "text": entity["word"],
                    "label": entity["entity_group"],
                    "start": entity["start"],
                    "end": entity["end"],
                    "confidence": entity["score"]
                })
        return processed
    
    def extract_entities_regex(self, text: str) -> List[Dict]:
        """Fallback regex-based entity extraction for legal text"""
        entities = []
        
        # Common legal entity patterns
        patterns = {
            "PERSON": [
                r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # Full names
                r'\b(?:Mr|Ms|Mrs|Dr|Judge|Attorney)\.?\s+[A-Z][a-z]+\b'  # Titles + names
            ],
            "ORG": [
                r'\b[A-Z][a-z]+ (?:Corp|Corporation|Inc|LLC|Ltd|Company)\b',
                r'\b(?:Police Department|Sheriff\'s Office|Court|District Attorney)\b'
            ],
            "LOCATION": [
                r'\b\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr)\b',
                r'\b[A-Z][a-z]+,\s+[A-Z]{2}\b'  # City, State
            ],
            "DATE": [
                r'\b\d{1,2}/\d{1,2}/\d{2,4}\b',
                r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b'
            ]
        }
        
        for label, pattern_list in patterns.items():
            for pattern in pattern_list:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    entities.append({
                        "text": match.group(),
                        "label": label,
                        "start": match.start(),
                        "end": match.end(),
                        "confidence": 0.8
                    })
        
        return entities
    
    def mask_entities(self, text: str, entities: List[Dict]) -> str:
        """Mask sensitive entities in text"""
        if not entities:
            return text
        
        # Sort entities by start position (descending to avoid index issues)
        sorted_entities = sorted(entities, key=lambda x: x["start"], reverse=True)
        
        masked_text = text
        for entity in sorted_entities:
            start = entity["start"]
            end = entity["end"]
            label = entity["label"]
            
            # Choose masking strategy based on entity type
            if label in ["PERSON", "PER"]:
                replacement = "[PERSON_REDACTED]"
            elif label in ["ORG", "ORGANIZATION"]:
                replacement = "[ORGANIZATION_REDACTED]"
            elif label in ["LOC", "LOCATION"]:
                replacement = "[LOCATION_REDACTED]"
            elif label in ["DATE"]:
                replacement = "[DATE_REDACTED]"
            else:
                replacement = f"[{label}_REDACTED]"
            
            masked_text = masked_text[:start] + replacement + masked_text[end:]
        
        return masked_text
    
    def process_sentiment(self, sentiment_result: Dict) -> Dict:
        """Process sentiment analysis result"""
        label = sentiment_result["label"].lower()
        score = sentiment_result["score"]
        
        # Convert to polarity scale (-1 to 1)
        if "positive" in label:
            polarity = score
        elif "negative" in label:
            polarity = -score
        else:
            polarity = 0.0
        
        return {
            "polarity": polarity,
            "subjectivity": 0.5,  # Default subjectivity
            "label": label
        }
    
    def analyze_sentiment_basic(self, text: str) -> Dict:
        """Basic sentiment analysis using word lists"""
        positive_words = ["good", "excellent", "positive", "successful", "clear", "strong"]
        negative_words = ["bad", "terrible", "negative", "failed", "unclear", "weak", "illegal", "guilty"]
        
        text_lower = text.lower()
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count > neg_count:
            label = "positive"
            polarity = 0.5
        elif neg_count > pos_count:
            label = "negative"
            polarity = -0.5
        else:
            label = "neutral"
            polarity = 0.0
        
        return {
            "polarity": polarity,
            "subjectivity": 0.5,
            "label": label
        }
    
    def extract_keywords(self, text: str) -> List[Dict]:
        """Extract keywords from text"""
        # Simple frequency-based keyword extraction
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        
        # Filter out common legal stopwords
        stopwords = {
            "case", "court", "judge", "attorney", "legal", "defendant", "plaintiff",
            "evidence", "witness", "testimony", "trial", "hearing", "motion"
        }
        
        word_freq = {}
        for word in words:
            if word not in stopwords:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency and return top keywords
        sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        return [
            {"text": word, "score": freq, "frequency": freq}
            for word, freq in sorted_keywords[:10]
        ]

# Initialize the service
nlp_service = LegalNLPService()

@app.route('/api/mask', methods=['POST'])
def mask_text():
    """Main endpoint for text analysis and masking"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400
        
        text = data['text']
        if not text.strip():
            return jsonify({"error": "Empty text provided"}), 400
        
        if len(text) > 10000:
            return jsonify({"error": "Text too long (max 10000 characters)"}), 400
        
        logger.info(f"Processing text analysis request: {len(text)} characters")
        
        # Perform analysis
        result = nlp_service.analyze_text(text)
        
        logger.info(f"Analysis complete: {len(result['entities_found'])} entities found")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in mask_text: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "models": {
            "transformers": HAS_TRANSFORMERS and nlp_service.ner_pipeline is not None,
            "spacy": HAS_SPACY and nlp_service.spacy_nlp is not None,
        },
        "version": "1.0.0"
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_legal_text():
    """Advanced legal text analysis endpoint"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400
        
        text = data['text']
        include_masking = data.get('mask', True)
        
        result = nlp_service.analyze_text(text)
        
        if not include_masking:
            result['masked_text'] = result['original_text']
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in analyze_legal_text: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Legal NLP Service")
    print(f"📚 Models available: Transformers={HAS_TRANSFORMERS}, spaCy={HAS_SPACY}")
    print("🌐 Server will run on http://localhost:5000")
    print("\n📋 Available endpoints:")
    print("  POST /api/mask - Mask sensitive entities in text")
    print("  POST /api/analyze - Comprehensive legal text analysis")
    print("  GET /api/health - Service health check")
    print("\n🔧 To install required dependencies:")
    print("  pip install flask flask-cors transformers torch spacy")
    print("  python -m spacy download en_core_web_sm")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
