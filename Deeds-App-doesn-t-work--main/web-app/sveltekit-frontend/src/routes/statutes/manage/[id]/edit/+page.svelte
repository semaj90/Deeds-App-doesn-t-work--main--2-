<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import type { Statute } from '$lib/data/types';

    // Explicitly define PageData type to resolve TypeScript errors
    interface PageData {
      statute: Statute;
    }

    export let data: PageData;
    // Use correct property names from Drizzle schema
    let statute = data.statute;
    let statuteTitle = statute.title;
    let statuteContent = statute.content;
    let statuteSectionNumber = statute.meta?.sectionNumber;

    async function handleSubmit() {
        const response = await fetch(`/api/statutes/${statute.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: statuteTitle,
                content: statuteContent,
                meta: { ...statute.meta, sectionNumber: statuteSectionNumber }
            })
        });

        if (response.ok) {
            alert('Statute updated successfully!');
            goto(`/statutes/manage/${statute.id}`);
        } else {
            const errorData = await response.json();
            alert(`Failed to update statute: ${errorData.message || response.statusText}`);
        }
    }
</script>

<svelte:head>
    <title>WardenNet - Edit Statute: {statuteTitle}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</svelte:head>

<div class="container mt-4 text-dark">
    <h1 class="mb-4 text-center text-primary">Edit Statute: {statuteTitle}</h1>
    <form on:submit|preventDefault={handleSubmit} use:enhance>
        <div class="mb-3">
            <label for="title" class="form-label">Statute Title</label>
            <input type="text" class="form-control" id="title" name="title" bind:value={statuteTitle} required />
        </div>

        <div class="mb-3">
            <label for="sectionNumber" class="form-label">Section Number</label>
            <input type="text" class="form-control" id="sectionNumber" name="sectionNumber" bind:value={statuteSectionNumber} />
        </div>

        <div class="mb-3">
            <label for="content" class="form-label">Content (Optional)</label>
            <textarea class="form-control" id="content" name="content" bind:value={statuteContent} rows="5"></textarea>
        </div>

        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
            <button type="submit" class="btn btn-primary me-md-2">Update Statute</button>
            <a href="/statutes/manage/{statute.id}" class="btn btn-secondary">Cancel</a>
        </div>
    </form>
</div>