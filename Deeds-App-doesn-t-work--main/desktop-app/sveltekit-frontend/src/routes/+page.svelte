<script lang="ts">
    import Header from '$lib/components/+Header.svelte';
    import Sidebar from '$lib/components/+Sidebar.svelte';
    import type { PageData } from './$types';
    import type { Criminal, Case } from '$lib/data/types';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    export let data: PageData;

    let criminals: Criminal[] = data.criminals;
    let cases: Case[] = data.cases;
    let currentPage = data.currentPage;
    let limit = data.limit;
    let totalCriminals = data.totalCriminals;
    let searchTerm = data.searchTerm;
    let filterStatus: string = data.filterStatus || '';
    let filterThreatLevel: string = data.filterThreatLevel || '';
    let viewMode: 'cards' | 'list' = 'cards'; // Default view mode

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
        if (filterStatus) {
            url.searchParams.set('status', filterStatus);
        } else {
            url.searchParams.delete('status');
        }
        if (filterThreatLevel) {
            url.searchParams.set('threat', filterThreatLevel);
        } else {
            url.searchParams.delete('threat');
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

    function handleSearchAndFilter() {
        currentPage = 1; // Reset to first page on new search/filter
        updateUrl();
    }

    function clearFilters() {
        searchTerm = '';
        filterStatus = '';
        filterThreatLevel = '';
        currentPage = 1;
        updateUrl();
    }

    onMount(() => {
        // If on the homepage, redirect to /account if logged in
        if ($page.data.session?.user && $page.url.pathname === '/') {
            goto('/account');
        }
    });
</script>

<svelte:head>
    <title>WardenNet - Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="d-flex">
    <Sidebar />
    <div class="flex-grow-1 d-flex flex-column">
        <Header user={data.user} />
        <main class="container-fluid mt-4 flex-grow-1 text-dark">
            <h1 class="mb-4 text-primary">WardenNet Dashboard</h1>

            <div class="row mb-4">
                <div class="col-lg-8">
                    <form on:submit|preventDefault={handleSearchAndFilter} class="input-group mb-3">
                        <input type="text" class="form-control" placeholder="Search criminals..." bind:value={searchTerm} />
                        <button class="btn btn-primary" type="submit">Search</button>
                        <button class="btn btn-outline-secondary" type="button" on:click={clearFilters}>Clear Filters</button>
                    </form>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="filterStatus" class="form-label">Conviction Status</label>
                            <select class="form-select" id="filterStatus" bind:value={filterStatus} on:change={handleSearchAndFilter}>
                                <option value="">All Statuses</option>
                                <option value="Convicted">Convicted</option>
                                <option value="Awaiting Trial">Awaiting Trial</option>
                                <option value="Escaped">Escaped</option>
                                <option value="Released">Released</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label for="filterThreatLevel" class="form-label">Threat Level</label>
                            <select class="form-select" id="filterThreatLevel" bind:value={filterThreatLevel} on:change={handleSearchAndFilter}>
                                <option value="">All Levels</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 text-end">
                    <div class="btn-group" role="group" aria-label="View mode toggle">
                        <button type="button" class="btn {viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}" on:click={() => (viewMode = 'cards')}>Cards</button>
                        <button type="button" class="btn {viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}" on:click={() => (viewMode = 'list')}>List</button>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <h2 class="text-dark">Criminals ({totalCriminals} total)</h2>
                    {#if criminals.length > 0}
                        {#if viewMode === 'cards'}
                            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                {#each criminals as criminal (criminal.id)}
                                    <div class="col">
                                        <div class="card h-100 shadow-sm">
                                            <div class="card-body">
                                                <h5 class="card-title text-primary">{criminal.firstName} {criminal.lastName}</h5>
                                                <p class="card-text"><strong>Status:</strong> {criminal.convictionStatus || 'N/A'}</p>
                                                <p class="card-text"><strong>Threat:</strong> {criminal.threatLevel || 'N/A'}</p>
                                                <p class="card-text"><strong>DOB:</strong> {criminal.dateOfBirth ? new Date(criminal.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                                <a href="/criminals/{criminal.id}" class="btn btn-info btn-sm">View Details</a>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th scope="col">Name</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Threat Level</th>
                                            <th scope="col">Date of Birth</th>
                                            <th scope="col">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each criminals as criminal (criminal.id)}
                                            <tr>
                                                <td>{criminal.firstName} {criminal.lastName}</td>
                                                <td>{criminal.convictionStatus || 'N/A'}</td>
                                                <td>{criminal.threatLevel || 'N/A'}</td>
                                                <td>{criminal.dateOfBirth ? new Date(criminal.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <a href="/criminals/{criminal.id}" class="btn btn-info btn-sm">View Details</a>
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}
                    {:else}
                        <p class="text-dark">No criminals found matching your criteria.</p>
                    {/if}

                    {#if pages > 1}
                        <nav aria-label="Page navigation" class="mt-4">
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
            </div>

            <h2 class="mt-5 mb-4 text-dark">Recent Cases</h2>
            <form class="mb-3" on:submit|preventDefault={() => goto('/cases/new')}>
                <button class="btn btn-success">Create New Case</button>
            </form>
            <input type="text" class="form-control mb-3" placeholder="Search cases..." bind:value={searchTerm} on:input={() => goto(`/?search=${encodeURIComponent(searchTerm)}`)} />
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {#each cases as caseItem (caseItem.id)}
                    <div class="col">
                        <div class="card h-100 shadow-sm clickable"
                             role="button"
                             tabindex="0"
                             aria-label="View case details"
                             on:click={() => goto(`/case/${caseItem.id}`)}
                             on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') goto(`/case/${caseItem.id}`); }}
                             style="cursor:pointer;">
                            <div class="card-body">
                                <h5 class="card-title text-primary">{caseItem.title}</h5>
                                <p class="card-text"><strong>Status:</strong> {caseItem.status}</p>
                                <p class="card-text"><strong>Opened:</strong> {caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString() : 'N/A'}</p>
                                <p class="card-text">{caseItem.description}</p>
                            </div>
                        </div>
                    </div>
                {:else}
                    <p class="text-dark">No recent cases found.</p>
                {/each}
            </div>
        </main>
    </div>
</div>
