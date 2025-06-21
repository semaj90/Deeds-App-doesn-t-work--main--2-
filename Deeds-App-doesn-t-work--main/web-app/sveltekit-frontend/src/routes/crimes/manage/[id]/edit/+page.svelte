<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import type { Crime, Criminal, Statute } from '$lib/data/types';

    // Explicitly define PageData type to resolve TypeScript errors
    interface PageData {
        crime: Crime & { criminal: Criminal; statute: Statute };
        criminals: Criminal[];
        statutes: Statute[];
    }

    export let data: PageData;

    let crimeItem: Crime & { criminal: Criminal; statute: Statute } = data.crime;
    let criminals: Criminal[] = data.criminals;
    let statutes: Statute[] = data.statutes;

    let selectedStatuteId: string | null = crimeItem.statuteId;
    let selectedCriminalId: string | null = crimeItem.criminalId;

    async function handleSubmit() {
        if (!crimeItem.title || selectedStatuteId === undefined || selectedCriminalId === undefined) {
            alert('Please provide a crime title, select a statute, and select a criminal.');
            return;
        }

        const response = await fetch(`/api/crimes/${crimeItem.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: crimeItem.title,
                description: crimeItem.description,
                statuteId: selectedStatuteId,
                criminalId: selectedCriminalId
            })
        });

        if (response.ok) {
            alert('Crime updated successfully!');
            goto(`/crimes/manage/${crimeItem.id}`);
        } else {
            const errorData = await response.json();
            alert(`Failed to update crime: ${errorData.message || response.statusText}`);
        }
    }
</script>

<svelte:head>
    <title>WardenNet - Edit Crime: {crimeItem.title}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mt-4 text-dark">
    <h1 class="mb-4 text-center text-primary">Edit Crime: {crimeItem.title}</h1>
    <form on:submit|preventDefault={handleSubmit} use:enhance>
        <div class="mb-3">
            <label for="title" class="form-label">Crime Title</label>
            <input type="text" class="form-control" id="title" name="title" bind:value={crimeItem.title} required />
        </div>

        <div class="mb-3">
            <label for="description" class="form-label">Description (Optional)</label>
            <textarea class="form-control" id="description" name="description" bind:value={crimeItem.description} rows="3"></textarea>
        </div>

        <div class="mb-3">
            <label for="statuteSelect" class="form-label">Link to Statute</label>
            <select class="form-select" id="statuteSelect" bind:value={selectedStatuteId} required>
                <option value={undefined} disabled>Select a Statute</option>
                {#each statutes as statute}
                    <option value={statute.id}>{statute.title}</option>
                {/each}
            </select>
        </div>

        <div class="mb-3">
            <label for="criminalSelect" class="form-label">Link to Criminal</label>
            <select class="form-select" id="criminalSelect" bind:value={selectedCriminalId} required>
                <option value={undefined} disabled>Select a Criminal</option>
                {#each criminals as criminal}
                    <option value={criminal.id}>{criminal.firstName} {criminal.lastName}</option>
                {/each}
            </select>
        </div>

        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
            <button type="submit" class="btn btn-primary me-md-2">Update Crime</button>
            <a href="/crimes/manage/{crimeItem.id}" class="btn btn-secondary">Cancel</a>
        </div>
    </form>
</div>