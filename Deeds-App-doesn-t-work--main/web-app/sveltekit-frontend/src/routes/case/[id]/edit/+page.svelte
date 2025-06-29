<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import type { Case } from '$lib/data/types';
  import { invoke } from '@tauri-apps/api/tauri';

  export let data: PageData;

  interface PageData {
    case: Case;
  }

  let caseItem: Case = data.case;

  async function handleUpdate() {
    try {
      await invoke('update_case', {
        id: caseItem.id,
        title: caseItem.title,
        description: caseItem.description,
        aiSummary: caseItem.aiSummary,
        status: caseItem.status,
        createdAt: caseItem.createdAt
      });
      alert('Case updated successfully!');
      await goto(`/case/${caseItem.id}`);
    } catch (error) {
      console.error('Error updating case:', error);
      alert(`Failed to update case: ${error}`);
    }
  }

  async function handleDelete() {
    if (!caseItem || !caseItem.id) return;

    if (confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      try {
        await invoke('delete_case', { id: caseItem.id });
        alert('Case deleted successfully!');
        goto('/'); // Redirect to home or cases list page
      } catch (error) {
        console.error('Error deleting case:', error);
        alert(`An error occurred while trying to delete the case: ${error}`);
      }
    }
  }
</script>

<svelte:head>
  <title>Edit Case: {caseItem.title} - WardenNet</title>
</svelte:head>
<div class="container mt-4 text-dark">
  <h1 class="mb-4 text-center text-primary">Edit Case: {caseItem.title}</h1>
  <form method="POST" use:enhance={handleUpdate}>
    <div class="mb-3">
      <label for="title" class="form-label">Case Title</label>
      <input type="text" class="form-control" id="title" name="title" bind:value={caseItem.title} required />
    </div>

    <div class="mb-3">
      <label for="aiSummary" class="form-label">AI Summary</label>
      <textarea class="form-control" id="aiSummary" name="aiSummary" bind:value={caseItem.aiSummary} rows="5"></textarea>
    </div>

    <div class="mb-3">
      <label for="status" class="form-label">Status</label>
      <select class="form-select" id="status" name="status" bind:value={caseItem.status}>
        <option value="Open">Open</option>
        <option value="Pending Court">Pending Court</option>
        <option value="Closed">Closed</option>
      </select>
    </div>

    <div class="mb-3">
      <label for="createdAt" class="form-label">Date Created</label>
      <input type="date" class="form-control" id="createdAt" name="createdAt" bind:value={caseItem.createdAt} required />
    </div>

    <div class="mb-3">
      <label for="description" class="form-label">Description</label>
      <textarea class="form-control" id="description" name="description" bind:value={caseItem.description} rows="5"></textarea>
    </div>

    <!-- Case management fields using valid schema properties -->
    <div class="mb-3">
      <label for="priority" class="form-label">Priority</label>
      <select class="form-select" id="priority" name="priority" bind:value={caseItem.priority}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>

    <div class="mb-3">
      <label for="category" class="form-label">Category</label>
      <input type="text" class="form-control" id="category" name="category" bind:value={caseItem.category} />
    </div>

    <div class="mb-3">
      <label for="dangerScore" class="form-label">Danger Score (0-100)</label>
      <input type="number" class="form-control" id="dangerScore" name="dangerScore" bind:value={caseItem.dangerScore} min="0" max="100" />
    </div>

    <div class="mb-3">
      <label for="location" class="form-label">Location</label>
      <input type="text" class="form-control" id="location" name="location" bind:value={caseItem.location} />
    </div>

    <div class="mb-3">
      <label for="jurisdiction" class="form-label">Jurisdiction</label>
      <input type="text" class="form-control" id="jurisdiction" name="jurisdiction" bind:value={caseItem.jurisdiction} />
    </div>

    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
      <button type="submit" class="btn btn-primary me-md-2">Update Case</button>
      <button type="button" on:click={handleDelete} class="btn btn-danger">Delete Case</button>
    </div>
  </form>
</div>

<style>
  /* No custom styles needed, using Bootstrap classes */
</style>