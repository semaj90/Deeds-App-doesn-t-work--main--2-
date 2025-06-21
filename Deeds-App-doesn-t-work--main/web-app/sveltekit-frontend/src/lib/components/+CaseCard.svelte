<script lang="ts">
  import type { Case, Book } from '$lib/data/types';

  export let caseItem: Case;

</script>

<div class="card h-100 shadow-sm">
  <div class="card-body d-flex flex-column">
    <h5 class="card-title text-primary">{caseItem.title}</h5>
    {#if caseItem.createdAt}
      <p class="card-text text-muted mb-2"><small>Created: {new Date(caseItem.createdAt).toLocaleDateString()}</small></p>
    {/if}
    <p class="card-text flex-grow-1">{caseItem.description ? caseItem.description.substring(0, 100) : 'No description.'}{caseItem.description && caseItem.description.length > 100 ? '...' : ''}</p>
    <!-- Case Books Feature -->
    <div class="mt-2">
      <h6>Case Books</h6>
      {#if caseItem.books && caseItem.books.length > 0}
        <ul class="list-group list-group-flush mb-2">
          {#each caseItem.books as book}
            <li class="list-group-item px-0 py-1">
              <strong>{book.title}</strong>{book.author ? ` by ${book.author}` : ''}
              {#if book.publishedAt}
                <span class="text-muted small ms-2">({book.publishedAt})</span>
              {/if}
              {#if book.description}
                <div class="small text-muted">{book.description}</div>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <div class="text-muted small">No books linked.</div>
      {/if}
      <!-- TODO: Add UI to add/remove books when backend is ready -->
    </div>
    <a href="/case/{caseItem.id}" class="btn btn-outline-primary mt-auto" aria-label="View details for {caseItem.title}">View Details &rarr;</a>
  </div>
</div>
