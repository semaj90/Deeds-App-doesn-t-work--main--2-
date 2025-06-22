<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let files: FileList | null = null;
  let uploadProgress = 0;
  let uploadStatus = '';
  let uploadError = '';
  let dragOver = false;
  let analysisType = 'scene_analysis';
  let autoAnalyze = true;
  let uploadedFiles: any[] = [];

  async function handleFileUpload() {
    if (!files || files.length === 0) {
      uploadError = 'Please select files to upload';
      return;
    }

    uploadError = '';
    uploadStatus = 'Uploading...';
    uploadProgress = 0;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('analysisType', analysisType);
    formData.append('autoAnalyze', autoAnalyze.toString());

    try {
      const response = await fetch('/api/evidence/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        uploadStatus = 'Upload successful!';
        uploadProgress = 100;
        uploadedFiles = result.files || [];
        
        // Clear file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        files = null;

        if (autoAnalyze) {
          uploadStatus = 'Upload complete. Starting AI analysis...';
          setTimeout(() => {
            goto('/evidence');
          }, 2000);
        }
      } else {
        const errorData = await response.json();
        uploadError = errorData.message || 'Upload failed';
        uploadStatus = '';
      }
    } catch (error: any) {
      uploadError = error.message || 'Upload failed';
      uploadStatus = '';
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
    files = event.dataTransfer?.files || null;
  }

  function getFileIcon(fileType: string) {
    if (fileType.startsWith('image/')) return 'bi-image';
    if (fileType.startsWith('video/')) return 'bi-camera-video';
    if (fileType.includes('pdf')) return 'bi-file-pdf';
    if (fileType.includes('document') || fileType.includes('word')) return 'bi-file-word';
    return 'bi-file-earmark';
  }
</script>

<svelte:head>
  <title>Evidence Upload - Legal Intelligence CMS</title>
</svelte:head>

<div class="container-fluid py-4">
  <!-- Header -->
  <div class="row mb-4">
    <div class="col-12">
      <div class="card bg-gradient text-white" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
        <div class="card-body">
          <h1 class="h2 mb-2">
            <i class="bi bi-cloud-upload me-2"></i>
            Evidence Upload & Analysis
          </h1>
          <p class="mb-0 opacity-75">
            Upload evidence, analyze scenes, extract insights with AI-powered analysis
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <!-- Upload Controls -->
    <div class="col-lg-8 mb-4">
      <div class="card h-100">
        <div class="card-header">
          <h3 class="mb-0">
            <i class="bi bi-upload me-2"></i>
            File Upload
          </h3>
        </div>
        <div class="card-body">
          <!-- Drag & Drop Zone -->
          <div 
            class="upload-zone border-2 border-dashed rounded p-5 text-center mb-4"
            class:border-success={dragOver}
            class:bg-success-subtle={dragOver}
            class:border-secondary={!dragOver}
            class:bg-light={!dragOver}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleDrop}
            role="button"
            tabindex="0"
          >
            <div class="mb-3">
              <i class="bi bi-cloud-upload display-1 text-muted"></i>
            </div>
            <h4>Drop Evidence Files Here</h4>
            <p class="text-muted mb-3">
              Or click to browse for photos, videos, documents
            </p>
            
            <input
              type="file"
              id="fileInput"
              class="form-control mb-3"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              bind:files
              style="max-width: 400px; margin: 0 auto;"
            />
            
            {#if files && files.length > 0}
              <div class="mt-3">
                <h6>Selected Files ({files.length}):</h6>
                <div class="row g-2">
                  {#each Array.from(files) as file}
                    <div class="col-md-6">
                      <div class="card card-body py-2">
                        <div class="d-flex align-items-center">
                          <i class="bi {getFileIcon(file.type)} me-2 text-primary"></i>
                          <div class="flex-grow-1 text-start">
                            <div class="small fw-semibold">{file.name}</div>
                            <div class="text-muted" style="font-size: 0.75rem;">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- Upload Progress -->
          {#if uploadStatus}
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small">{uploadStatus}</span>
                <span class="small">{uploadProgress}%</span>
              </div>
              <div class="progress">
                <div 
                  class="progress-bar bg-success" 
                  style="width: {uploadProgress}%"
                  role="progressbar"
                ></div>
              </div>
            </div>
          {/if}

          {#if uploadError}
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {uploadError}
            </div>
          {/if}

          <!-- Upload Button -->
          <button 
            class="btn btn-success btn-lg"
            on:click={handleFileUpload}
            disabled={!files || files.length === 0 || uploadStatus.includes('Uploading')}
          >
            <i class="bi bi-upload me-2"></i>
            Upload Evidence
          </button>
        </div>
      </div>
    </div>

    <!-- Analysis Settings -->
    <div class="col-lg-4 mb-4">
      <div class="card h-100">
        <div class="card-header">
          <h3 class="mb-0">
            <i class="bi bi-robot me-2"></i>
            AI Analysis Settings
          </h3>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label for="analysisType" class="form-label fw-semibold">Analysis Type:</label>
            <select id="analysisType" class="form-select" bind:value={analysisType}>
              <option value="scene_analysis">Crime Scene Analysis</option>
              <option value="object_detection">Object Detection</option>
              <option value="document_ocr">Document OCR</option>
              <option value="pattern_analysis">Pattern Analysis</option>
              <option value="legal_significance">Legal Significance Assessment</option>
              <option value="facial_recognition">Facial Recognition</option>
              <option value="metadata_extraction">Metadata Extraction</option>
            </select>
            <div class="form-text">
              Choose the type of AI analysis to perform on uploaded evidence
            </div>
          </div>

          <div class="form-check mb-3">
            <input 
              class="form-check-input" 
              type="checkbox" 
              id="autoAnalyze"
              bind:checked={autoAnalyze}
            />
            <label class="form-check-label" for="autoAnalyze">
              Auto-analyze after upload
            </label>
            <div class="form-text">
              Automatically start AI analysis when upload completes
            </div>
          </div>

          <hr />

          <h6 class="mb-3">Analysis Capabilities:</h6>
          <div class="list-group list-group-flush">
            <div class="list-group-item px-0 py-2">
              <i class="bi bi-camera me-2 text-primary"></i>
              <strong>Scene Understanding</strong>
              <br><small class="text-muted">Identify crime scene elements</small>
            </div>
            <div class="list-group-item px-0 py-2">
              <i class="bi bi-search me-2 text-success"></i>
              <strong>Object Detection</strong>
              <br><small class="text-muted">Find weapons, drugs, evidence</small>
            </div>
            <div class="list-group-item px-0 py-2">
              <i class="bi bi-file-text me-2 text-warning"></i>
              <strong>Document Processing</strong>
              <br><small class="text-muted">Extract text and metadata</small>
            </div>
            <div class="list-group-item px-0 py-2">
              <i class="bi bi-person-check me-2 text-info"></i>
              <strong>Person Identification</strong>
              <br><small class="text-muted">Facial recognition analysis</small>
            </div>
          </div>

          <hr />

          <div class="d-grid gap-2">
            <a href="/evidence" class="btn btn-outline-primary">
              <i class="bi bi-folder2-open me-2"></i>
              View Evidence Manager
            </a>
            <a href="/ai/search" class="btn btn-outline-info">
              <i class="bi bi-robot me-2"></i>
              AI Legal Assistant
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Recently Uploaded Files -->
  {#if uploadedFiles.length > 0}
    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h3 class="mb-0">
              <i class="bi bi-check-circle me-2 text-success"></i>
              Recently Uploaded
            </h3>
          </div>
          <div class="card-body">
            <div class="row g-3">
              {#each uploadedFiles as file}
                <div class="col-md-4">
                  <div class="card border-success">
                    <div class="card-body">
                      <div class="d-flex align-items-center mb-2">
                        <i class="bi {getFileIcon(file.type)} me-2 text-success fs-4"></i>
                        <div>
                          <h6 class="mb-0">{file.name}</h6>
                          <small class="text-muted">{file.size} • {file.type}</small>
                        </div>
                      </div>
                      
                      {#if file.analysis}
                        <div class="mt-2">
                          <span class="badge bg-success">
                            <i class="bi bi-check-circle me-1"></i>
                            AI Analyzed
                          </span>
                        </div>
                      {:else if autoAnalyze}
                        <div class="mt-2">
                          <span class="badge bg-warning">
                            <i class="bi bi-hourglass-split me-1"></i>
                            Analysis Pending
                          </span>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .upload-zone {
    transition: all 0.3s ease;
    cursor: pointer;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .upload-zone:hover {
    border-color: #28a745 !important;
    background-color: rgba(40, 167, 69, 0.05) !important;
  }
  
  .card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    transition: all 0.3s ease;
  }
  
  .card:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  .list-group-item {
    border: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  }
  
  .progress {
    height: 8px;
    border-radius: 4px;
  }
</style>
