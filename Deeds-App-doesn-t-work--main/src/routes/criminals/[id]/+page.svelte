<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    import type { Criminal, Evidence } from '$lib/data/types';
    import { invoke } from '@tauri-apps/api/tauri';
    import FileUploadSection from '$lib/components/+FileUploadSection.svelte';

    export let data: { criminal: Criminal; evidence: Evidence[] };

    let criminalItem: Criminal = data.criminal;
    let showDeleteConfirmation = false;
    let activeTab = 'profile';
    let editMode = false;
    let uploadingPhoto = false;

    function goToEdit() {
        if (criminalItem && criminalItem.id) {
            goto(`/criminals/${criminalItem.id}/edit`);
        }
    }

    async function deleteCriminal() {
        if (!criminalItem || !criminalItem.id) return;

        try {
            await invoke('delete_criminal', { id: criminalItem.id });
            alert('Criminal deleted successfully!');
            goto('/criminals'); // Redirect to criminals list page
        } catch (error) {
            console.error('Error deleting criminal:', error);
            alert(`An error occurred while trying to delete the criminal: ${error}`);
        } finally {
            showDeleteConfirmation = false;
        }
    }

    async function handlePhotoUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const formData = new FormData();
        formData.append('photo', input.files[0]);
        formData.append('criminalId', data.criminal.id.toString());

        uploadingPhoto = true;
        try {
            const response = await fetch(`/api/criminals/${data.criminal.id}/photo`, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                const result = await response.json();
                data.criminal.photoUrl = result.photoUrl;
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
        } finally {
            uploadingPhoto = false;
        }
    }
</script>

<svelte:head>
    <title>Criminal: {criminalItem.firstName} {criminalItem.lastName} - WardenNet</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mt-4 text-dark">
    {#if criminalItem}
        <h1 class="mb-4 text-primary">Criminal: {criminalItem.firstName} {criminalItem.lastName}</h1>
        <p><strong>Date of Birth:</strong> {criminalItem.dateOfBirth ? new Date(criminalItem.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Address:</strong> {criminalItem.address || 'No address provided.'}</p>
        <p><strong>Phone:</strong> {criminalItem.phone || 'No phone provided.'}</p>
        <p><strong>Email:</strong> {criminalItem.email || 'No email provided.'}</p>
        <p><strong>Created At:</strong> {new Date(criminalItem.createdAt).toLocaleDateString()}</p>
        
        <div class="button-group mt-4">
            <button on:click={goToEdit} class="btn btn-primary">Edit Criminal</button>
            <button on:click={() => showDeleteConfirmation = true} class="btn btn-danger">Delete Criminal</button>
        </div>
    {:else}
        <p class="text-dark">Criminal not found or loading...</p>
    {/if}

    {#if showDeleteConfirmation}
        <div class="modal-overlay">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title text-primary">Confirm Deletion</h5>
                        <button type="button" class="btn-close" aria-label="Close" on:click={() => showDeleteConfirmation = false}>
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        Are you sure you want to delete criminal: <strong>{criminalItem.firstName} {criminalItem.lastName}</strong>? This action cannot be undone.
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" on:click={() => showDeleteConfirmation = false}>Cancel</button>
                        <button type="button" class="btn btn-danger" on:click={deleteCriminal}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <div class="row">
        <!-- Left sidebar with photo -->
        <div class="col-md-3">
            <div class="card">
                <div class="card-body text-center">
                    {#if data.criminal.photoUrl}
                        <img src={data.criminal.photoUrl} alt="Criminal photo" class="img-fluid rounded mb-3" />
                    {:else}
                        <div class="placeholder-image mb-3">No Photo</div>
                    {/if}
                    <input type="file" accept="image/*" on:change={handlePhotoUpload} class="d-none" id="photoUpload" />
                    <button class="btn btn-primary btn-sm" on:click={() => document.getElementById('photoUpload')?.click()}>
                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    </button>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <div class="col-md-9">
            <div class="card">
                <div class="card-header">
                    <ul class="nav nav-tabs card-header-tabs">
                        <li class="nav-item">
                            <button class="nav-link" class:active={activeTab === 'profile'} on:click={() => activeTab = 'profile'}>
                                Profile
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" class:active={activeTab === 'evidence'} on:click={() => activeTab = 'evidence'}>
                                Evidence
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" class:active={activeTab === 'analysis'} on:click={() => activeTab = 'analysis'}>
                                AI Analysis
                            </button>
                        </li>
                    </ul>
                </div>

                <div class="card-body">
                    {#if activeTab === 'profile'}
                        <!-- Profile content -->
                        <div class="profile-section">
                            <h3>{data.criminal.firstName} {data.criminal.lastName}</h3>
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Date of Birth:</strong> {data.criminal.dateOfBirth}</p>
                                    <p><strong>Address:</strong> {data.criminal.address}</p>
                                    <p><strong>Email:</strong> {data.criminal.email}</p>
                                    <p><strong>Phone:</strong> {data.criminal.phone}</p>
                                </div>
                                <div class="col-md-6">
                                    <h4>Aliases</h4>
                                    <ul>
                                        {#each data.criminal.aliases as alias}
                                            <li>{alias}</li>
                                        {/each}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    {:else if activeTab === 'evidence'}
                        <!-- Evidence section -->
                        <FileUploadSection criminalId={data.criminal.id} />
                        <div class="evidence-list mt-4">
                            {#each data.evidence as item}
                                <div class="evidence-item card mb-2">
                                    <div class="card-body">
                                        <h5 class="card-title">{item.title}</h5>
                                        <p class="card-text">{item.description}</p>
                                        <div class="tags">
                                            {#each item.tags as tag}
                                                <span class="badge bg-secondary me-1">{tag}</span>
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else if activeTab === 'analysis'}
                        <!-- AI Analysis section -->
                        <div class="analysis-section">
                            <h4>AI Analysis Results</h4>
                            <pre class="bg-light p-3 rounded">
                                {JSON.stringify(data.criminal.aiAnalysis, null, 2)}
                            </pre>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .button-group {
        display: flex;
        justify-content: center;
        gap: 10px; /* Space between buttons */
    }
    /* Basic Bootstrap-like button styles */
    .btn {
        padding: 10px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
    }
    .btn-primary {
        background-color: var(--primary-color);
        color: white;
    }
    .btn-primary:hover {
        background-color: #8B0000; /* Darker crimson */
    }
    .btn-danger {
        background-color: #dc3545; /* Bootstrap default danger */
        color: white;
    }
    .btn-danger:hover {
        background-color: #bd2130;
    }
    .btn-secondary {
        background-color: var(--secondary-color);
        color: white;
    }
    .btn-secondary:hover {
        background-color: #333333; /* Darker gray */
    }

    /* Modal styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .modal-dialog {
        background: var(--surface-color);
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        width: 90%;
        max-width: 500px;
    }
    .modal-content {
        display: flex;
        flex-direction: column;
        background-color: var(--surface-color);
        color: var(--text-color);
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 10px;
        margin-bottom: 15px;
    }
    .modal-title {
        margin: 0;
        font-size: 1.25rem;
        color: var(--primary-color);
    }
    .modal-header .btn-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-color);
    }
    .modal-header .btn-close:hover {
        color: var(--primary-color);
    }
    .modal-body {
        margin-bottom: 15px;
    }
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        border-top: 1px solid var(--border-color);
        padding-top: 10px;
        margin-top: 15px;
    }

    .placeholder-image {
        width: 200px;
        height: 200px;
        background-color: #e9ecef;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
    }
</style>