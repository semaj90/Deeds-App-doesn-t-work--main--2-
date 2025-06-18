<script lang="ts">
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
</svelte:head>

<div class="p-4">
    <h1 class="text-3xl font-bold mb-6 text-primary">WardenNet Dashboard</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="lg:col-span-2">
            <form on:submit|preventDefault={handleSearchAndFilter} class="form-control mb-4">
                <div class="input-group">
                    <input type="text" placeholder="Search criminals..." class="input input-bordered w-full" bind:value={searchTerm} />
                    <button class="btn btn-primary" type="submit">Search</button>
                    <button class="btn btn-outline btn-secondary" type="button" on:click={clearFilters}>Clear Filters</button>
                </div>
            </form>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label for="filterStatus" class="label">
                        <span class="label-text">Conviction Status</span>
                    </label>
                    <select class="select select-bordered w-full" id="filterStatus" bind:value={filterStatus} on:change={handleSearchAndFilter}>
                        <option value="">All Statuses</option>
                        <option value="Convicted">Convicted</option>
                        <option value="Awaiting Trial">Awaiting Trial</option>
                        <option value="Escaped">Escaped</option>
                        <option value="Released">Released</option>
                    </select>
                </div>
                <div>
                    <label for="filterThreatLevel" class="label">
                        <span class="label-text">Threat Level</span>
                    </label>
                    <select class="select select-bordered w-full" id="filterThreatLevel" bind:value={filterThreatLevel} on:change={handleSearchAndFilter}>
                        <option value="">All Levels</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="flex justify-end items-start">
            <div class="join">
                <button type="button" class="btn join-item {viewMode === 'cards' ? 'btn-active btn-primary' : ''}" on:click={() => (viewMode = 'cards')}>Cards</button>
                <button type="button" class="btn join-item {viewMode === 'list' ? 'btn-active btn-primary' : ''}" on:click={() => (viewMode = 'list')}>List</button>
            </div>
        </div>
    </div>

    <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Criminals ({totalCriminals} total)</h2>
        {#if criminals.length > 0}
            {#if viewMode === 'cards'}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {#each criminals as criminal (criminal.id)}
                        <div class="card card-compact bg-base-100 shadow-xl">
                            <div class="card-body">
                                <h3 class="card-title text-primary">{criminal.firstName} {criminal.lastName}</h3>
                                <p><strong>Status:</strong> {criminal.convictionStatus || 'N/A'}</p>
                                <p><strong>Threat:</strong> {criminal.threatLevel || 'N/A'}</p>
                                <p><strong>DOB:</strong> {criminal.dateOfBirth ? new Date(criminal.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                <div class="card-actions justify-end">
                                    <a href="/criminals/{criminal.id}" class="btn btn-info btn-sm">View Details</a>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="overflow-x-auto">
                    <table class="table w-full table-zebra">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Threat Level</th>
                                <th>Date of Birth</th>
                                <th>Actions</th>
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
            <p class="text-gray-600">No criminals found matching your criteria.</p>
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

    <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Recent Cases</h2>
        <form class="mb-4" on:submit|preventDefault={() => goto('/cases/new')}>
            <button class="btn btn-success">Create New Case</button>
        </form>
        <input type="text" class="input input-bordered w-full mb-4" placeholder="Search cases..." bind:value={searchTerm} on:input={() => goto(`/?search=${encodeURIComponent(searchTerm)}`)} />
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each cases as caseItem (caseItem.id)}
                <div class="card card-compact bg-base-100 shadow-xl cursor-pointer"
                     role="button"
                     tabindex="0"
                     aria-label="View case details"
                     on:click={() => goto(`/case/${caseItem.id}`)}
                     on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') goto(`/case/${caseItem.id}`); }}>
                    <div class="card-body">
                        <h3 class="card-title text-primary">{caseItem.title}</h3>
                        <p><strong>Status:</strong> {caseItem.status}</p>
                        <p><strong>Opened:</strong> {caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString() : 'N/A'}</p>
                        <p>{caseItem.description}</p>
                    </div>
                </div>
            {:else}
                <p class="text-gray-600">No recent cases found.</p>
            {/each}
        </div>
    </div>
</div>
