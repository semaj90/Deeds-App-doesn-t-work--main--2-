<script lang="ts">
    import type { PageData } from './$types';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import type { Statute } from '$lib/types';

    export let data: PageData;
    let statutesList: Statute[] = data.statutes;

    // Store for AI summaries and loading/error states
    let aiSummaries = writable<Record<string, { summary: string; loading: boolean; error: string | null }>>({});

    async function fetchAiSummary(statute: Statute) {
        aiSummaries.update((s) => ({
            ...s,
            [statute.id]: { summary: '', loading: true, error: null }
        }));
        try {
            // SSR: This is a client-side API call to SvelteKit endpoint, which proxies to Python NLP
            const res = await fetch('/api/nlp/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: statute.fullText || statute.description || '', contextType: 'statute', maxLength: 400, style: 'brief' })
            });
            const data = await res.json();
            if (res.ok && data.summary) {
                aiSummaries.update((s) => ({ ...s, [statute.id]: { summary: data.summary, loading: false, error: null } }));
            } else {
                aiSummaries.update((s) => ({ ...s, [statute.id]: { summary: '', loading: false, error: data.error || 'NLP error' } }));
            }
        } catch (e) {
            aiSummaries.update((s) => ({ ...s, [statute.id]: { summary: '', loading: false, error: 'Network error' } }));
        }
    }

    onMount(() => {
        statutesList.forEach(fetchAiSummary);
    });
</script>

<div class="container-fluid mt-4">
    <h1 class="mb-4 text-center">Statutes</h1>
    <!-- SSR: statutesList is provided by SvelteKit load function -->
    {#if statutesList.length > 0}
        <div class="row g-4">
            {#each statutesList as statute (statute.id)}
                <div class="col-12 col-md-6 col-lg-4 d-flex">
                    <div class="card flex-fill shadow-sm">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">{statute.title || 'Statute Name Placeholder'}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">Section: {statute.code || 'Section Placeholder'}</h6>
                            <p class="card-text">{statute.description || 'Statute description placeholder.'}</p>
                            <div class="ai-summary mt-3">
                                <h6 class="text-success">AI-Generated Summary:</h6>
                                <!-- API JSON request to /api/nlp/summarize -->
                                {#if $aiSummaries[statute.id]?.loading}
                                    <div class="spinner-border spinner-border-sm text-secondary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                {:else if $aiSummaries[statute.id]?.error}
                                    <div class="text-danger">{$aiSummaries[statute.id].error}</div>
                                {:else if $aiSummaries[statute.id]?.summary}
                                    <p class="fst-italic">{$aiSummaries[statute.id].summary}</p>
                                {:else}
                                    <div class="text-muted">No summary available.</div>
                                {/if}
                            </div>
                            <!-- SvelteKit component: link to detail page -->
                            <a href="/statutes/{statute.id}" class="btn btn-primary mt-3">View Details</a>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <p>No statutes found.</p>
    {/if}
</div>

<style>
    .container-fluid {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }
    .row.g-4 {
        row-gap: 2rem;
    }
    .card {
        min-height: 350px;
        display: flex;
        flex-direction: column;
        justify-content: stretch;
    }
    .card-title {
        font-size: 1.3rem;
        color: #007bff;
    }
    .ai-summary {
        margin-top: auto;
        padding-top: 15px;
        border-top: 1px dashed #eee;
    }
</style>