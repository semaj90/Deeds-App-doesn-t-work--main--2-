<script lang="ts">
  import Card from '$ui/components/Card.svelte';
  import Button from '$ui/components/Button.svelte';
  import type { Case } from '$lib/data/types';

  export let caseItem: Case;

</script>

<Card class="h-100 shadow-sm">
  <div slot="header">
    <h5 class="card-title text-primary">{caseItem.title}</h5>
    {#if caseItem.createdAt}
      <p class="card-text text-muted mb-2"><small>Created: {new Date(caseItem.createdAt).toLocaleDateString()}</small></p>
    {/if}
  </div>
  <div>
    <p class="card-text flex-grow-1">{caseItem.description ? caseItem.description.substring(0, 100) : 'No description.'}{caseItem.description && caseItem.description.length > 100 ? '...' : ''}</p>
    <Button variant="outline" class="mt-auto" href={`/case/${caseItem.id}`} ariaLabel={`View details for ${caseItem.title}`}>View Details &rarr;</Button>
  </div>
</Card>
