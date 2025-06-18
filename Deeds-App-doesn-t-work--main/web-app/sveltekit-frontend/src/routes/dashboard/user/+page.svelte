<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  export let data: any;
  let user = $page.data.session?.user;
  let cases = data?.cases || [];
  let searchTerm = '';
  let filteredCases = cases;

  const dispatch = createEventDispatcher();

  function handleSearch() {
    if (!searchTerm) {
      filteredCases = cases;
    } else {
      filteredCases = cases.filter((c: any) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }

  function createCase() {
    goto('/cases/new');
  }

  function editCase(id: string) {
    goto(`/case/${id}/edit`);
  }

  function viewCase(id: string) {
    goto(`/case/${id}`);
  }
</script>

<div class="container mt-5">
  <h2>Welcome, {user?.name || user?.email}!</h2>
  <div class="mb-4">
    <button class="btn btn-success" on:click={createCase}>Create New Case</button>
  </div>
  <div class="mb-3">
    <input type="text" class="form-control" placeholder="Search cases..." bind:value={searchTerm} on:input={handleSearch} />
  </div>
  <div class="table-responsive">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Title</th>
          <th>Description</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredCases as caseItem}
          <tr>
            <td>{caseItem.title}</td>
            <td>{caseItem.description}</td>
            <td>{caseItem.status}</td>
            <td>{caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString() : 'N/A'}</td>
            <td>
              <button class="btn btn-primary btn-sm me-2" on:click={() => viewCase(caseItem.id)}>View</button>
              <button class="btn btn-warning btn-sm me-2" on:click={() => editCase(caseItem.id)}>Edit</button>
              <!-- Add delete button if needed -->
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
.container {
  max-width: 900px;
}
</style>
