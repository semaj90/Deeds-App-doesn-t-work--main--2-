<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { invoke } from '@tauri-apps/api/tauri';

  let firstName = '';
  let lastName = '';
  let dateOfBirth = '';
  let address = '';
  let phone = '';
  let email = '';
let photoUrl = '';
let convictionStatus = '';
let threatLevel = '';
let sentenceLength = '';
let convictionDate = '';
let escapeAttempts = 0;
let gangAffiliations = '';
let notes = '';

async function handleSubmit() {
  try {
    await invoke('create_criminal', {
      firstName,
      lastName,
      dateOfBirth: dateOfBirth || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      photoUrl: photoUrl || null,
      convictionStatus: convictionStatus || null,
      threatLevel: threatLevel || null,
      sentenceLength: sentenceLength || null,
      convictionDate: convictionDate || null,
      escapeAttempts: escapeAttempts || 0,
      gangAffiliations: gangAffiliations || null,
      notes: notes || null
    });
    alert('Criminal created successfully!');
    await goto('/criminals'); // Navigate back to the criminals list page
  } catch (error) {
    console.error('Error creating criminal:', error);
    alert(`Failed to create criminal: ${error}`);
  }
}
</script>

<svelte:head>
<title>New Criminal - WardenNet</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mt-4 text-dark">
  <h1 class="mb-4 text-center text-primary">Add New Criminal</h1>
  <form method="POST" use:enhance={handleSubmit}>
    <div class="mb-3">
      <label for="firstName" class="form-label">First Name</label>
      <input type="text" class="form-control" id="firstName" name="firstName" bind:value={firstName} required />
    </div>

    <div class="mb-3">
      <label for="lastName" class="form-label">Last Name</label>
      <input type="text" class="form-control" id="lastName" name="lastName" bind:value={lastName} required />
    </div>

    <div class="mb-3">
      <label for="dateOfBirth" class="form-label">Date of Birth</label>
      <input type="date" class="form-control" id="dateOfBirth" name="dateOfBirth" bind:value={dateOfBirth} />
    </div>

    <div class="mb-3">
      <label for="address" class="form-label">Address</label>
      <textarea class="form-control" id="address" name="address" bind:value={address} rows="3"></textarea>
    </div>

    <div class="mb-3">
      <label for="phone" class="form-label">Phone</label>
      <input type="text" class="form-control" id="phone" name="phone" bind:value={phone} />
    </div>

    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input type="email" class="form-control" id="email" name="email" bind:value={email} />
    </div>

    <!-- New fields for criminal profile -->
    <div class="mb-3">
      <label for="photoUrl" class="form-label">Photo URL</label>
      <input type="text" class="form-control" id="photoUrl" name="photoUrl" bind:value={photoUrl} />
    </div>

    <div class="mb-3">
      <label for="convictionStatus" class="form-label">Conviction Status</label>
      <select class="form-select" id="convictionStatus" name="convictionStatus" bind:value={convictionStatus}>
        <option value="">Select Status</option>
        <option value="Convicted">Convicted</option>
        <option value="Awaiting Trial">Awaiting Trial</option>
        <option value="Escaped">Escaped</option>
        <option value="Released">Released</option>
      </select>
    </div>

    <div class="mb-3">
      <label for="threatLevel" class="form-label">Threat Level</label>
      <select class="form-select" id="threatLevel" name="threatLevel" bind:value={threatLevel}>
        <option value="">Select Level</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </div>

    <div class="mb-3">
      <label for="sentenceLength" class="form-label">Sentence Length</label>
      <input type="text" class="form-control" id="sentenceLength" name="sentenceLength" bind:value={sentenceLength} />
    </div>

    <div class="mb-3">
      <label for="convictionDate" class="form-label">Conviction Date</label>
      <input type="date" class="form-control" id="convictionDate" name="convictionDate" bind:value={convictionDate} />
    </div>

    <div class="mb-3">
      <label for="escapeAttempts" class="form-label">Escape Attempts</label>
      <input type="number" class="form-control" id="escapeAttempts" name="escapeAttempts" bind:value={escapeAttempts} />
    </div>

    <div class="mb-3">
      <label for="gangAffiliations" class="form-label">Gang Affiliations</label>
      <input type="text" class="form-control" id="gangAffiliations" name="gangAffiliations" bind:value={gangAffiliations} />
    </div>

    <div class="mb-3">
      <label for="notes" class="form-label">Notes</label>
      <textarea class="form-control" id="notes" name="notes" bind:value={notes} rows="5"></textarea>
    </div>

    <button type="submit" class="btn btn-primary w-100">Add Criminal</button>
  </form>
</div>