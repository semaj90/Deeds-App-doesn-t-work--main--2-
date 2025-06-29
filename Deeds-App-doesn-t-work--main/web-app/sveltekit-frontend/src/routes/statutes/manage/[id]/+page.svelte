<script lang="ts">
    import { goto } from '$app/navigation';
    import type { Statute } from '$lib/data/types';

    // Explicitly define PageData type to resolve TypeScript errors
    interface PageData {
        statute: Statute;
    }

    export let data: PageData;

    let statuteItem: Statute = data.statute;
    let showDeleteConfirmation = false;

    function goToEdit() {
        if (statuteItem && statuteItem.id) {
            goto(`/statutes/manage/${statuteItem.id}/edit`);
        }
    }

    async function deleteStatute() {
        if (!statuteItem || !statuteItem.id) return;

        try {
            const response = await fetch(`/api/statutes/${statuteItem.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Statute deleted successfully!');
                goto('/statutes/manage'); // Redirect to statutes list page
            } else {
                const errorData = await response.json();
                alert(`An error occurred while trying to delete the statute: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting statute:', error);
            alert(`An error occurred while trying to delete the statute: ${error}`);
        } finally {
            showDeleteConfirmation = false;
        }
    }
</script>

<svelte:head>
    <title>Statute: {statuteItem.title} - WardenNet</title>
    <link href="" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mt-4 text-dark">
    {#if statuteItem}
        <h1 class="mb-4 text-primary">Statute: {statuteItem.title}</h1>
        <p><strong>Description:</strong> {statuteItem.description || 'No description provided.'}</p>
        <p><strong>Created At:</strong> {new Date(statuteItem.createdAt).toLocaleDateString()}</p>
        
        <div class="button-group mt-4">
            <button on:click={goToEdit} class="btn btn-primary">Edit Statute</button>
            <button on:click={() => showDeleteConfirmation = true} class="btn btn-danger">Delete Statute</button>
        </div>
    {:else}
        <p class="text-dark">Statute not found or loading...</p>
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
                        Are you sure you want to delete statute: <strong>{statuteItem.title}</strong>? This action cannot be undone.
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" on:click={() => showDeleteConfirmation = false}>Cancel</button>
                        <button type="button" class="btn btn-danger" on:click={deleteStatute}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .button-group {
        display: flex;
        justify-content: center;
        gap: 10px; /* Space between buttons */
    }
    /* Basic -like button styles */
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