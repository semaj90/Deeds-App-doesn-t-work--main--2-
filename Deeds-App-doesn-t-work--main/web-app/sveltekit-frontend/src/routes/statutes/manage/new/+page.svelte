<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let code = '';
  let title = '';
  let description = '';
  let tagsInput = ''; // Comma-separated string for tags
  let aiSummary = '';
  let formMessage = '';
  let isSubmitting = false;

  // Handle form submission
  async function handleSubmit() {
    isSubmitting = true;
    formMessage = '';

    const formData = new FormData();
    formData.append('code', code);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tagsInput); // Send as string, parse on server
    formData.append('aiSummary', aiSummary);

    const response = await fetch('/statutes/manage/new', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      formMessage = 'Statute added successfully!';
      // Clear form
      code = '';
      title = '';
      description = '';
      tagsInput = '';
      aiSummary = '';
    } else {
      const errorData = await response.json();
      formMessage = `Error: ${errorData.message || 'Failed to add statute.'}`;
    }
    isSubmitting = false;
  }
</script>

<div class="container mt-4">
  <div class="card bg-dark text-white">
    <div class="card-header">
      <h2 class="mb-0">Add New Statute</h2>
    </div>
    <div class="card-body">
      <form on:submit|preventDefault={handleSubmit}>
        <div class="mb-3">
          <label for="code" class="form-label">Code</label>
          <input type="text" class="form-control bg-secondary text-white border-dark" id="code" bind:value={code} required />
        </div>
        <div class="mb-3">
          <label for="title" class="form-label">Title</label>
          <input type="text" class="form-control bg-secondary text-white border-dark" id="title" bind:value={title} required />
        </div>
        <div class="mb-3">
          <label for="description" class="form-label">Description</label>
          <textarea class="form-control bg-secondary text-white border-dark" id="description" rows="3" bind:value={description}></textarea>
        </div>
        <div class="mb-3">
          <label for="tags" class="form-label">Tags (comma-separated)</label>
          <input type="text" class="form-control bg-secondary text-white border-dark" id="tags" bind:value={tagsInput} placeholder="e.g., homicide, juvenile, felony" />
        </div>
        <div class="mb-3">
          <label for="aiSummary" class="form-label">AI Summary</label>
          <textarea class="form-control bg-secondary text-white border-dark" id="aiSummary" rows="5" bind:value={aiSummary}></textarea>
        </div>
        <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
          {#if isSubmitting}
            Adding...
          {:else}
            Add Statute
          {/if}
        </button>
        {#if formMessage}
          <p class="mt-3 text-info">{formMessage}</p>
        {/if}
      </form>
    </div>
  </div>
</div>

<style>
  .card {
    max-width: 600px;
    margin: 0 auto;
  }
</style>