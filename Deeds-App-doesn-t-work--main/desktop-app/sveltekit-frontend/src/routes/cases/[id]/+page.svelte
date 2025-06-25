<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { invalidate } from '$app/navigation';
  import { enhance } from '$app/forms';
  import { writable } from 'svelte/store';
  import AttractivenessMeter from '$lib/components/AttractivenessMeter.svelte';

  export let data;
  
  let caseId = $page.params.id;
  let caseDetails = data.caseDetails;
  let evidenceList = data.evidenceList;
  
  // Form data
  let newTitle = caseDetails.title;
  let newDescription = caseDetails.description;
  let newDangerScore = caseDetails.dangerScore;
  let newStatus = caseDetails.status;
  
  // Evidence upload
  let files: File[] = [];
  let isDragOver = false;
  let isUploading = false;
  const uploadProgress = writable(0);
  const uploadSummary = writable('');
  // Reactive danger score display
  $: dangerLevel = (newDangerScore || 0) <= 3 ? 'Low' : (newDangerScore || 0) <= 7 ? 'Medium' : 'High';
  $: dangerColor = (newDangerScore || 0) <= 3 ? 'text-success' : (newDangerScore || 0) <= 7 ? 'text-warning' : 'text-error';

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    if (event.dataTransfer?.files) {
      files = [...files, ...Array.from(event.dataTransfer.files)];
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      files = [...files, ...Array.from(target.files)];
    }
  }

  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
  }

  async function uploadFiles() {
    if (files.length === 0) return;
    
    isUploading = true;
    uploadSummary.set('Uploading files...');
    
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('caseId', caseId);
      
      const response = await fetch(`/api/evidence/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        uploadSummary.set('Upload successful!');
        files = [];
        await invalidate('data');
      } else {
        const error = await response.text();
        uploadSummary.set(`Upload failed: ${error}`);
      }
    } catch (error) {
      uploadSummary.set(`Upload failed: ${error}`);
    } finally {
      isUploading = false;
    }
  }

  async function saveCaseEdits() {
    try {
      const response = await fetch(`/cases/${caseId}/edit`, {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          dangerScore: newDangerScore,
          status: newStatus
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await invalidate('data');
        uploadSummary.set('Case updated successfully!');
      } else {
        uploadSummary.set('Failed to update case');
      }
    } catch (error) {
      uploadSummary.set(`Error: ${error}`);
    }
  }

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

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<svelte:head>
  <title>Edit Case: {caseDetails.title} - WardenNet</title>
</svelte:head>

<div class="min-h-screen bg-base-200 py-8">
  <div class="container mx-auto px-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <div class="breadcrumbs text-sm">
          <ul>
            <li><a href="/dashboard" class="link link-hover">Dashboard</a></li>
            <li><a href="/cases" class="link link-hover">Cases</a></li>
            <li>Edit Case</li>
          </ul>
        </div>
        <h1 class="text-4xl font-bold text-primary mt-2">Edit Case</h1>
      </div>
      <div class="flex items-center gap-2">
        <div class="badge {getStatusColor(caseDetails.status)} badge-lg">{caseDetails.status}</div>
        <div class="badge badge-outline">ID: {caseId}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Case Details Form -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-header">
            <h2 class="card-title text-2xl p-6 pb-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Case Details
            </h2>
          </div>
          <div class="card-body">
            <form on:submit|preventDefault={saveCaseEdits} class="space-y-6">
              <div class="form-control">
                <label class="label" for="title">
                  <span class="label-text font-medium">Case Title</span>
                </label>
                <input 
                  id="title"
                  bind:value={newTitle} 
                  placeholder="Case title" 
                  class="input input-bordered focus:input-primary"
                  required 
                />
              </div>

              <div class="form-control">
                <label class="label" for="description">
                  <span class="label-text font-medium">Description</span>
                </label>
                <textarea 
                  id="description"
                  bind:value={newDescription} 
                  placeholder="Case description" 
                  class="textarea textarea-bordered h-32 focus:textarea-primary"
                  required
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label" for="status">
                    <span class="label-text font-medium">Status</span>
                  </label>
                  <select bind:value={newStatus} id="status" class="select select-bordered focus:select-primary">
                    <option value="open">Open</option>
                    <option value="investigation">Under Investigation</option>
                    <option value="pending">Pending Review</option>
                    <option value="trial">In Trial</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div class="form-control">
                  <label class="label" for="dangerScore">
                    <span class="label-text font-medium">Danger Score: <span class="{dangerColor}">{newDangerScore} ({dangerLevel})</span></span>
                  </label>
                  <input 
                    id="dangerScore"
                    type="range" 
                    bind:value={newDangerScore} 
                    min="0" 
                    max="10" 
                    class="range range-primary" 
                    step="1"
                  />
                  <div class="w-full flex justify-between text-xs px-2 mt-1">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              <div class="card-actions justify-end">
                <button type="submit" class="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Case Info Sidebar -->
      <div class="space-y-6">
        <!-- Case Stats -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title text-lg">Case Statistics</h3>
            <div class="stats stats-vertical">
              <div class="stat">
                <div class="stat-title">Evidence Files</div>
                <div class="stat-value text-primary">{evidenceList.length}</div>
              </div>
              <div class="stat">
                <div class="stat-title">Total Size</div>
                <div class="stat-value text-sm">
                  {formatFileSize(evidenceList.reduce((sum, e) => sum + (e.fileSize || 0), 0))}
                </div>
              </div>
              <div class="stat">
                <div class="stat-title">Created</div>
                <div class="stat-value text-sm">
                  {caseDetails.createdAt ? new Date(caseDetails.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div class="stat">
                <div class="stat-title">Witness Appeal</div>
                <div class="stat-value text-sm">
                  <AttractivenessMeter 
                    score={7}
                    readOnly={true}
                    size="sm"
                    showDescription={false}
                    label=""
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title text-lg">Quick Actions</h3>
            <div class="space-y-2">
              <button class="btn btn-outline btn-sm w-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Export Case
              </button>
              <button class="btn btn-outline btn-sm w-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share Case
              </button>
              <button class="btn btn-outline btn-sm w-full text-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Archive Case
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Evidence Section -->
    <div class="mt-8">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-header">
          <h2 class="card-title text-2xl p-6 pb-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Evidence Management
          </h2>
        </div>
        <div class="card-body">
          <!-- Upload Section -->
          <div class="mb-8">
            <h3 class="text-xl font-semibold mb-4">Upload Evidence</h3>
            
            <!-- Drag and Drop Zone -->            <div 
              role="button"
              tabindex="0"
              aria-label="Drop zone for file uploads"
              class="border-2 border-dashed border-base-300 rounded-lg p-8 text-center transition-all duration-300
                     {isDragOver ? 'border-primary bg-primary/10' : 'hover:border-primary/50 hover:bg-base-50'}"
              on:drop={handleDrop} 
              on:dragover={handleDragOver}
              on:dragleave={handleDragLeave}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-base-content/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-lg font-medium mb-2">Drag and drop files here</p>
              <p class="text-base-content/70 mb-4">or click to select files</p>
              <input 
                type="file" 
                multiple 
                on:change={handleFileSelect}
                class="file-input file-input-bordered file-input-primary w-full max-w-xs"
              />
            </div>

            <!-- File List -->
            {#if files.length > 0}
              <div class="mt-4">
                <h4 class="font-medium mb-2">Selected Files ({files.length})</h4>
                <div class="space-y-2">
                  {#each files as file, index}
                    <div class="flex items-center justify-between p-3 bg-base-50 rounded-lg">
                      <div class="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p class="font-medium">{file.name}</p>
                          <p class="text-sm text-base-content/70">{formatFileSize(file.size)}</p>
                        </div>
                      </div>                      <button 
                        class="btn btn-ghost btn-sm text-error"
                        on:click={() => removeFile(index)}
                        aria-label="Remove file"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
                
                <div class="mt-4 flex gap-2">
                  <button 
                    class="btn btn-primary" 
                    class:loading={isUploading}
                    disabled={isUploading}
                    on:click={uploadFiles}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Files'}
                  </button>
                  <button 
                    class="btn btn-ghost" 
                    on:click={() => files = []}
                    disabled={isUploading}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            {/if}

            <!-- Upload Status -->
            {#if $uploadSummary}
              <div class="mt-4">
                <div class="alert {$uploadSummary.includes('successful') ? 'alert-success' : $uploadSummary.includes('failed') ? 'alert-error' : 'alert-info'}">
                  <span>{$uploadSummary}</span>
                </div>
              </div>
            {/if}
          </div>

          <!-- Evidence List -->
          <div>
            <h3 class="text-xl font-semibold mb-4">Current Evidence ({evidenceList.length})</h3>
            
            {#if evidenceList.length === 0}
              <div class="text-center py-8 text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No evidence files uploaded yet</p>
              </div>
            {:else}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each evidenceList as evidence}
                  <div class="card card-compact bg-base-50 shadow">
                    <div class="card-body">
                      <h4 class="card-title text-sm">{evidence.title}</h4>
                      <div class="text-xs text-base-content/70 space-y-1">
                        <p><span class="badge badge-outline badge-xs">{evidence.fileType}</span></p>
                        <p>Size: {formatFileSize(evidence.fileSize || 0)}</p>
                        <p>Uploaded: {evidence.uploadedAt ? new Date(evidence.uploadedAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div class="card-actions justify-end mt-2">
                        <a href={evidence.fileUrl} target="_blank" class="btn btn-primary btn-xs">
                          View
                        </a>
                        <button class="btn btn-ghost btn-xs text-error" on:click={async () => {
                          if (confirm('Are you sure you want to delete this evidence file?')) {
                            const res = await fetch(`/api/evidence/${evidence.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              await invalidate('data');
                            } else {
                              alert('Failed to delete evidence.');
                            }
                          }
                        }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
