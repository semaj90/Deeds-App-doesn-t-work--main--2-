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
        name: caseItem.name,
        description: caseItem.description,
        title: caseItem.title,
        summary: caseItem.summary,
        status: caseItem.status,
        dateOpened: caseItem.dateOpened
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
  <title>Edit Case: {caseItem.name} - WardenNet</title>
</svelte:head>
<div class="container mt-4 text-dark">
  <h1 class="mb-4 text-center text-primary">Edit Case: {caseItem.name}</h1>
  <form method="POST" use:enhance={handleUpdate}>
    <div class="mb-3">
      <label for="name" class="form-label">Case Name</label>
      <input type="text" class="form-control" id="name" name="name" bind:value={caseItem.name} required />
    </div>

    <div class="mb-3">
      <label for="title" class="form-label">Case Title</label>
      <input type="text" class="form-control" id="title" name="title" bind:value={caseItem.title} required />
    </div>

    <div class="mb-3">
      <label for="summary" class="form-label">Summary</label>
      <textarea class="form-control" id="summary" name="summary" bind:value={caseItem.summary} rows="5"></textarea>
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
      <label for="dateOpened" class="form-label">Date Opened</label>
      <input type="date" class="form-control" id="dateOpened" name="dateOpened" bind:value={caseItem.dateOpened} required />
    </div>

    <div class="mb-3">
      <label for="description" class="form-label">Description</label>
      <textarea class="form-control" id="description" name="description" bind:value={caseItem.description} rows="5"></textarea>
    </div>

    <!-- New fields for case management -->
    <div class="mb-3">
      <label for="verdict" class="form-label">Verdict</label>
      <select class="form-select" id="verdict" name="verdict" bind:value={caseItem.verdict}>
        <option value="">Select Verdict</option>
        <option value="Guilty">Guilty</option>
        <option value="Not Guilty">Not Guilty</option>
        <option value="Pending">Pending</option>
      </select>
    </div>

    <div class="mb-3">
      <label for="courtDates" class="form-label">Court Dates (comma-separated)</label>
      <input type="text" class="form-control" id="courtDates" name="courtDates" bind:value={caseItem.courtDates} />
    </div>

    <div class="mb-3">
      <label for="linkedCriminals" class="form-label">Linked Criminals (comma-separated IDs)</label>
      <input type="text" class="form-control" id="linkedCriminals" name="linkedCriminals" bind:value={caseItem.linkedCriminals} />
    </div>

    <div class="mb-3">
      <label for="linkedCrimes" class="form-label">Linked Crimes (comma-separated IDs)</label>
      <input type="text" class="form-control" id="linkedCrimes" name="linkedCrimes" bind:value={caseItem.linkedCrimes} />
    </div>

    <div class="mb-3">
      <label for="notes" class="form-label">Notes</label>
      <textarea class="form-control" id="notes" name="notes" bind:value={caseItem.notes} rows="5"></textarea>
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