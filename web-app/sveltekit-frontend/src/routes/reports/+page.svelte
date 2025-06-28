<script lang="ts">
  import { onMount } from 'svelte';
  import TauriAPI from '$lib/tauri';
  
  let reports: any[] = [];
  let loading = true;
  let error: string | null = null;
  
  onMount(async () => {
    try {
      reports = await TauriAPI.getReports();
    } catch (err) {
      error = 'Error loading reports';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  });

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'published': return 'badge-success';
      case 'draft': return 'badge-warning';
      case 'archived': return 'badge-neutral';
      default: return 'badge-info';
    }
  }
</script>

<svelte:head>
  <title>Reports - Legal Case Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Reports</h1>
    <a href="/report-builder" class="btn btn-primary">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
      </svg>
      New Report
    </a>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="loading loading-spinner loading-lg"></div>
      <span class="ml-4">Loading reports...</span>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {:else if reports.length === 0}
    <div class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No reports</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new report.</p>
      <div class="mt-6">
        <a href="/report-builder" class="btn btn-primary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          New Report
        </a>
      </div>
    </div>
  {:else}
    <div class="grid gap-6">
      {#each reports as report}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h2 class="card-title">
                  <a href="/reports/{report.id}" class="link link-hover">{report.title}</a>
                </h2>
                <p class="text-sm text-gray-600 mt-1">{report.summary}</p>
                
                <div class="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>Type: {report.reportType}</span>
                  <span>Created: {formatDate(report.createdAt)}</span>
                  <span>Words: {report.wordCount || 0}</span>
                  {#if report.estimatedReadTime}
                    <span>Read time: {report.estimatedReadTime} min</span>
                  {/if}
                </div>

                {#if report.tags && report.tags.length > 0}
                  <div class="flex flex-wrap gap-2 mt-3">
                    {#each report.tags as tag}
                      <span class="badge badge-outline badge-sm">{tag}</span>
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="flex flex-col items-end gap-2">
                <span class="badge {getStatusBadgeClass(report.status)}">{report.status}</span>
                
                <div class="dropdown dropdown-end">
                  <button tabindex="0" class="btn btn-ghost btn-sm">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                  </button>
                  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li><a href="/reports/{report.id}">View</a></li>
                    <li><a href="/reports/{report.id}/edit">Edit</a></li>
                    <li><a href="/api/reports/{report.id}/export/pdf" target="_blank">Export PDF</a></li>
                    <li><button class="text-error">Delete</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
