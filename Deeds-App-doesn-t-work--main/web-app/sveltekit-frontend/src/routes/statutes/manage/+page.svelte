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

<Header user={data.user} />

<div class="container mt-4 text-dark">
    <h1 class="mb-4 text-primary">WardenNet - Statute Management</h1>

    <div class="row mb-4">
        <div class="col">
            <form on:submit|preventDefault={handleSearch} class="input-group">
                <input type="text" class="form-control" placeholder="Search statutes..." bind:value={searchTerm} />
                <button class="btn btn-primary" type="submit">Search</button>
            </form>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8">
            <h2 class="text-dark">Statutes ({totalStatutes} total)</h2>
            {#if statutes.length > 0}
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Section Number</th>
                                <th scope="col">Description</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each statutes as statute (statute.id)}
                                <tr>
                                    <td>{statute.title}</td>
                                    <td>{statute.description ? statute.description.substring(0, 100) + '...' : 'N/A'}</td>
                                    <td>
                                        <a href="/statutes/manage/{statute.id}" class="btn btn-info btn-sm me-2">View</a>
                                        <a href="/statutes/manage/{statute.id}/edit" class="btn btn-primary btn-sm me-2">Edit</a>
                                        <!-- Delete button will be implemented on detail page or with a modal -->
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
                <p class="text-dark">No statutes found.</p>
            {/if}

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
                <a href="/statutes/manage/new" class="btn btn-success mb-2">Add New Statute</a>
            </div>
        </div>
    </div>
</div>