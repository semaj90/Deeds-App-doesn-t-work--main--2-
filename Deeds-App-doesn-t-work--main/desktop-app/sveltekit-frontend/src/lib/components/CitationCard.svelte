<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CitationPoint, Case } from '$lib/data/types';
  import { citationStore } from '$lib/citations/lokiStore';
  
  export let citation: CitationPoint;
  export let isDraggable: boolean = true;
  export let showAddToCase: boolean = true;
  export let onAddToCase: ((citationId: string, caseId: string) => Promise<void>) | null = null;
  
  const dispatch = createEventDispatcher();
  
  let showModal = false;
  let availableCases: Case[] = [];
  let selectedCases: string[] = [];
  let loading = false;
  let error = '';
  
  // Load available cases when modal opens
  async function loadCases() {
    loading = true;
    error = '';
    try {
      const response = await fetch('/api/cases');
      if (response.ok) {
        availableCases = await response.json();
      } else {
        throw new Error('Failed to load cases');
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
      error = err instanceof Error ? err.message : 'Failed to load cases';
      // Mock data for demo when API fails
      availableCases = [
        { 
          id: '1', 
          title: 'State vs. Johnson', 
          status: 'active', 
          createdAt: Date.now() - 86400000,
          description: 'Criminal case involving theft charges'
        },
        { 
          id: '2', 
          title: 'People vs. Smith', 
          status: 'pending', 
          createdAt: Date.now() - 172800000,
          description: 'Fraud investigation case'
        },
        { 
          id: '3', 
          title: 'Commonwealth vs. Brown', 
          status: 'closed', 
          createdAt: Date.now() - 259200000,
          description: 'Assault case resolved'
        },
      ] as Case[];
    } finally {
      loading = false;
    }
  }
  
  function openModal() {
    showModal = true;
    selectedCases = [];
    loadCases();
  }
  
  function closeModal() {
    showModal = false;
    selectedCases = [];
    error = '';
  }
  
  function toggleCaseSelection(caseId: string) {
    if (selectedCases.includes(caseId)) {
      selectedCases = selectedCases.filter(id => id !== caseId);
    } else {
      selectedCases = [...selectedCases, caseId];
    }
  }
  
  async function addToCases() {
    if (selectedCases.length === 0) return;
    
    try {
      loading = true;
      error = '';

      for (const caseId of selectedCases) {
        if (onAddToCase) {
          // Use the provided callback
          await onAddToCase(citation.id, caseId);
        } else {
          // Use citationStore to link citation to case
          citationStore.linkCitationsToCase([citation.id], caseId);
        }
        
        dispatch('citationAdded', { citation, caseId });
      }
      
      closeModal();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to add citation to cases';
      console.error('Error adding citation to cases:', err);
    } finally {
      loading = false;
    }
  }
  
  function handleDragStart(event: DragEvent) {
    if (!isDraggable) return;
    event.dataTransfer?.setData('text/plain', JSON.stringify(citation));
    dispatch('dragStart', { citation });
  }
  
  function formatTimestamp(timestamp: number) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Check if citation is already linked to a case
  $: isLinked = citation.linkedTo !== undefined;
</script>

<div 
  class="citation-card {isLinked ? 'linked' : ''}" 
  draggable={isDraggable}
  on:dragstart={handleDragStart}
  role="article"
  tabindex="0"
>
  <div class="citation-header">
    <div class="citation-source">{citation.source}</div>
    <div class="citation-date">{formatTimestamp(citation.updatedAt)}</div>
  </div>
  
  <div class="citation-summary">
    {citation.summary}
  </div>
  
  <div class="citation-labels">
    {#each citation.labels as label}
      <span class="label">{label}</span>
    {/each}
  </div>
  
  <div class="citation-actions">
    {#if showAddToCase && !isLinked}
      <button class="btn-add-to-case" on:click={openModal}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Add to Case
      </button>
    {:else if isLinked}
      <span class="linked-indicator">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Linked to Case {citation.linkedTo}
      </span>
    {/if}
    
    {#if isDraggable}
      <span class="drag-handle" title="Drag to case">⋮⋮</span>
    {/if}
  </div>
</div>

<!-- Modal -->
{#if showModal}
  <div class="modal-overlay" on:click={closeModal} role="dialog" aria-modal="true">
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Add Citation to Cases</h3>
        <button class="modal-close" on:click={closeModal} aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="citation-preview">
          <strong>Citation:</strong> {citation.summary.substring(0, 100)}...
        </div>
        
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        
        {#if loading}
          <div class="loading">Loading cases...</div>
        {:else}
          <div class="cases-grid">
            {#each availableCases as case_}
              <div 
                class="case-card"
                class:selected={selectedCases.includes(case_.id.toString())}
                on:click={() => toggleCaseSelection(case_.id.toString())}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && toggleCaseSelection(case_.id.toString())}
              >
                <div class="case-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedCases.includes(case_.id.toString())}
                    on:change={() => toggleCaseSelection(case_.id.toString())}
                  />
                </div>
                <div class="case-info">
                  <div class="case-title">{case_.title}</div>
                  <div class="case-status status-{case_.status}">{case_.status}</div>
                  {#if case_.description}
                    <div class="case-description">{case_.description}</div>
                  {/if}
                  <div class="case-date">
                    Created: {formatTimestamp(case_.createdAt)}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" on:click={closeModal}>Cancel</button>
        <button 
          class="btn-add" 
          on:click={addToCases}
          disabled={selectedCases.length === 0 || loading}
        >
          {loading ? 'Adding...' : `Add to ${selectedCases.length} Case${selectedCases.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .citation-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    cursor: grab;
  }

  .citation-card.linked {
    border-left: 4px solid #10b981;
    background: #f0fdf4;
  }
  
  .citation-card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
  
  .citation-card:active {
    cursor: grabbing;
  }
  
  .citation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .citation-source {
    font-weight: 500;
    color: #3b82f6;
  }
  
  .citation-summary {
    font-size: 0.95rem;
    line-height: 1.5;
    color: #374151;
    margin-bottom: 12px;
  }
  
  .citation-labels {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }
  
  .label {
    background: #f3f4f6;
    color: #374151;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .citation-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }
  
  .btn-add-to-case {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #3b82f6;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .btn-add-to-case:hover {
    background: #2563eb;
  }

  .linked-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #10b981;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .drag-handle {
    color: #9ca3af;
    cursor: grab;
    font-weight: bold;
    user-select: none;
    font-size: 1.2rem;
  }

  .drag-handle:hover {
    color: #6b7280;
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
  
  .citation-preview {
    background: #f9fafb;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 20px;
    font-size: 0.875rem;
    color: #374151;
  }
  
  .loading {
    text-align: center;
    color: #6b7280;
    padding: 40px;
  }
  
  .cases-grid {
    display: grid;
    gap: 12px;
  }
  
  .case-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .case-card:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
  
  .case-card.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  .case-checkbox input {
    margin: 0;
  }
  
  .case-info {
    flex: 1;
  }
  
  .case-title {
    font-weight: 500;
    color: #111827;
    margin-bottom: 4px;
  }
  
  .case-status {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 500;
    text-transform: uppercase;
    display: inline-block;
    margin-bottom: 4px;
  }

  .case-description {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .case-date {
    font-size: 0.7rem;
    color: #9ca3af;
  }
  
  .status-active {
    background: #d1fae5;
    color: #065f46;
  }
  
  .status-pending {
    background: #fef3c7;
    color: #92400e;
  }
  
  .status-closed {
    background: #fee2e2;
    color: #991b1b;
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 0.875rem;
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
  .btn-add {
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
  
  .btn-add {
    background: #3b82f6;
    border: 1px solid #3b82f6;
    color: white;
  }
  
  .btn-add:hover:not(:disabled) {
    background: #2563eb;
    border-color: #2563eb;
  }
  
  .btn-add:disabled {
    background: #9ca3af;
    border-color: #9ca3af;
    cursor: not-allowed;
  }
</style>
