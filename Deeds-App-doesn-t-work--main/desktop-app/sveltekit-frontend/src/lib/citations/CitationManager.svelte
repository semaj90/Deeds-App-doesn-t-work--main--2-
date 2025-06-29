<script lang="ts">
  import { onMount } from 'svelte';
  import type { LegacyCitationPoint } from '$lib/data/types';
  import { citationStore } from '$lib/citations/lokiStore';
  import CitationCard from '$lib/components/CitationCard.svelte';
  
  export let caseId: string | null = null; // If set, shows citations for this case
  export let allowCreation: boolean = true;
  export let title: string = 'Citation Points';
  
  let searchQuery = '';
  let citations: LegacyCitationPoint[] = [];
  let filteredCitations: LegacyCitationPoint[] = [];
  let showCreateForm = false;
  let loading = false;
  let stats = { total: 0, linked: 0, unlinked: 0, labels: [] };
  let activeFilter: 'all' | 'linked' | 'unlinked' = 'all';
  let selectedCitations: Set<string> = new Set();
  let isMultiSelectMode = false;
  
  // New citation form
  let newCitation = {
    summary: '',
    source: '',
    labels: ''
  };

  onMount(async () => {
    await initializeCitations();
    setupEnhancedInteractions();
    
    // Optimize layout after initial render
    setTimeout(() => {
      optimizeMasonryLayout();
    }, 200);
    
    // Add resize listener for responsive layout optimization
    const handleResize = () => {
      setTimeout(optimizeMasonryLayout, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  // Enhanced interactions using vanilla JavaScript
  function setupEnhancedInteractions() {
    // Add smooth scroll behavior for better UX
    const container = document.querySelector('.citations-container');
    if (container) {
      container.style.scrollBehavior = 'smooth';
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Enhanced intersection observer with staggered animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            // Staggered animation delay for masonry effect
            setTimeout(() => {
              entry.target.classList.add('animate-in');
            }, index * 50);
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '20px 0px'
      }
    );

    // Observe citation cards for animation with retry mechanism
    const observeCards = () => {
      const cards = document.querySelectorAll('.citations-grid > :not(.observed)');
      cards.forEach(card => {
        card.classList.add('observed');
        observer.observe(card);
      });
    };

    observeCards();
    
    // Re-observe when new cards are added
    const mutationObserver = new MutationObserver(() => {
      setTimeout(observeCards, 100);
    });
    
    const grid = document.querySelector('.citations-grid');
    if (grid) {
      mutationObserver.observe(grid, { childList: true });
    }

    // Add scroll-to-top functionality
    const scrollToTopBtn = createScrollToTopButton();
    document.body.appendChild(scrollToTopBtn);

    // Enhanced search with debouncing
    const searchInput = document.querySelector('.search-input input');
    if (searchInput) {
      let searchTimeout: NodeJS.Timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          handleSearch();
        }, 300);
      });
    }

    // Add visual feedback for drag and drop
    setupDragDropEnhancements();
  }

  function createScrollToTopButton() {
    const button = document.createElement('button');
    button.className = 'scroll-to-top';
    button.innerHTML = '↑';
    button.setAttribute('aria-label', 'Scroll to top');
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
      color: white;
      border: none;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
    `;

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset || document.documentElement.scrollTop;
      if (scrolled > 300) {
        button.style.opacity = '1';
        button.style.transform = 'translateY(0)';
      } else {
        button.style.opacity = '0';
        button.style.transform = 'translateY(20px)';
      }
    });

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    return button;
  }

  function setupDragDropEnhancements() {
    const dropZone = document.querySelector('.drop-zone');
    if (dropZone) {
      dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-hover');
      });

      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (!dropZone.contains(e.relatedTarget as Node)) {
          dropZone.classList.remove('drag-hover');
        }
      });

      dropZone.addEventListener('drop', () => {
        dropZone.classList.remove('drag-hover');
      });
    }
  }

  function handleKeyboardShortcuts(event: KeyboardEvent) {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    // Ctrl/Cmd + K to focus search
    if (isCtrlOrCmd && event.key === 'k') {
      event.preventDefault();
      const searchInput = document.querySelector('.search-input input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
        // Add visual indication
        searchInput.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3)';
        setTimeout(() => {
          searchInput.style.boxShadow = '';
        }, 1000);
      }
    }

    // Ctrl/Cmd + N to create new citation
    if (isCtrlOrCmd && event.key === 'n') {
      event.preventDefault();
      if (allowCreation) {
        showCreateForm = true;
        // Focus first input when form opens
        setTimeout(() => {
          const firstInput = document.querySelector('.create-form input') as HTMLInputElement;
          if (firstInput) firstInput.focus();
        }, 100);
      }
    }

    // Ctrl/Cmd + A to select all visible citations
    if (isCtrlOrCmd && event.key === 'a' && !showCreateForm) {
      event.preventDefault();
      const allVisible = filteredCitations.map(c => c.id);
      // Toggle selection - if all selected, deselect all, otherwise select all
      const allSelected = allVisible.every(id => selectedCitations.has(id));
      selectedCitations.clear();
      if (!allSelected) {
        allVisible.forEach(id => selectedCitations.add(id));
      }
      selectedCitations = selectedCitations;
      
      // Visual feedback
      showToast(allSelected ? 'All citations deselected' : `${allVisible.length} citations selected`);
    }

    // Escape to close form or clear selections
    if (event.key === 'Escape') {
      if (showCreateForm) {
        showCreateForm = false;
      } else if (selectedCitations.size > 0) {
        selectedCitations.clear();
        selectedCitations = selectedCitations;
        showToast('Selection cleared');
      }
    }

    // Arrow keys for filter navigation
    if (!showCreateForm && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      const filters = ['all', 'unlinked', 'linked'] as const;
      const currentIndex = filters.indexOf(activeFilter);
      const newIndex = event.key === 'ArrowLeft' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(filters.length - 1, currentIndex + 1);
      
      if (newIndex !== currentIndex) {
        filterByType(filters[newIndex]);
        showToast(`Filter: ${filters[newIndex]}`);
      }
    }

    // Delete key to remove selected citations
    if (event.key === 'Delete' && selectedCitations.size > 0 && !showCreateForm) {
      event.preventDefault();
      if (confirm(`Delete ${selectedCitations.size} selected citation(s)?`)) {
        selectedCitations.forEach(id => deleteCitation(id));
        showToast(`${selectedCitations.size} citations deleted`);
      }
    }
  }

  function showToast(message: string, duration = 2000) {
    // Remove existing toast
    const existingToast = document.querySelector('.citation-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'citation-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      z-index: 1000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    // Auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  async function initializeCitations() {
    loading = true;
    try {
      await citationStore.initialize();
      refreshCitations();
      updateStats();
    } catch (error) {
      console.error('Failed to initialize citations:', error);
    } finally {
      loading = false;
    }
  }

  function refreshCitations() {
    if (caseId) {
      // Show citations for specific case
      citations = citationStore.getCitationsByCase(caseId);
    } else {
      // Show all citations or filtered by search
      if (searchQuery.trim()) {
        citations = citationStore.searchCitations(searchQuery, 50);
      } else {
        switch (activeFilter) {
          case 'linked':
            citations = citationStore.searchCitations('').filter(c => c.linkedTo);
            break;
          case 'unlinked':
            citations = citationStore.getUnlinkedCitations(50);
            break;
          default:
            citations = citationStore.searchCitations('', 100);
        }
      }
    }
    filteredCitations = citations;
    
    // Optimize layout after citations change
    setTimeout(() => {
      optimizeMasonryLayout();
    }, 100);
  }

  function updateStats() {
    stats = citationStore.getStats();
  }

  // Handle search input
  function handleSearch() {
    refreshCitations();
  }

  // Handle adding citation to case
  async function handleAddToCase(citationId: string, caseId: string) {
    try {
      const success = citationStore.linkCitationsToCase([citationId], caseId);
      if (success) {
        refreshCitations();
        updateStats();
      }
    } catch (error) {
      console.error('Failed to link citation to case:', error);
      throw error;
    }
  }

  // Create new citation
  function createCitation() {
    if (!newCitation.summary.trim() || !newCitation.source.trim()) {
      return;
    }

    const labels = newCitation.labels
      .split(',')
      .map(label => label.trim())
      .filter(label => label.length > 0);

    const citation = citationStore.addCitation({
      summary: newCitation.summary.trim(),
      source: newCitation.source.trim(),
      labels,
      linkedTo: caseId || undefined
    });

    // Reset form
    newCitation = { summary: '', source: '', labels: '' };
    showCreateForm = false;
    
    refreshCitations();
    updateStats();
  }

  // Generate AI summary (mock implementation)
  async function generateAISummary() {
    if (!newCitation.source.trim()) return;
    
    // Mock AI summary generation
    const mockSummaries = [
      'Evidence shows suspicious activity captured on surveillance footage during the time frame',
      'Forensic analysis reveals DNA match with 99.7% confidence level',
      'Witness testimony provides crucial timeline information for the incident',
      'Phone records indicate communication with known associates during critical period',
      'Financial records show unusual transaction patterns prior to the event'
    ];
    
    newCitation.summary = mockSummaries[Math.floor(Math.random() * mockSummaries.length)];
  }

  // Filter citations by type
  function filterByType(type: 'all' | 'linked' | 'unlinked') {
    activeFilter = type;
    refreshCitations();
  }

  // Handle drag over for drop zone
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  // Handle drop for creating citations from evidence
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    
    try {
      const data = event.dataTransfer?.getData('application/json');
      if (data) {
        const droppedData = JSON.parse(data);
        if (droppedData.type === 'evidence') {
          // Auto-populate form with evidence data
          newCitation.source = `evidence/${droppedData.evidence.id}`;
          newCitation.summary = droppedData.evidence.description || '';
          newCitation.labels = droppedData.evidence.type || '';
          showCreateForm = true;
        }
      }
    } catch (error) {
      console.error('Failed to process dropped data:', error);
    }
  }

  // Enhanced selection management
  function toggleCitationSelection(citationId: string, event?: MouseEvent) {
    if (event?.ctrlKey || event?.metaKey || isMultiSelectMode) {
      // Multi-select mode
      if (selectedCitations.has(citationId)) {
        selectedCitations.delete(citationId);
      } else {
        selectedCitations.add(citationId);
      }
    } else if (event?.shiftKey && selectedCitations.size > 0) {
      // Range selection
      const citationIds = filteredCitations.map(c => c.id);
      const lastSelected = Array.from(selectedCitations)[selectedCitations.size - 1];
      const startIndex = citationIds.indexOf(lastSelected);
      const endIndex = citationIds.indexOf(citationId);
      
      const [start, end] = startIndex < endIndex 
        ? [startIndex, endIndex] 
        : [endIndex, startIndex];
      
      for (let i = start; i <= end; i++) {
        selectedCitations.add(citationIds[i]);
      }
    } else {
      // Single select
      selectedCitations.clear();
      selectedCitations.add(citationId);
    }
    
    selectedCitations = selectedCitations;
    isMultiSelectMode = selectedCitations.size > 1;
  }

  function clearSelection() {
    selectedCitations.clear();
    selectedCitations = selectedCitations;
    isMultiSelectMode = false;
  }

  function selectAll() {
    selectedCitations.clear();
    filteredCitations.forEach(citation => selectedCitations.add(citation.id));
    selectedCitations = selectedCitations;
    isMultiSelectMode = selectedCitations.size > 1;
  }

  function bulkDelete() {
    if (selectedCitations.size === 0) return;
    
    if (confirm(`Delete ${selectedCitations.size} selected citation(s)?`)) {
      selectedCitations.forEach(id => deleteCitation(id));
      clearSelection();
      showToast(`${selectedCitations.size} citations deleted`);
    }
  }

  function bulkExport() {
    if (selectedCitations.size === 0) return;
    
    const selected = citations.filter(c => selectedCitations.has(c.id));
    const jsonData = JSON.stringify(selected, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `citations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${selectedCitations.size} citations`);
  }

  // Layout management for responsive masonry
  function optimizeMasonryLayout() {
    const grid = document.querySelector('.citations-grid') as HTMLElement;
    if (!grid) return;

    const cards = Array.from(grid.children) as HTMLElement[];
    const containerWidth = grid.offsetWidth;
    const cardMinWidth = 300;
    const gap = 16;
    
    let columnCount = Math.floor((containerWidth + gap) / (cardMinWidth + gap));
    columnCount = Math.max(1, Math.min(4, columnCount));
    
    grid.style.columnCount = columnCount.toString();
    
    // Balance column heights
    setTimeout(() => {
      const columns: HTMLElement[][] = Array.from({ length: columnCount }, () => []);
      const columnHeights = new Array(columnCount).fill(0);
      
      cards.forEach(card => {
        const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
        columns[shortestColumnIndex].push(card);
        columnHeights[shortestColumnIndex] += card.offsetHeight + gap;
      });
    }, 100);
  }
</script>

<div class="citation-manager">
  <div class="manager-header">
    <div class="header-content">
      <h2>{title}</h2>
      {#if !caseId}
        <div class="stats-display">
          <span class="stat-item">Total: {stats.total}</span>
          <span class="stat-item">Linked: {stats.linked}</span>
          <span class="stat-item">Available: {stats.unlinked}</span>
          {#if selectedCitations.size > 0}
            <span class="stat-item selected">Selected: {selectedCitations.size}</span>
          {/if}
        </div>
      {/if}
    </div>
    
    <div class="header-actions">
      {#if selectedCitations.size > 0}
        <div class="bulk-actions">
          <button class="btn-bulk btn-export" on:click={bulkExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Export ({selectedCitations.size})
          </button>
          <button class="btn-bulk btn-delete" on:click={bulkDelete}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
            </svg>
            Delete ({selectedCitations.size})
          </button>
          <button class="btn-bulk btn-clear" on:click={clearSelection}>
            Clear Selection
          </button>
        </div>
      {/if}
      
      {#if allowCreation}
        <button 
          class="btn-create"
          on:click={() => showCreateForm = !showCreateForm}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          {showCreateForm ? 'Cancel' : 'Create Citation'}
        </button>
      {/if}
    </div>
  </div>

  <!-- Search and Filters -->
  <div class="search-section">
    <div class="search-controls">
      <div class="search-input">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          type="text"
          placeholder="Search citations by content, source, or labels... (Ctrl+K)"
          bind:value={searchQuery}
          on:input={handleSearch}
        />
        {#if searchQuery}
          <button class="clear-search" on:click={() => { searchQuery = ''; handleSearch(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        {/if}
      </div>
      
      <div class="selection-controls">
        <button class="btn-select-all" on:click={selectAll} disabled={filteredCitations.length === 0}>
          Select All ({filteredCitations.length})
        </button>
        {#if selectedCitations.size > 0}
          <button class="btn-clear-selection" on:click={clearSelection}>
            Clear ({selectedCitations.size})
          </button>
        {/if}
      </div>
    </div>
    
    {#if !caseId}
      <div class="filter-section">
        <div class="filter-buttons">
          <button 
            class="filter-btn {activeFilter === 'all' ? 'active' : ''}" 
            on:click={() => filterByType('all')}
          >
            <span class="filter-icon">📋</span>
            All
          </button>
          <button 
            class="filter-btn {activeFilter === 'unlinked' ? 'active' : ''}" 
            on:click={() => filterByType('unlinked')}
          >
            <span class="filter-icon">🔗</span>
            Available
          </button>
          <button 
            class="filter-btn {activeFilter === 'linked' ? 'active' : ''}" 
            on:click={() => filterByType('linked')}
          >
            <span class="filter-icon">✅</span>
            Linked
          </button>
        </div>
        
        <div class="view-controls">
          <button 
            class="view-btn {isMultiSelectMode ? 'active' : ''}" 
            on:click={() => isMultiSelectMode = !isMultiSelectMode}
            title="Toggle multi-select mode"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7,2V4H17V2H7M7,22H17V20H7V22M7,8H17V6H7V8M7,14H17V12H7V14M7,18H17V16H7V18Z"/>
            </svg>
            Multi-Select
          </button>
          <button class="view-btn" on:click={optimizeMasonryLayout} title="Optimize layout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3"/>
            </svg>
            Optimize
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Create Citation Form -->
  {#if showCreateForm && allowCreation}
    <div 
      class="create-form"
      on:dragover={handleDragOver}
      on:drop={handleDrop}
      role="region"
      aria-label="Create new citation"
    >
      <h3>Create New Citation Point</h3>
      <div class="drop-zone">
        <p>Drag evidence here to auto-populate, or fill manually</p>
      </div>
      
      <div class="form-grid">
        <div class="form-field">
          <label for="source">Source</label>
          <input
            id="source"
            type="text"
            placeholder="e.g., evidence/video_001, document/report_123"
            bind:value={newCitation.source}
          />
        </div>
        
        <div class="form-field">
          <label for="summary">AI Summary</label>
          <div class="summary-input">
            <textarea
              id="summary"
              placeholder="AI-generated evidence summary..."
              bind:value={newCitation.summary}
              rows="3"
            ></textarea>
            <button 
              class="btn-ai-generate"
              on:click={generateAISummary}
              type="button"
            >
              Generate AI Summary
            </button>
          </div>
        </div>
        
        <div class="form-field">
          <label for="labels">Labels</label>
          <input
            id="labels"
            type="text"
            placeholder="surveillance, forensics, timeline (comma-separated)"
            bind:value={newCitation.labels}
          />
        </div>
      </div>
      
      <div class="form-actions">
        <button class="btn-cancel" on:click={() => showCreateForm = false}>
          Cancel
        </button>
        <button 
          class="btn-save"
          on:click={createCitation}
          disabled={!newCitation.summary.trim() || !newCitation.source.trim()}
        >
          Create Citation
        </button>
      </div>
    </div>
  {/if}

  <!-- Citations List -->
  <div class="citations-container">
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading citations...</p>
      </div>
    {:else if filteredCitations.length === 0}
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        <h3>No Citations Found</h3>
        <p>
          {searchQuery ? 'Try adjusting your search terms.' : 'Create your first citation point to get started.'}
        </p>
      </div>
    {:else}
      <div class="citations-grid" class:multi-select={isMultiSelectMode}>
        {#each filteredCitations as citation (citation.id)}
          <div 
            class="citation-wrapper"
            class:selected={selectedCitations.has(citation.id)}
            on:click={(e) => toggleCitationSelection(citation.id, e)}
            on:keydown={(e) => e.key === 'Enter' && toggleCitationSelection(citation.id)}
            role="button"
            tabindex="0"
          >
            <CitationCard
              {citation}
              isDraggable={true}
              showAddToCase={!citation.linkedTo && !caseId}
              isSelected={selectedCitations.has(citation.id)}
              onAddToCase={handleAddToCase}
              on:citationAdded={refreshCitations}
            />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .citation-manager {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .header-content h2 {
    margin: 0 0 12px 0;
    color: #111827;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Enhanced Stats Display with Visual Studio-style colors */
  .stats-display {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .stat-item {
    font-size: 0.875rem;
    color: #4b5563;
    padding: 8px 16px;
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    border: 1px solid #d1d5db;
    border-radius: 20px;
    font-weight: 600;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

  .stat-item:hover {
    background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
    border-color: #0ea5e9;
    color: #0c4a6e;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
  }

  .stat-item.selected {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-color: #f59e0b;
    color: #92400e;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  .stat-item::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 12px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transform: translateY(-50%);
    background: currentColor;
    opacity: 0.7;
  }

  /* Header Actions and Bulk Operations */
  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .bulk-actions {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border: 1px solid #fca5a5;
    border-radius: 10px;
    backdrop-filter: blur(10px);
  }

  .btn-bulk {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
  }

  .btn-export {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  .btn-export:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
  }

  .btn-delete {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }

  .btn-delete:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(239, 68, 68, 0.3);
  }

  .btn-clear {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
  }

  .btn-clear:hover {
    background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(107, 114, 128, 0.3);
  }

  /* Visual Studio-inspired create button */
  .btn-create {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
    color: white;
    border: 1px solid #005a9e;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 122, 204, 0.25);
    position: relative;
    overflow: hidden;
  }

  .btn-create::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s;
  }

  .btn-create:hover {
    background: linear-gradient(135deg, #1e88e5 0%, #0d47a1 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 122, 204, 0.4);
  }

  .btn-create:hover::before {
    left: 100%;
  }

  .btn-create:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 122, 204, 0.4);
  }

  /* Enhanced Search Section */
  .search-section {
    margin-bottom: 32px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }

  .search-controls {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .search-input {
    flex: 1;
    min-width: 300px;
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 16px;
    color: #9ca3af;
    pointer-events: none;
    z-index: 1;
  }

  .search-input input {
    width: 100%;
    padding: 14px 16px 14px 44px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 0.875rem;
    outline: none;
    background: #ffffff;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
    color: #111827;
  }

  .search-input input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    background: #fefeff;
  }

  .search-input input::placeholder {
    color: #9ca3af;
    font-style: italic;
  }

  .clear-search {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .clear-search:hover {
    background: #f3f4f6;
    color: #6b7280;
  }

  .selection-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .btn-select-all,
  .btn-clear-selection {
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: #374151;
  }

  .btn-select-all:hover:not(:disabled) {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: #3b82f6;
    color: #1e40af;
  }

  .btn-clear-selection {
    background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
    border-color: #fca5a5;
    color: #991b1b;
  }

  .btn-clear-selection:hover {
    background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%);
    border-color: #f87171;
  }

  .btn-select-all:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Enhanced Filter Section */
  .filter-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .filter-buttons {
    display: flex;
    gap: 6px;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    padding: 6px;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: #64748b;
    position: relative;
  }

  .filter-icon {
    font-size: 1rem;
  }

  .filter-btn:hover {
    background: rgba(255, 255, 255, 0.8);
    color: #334155;
    transform: translateY(-1px);
  }

  .filter-btn.active {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    color: #1e40af;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #cbd5e1;
  }

  .filter-btn.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 3px;
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    border-radius: 2px;
  }

  .view-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .view-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: #374151;
  }

  .view-btn:hover {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-color: #9ca3af;
  }

  .view-btn.active {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: #3b82f6;
    color: #1e40af;
  }

  /* Enhanced create form with VS Code-inspired styling */
  .create-form {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 3px dashed #cbd5e1;
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 32px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  .create-form::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #007acc, #1e88e5, #42a5f5, #7c3aed);
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .create-form:hover {
    border-color: #007acc;
    background: linear-gradient(135deg, #f0f8ff 0%, #e3f2fd 100%);
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 122, 204, 0.15);
  }

  .create-form:hover::before {
    opacity: 1;
  }

  .create-form h3 {
    margin: 0 0 20px 0;
    color: #111827;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  .drop-zone {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 2px dashed #60a5fa;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    margin-bottom: 24px;
    color: #1e40af;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .drop-zone.drag-hover {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: #3b82f6;
    transform: scale(1.02);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
  }

  .form-grid {
    display: grid;
    gap: 20px;
    margin-bottom: 24px;
  }

  .form-field label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
    letter-spacing: 0.025em;
  }

  .form-field input,
  .form-field textarea {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.875rem;
    outline: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: #ffffff;
    color: #111827;
    font-family: inherit;
  }

  .form-field input:focus,
  .form-field textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #fefeff;
  }

  .summary-input {
    position: relative;
  }

  .btn-ai-generate {
    position: absolute;
    top: 12px;
    right: 12px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
  }

  .btn-ai-generate:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
  }

  .btn-cancel,
  .btn-save {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid transparent;
  }

  .btn-cancel {
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    border-color: #d1d5db;
    color: #374151;
  }

  .btn-cancel:hover {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-color: #9ca3af;
  }

  .btn-save {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-color: #10b981;
    color: white;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
  }

  .btn-save:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    border-color: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-save:disabled {
    background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
    border-color: #d1d5db;
    cursor: not-allowed;
    box-shadow: none;
  }

  .citations-container {
    min-height: 400px;
    position: relative;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: #6b7280;
    text-align: center;
  }

  .loading-state .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state svg {
    margin-bottom: 20px;
    color: #d1d5db;
  }

  .empty-state h3 {
    margin: 0 0 12px 0;
    font-size: 1.25rem;
    color: #374151;
    font-weight: 600;
  }

  .empty-state p {
    margin: 0;
    max-width: 400px;
    line-height: 1.6;
  }

  /* Enhanced Citations Grid with Masonry Layout */
  .citations-grid {
    column-count: 3;
    column-gap: 20px;
    column-fill: balance;
    position: relative;
  }

  .citation-wrapper {
    break-inside: avoid;
    margin-bottom: 20px;
    display: block;
    width: 100%;
    position: relative;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
    overflow: hidden;
  }

  .citation-wrapper:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .citation-wrapper.selected {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.05) 100%);
  }

  .citation-wrapper.selected::before {
    content: '✓';
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    background: #3b82f6;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  .citations-grid.multi-select .citation-wrapper {
    border: 2px dashed transparent;
    transition: all 0.2s ease;
  }

  .citations-grid.multi-select .citation-wrapper:hover {
    border-color: #93c5fd;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(147, 197, 253, 0.02) 100%);
  }

  /* Animation classes for intersection observer */
  .citation-wrapper:not(.animate-in) {
    opacity: 0;
    transform: translateY(20px);
  }

  .citation-wrapper.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  /* Responsive design improvements */
  @media (max-width: 1200px) {
    .citations-grid {
      column-count: 2;
      column-gap: 16px;
    }
    
    .citation-wrapper {
      margin-bottom: 16px;
    }
  }

  @media (max-width: 768px) {
    .citation-manager {
      padding: 16px;
    }

    .citations-grid {
      column-count: 1;
      column-gap: 0;
    }

    .citation-wrapper {
      margin-bottom: 12px;
    }

    .manager-header {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
      padding: 16px;
    }

    .header-actions {
      justify-content: center;
    }

    .bulk-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .stats-display {
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .search-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .filter-section {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .filter-buttons {
      justify-content: center;
      flex-wrap: wrap;
    }

    .view-controls {
      justify-content: center;
    }

    .form-actions {
      flex-direction: column;
    }

    .search-section {
      padding: 16px;
    }

    .create-form {
      padding: 20px;
    }
  }

  @media (max-width: 480px) {
    .citation-manager {
      padding: 12px;
    }

    .manager-header {
      padding: 12px;
    }

    .search-section {
      padding: 12px;
    }

    .create-form {
      padding: 16px;
    }

    .btn-create,
    .btn-bulk {
      font-size: 0.75rem;
      padding: 8px 12px;
    }

    .header-content h2 {
      font-size: 1.5rem;
    }

    .bulk-actions {
      gap: 4px;
    }
  }

  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .citation-manager {
      background: #111827;
      color: #f9fafb;
    }

    .manager-header {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      border-bottom-color: #374151;
    }

    .search-section {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      border-color: #374151;
    }

    .search-input input {
      background: #111827;
      border-color: #374151;
      color: #f9fafb;
    }

    .search-input input:focus {
      border-color: #60a5fa;
    }

    .filter-buttons {
      background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
      border-color: #4b5563;
    }

    .filter-btn {
      color: #d1d5db;
    }

    .filter-btn:hover {
      background: rgba(75, 85, 99, 0.5);
      color: #f3f4f6;
    }

    .filter-btn.active {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      color: #60a5fa;
    }
  }
</style>
