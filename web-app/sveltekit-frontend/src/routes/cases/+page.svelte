<script lang="ts">
  import { onMount } from 'svelte';
  
  let cases: any[] = [];
  let loading = true;
  let error: string | null = null;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/cases');
      if (response.ok) {
        cases = await response.json();
      } else {
        error = 'Failed to load cases';
      }
    } catch (err) {
      error = 'Error loading cases';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Cases - WardenNet</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Cases</h1>
    <a href="/cases/new" class="btn btn-primary">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
      </svg>
      New Case
    </a>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="loading loading-spinner loading-lg"></div>
      <span class="ml-4">Loading cases...</span>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {:else if cases.length === 0}
    <div class="text-center py-12">
      <svg class="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h3 class="text-xl font-semibold text-gray-600 mb-2">No cases found</h3>
      <p class="text-gray-500 mb-4">Get started by creating your first case</p>
      <a href="/cases/new" class="btn btn-primary">Create Case</a>
    </div>
  {:else}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each cases as caseItem}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">
              {caseItem.title || 'Untitled Case'}
              <div class="badge badge-secondary">{caseItem.status || 'Open'}</div>
            </h2>
            <p class="text-sm opacity-70">
              {caseItem.description ? 
                (caseItem.description.length > 100 ? 
                  caseItem.description.substring(0, 100) + '...' : 
                  caseItem.description) : 
                'No description available'}
            </p>
            <div class="text-xs opacity-60 mt-2">
              Created: {caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString() : 'Unknown'}
            </div>
            <div class="card-actions justify-end">
              <a href="/cases/{caseItem.id}" class="btn btn-primary btn-sm">View Details</a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
