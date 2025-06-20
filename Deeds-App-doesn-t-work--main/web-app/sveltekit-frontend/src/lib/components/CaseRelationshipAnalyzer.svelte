<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { predictiveAnalyzer } from '$lib/nlp/analyzer';
  import { page } from '$app/stores';
  
  export let caseId: string;
  export let caseDescription: string = '';
  export let userId: string;

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
      analysisResults = await predictiveAnalyzer.analyzeCaseDescription(caseDescription, caseId);
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
    if (similarity > 0.8) return 'text-red-600';
    if (similarity > 0.6) return 'text-orange-600';
    if (similarity > 0.4) return 'text-yellow-600';
    return 'text-blue-600';
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
    <div class="spinner"></div>
    <span>Analyzing case relationships...</span>
  </div>
{/if}

{#if hasHighSimilarity && !isAnalyzing}
  <div class="alert alert-warning">
    <div class="alert-content">
      <div class="alert-icon">⚠️</div>
      <div>
        <h4>Potential Case Relationships Detected</h4>
        <p>Found {suggestedMerges.length} case(s) with high similarity. Consider reviewing for potential merging or linking.</p>
      </div>
      <button class="btn btn-sm btn-outline" on:click={() => showRelationships = true}>
        Review
      </button>
    </div>
  </div>
{/if}

{#if showRelationships && relatedCases.length > 0}
  <div class="relationships-panel">
    <div class="panel-header">
      <h3>Related Cases Analysis</h3>
      <button class="btn btn-sm btn-ghost" on:click={() => showRelationships = false}>
        ✕
      </button>
    </div>

    <div class="relationships-content">
      <div class="analysis-summary">
        <h4>Analysis Summary</h4>
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-value">{relatedCases.length}</span>
            <span class="stat-label">Related Cases</span>
          </div>
          <div class="stat">
            <span class="stat-value">{suggestedMerges.length}</span>
            <span class="stat-label">High Similarity</span>
          </div>
          <div class="stat">
            <span class="stat-value">{Math.round((analysisResults?.confidence || 0) * 100)}%</span>
            <span class="stat-label">Confidence</span>
          </div>
        </div>
      </div>

      <div class="related-cases-list">
        {#each relatedCases as relatedCase}
          <div class="case-card" class:selected={selectedCases.has(relatedCase.caseId)}>
            <div class="case-header">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={selectedCases.has(relatedCase.caseId)}
                  on:change={() => toggleCaseSelection(relatedCase.caseId)}
                />
                <span class="relationship-icon">{getRelationshipIcon(relatedCase.relationshipType)}</span>
                <span class="case-title">Case #{relatedCase.caseId.slice(0, 8)}</span>
              </label>
              <div class="similarity-badge">
                <span class="similarity-score {getRelationshipColor(relatedCase.relationshipType, relatedCase.similarity)}">
                  {Math.round(relatedCase.similarity * 100)}% similar
                </span>
                <span class="relationship-type">{relatedCase.relationshipType}</span>
              </div>
            </div>

            <div class="case-details">
              <p class="reasoning">{relatedCase.reasoning}</p>
              {#if relatedCase.sharedEntities && relatedCase.sharedEntities.length > 0}
                <div class="shared-entities">
                  <strong>Shared entities:</strong>
                  {#each relatedCase.sharedEntities.slice(0, 5) as entity}
                    <span class="entity-tag">{entity}</span>
                  {/each}
                  {#if relatedCase.sharedEntities.length > 5}
                    <span class="entity-more">+{relatedCase.sharedEntities.length - 5} more</span>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if selectedCount > 0}
        <div class="action-panel">
          <h4>Actions for {selectedCount} selected case(s)</h4>
          <div class="action-buttons">
            <button class="btn btn-primary" on:click={generateSummary}>
              📊 Generate Relationship Summary
            </button>
            {#if suggestedMerges.some(c => selectedCases.has(c.caseId))}
              <button class="btn btn-warning" on:click={suggestMerge}>
                🔄 Suggest Case Merge
              </button>
            {/if}
            <button class="btn btn-ghost" on:click={() => selectedCases.clear() && (selectedCases = new Set())}>
              Clear Selection
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .analyzing-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .alert {
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .alert-warning {
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
  }

  .alert-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .alert-icon {
    font-size: 20px;
  }

  .alert-content > div {
    flex: 1;
  }

  .alert h4 {
    margin: 0 0 4px 0;
    font-weight: 600;
    color: #92400e;
  }

  .alert p {
    margin: 0;
    color: #78350f;
    font-size: 14px;
  }

  .relationships-panel {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .relationships-content {
    padding: 20px;
  }

  .analysis-summary {
    margin-bottom: 20px;
  }

  .analysis-summary h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
  }

  .summary-stats {
    display: flex;
    gap: 24px;
  }

  .stat {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
  }

  .stat-label {
    display: block;
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .related-cases-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .case-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s;
    cursor: pointer;
  }

  .case-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .case-card.selected {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .case-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .relationship-icon {
    font-size: 16px;
  }

  .case-title {
    font-weight: 600;
    color: #1f2937;
  }

  .similarity-badge {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .similarity-score {
    font-weight: 600;
    font-size: 14px;
  }

  .relationship-type {
    font-size: 12px;
    color: #6b7280;
    text-transform: capitalize;
  }

  .case-details {
    margin-left: 24px;
  }

  .reasoning {
    margin: 0 0 8px 0;
    color: #4b5563;
    font-size: 14px;
  }

  .shared-entities {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 12px;
  }

  .entity-tag {
    background-color: #f3f4f6;
    color: #374151;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 500;
  }

  .entity-more {
    color: #6b7280;
    font-style: italic;
  }

  .action-panel {
    border-top: 1px solid #e5e7eb;
    padding-top: 16px;
  }

  .action-panel h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-warning {
    background-color: #f59e0b;
    color: white;
    border-color: #f59e0b;
  }

  .btn-warning:hover {
    background-color: #d97706;
  }

  .btn-ghost {
    background-color: transparent;
    color: #6b7280;
    border-color: #e5e7eb;
  }

  .btn-ghost:hover {
    background-color: #f9fafb;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn-outline {
    background-color: transparent;
    color: #3b82f6;
    border-color: #3b82f6;
  }

  .btn-outline:hover {
    background-color: #3b82f6;
    color: white;
  }
</style>
