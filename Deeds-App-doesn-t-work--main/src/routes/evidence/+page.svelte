<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

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