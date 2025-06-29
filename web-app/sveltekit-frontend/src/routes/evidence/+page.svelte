<script lang="ts">
  import { onMount } from 'svelte';
  
  let evidence: any[] = [];
  let loading = true;
  let error: string | null = null;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/evidence');
      if (response.ok) {
        evidence = await response.json();
      } else {
        error = 'Failed to load evidence';
      }
    } catch (err) {
      error = 'Error loading evidence';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Evidence - WardenNet</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Evidence Management</h1>
    <div class="flex gap-3">
      <a href="/evidence/hash" class="btn btn-outline">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Hash Verification
      </a>
      <a href="/evidence/upload" class="btn btn-primary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        Upload Evidence
      </a>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="loading loading-spinner loading-lg"></div>
      <span class="ml-4">Loading evidence...</span>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {:else if evidence.length === 0}
    <div class="text-center py-12">
      <svg class="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
      </svg>
      <h3 class="text-xl font-semibold text-gray-600 mb-2">No evidence found</h3>
      <p class="text-gray-500 mb-4">Upload files, documents, and digital evidence</p>
      <a href="/evidence/upload" class="btn btn-primary">Upload Evidence</a>
    </div>
  {:else}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each evidence as item}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">
              {item.filename || item.fileName || 'Unknown File'}
              <div class="badge badge-secondary text-xs">{item.type || 'File'}</div>
            </h2>
            <p class="text-xs opacity-70">
              {item.description || 'No description'}
            </p>
            {#if item.thumbnail}
              <figure class="mt-2">
                <img src={item.thumbnail} alt={item.filename || item.fileName} class="w-full h-24 object-cover rounded" />
              </figure>
            {/if}
            
            <!-- Hash Status -->
            <div class="flex items-center gap-2 mt-2">
              {#if item.hash}
                <div class="badge badge-success badge-xs">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Hash Verified
                </div>
              {:else}
                <div class="badge badge-warning badge-xs">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  No Hash
                </div>
              {/if}
              {#if item.hash}
                <code class="text-xs opacity-60 font-mono">{item.hash.substring(0, 8)}...</code>
              {/if}
            </div>
            
            <div class="text-xs opacity-60 mt-2">
              Uploaded: {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : 'Unknown'}
            </div>
            <div class="card-actions justify-end">
              {#if item.hash}
                <a href="/evidence/hash?hash={item.hash}" class="btn btn-ghost btn-xs">Verify</a>
              {/if}
              <a href="/evidence/{item.id}" class="btn btn-primary btn-xs">View</a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
