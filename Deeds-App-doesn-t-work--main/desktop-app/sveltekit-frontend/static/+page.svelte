<script lang="js">
  import { page } from '$app/stores';
  import { getCaseById } from '$lib/data/cases.js';

  $: caseItem = getCaseById($page.params.caseId);

  function getStatusClass(status) {
    if (status === 'Open') return 'badge-open';
    if (status === 'Closed') return 'badge-closed';
    if (status === 'Pending Court') return 'badge-pending';
    return 'badge-secondary';
  }
</script>

<svelte:head>
  <title>{caseItem ? caseItem.title : 'Case Not Found'} - Prosecutor's App</title>
</svelte:head>

{#if caseItem}
  <div class="case-detail">
    <div class="case-detail-header">
      <h2>{caseItem.title}</h2>
      <p>
        Status: <span class="badge {getStatusClass(caseItem.status)}">{caseItem.status}</span>
        {#if caseItem.dateOpened}
          <span style="margin-left: 1em;">Date Opened: {caseItem.dateOpened}</span>
        {/if}
      </p>
    </div>

    <section class="case-detail-section">
      <h3>Case Summary</h3>
      <p>{caseItem.summary}</p>
    </section>

    {#if caseItem.defendant}
    <section class="case-detail-section">
      <h3>Defendant</h3>
      <div class="profile-pic-item">
        {#if caseItem.defendant.profilePictureUrl}
          <img src="{caseItem.defendant.profilePictureUrl}" alt="Profile of {caseItem.defendant.name}" />
        {/if}
        <strong>{caseItem.defendant.name}</strong>
      </div>
      {#if caseItem.defendant.details}
        <p>{caseItem.defendant.details}</p>
      {/if}
    </section>
    {/if}

    {#if caseItem.victim}
    <section class="case-detail-section">
      <h3>Victim / Complainant</h3>
       <div class="profile-pic-item">
        {#if caseItem.victim.profilePictureUrl}
          <img src="{caseItem.victim.profilePictureUrl}" alt="Profile/Logo for {caseItem.victim.name}" />
        {/if}
        <strong>{caseItem.victim.name}</strong>
        {#if caseItem.victim.representative}(Rep: {caseItem.victim.representative}){/if}
      </div>
    </section>
    {/if}

    <section class="case-detail-section">
      <h3>Evidence</h3>
      {#if caseItem.evidence && caseItem.evidence.length > 0}
        {#each caseItem.evidence as ev (ev.id)}
          <div class="evidence-item">
            {#if ev.type === 'Photo' && ev.fileUrl}
              <img src="{ev.fileUrl}" alt="{ev.description}" />
            {/if}
            <strong>{ev.type}:</strong> {ev.description}
            {#if ev.notes}<p><small>Notes: {ev.notes}</small></p>{/if}
            {#if ev.dateCollected}<p><small>Collected: {ev.dateCollected}</small></p>{/if}
            {#if ev.type === 'Document' && ev.fileUrl !== '#'} <a href="{ev.fileUrl}" target="_blank" rel="noopener noreferrer">View Document</a>{/if}
          </div>
        {/each}
      {:else}
        <p>No evidence logged for this case yet.</p>
      {/if}
    </section>

    {#if caseItem.notes}
    <section class="case-detail-section">
      <h3>Prosecutor's Notes</h3>
      <p>{caseItem.notes}</p>
    </section>
    {/if}

  </div>
{:else}
  <p>Case not found. Please check the ID or return to the <a href="/">dashboard</a>.</p>
{/if}