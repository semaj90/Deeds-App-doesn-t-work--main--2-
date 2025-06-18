<script lang="ts">
    import Header from '$lib/components/+Header.svelte';
    import type { Statute } from '$lib/data/types'; // Import Statute type

    // Explicitly define PageData type to resolve TypeScript errors
    interface PageData {
        userId: string;
        username: string;
        statutes: Statute[];
        currentPage: number;
        limit: number;
        totalStatutes: number;
        searchTerm: string;
        user: any;
    }

    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    export let data: PageData;

    let statutes = data.statutes;
    let currentPage = data.currentPage;
    let limit = data.limit;
    let totalStatutes = data.totalStatutes;
    let searchTerm = data.searchTerm;

    let pages = Math.ceil(totalStatutes / limit);

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
</script>

<svelte:head>
    <title>WardenNet - Statutes</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6 text-primary">WardenNet - Statute Management</h1>

    <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <form on:submit|preventDefault={handleSearch} class="form-control flex-grow">
            <div class="input-group">
                <input type="text" class="input input-bordered w-full" placeholder="Search statutes..." bind:value={searchTerm} />
                <button class="btn btn-primary" type="submit">Search</button>
            </div>
        </form>
        <a href="/statutes/manage/new" class="btn btn-success">Add New Statute</a>
    </div>

    <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Statutes ({totalStatutes} total)</h2>
        {#if statutes.length > 0}
            <div class="overflow-x-auto">
                <table class="table w-full table-zebra">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each statutes as statute (statute.id)}
                            <tr>
                                <td>{statute.title}</td>
                                <td>{statute.description ? statute.description.substring(0, 100) + '...' : 'N/A'}</td>
                                <td>
                                    <a href="/statutes/manage/{statute.id}" class="btn btn-info btn-sm mr-2">View</a>
                                    <a href="/statutes/manage/{statute.id}/edit" class="btn btn-primary btn-sm">Edit</a>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <p class="text-gray-600">No statutes found.</p>
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