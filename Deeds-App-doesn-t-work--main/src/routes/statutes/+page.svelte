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

<div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Statutes</h1>

    {#if statutes.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each statutes as statute (statute.id)}
                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h2 class="card-title text-primary">{statute.name}</h2>
                        <p><strong>Section:</strong> {statute.sectionNumber}</p>
                        <p>{statute.description}</p>

                        <div class="mt-4 pt-4 border-t border-dashed border-base-200">
                            <h4 class="text-lg font-semibold text-success mb-2">AI-Generated Summary:</h4>
                            <p class="text-sm text-gray-600 italic">{getAiSummary(statute.id)}</p>
                        </div>
                        <div class="card-actions justify-end mt-4">
                            <a href="/statutes/{statute.id}" class="btn btn-primary">View Details</a>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <p class="text-gray-600">No statutes found.</p>
    {/if}
</div>