<!--
  Transform Sync Demo Page - Showcase Fabric.js + mathjs + Svelte Store Integration
  
  This page demonstrates:
  - Interactive canvas with Fabric.js
  - Transform sync using mathjs matrix operations
  - Undo/redo functionality
  - Real-time transform visualization
  - JSON state management
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import CanvasEditor from '$lib/components/CanvasEditor.svelte';
  import Button from '$ui/components/Button.svelte';
  import Card from '$ui/components/Card.svelte';
  import Grid from '$ui/components/Grid.svelte';
  import Tooltip from '$ui/components/Tooltip.svelte';
  import {
    canUndo,
    canRedo,
    hasUnsavedChanges,
    isProcessing,
    currentState,
    CacheManager
  } from '$lib/stores/transform-sync';

  // Demo state
  let canvasEditor: CanvasEditor;
  let demoMode: 'basic' | 'advanced' | 'performance' = 'basic';
  let showSystemInfo = false;
  let cacheStats = { size: 0, entries: 0, totalSize: 0 };

  onMount(() => {
    // Update cache stats periodically
    const interval = setInterval(() => {
      cacheStats = CacheManager.getStats();
    }, 1000);

    return () => clearInterval(interval);
  });

  function handleCanvasSaved() {
    console.log('Canvas saved successfully');
  }

  function handleCanvasLoaded(event: CustomEvent) {
    console.log('Canvas loaded:', event.detail);
  }

  function handleEvidenceUploaded(event: CustomEvent) {
    console.log('Evidence uploaded:', event.detail);
  }

  function handleError(event: CustomEvent) {
    console.error('Canvas error:', event.detail.message);
    alert(`Error: ${event.detail.message}`);
  }

  function clearCache() {
    CacheManager.clear();
    cacheStats = CacheManager.getStats();
  }

  function exportCanvasData() {
    if (!canvasEditor) return;
    
    const data = canvasEditor.getCanvasData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas_demo_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCanvasImage() {
    if (!canvasEditor) return;
    
    const dataUrl = canvasEditor.getCanvasImage();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `canvas_demo_${Date.now()}.png`;
    a.click();
  }

  // Demo scenarios
  function loadBasicDemo() {
    // This would load a predefined canvas state for demo
    console.log('Loading basic demo...');
  }

  function loadAdvancedDemo() {
    // This would load a complex canvas with multiple objects
    console.log('Loading advanced demo...');
  }

  function loadPerformanceDemo() {
    // This would load a performance test with many objects
    console.log('Loading performance demo...');
  }
</script>

<svelte:head>
  <title>Transform Sync Demo - Legal Case Management</title>
  <meta name="description" content="Interactive demo of the transform sync system with Fabric.js and mathjs integration" />
</svelte:head>

<div class="demo-page">
  <!-- Demo Header -->
  <div class="demo-header bg-secondary p-lg border-b">
    <div class="container mx-auto">
      <h1 class="text-3xl font-bold text-primary mb-md">Transform Sync Demo</h1>
      <p class="text-muted mb-lg">
        Interactive demonstration of Fabric.js + mathjs + Svelte Store integration for legal case management.
        This system provides advanced canvas manipulation with matrix transformations, undo/redo capabilities,
        and real-time state synchronization.
      </p>
      
      <!-- Demo Controls -->
      <div class="demo-controls">
        <Grid cols={3} gap="md" class="mb-md">
          <Card 
            title="Basic Demo" 
            subtitle="Simple canvas with text and shapes"
            clickable
            class="demo-scenario"
            on:click={() => { demoMode = 'basic'; loadBasicDemo(); }}
          >
            <Button variant={demoMode === 'basic' ? 'primary' : 'outline'} class="w-full">
              Load Basic Demo
            </Button>
          </Card>
          
          <Card 
            title="Advanced Demo" 
            subtitle="Complex layout with evidence items"
            clickable
            class="demo-scenario"
            on:click={() => { demoMode = 'advanced'; loadAdvancedDemo(); }}
          >
            <Button variant={demoMode === 'advanced' ? 'primary' : 'outline'} class="w-full">
              Load Advanced Demo
            </Button>
          </Card>
          
          <Card 
            title="Performance Demo" 
            subtitle="Stress test with many objects"
            clickable
            class="demo-scenario"
            on:click={() => { demoMode = 'performance'; loadPerformanceDemo(); }}
          >
            <Button variant={demoMode === 'performance' ? 'primary' : 'outline'} class="w-full">
              Load Performance Test
            </Button>
          </Card>
        </Grid>

        <!-- Action Buttons -->
        <div class="demo-actions flex gap-md items-center flex-wrap">
          <Button variant="outline" on:click={exportCanvasData}>
            <span slot="icon">📄</span>
            Export JSON
          </Button>
          <Button variant="outline" on:click={exportCanvasImage}>
            <span slot="icon">🖼️</span>
            Export Image
          </Button>
          <Button variant="outline" on:click={() => showSystemInfo = !showSystemInfo}>
            <span slot="icon">📊</span>
            System Info
          </Button>
          <Button variant="outline" on:click={clearCache}>
            <span slot="icon">🗑️</span>
            Clear Cache
          </Button>
        </div>
      </div>
    </div>
  </div>

  <!-- System Information Panel -->
  {#if showSystemInfo}
    <div class="system-info bg-tertiary p-md border-b">
      <div class="container mx-auto">
        <h2 class="text-lg font-semibold mb-md">Transform Sync System Status</h2>
        <Grid cols={4} gap="md">
          <Card title="Processing Status" padding="sm">
            <div class="status-indicator">
              <span class="status-dot {$isProcessing ? 'processing' : 'idle'}"></span>
              {$isProcessing ? 'Processing' : 'Idle'}
            </div>
          </Card>
          
          <Card title="Undo/Redo State" padding="sm">
            <div class="undo-redo-status">
              <div class="flex justify-between mb-xs">
                <span>Can Undo:</span>
                <span class="{$canUndo ? 'text-success' : 'text-muted'}">{$canUndo ? 'Yes' : 'No'}</span>
              </div>
              <div class="flex justify-between">
                <span>Can Redo:</span>
                <span class="{$canRedo ? 'text-success' : 'text-muted'}">{$canRedo ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </Card>
          
          <Card title="Save Status" padding="sm">
            <div class="save-status">
              <span class="status-dot {$hasUnsavedChanges ? 'unsaved' : 'saved'}"></span>
              {$hasUnsavedChanges ? 'Unsaved Changes' : 'All Saved'}
            </div>
          </Card>
          
          <Card title="Cache Statistics" padding="sm">
            <div class="cache-stats text-sm">
              <div class="flex justify-between mb-xs">
                <span>Entries:</span>
                <span>{cacheStats.entries}</span>
              </div>
              <div class="flex justify-between mb-xs">
                <span>Size:</span>
                <span>{(cacheStats.totalSize / 1024).toFixed(1)} KB</span>
              </div>
              <div class="flex justify-between">
                <span>Usage:</span>
                <span>{((cacheStats.totalSize / (10 * 1024 * 1024)) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </Card>
        </Grid>
      </div>
    </div>
  {/if}

  <!-- Canvas Editor -->
  <div class="canvas-container flex-1">
    <CanvasEditor
      bind:this={canvasEditor}
      caseId="demo_case_001"
      on:canvasSaved={handleCanvasSaved}
      on:canvasLoaded={handleCanvasLoaded}
      on:evidenceUploaded={handleEvidenceUploaded}
      on:error={handleError}
    />
  </div>

  <!-- Feature Showcase -->
  <div class="feature-showcase bg-secondary p-lg">
    <div class="container mx-auto">
      <h2 class="text-2xl font-semibold mb-lg">Transform Sync Features</h2>
      <Grid cols={3} gap="lg">
        <Card title="Matrix Transformations" padding="md">
          <ul class="feature-list">
            <li>✅ Real-time matrix calculations using mathjs</li>
            <li>✅ Translate, rotate, scale operations</li>
            <li>✅ Composite matrix transformations</li>
            <li>✅ Precision transform sync</li>
          </ul>
        </Card>
        
        <Card title="State Management" padding="md">
          <ul class="feature-list">
            <li>✅ JSON-based canvas serialization</li>
            <li>✅ Undo/redo with history stack</li>
            <li>✅ Automatic state caching</li>
            <li>✅ Auto-save functionality</li>
          </ul>
        </Card>
        
        <Card title="Performance" padding="md">
          <ul class="feature-list">
            <li>✅ Efficient memory management</li>
            <li>✅ Transform operation queuing</li>
            <li>✅ Cache size optimization</li>
            <li>✅ Background processing</li>
          </ul>
        </Card>
        
        <Card title="User Experience" padding="md">
          <ul class="feature-list">
            <li>✅ Keyboard shortcuts (Ctrl+Z/Y)</li>
            <li>✅ Visual transform feedback</li>
            <li>✅ Interactive transform panel</li>
            <li>✅ Real-time status indicators</li>
          </ul>
        </Card>
        
        <Card title="Integration" padding="md">
          <ul class="feature-list">
            <li>✅ Fabric.js canvas integration</li>
            <li>✅ Svelte reactive stores</li>
            <li>✅ TypeScript type safety</li>
            <li>✅ API-ready state sync</li>
          </ul>
        </Card>
        
        <Card title="Extensibility" padding="md">
          <ul class="feature-list">
            <li>✅ Custom transform operations</li>
            <li>✅ Plugin architecture ready</li>
            <li>✅ Event-driven design</li>
            <li>✅ Modular components</li>
          </ul>
        </Card>
      </Grid>
    </div>
  </div>

  <!-- Instructions -->
  <div class="instructions bg-primary p-lg">
    <div class="container mx-auto">
      <h2 class="text-2xl font-semibold mb-md">How to Use</h2>
      <Grid cols={2} gap="lg">
        <Card title="Basic Operations" padding="md">
          <ol class="instruction-list">
            <li>Select any object on the canvas</li>
            <li>Click the "Transform" button to open the transform panel</li>
            <li>Use quick transform buttons for common operations</li>
            <li>Try the undo/redo buttons or Ctrl+Z/Ctrl+Y</li>
            <li>Watch the real-time system status updates</li>
          </ol>
        </Card>
        
        <Card title="Advanced Features" padding="md">
          <ol class="instruction-list">
            <li>Edit the transform matrix directly for precise control</li>
            <li>Use preset transforms for common operations</li>
            <li>Monitor transform history in the panel</li>
            <li>Upload evidence files to test with real content</li>
            <li>Export your work as JSON or image files</li>
          </ol>
        </Card>
      </Grid>
    </div>
  </div>
</div>

<style>
  .demo-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .container {
    max-width: 1200px;
  }

  .canvas-container {
    flex: 1;
    min-height: 600px;
  }

  .demo-scenario {
    transition: all var(--transition-normal);
  }

  .demo-scenario:hover {
    transform: translateY(-4px);
  }

  .demo-controls {
    margin-bottom: var(--spacing-lg);
  }

  .demo-actions {
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  .status-dot.idle {
    background-color: var(--color-success);
  }

  .status-dot.processing {
    background-color: var(--color-warning);
    animation: pulse 1s infinite;
  }

  .status-dot.saved {
    background-color: var(--color-success);
  }

  .status-dot.unsaved {
    background-color: var(--color-warning);
  }

  .feature-list,
  .instruction-list {
    list-style: none;
    padding: 0;
    margin: 0;
    space-y: var(--spacing-xs);
  }

  .feature-list li,
  .instruction-list li {
    padding: var(--spacing-xs) 0;
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
  }

  .instruction-list {
    counter-reset: instruction-counter;
  }

  .instruction-list li {
    counter-increment: instruction-counter;
    position: relative;
    padding-left: var(--spacing-lg);
  }

  .instruction-list li::before {
    content: counter(instruction-counter);
    position: absolute;
    left: 0;
    top: var(--spacing-xs);
    background-color: var(--color-accent);
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Utility classes */
  .mx-auto { margin-left: auto; margin-right: auto; }
  .w-full { width: 100%; }
  .flex-1 { flex: 1; }

  /* Icon styling - make icons smaller */
  :global([slot="icon"]) {
    font-size: 0.75rem;
  }

  /* Make circular elements smaller */
  .s-y_bCXRrkrYfP {
    width: 32px;
    height: 32px;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .demo-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .demo-actions :global(button) {
      width: 100%;
    }
  }
</style>
