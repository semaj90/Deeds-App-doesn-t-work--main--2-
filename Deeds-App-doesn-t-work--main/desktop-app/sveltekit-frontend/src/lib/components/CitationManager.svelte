<script lang="ts">
  import { onMount } from 'svelte';
  import CitationCard from './CitationCard.svelte';
  import type { CitationPoint } from '$lib/data/types';
  import { citationStore } from '$lib/citations/lokiStore';
  
  export let caseId: string | null = null; // If set, shows citations for this case
  export let allowCreation: boolean = true;
  export let title: string = 'Citation Points';
  
  let searchQuery = '';
  let citationPoints: CitationPoint[] = [];
  let filteredCitations: CitationPoint[] = [];
  let loading = false;
  let showCreateForm = false;
  let stats = { total: 0, linked: 0, unlinked: 0, labels: [] };
  let newCitation = {
    summary: '',
    source: '',
    labels: [] as string[],
    labelInput: ''
  };
  
  onMount(() => {
    initializeCitations();
  });
  
  async function initializeCitations() {
    loading = true;
    try {
      await citationStore.initialize();
      loadCitations();
      updateStats();
    } catch (error) {
      console.error('Failed to initialize citations:', error);
    } finally {
      loading = false;
    }
  }
  
  function loadCitations() {
    if (caseId) {
      citationPoints = citationStore.getCitationsByCase(caseId);
    } else {
      citationPoints = citationStore.searchCitations('', 100);
    }
    filteredCitations = citationPoints;
  }
  
  function updateStats() {
    stats = citationStore.getStats();
  }
  
  async function searchCitations() {
    if (!searchQuery.trim()) {
      filteredCitations = citationPoints;
      return;
    }
    
    loading = true;
    try {
      const results = citationStore.searchCitations(searchQuery);
      filteredCitations = caseId ? 
        results.filter(c => c.linkedTo === caseId) : 
        results;
    } catch (error) {
      console.error('Search failed:', error);
      filteredCitations = citationPoints.filter(c => 
        c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.labels.some(label => label.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } finally {
      loading = false;
    }
  }
  
  function handleSearchInput() {
    searchCitations();
  }
  
  function createCitation() {
    if (!newCitation.summary || !newCitation.source) return;
    
    const citation = citationStore.addCitation({
      summary: newCitation.summary,
      source: newCitation.source,
      labels: newCitation.labels,
      linkedTo: caseId || undefined
    });
    
    loadCitations();
    updateStats();
    
    // Reset form
    newCitation = {
      summary: '',
      source: '',
      labels: [],
      labelInput: ''
    };
    showCreateForm = false;
  }
  
  function addLabel() {
    if (newCitation.labelInput.trim() && !newCitation.labels.includes(newCitation.labelInput.trim())) {
      newCitation.labels = [...newCitation.labels, newCitation.labelInput.trim()];
      newCitation.labelInput = '';
    }
  }
  
  function removeLabel(index: number) {
    newCitation.labels = newCitation.labels.filter((_, i) => i !== index);
  }
  
  function handleCitationAdded(event: CustomEvent) {
    console.log('Citation added to case:', event.detail);
    // Optionally refresh or show notification
  }
</script>

<div class="citation-manager">
  <div class="citation-header">
    <h2>{title}</h2>
    
    <div class="header-actions">
      {#if allowCreation}
        <button class="btn-create" on:click={() => showCreateForm = true}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Create Citation
        </button>
      {/if}
    </div>
  </div>
  
  <div class="search-section">
    <div class="search-box">
      <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <input 
        type="text" 
        placeholder="Search citations by content, labels, or source..."
        bind:value={searchQuery}
        on:input={handleSearchInput}
      />
    </div>
  </div>
  
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      Searching citations...
    </div>
  {:else if filteredCitations.length === 0}
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
      </svg>
      <h3>No citations found</h3>
      <p>
        {#if searchQuery}
          Try adjusting your search terms
        {:else}
          Start by creating your first citation point
        {/if}
      </p>
    </div>
  {:else}
    <div class="citations-list">
      {#each filteredCitations as citation (citation.id)}
        <CitationCard 
          {citation}
          on:citationAdded={handleCitationAdded}
        />
      {/each}
    </div>
  {/if}
</div>

<!-- Create Citation Modal -->
{#if showCreateForm}
  <div class="modal-overlay" on:click={() => showCreateForm = false} role="dialog" aria-modal="true">
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Create Citation Point</h3>
        <button class="modal-close" on:click={() => showCreateForm = false} aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="source">Source</label>
          <input 
            id="source"
            type="text" 
            placeholder="e.g., Evidence/123, Witness Statement"
            bind:value={newCitation.source}
          />
        </div>
        
        <div class="form-group">
          <label for="summary">Summary</label>
          <textarea 
            id="summary"
            placeholder="AI-generated or manual summary of the citation..."
            bind:value={newCitation.summary}
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>Labels</label>
          <div class="labels-input">
            <input 
              type="text"
              placeholder="Add label..."
              bind:value={newCitation.labelInput}
              on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
            />
            <button type="button" on:click={addLabel}>Add</button>
          </div>
          <div class="labels-list">
            {#each newCitation.labels as label, index}
              <span class="label">
                {label}
                <button type="button" on:click={() => removeLabel(index)}>×</button>
              </span>
            {/each}
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" on:click={() => showCreateForm = false}>Cancel</button>
        <button 
          class="btn-create-final" 
          on:click={createCitation}
          disabled={!newCitation.summary || !newCitation.source}
        >
          Create Citation
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .citation-manager {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .citation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .citation-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
  }
  
  .btn-create {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #3b82f6;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .btn-create:hover {
    background: #2563eb;
  }
  
  .search-section {
    margin-bottom: 24px;
  }
  
  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .search-icon {
    position: absolute;
    left: 12px;
    color: #6b7280;
    z-index: 1;
  }
  
  .search-box input {
    width: 100%;
    padding: 12px 12px 12px 44px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
  }
  
  .search-box input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 20px;
    color: #6b7280;
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-left-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
  }
  
  .empty-state svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  .empty-state h3 {
    margin: 0 0 8px 0;
    font-size: 1.125rem;
    font-weight: 500;
    color: #374151;
  }
  
  .empty-state p {
    margin: 0;
    font-size: 0.875rem;
  }
  
  .citations-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }
  
  .modal-close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
  }
  
  .modal-close:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  .modal-body {
    padding: 20px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
  }
  
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .labels-input {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .labels-input input {
    flex: 1;
    margin: 0;
  }
  
  .labels-input button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
  }
  
  .labels-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .label {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #f3f4f6;
    color: #374151;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .label button {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  
  .label button:hover {
    background: #e5e7eb;
    color: #374151;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .btn-cancel,
  .btn-create-final {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-cancel {
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;
  }
  
  .btn-cancel:hover {
    background: #f3f4f6;
  }
  
  .btn-create-final {
    background: #3b82f6;
    border: 1px solid #3b82f6;
    color: white;
  }
  
  .btn-create-final:hover:not(:disabled) {
    background: #2563eb;
    border-color: #2563eb;
  }
  
  .btn-create-final:disabled {
    background: #9ca3af;
    border-color: #9ca3af;
    cursor: not-allowed;
  }
</style>
