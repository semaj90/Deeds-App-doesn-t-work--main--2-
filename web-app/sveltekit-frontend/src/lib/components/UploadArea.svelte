<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let onUpload: (files: FileList) => void = () => {};
  export let acceptedTypes: string = '.pdf,.jpg,.jpeg,.png,.mp4,.avi,.mov,.mp3,.wav';
  export let maxFiles: number = 10;
  
  const dispatch = createEventDispatcher();
  
  let isDragOver = false;
  let isUploading = false;
  let uploadProgress = 0;
  let files: FileList | null = null;
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
  }
  
  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles) {
      await processFiles(droppedFiles);
    }
  }
  
  async function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      await processFiles(target.files);
    }
  }
  
  async function processFiles(fileList: FileList) {
    if (fileList.length === 0) return;
    
    files = fileList;
    isUploading = true;
    uploadProgress = 0;
    
    try {
      // Validate files
      const validFiles = Array.from(fileList).filter(file => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return acceptedTypes.includes(extension);
      });
      
      if (validFiles.length === 0) {
        throw new Error('No valid files found');
      }
      
      if (validFiles.length > maxFiles) {
        throw new Error(`Too many files. Maximum ${maxFiles} allowed.`);
      }
      
      // Process each file
      const results = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        uploadProgress = ((i + 1) / validFiles.length) * 100;
        
        // Auto-detect file type and route to appropriate API
        const result = await uploadFile(file);
        results.push(result);
      }
      
      dispatch('upload-complete', { files: validFiles, results });
      onUpload(fileList);
        } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch('upload-error', { error: errorMessage });
    } finally {
      isUploading = false;
      files = null;
    }
  }
  
  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
      // Auto-detect API endpoint based on file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    let endpoint = '/api/parse/';
    
    if (extension && ['pdf'].includes(extension)) {
      endpoint += 'pdf';
    } else if (extension && ['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      endpoint += 'image';
    } else if (extension && ['mp4', 'avi', 'mov', 'webm'].includes(extension)) {
      endpoint += 'video';
    } else if (extension && ['mp3', 'wav', 'ogg'].includes(extension)) {
      endpoint += 'audio';
    } else {
      throw new Error(`Unsupported file type: ${extension || 'unknown'}`);
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to process ${file.name}`);
    }
    
    return await response.json();
  }
  
  function getFileIcon(fileName: string) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'bi-file-earmark-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'bi-file-earmark-image';
      case 'mp4':
      case 'avi':
      case 'mov': return 'bi-file-earmark-play';
      case 'mp3':
      case 'wav': return 'bi-file-earmark-music';
      default: return 'bi-file-earmark';
    }
  }
</script>

<div class="upload-area">
  <!-- Drop Zone -->
  <div 
    class="drop-zone border border-2 border-dashed rounded p-5 text-center position-relative"
    class:border-primary={isDragOver}
    class:bg-light={isDragOver}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    role="button"
    tabindex="0"
  >
    {#if isUploading}
      <!-- Upload Progress -->
      <div class="upload-progress">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Uploading...</span>
        </div>
        <h5>Processing Files...</h5>
        <div class="progress mt-3">
          <div 
            class="progress-bar progress-bar-striped progress-bar-animated"
            style="width: {uploadProgress}%"
          ></div>
        </div>
        <small class="text-muted mt-2 d-block">{Math.round(uploadProgress)}% complete</small>
      </div>
    {:else if files}
      <!-- File Preview -->
      <div class="file-preview">
        <h5 class="text-success mb-3">
          <i class="bi bi-check-circle me-2"></i>
          Files Ready for Processing
        </h5>
        <div class="row">
          {#each Array.from(files) as file}
            <div class="col-md-6 col-lg-4 mb-2">
              <div class="card">
                <div class="card-body p-2">
                  <i class="{getFileIcon(file.name)} me-2"></i>
                  <small>{file.name}</small>
                  <br>
                  <small class="text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Default Drop Zone -->
      <div class="default-state">
        <i class="bi bi-cloud-upload display-1 text-muted mb-3"></i>
        <h5>Drag & Drop Evidence Files</h5>
        <p class="text-muted mb-4">
          Or click to browse files
        </p>
        
        <!-- File Input -->
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          class="d-none"
          id="file-input"
          on:change={handleFileInput}
        >
        
        <label for="file-input" class="btn btn-outline-primary">
          <i class="bi bi-folder2-open me-2"></i>
          Browse Files
        </label>
        
        <div class="mt-3">
          <small class="text-muted">
            Supported: PDF, Images, Videos, Audio
          </small>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .drop-zone {
    min-height: 200px;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .drop-zone:hover {
    border-color: var(--bs-primary) !important;
    background-color: var(--bs-light);
  }
  
  .upload-progress {
    animation: fadeIn 0.3s ease-in;
  }
  
  .file-preview {
    animation: slideUp 0.3s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
</style>
