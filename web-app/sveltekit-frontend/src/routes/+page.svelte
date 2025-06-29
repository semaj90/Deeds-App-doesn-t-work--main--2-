<script lang="ts">
  import HeadlessDemo from '$lib/components/HeadlessDemo.svelte';
  import BitsDemo from '$lib/components/BitsDemo.svelte';
  import { onMount } from 'svelte';
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
</script>

<svelte:head>
  <title>Legal Case Management System - UI Components Demo</title>
  <meta name="description" content="Modern legal case management with PicoCSS, UnoCSS, Melt UI, and Bits UI integration" />
</svelte:head>

<div class="demo-page">
  <header class="demo-header">
    <div class="container">
      <h1 class="text-3xl font-bold text-center mb-4">
        🏛️ Legal Case Management System
      </h1>
      <p class="text-lg text-center text-muted mb-6">
        Demonstrating PicoCSS + UnoCSS + Melt UI + Bits UI Integration
      </p>
      
      <div class="tech-stack">
        <div class="tech-item">
          <span class="tech-icon">🎨</span>
          <span>PicoCSS</span>
        </div>
        <div class="tech-item">
          <span class="tech-icon">⚡</span>
          <span>UnoCSS</span>
        </div>
        <div class="tech-item">
          <span class="tech-icon">🧩</span>
          <span>Melt UI</span>
        </div>
        <div class="tech-item">
          <span class="tech-icon">🔧</span>
          <span>Bits UI</span>
        </div>
      </div>
    </div>
  </header>
  
  {#if mounted}
    <main class="container">
      <div class="demo-grid">
        
        <!-- Styling Examples -->
        <section class="demo-section">
          <h2 class="section-title">📋 PicoCSS + Custom Styling</h2>
          <div class="card">
            <div class="card-header">
              <h3>Case Information</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label" for="case-number">Case Number</label>
                <input type="text" id="case-number" class="form-input" value="CAS-2025-001234" readonly />
              </div>
              
              <div class="form-group">
                <label class="form-label" for="case-status">Case Status</label>
                <select id="case-status" class="form-select">
                  <option>Active Investigation</option>
                  <option>Pending Review</option>
                  <option>Closed</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="priority-level">Priority Level</label>
                <div class="priority-indicators" id="priority-level" role="radiogroup">
                  <div class="priority-high evidence-item">High Priority Case</div>
                  <div class="priority-medium evidence-item">Medium Priority Case</div>
                  <div class="priority-low evidence-item">Low Priority Case</div>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary">Save Changes</button>
              <button class="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </section>
        
        <!-- UnoCSS Utilities -->
        <section class="demo-section">
          <h2 class="section-title">⚡ UnoCSS Utilities</h2>
          <div class="card">
            <div class="card-body">
              <div class="case-card mb-3">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="font-semibold">State vs. Johnson</h4>
                  <span class="status-badge case-status-active">Active</span>
                </div>
                <p class="text-sm text-muted">Criminal case involving financial fraud</p>
                <div class="flex gap-2 mt-2">
                  <button class="btn btn-sm btn-primary">View Details</button>
                  <button class="btn btn-sm btn-secondary">Edit</button>
                </div>
              </div>
              
              <div class="case-card mb-3">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="font-semibold">Miller Corp Dispute</h4>
                  <span class="status-badge case-status-pending">Pending</span>
                </div>
                <p class="text-sm text-muted">Contract dispute resolution</p>
                <div class="flex gap-2 mt-2">
                  <button class="btn btn-sm btn-primary">View Details</button>
                  <button class="btn btn-sm btn-secondary">Edit</button>
                </div>
              </div>
              
              <div class="case-card">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="font-semibold">Estate Settlement</h4>
                  <span class="status-badge case-status-closed">Closed</span>
                </div>
                <p class="text-sm text-muted">Probate and estate administration</p>
                <div class="flex gap-2 mt-2">
                  <button class="btn btn-sm btn-secondary">View Archive</button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Melt UI Demo -->
        <section class="demo-section">
          <h2 class="section-title">🧩 Melt UI Headless Components</h2>
          <div class="card">
            <div class="card-body">
              <HeadlessDemo />
            </div>
          </div>
        </section>
        
        <!-- Bits UI Demo -->
        <section class="demo-section">
          <h2 class="section-title">🔧 Bits UI Components</h2>
          <div class="card">
            <div class="card-body">
              <BitsDemo />
            </div>
          </div>
        </section>
        
        <!-- Alert Examples -->
        <section class="demo-section">
          <h2 class="section-title">🚨 Alert System</h2>
          <div class="card">
            <div class="card-body">
              <div class="alert alert-success">
                <strong>Success!</strong> Case has been successfully saved and is now active.
              </div>
              
              <div class="alert alert-warning">
                <strong>Warning!</strong> This case has a pending deadline in 3 days.
              </div>
              
              <div class="alert alert-error">
                <strong>Error!</strong> Unable to upload evidence file. Please try again.
              </div>
              
              <div class="alert alert-info">
                <strong>Info:</strong> New evidence has been added to this case by another team member.
              </div>
            </div>
          </div>
        </section>
        
        <!-- File Upload Demo -->
        <section class="demo-section">
          <h2 class="section-title">📎 Evidence Upload</h2>
          <div class="card">
            <div class="card-body">
              <div class="file-drop-zone">
                <div class="text-center">
                  <span class="text-2xl mb-2 block">📄</span>
                  <h3>Drop evidence files here</h3>
                  <p class="text-sm text-muted">
                    Or click to browse files
                  </p>
                  <p class="text-xs text-muted mt-2">
                    Supported: PDF, DOC, IMG, VIDEO
                  </p>
                </div>
              </div>
              
              <div class="mt-4">
                <div class="progress">
                  <div class="progress-bar" style="width: 75%"></div>
                </div>
                <p class="text-sm text-muted mt-1">
                  Uploading evidence_document.pdf... 75%
                </p>
              </div>
            </div>
          </div>
        </section>
        
      </div>
    </main>
  {/if}
</div>

<style>
  .demo-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: var(--spacing-lg) 0;
  }
  
  .demo-header {
    background: var(--color-background);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-2xl);
    padding: var(--spacing-2xl) 0;
  }
  
  .tech-stack {
    display: flex;
    justify-content: center;
    gap: var(--spacing-lg);
    flex-wrap: wrap;
  }
  
  .tech-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    font-weight: 500;
    font-size: var(--font-size-sm);
  }
  
  .tech-icon {
    font-size: var(--font-size-lg);
  }
  
  .demo-grid {
    display: grid;
    gap: var(--spacing-2xl);
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .demo-section {
    background: var(--color-background);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  
  .section-title {
    background: var(--color-primary);
    color: white;
    padding: var(--spacing-lg);
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: 600;
  }
  
  .priority-indicators {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .text-muted {
    color: var(--color-text-muted);
  }
  
  @media (max-width: 768px) {
    .demo-page {
      padding: var(--spacing-md) 0;
    }
    
    .demo-header {
      padding: var(--spacing-lg) 0;
    }
    
    .tech-stack {
      gap: var(--spacing-sm);
    }
    
    .tech-item {
      font-size: var(--font-size-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
    }
    
    .demo-grid {
      gap: var(--spacing-lg);
    }
  }
</style>