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
    <title>Statute: {statuteItem.name} - WardenNet</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mx-auto p-4">
    {#if statuteItem}
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h1 class="card-title text-3xl font-bold mb-4 text-primary">Statute: {statuteItem.name}</h1>
                <p class="text-lg"><strong>Section Number:</strong> {statuteItem.sectionNumber}</p>
                <p class="text-lg"><strong>Description:</strong> {statuteItem.description || 'No description provided.'}</p>
                <p class="text-lg"><strong>Created At:</strong> {new Date(statuteItem.createdAt).toLocaleDateString()}</p>

                <div class="card-actions justify-end mt-6">
                    <button on:click={goToEdit} class="btn btn-primary">Edit Statute</button>
                    <button on:click={() => showDeleteConfirmation = true} class="btn btn-error">Delete Statute</button>
                </div>
            </div>
        </div>
    {:else}
        <p class="text-gray-600">Statute not found or loading...</p>
    {/if}

    {#if showDeleteConfirmation}
        <div class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg text-primary">Confirm Deletion</h3>
                <p class="py-4">Are you sure you want to delete statute: <strong>{statuteItem.name} ({statuteItem.sectionNumber})</strong>? This action cannot be undone.</p>
                <div class="modal-action">
                    <button type="button" class="btn btn-secondary" on:click={() => showDeleteConfirmation = false}>Cancel</button>
                    <button type="button" class="btn btn-error" on:click={deleteStatute}>Delete</button>
                </div>
            </div>
        </div>
    {/if}
</div>