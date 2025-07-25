<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let onUpload: (files: FileList) => void = () => {};
  export let acceptedTypes: string = '.pdf,.jpg,.jpeg,.png,.mp4,.avi,.mov,.mp3,.wav';
  export let maxFiles: number = 10;
  export let maxFileSize: number = 50 * 1024 * 1024; // 50MB default
  export let disabled: boolean = false;
  export let multiple: boolean = true;
  export let showProgress: boolean = true;
  export let showPreview: boolean = true;
  export let allowedMimeTypes: string[] = [
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/avi', 'video/mov', 'video/webm',
    'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'
  ];
  export let autoUpload: boolean = false;
  export let uploadEndpoint: string = '/api/parse/';
  export let retryAttempts: number = 3;
  export let chunkSize: number = 1024 * 1024; // 1MB chunks for large files (future use)
  
  // Prevent unused export warning - this is for future chunked upload implementation
  $: void chunkSize;
  
  interface UploadResult {
    file: File;
    result?: any;
    error?: string;
    success: boolean;
    progress?: number;
    retryCount?: number;
  }
  
  const dispatch = createEventDispatcher<{
    'upload-start': { files: FileList };
    'upload-progress': { progress: number; file: File };
    'upload-complete': { files: File[]; results: any[]; failed: number };
    'upload-error': { error: string; errors: string[] };
    'file-start': { file: File; index: number };
    'file-progress': { file: File; progress: number; index: number };
    'file-success': { file: File; result: any; index: number };
    'file-error': { file: File; error: string; index: number };
    'files-selected': { files: FileList };
    'validation-error': { errors: string[] };
  }>();
  
  let isDragOver = false;
  let isUploading = false;
  let uploadProgress = 0;
  let files: FileList | null = null;
  let uploadErrors: string[] = [];
  let uploadResults: UploadResult[] = [];
  let totalFiles = 0;
  let processedFiles = 0;
  let dragCounter = 0; // Track drag enter/leave events
  let fileInput: HTMLInputElement;
  
  // Debounce timer for drag events
  let dragLeaveTimer: NodeJS.Timeout;
  
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    dragCounter++;
    if (!isDragOver) {
      isDragOver = true;
      clearTimeout(dragLeaveTimer);
    }
  }
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    // Ensure we're allowing the drop
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    dragCounter--;
    
    // Use a timer to handle rapid drag enter/leave events
    dragLeaveTimer = setTimeout(() => {
      if (dragCounter <= 0) {
        isDragOver = false;
        dragCounter = 0;
      }
    }, 50);
  }
  
  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset drag state
    isDragOver = false;
    dragCounter = 0;
    clearTimeout(dragLeaveTimer);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      dispatch('files-selected', { files: droppedFiles });
      
      if (autoUpload) {
        await processFiles(droppedFiles);
      } else {
        files = droppedFiles;
      }
    }
  }
  
  async function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0 && !disabled) {
      dispatch('files-selected', { files: target.files });
      
      if (autoUpload) {
        await processFiles(target.files);
      } else {
        files = target.files;
      }
    }
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      fileInput?.click();
    }
  }
  
  function browseFiles() {
    if (!disabled) {
      fileInput?.click();
    }
  }
  
  function clearFiles() {
    files = null;
    uploadErrors = [];
    uploadResults = [];
    uploadProgress = 0;
    processedFiles = 0;
    totalFiles = 0;
    
    // Reset file input
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  async function startUpload() {
    if (files && !isUploading) {
      await processFiles(files);
    }
  }
  
  function retryUpload() {
    if (files && !isUploading) {
      processFiles(files);
    }
  }
  
  function removeFile(index: number) {
    if (!files || isUploading) return;
    
    const fileArray = Array.from(files);
    fileArray.splice(index, 1);
    
    // Create new FileList-like object
    const dt = new DataTransfer();
    fileArray.forEach(file => dt.items.add(file));
    files = dt.files;
    
    if (files.length === 0) {
      clearFiles();
    }
  }
  
  async function processFiles(fileList: FileList) {
    if (fileList.length === 0) return;
    
    // Clear previous state
    uploadErrors = [];
    uploadResults = [];
    isUploading = true;
    uploadProgress = 0;
    totalFiles = fileList.length;
    processedFiles = 0;
    
    dispatch('upload-start', { files: fileList });
    
    try {
      // Validate files first
      const validationErrors = validateFiles(fileList);
      if (validationErrors.length > 0) {
        uploadErrors = validationErrors;
        dispatch('validation-error', { errors: validationErrors });
        throw new Error(validationErrors.join(', '));
      }
      
      const fileArray = Array.from(fileList);
      
      // Process files with better progress tracking and retry logic
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        let retryCount = 0;
        let success = false;
        let result: any = null;
        let lastError: string = '';
        
        dispatch('file-start', { file, index: i });
        
        // Retry logic
        while (!success && retryCount < retryAttempts) {
          try {
            result = await uploadFileWithProgress(file, (progress) => {
              dispatch('file-progress', { file, progress, index: i });
            });
            
            uploadResults.push({ file, result, success: true, retryCount });
            dispatch('file-success', { file, result, index: i });
            success = true;
            
          } catch (error) {
            retryCount++;
            lastError = error instanceof Error ? error.message : 'Unknown error';
            
            if (retryCount < retryAttempts) {
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
          }
        }
        
        if (!success) {
          uploadErrors = [...uploadErrors, `${file.name}: ${lastError} (failed after ${retryAttempts} attempts)`];
          uploadResults.push({ file, error: lastError, success: false, retryCount });
          dispatch('file-error', { file, error: lastError, index: i });
        }
        
        processedFiles = i + 1;
        uploadProgress = (processedFiles / totalFiles) * 100;
        dispatch('upload-progress', { progress: uploadProgress, file });
      }
      
      const successfulFiles = uploadResults.filter(r => r.success);
      const failedFiles = uploadResults.filter(r => !r.success);
      
      if (successfulFiles.length > 0) {
        dispatch('upload-complete', { 
          files: successfulFiles.map(r => r.file), 
          results: successfulFiles.map(r => r.result),
          failed: failedFiles.length
        });
        onUpload(fileList);
      }
      
      if (failedFiles.length > 0 && successfulFiles.length === 0) {
        throw new Error(`All ${failedFiles.length} files failed to upload`);
      }
      
    } catch (error) {
      console.error('Upload process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch('upload-error', { error: errorMessage, errors: uploadErrors });
    } finally {
      isUploading = false;
    }
  }
  
  function validateFiles(fileList: FileList): string[] {
    const errors: string[] = [];
    const fileArray = Array.from(fileList);
    
    // Check file count
    if (fileArray.length > maxFiles) {
      errors.push(`Too many files selected. Maximum ${maxFiles} allowed.`);
    }
    
    // Check each file
    fileArray.forEach((file, index) => {
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (${formatFileSize(file.size)}). Maximum ${formatFileSize(maxFileSize)} allowed.`);
      }
      
      // Check file type by extension
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.toLowerCase().includes(extension)) {
        errors.push(`${file.name}: Unsupported file type (${extension}). Allowed: ${acceptedTypes}`);
      }
      
      // Check MIME type for additional security
      if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid MIME type (${file.type})`);
      }
      
      // Check for empty files
      if (file.size === 0) {
        errors.push(`${file.name}: File is empty`);
      }
      
      // Basic file name validation
      if (file.name.length > 255) {
        errors.push(`${file.name}: Filename too long (max 255 characters)`);
      }
      
      // Check for potentially dangerous file names
      if (/[<>:"|?*\\\/]/.test(file.name)) {
        errors.push(`${file.name}: Filename contains invalid characters`);
      }
      
      // Check for suspicious file extensions
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar'];
      if (suspiciousExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
        errors.push(`${file.name}: Potentially unsafe file type`);
      }
      
      // Check for null bytes in filename (potential path traversal)
      if (file.name.includes('\0')) {
        errors.push(`${file.name}: Invalid filename characters detected`);
      }
    });
    
    // Check for duplicate files
    const duplicates = findDuplicateFiles(fileArray);
    if (duplicates.length > 0) {
      errors.push(`Duplicate files detected: ${duplicates.join(', ')}`);
    }
    
    return errors;
  }
  
  function findDuplicateFiles(files: File[]): string[] {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    
    files.forEach(file => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (seen.has(key)) {
        duplicates.push(file.name);
      } else {
        seen.set(key, file.name);
      }
    });
    
    return duplicates;
  }
  
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  async function uploadFileWithProgress(file: File, onProgress?: (progress: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Auto-detect API endpoint based on file type
      const endpoint = getUploadEndpoint(file);
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error occurred'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));
      
      // Set timeout (30 seconds)
      xhr.timeout = 30000;
      
      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  }
  
  function getUploadEndpoint(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension && ['pdf'].includes(extension)) {
      return `${uploadEndpoint}pdf`;
    } else if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return `${uploadEndpoint}image`;
    } else if (extension && ['mp4', 'avi', 'mov', 'webm'].includes(extension)) {
      return `${uploadEndpoint}video`;
    } else if (extension && ['mp3', 'wav', 'ogg', 'mpeg'].includes(extension)) {
      return `${uploadEndpoint}audio`;
    } else {
      throw new Error(`Unsupported file type: ${extension || 'unknown'}`);
    }
  }
  
  function getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'bi-file-earmark-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return 'bi-file-earmark-image';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'webm': return 'bi-file-earmark-play';
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'mpeg': return 'bi-file-earmark-music';
      default: return 'bi-file-earmark';
    }
  }
  
  function getFileTypeColor(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'text-danger';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return 'text-primary';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'webm': return 'text-info';
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'mpeg': return 'text-success';
      default: return 'text-secondary';
    }
  }
  
  function truncateFileName(fileName: string, maxLength: number = 25): string {
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop();
    const name = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = name.substring(0, maxLength - extension!.length - 4) + '...';
    
    return `${truncatedName}.${extension}`;
  }
</script>

<div class="upload-area" role="region" aria-label="File upload area">
  <!-- Drop Zone -->
  <div 
    class="drop-zone border border-2 border-dashed rounded p-4 text-center position-relative"
    class:border-primary={isDragOver && !disabled}
    class:bg-light={isDragOver && !disabled}
    class:border-success={files && !isUploading}
    class:disabled={disabled}
    on:dragenter={handleDragEnter}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    on:keydown={handleKeyDown}
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-disabled={disabled}
    aria-describedby="upload-instructions"
  >
    {#if isUploading}
      <!-- Upload Progress -->
      <div class="upload-progress" role="status" aria-live="polite">
        <div class="d-flex align-items-center justify-content-center mb-3">
          <div class="spinner-border text-primary me-3" role="status">
            <span class="visually-hidden">Uploading...</span>
          </div>
          <h5 class="mb-0">Processing Files...</h5>
        </div>
        
        {#if showProgress}
          <div class="progress mt-3" style="height: 8px;">
            <div 
              class="progress-bar progress-bar-striped progress-bar-animated"
              style="width: {uploadProgress}%"
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
          <div class="d-flex justify-content-between mt-2">
            <small class="text-muted">{Math.round(uploadProgress)}% complete</small>
            <small class="text-muted">{processedFiles} of {totalFiles} files</small>
          </div>
        {/if}
        
        <!-- Individual file progress -->
        {#if uploadResults.length > 0}
          <div class="mt-3">
            {#each uploadResults as result, index}
              <div class="d-flex align-items-center justify-content-between mb-1">
                <small class="text-truncate me-2">
                  <i class="{getFileIcon(result.file.name)} {getFileTypeColor(result.file.name)} me-1"></i>
                  {truncateFileName(result.file.name)}
                </small>
                {#if result.success}
                  <span class="badge bg-success">
                    <i class="bi bi-check-circle"></i>
                  </span>
                {:else if result.error}
                  <span class="badge bg-danger">
                    <i class="bi bi-x-circle"></i>
                  </span>
                {:else}
                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Processing...</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
    {:else if uploadErrors.length > 0}
      <!-- Error State -->
      <div class="error-state" role="alert">
        <div class="text-danger mb-3">
          <i class="bi bi-exclamation-triangle display-4"></i>
          <h5 class="mt-2">Upload Failed</h5>
        </div>
        
        <div class="alert alert-danger text-start">
          {#each uploadErrors as error}
            <div class="mb-1">
              <i class="bi bi-x-circle me-2"></i>
              {error}
            </div>
          {/each}
        </div>
        
        <div class="mt-3">
          <button 
            type="button" 
            class="btn btn-outline-primary me-2" 
            on:click={retryUpload}
            disabled={!files}
          >
            <i class="bi bi-arrow-clockwise me-2"></i>
            Retry Upload
          </button>
          <button 
            type="button" 
            class="btn btn-outline-secondary" 
            on:click={clearFiles}
          >
            <i class="bi bi-x me-2"></i>
            Clear Files
          </button>
        </div>
      </div>
      
    {:else if files && showPreview}
      <!-- File Preview -->
      <div class="file-preview">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h5 class="text-success mb-0">
            <i class="bi bi-check-circle me-2"></i>
            {files.length} File{files.length !== 1 ? 's' : ''} Ready
          </h5>
          <button 
            type="button" 
            class="btn btn-sm btn-outline-secondary" 
            on:click={clearFiles}
            aria-label="Clear all files"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
        
        <div class="row g-2">
          {#each Array.from(files) as file, index}
            <div class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body p-3">
                  <div class="d-flex align-items-start justify-content-between">
                    <div class="flex-grow-1 me-2">
                      <div class="d-flex align-items-center mb-2">
                        <i class="{getFileIcon(file.name)} {getFileTypeColor(file.name)} me-2"></i>
                        <small class="fw-medium">{truncateFileName(file.name, 20)}</small>
                      </div>
                      <div class="text-muted small">
                        <div>{formatFileSize(file.size)}</div>
                        <div>{new Date(file.lastModified).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-outline-danger" 
                      on:click={() => removeFile(index)}
                      aria-label="Remove {file.name}"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
        
        {#if !autoUpload}
          <div class="mt-3">
            <button 
              type="button" 
              class="btn btn-primary" 
              on:click={startUpload}
              disabled={isUploading}
            >
              <i class="bi bi-cloud-upload me-2"></i>
              Upload {files.length} File{files.length !== 1 ? 's' : ''}
            </button>
          </div>
        {/if}
      </div>
      
    {:else}
      <!-- Default Drop Zone -->
      <div class="default-state">
        <div class="mb-4">
          <i class="bi bi-cloud-upload display-1 text-muted mb-3 d-block"></i>
          <h5>
            {isDragOver ? 'Drop files here' : 'Drag & Drop Evidence Files'}
          </h5>
          <p class="text-muted mb-0" id="upload-instructions">
            Or click to browse files
          </p>
        </div>
        
        <!-- File Input -->
        <input
          bind:this={fileInput}
          type="file"
          {multiple}
          accept={acceptedTypes}
          class="d-none"
          id="file-input-{Math.random().toString(36).substr(2, 9)}"
          on:change={handleFileInput}
          {disabled}
          aria-describedby="file-constraints"
        >
        
        <button 
          type="button"
          class="btn btn-outline-primary mb-3"
          on:click={browseFiles}
          {disabled}
        >
          <i class="bi bi-folder2-open me-2"></i>
          Browse Files
        </button>
        
        <div class="mt-3">
          <small class="text-muted d-block" id="file-constraints">
            <strong>Supported:</strong> PDF, Images, Videos, Audio<br>
            <strong>Max size:</strong> {formatFileSize(maxFileSize)} per file<br>
            <strong>Max files:</strong> {maxFiles}
          </small>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Additional Status Information -->
  {#if uploadResults.length > 0 && !isUploading}
    <div class="mt-3">
      <div class="row text-center">
        <div class="col">
          <div class="badge bg-success">
            {uploadResults.filter(r => r.success).length} Successful
          </div>
        </div>
        {#if uploadResults.filter(r => !r.success).length > 0}
          <div class="col">
            <div class="badge bg-danger">
              {uploadResults.filter(r => !r.success).length} Failed
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .upload-area {
    position: relative;
  }
  
  .drop-zone {
    min-height: 200px;
    transition: all 0.3s ease;
    cursor: pointer;
    outline: none;
  }
  
  .drop-zone:hover:not(.disabled) {
    border-color: var(--bs-primary) !important;
    background-color: var(--bs-light);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .drop-zone:focus:not(.disabled) {
    border-color: var(--bs-primary) !important;
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
  }
  
  .drop-zone.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--bs-light);
  }
  
  .upload-progress {
    animation: fadeIn 0.3s ease-in;
  }
  
  .file-preview {
    animation: slideUp 0.3s ease-out;
  }
  
  .error-state {
    animation: fadeIn 0.3s ease-in;
  }
  
  .default-state {
    padding: 2rem 1rem;
  }
  
  .progress {
    border-radius: 10px;
    overflow: hidden;
  }
  
  .progress-bar {
    transition: width 0.3s ease;
  }
  
  .card {
    transition: all 0.2s ease;
    border-radius: 8px;
  }
  
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
  }
  
  .badge {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
  
  .text-truncate {
    max-width: 150px;
  }
  
  /* Drag and drop visual feedback */
  .drop-zone.border-primary {
    border-color: var(--bs-primary) !important;
    background: linear-gradient(135deg, 
      rgba(13, 110, 253, 0.1), 
      rgba(13, 110, 253, 0.05));
  }
  
  .drop-zone.border-success {
    border-color: var(--bs-success) !important;
    background: linear-gradient(135deg, 
      rgba(25, 135, 84, 0.1), 
      rgba(25, 135, 84, 0.05));
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .drop-zone {
      min-height: 150px;
      padding: 1rem !important;
    }
    
    .default-state {
      padding: 1rem 0.5rem;
    }
    
    .display-1 {
      font-size: 3rem;
    }
  }
  
  /* Accessibility improvements */
  .drop-zone:focus-visible {
    outline: 2px solid var(--bs-primary);
    outline-offset: 2px;
  }
  
  /* Animation keyframes */
  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: scale(0.95);
    }
    to { 
      opacity: 1; 
      transform: scale(1);
    }
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
  
  /* File type specific colors */
  .text-danger { color: #dc3545 !important; }
  .text-primary { color: #0d6efd !important; }
  .text-info { color: #0dcaf0 !important; }
  .text-success { color: #198754 !important; }
  .text-secondary { color: #6c757d !important; }
</style>
