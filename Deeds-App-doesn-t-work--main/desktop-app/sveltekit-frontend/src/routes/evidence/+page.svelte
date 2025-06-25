<!-- Copilot Instructions:
- This is the Evidence Upload & Analysis page for the Tauri desktop app
- Should include drag-and-drop zones, AI analysis, and evidence management
- Use Tauri commands for file operations and AI analysis
- Use shared UI components from $ui where possible
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/tauri';
  import Card from '$ui/components/Card.svelte';
  import Button from '$ui/components/Button.svelte';
  import EnhancedCaseForm from '$ui/components/EnhancedCaseForm.svelte';
  
  // Evidence management zones
  let evidenceZones = [
    {
      id: 'pending-review',
      title: '📋 Pending Review',
      items: [],
      className: 'border-warning'
    },
    {
      id: 'ai-analysis',
      title: '🤖 AI Analysis Queue',
      items: [],
      className: 'border-purple'
    },
    {
      id: 'verified-evidence',
      title: '✅ Verified Evidence',
      items: [],
      className: 'border-success'
    },
    {
      id: 'digital-forensics',
      title: '💻 Digital Forensics',
      items: [],
      className: 'border-info'
    },
    {
      id: 'physical-evidence',
      title: '📦 Physical Evidence',
      items: [],
      className: 'border-primary'
    }
  ];

  // AI Analysis states
  let selectedAnalysisType = 'scene_analysis';
  let analysisInProgress = false;
  let analysisResults: any = null;
  let uploadProgress = 0;
  
  // File upload state
  let dragOver = false;
  let files: FileList | null = null;
  
  const analysisTypes = [
    { id: 'scene_analysis', label: 'Scene Analysis', icon: 'bi-camera' },
    { id: 'object_detection', label: 'Object Detection', icon: 'bi-eye' },
    { id: 'document_ocr', label: 'Document OCR', icon: 'bi-file-text' },
    { id: 'audio_transcription', label: 'Audio Transcription', icon: 'bi-mic' }
  ];
  
  // TODO: Wire up to Tauri file upload and AI analysis commands
  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      files = target.files;
      await processFiles(Array.from(target.files));
    }
  }
  
  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    
    if (event.dataTransfer?.files) {
      files = event.dataTransfer.files;
      await processFiles(Array.from(event.dataTransfer.files));
    }
  }
  
  async function processFiles(fileList: File[]) {
    uploadProgress = 0;
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      try {
        // Use Tauri command for file processing
        const result = await invoke('process_evidence_file', {
          filePath: file.name, // In real app, would use Tauri file APIs
          fileName: file.name,
          fileType: file.type
        });
        
        // Add to pending review zone
        const pendingZone = evidenceZones.find(z => z.id === 'pending-review');
        if (pendingZone) {
          pendingZone.items.push({
            id: `evidence-${Date.now()}-${i}`,
            title: file.name,
            description: `Uploaded ${new Date().toLocaleString()}`,
            type: file.type,
            status: 'pending',
            metadata: { size: file.size, type: file.type }
          });
        }
        
        uploadProgress = ((i + 1) / fileList.length) * 100;
      } catch (error) {
        console.error('File processing failed:', error);
      }
    }
    
    evidenceZones = [...evidenceZones];
    uploadProgress = 0;
  }
  
  async function runAIAnalysis(evidenceItem: any) {
    analysisInProgress = true;
    analysisResults = null;
    
    try {
      // Use Tauri command for AI analysis
      const result = await invoke('analyze_evidence', {
        evidenceId: evidenceItem.id,
        analysisType: selectedAnalysisType,
        prompt: `Analyze ${evidenceItem.title} for legal significance and prosecution value. Type: ${selectedAnalysisType}`
      });
      
      analysisResults = {
        evidence: evidenceItem,
        analysis: result,
        type: selectedAnalysisType,
        timestamp: new Date().toISOString()
      };
      
      // Move item to verified evidence after analysis
      moveEvidence(evidenceItem.id, 'ai-analysis', 'verified-evidence');
      
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      analysisInProgress = false;
    }
  }
  
  function moveEvidence(itemId: string, fromZoneId: string, toZoneId: string) {
    const fromZone = evidenceZones.find(z => z.id === fromZoneId);
    const toZone = evidenceZones.find(z => z.id === toZoneId);
    
    if (fromZone && toZone) {
      const itemIndex = fromZone.items.findIndex(i => i.id === itemId);
      if (itemIndex >= 0) {
        const [item] = fromZone.items.splice(itemIndex, 1);
        item.metadata = { ...item.metadata, aiAnalyzed: true, analysisType: selectedAnalysisType };
        toZone.items.push(item);
        evidenceZones = [...evidenceZones];
      }
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
</script>

<svelte:head>
  <title>Evidence Upload & Analysis - Desktop App</title>
</svelte:head>

<div class="container py-4">
  <!-- Header -->
  <div class="row mb-4">
    <div class="col-12">
      <h1 class="display-6 fw-bold mb-2">
        <i class="bi bi-camera-video me-2 text-primary"></i>
        Evidence Hub
      </h1>
      <p class="lead text-muted">Upload, analyze, and manage case evidence with AI assistance</p>
    </div>
  </div>
  
  <!-- File Upload Section -->
  <div class="row mb-4">
    <div class="col-12">
      <Card class="shadow-sm">
        <h5 class="card-title">
          <i class="bi bi-cloud-upload me-2"></i>
          Upload Evidence
        </h5>
        
        <!-- Drop Zone -->
        <div 
          class="upload-zone {dragOver ? 'drag-over' : ''}"
          on:drop={handleDrop}
          on:dragover={handleDragOver}
          on:dragleave={handleDragLeave}
        >
          <div class="text-center py-5">
            <i class="bi bi-cloud-upload display-4 text-muted"></i>
            <h6 class="mt-3">Drag & Drop Evidence Files</h6>
            <p class="text-muted">Or click to select files</p>
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              on:change={handleFileUpload}
              class="form-control"
              style="max-width: 300px; margin: 0 auto;"
            />
          </div>
        </div>
        
        {#if uploadProgress > 0}
          <div class="progress mt-3">
            <div 
              class="progress-bar" 
              role="progressbar" 
              style="width: {uploadProgress}%"
              aria-valuenow={uploadProgress} 
              aria-valuemin="0" 
              aria-valuemax="100"
            >
              {Math.round(uploadProgress)}%
            </div>
          </div>
        {/if}
      </Card>
    </div>
  </div>
  
  <!-- AI Analysis Controls -->
  <div class="row mb-4">
    <div class="col-12">
      <Card class="shadow-sm">
        <h5 class="card-title">
          <i class="bi bi-robot me-2"></i>
          AI Analysis Settings
        </h5>
        <div class="row">
          <div class="col-md-6">
            <label class="form-label">Analysis Type:</label>
            <select bind:value={selectedAnalysisType} class="form-select">
              {#each analysisTypes as type}
                <option value={type.id}>{type.label}</option>
              {/each}
            </select>
          </div>
          <div class="col-md-6 d-flex align-items-end">
            <Button 
              variant="primary"
              disabled={analysisInProgress}
              class="w-100"
            >
              {#if analysisInProgress}
                <span class="spinner-border spinner-border-sm me-2"></span>
                Analyzing...
              {:else}
                <i class="bi bi-play me-2"></i>
                Run Analysis
              {/if}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
  
  <!-- Evidence Zones -->
  <div class="row">
    {#each evidenceZones as zone}
      <div class="col-lg-4 col-md-6 mb-4">
        <Card class="h-100 {zone.className}">
          <h6 class="card-title">{zone.title}</h6>
          <div class="evidence-zone min-height-200">
            {#each zone.items as item}
              <div class="evidence-item border rounded p-2 mb-2 bg-light">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <strong class="small">{item.title}</strong>
                    <div class="text-muted small">{item.description}</div>
                    {#if item.metadata?.aiAnalyzed}
                      <span class="badge bg-success">AI Analyzed</span>
                    {/if}
                  </div>
                  {#if zone.id === 'ai-analysis'}
                    <Button 
                      size="sm" 
                      variant="outline"
                      on:click={() => runAIAnalysis(item)}
                    >
                      <i class="bi bi-play"></i>
                    </Button>
                  {/if}
                </div>
              </div>
            {:else}
              <div class="text-center text-muted py-3">
                <i class="bi bi-inbox"></i>
                <div class="small">Drop evidence here</div>
              </div>
            {/each}
          </div>
        </Card>
      </div>
    {/each}
  </div>
  
  <!-- AI Analysis Results -->
  {#if analysisResults}
    <div class="row mt-4">
      <div class="col-12">
        <Card class="shadow-sm">
          <h5 class="card-title">
            <i class="bi bi-cpu me-2 text-success"></i>
            AI Analysis Results
          </h5>
          <div class="border rounded p-3 bg-light">
            <h6>Evidence: {analysisResults.evidence.title}</h6>
            <p class="small text-muted">Analysis Type: {analysisResults.type}</p>
            <div style="white-space: pre-wrap;">{analysisResults.analysis}</div>
          </div>
          <div class="d-flex justify-content-end mt-3">
            <Button variant="outline" size="sm" on:click={() => navigator.clipboard.writeText(analysisResults.analysis)}>
              <i class="bi bi-clipboard me-1"></i>
              Copy Results
            </Button>
          </div>
        </Card>
      </div>
    </div>
  {/if}
  
  <!-- Enhanced Case Form Integration -->
  <div class="row mt-4">
    <div class="col-12">
      <Card class="shadow-sm">
        <h5 class="card-title">
          <i class="bi bi-file-earmark-text me-2"></i>
          Case Documentation
        </h5>
        <EnhancedCaseForm />
      </Card>
    </div>
  </div>
</div>

<style>
  .upload-zone {
    border: 2px dashed #dee2e6;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
  }
  
  .upload-zone.drag-over {
    border-color: #0d6efd;
    background-color: #f8f9fa;
  }
  
  .evidence-zone {
    min-height: 200px;
    padding: 0.5rem;
  }
  
  .evidence-item {
    cursor: move;
    transition: all 0.2s ease;
  }
  
  .evidence-item:hover {
    background-color: #e9ecef !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .min-height-200 {
    min-height: 200px;
  }
  
  .border-warning {
    border-color: #ffc107 !important;
  }
  
  .border-purple {
    border-color: #6f42c1 !important;
  }
  
  .border-success {
    border-color: #198754 !important;
  }
  
  .border-info {
    border-color: #0dcaf0 !important;
  }
  
  .border-primary {
    border-color: #0d6efd !important;
  }
</style>