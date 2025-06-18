<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import CaseCard from '$lib/components/+CaseCard.svelte';
    import type { PageData } from './$types';
    import { userSessionStore } from '$lib/auth/userStore';

    export let data: PageData;

    $: session = userSessionStore; // Assign the store to a reactive declaration

</script>

<div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <div class="flex gap-4">
            <a href="/cases/new" class="btn btn-primary">New Case</a>
            <a href="/criminals/new" class="btn btn-secondary">New POI</a>
        </div>
    </div>

    {#if $session?.user}
        <p class="mb-4">Welcome, {$session.user.name}!</p>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Recent Cases -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title">Recent Cases</h2>
                {#if data.recentCases?.length}
                    <div class="grid gap-4">
                        {#each data.recentCases as caseItem}
                            <CaseCard {caseItem} />
                        {/each}
                    </div>
                {:else}
                    <p>No recent cases.</p>
                {/if}
            </div>
        </div>

        <!-- Recent POIs -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title">Recent POIs</h2>
                {#if data.recentCriminals?.length}
                    <div class="masonry-grid">
                        {#each data.recentCriminals as criminal}
                            <div class="criminal-card">
                                {#if criminal.photoUrl}
                                    <img src={criminal.photoUrl} alt={`${criminal.firstName} ${criminal.lastName}`} class="w-full h-auto object-cover rounded-t-lg" />
                                {/if}
                                <div class="criminal-info p-4">
                                    <h3 class="text-lg font-semibold">{criminal.firstName} {criminal.lastName}</h3>
                                    <p class="text-sm text-gray-600">{criminal.status}</p>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p>No recent POIs.</p>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .masonry-grid {
        columns: 2 200px;
        column-gap: 1rem;
    }

    .criminal-card {
        break-inside: avoid;
        margin-bottom: 1rem;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .criminal-card img {
        width: 100%;
        height: auto;
        object-fit: cover;
    }

    .criminal-info {
        padding: 1rem;
    }
</style>