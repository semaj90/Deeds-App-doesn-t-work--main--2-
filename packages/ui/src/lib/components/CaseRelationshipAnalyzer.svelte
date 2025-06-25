<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { nlpClient } from 'packages/lib/src/nlp/client';
  import type { CaseAnalysis } from 'packages/lib/src/nlp/types';
  import { page } from '$app/stores';
  
  export let caseId: string;
  export let caseDescription: string = '';

  const dispatch = createEventDispatcher();

  let relatedCases: any[] = [];
  let isAnalyzing = false;
  let showRelationships = false;
  let analysisResults: any = null;
  let suggestedMerges: any[] = [];
  let selectedCases: Set<string> = new Set();

  onMount(async () => {
    if (caseDescription) {
      await analyzeRelationships();
    }
  });

  async function analyzeRelationships() {
    if (!caseDescription || caseDescription.length < 20) return;

    isAnalyzing = true;
    
    try {
      analysisResults = await nlpClient.analyzeCaseDescription(caseDescription, caseId);
      relatedCases = analysisResults.relatedCases || [];
      
      // Find high-confidence suggestions for merging
      suggestedMerges = relatedCases.filter(case_item => 
        case_item.similarity > 0.7 && case_item.relationshipType === 'similar'
      );

      showRelationships = relatedCases.length > 0;
    } catch (error) {
      console.error('Error analyzing relationships:', error);
    } finally {
      isAnalyzing = false;
    }
  }

  function toggleCaseSelection(caseIdToToggle: string) {
    if (selectedCases.has(caseIdToToggle)) {
      selectedCases.delete(caseIdToToggle);
    } else {
      selectedCases.add(caseIdToToggle);
    }
    selectedCases = new Set(selectedCases);
  }

  async function generateSummary() {
    if (selectedCases.size === 0) return;

    const selectedCasesList = relatedCases.filter(c => selectedCases.has(c.caseId));
    
    dispatch('generateSummary', {
      primaryCaseId: caseId,
      relatedCases: selectedCasesList,
      analysisResults
    });
  }

  async function suggestMerge() {
    if (selectedCases.size === 0) return;

    const selectedCasesList = relatedCases.filter(c => selectedCases.has(c.caseId));
    
    dispatch('suggestMerge', {
      primaryCaseId: caseId,
      casesToMerge: selectedCasesList,
      reason: 'High similarity detected by NLP analysis'
    });
  }

  function getRelationshipColor(type: string, similarity: number): string {
    if (similarity > 0.8) return '#B91C1C'; // red-700
    if (similarity > 0.6) return '#C2410C'; // orange-600
    if (similarity > 0.4) return '#A16207'; // yellow-600
    return '#1D4ED8'; // blue-700
  }

  function getRelationshipIcon(type: string): string {
    switch (type) {
      case 'similar': return '🔗';
      case 'duplicate': return '🔄';
      case 'related': return '↔️';
      default: return '📋';
    }
  }

  $: hasHighSimilarity = suggestedMerges.length > 0;
  $: selectedCount = selectedCases.size;
</script>

{#if isAnalyzing}
  <div class="analyzing-banner">
    <p>Analyzing case relationships...</p>
  </div>
{/if}

{#if showRelationships}
  <div class="relationship-container">
    <div class="header">
      <h4 class="title">Related Cases</h4>
      <div class="actions">
        <button class="btn" on:click={generateSummary} disabled={selectedCount === 0}>
          Generate Summary ({selectedCount})
        </button>
        <button class="btn btn-error" on:click={suggestMerge} disabled={selectedCount === 0}>
          Suggest Merge ({selectedCount})
        </button>
      </div>
    </div>

    <ul class="case-list">
      {#each relatedCases as relatedCase}
        <li class="case-list-item">
          <div class="case-info">
            <input type="checkbox" class="checkbox" on:change={() => toggleCaseSelection(relatedCase.caseId)} />
            <span class="case-id">{relatedCase.caseId}</span>
            <span
              class="relationship-text"
              style="color: {getRelationshipColor(
                relatedCase.relationshipType,
                relatedCase.similarity
              )}"
            >
              {getRelationshipIcon(relatedCase.relationshipType)} {relatedCase.relationshipType} ({Math.round(relatedCase.similarity * 100)}%)
            </span>
          </div>
          <a href="/cases/{relatedCase.caseId}" target="_blank" class="link">View</a>
        </li>
      {/each}
    </ul>

    {#if hasHighSimilarity}
      <div class="alert alert-warning">
        <p>High similarity detected. Consider merging related cases.</p>
      </div>
    {/if}
  </div>
{/if}

<style>
  .analyzing-banner {
    padding: 0.5rem;
    background-color: #dbeafe;
    color: #1e40af;
    border-radius: 0.375rem;
    text-align: center;
    margin-bottom: 1rem;
  }
  .relationship-container {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    background-color: #f9fafb;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .title {
    font-size: 1.25rem;
    font-weight: 700;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  .btn {
    padding: 0.5rem 1rem;
    font-weight: 600;
    border-radius: 0.375rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .btn:hover:not(:disabled) {
    background-color: #f3f4f6;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-error {
    background-color: #ef4444;
    color: #ffffff;
    border-color: transparent;
  }
  .btn-error:hover:not(:disabled) {
    background-color: #dc2626;
  }
  .case-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .case-list > li + li {
    margin-top: 0.5rem;
  }
  .case-list-item {
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #ffffff;
  }
  .case-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .checkbox {
    width: 1rem;
    height: 1rem;
  }
  .case-id {
    font-weight: 600;
  }
  .relationship-text {
    font-size: 0.875rem;
    font-weight: 500;
  }
  .alert {
    padding: 1rem;
    border-radius: 0.375rem;
    margin-top: 1rem;
  }
  .alert-warning {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  }
  .link {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }
  .link:hover {
    text-decoration: underline;
  }
</style>
