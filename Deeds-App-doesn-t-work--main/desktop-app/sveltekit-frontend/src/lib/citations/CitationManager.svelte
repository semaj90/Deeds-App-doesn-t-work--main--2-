<script lang="ts">
  import { onMount } from 'svelte';
  import type { LegacyCitationPoint } from '$lib/data/types';
  import { citationStore } from '$lib/citations/lokiStore';
  import CitationCard from '$lib/components/CitationCard.svelte';
  
  export let caseId: string | null = null; // If set, shows citations for this case
  export let allowCreation: boolean = true;
  export let title: string = 'Citation Points';
  
  let searchQuery = '';
  let citations: LegacyCitationPoint[] = [];
  let filteredCitations: LegacyCitationPoint[] = [];
  let showCreateForm = false;
  let loading = false;
  let stats = { total: 0, linked: 0, unlinked: 0, labels: [] };
  let activeFilter: 'all' | 'linked' | 'unlinked' = 'all';
  
  // New citation form
  let newCitation = {
    summary: '',
    source: '',
    labels: ''
  };

  onMount(async () => {
    await initializeCitations();
  });

  async function initializeCitations() {
    loading = true;
    try {
      await citationStore.initialize();
      refreshCitations();
      updateStats();
    } catch (error) {
      console.error('Failed to initialize citations:', error);
    } finally {
      loading = false;
    }
  }

  function refreshCitations() {
    if (caseId) {
      // Show citations for specific case
      citations = citationStore.getCitationsByCase(caseId);
    } else {
      // Show all citations or filtered by search
      if (searchQuery.trim()) {
        citations = citationStore.searchCitations(searchQuery, 50);
      } else {
        switch (activeFilter) {
          case 'linked':
            citations = citationStore.searchCitations('').filter(c => c.linkedTo);
            break;
          case 'unlinked':
            citations = citationStore.getUnlinkedCitations(50);
            break;
          default:
            citations = citationStore.searchCitations('', 100);
        }
      }
    }
    filteredCitations = citations;
  }

  function updateStats() {
    stats = citationStore.getStats();
  }

  // Handle search input
  function handleSearch() {
    refreshCitations();
  }

  // Handle adding citation to case
  async function handleAddToCase(citationId: string, caseId: string) {
    try {
      const success = citationStore.linkCitationsToCase([citationId], caseId);
      if (success) {
        refreshCitations();
        updateStats();
      }
    } catch (error) {
      console.error('Failed to link citation to case:', error);
      throw error;
    }
  }

  // Create new citation
  function createCitation() {
    if (!newCitation.summary.trim() || !newCitation.source.trim()) {
      return;
    }

    const labels = newCitation.labels
      .split(',')
      .map(label => label.trim())
      .filter(label => label.length > 0);

    const citation = citationStore.addCitation({
      summary: newCitation.summary.trim(),
      source: newCitation.source.trim(),
      labels,
      linkedTo: caseId || undefined
    });

    // Reset form
    newCitation = { summary: '', source: '', labels: '' };
    showCreateForm = false;
    
    refreshCitations();
    updateStats();
  }

  // Generate AI summary (mock implementation)
  async function generateAISummary() {
    if (!newCitation.source.trim()) return;
    
    // Mock AI summary generation
    const mockSummaries = [
      'Evidence shows suspicious activity captured on surveillance footage during the time frame',
      'Forensic analysis reveals DNA match with 99.7% confidence level',
      'Witness testimony provides crucial timeline information for the incident',
      'Phone records indicate communication with known associates during critical period',
      'Financial records show unusual transaction patterns prior to the event'
    ];
    
    newCitation.summary = mockSummaries[Math.floor(Math.random() * mockSummaries.length)];
  }

  // Filter citations by type
  function filterByType(type: 'all' | 'linked' | 'unlinked') {
    activeFilter = type;
    refreshCitations();
  }

  // Handle drag over for drop zone
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  // Handle drop for creating citations from evidence
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    
    try {
      const data = event.dataTransfer?.getData('application/json');
      if (data) {
        const droppedData = JSON.parse(data);
        if (droppedData.type === 'evidence') {
          // Auto-populate form with evidence data
          newCitation.source = `evidence/${droppedData.evidence.id}`;
          newCitation.summary = droppedData.evidence.description || '';
          newCitation.labels = droppedData.evidence.type || '';
          showCreateForm = true;
        }
      }
    } catch (error) {
      console.error('Failed to process dropped data:', error);
    }
  }
</script>

<div class="citation-manager">
  <div class="manager-header">
    <div class="header-content">
      <h2>{title}</h2>
      {#if !caseId}
        <div class="stats-display">
          <span class="stat-item">Total: {stats.total}</span>
          <span class="stat-item">Linked: {stats.linked}</span>
          <span class="stat-item">Available: {stats.unlinked}</span>
        </div>
      {/if}
    </div>
    
    {#if allowCreation}
      <div class="header-actions">
        <button 
          class="btn-create"
          on:click={() => showCreateForm = !showCreateForm}
        >
          {showCreateForm ? 'Cancel' : 'Create Citation'}
        </button>
      </div>
    {/if}
  </div>

  <!-- Search and Filters -->
  <div class="search-section">
    <div class="search-input">
      <input
        type="text"
        placeholder="Search citations by content, source, or labels..."
        bind:value={searchQuery}
        on:input={handleSearch}
      />
      <button class="search-btn" on:click={handleSearch}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </button>
    </div>
    
    {#if !caseId}
      <div class="filter-buttons">
        <button 
          class="filter-btn {activeFilter === 'all' ? 'active' : ''}" 
          on:click={() => filterByType('all')}
        >
          All
        </button>
        <button 
          class="filter-btn {activeFilter === 'unlinked' ? 'active' : ''}" 
          on:click={() => filterByType('unlinked')}
        >
          Available
        </button>
        <button 
          class="filter-btn {activeFilter === 'linked' ? 'active' : ''}" 
          on:click={() => filterByType('linked')}
        >
          Linked
        </button>
      </div>
    {/if}
  </div>

  <!-- Create Citation Form -->
  {#if showCreateForm && allowCreation}
    <div 
      class="create-form"
      on:dragover={handleDragOver}
      on:drop={handleDrop}
      role="region"
      aria-label="Create new citation"
    >
      <h3>Create New Citation Point</h3>
      <div class="drop-zone">
        <p>Drag evidence here to auto-populate, or fill manually</p>
      </div>
      
      <div class="form-grid">
        <div class="form-field">
          <label for="source">Source</label>
          <input
            id="source"
            type="text"
            placeholder="e.g., evidence/video_001, document/report_123"
            bind:value={newCitation.source}
          />
        </div>
        
        <div class="form-field">
          <label for="summary">AI Summary</label>
          <div class="summary-input">
            <textarea
              id="summary"
              placeholder="AI-generated evidence summary..."
              bind:value={newCitation.summary}
              rows="3"
            ></textarea>
            <button 
              class="btn-ai-generate"
              on:click={generateAISummary}
              type="button"
            >
              Generate AI Summary
            </button>
          </div>
        </div>
        
        <div class="form-field">
          <label for="labels">Labels</label>
          <input
            id="labels"
            type="text"
            placeholder="surveillance, forensics, timeline (comma-separated)"
            bind:value={newCitation.labels}
          />
        </div>
      </div>
      
      <div class="form-actions">
        <button class="btn-cancel" on:click={() => showCreateForm = false}>
          Cancel
        </button>
        <button 
          class="btn-save"
          on:click={createCitation}
          disabled={!newCitation.summary.trim() || !newCitation.source.trim()}
        >
          Create Citation
        </button>
      </div>
    </div>
  {/if}

  <!-- Citations List -->
  <div class="citations-container">
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading citations...</p>
      </div>
    {:else if filteredCitations.length === 0}
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        <h3>No Citations Found</h3>
        <p>
          {searchQuery ? 'Try adjusting your search terms.' : 'Create your first citation point to get started.'}
        </p>
      </div>
    {:else}
      <div class="citations-grid">
        {#each filteredCitations as citation (citation.id)}
          <CitationCard
            {citation}
            isDraggable={true}
            showAddToCase={!citation.linkedTo && !caseId}
            onAddToCase={handleAddToCase}
            on:citationAdded={refreshCitations}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .citation-manager {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-content h2 {
    margin: 0 0 8px 0;
    color: #111827;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .stats-display {
    display: flex;
    gap: 16px;
  }

  .stat-item {
    font-size: 0.875rem;
    color: #6b7280;
    padding: 4px 8px;
    background: #f3f4f6;
    border-radius: 12px;
  }

  .btn-create {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
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

  .search-input {
    display: flex;
    margin-bottom: 16px;
  }

  .search-input input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px 0 0 6px;
    font-size: 0.875rem;
    outline: none;
  }

  .search-input input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }

  .search-btn {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-left: none;
    border-radius: 0 6px 6px 0;
    padding: 12px 16px;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s ease;
  }

  .search-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .filter-buttons {
    display: flex;
    gap: 8px;
  }

  .filter-btn {
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .filter-btn:hover {
    background: #f3f4f6;
  }

  .filter-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .create-form {
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    transition: border-color 0.2s ease;
  }

  .create-form:hover {
    border-color: #3b82f6;
  }

  .create-form h3 {
    margin: 0 0 16px 0;
    color: #111827;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .drop-zone {
    background: #eff6ff;
    border: 1px dashed #3b82f6;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    margin-bottom: 20px;
    color: #3b82f6;
    font-size: 0.875rem;
  }

  .form-grid {
    display: grid;
    gap: 16px;
    margin-bottom: 20px;
  }

  .form-field label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .form-field input,
  .form-field textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .form-field input:focus,
  .form-field textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }

  .summary-input {
    position: relative;
  }

  .btn-ai-generate {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #10b981;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .btn-ai-generate:hover {
    background: #059669;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn-cancel,
  .btn-save {
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

  .btn-save {
    background: #10b981;
    border: 1px solid #10b981;
    color: white;
  }

  .btn-save:hover:not(:disabled) {
    background: #059669;
    border-color: #059669;
  }

  .btn-save:disabled {
    background: #9ca3af;
    border-color: #9ca3af;
    cursor: not-allowed;
  }

  .citations-container {
    min-height: 400px;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #6b7280;
    text-align: center;
  }

  .loading-state .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state svg {
    margin-bottom: 16px;
    color: #d1d5db;
  }

  .empty-state h3 {
    margin: 0 0 8px 0;
    font-size: 1.125rem;
    color: #374151;
  }

  .empty-state p {
    margin: 0;
    max-width: 400px;
  }

  .citations-grid {
    display: grid;
    gap: 16px;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .citation-manager {
      padding: 16px;
    }

    .manager-header {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }

    .stats-display {
      justify-content: center;
    }

    .search-input {
      flex-direction: column;
    }

    .search-input input {
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .search-btn {
      border: 1px solid #d1d5db;
      border-radius: 6px;
    }

    .filter-buttons {
      justify-content: center;
      flex-wrap: wrap;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>
