<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { report, reportActions, editorState, reportUI, setupAutoSave } from '$lib/stores/report';
  import { uiStore } from '$lib/stores/ui';
  import { fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Components
  import ReportToolbar from './ReportToolbar.svelte';
  import RichTextEditor from './RichTextEditor.svelte';
  import MasonryGrid from '../layout/MasonryGrid.svelte';
  import EvidenceCard from '../evidence/EvidenceCard.svelte';
  import AdvancedSearch from '../search/AdvancedSearch.svelte';
  import Modal from '../ui/Modal.svelte';
  
  // Icons
  import { 
    PanelLeftClose, 
    PanelLeftOpen, 
    Plus, 
    Settings, 
    Save,
    Maximize2,
    Minimize2,
    Grid,
    Columns,
    Layout
  } from 'lucide-svelte';
  
  // State
  let editorComponent: RichTextEditor;
  let cleanupAutoSave: (() => void) | undefined;
  let evidenceSearchResults: any[] = [];
  let selectedEvidence: any = null;
  
  // Reactive layout classes
  $: layoutClass = {
    single: 'layout-single',
    dual: 'layout-dual',
    masonry: 'layout-masonry'
  }[$report.settings.layout];
  
  // Initialize auto-save
  onMount(() => {
    if ($report.settings.autoSave) {
      cleanupAutoSave = setupAutoSave();
    }
  });
  
  onDestroy(() => {
    if (cleanupAutoSave) {
      cleanupAutoSave();
    }
  });
  
  // Handle evidence actions
  const handleViewEvidence = (evidence: any) => {
    selectedEvidence = evidence;
    uiStore.openModal('evidence-viewer');
  };
  
  const handleEditEvidence = (evidence: any) => {
    // TODO: Implement evidence editing
    console.log('Edit evidence:', evidence);
  };
  
  const handleDeleteEvidence = (evidence: any) => {
    if (confirm(`Are you sure you want to delete "${evidence.title}"?`)) {
      reportActions.removeEvidence(evidence.id);
    }
  };
  
  const handleDownloadEvidence = (evidence: any) => {
    if (evidence.url) {
      window.open(evidence.url, '_blank');
    }
  };
  
  const handleInsertEvidence = (evidence: any) => {
    if (editorComponent) {
      editorComponent.insertEvidence(evidence);
    }
  };
  
  const handleAddNewEvidence = () => {
    // TODO: Implement evidence upload/creation
    console.log('Add new evidence');
  };
  
  // Layout switching
  const switchLayout = () => {
    const layouts = ['single', 'dual', 'masonry'] as const;
    const currentIndex = layouts.indexOf($report.settings.layout);
    const nextLayout = layouts[(currentIndex + 1) % layouts.length];
    reportActions.updateSettings({ layout: nextLayout });
  };
  
  // Sidebar toggle
  const toggleSidebar = () => {
    reportUI.update(ui => ({ ...ui, sidebarOpen: !ui.sidebarOpen }));
  };
  
  // Fullscreen toggle
  const toggleFullscreen = () => {
    reportUI.update(ui => ({ ...ui, fullscreen: !ui.fullscreen }));
    if (!$reportUI.fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };
  
  // Keyboard shortcuts
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          reportActions.save();
          break;
        case 'b':
          e.preventDefault();
          toggleSidebar();
          break;
        case 'n':
          e.preventDefault();
          reportActions.reset();
          break;
      }
    }
    
    if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }
  };
</script>

<svelte:window on:keydown={handleKeydown} />

<div 
  class="report-editor {layoutClass}"
  class:fullscreen={$reportUI.fullscreen}
  class:sidebar-closed={!$reportUI.sidebarOpen}
>
  <!-- Toolbar -->
  <header class="editor-toolbar">
    <ReportToolbar />
  </header>
  
  <!-- Main Content Area -->
  <div class="editor-content">
    <!-- Sidebar -->
    {#if $reportUI.sidebarOpen}
      <aside 
        class="editor-sidebar"
        style="width: {$reportUI.sidebarWidth}px"
        transition:fly={{ x: -300, duration: 300, easing: quintOut }}
      >
        <!-- Evidence Search -->
        <section class="sidebar-section">
          <div class="section-header">
            <h3>Evidence Library</h3>
            <button 
              class="add-evidence-btn"
              on:click={handleAddNewEvidence}
              title="Add new evidence"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <AdvancedSearch
            items={$report.attachedEvidence}
            onResults={(results) => evidenceSearchResults = results}
            onSelect={handleInsertEvidence}
            placeholder="Search evidence..."
          />
        </section>
        
        <!-- Evidence Grid -->
        <section class="sidebar-section evidence-section">
          {#if $report.settings.layout === 'masonry'}
            <MasonryGrid
              items={evidenceSearchResults}
              columnWidth={250}
              gutter={12}
              let:item
            >
              <EvidenceCard
                evidence={item}
                onView={handleViewEvidence}
                onEdit={handleEditEvidence}
                onDelete={handleDeleteEvidence}
                onDownload={handleDownloadEvidence}
                compact={true}
              />
            </MasonryGrid>
          {:else}
            <div class="evidence-list">
              {#each evidenceSearchResults as evidence (evidence.id)}
                <EvidenceCard
                  {evidence}
                  onView={handleViewEvidence}
                  onEdit={handleEditEvidence}
                  onDelete={handleDeleteEvidence}
                  onDownload={handleDownloadEvidence}
                  compact={true}
                />
              {/each}
            </div>
          {/if}
          
          {#if evidenceSearchResults.length === 0}
            <div class="empty-evidence">
              <p>No evidence found</p>
              <small>Add evidence to enhance your report</small>
            </div>
          {/if}
        </section>
        
        <!-- Report Stats -->
        <section class="sidebar-section stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Words</span>
              <span class="stat-value">{$editorState.wordCount}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Evidence</span>
              <span class="stat-value">{$report.attachedEvidence.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Status</span>
              <span class="stat-value status-{$report.metadata.status}">
                {$report.metadata.status}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Modified</span>
              <span class="stat-value">
                {$report.metadata.updatedAt.toLocaleDateString()}
              </span>
            </div>
          </div>
        </section>
      </aside>
    {/if}
    
    <!-- Main Editor Area -->
    <main class="editor-main">
      <!-- Editor Header -->
      <div class="editor-header">
        <div class="editor-title-section">
          {#if !$reportUI.sidebarOpen}
            <button 
              class="sidebar-toggle"
              on:click={toggleSidebar}
              title="Show sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          {/if}
          
          <input
            class="report-title-input"
            type="text"
            value={$report.title}
            on:input={(e) => reportActions.updateTitle(e.currentTarget.value)}
            placeholder="Report title..."
          />
        </div>
        
        <div class="editor-actions">
          <button 
            class="layout-toggle"
            on:click={switchLayout}
            title="Switch layout ({$report.settings.layout})"
          >
            {#if $report.settings.layout === 'single'}
              <Layout size={18} />
            {:else if $report.settings.layout === 'dual'}
              <Columns size={18} />
            {:else}
              <Grid size={18} />
            {/if}
          </button>
          
          <button 
            class="fullscreen-toggle"
            on:click={toggleFullscreen}
            title="Toggle fullscreen"
          >
            {#if $reportUI.fullscreen}
              <Minimize2 size={18} />
            {:else}
              <Maximize2 size={18} />
            {/if}
          </button>
          
          <button 
            class="settings-btn"
            on:click={() => uiStore.openModal('report-settings')}
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
      
      <!-- Rich Text Editor -->
      <div class="editor-wrapper">
        <RichTextEditor
          bind:this={editorComponent}
          height={$reportUI.fullscreen ? window.innerHeight - 200 : 500}
        />
      </div>
    </main>
    
    <!-- Evidence Panel (for dual layout) -->
    {#if $report.settings.layout === 'dual'}
      <aside 
        class="evidence-panel"
        transition:fly={{ x: 300, duration: 300, easing: quintOut }}
      >
        <div class="panel-header">
          <h3>Evidence</h3>
          <button on:click={handleAddNewEvidence}>
            <Plus size={16} />
          </button>
        </div>
        
        <div class="evidence-grid-panel">
          <MasonryGrid
            items={$report.attachedEvidence}
            columnWidth={200}
            gutter={8}
            let:item
          >
            <EvidenceCard
              evidence={item}
              onView={handleViewEvidence}
              onEdit={handleEditEvidence}
              onDelete={handleDeleteEvidence}
              onDownload={handleDownloadEvidence}
              compact={true}
            />
          </MasonryGrid>
        </div>
      </aside>
    {/if}
  </div>
</div>

<!-- Evidence Modal -->
<Modal
  modalId="evidence-viewer"
  title={selectedEvidence?.title || 'Evidence'}
  size="lg"
>
  {#if selectedEvidence}
    <div class="evidence-modal-content">
      {#if selectedEvidence.type === 'image' && selectedEvidence.url}
        <img 
          src={selectedEvidence.url} 
          alt={selectedEvidence.title}
          class="evidence-preview-large"
        />
      {:else if selectedEvidence.type === 'video' && selectedEvidence.url}
        <video 
          src={selectedEvidence.url}
          controls
          class="evidence-preview-large"
        >
          <track kind="captions" />
        </video>
      {:else if selectedEvidence.url}
        <iframe 
          src={selectedEvidence.url}
          class="evidence-preview-large"
          title={selectedEvidence.title}
        ></iframe>
      {/if}
      
      <div class="evidence-details">
        <p><strong>Description:</strong> {selectedEvidence.description || 'No description'}</p>
        <p><strong>Type:</strong> {selectedEvidence.type}</p>
        <p><strong>Created:</strong> {new Date(selectedEvidence.createdAt).toLocaleString()}</p>
        
        {#if selectedEvidence.tags?.length > 0}
          <div class="evidence-tags-modal">
            <strong>Tags:</strong>
            {#each selectedEvidence.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
  
  <div slot="footer" class="modal-actions">
    <button 
      class="btn-secondary"
      on:click={() => uiStore.closeModal('evidence-viewer')}
    >
      Close
    </button>
    <button 
      class="btn-primary"
      on:click={() => handleInsertEvidence(selectedEvidence)}
    >
      Insert into Report
    </button>
  </div>
</Modal>

<!-- Settings Modal -->
<Modal
  modalId="report-settings"
  title="Report Settings"
  size="md"
>
  <!-- Settings form would go here -->
  <div class="settings-form">
    <p>Settings panel - TODO: Implement settings form</p>
  </div>
</Modal>

<style>
  .report-editor {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--pico-background-color, #ffffff);
    transition: all 0.3s ease;
  }
  
  .report-editor.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }
  
  .editor-toolbar {
    flex-shrink: 0;
    border-bottom: 1px solid var(--pico-border-color, #e2e8f0);
  }
  
  .editor-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .editor-sidebar {
    flex-shrink: 0;
    background: var(--pico-card-sectioning-background-color, #f8fafc);
    border-right: 1px solid var(--pico-border-color, #e2e8f0);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .sidebar-section {
    padding: 1rem;
    border-bottom: 1px solid var(--pico-border-color, #e2e8f0);
  }
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }
  
  .section-header h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--pico-color, #374151);
  }
  
  .add-evidence-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    background: var(--pico-primary, #3b82f6);
    color: white;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  
  .add-evidence-btn:hover {
    background: var(--pico-primary-hover, #2563eb);
  }
  
  .evidence-section {
    flex: 1;
    overflow-y: auto;
  }
  
  .evidence-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .empty-evidence {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--pico-muted-color, #6b7280);
  }
  
  .empty-evidence p {
    margin: 0 0 0.25rem;
    font-weight: 500;
  }
  
  .empty-evidence small {
    font-size: 0.75rem;
    opacity: 0.8;
  }
  
  .stats-section {
    flex-shrink: 0;
    background: var(--pico-background-color, #ffffff);
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: var(--pico-muted-color, #6b7280);
    font-weight: 500;
  }
  
  .stat-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--pico-color, #111827);
  }
  
  .stat-value.status-draft {
    color: var(--pico-primary, #3b82f6);
  }
  
  .stat-value.status-review {
    color: var(--pico-secondary, #f59e0b);
  }
  
  .stat-value.status-final {
    color: var(--pico-ins-color, #10b981);
  }
  
  .editor-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--pico-border-color, #e2e8f0);
    background: var(--pico-background-color, #ffffff);
  }
  
  .editor-title-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }
  
  .sidebar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    background: none;
    color: var(--pico-muted-color, #6b7280);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .sidebar-toggle:hover {
    background: var(--pico-primary-background, #f3f4f6);
    color: var(--pico-primary, #3b82f6);
  }
  
  .report-title-input {
    flex: 1;
    max-width: 30rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid transparent;
    background: none;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--pico-color, #111827);
    border-radius: 0.375rem;
    transition: border-color 0.15s ease;
  }
  
  .report-title-input:focus {
    outline: none;
    border-color: var(--pico-primary, #3b82f6);
    background: var(--pico-background-color, #ffffff);
  }
  
  .editor-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .layout-toggle,
  .fullscreen-toggle,
  .settings-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border: none;
    background: none;
    color: var(--pico-muted-color, #6b7280);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .layout-toggle:hover,
  .fullscreen-toggle:hover,
  .settings-btn:hover {
    background: var(--pico-primary-background, #f3f4f6);
    color: var(--pico-primary, #3b82f6);
  }
  
  .editor-wrapper {
    flex: 1;
    overflow: hidden;
    padding: 1rem;
  }
  
  .evidence-panel {
    width: 20rem;
    background: var(--pico-card-sectioning-background-color, #f8fafc);
    border-left: 1px solid var(--pico-border-color, #e2e8f0);
    display: flex;
    flex-direction: column;
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--pico-border-color, #e2e8f0);
  }
  
  .panel-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--pico-color, #374151);
  }
  
  .evidence-grid-panel {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
  
  /* Layout variations */
  .layout-single .evidence-panel {
    display: none;
  }
  
  .layout-dual .editor-sidebar {
    width: 16rem !important;
  }
  
  .layout-masonry .evidence-section {
    padding: 0.5rem;
  }
  
  /* Modal content */
  .evidence-modal-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .evidence-preview-large {
    width: 100%;
    max-height: 24rem;
    object-fit: contain;
    border-radius: 0.5rem;
    border: 1px solid var(--pico-border-color, #e2e8f0);
  }
  
  .evidence-details {
    padding: 1rem;
    background: var(--pico-card-sectioning-background-color, #f8fafc);
    border-radius: 0.5rem;
  }
  
  .evidence-details p {
    margin: 0.5rem 0;
  }
  
  .evidence-tags-modal {
    margin-top: 0.75rem;
  }
  
  .evidence-tags-modal .tag {
    display: inline-block;
    margin: 0.25rem 0.25rem 0 0;
    padding: 0.25rem 0.5rem;
    background: var(--pico-primary-background, #eff6ff);
    color: var(--pico-primary, #3b82f6);
    border-radius: 0.375rem;
    font-size: 0.75rem;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
  
  .btn-secondary,
  .btn-primary {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .btn-secondary {
    border: 1px solid var(--pico-border-color, #d1d5db);
    background: var(--pico-background-color, #ffffff);
    color: var(--pico-color, #374151);
  }
  
  .btn-secondary:hover {
    background: var(--pico-primary-background, #f9fafb);
  }
  
  .btn-primary {
    border: 1px solid var(--pico-primary, #3b82f6);
    background: var(--pico-primary, #3b82f6);
    color: white;
  }
  
  .btn-primary:hover {
    background: var(--pico-primary-hover, #2563eb);
  }
  
  .settings-form {
    padding: 1rem;
    text-align: center;
    color: var(--pico-muted-color, #6b7280);
  }
  
  /* Responsive design */
  @media (max-width: 1024px) {
    .editor-sidebar {
      width: 16rem !important;
    }
    
    .evidence-panel {
      width: 16rem;
    }
  }
  
  @media (max-width: 768px) {
    .layout-dual .evidence-panel {
      display: none;
    }
    
    .editor-sidebar {
      width: 14rem !important;
    }
  }
</style>
