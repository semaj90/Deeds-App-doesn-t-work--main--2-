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

<div class="container mx-auto p-4">
  <div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
    <div class="card-body">
      <h2 class="card-title text-2xl font-bold mb-6 text-center">Add New Statute</h2>
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="form-control">
          <label for="code" class="label">
            <span class="label-text">Code</span>
          </label>
          <input type="text" class="input input-bordered w-full" id="code" bind:value={code} required />
        </div>
        <div class="form-control">
          <label for="title" class="label">
            <span class="label-text">Title</span>
          </label>
          <input type="text" class="input input-bordered w-full" id="title" bind:value={title} required />
        </div>
        <div class="form-control">
          <label for="description" class="label">
            <span class="label-text">Description</span>
          </label>
          <textarea class="textarea textarea-bordered h-24" id="description" bind:value={description}></textarea>
        </div>
        <div class="form-control">
          <label for="tags" class="label">
            <span class="label-text">Tags (comma-separated)</span>
          </label>
          <input type="text" class="input input-bordered w-full" id="tags" bind:value={tagsInput} placeholder="e.g., homicide, juvenile, felony" />
        </div>
        <div class="form-control">
          <label for="aiSummary" class="label">
            <span class="label-text">AI Summary</span>
          </label>
          <textarea class="textarea textarea-bordered h-32" id="aiSummary" bind:value={aiSummary}></textarea>
        </div>
        <div class="form-control mt-6">
          <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
            {#if isSubmitting}
              <span class="loading loading-spinner loading-sm"></span>
              Adding...
            {:else}
              Add Statute
            {/if}
          </button>
        </div>
        {#if formMessage}
          <div class="mt-4 alert {formMessage.startsWith('Error') ? 'alert-error' : 'alert-success'}">
            {formMessage}
          </div>
        {/if}
      </form>
    </div>
  </div>
</div>