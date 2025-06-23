#!/usr/bin/env python3
"""
Setup script for Legal-BERT PII Masking Service
This script helps set up the Python environment and dependencies.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("✗ Python 3.8 or higher is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✓ Python version {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def setup_virtual_environment():
    """Create and activate virtual environment"""
    venv_path = Path("venv")
    
    if venv_path.exists():
        print("✓ Virtual environment already exists")
        return True
    
    print("Creating virtual environment...")
    if not run_command(f"{sys.executable} -m venv venv", "Creating virtual environment"):
        return False
    
    # Instructions for activation
    if os.name == 'nt':  # Windows
        activate_cmd = "venv\\Scripts\\activate"
    else:  # Unix/Linux/macOS
        activate_cmd = "source venv/bin/activate"
    
    print(f"\n📝 To activate the virtual environment, run:")
    print(f"   {activate_cmd}")
    
    return True

def install_dependencies():
    """Install Python dependencies"""
    # Determine pip command
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/Linux/macOS
        pip_cmd = "venv/bin/pip"
    
    # Upgrade pip first
    if not run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip"):
        return False
    
    # Install dependencies
    if not run_command(f"{pip_cmd} install -r requirements.txt", "Installing dependencies"):
        return False
    
    return True

def download_models():
    """Download required models"""
    print("\n📥 Downloading Legal-BERT models...")
    print("This may take several minutes depending on your internet connection...")
    
    # Import after dependencies are installed
    try:
        from transformers import AutoTokenizer, pipeline
        
        # Download Legal-BERT tokenizer
        print("Downloading Legal-BERT tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained("nlpaueb/legal-bert-base-uncased")
        print("✓ Legal-BERT tokenizer downloaded")
        
        # Download NER model
        print("Downloading NER model...")
        ner_model = pipeline(
            "ner",
            model="dbmdz/bert-large-cased-finetuned-conll03-english",
            tokenizer="dbmdz/bert-large-cased-finetuned-conll03-english"
        )
        print("✓ NER model downloaded")
        
        return True
    except Exception as e:
        print(f"✗ Model download failed: {e}")
        print("Models will be downloaded on first run")
        return False

def create_start_script():
    """Create convenience start script"""
    if os.name == 'nt':  # Windows
        script_content = """@echo off
echo Starting Legal-BERT PII Masking Service...
call venv\\Scripts\\activate
python main.py
pause
"""
        script_path = "start_masking_service.bat"
    else:  # Unix/Linux/macOS
        script_content = """#!/bin/bash
echo "Starting Legal-BERT PII Masking Service..."
source venv/bin/activate
python main.py
"""
        script_path = "start_masking_service.sh"
    
    with open(script_path, 'w') as f:
        f.write(script_content)
    
    if os.name != 'nt':
        os.chmod(script_path, 0o755)
    
    print(f"✓ Created start script: {script_path}")

def main():
    """Main setup function"""
    print("=" * 60)
    print("Legal-BERT PII Masking Service Setup")
    print("=" * 60)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Setup virtual environment
    if not setup_virtual_environment():
        print("✗ Failed to setup virtual environment")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("✗ Failed to install dependencies")
        sys.exit(1)
    
    # Download models (optional - will download on first run if this fails)
    download_models()
    
    # Create start script
    create_start_script()
    
    print("\n" + "=" * 60)
    print("✓ Setup completed successfully!")
    print("=" * 60)
    print("\nTo start the masking service:")
    if os.name == 'nt':
        print("  1. Run: start_masking_service.bat")
        print("  2. Or manually: venv\\Scripts\\activate && python main.py")
    else:
        print("  1. Run: ./start_masking_service.sh")
        print("  2. Or manually: source venv/bin/activate && python main.py")
    
    print("\nThe service will be available at: http://127.0.0.1:8002")
    print("API documentation: http://127.0.0.1:8002/docs")

if __name__ == "__main__":
    main()
