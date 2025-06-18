<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import type { Criminal, Statute } from '$lib/data/types';

    // Explicitly define PageData type to resolve TypeScript errors
    interface PageData {
        criminals: Criminal[];
        statutes: Statute[];
    }

    export let data: PageData;

    let criminals: Criminal[] = data.criminals;
    let statutes: Statute[] = data.statutes;

    let name = '';
    let description = '';
    let selectedStatuteId: number | undefined;
    let selectedCriminalId: number | undefined;

    async function handleSubmit() {
        if (!name || selectedStatuteId === undefined || selectedCriminalId === undefined) {
            alert('Please provide a crime name, select a statute, and select a criminal.');
            return;
        }

        const response = await fetch('/api/crimes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                description,
                statuteId: selectedStatuteId,
                criminalId: selectedCriminalId
            })
        });

        if (response.ok) {
            alert('Crime created successfully!');
            goto('/crimes/manage');
        } else {
            const errorData = await response.json();
            alert(`Failed to create crime: ${errorData.message || response.statusText}`);
        }
    }
</script>

<svelte:head>
    <title>WardenNet - New Crime</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mt-4 text-dark">
    <h1 class="mb-4 text-center text-primary">Add New Crime</h1>
    <form on:submit|preventDefault={handleSubmit} use:enhance>
        <div class="mb-3">
            <label for="name" class="form-label">Crime Name</label>
            <input type="text" class="form-control" id="name" name="name" bind:value={name} required />
        </div>

        <div class="mb-3">
            <label for="description" class="form-label">Description (Optional)</label>
            <textarea class="form-control" id="description" name="description" bind:value={description} rows="3"></textarea>
        </div>

        <div class="mb-3">
            <label for="statuteSelect" class="form-label">Link to Statute</label>
            <select class="form-select" id="statuteSelect" bind:value={selectedStatuteId} required>
                <option value={undefined} disabled>Select a Statute</option>
                {#each statutes as statute}
                    <option value={statute.id}>{statute.name} ({statute.sectionNumber})</option>
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

        <button type="submit" class="btn btn-primary w-100">Add Crime</button>
    </form>
</div>