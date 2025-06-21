<script lang="ts">
    import { userSessionStore } from '$lib/auth/userStore';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import CaseCard from '$lib/components/+CaseCard.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    $: if (!$userSessionStore?.user) {
        goto('/login');
    }

    // Redirect to /account if on /dashboard
    onMount(() => {
        if ($page.url.pathname === '/dashboard') {
            goto('/account');
        }
    });

    let files: FileList;
    let uploadMessage = '';
    let uploadError = '';

    async function handleFileUpload() {
        uploadMessage = '';
        uploadError = '';

        if (!files || files.length === 0) {
            uploadError = 'Please select files to upload.';
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                uploadMessage = 'Files uploaded successfully!';
                // Optionally, clear the file input
                const fileInput = document.getElementById('fileInput') as HTMLInputElement;
                if (fileInput) {
                    fileInput.value = '';
                }
            } else {
                const errorData = await response.json();
                uploadError = errorData.message || 'File upload failed.';
            }
        } catch (error: any) {
            uploadError = error.message || 'An unexpected error occurred during upload.';
        }
    }
</script>

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header text-center">
                    <h3>Dashboard</h3>
                </div>
                <div class="card-body">
                    {#if $userSessionStore?.user}
                        <p>Welcome, {$userSessionStore.user.name}!</p>
                        <p>Your email: {$userSessionStore.user.email}</p>

                        <h4 class="mt-4">File Upload</h4>
                        {#if uploadMessage}
                            <div class="alert alert-success" role="alert">
                                {uploadMessage}
                            </div>
                        {/if}
                        {#if uploadError}
                            <div class="alert alert-danger" role="alert">
                                {uploadError}
                            </div>
                        {/if}
                        <form on:submit|preventDefault={handleFileUpload}>
                            <div class="mb-3">
                                <label for="fileInput" class="form-label">Select files:</label>
                                <input
                                    type="file"
                                    class="form-control"
                                    id="fileInput"
                                    multiple
                                    bind:files
                                />
                            </div>
                            <button type="submit" class="btn btn-success">Upload Files</button>
                        </form>
                    {:else}
                        <p>You are not logged in. Please <a href="/login">login</a>.</p>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <div class="flex gap-4">
            <a href="/cases/new" class="btn btn-primary">New Case</a>
            <a href="/criminals/new" class="btn btn-secondary">New POI</a>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Recent Cases -->
        <div class="card">
            <h2 class="card-header">Recent Cases</h2>
            <div class="card-body">
                {#if data.recentCases?.length}
                    <div class="grid gap-4">
                        {#each data.recentCases as caseItem}
                            <CaseCard caseItem={caseItem as any} />
                        {/each}
                    </div>
                {:else}
                    <p>No recent cases.</p>
                {/if}
            </div>
        </div>

        <!-- Recent POIs -->
        <div class="card">
            <h2 class="card-header">Recent POIs</h2>
            <div class="card-body">
                {#if data.recentCriminals?.length}
                    <div class="masonry-grid">
                        {#each data.recentCriminals as criminal}
                            <div class="criminal-card">
                                {#if criminal.photoUrl}
                                    <img src={criminal.photoUrl} alt={`${criminal.firstName} ${criminal.lastName}`} />
                                {/if}
                                <div class="criminal-info">
                                    <h3>{criminal.firstName} {criminal.lastName}</h3>
                                    <p class="text-sm text-gray-600">{criminal.status}</p>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p>No recent POIs.</p>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .masonry-grid {
        columns: 2 200px;
        column-gap: 1rem;
    }

    .criminal-card {
        break-inside: avoid;
        margin-bottom: 1rem;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .criminal-card img {
        width: 100%;
        height: auto;
        object-fit: cover;
    }

    .criminal-info {
        padding: 1rem;
    }
</style>