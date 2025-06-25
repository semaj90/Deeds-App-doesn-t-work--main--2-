<script lang="ts">
  import type { PageData } from './$types';
  import type { Case, CasesPageData } from './types';
  import CaseCard from '$lib/components/+CaseCard.svelte';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  export let data: CasesPageData;

  let searchTerm = '';
  let statusFilter = 'all';
  let sortBy = 'newest';
  let viewMode = 'grid'; // grid or list
  let showFilters = false;
  
  $: filteredCases = data.cases
    .filter((case_: Case) => {
      const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           case_.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
      return matchesSearch && matchesStatus;
    })    .sort((a: Case, b: Case) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'danger':
          return (b.dangerScore || 0) - (a.dangerScore || 0);
        default:
          return 0;
      }
    });

  function getStatusColor(status: string) {
    switch (status) {
      case 'open': return 'badge-success';
      case 'investigation': return 'badge-warning';
      case 'pending': return 'badge-info';
      case 'trial': return 'badge-primary';
      case 'closed': return 'badge-neutral';
      case 'archived': return 'badge-ghost';
      default: return 'badge-neutral';
    }
  }

  function getDangerColor(score: number) {
    if (score <= 3) return 'text-success';
    if (score <= 7) return 'text-warning';
    return 'text-error';
  }

  function formatDate(dateInput: string | Date) {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Cases Management - WardenNet</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  <!-- Header -->
  <div class="bg-base-100 shadow-sm">
    <div class="container mx-auto px-4 py-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-primary">Cases Management</h1>
          <p class="text-base-content/70 mt-1">Manage and track all your cases</p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <a href="/cases/new" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Case
          </a>
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-outline">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              Actions
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><a>Export All Cases</a></li>
              <li><a>Import Cases</a></li>
              <li><a>Generate Report</a></li>
              <li><hr></li>
              <li><a>Archive Selected</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="container mx-auto px-4 py-6">
    <!-- Search and Filters -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- Search -->
          <div class="form-control flex-1">
            <div class="input-group">
              <span class="bg-base-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                bind:value={searchTerm}
                placeholder="Search cases by title or description..." 
                class="input input-bordered flex-1 focus:input-primary"
              />
            </div>
          </div>

          <!-- View Toggle -->
          <div class="form-control">
            <div class="btn-group">
              <button 
                class="btn {viewMode === 'grid' ? 'btn-active' : ''}"
                on:click={() => viewMode = 'grid'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                class="btn {viewMode === 'list' ? 'btn-active' : ''}"
                on:click={() => viewMode = 'list'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Filters Toggle -->
          <button 
            class="btn btn-outline"
            on:click={() => showFilters = !showFilters}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>

        <!-- Advanced Filters -->
        {#if showFilters}
          <div class="divider"></div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Status</span>
              </label>
              <select bind:value={statusFilter} class="select select-bordered focus:select-primary">
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="investigation">Under Investigation</option>
                <option value="pending">Pending Review</option>
                <option value="trial">In Trial</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Sort By</span>
              </label>
              <select bind:value={sortBy} class="select select-bordered focus:select-primary">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="danger">Highest Risk</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Quick Actions</span>
              </label>
              <button class="btn btn-outline btn-sm">
                Reset Filters
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Results Summary -->
    <div class="flex items-center justify-between mb-6">
      <div class="text-sm text-base-content/70">
        Showing {filteredCases.length} of {data.cases.length} cases
      </div>
      
      <!-- Statistics -->
      <div class="stats stats-horizontal shadow">
        <div class="stat">
          <div class="stat-title">Total</div>
          <div class="stat-value text-sm">{data.cases.length}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Open</div>
          <div class="stat-value text-sm text-success">
            {data.cases.filter((c: Case) => c.status === 'open').length}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">High Risk</div>
          <div class="stat-value text-sm text-error">
            {data.cases.filter((c: Case) => (c.dangerScore || 0) > 7).length}
          </div>
        </div>
      </div>
    </div>

    <!-- Cases Display -->
    {#if filteredCases.length === 0}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-16 w-16 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-xl font-semibold mb-2">No cases found</h3>
          <p class="text-base-content/70 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search criteria or filters.'
              : 'Get started by creating your first case.'}
          </p>
          <a href="/cases/new" class="btn btn-primary">
            Create New Case
          </a>
        </div>
      </div>
    {:else if viewMode === 'grid'}
      <!-- Grid View -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredCases as case_}
          <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer" on:click={() => goto(`/cases/${case_.id}`)}>
            <div class="card-body">
              <div class="flex items-start justify-between mb-3">
                <h3 class="card-title text-lg line-clamp-2">{case_.title}</h3>
                <div class="badge {getStatusColor(case_.status)} badge-sm">{case_.status}</div>
              </div>
              
              <p class="text-base-content/70 text-sm line-clamp-3 mb-4">{case_.description}</p>
              
              <div class="flex items-center justify-between mb-4">
                <div class="text-xs text-base-content/60">
                  {formatDate(case_.createdAt)}
                </div>
                {#if case_.dangerScore}
                  <div class="badge badge-outline badge-sm {getDangerColor(case_.dangerScore)}">
                    Risk: {case_.dangerScore}/10
                  </div>
                {/if}
              </div>
              
              <div class="card-actions justify-end">
                <button class="btn btn-primary btn-sm" on:click|stopPropagation={() => goto(`/cases/${case_.id}`)}>
                  Edit Case
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <!-- List View -->
      <div class="card bg-base-100 shadow-xl">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Risk Level</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredCases as case_}
                <tr class="hover cursor-pointer" on:click={() => goto(`/cases/${case_.id}`)}>
                  <td>
                    <div>
                      <div class="font-bold">{case_.title}</div>
                      <div class="text-sm text-base-content/70 line-clamp-1">{case_.description}</div>
                    </div>
                  </td>
                  <td>
                    <div class="badge {getStatusColor(case_.status)} badge-sm">{case_.status}</div>
                  </td>
                  <td>
                    {#if case_.dangerScore}
                      <div class="badge badge-outline badge-sm {getDangerColor(case_.dangerScore)}">
                        {case_.dangerScore}/10
                      </div>
                    {:else}
                      <span class="text-base-content/50">-</span>
                    {/if}
                  </td>
                  <td class="text-sm">{formatDate(case_.createdAt)}</td>
                  <td>
                    <div class="dropdown dropdown-end">
                      <label tabindex="0" class="btn btn-ghost btn-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </label>
                      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li><a on:click|stopPropagation={() => goto(`/cases/${case_.id}`)}>Edit</a></li>
                        <li><a>Duplicate</a></li>
                        <li><a>Export</a></li>
                        <li><hr></li>
                        <li><a class="text-error">Archive</a></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>