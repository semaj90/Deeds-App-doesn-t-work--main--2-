<!-- Copilot Instructions:
- This is the AI Search page for the Tauri desktop app
- Should match web app functionality but use Tauri commands for AI search
- Include search sidebar, query types, and results display
- Use shared UI components from $ui where possible
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/tauri';
  import { page } from '$app/stores';
  import Card from '$ui/components/Card.svelte';
  import Button from '$ui/components/Button.svelte';
  import { marked } from 'marked';
  
  let formattedResponse = '';
  let isLoading = false;
  let newQuery = '';
  let searchResult: any = null;
  
  // TODO: Get initial query from URL params if available
  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      newQuery = query;
      await performSearch(query);
    }
  });
  
  // TODO: Wire up to Tauri AI search commands
  async function performNewSearch() {
    if (!newQuery.trim()) return;
    await performSearch(newQuery);
  }
  
  async function performSearch(query: string) {
    isLoading = true;
    try {
      // Use Tauri command instead of HTTP API
      const result = await invoke('ai_search', { 
        query: query.trim() 
      });
      
      searchResult = result;
      if (result?.response) {
        formattedResponse = await marked(result.response);
      }
      
      // Update URL with new search
      window.history.pushState({}, '', `/ai/search?q=${encodeURIComponent(query)}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      formattedResponse = `<div class="alert alert-danger">Error: ${errorMessage}</div>`;
    } finally {
      isLoading = false;
    }
  }
  
  function getQueryTypeIcon(type: string) {
    switch (type) {
      case 'legal_analysis': return 'bi-scale';
      case 'report_generation': return 'bi-file-text';
      case 'evidence_analysis': return 'bi-microscope';
      case 'case_assistance': return 'bi-briefcase';
      default: return 'bi-chat-quote';
    }
  }
  
  function getQueryTypeLabel(type: string) {
    switch (type) {
      case 'legal_analysis': return 'Legal Analysis';
      case 'report_generation': return 'Report Generation';
      case 'evidence_analysis': return 'Evidence Analysis';
      case 'case_assistance': return 'Case Assistance';
      default: return 'General Query';
    }
  }
  
  async function copyResponse() {
    if (formattedResponse) {
      await navigator.clipboard.writeText(searchResult?.response || '');
    }
  }
</script>

<svelte:head>
  <title>AI Search - Desktop App</title>
</svelte:head>

<div class="container-fluid py-4">
  <div class="row">
    <!-- Search Sidebar -->
    <div class="col-lg-3 mb-4">
      <Card class="h-100">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-robot me-2"></i>
            AI Legal Assistant
          </h5>
        </div>
        <div class="card-body">
          <!-- New Search -->
          <div class="mb-4">
            <label for="newQuery" class="form-label">Ask the AI:</label>
            <textarea 
              id="newQuery"
              class="form-control" 
              rows="3" 
              placeholder="Is possession of marijuana legal in California?"
              bind:value={newQuery}
            ></textarea>
            <Button 
              class="w-100 mt-2"
              variant="primary"
              on:click={performNewSearch}
              disabled={isLoading}
            >
              {#if isLoading}
                <i class="bi bi-hourglass-split me-2"></i>Searching...
              {:else}
                <i class="bi bi-search me-2"></i>Search
              {/if}
            </Button>
          </div>
          
          <!-- Quick Actions -->
          <hr />
          <h6>Quick Actions:</h6>
          <div class="d-grid gap-2">
            <Button 
              variant="outline" 
              size="sm"
              class="text-start"
              on:click={() => { newQuery = "Is this legal or illegal and why?"; performNewSearch(); }}
            >
              <i class="bi bi-scale me-2"></i>Legal Analysis
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              class="text-start"
              on:click={() => { newQuery = "Generate a case report for my current investigation"; performNewSearch(); }}
            >
              <i class="bi bi-file-text me-2"></i>Generate Report
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              class="text-start"
              on:click={() => { newQuery = "Analyze uploaded evidence for legal significance"; performNewSearch(); }}
            >
              <i class="bi bi-microscope me-2"></i>Evidence Analysis
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              class="text-start"
              on:click={() => { newQuery = "What's the best prosecution strategy for this case?"; performNewSearch(); }}
            >
              <i class="bi bi-briefcase me-2"></i>Case Strategy
            </Button>
          </div>
          
          <!-- Navigation -->
          <hr />
          <div class="d-grid gap-2">
            <Button variant="outline" size="sm" href="/cases">
              <i class="bi bi-folder2-open me-2"></i>View Cases
            </Button>
            <Button variant="outline" size="sm" href="/evidence">
              <i class="bi bi-camera-video me-2"></i>Evidence Hub
            </Button>
            <Button variant="outline" size="sm" href="/upload">
              <i class="bi bi-cloud-upload me-2"></i>Upload Evidence
            </Button>
          </div>
        </div>
      </Card>
    </div>
    
    <!-- Results Area -->
    <div class="col-lg-9">
      <Card>
        <div class="card-header d-flex justify-between align-items-center">
          <div>
            <h4 class="mb-0">AI Search Results</h4>
            {#if searchResult?.type}
              <small class="text-muted">
                <i class="bi {getQueryTypeIcon(searchResult.type)} me-1"></i>
                {getQueryTypeLabel(searchResult.type)}
              </small>
            {/if}
          </div>
          {#if searchResult?.timestamp}
            <small class="text-muted">
              {new Date(searchResult.timestamp).toLocaleString()}
            </small>
          {/if}
        </div>
        
        <div class="card-body">
          {#if newQuery && searchResult}
            <div class="alert alert-light border-start border-4 border-primary">
              <strong>Query:</strong> {newQuery}
            </div>
          {/if}
          
          {#if formattedResponse}
            <div class="ai-response">
              {@html formattedResponse}
            </div>
          {:else if newQuery && !searchResult && !isLoading}
            <div class="text-center py-5">
              <i class="bi bi-exclamation-circle display-4 text-warning"></i>
              <h5 class="mt-3">No results found</h5>
              <p class="text-muted">Try a different search query or use one of the quick actions.</p>
            </div>
          {:else}
            <div class="text-center py-5">
              <i class="bi bi-robot display-4 text-primary"></i>
              <h5 class="mt-3">AI Legal Assistant Ready</h5>
              <p class="text-muted">Ask me about legal analysis, case strategy, evidence review, or report generation.</p>
              
              <div class="row mt-4">
                <div class="col-md-6 mb-3">
                  <div class="card border-0 bg-light">
                    <div class="card-body text-center">
                      <i class="bi bi-scale text-primary fs-1"></i>
                      <h6 class="mt-2">Legal Analysis</h6>
                      <p class="small text-muted">Determine if actions are legal/illegal</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card border-0 bg-light">
                    <div class="card-body text-center">
                      <i class="bi bi-file-text text-success fs-1"></i>
                      <h6 class="mt-2">Report Generation</h6>
                      <p class="small text-muted">Create case reports and summaries</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card border-0 bg-light">
                    <div class="card-body text-center">
                      <i class="bi bi-microscope text-warning fs-1"></i>
                      <h6 class="mt-2">Evidence Analysis</h6>
                      <p class="small text-muted">Analyze evidence and extract insights</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card border-0 bg-light">
                    <div class="card-body text-center">
                      <i class="bi bi-briefcase text-info fs-1"></i>
                      <h6 class="mt-2">Case Strategy</h6>
                      <p class="small text-muted">Get prosecution recommendations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/if}
          
          <!-- Loading State -->
          {#if isLoading}
            <div class="text-center py-5">
              <div class="spinner-border text-primary me-3" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <span class="fs-5">AI is processing your search...</span>
            </div>
          {/if}
        </div>
        
        {#if formattedResponse}
          <div class="card-footer">
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                AI-generated response. Always verify with current law and legal counsel.
              </small>
              <div>
                <Button variant="outline" size="sm" on:click={copyResponse}>
                  <i class="bi bi-clipboard me-1"></i>Copy
                </Button>
                <Button variant="outline" size="sm" class="ms-2">
                  <i class="bi bi-download me-1"></i>Export
                </Button>
              </div>
            </div>
          </div>
        {/if}
      </Card>
    </div>
  </div>
</div>

<style>
  :global(.ai-response h1, .ai-response h2, .ai-response h3) {
    color: #333;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }
  
  :global(.ai-response h1) {
    font-size: 1.5rem;
    border-bottom: 2px solid #e9ecef;
    padding-bottom: 0.5rem;
  }
  
  :global(.ai-response h2) {
    font-size: 1.25rem;
    color: #495057;
  }
  
  :global(.ai-response h3) {
    font-size: 1.1rem;
    color: #6c757d;
  }
  
  :global(.ai-response ul, .ai-response ol) {
    margin-left: 1rem;
    margin-bottom: 1rem;
  }
  
  :global(.ai-response p) {
    margin-bottom: 0.75rem;
    line-height: 1.6;
  }
  
  :global(.ai-response strong) {
    color: #495057;
  }
  
  :global(.ai-response em) {
    font-style: italic;
    color: #6c757d;
  }
  
  :global(.ai-response blockquote) {
    border-left: 4px solid #007bff;
    padding-left: 1rem;
    margin: 1rem 0;
    background-color: #f8f9fa;
    padding: 0.75rem 1rem;
    border-radius: 0.25rem;
  }
  
  .card {
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  }
  
  .border-start {
    border-left-width: 4px !important;
  }
</style>
