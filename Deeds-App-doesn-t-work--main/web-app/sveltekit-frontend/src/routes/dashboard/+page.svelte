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

    let files: FileList;
    let uploadMessage = '';
    let uploadError = '';
    let dragOver = false;
    let legalQuery = '';

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

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        dragOver = true;
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        dragOver = false;
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        dragOver = false;
        const dragFiles = event.dataTransfer?.files;
        if (dragFiles && dragFiles.length > 0) {
          files = dragFiles;
            handleFileUpload();
        }
    }

    async function askLegalQuestion() {
        if (!legalQuery.trim()) return;
        goto(`/ai/search?q=${encodeURIComponent(legalQuery)}`);
    }

    function setQuickQuery(query: string) {
        legalQuery = query;
        askLegalQuestion();
    }
</script>

<div class="container-fluid py-4">
    <!-- Welcome Header -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="card bg-primary text-white">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h2 class="mb-2">
                                <i class="bi bi-shield-check me-2"></i>
                                Welcome back, {$userSessionStore?.user?.name || 'Prosecutor'}!
                            </h2>
                            <p class="mb-0 opacity-75">
                                What legal case are you working on today? Let our AI assist with your investigation.
                            </p>
                        </div>
                        <div class="col-md-4 text-md-end">
                            <div class="d-flex gap-2 justify-content-md-end">
                                <a href="/cases/new" class="btn btn-light">
                                    <i class="bi bi-plus-circle me-1"></i>New Case
                                </a>
                                <a href="/profile" class="btn btn-outline-light">
                                    <i class="bi bi-person me-1"></i>View Stats
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- AI Legal Assistant Section -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-gradient-primary text-white">
                    <h4 class="mb-0">
                        <i class="bi bi-robot me-2"></i>
                        AI Legal Assistant
                    </h4>
                    <small class="opacity-75">Ask questions, analyze evidence, generate reports</small>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="legalQuery" class="form-label fw-semibold">
                                <i class="bi bi-chat-quote me-1"></i>
                                Ask the AI a legal question:
                            </label>
                            <div class="input-group">
                                <input 
                                    type="text" 
                                    id="legalQuery"
                                    class="form-control" 
                                    placeholder="Is possession of marijuana legal in California?"
                                    bind:value={legalQuery}
                                    on:keypress={(e) => e.key === 'Enter' && askLegalQuestion()}
                                />
                                <button 
                                    class="btn btn-primary" 
                                    type="button"
                                    on:click={askLegalQuestion}
                                >
                                    <i class="bi bi-search"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">
                                <i class="bi bi-lightning me-1"></i>
                                Quick Actions:
                            </label>
                            <div class="d-flex flex-wrap gap-2">
                                <button 
                                    class="btn btn-outline-primary btn-sm"
                                    on:click={() => setQuickQuery("Is this legal or illegal and why?")}
                                >
                                    <i class="bi bi-scale me-1"></i>Legal Analysis
                                </button>
                                <button 
                                    class="btn btn-outline-success btn-sm"
                                    on:click={() => setQuickQuery("Generate a case report for my investigation")}
                                >
                                    <i class="bi bi-file-text me-1"></i>Generate Report
                                </button>
                                <button 
                                    class="btn btn-outline-warning btn-sm"
                                    on:click={() => setQuickQuery("Analyze uploaded evidence for prosecution")}
                                >
                                    <i class="bi bi-microscope me-1"></i>Evidence Analysis
                                </button>
                                <button 
                                    class="btn btn-outline-info btn-sm"
                                    on:click={() => setQuickQuery("What's the best prosecution strategy?")}
                                >
                                    <i class="bi bi-briefcase me-1"></i>Strategy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Evidence Upload & Analysis Section -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-gradient-success text-white">
                    <h4 class="mb-0">
                        <i class="bi bi-cloud-upload me-2"></i>
                        Evidence Upload & Scene Analysis
                    </h4>
                    <small class="opacity-75">Upload evidence, analyze scenes, extract insights with AI</small>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <!-- File Upload Area -->
                            <div 
                                class="drop-zone border-2 border-dashed rounded p-4 text-center"
                                class:border-success={dragOver}
                                class:bg-light={!dragOver}
                                class:bg-success-subtle={dragOver}
                                on:dragover={handleDragOver}
                                on:dragleave={handleDragLeave}
                                on:drop={handleDrop}
                            >
                                <div class="mb-3">
                                    <i class="bi bi-camera-video display-4 text-muted"></i>
                                </div>
                                <h5>Upload Evidence Files</h5>
                                <p class="text-muted mb-3">
                                    Drag & drop photos, videos, documents, or click to browse
                                </p>
                                
                                <input
                                    type="file"
                                    class="form-control mb-3"
                                    id="fileInput"
                                    multiple
                                    accept="image/*,video/*,.pdf,.doc,.docx"
                                    bind:files
                                    on:change={handleFileUpload}
                                />
                                
                                <button 
                                    type="button" 
                                    class="btn btn-success"
                                    on:click={handleFileUpload}
                                    disabled={!files || files.length === 0}
                                >
                                    <i class="bi bi-upload me-2"></i>
                                    Upload Files
                                </button>
                            </div>
                            
                            {#if uploadMessage}
                                <div class="alert alert-success mt-3" role="alert">
                                    <i class="bi bi-check-circle me-2"></i>
                                    {uploadMessage}
                                </div>
                            {/if}
                            {#if uploadError}
                                <div class="alert alert-danger mt-3" role="alert">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    {uploadError}
                                </div>
                            {/if}
                        </div>
                        
                        <div class="col-md-4">
                            <h6 class="fw-semibold mb-3">
                                <i class="bi bi-gear me-1"></i>
                                Analysis Options:
                            </h6>
                            <div class="list-group list-group-flush">
                                <button class="list-group-item list-group-item-action d-flex align-items-center">
                                    <i class="bi bi-camera me-2 text-primary"></i>
                                    <div>
                                        <strong>Scene Analysis</strong>
                                        <br><small class="text-muted">AI-powered crime scene understanding</small>
                                    </div>
                                </button>
                                <button class="list-group-item list-group-item-action d-flex align-items-center">
                                    <i class="bi bi-fingerprint me-2 text-success"></i>
                                    <div>
                                        <strong>Object Detection</strong>
                                        <br><small class="text-muted">Identify evidence in images/videos</small>
                                    </div>
                                </button>
                                <button class="list-group-item list-group-item-action d-flex align-items-center">
                                    <i class="bi bi-file-text me-2 text-warning"></i>
                                    <div>
                                        <strong>Document OCR</strong>
                                        <br><small class="text-muted">Extract text from documents</small>
                                    </div>
                                </button>
                                <button class="list-group-item list-group-item-action d-flex align-items-center">
                                    <i class="bi bi-graph-up me-2 text-info"></i>
                                    <div>
                                        <strong>Pattern Analysis</strong>
                                        <br><small class="text-muted">Find connections across cases</small>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Stats and Recent Activity -->
    <div class="row mb-4">
        <div class="col-lg-8">
            <!-- Recent Cases -->
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="bi bi-folder2-open me-2"></i>
                        Recent Cases
                    </h5>
                    <a href="/cases" class="btn btn-outline-primary btn-sm">View All</a>
                </div>
                <div class="card-body">
                    {#if data.recentCases?.length}
                        <div class="row">
                            {#each data.recentCases as caseItem}
                                <div class="col-md-6 mb-3">
                                    <CaseCard caseItem={caseItem as any} />
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-4">
                            <i class="bi bi-folder-plus display-4 text-muted"></i>
                            <h6 class="mt-2">No recent cases</h6>
                            <p class="text-muted small">Start by creating your first case</p>
                            <a href="/cases/new" class="btn btn-primary">
                                <i class="bi bi-plus-circle me-1"></i>Create Case
                            </a>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        
        <div class="col-lg-4">
            <!-- Quick Stats -->
            <div class="card h-100">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-speedometer2 me-2"></i>
                        Quick Overview
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-6">
                            <div class="card border-0 bg-primary text-white text-center">
                                <div class="card-body py-2">
                                    <h4 class="mb-0">{data.recentCases?.length || 0}</h4>
                                    <small>Active Cases</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="card border-0 bg-success text-white text-center">
                                <div class="card-body py-2">
                                    <h4 class="mb-0">{data.recentCriminals?.length || 0}</h4>
                                    <small>POIs</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-12">
                            <hr class="my-2">
                            <h6 class="mb-2">Today's Priority:</h6>
                            <div class="d-grid gap-2">
                                <a href="/cases" class="btn btn-outline-primary btn-sm">
                                    <i class="bi bi-list-check me-1"></i>Review Cases
                                </a>
                                <a href="/evidence" class="btn btn-outline-success btn-sm">
                                    <i class="bi bi-camera-video me-1"></i>Manage Evidence
                                </a>
                                <a href="/upload" class="btn btn-outline-warning btn-sm">
                                    <i class="bi bi-upload me-1"></i>Upload Evidence
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

