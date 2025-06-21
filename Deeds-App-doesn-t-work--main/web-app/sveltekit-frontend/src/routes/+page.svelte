<script lang="ts">
  import { onMount } from 'svelte';
  import Typewriter from '$lib/components/Typewriter.svelte';
  import UploadArea from '$lib/components/UploadArea.svelte';
    let recentCases: any[] = [];
  let systemStats = {
    totalCases: 0,
    totalEvidence: 0,
    modelsLoaded: 0,
    processingJobs: 0
  };
  
  onMount(async () => {
    // Load recent cases and stats
    try {
      const [casesRes, statsRes] = await Promise.all([
        fetch('/api/cases/recent'),
        fetch('/api/system/stats')
      ]);
      
      if (casesRes.ok) {
        recentCases = await casesRes.json();
      }
      
      if (statsRes.ok) {
        systemStats = await statsRes.json();
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  });
    function handleQuickUpload(files: any) {
    // Handle quick upload from homepage
    if (files.length > 0) {
      window.location.href = `/upload?files=${files.length}`;
    }
  }
</script>

<svelte:head>
  <title>Legal Intelligence CMS - Home</title>
</svelte:head>

<div class="fade-in">
  <!-- Hero Section -->
  <div class="row mb-5">
    <div class="col-lg-8 mx-auto text-center">
      <h1 class="display-4 fw-bold text-dark mb-4">
        <i class="bi bi-shield-check text-primary me-3"></i>
        Legal Intelligence CMS
      </h1>
      
      <div class="mb-4" style="min-height: 60px;">
        <Typewriter 
          text="What legal case are you working on today? Upload evidence, analyze scenes, extract insights..."
          speed={50}
        />
      </div>
      
      <div class="d-flex gap-3 justify-content-center flex-wrap">
        <a href="/cases/new" class="btn btn-primary btn-lg">
          <i class="bi bi-plus-circle me-2"></i>New Case
        </a>
        <a href="/upload" class="btn btn-outline-primary btn-lg">
          <i class="bi bi-cloud-upload me-2"></i>Upload Evidence
        </a>
        <a href="/dashboard" class="btn btn-outline-secondary btn-lg">
          <i class="bi bi-speedometer2 me-2"></i>Dashboard
        </a>
      </div>
    </div>
  </div>
  
  <!-- Quick Upload Section -->
  <div class="row mb-5">
    <div class="col-lg-10 mx-auto">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h5 class="card-title text-center mb-4">
            <i class="bi bi-lightning me-2"></i>Quick Evidence Upload
          </h5>
          <UploadArea onUpload={handleQuickUpload} />
          <div class="text-center mt-3">
            <small class="text-muted">
              Supports: PDF, Images (JPG, PNG), Video (MP4, AVI), Audio (MP3, WAV)
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- System Stats -->
  <div class="row mb-5">
    <div class="col-lg-12">
      <h4 class="mb-4">
        <i class="bi bi-graph-up me-2"></i>System Overview
      </h4>
      <div class="row g-4">
        <div class="col-md-3">
          <div class="card text-center border-0 shadow-sm h-100">
            <div class="card-body">
              <i class="bi bi-folder2 display-6 text-primary mb-3"></i>
              <h3 class="fw-bold">{systemStats.totalCases}</h3>
              <p class="text-muted mb-0">Total Cases</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center border-0 shadow-sm h-100">
            <div class="card-body">
              <i class="bi bi-camera-video display-6 text-success mb-3"></i>
              <h3 class="fw-bold">{systemStats.totalEvidence}</h3>
              <p class="text-muted mb-0">Evidence Files</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center border-0 shadow-sm h-100">
            <div class="card-body">
              <i class="bi bi-cpu display-6 text-warning mb-3"></i>
              <h3 class="fw-bold">{systemStats.modelsLoaded}</h3>
              <p class="text-muted mb-0">AI Models Loaded</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center border-0 shadow-sm h-100">
            <div class="card-body">
              <i class="bi bi-gear display-6 text-info mb-3"></i>
              <h3 class="fw-bold">{systemStats.processingJobs}</h3>
              <p class="text-muted mb-0">Processing Jobs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Recent Cases -->
  <div class="row">
    <div class="col-lg-12">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <i class="bi bi-clock-history me-2"></i>Recent Cases
        </h4>
        <a href="/cases" class="btn btn-outline-primary">
          View All <i class="bi bi-arrow-right ms-1"></i>
        </a>
      </div>
        {#if recentCases.length > 0}
        <div class="row g-4">
          {#each recentCases.slice(0, 6) as caseItem}
            <div class="col-md-6 col-lg-4">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <h6 class="card-title mb-0">{caseItem.title}</h6>
                    <span class="badge bg-{caseItem.status === 'active' ? 'success' : caseItem.status === 'pending' ? 'warning' : 'secondary'}">
                      {caseItem.status}
                    </span>
                  </div>
                  
                  <p class="card-text text-muted small mb-3">
                    {caseItem.description?.substring(0, 100)}...
                  </p>
                  
                  <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                      <i class="bi bi-calendar me-1"></i>
                      {new Date(caseItem.created_at).toLocaleDateString()}
                    </small>
                    <a href="/cases/{caseItem.id}" class="btn btn-sm btn-outline-primary">
                      View <i class="bi bi-arrow-right ms-1"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-5">
          <i class="bi bi-folder2-open display-1 text-muted mb-3"></i>
          <h5 class="text-muted">No cases yet</h5>
          <p class="text-muted">Create your first case to get started with evidence analysis</p>
          <a href="/cases/new" class="btn btn-primary">
            <i class="bi bi-plus-circle me-2"></i>Create First Case
          </a>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Features Overview -->
  <div class="row mt-5 pt-5 border-top">
    <div class="col-lg-12">
      <h4 class="text-center mb-5">
        <i class="bi bi-stars me-2"></i>AI-Powered Features
      </h4>
      <div class="row g-4">
        <div class="col-md-4">
          <div class="text-center">
            <i class="bi bi-eye display-5 text-primary mb-3"></i>
            <h5>Computer Vision</h5>
            <p class="text-muted">
              Object detection, OCR, and scene analysis using YOLO and advanced AI models
            </p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="text-center">
            <i class="bi bi-soundwave display-5 text-success mb-3"></i>
            <h5>Audio Analysis</h5>
            <p class="text-muted">
              Speech transcription, speaker identification, and audio timeline analysis
            </p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="text-center">
            <i class="bi bi-chat-dots display-5 text-warning mb-3"></i>
            <h5>NLP & RAG</h5>
            <p class="text-muted">
              Natural language processing with vector search and retrieval augmented generation
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
