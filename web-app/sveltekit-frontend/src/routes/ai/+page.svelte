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
  <title>AI Prompt - WardenNet</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2">AI Legal Assistant</h1>
      <p class="text-lg opacity-70">Get AI-powered insights for your legal work</p>
    </div>
    
    <!-- Quick Prompts -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3">Quick Prompts</h3>
      <div class="flex flex-wrap gap-2">
        {#each quickPrompts as quickPrompt}
          <button 
            class="btn btn-outline btn-sm"
            on:click={() => useQuickPrompt(quickPrompt)}
          >
            {quickPrompt}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Prompt Input -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title">Your Prompt</h2>
        <div class="form-control">
          <textarea 
            class="textarea textarea-bordered h-32" 
            placeholder="Enter your legal question or request for AI analysis..."
            bind:value={prompt}
          ></textarea>
        </div>
        <div class="card-actions justify-end">
          <button class="btn btn-ghost" on:click={clearAll}>Clear</button>
          <button 
            class="btn btn-primary" 
            on:click={submitPrompt}
            disabled={loading || !prompt.trim()}
          >
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
              Processing...
            {:else}
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Submit Prompt
            {/if}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Response -->
    {#if error}
      <div class="alert alert-error mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    {/if}
    
    {#if response}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">AI Response</h2>
          <div class="prose max-w-none">
            <div class="whitespace-pre-wrap">{response}</div>
          </div>
          <div class="card-actions justify-end">
            <button class="btn btn-ghost btn-sm" on:click={() => navigator.clipboard.writeText(response)}>
              📋 Copy Response
            </button>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Loading State -->
    {#if loading}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex items-center justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
            <span class="ml-4 text-lg">AI is analyzing your request...</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
