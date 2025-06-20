#!/usr/bin/env python3
"""
Multimodal Evidence Processing Example
=====================================

This script demonstrates how to integrate OpenCV, YOLO, and other AI tools
with your legal NLP platform for comprehensive evidence analysis.

Usage:
    python multimodal_example.py --input evidence.mp4 --case-id case_123
    python multimodal_example.py --input document.pdf --case-id case_123 --ocr
    python multimodal_example.py --input security_footage.jpg --enhance --detect-objects
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import cv2
    import numpy as np
    from PIL import Image, ImageEnhance
    import requests
except ImportError as e:
    logger.error(f"Missing dependencies: {e}")
    logger.info("Install with: pip install opencv-python pillow requests")
    sys.exit(1)

# Optional dependencies with graceful fallback
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("YOLO not available. Object detection will be limited.")

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    logger.warning("Whisper not available. Audio processing will be limited.")

try:
    import pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logger.warning("Tesseract not available. OCR will be limited.")

class MultimodalEvidenceProcessor:
    """Process various types of legal evidence with AI enhancement"""
    
    def __init__(self, api_url: str = "http://localhost:8001"):
        self.api_url = api_url
        self.yolo_model = None
        self.whisper_model = None
        
        # Initialize models if available
        if YOLO_AVAILABLE:
            try:
                self.yolo_model = YOLO('yolov8n.pt')  # Download if not present
                logger.info("YOLO model loaded successfully")
            except Exception as e:
                logger.warning(f"Failed to load YOLO: {e}")
        
        if WHISPER_AVAILABLE:
            try:
                self.whisper_model = whisper.load_model("base")
                logger.info("Whisper model loaded successfully")
            except Exception as e:
                logger.warning(f"Failed to load Whisper: {e}")
    
    def process_image(self, image_path: str, enhance: bool = True, 
                     detect_objects: bool = True, extract_text: bool = True) -> Dict[str, Any]:
        """Process image evidence with enhancement and analysis"""
        logger.info(f"Processing image: {image_path}")
        
        results = {
            "type": "image",
            "source_path": image_path,
            "enhanced": False,
            "objects": [],
            "text": "",
            "analysis": {}
        }
        
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        # Image enhancement
        if enhance:
            enhanced_image = self.enhance_image(image)
            results["enhanced"] = True
            
            # Save enhanced version
            enhanced_path = self._get_enhanced_path(image_path)
            cv2.imwrite(enhanced_path, enhanced_image)
            results["enhanced_path"] = enhanced_path
        else:
            enhanced_image = image
        
        # Object detection
        if detect_objects and self.yolo_model:
            objects = self.detect_objects(enhanced_image)
            results["objects"] = objects
            logger.info(f"Detected {len(objects)} objects")
        
        # OCR text extraction
        if extract_text and OCR_AVAILABLE:
            text = self.extract_text(enhanced_image)
            results["text"] = text
            logger.info(f"Extracted {len(text)} characters of text")
        
        # Generate analysis summary
        results["analysis"] = self.generate_analysis_summary(results)
        
        return results
    
    def process_video(self, video_path: str, sample_rate: int = 30) -> Dict[str, Any]:
        """Process video evidence with frame-by-frame analysis"""
        logger.info(f"Processing video: {video_path}")
        
        results = {
            "type": "video",
            "source_path": video_path,
            "frames": [],
            "timeline": [],
            "summary": "",
            "contradictions": []
        }
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps
        
        logger.info(f"Video: {duration:.2f}s, {frame_count} frames, {fps:.2f} fps")
        
        frame_number = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Sample frames (not every frame for performance)
            if frame_number % sample_rate == 0:
                timestamp = frame_number / fps
                
                frame_analysis = {
                    "frame_number": frame_number,
                    "timestamp": timestamp,
                    "objects": [],
                    "text": "",
                    "scene_description": ""
                }
                
                # Analyze this frame
                if self.yolo_model:
                    frame_analysis["objects"] = self.detect_objects(frame)
                
                if OCR_AVAILABLE:
                    frame_analysis["text"] = self.extract_text(frame)
                
                # Basic scene description
                frame_analysis["scene_description"] = self.describe_scene(frame)
                
                results["frames"].append(frame_analysis)
                logger.debug(f"Processed frame {frame_number} at {timestamp:.2f}s")
            
            frame_number += 1
        
        cap.release()
        
        # Generate timeline and analysis
        results["timeline"] = self.create_timeline(results["frames"])
        results["contradictions"] = self.detect_contradictions(results["frames"])
        results["summary"] = self.generate_video_summary(results)
        
        return results
    
    def process_audio(self, audio_path: str) -> Dict[str, Any]:
        """Process audio evidence with transcription and analysis"""
        logger.info(f"Processing audio: {audio_path}")
        
        results = {
            "type": "audio",
            "source_path": audio_path,
            "transcript": "",
            "segments": [],
            "analysis": {}
        }
        
        if not self.whisper_model:
            logger.warning("Whisper not available for audio processing")
            return results
        
        try:
            # Transcribe audio
            result = self.whisper_model.transcribe(audio_path)
            results["transcript"] = result["text"]
            results["segments"] = result["segments"]
            
            # Basic analysis
            results["analysis"] = {
                "word_count": len(result["text"].split()),
                "duration": result.get("duration", 0),
                "language": result.get("language", "unknown"),
                "confidence": self._calculate_avg_confidence(result["segments"])
            }
            
            logger.info(f"Transcribed {len(result['text'])} characters")
            
        except Exception as e:
            logger.error(f"Audio processing failed: {e}")
            results["error"] = str(e)
        
        return results
    
    def enhance_image(self, image: np.ndarray) -> np.ndarray:
        """Enhance image quality using OpenCV techniques"""
        # Basic enhancement pipeline
        enhanced = image.copy()
        
        # 1. Noise reduction
        enhanced = cv2.bilateralFilter(enhanced, 9, 75, 75)
        
        # 2. Contrast enhancement
        lab = cv2.cvtColor(enhanced, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        # 3. Sharpening
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        enhanced = cv2.filter2D(enhanced, -1, kernel)
        
        return enhanced
    
    def detect_objects(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Detect objects in image using YOLO"""
        if not self.yolo_model:
            return []
        
        try:
            results = self.yolo_model(image)
            objects = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        objects.append({
                            "class_id": int(box.cls.item()),
                            "class_name": self.yolo_model.names[int(box.cls.item())],
                            "confidence": float(box.conf.item()),
                            "bbox": {
                                "x": float(box.xyxy[0][0].item()),
                                "y": float(box.xyxy[0][1].item()),
                                "width": float(box.xyxy[0][2].item() - box.xyxy[0][0].item()),
                                "height": float(box.xyxy[0][3].item() - box.xyxy[0][1].item())
                            }
                        })
            
            return objects
            
        except Exception as e:
            logger.error(f"Object detection failed: {e}")
            return []
    
    def extract_text(self, image: np.ndarray) -> str:
        """Extract text from image using OCR"""
        if not OCR_AVAILABLE:
            return ""
        
        try:
            # Convert BGR to RGB for PIL
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_image)
            
            # Extract text
            text = pytesseract.image_to_string(pil_image)
            return text.strip()
            
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            return ""
    
    def describe_scene(self, image: np.ndarray) -> str:
        """Generate basic scene description"""
        # Simple rule-based scene description
        height, width = image.shape[:2]
        
        # Analyze basic properties
        brightness = np.mean(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY))
        
        # Detect edges for complexity
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (height * width)
        
        # Basic color analysis
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        dominant_hue = np.median(hsv[:, :, 0])
        
        description = f"Scene: {width}x{height} resolution"
        
        if brightness < 80:
            description += ", low lighting"
        elif brightness > 180:
            description += ", bright lighting"
        else:
            description += ", normal lighting"
        
        if edge_density > 0.1:
            description += ", complex scene"
        else:
            description += ", simple scene"
        
        return description
    
    def create_timeline(self, frames: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create chronological timeline of events"""
        timeline = []
        
        for frame in frames:
            if frame["objects"] or frame["text"]:
                event = {
                    "timestamp": frame["timestamp"],
                    "frame_number": frame["frame_number"],
                    "description": self._generate_frame_description(frame),
                    "objects_count": len(frame["objects"]),
                    "has_text": bool(frame["text"])
                }
                timeline.append(event)
        
        return timeline
    
    def detect_contradictions(self, frames: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect potential contradictions in video evidence"""
        contradictions = []
        
        # Simple contradiction detection (can be enhanced with ML)
        person_positions = []
        
        for frame in frames:
            persons = [obj for obj in frame["objects"] if obj["class_name"] == "person"]
            if persons:
                person_positions.append({
                    "timestamp": frame["timestamp"],
                    "count": len(persons),
                    "positions": [obj["bbox"] for obj in persons]
                })
        
        # Check for sudden appearance/disappearance
        for i in range(1, len(person_positions)):
            prev = person_positions[i-1]
            curr = person_positions[i]
            
            if abs(prev["count"] - curr["count"]) > 1:
                contradictions.append({
                    "type": "person_count_change",
                    "description": f"Person count changed from {prev['count']} to {curr['count']}",
                    "timestamp": curr["timestamp"],
                    "confidence": 0.7
                })
        
        return contradictions
    
    def generate_analysis_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive analysis summary"""
        summary = {
            "evidence_type": results["type"],
            "enhanced": results.get("enhanced", False),
            "objects_detected": len(results.get("objects", [])),
            "text_extracted": bool(results.get("text", "")),
            "quality_score": 0.0,
            "key_findings": []
        }
        
        # Calculate quality score
        score = 0.5  # Base score
        if results.get("enhanced"):
            score += 0.2
        if results.get("objects"):
            score += 0.2
        if results.get("text"):
            score += 0.1
        
        summary["quality_score"] = min(score, 1.0)
        
        # Key findings
        if results.get("objects"):
            object_names = [obj["class_name"] for obj in results["objects"]]
            summary["key_findings"].append(f"Objects detected: {', '.join(set(object_names))}")
        
        if results.get("text"):
            summary["key_findings"].append(f"Text content: {len(results['text'])} characters")
        
        return summary
    
    def generate_video_summary(self, results: Dict[str, Any]) -> str:
        """Generate video analysis summary"""
        frame_count = len(results["frames"])
        total_objects = sum(len(frame["objects"]) for frame in results["frames"])
        
        summary = f"Video analysis: {frame_count} frames analyzed. "
        summary += f"Total objects detected: {total_objects}. "
        
        if results["contradictions"]:
            summary += f"Found {len(results['contradictions'])} potential contradictions. "
        
        if results["timeline"]:
            summary += f"Generated timeline with {len(results['timeline'])} key events."
        
        return summary
    
    def _generate_frame_description(self, frame: Dict[str, Any]) -> str:
        """Generate description for a video frame"""
        objects = frame["objects"]
        text = frame["text"]
        
        description = f"Frame at {frame['timestamp']:.2f}s: "
        
        if objects:
            object_names = [obj["class_name"] for obj in objects]
            description += f"Objects: {', '.join(object_names)}. "
        
        if text:
            description += f"Text: {text[:50]}{'...' if len(text) > 50 else ''}. "
        
        description += frame["scene_description"]
        
        return description
    
    def _calculate_avg_confidence(self, segments: List[Dict[str, Any]]) -> float:
        """Calculate average confidence from Whisper segments"""
        if not segments:
            return 0.0
        
        # Note: Whisper doesn't always provide confidence scores
        # This is a placeholder for when confidence is available
        return 0.8  # Default confidence
    
    def _get_enhanced_path(self, original_path: str) -> str:
        """Generate path for enhanced image"""
        path = Path(original_path)
        return str(path.parent / f"{path.stem}_enhanced{path.suffix}")

def main():
    parser = argparse.ArgumentParser(description="Process multimodal legal evidence")
    parser.add_argument("--input", required=True, help="Path to evidence file")
    parser.add_argument("--case-id", required=True, help="Case ID for association")
    parser.add_argument("--enhance", action="store_true", help="Enhance images")
    parser.add_argument("--detect-objects", action="store_true", help="Detect objects")
    parser.add_argument("--ocr", action="store_true", help="Extract text with OCR")
    parser.add_argument("--output", help="Output JSON file path")
    parser.add_argument("--api-url", default="http://localhost:8001", help="API URL")
    
    args = parser.parse_args()
    
    # Initialize processor
    processor = MultimodalEvidenceProcessor(args.api_url)
    
    # Determine file type
    file_path = args.input
    file_ext = Path(file_path).suffix.lower()
    
    try:
        if file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
            results = processor.process_image(
                file_path, 
                enhance=args.enhance,
                detect_objects=args.detect_objects,
                extract_text=args.ocr
            )
        elif file_ext in ['.mp4', '.avi', '.mov', '.mkv']:
            results = processor.process_video(file_path)
        elif file_ext in ['.wav', '.mp3', '.m4a', '.flac']:
            results = processor.process_audio(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
        
        # Add case association
        results["case_id"] = args.case_id
        results["processed_at"] = json.dumps({"timestamp": "now"})
        
        # Output results
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2)
            logger.info(f"Results saved to {args.output}")
        else:
            print(json.dumps(results, indent=2))
        
        # Send to API if available
        try:
            response = requests.post(
                f"{args.api_url}/store-evidence-analysis",
                json=results,
                timeout=30
            )
            if response.ok:
                logger.info("Results sent to API successfully")
            else:
                logger.warning(f"API request failed: {response.status_code}")
        except requests.RequestException as e:
            logger.warning(f"Could not send to API: {e}")
    
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
