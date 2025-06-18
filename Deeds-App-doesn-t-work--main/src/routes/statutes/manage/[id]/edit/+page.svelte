<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import type { Statute } from '$lib/data/types';

    // Explicitly define PageData type to resolve TypeScript errors
    interface PageData {
        statute: Statute;
    }

    export let data: PageData;

    let statuteItem: Statute = data.statute;

    async function handleSubmit() {
        const response = await fetch(`/api/statutes/${statuteItem.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: statuteItem.name,
                description: statuteItem.description,
                sectionNumber: statuteItem.sectionNumber
            })
        });

        if (response.ok) {
            alert('Statute updated successfully!');
            goto(`/statutes/manage/${statuteItem.id}`);
        } else {
            const errorData = await response.json();
            alert(`Failed to update statute: ${errorData.message || response.statusText}`);
        }
    }
</script>

<svelte:head>
    <title>WardenNet - Edit Statute: {statuteItem.name}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mx-auto p-4">
    <div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
        <div class="card-body">
            <h1 class="card-title text-2xl font-bold mb-6 text-center">Edit Statute: {statuteItem.name}</h1>
            <form on:submit|preventDefault={handleSubmit} use:enhance class="space-y-4">
                <div class="form-control">
                    <label for="name" class="label">
                        <span class="label-text">Statute Name</span>
                    </label>
                    <input type="text" class="input input-bordered w-full" id="name" name="name" bind:value={statuteItem.name} required />
                </div>

                <div class="form-control">
                    <label for="sectionNumber" class="label">
                        <span class="label-text">Section Number</span>
                    </label>
                    <input type="text" class="input input-bordered w-full" id="sectionNumber" name="sectionNumber" bind:value={statuteItem.sectionNumber} required />
                </div>

                <div class="form-control">
                    <label for="description" class="label">
                        <span class="label-text">Description (Optional)</span>
                    </label>
                    <textarea class="textarea textarea-bordered h-24" id="description" name="description" bind:value={statuteItem.description}></textarea>
                </div>

                <div class="flex justify-end gap-2 mt-6">
                    <button type="submit" class="btn btn-primary">Update Statute</button>
                    <a href="/statutes/manage/{statuteItem.id}" class="btn btn-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div>