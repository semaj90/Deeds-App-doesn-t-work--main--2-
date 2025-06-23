<script lang="ts">
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
  
  async function submitPrompt() {
    if (!prompt.trim()) return;
    
    loading = true;
    error = null;
    response = '';
    
    try {
      const res = await fetch('/api/ai/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });
      
      if (!res.ok) {
        throw new Error('AI request failed');
      }
      
      const data = await res.json();
      response = data.response || data.message || 'No response received';
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
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
  <title>AI Prompt - Legal Intelligence CMS</title>
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
            <button 
              class="btn btn-outline-primary btn-sm"
              on:click={() => useQuickPrompt(quickPrompt)}
            >
              {quickPrompt}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Prompt Input -->
      <div class="card shadow-sm mb-4">
        <div class="card-body">
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
            <button class="btn btn-outline-secondary" on:click={clearAll}>
              <i class="bi bi-x-circle me-1"></i>
              Clear
            </button>
            <button 
              class="btn btn-primary" 
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
            </button>
          </div>
        </div>
      </div>
      
      <!-- Error Alert -->
      {#if error}
        <div class="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
      {/if}
      
      <!-- Response -->
      {#if response}
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">
              <i class="bi bi-cpu me-2 text-success"></i>
              AI Response
            </h5>
            <div class="border rounded p-3 bg-light">
              <div class="text-break" style="white-space: pre-wrap;">{response}</div>
            </div>
            <div class="d-flex justify-content-end mt-3">
              <button 
                class="btn btn-outline-secondary btn-sm" 
                on:click={() => navigator.clipboard.writeText(response)}
              >
                <i class="bi bi-clipboard me-1"></i>
                Copy Response
              </button>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Loading State -->
      {#if loading}
        <div class="card shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-center py-5">
              <div class="spinner-border text-primary me-3" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <span class="fs-5">AI is analyzing your request...</span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
