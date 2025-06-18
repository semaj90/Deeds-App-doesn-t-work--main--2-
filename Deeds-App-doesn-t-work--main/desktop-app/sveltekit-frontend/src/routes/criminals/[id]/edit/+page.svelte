<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import type { Criminal, Statute, Crime } from '$lib/data/types';
  import { invoke } from '@tauri-apps/api/tauri';

  export let data: PageData;

  let criminalItem: Criminal = data.criminal;
  let statutes: Statute[] = data.statutes;
  let criminalCrimes: Crime[] = data.criminalCrimes;

  let newCrimeName: string = '';
  let newCrimeDescription: string = '';
  let selectedStatuteId: number | undefined;

  async function handleUpdate() {
    try {
      await invoke('update_criminal', {
        id: criminalItem.id,
        firstName: criminalItem.firstName,
        lastName: criminalItem.lastName,
        dateOfBirth: criminalItem.dateOfBirth ? new Date(criminalItem.dateOfBirth).toISOString() : null,
        address: criminalItem.address || null,
        phone: criminalItem.phone || null,
        email: criminalItem.email || null,
        photoUrl: criminalItem.photoUrl || null,
        convictionStatus: criminalItem.convictionStatus || null,
        threatLevel: criminalItem.threatLevel || null,
        sentenceLength: criminalItem.sentenceLength || null,
        convictionDate: criminalItem.convictionDate ? new Date(criminalItem.convictionDate).toISOString() : null,
        escapeAttempts: criminalItem.escapeAttempts || 0,
        gangAffiliations: criminalItem.gangAffiliations || null,
        notes: criminalItem.notes || null
      });
      alert('Criminal updated successfully!');
      await goto(`/criminals/${criminalItem.id}`);
    } catch (error) {
      console.error('Error updating criminal:', error);
      alert(`Failed to update criminal: ${error}`);
    }
  }

  async function handleAddCrime() {
    if (!newCrimeName || selectedStatuteId === undefined) {
      alert('Please provide a crime name and select a statute.');
      return;
    }

    const formData = new FormData();
    formData.append('crimeName', newCrimeName);
    formData.append('crimeDescription', newCrimeDescription);
    formData.append('statuteId', selectedStatuteId.toString());

    try {
      const response = await fetch(`?/addCrime`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Crime added successfully!');
        // Refresh data or update local state
        const updatedData = await response.json(); // Assuming the server returns updated data
        criminalCrimes = [...criminalCrimes, updatedData.newCrime]; // Add the new crime to the list
        newCrimeName = '';
        newCrimeDescription = '';
        selectedStatuteId = undefined;
      } else {
        const errorData = await response.json();
        alert(`Failed to add crime: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding crime:', error);
      alert('An error occurred while trying to add the crime.');
    }
  }

  async function handleDelete() {
    if (!criminalItem || !criminalItem.id) return;

    if (confirm('Are you sure you want to delete this criminal? This action cannot be undone.')) {
      try {
        await invoke('delete_criminal', { id: criminalItem.id });
        alert('Criminal deleted successfully!');
        goto('/criminals'); // Redirect to criminals list page
      } catch (error) {
        console.error('Error deleting criminal:', error);
        alert(`An error occurred while trying to delete the criminal: ${error}`);
      }
    }
  }

  function getStatuteName(statuteId: number): string {
    const statute = statutes.find(s => s.id === statuteId);
    return statute ? statute.name : 'Unknown Statute';
  }
</script>

<svelte:head>
  <title>Edit Criminal: {criminalItem.firstName} {criminalItem.lastName} - WardenNet</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mt-4 text-dark">
  <h1 class="mb-4 text-center text-primary">Edit Criminal: {criminalItem.firstName} {criminalItem.lastName}</h1>
  <form method="POST" use:enhance={handleUpdate}>
    <div class="mb-3">
      <label for="firstName" class="form-label">First Name</label>
      <input type="text" class="form-control" id="firstName" name="firstName" bind:value={criminalItem.firstName} required />
    </div>

    <div class="mb-3">
      <label for="lastName" class="form-label">Last Name</label>
      <input type="text" class="form-control" id="lastName" name="lastName" bind:value={criminalItem.lastName} required />
    </div>

    <div class="mb-3">
      <label for="dateOfBirth" class="form-label">Date of Birth</label>
      <input type="date" class="form-control" id="dateOfBirth" name="dateOfBirth" bind:value={criminalItem.dateOfBirth} />
    </div>

    <div class="mb-3">
      <label for="address" class="form-label">Address</label>
      <textarea class="form-control" id="address" name="address" bind:value={criminalItem.address} rows="3"></textarea>
    </div>

    <div class="mb-3">
      <label for="phone" class="form-label">Phone</label>
      <input type="text" class="form-control" id="phone" name="phone" bind:value={criminalItem.phone} />
    </div>

    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input type="email" class="form-control" id="email" name="email" bind:value={criminalItem.email} />
    </div>

    <!-- New fields for criminal profile -->
    <div class="mb-3">
      <label for="photoUrl" class="form-label">Photo URL</label>
      <input type="text" class="form-control" id="photoUrl" name="photoUrl" bind:value={criminalItem.photoUrl} />
    </div>

    <div class="mb-3">
      <label for="convictionStatus" class="form-label">Conviction Status</label>
      <select class="form-select" id="convictionStatus" name="convictionStatus" bind:value={criminalItem.convictionStatus}>
        <option value="">Select Status</option>
        <option value="Convicted">Convicted</option>
        <option value="Awaiting Trial">Awaiting Trial</option>
        <option value="Escaped">Escaped</option>
        <option value="Released">Released</option>
      </select>
    </div>

    <div class="mb-3">
      <label for="threatLevel" class="form-label">Threat Level</label>
      <select class="form-select" id="threatLevel" name="threatLevel" bind:value={criminalItem.threatLevel}>
        <option value="">Select Level</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </div>

    <div class="mb-3">
      <label for="sentenceLength" class="form-label">Sentence Length</label>
      <input type="text" class="form-control" id="sentenceLength" name="sentenceLength" bind:value={criminalItem.sentenceLength} />
    </div>

    <div class="mb-3">
      <label for="convictionDate" class="form-label">Conviction Date</label>
      <input type="date" class="form-control" id="convictionDate" name="convictionDate" bind:value={criminalItem.convictionDate} />
    </div>

    <div class="mb-3">
      <label for="escapeAttempts" class="form-label">Escape Attempts</label>
      <input type="number" class="form-control" id="escapeAttempts" name="escapeAttempts" bind:value={criminalItem.escapeAttempts} />
    </div>

    <div class="mb-3">
      <label for="gangAffiliations" class="form-label">Gang Affiliations</label>
      <input type="text" class="form-control" id="gangAffiliations" name="gangAffiliations" bind:value={criminalItem.gangAffiliations} />
    </div>

    <div class="mb-3">
      <label for="notes" class="form-label">Notes</label>
      <textarea class="form-control" id="notes" name="notes" bind:value={criminalItem.notes} rows="5"></textarea>
    </div>

    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
      <button type="submit" class="btn btn-primary me-md-2">Update Criminal</button>
      <button type="button" on:click={handleDelete} class="btn btn-danger">Delete Criminal</button>
    </div>
  </form>

  <hr class="my-5">

  <h2 class="mb-4 text-dark">Crimes Associated with {criminalItem.firstName} {criminalItem.lastName}</h2>

  {#if criminalCrimes.length > 0}
    <ul class="list-group mb-4">
      {#each criminalCrimes as crime (crime.id)}
        <li class="list-group-item">
          <strong>{crime.name}</strong> ({getStatuteName(crime.statuteId)})
          {#if crime.description}
            <p class="text-muted mb-0">{crime.description}</p>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="text-dark">No crimes associated with this criminal yet.</p>
  {/if}

  <h3 class="mb-3 text-dark">Add New Crime</h3>
  <form on:submit|preventDefault={handleAddCrime} class="mb-5">
    <div class="mb-3">
      <label for="crimeName" class="form-label">Crime Name</label>
      <input type="text" class="form-control" id="crimeName" bind:value={newCrimeName} required />
    </div>
    <div class="mb-3">
      <label for="crimeDescription" class="form-label">Description (Optional)</label>
      <textarea class="form-control" id="crimeDescription" bind:value={newCrimeDescription} rows="3"></textarea>
    </div>
    <div class="mb-3">
      <label for="statuteSelect" class="form-label">Link to Statute</label>
      <select class="form-select" id="statuteSelect" bind:value={selectedStatuteId} required>
        <option value={undefined} disabled>Select a Statute</option>
        {#each statutes as statute}
          <option value={statute.id}>{statute.name} ({statute.sectionNumber})</option>
        {/each}
      </select>
    </div>
    <button type="submit" class="btn btn-success">Add Crime</button>
  </form>
</div>