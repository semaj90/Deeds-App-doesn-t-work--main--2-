<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { Case } from '$lib/data/types';

    // Explicitly define PageData type to resolve TypeScript errors
    interface PageData {
        case: Case;
    }

    export let data: PageData;

    let caseItem: Case = data.case;
    let showDeleteConfirmation = false;

    // Function to handle navigation to edit page
    function goToEdit() {
        if (caseItem && caseItem.id) {
            goto(`/case/${caseItem.id}/edit`);
        }
    }

    // Function to handle case deletion
    async function deleteCase() {
        if (!caseItem || !caseItem.id) return;

        try {
            const response = await fetch(`/api/cases/${caseItem.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Case deleted successfully!');
                goto('/'); // Redirect to home or cases list page
            } else {
                const errorData = await response.json();
                alert(`Failed to delete case: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting case:', error);
            alert('An error occurred while trying to delete the case.');
        } finally {
            showDeleteConfirmation = false;
        }
    }

    // Function to mark case as ready for trial
    async function markReadyForTrial() {
        if (!caseItem || !caseItem.id) return;
        const response = await fetch(`/api/cases/${caseItem.id}/ready`, { method: 'POST' });
        if (response.ok) {
            caseItem.status = 'ready-for-trial';
        } else {
            alert('Failed to update status');
        }
    }
</script>
<div class="case-detail-page">
    {#if caseItem}
        <h1 class="text-primary">{caseItem.title}</h1>
        <p class="text-muted">Created: {new Date(String(caseItem.createdAt)).toLocaleDateString()}</p>
        <p class="text-dark">{caseItem.description || 'No description available.'}</p>
        <p class="text-dark">Status: {caseItem.status}</p>

        <div class="button-group">
            <button class="btn btn-primary" on:click={goToEdit}>Edit Case</button>
            <button class="btn btn-danger" on:click={() => showDeleteConfirmation = true}>Delete Case</button>
            {#if caseItem.status === 'ready-for-trial'}
                <button class="btn btn-secondary" disabled>Ready for Trial</button>
            {:else}
                <button class="btn btn-success" on:click={markReadyForTrial}>Mark as Ready for Trial</button>
            {/if}
        </div>
    {:else}
        <p class="text-dark">Case not found or loading...</p>
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
                        Are you sure you want to delete case: <strong>{caseItem.title}</strong>? This action cannot be undone.
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" on:click={() => showDeleteConfirmation = false}>Cancel</button>
                        <button type="button" class="btn btn-danger" on:click={deleteCase}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .case-detail-page {
        padding: 20px;
        text-align: center;
    }
    h1 {
        color: var(--primary-color);
        margin-bottom: 10px;
    }
    p {
        color: var(--text-color);
        margin-bottom: 5px;
    }
    .button-group {
        margin-top: 20px;
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
</style>