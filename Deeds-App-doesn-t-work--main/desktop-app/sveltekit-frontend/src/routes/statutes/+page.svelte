<script lang="ts">
    import type { PageData } from './$types';
    import type { Statute } from '$lib/server/db/schema';

    export let data: PageData;

    let statutes: Statute[] = data.statutes;

    // Placeholder for AI-generated summaries
    // In a real application, this would involve fetching from an API
    // or a reactive store that gets updated with AI summaries.
    function getAiSummary(statuteId: number): string {
        // This is a mock function. In a real scenario, you'd fetch this from an AI service.
        // For now, it returns a generic placeholder.
        return `AI-generated summary for statute ID ${statuteId}: This statute broadly covers legal principles related to... [More detailed summary here]`;
    }
</script>

<div class="container mt-4">
    <h1 class="mb-4">Statutes</h1>

    {#if statutes.length > 0}
        <div class="statutes-list">
            {#each statutes as statute (statute.id)}
                <div class="statute-card">
                    <h2>{statute.name}</h2>
                    <p><strong>Section:</strong> {statute.sectionNumber}</p>
                    <p>{statute.description}</p>
                    
                    <div class="ai-summary">
                        <h4>AI-Generated Summary:</h4>
                        <p>{getAiSummary(statute.id)}</p>
                    </div>
                    <a href="/statutes/{statute.id}" class="btn btn-primary mt-3">View Details</a>
                </div>
            {/each}
        </div>
    {:else}
        <p>No statutes found.</p>
    {/if}
</div>

<style>
    .container {
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
    }

    h1 {
        color: #333;
        text-align: center;
        margin-bottom: 30px;
    }

    .statutes-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .statute-card {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 20px;
        display: flex;
        flex-direction: column;
    }

    .statute-card h2 {
        font-size: 1.5rem;
        color: #007bff;
        margin-bottom: 10px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }

    .statute-card p {
        font-size: 1rem;
        color: #555;
        line-height: 1.6;
        margin-bottom: 10px;
    }

    .statute-card p strong {
        color: #333;
    }

    .ai-summary {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px dashed #eee;
    }

    .ai-summary h4 {
        font-size: 1.1rem;
        color: #28a745; /* Green color for AI summary */
        margin-bottom: 5px;
    }

    .ai-summary p {
        font-size: 0.9rem;
        color: #666;
        font-style: italic;
    }
</style>