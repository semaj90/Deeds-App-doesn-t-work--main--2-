<!-- Copilot Instructions:
- This is the AI Legal Assistant page for the Tauri desktop app
- Should match web app functionality but use Tauri commands instead of HTTP API
- Include quick prompts, textarea input, loading states, and AI responses
- Use shared UI components from $ui where possible
-->

<script lang="ts">
  import { invoke } from '@tauri-apps/api/tauri';
  import Card from '$ui/components/Card.svelte';
  import Button from '$ui/components/Button.svelte';
  
  let prompt = '';
  let response = '';
  let loading = false;
  let error: string | null = null;
  
  const quickPrompts = [
    "Analyze this case for legal precedents",
    "Generate a prosecution strategy", 
    "Summarize evidence findings",
    "Draft a legal brief outline",
    "Research similar cases",
    "Identify key witnesses to interview"
  ];
  
  // TODO: Wire up to Tauri LLM commands from llm.rs
  async function submitPrompt() {
    if (!prompt.trim()) return;
    
    loading = true;
    error = null;
    response = '';
    
    try {
      // Use Tauri command instead of HTTP API
      const result = await invoke('process_llm_prompt', { 
        prompt: prompt.trim() 
      });
      response = result || 'No response received';
    } catch (err) {
      error = err instanceof Error ? err.message : 'AI processing failed';
      console.error('AI Prompt Error:', err);
    } finally {
      loading = false;
    }
  }
  
  function useQuickPrompt(quickPrompt: string) {
    prompt = quickPrompt;
  }
  
  function clearAll() {
    prompt = '';
    response = '';
    error = null;
  }
</script>

<svelte:head>
  <title>AI Legal Assistant - Desktop App</title>
</svelte:head>

<div class="container py-4">
  <div class="row justify-content-center">
    <div class="col-lg-10">
      <div class="text-center mb-4">
        <h1 class="display-6 fw-bold mb-2">
          <i class="bi bi-robot me-2 text-primary"></i>
          AI Legal Assistant
        </h1>
        <p class="lead text-muted">Get AI-powered insights for your legal work</p>
      </div>
      
      <!-- Quick Prompts -->
      <div class="mb-4">
        <h5 class="fw-semibold mb-3">
          <i class="bi bi-lightning-charge me-2"></i>
          Quick Prompts
        </h5>
        <div class="d-flex flex-wrap gap-2">
          {#each quickPrompts as quickPrompt}
            <Button 
              variant="outline" 
              size="sm"
              on:click={() => useQuickPrompt(quickPrompt)}
            >
              {quickPrompt}
            </Button>
          {/each}
        </div>
      </div>
      
      <!-- Prompt Input -->
      <Card class="shadow-sm mb-4">
        <h5 class="card-title">
          <i class="bi bi-chat-square-text me-2"></i>
          Your Prompt
        </h5>
        <div class="mb-3">
          <textarea 
            class="form-control" 
            rows="6"
            placeholder="Enter your legal question or request for AI analysis..."
            bind:value={prompt}
          ></textarea>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <Button variant="outline" on:click={clearAll}>
            <i class="bi bi-x-circle me-1"></i>
            Clear
          </Button>
          <Button 
            variant="primary"
            on:click={submitPrompt}
            disabled={loading || !prompt.trim()}
          >
            {#if loading}
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            {:else}
              <i class="bi bi-lightning me-1"></i>
              Submit Prompt
            {/if}
          </Button>
        </div>
      </Card>
      
      <!-- Error Alert -->
      {#if error}
        <div class="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
      {/if}
      
      <!-- Response -->
      {#if response}
        <Card class="shadow-sm">
          <h5 class="card-title">
            <i class="bi bi-cpu me-2 text-success"></i>
            AI Response
          </h5>
          <div class="border rounded p-3 bg-light">
            <div class="text-break" style="white-space: pre-wrap;">{response}</div>
          </div>
          <div class="d-flex justify-content-end mt-3">
            <Button 
              variant="outline" 
              size="sm"
              on:click={() => navigator.clipboard.writeText(response)}
            >
              <i class="bi bi-clipboard me-1"></i>
              Copy Response
            </Button>
          </div>
        </Card>
      {/if}
      
      <!-- Loading State -->
      {#if loading}
        <Card class="shadow-sm">
          <div class="d-flex align-items-center justify-content-center py-5">
            <div class="spinner-border text-primary me-3" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <span class="fs-5">AI is analyzing your request...</span>
          </div>
        </Card>
      {/if}
    </div>
  </div>
</div>
