<script lang="ts">
    import Header from '$lib/components/+Header.svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { Crime, Criminal, Statute } from '$lib/data/types';

    // Explicitly define PageData type to resolve TypeScript errors
    interface PageData {
        userId: string;
        username: string;
        crimes: (Crime & { criminal: Criminal; statute: Statute })[];
        currentPage: number;
        limit: number;
        totalCrimes: number;
        searchTerm: string;
    }

    export let data: PageData;

    let crimes = data.crimes;
    let currentPage = data.currentPage;
    let limit = data.limit;
    let totalCrimes = data.totalCrimes;
    let searchTerm = data.searchTerm;

    let pages = Math.ceil(totalCrimes / limit);

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
    <title>WardenNet - Crimes</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<Header user={{ id: data.userId, name: data.username, email: '', username: data.username, role: 'Prosecutor' }} />

<div class="container mt-4 text-dark">
    <h1 class="mb-4 text-primary">WardenNet - Crime Management</h1>

    <div class="row mb-4">
        <div class="col">
            <form on:submit|preventDefault={handleSearch} class="input-group">
                <input type="text" class="form-control" placeholder="Search crimes..." bind:value={searchTerm} />
                <button class="btn btn-primary" type="submit">Search</button>
            </form>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8">
            <h2 class="text-dark">Crimes ({totalCrimes} total)</h2>
            {#if crimes.length > 0}
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Description</th>
                                <th scope="col">Statute</th>
                                <th scope="col">Criminal</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each crimes as crime (crime.id)}
                                <tr>
                                    <td>{crime.name}</td>
                                    <td>{crime.description ? crime.description.substring(0, 100) + '...' : 'N/A'}</td>
                                    <td>{crime.statute.name} ({crime.statute.sectionNumber})</td>
                                    <td>{crime.criminal.firstName} {crime.criminal.lastName}</td>
                                    <td>
                                        <a href="/crimes/manage/{crime.id}" class="btn btn-info btn-sm me-2">View</a>
                                        <a href="/crimes/manage/{crime.id}/edit" class="btn btn-primary btn-sm me-2">Edit</a>
                                        <!-- Delete button will be implemented on detail page or with a modal -->
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
                <p class="text-dark">No crimes found.</p>
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
                <a href="/crimes/manage/new" class="btn btn-success mb-2">Add New Crime</a>
            </div>
        </div>
    </div>
</div>