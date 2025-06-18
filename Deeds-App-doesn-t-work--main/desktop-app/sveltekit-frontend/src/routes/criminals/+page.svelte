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

<Header user={$page.data.user} />

<div class="container mt-4 text-dark">
    <h1 class="mb-4 text-primary">WardenNet - Criminal Management</h1>

    <div class="row mb-4">
        <div class="col">
            <form on:submit|preventDefault={handleSearch} class="input-group">
                <input type="text" class="form-control" placeholder="Search criminals..." bind:value={searchTerm} />
                <button class="btn btn-primary" type="submit">Search</button>
            </form>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8">
            <h2 class="text-dark">Criminals ({totalCriminals} total)</h2>
            {#each criminals as criminal (criminal.id)}
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title text-primary">{criminal.firstName} {criminal.lastName}</h5>
                        <p class="card-text">
                            <strong>Date of Birth:</strong> {criminal.dateOfBirth ? new Date(criminal.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </p>
                        <p class="card-text">
                            <strong>Address:</strong> {criminal.address || 'N/A'}
                        </p>
                        <p class="card-text">
                            <strong>Email:</strong> {criminal.email || 'N/A'}
                        </p>
                        <a href="/criminals/{criminal.id}" class="btn btn-info">View Details</a>
                    </div>
                </div>
            {:else}
                <p class="text-dark">No criminals found.</p>
            {/each}

            {#if pages > 1}
                <nav aria-label="Page navigation">
                    <ul class="pagination justify-content-center">
                        <li class="page-item {currentPage === 1 ? 'disabled' : ''}">
                            <button class="page-link" on:click={prevPage}>Previous</button>
                        </li>
                        {#each Array(pages).keys() as i}
                            <li class="page-item {currentPage === i + 1 ? 'active' : ''}">
                                <button class="page-link {currentPage === i + 1 ? 'bg-primary text-white' : ''}" on:click={() => goToPage(i + 1)}>{i + 1}</button>
                            </li>
                        {/each}
                        <li class="page-item {currentPage === pages ? 'disabled' : ''}">
                            <button class="page-link" on:click={nextPage}>Next</button>
                        </li>
                    </ul>
                </nav>
            {/if}
        </div>
        <div class="col-md-4">
            <h2 class="text-dark">Actions</h2>
            <div class="d-grid gap-2">
                <a href="/criminals/new" class="btn btn-success mb-2">Add New Criminal</a>
                <button class="btn btn-secondary mb-2" on:click={seedDatabase}>Seed Database with Example Data</button>
            </div>
        </div>
    </div>
</div>