<script lang="ts">
    import Header from '$lib/components/+Header.svelte';
    import type { Criminal } from '$lib/data/types';

    // Explicitly define PageData type to resolve TypeScript errors
    interface PageData {
        userId: string;
        username: string;
        criminals: Criminal[];
        currentPage: number;
        limit: number;
        totalCriminals: number;
        searchTerm: string;
    }

    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    export let data: PageData;

    let criminals = data.criminals;
    let currentPage = data.currentPage;
    let limit = data.limit;
    let totalCriminals = data.totalCriminals;
    let searchTerm = data.searchTerm;

    let pages = Math.ceil(totalCriminals / limit);

    function updateUrl() {
        const url = new URL($page.url);
        url.searchParams.set('page', currentPage.toString());
        url.searchParams.set('limit', limit.toString());
        if (searchTerm) {
            url.searchParams.set('search', searchTerm);
        } else {
            url.searchParams.delete('search');
        }
        goto(url.toString());
    }

    function goToPage(pageNumber: number) {
        currentPage = pageNumber;
        updateUrl();
    }

    function nextPage() {
        if (currentPage < pages) {
            currentPage++;
            updateUrl();
        }
    }

    function prevPage() {
        if (currentPage > 1) {
            currentPage--;
            updateUrl();
        }
    }

    function handleSearch() {
        currentPage = 1; // Reset to first page on new search
        updateUrl();
    }

    function seedDatabase() {
        fetch('/api/seed-criminals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                alert('Database seeded successfully!');
                updateUrl(); // Refresh the list after seeding
            } else {
                alert('Failed to seed database.');
            }
        }).catch(error => {
            console.error('Error seeding database:', error);
            alert('Error seeding database.');
        });
    }
</script>

<svelte:head>
    <title>WardenNet - Criminals</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6 text-primary">WardenNet - Criminal Management</h1>

    <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <form on:submit|preventDefault={handleSearch} class="form-control flex-grow">
            <div class="input-group">
                <input type="text" class="input input-bordered w-full" placeholder="Search criminals..." bind:value={searchTerm} />
                <button class="btn btn-primary" type="submit">Search</button>
            </div>
        </form>
        <div class="flex gap-2">
            <a href="/criminals/new" class="btn btn-success">Add New Criminal</a>
            <button class="btn btn-secondary" on:click={seedDatabase}>Seed Database</button>
        </div>
    </div>

    <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Criminals ({totalCriminals} total)</h2>
        {#if criminals.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each criminals as criminal (criminal.id)}
                    <div class="card card-compact bg-base-100 shadow-xl">
                        <div class="card-body">
                            <h3 class="card-title text-primary">{criminal.firstName} {criminal.lastName}</h3>
                            <p><strong>Date of Birth:</strong> {criminal.dateOfBirth ? new Date(criminal.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Address:</strong> {criminal.address || 'N/A'}</p>
                            <p><strong>Email:</strong> {criminal.email || 'N/A'}</p>
                            <div class="card-actions justify-end">
                                <a href="/criminals/{criminal.id}" class="btn btn-info btn-sm">View Details</a>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <p class="text-gray-600">No criminals found.</p>
        {/if}

        {#if pages > 1}
            <div class="join grid grid-cols-2 mt-6">
                <button class="btn btn-outline join-item {currentPage === 1 ? 'btn-disabled' : ''}" on:click={prevPage}>Previous</button>
                <button class="btn btn-outline join-item {currentPage === pages ? 'btn-disabled' : ''}" on:click={nextPage}>Next</button>
            </div>
            <div class="flex justify-center mt-4">
                <div class="join">
                    {#each Array(pages).keys() as i}
                        <button class="btn join-item {currentPage === i + 1 ? 'btn-active btn-primary' : ''}" on:click={() => goToPage(i + 1)}>{i + 1}</button>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>