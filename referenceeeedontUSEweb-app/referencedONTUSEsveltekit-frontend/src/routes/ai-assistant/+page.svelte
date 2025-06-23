<script lang="ts">
  import LLMAssistant from '$lib/components/LLMAssistant.svelte';
</script>

<svelte:head>
  <title>AI Legal Assistant - WardenNet</title>
  <meta name="description" content="Secure offline legal AI assistant with privacy-first design" />
</svelte:head>

<div class="ai-assistant-page">
  <div class="page-header">
    <h1>AI Legal Assistant</h1>
    <p class="subtitle">
      Your secure, offline-friendly legal AI assistant powered by local GGUF models.
      All conversations stay private and are processed locally.
    </p>
  </div>
  
  <div class="assistant-container">
    <LLMAssistant />
  </div>
  
  <div class="features-info">
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>Privacy First</h3>
        <p>All processing happens locally. Your conversations never leave your device.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🧠</div>
        <h3>Legal Expertise</h3>
        <p>Trained on legal documents with specialized knowledge for legal professionals.</p>
      </div>
        <div class="feature-card">
        <div class="feature-icon">🎤</div>
        <h3>Voice Commands</h3>
        <p>Use voice input for hands-free legal research and document analysis.</p>
      </div>
      
      <!-- PII Protection commented out - focusing on core functionality -->
      <!-- <div class="feature-card">
        <div class="feature-icon">🛡️</div>
        <h3>PII Protection</h3>
        <p>Automatic masking of sensitive information with Legal-BERT integration.</p>
      </div> -->
      
      <div class="feature-card">
        <div class="feature-icon">💾</div>
        <h3>Offline Ready</h3>
        <p>Works without internet connection using locally stored GGUF models.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🔊</div>
        <h3>Text-to-Speech</h3>
        <p>Listen to responses with integrated TTS for accessibility and convenience.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .ai-assistant-page {
    max-width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f8f9fa;
  }
  
  .page-header {
    padding: 2rem;
    background: white;
    border-bottom: 1px solid #e1e5e9;
    text-align: center;
  }
  
  .page-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .subtitle {
    margin: 0;
    font-size: 1.1rem;
    color: #6b7280;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
  
  .assistant-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  
  .features-info {
    background: white;
    border-top: 1px solid #e1e5e9;
    padding: 2rem;
  }
  
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .feature-card {
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 12px;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .feature-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .feature-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
  }
  
  .feature-card p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .page-header {
      padding: 1rem;
    }
    
    .page-header h1 {
      font-size: 2rem;
    }
    
    .subtitle {
      font-size: 1rem;
    }
    
    .features-info {
      padding: 1rem;
    }
    
    .feature-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .feature-card {
      padding: 1rem;
    }
  }
  
  /* Hide features on small screens to focus on chat */
  @media (max-height: 600px) {
    .features-info {
      display: none;
    }
  }
</style>
