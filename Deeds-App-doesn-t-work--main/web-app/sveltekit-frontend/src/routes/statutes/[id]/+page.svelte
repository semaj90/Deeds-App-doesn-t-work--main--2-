<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import type { Statute } from '$lib/types';

  export let data: PageData;
  // SSR: statute is provided by SvelteKit load function
  const statute: Statute = data.statute;

  // Store for AI summary
  let aiSummary = writable<{ summary: string; loading: boolean; error: string | null }>({ summary: '', loading: true, error: null });

  async function fetchAiSummary() {
    aiSummary.set({ summary: '', loading: true, error: null });
    try {
      // API JSON request to SvelteKit endpoint
      const res = await fetch('/api/nlp/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: statute.fullText || statute.description || '', contextType: 'statute', maxLength: 400, style: 'brief' })
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        aiSummary.set({ summary: data.summary, loading: false, error: null });
      } else {
        aiSummary.set({ summary: '', loading: false, error: data.error || 'NLP error' });
      }
    } catch (e) {
      aiSummary.set({ summary: '', loading: false, error: 'Network error' });
    }
  }

  onMount(fetchAiSummary);
</script>

<div class="container-fluid mt-4">
  <div class="row justify-content-center">
    <div class="col-12 col-md-10 col-lg-8">
      <div class="card shadow-sm">
        <div class="card-body">
          <h2 class="card-title">{statute.title || 'Statute Name Placeholder'}</h2>
          <h6 class="card-subtitle mb-2 text-muted">Section: {statute.code || 'Section Placeholder'}</h6>
          <p class="card-text">{statute.fullText || statute.description || 'Statute content placeholder.'}</p>
          <div class="ai-summary mt-3">
            <h6 class="text-success">AI-Generated Summary:</h6>
            <!-- API JSON request to /api/nlp/summarize -->
            {#if $aiSummary.loading}
              <div class="spinner-border spinner-border-sm text-secondary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            {:else if $aiSummary.error}
              <div class="text-danger">{$aiSummary.error}</div>
            {:else if $aiSummary.summary}
              <p class="fst-italic">{$aiSummary.summary}</p>
            {:else}
              <div class="text-muted">No summary available.</div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- SSR: data.statute is provided by SvelteKit load function in +page.server.ts -->

<style>
  .container-fluid {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }
  .card-title {
    font-size: 1.5rem;
    color: #007bff;
  }
  .ai-summary {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px dashed #eee;
  }
</style>