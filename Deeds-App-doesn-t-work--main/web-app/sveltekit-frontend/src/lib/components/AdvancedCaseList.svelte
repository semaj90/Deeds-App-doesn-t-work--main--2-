<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import { recentCacheManager, recentCases, frequentCases } from '$lib/stores/recentCasesCache';
  import { getStateColor, getStateLabel, type CaseState } from '$lib/stores/caseStateMachine';
  import CaseRelationshipAnalyzer from '$lib/components/CaseRelationshipAnalyzer.svelte';
  import DraggableItem from '$lib/components/DraggableItem.svelte';
  import DropZone from '$lib/components/DropZone.svelte';
  import { dragDropManager } from '$lib/stores/dragDrop';

  export let data: any;

  let cases = data?.cases || [];
  let searchTerm = '';
  let statusFilter = 'all';
  let sortBy = 'recent';
  let viewMode = 'enhanced'; // 'simple', 'enhanced', 'merge'
  let showMergeMode = false;
  let selectedCases: string[] = [];
  let showRelationshipAnalyzer = false;
  let analyzingCaseId = '';
  let mergePreview: any = null;
  let isAnalyzing = false;

  // Recent cases integration
  let recentCasesList: any[] = [];
  let frequentCasesList: any[] = [];
  let nlpSuggestions: any[] = [];
  let showRecentCases = true;

  // NLP-powered recommendations
  let caseRecommendations: any[] = [];
  let showRecommendations = false;

  onMount(async () => {
    // Update recent cases cache with current cases
    cases.forEach((case_: any) => {
      recentCacheManager.addCaseToCache({
        id: case_.id,
        title: case_.title,
        description: case_.description,
        status: case_.status || 'active',
        tags: case_.tags || []
      });
    });

    // Subscribe to recent cases
    recentCases.subscribe(recent => {
      recentCasesList = recent.slice(0, 5);
    });

    frequentCases.subscribe(frequent => {
      frequentCasesList = frequent.slice(0, 3);
    });

    // Get NLP recommendations
    await loadNLPRecommendations();
  });

  let tagSearch = '';

  $: filteredCases = cases
    .filter((case_: any) => {
      const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           case_.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
      const matchesTags = !tagSearch || (Array.isArray(case_.tags) && case_.tags.some((t: string) => t.toLowerCase().includes(tagSearch.toLowerCase())));
      return matchesSearch && matchesStatus && matchesTags;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'nlp_priority':
          return (b.nlpPriority || 0) - (a.nlpPriority || 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  async function loadNLPRecommendations() {
    if (cases.length === 0) return;

    try {
      const response = await fetch('/api/nlp/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          caseIds: cases.map((c: any) => c.id).slice(0, 10),
          userId: $page.data.session?.user?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        caseRecommendations = data.recommendations || [];
        showRecommendations = caseRecommendations.length > 0;
      }
    } catch (error) {
      console.warn('Failed to load NLP recommendations:', error);
    }
  }

  async function analyzeCaseRelationships(caseId: string) {
    analyzingCaseId = caseId;
    showRelationshipAnalyzer = true;
    isAnalyzing = true;

    try {
      // This will trigger the CaseRelationshipAnalyzer component
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      isAnalyzing = false;
    }
  }

  async function getMergeSuggestions(caseId: string) {
    try {
      const response = await fetch(`/api/cases/merge/suggestions?caseId=${caseId}`);
      if (response.ok) {
        const data = await response.json();
        mergePreview = data;
        showMergeMode = true;
      }
    } catch (error) {
      console.error('Failed to get merge suggestions:', error);
    }
  }

  function toggleCaseSelection(caseId: string) {
    if (selectedCases.includes(caseId)) {
      selectedCases = selectedCases.filter(id => id !== caseId);
    } else {
      selectedCases = [...selectedCases, caseId];
    }
  }

  async function mergeCases() {
    if (selectedCases.length < 2) return;

    const targetCaseId = selectedCases[0];
    const sourceCaseIds = selectedCases.slice(1);

    try {
      const response = await fetch('/api/cases/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCaseId,
          sourceCaseIds,
          mergeStrategy: 'combine'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully merged ${sourceCaseIds.length} cases!`);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Merge failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Merge error:', error);
      alert('Failed to merge cases');
    }
  }

  function openCaseInNew(caseId: string) {
    recentCacheManager.addCaseToCache(cases.find((c: any) => c.id === caseId));
    window.open(`/cases/${caseId}`, '_blank');
  }

  function pickUpCase(recommendation: any) {
    const query = `title: ${recommendation.suggestedTitle || recommendation.pattern}`;
    goto(`/cases/new?template=${encodeURIComponent(query)}&nlp_suggestion=${recommendation.id}`);
  }

  // Drag and drop handlers for case reorganization
  function handleCaseDrop(event: CustomEvent) {
    const { draggedItem, targetZone } = event.detail;
    console.log(`Moving case ${draggedItem.id} to ${targetZone.id}`);
    // Implement case organization logic here
  }

  function exportCaseSummary() {
    const summary = {
      totalCases: cases.length,
      byStatus: cases.reduce((acc: any, case_: any) => {
        acc[case_.status || 'unknown'] = (acc[case_.status || 'unknown'] || 0) + 1;
        return acc;
      }, {}),
      recentActivity: recentCasesList,
      recommendations: caseRecommendations,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case-summary-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Advanced Case Management - WardenNet</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  <!-- Enhanced Header with Quick Actions -->
  <div class="bg-base-100 shadow-lg">
    <div class="container mx-auto p-4">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-3xl font-bold text-primary">Advanced Case Management</h1>
        <div class="flex gap-2">
          <button 
            class="btn btn-primary btn-sm"
            on:click={() => goto('/cases/new')}
          >
            📝 New Case
          </button>
          <button 
            class="btn btn-secondary btn-sm"
            on:click={exportCaseSummary}
          >
            📊 Export Summary
          </button>
          <button 
            class="btn btn-outline btn-sm"
            class:btn-active={showMergeMode}
            on:click={() => showMergeMode = !showMergeMode}
          >
            🔗 Merge Mode
          </button>
        </div>
      </div>

      <!-- Advanced Search and Filters -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="form-control">
          <input 
            type="text" 
            placeholder="🔍 Search cases with NLP..." 
            class="input input-bordered w-full"
            bind:value={searchTerm}
          />
        </div>
        <div class="form-control">
          <select class="select select-bordered w-full" bind:value={statusFilter}>
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div class="form-control">
          <select class="select select-bordered w-full" bind:value={sortBy}>
            <option value="recent">Most Recent</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="status">By Status</option>
            <option value="nlp_priority">NLP Priority</option>
          </select>
        </div>
        <div class="form-control">
          <select class="select select-bordered w-full" bind:value={viewMode}>
            <option value="enhanced">Enhanced View</option>
            <option value="simple">Simple View</option>
            <option value="merge">Merge Analysis</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="container mx-auto p-4">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      <!-- Sidebar with Recent Cases and Recommendations -->
      <div class="lg:col-span-1 space-y-6">
        
        <!-- Recent Cases Cache -->
        {#if showRecentCases && recentCasesList.length > 0}
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h3 class="card-title text-sm">📈 Recently Accessed</h3>
              <div class="space-y-2">
                {#each recentCasesList as recentCase}
                  <div 
                    class="p-2 bg-base-200 rounded cursor-pointer hover:bg-base-300 transition-colors"
                    on:click={() => openCaseInNew(recentCase.id)}
                  >
                    <div class="text-xs font-medium truncate">{recentCase.title}</div>
                    <div class="text-xs text-base-content/70">
                      Accessed {recentCase.accessCount} times
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- NLP Recommendations -->
        {#if showRecommendations && caseRecommendations.length > 0}
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h3 class="card-title text-sm">🤖 AI Recommendations</h3>
              <div class="space-y-3">
                {#each caseRecommendations as recommendation}
                  <div class="p-3 bg-base-200 rounded-lg">
                    <div class="text-xs font-medium mb-1">
                      {recommendation.type === 'new_case' ? '✨ Pick up on this case:' : '🔗 Related cases found:'}
                    </div>
                    <div class="text-sm mb-2">
                      <strong>Title:</strong> {recommendation.suggestedTitle || recommendation.pattern}
                    </div>
                    {#if recommendation.confidence}
                      <div class="text-xs text-base-content/70 mb-2">
                        Confidence: {Math.round(recommendation.confidence * 100)}%
                      </div>
                    {/if}
                    <button 
                      class="btn btn-xs btn-primary"
                      on:click={() => pickUpCase(recommendation)}
                    >
                      {recommendation.type === 'new_case' ? 'Create Case' : 'View Related'}
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Merge Mode Tools -->
        {#if showMergeMode}
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h3 class="card-title text-sm">🔗 Merge Operations</h3>
              <div class="space-y-2">
                <div class="text-xs text-base-content/70">
                  Selected: {selectedCases.length} cases
                </div>
                {#if selectedCases.length >= 2}
                  <button 
                    class="btn btn-warning btn-sm w-full"
                    on:click={mergeCases}
                  >
                    Merge Selected Cases
                  </button>
                {/if}
                <button 
                  class="btn btn-ghost btn-sm w-full"
                  on:click={() => selectedCases = []}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Main Cases List -->
      <div class="lg:col-span-3">
        
        <!-- Cases Grid/List -->
        <div class="grid grid-cols-1 {viewMode === 'simple' ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-4">
          {#each filteredCases as case_ (case_.id)}
            <div 
              class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-200 relative"
              class:ring-2={selectedCases.includes(case_.id)}
              class:ring-primary={selectedCases.includes(case_.id)}
            >
              
              <!-- Merge Mode Checkbox -->
              {#if showMergeMode}
                <div class="absolute top-2 left-2 z-10">
                  <input 
                    type="checkbox" 
                    class="checkbox checkbox-primary"
                    checked={selectedCases.includes(case_.id)}
                    on:change={() => toggleCaseSelection(case_.id)}
                  />
                </div>
              {/if}

              <div class="card-body p-4">
                
                <!-- Case Header -->
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="card-title text-base mb-1">
                      <a href="/cases/{case_.id}" class="link link-hover">
                        {case_.title}
                      </a>
                    </h3>
                    <div class="flex items-center gap-2 text-xs">
                      <span class="badge badge-sm {getStateColor(case_.data?.state || 'draft')}">
                        {getStateLabel(case_.data?.state || 'draft')}
                      </span>
                      {#if case_.data?.priority}
                        <span class="badge badge-sm badge-outline">
                          P{case_.data.priority}
                        </span>
                      {/if}
                    </div>
                  </div>
                  
                  <!-- Quick Actions -->
                  <div class="dropdown dropdown-end">
                    <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
                      ⋮
                    </div>
                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                      <li>
                        <button on:click={() => analyzeCaseRelationships(case_.id)}>
                          🔍 Analyze Relationships
                        </button>
                      </li>
                      <li>
                        <button on:click={() => getMergeSuggestions(case_.id)}>
                          🔗 Find Merge Candidates
                        </button>
                      </li>
                      <li>
                        <a href="/cases/{case_.id}/edit">✏️ Edit Case</a>
                      </li>
                      <li>
                        <button on:click={() => openCaseInNew(case_.id)}>
                          🪟 Open in New Tab
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Case Description Preview -->
                <p class="text-sm text-base-content/80 mb-3 line-clamp-3">
                  {case_.description.substring(0, 150)}
                  {case_.description.length > 150 ? '...' : ''}
                </p>

                <!-- Enhanced View Features -->
                {#if viewMode === 'enhanced'}
                  
                  <!-- Tags -->
                  {#if case_.data?.tags && case_.data.tags.length > 0}
                    <div class="flex flex-wrap gap-1 mb-2">
                      {#each case_.data.tags.slice(0, 3) as tag}
                        <span class="badge badge-xs badge-outline">{tag}</span>
                      {/each}
                      {#if case_.data.tags.length > 3}
                        <span class="badge badge-xs">+{case_.data.tags.length - 3}</span>
                      {/if}
                    </div>
                  {/if}

                  <!-- Recent Activity -->
                  {#if case_.recentActivity}
                    <div class="text-xs text-base-content/60 mb-2">
                      🕒 {case_.recentActivity}
                    </div>
                  {/if}

                  <!-- NLP Insights -->
                  {#if case_.nlpInsights}
                    <div class="bg-base-200 p-2 rounded text-xs mb-2">
                      <strong>AI Insights:</strong> {case_.nlpInsights.summary}
                    </div>
                  {/if}
                {/if}

                <!-- Case Metadata -->
                <div class="flex items-center justify-between text-xs text-base-content/60">
                  <span>
                    Created {new Date(case_.createdAt).toLocaleDateString()}
                  </span>
                  {#if case_.updatedAt && case_.updatedAt !== case_.createdAt}
                    <span>
                      Updated {new Date(case_.updatedAt).toLocaleDateString()}
                    </span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Empty State -->
        {#if filteredCases.length === 0}
          <div class="text-center py-12">
            <div class="text-6xl mb-4">📂</div>
            <h3 class="text-xl font-semibold mb-2">No cases found</h3>
            <p class="text-base-content/60 mb-4">
              {searchTerm ? `No cases match your search for "${searchTerm}"` : 'You haven\'t created any cases yet.'}
            </p>
            <button 
              class="btn btn-primary"
              on:click={() => goto('/cases/new')}
            >
              Create Your First Case
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Relationship Analyzer Modal -->
{#if showRelationshipAnalyzer && analyzingCaseId}
  <div class="modal modal-open">
    <div class="modal-box max-w-4xl">
      <h3 class="font-bold text-lg mb-4">Case Relationship Analysis</h3>
      
      <CaseRelationshipAnalyzer 
        caseId={analyzingCaseId}
        userId={$page.data.session?.user?.id}
        on:close={() => showRelationshipAnalyzer = false}
        on:merge={(event) => {
          showRelationshipAnalyzer = false;
          selectedCases = [analyzingCaseId, ...event.detail.relatedCaseIds];
          showMergeMode = true;
        }}
      />
      
      <div class="modal-action">
        <button class="btn" on:click={() => showRelationshipAnalyzer = false}>
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Merge Preview Modal -->
{#if mergePreview && showMergeMode}
  <div class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Merge Suggestions</h3>
      
      <div class="space-y-4">
        <div class="bg-base-200 p-4 rounded-lg">
          <h4 class="font-semibold">Target Case:</h4>
          <p>{mergePreview.targetCase.title}</p>
        </div>
        
        <div class="space-y-2">
          <h4 class="font-semibold">Suggested Merges:</h4>
          {#each mergePreview.suggestions as suggestion}
            <div class="bg-base-200 p-3 rounded flex items-center justify-between">
              <div>
                <div class="font-medium">{suggestion.case.title}</div>
                <div class="text-sm text-base-content/70">
                  Similarity: {Math.round(suggestion.similarity * 100)}%
                </div>
                <div class="text-xs">
                  {suggestion.reasons.join(', ')}
                </div>
              </div>
              <input 
                type="checkbox" 
                class="checkbox checkbox-primary"
                on:change={(e) => {
                  if (e.target.checked) {
                    selectedCases = [...selectedCases, suggestion.case.id];
                  } else {
                    selectedCases = selectedCases.filter(id => id !== suggestion.case.id);
                  }
                }}
              />
            </div>
          {/each}
        </div>
      </div>
      
      <div class="modal-action">
        <button 
          class="btn btn-primary"
          disabled={selectedCases.length < 2}
          on:click={mergeCases}
        >
          Merge Selected ({selectedCases.length})
        </button>
        <button class="btn" on:click={() => mergePreview = null}>
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
