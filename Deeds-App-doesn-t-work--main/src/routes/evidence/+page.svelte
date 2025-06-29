<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

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

  let files: File[] = [];
  const uploadProgress = writable(0);
  const summary = writable('');

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      files = Array.from(event.dataTransfer.files);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

svelte:head>
  <title>Evidence - WardenNet</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Evidence Management</h1>
    <a href="/evidence/upload" class="btn btn-primary">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
      </svg>
      Upload Evidence
    </a>
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
              {item.filename || 'Unknown File'}
              <div class="badge badge-secondary text-xs">{item.type || 'File'}</div>
            </h2>
            <p class="text-xs opacity-70">
              {item.description || 'No description'}
            </p>
            {#if item.thumbnail}
              <figure class="mt-2">
                <img src={item.thumbnail} alt={item.filename} class="w-full h-24 object-cover rounded" />
              </figure>
            {/if}
            <div class="text-xs opacity-60 mt-2">
              Uploaded: {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : 'Unknown'}
            </div>
            <div class="card-actions justify-end">
              <a href="/evidence/{item.id}" class="btn btn-primary btn-xs">View</a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

  async function uploadFiles() {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch('/api/evidence/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      summary.set(result.summary ?? 'Upload successful');
    } else {
      summary.set('Upload failed');
    }
  }
</script>

<div
  role="region"
  aria-label="Evidence drop area"
  on:dragover={handleDragOver}
  on:drop={handleDrop}
  style="border: 2px dashed #666; padding: 2rem; text-align: center;"
>
  Drag and drop evidence files here or click to select
</div>

<button on:click={uploadFiles}>Upload Files</button>

<p>{$summary}</p>