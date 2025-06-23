<script lang="ts">
  import { onMount } from 'svelte';
  
  let laws: any[] = [];
  let loading = true;
  let error: string | null = null;
  let searchQuery = '';
  
  onMount(async () => {
    try {
      const response = await fetch('/api/statutes');
      if (response.ok) {
        laws = await response.json();
      } else {
        error = 'Failed to load laws';
      }
    } catch (err) {
      error = 'Error loading laws';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  });
  
  $: filteredLaws = laws.filter(law => 
    law.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    law.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    law.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );
</script>

<svelte:head>
  <title>Law Database - WardenNet</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Law Database</h1>
    <a href="/law/add" class="btn btn-primary">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
      </svg>
      Add Statute
    </a>
  </div>

  <div class="mb-6">
    <div class="form-control">
      <label class="label" for="search">
        <span class="label-text">Search laws and statutes</span>
      </label>
      <input 
        type="text" 
        id="search"
        placeholder="Search by title, description, or code..." 
        class="input input-bordered w-full"
        bind:value={searchQuery}
      />
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="loading loading-spinner loading-lg"></div>
      <span class="ml-4">Loading laws...</span>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {:else if filteredLaws.length === 0}
    <div class="text-center py-12">
      <svg class="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h3 class="text-xl font-semibold text-gray-600 mb-2">No laws found</h3>
      <p class="text-gray-500 mb-4">
        {searchQuery ? 'No laws match your search criteria' : 'Start building your legal database'}
      </p>
      {#if !searchQuery}
        <a href="/law/add" class="btn btn-primary">Add First Statute</a>
      {/if}
    </div>
  {:else}
    <div class="space-y-4">
      {#each filteredLaws as law}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">
              {law.title || 'Untitled Law'}
              <div class="badge badge-secondary">{law.code || 'No Code'}</div>
            </h2>
            <p class="text-sm opacity-70">
              {law.description ? 
                (law.description.length > 200 ? 
                  law.description.substring(0, 200) + '...' : 
                  law.description) : 
                'No description available'}
            </p>
            {#if law.category}
              <div class="badge badge-outline">{law.category}</div>
            {/if}
            <div class="text-xs opacity-60 mt-2">
              Added: {law.createdAt ? new Date(law.createdAt).toLocaleDateString() : 'Unknown'}
            </div>
            <div class="card-actions justify-end">
              <a href="/law/{law.id}" class="btn btn-primary btn-sm">View Full Text</a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
