<!--
  LayoutEditor Component - Drag-and-drop layout editor with save/load support
  
  Props:
  - layoutData: object (optional) - initial layout configuration
  - caseId: string - case ID for saving/loading layouts
  - readonly: boolean (default: false) - disable editing
  - gridSize: number (default: 12) - grid columns
  - snapToGrid: boolean (default: true) - snap elements to grid
  - class: additional CSS classes
  
  Events:
  - layoutChanged: fired when layout changes
  - layoutSaved: fired when layout is saved
  - layoutLoaded: fired when layout is loaded
  
  Slots:
  - toolbar: custom toolbar content
  - sidebar: custom sidebar content
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import Button from './Button.svelte';
  import Card from '$ui/components/Card.svelte';
  import Grid from '$ui/components/Grid.svelte';
  import Tooltip from '$ui/components/Tooltip.svelte';

  // Props
  export let layoutData: any = null;
  export let caseId: string;
  export let readonly: boolean = false;
  export let gridSize: number = 12;
  export let snapToGrid: boolean = true;
  export let autoSave: boolean = true;

  // Additional classes
  let className: string = '';
  export { className as class };

  const dispatch = createEventDispatcher();

  // Component types available for dragging
  const componentTypes = [
    {
      id: 'text',
      name: 'Text Block',
      icon: '📝',
      description: 'Add text content',
      defaultProps: { content: 'Enter text here...', fontSize: 16 }
    },
    {
      id: 'image',
      name: 'Image',
      icon: '🖼️',
      description: 'Add image content',
      defaultProps: { src: '', alt: 'Image', width: 300, height: 200 }
    },
    {
      id: 'evidence',
      name: 'Evidence Item',
      icon: '📋',
      description: 'Add evidence documentation',
      defaultProps: { title: 'Evidence', type: 'document', tags: [] }
    },
    {
      id: 'timeline',
      name: 'Timeline',
      icon: '📅',
      description: 'Add timeline component',
      defaultProps: { events: [], orientation: 'vertical' }
    },
    {
      id: 'notes',
      name: 'Notes',
      icon: '📌',
      description: 'Add notes section',
      defaultProps: { title: 'Notes', content: '', color: '#ffeb3b' }
    },
    {
      id: 'chart',
      name: 'Chart/Graph',
      icon: '📊',
      description: 'Add data visualization',
      defaultProps: { type: 'bar', data: [], title: 'Chart' }
    }
  ];

  // State
  let layoutItems: any[] = [];
  let selectedItem: any = null;
  let draggedItem: any = null;
  let isLoading = false;
  let showPropertyPanel = false;
  let gridColumns = Array.from({ length: gridSize }, (_, i) => i + 1);

  // Layout container reference
  let layoutContainer: HTMLElement;

  onMount(() => {
    if (layoutData) {
      loadLayout(layoutData);
    } else if (caseId) {
      loadLayoutFromServer();
    }

    // Auto-save setup
    if (autoSave && !readonly) {
      const autoSaveInterval = setInterval(() => {
        if (layoutItems.length > 0) {
          saveLayoutToServer();
        }
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  });

  // Computed classes
  $: classes = [
    'layout-editor',
    readonly ? 'layout-readonly' : '',
    snapToGrid ? 'layout-snap-grid' : '',
    className
  ].filter(Boolean).join(' ');

  // DND Configuration
  const flipDurationMs = 200;

  function handleDndConsider(e: CustomEvent) {
    layoutItems = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent) {
    layoutItems = e.detail.items;
    dispatch('layoutChanged', { items: layoutItems });
    
    if (autoSave && !readonly) {
      saveLayoutToServer();
    }
  }

  function handleComponentDrop(componentType: any, event: DragEvent) {
    if (readonly) return;

    const rect = layoutContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Snap to grid if enabled
    const gridX = snapToGrid ? Math.round(x / (rect.width / gridSize)) : x;
    const gridY = snapToGrid ? Math.round(y / 20) * 20 : y;

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: componentType.id,
      name: componentType.name,
      position: { x: gridX, y: gridY },
      size: { width: 4, height: 2 }, // Grid units
      props: { ...componentType.defaultProps },
      style: {},
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };

    layoutItems = [...layoutItems, newItem];
    selectedItem = newItem;
    showPropertyPanel = true;
    
    dispatch('layoutChanged', { items: layoutItems });
  }

  function selectItem(item: any) {
    if (readonly) return;
    selectedItem = item;
    showPropertyPanel = true;
  }

  function deleteItem(itemId: string) {
    if (readonly) return;
    layoutItems = layoutItems.filter(item => item.id !== itemId);
    if (selectedItem?.id === itemId) {
      selectedItem = null;
      showPropertyPanel = false;
    }
    dispatch('layoutChanged', { items: layoutItems });
  }

  function duplicateItem(item: any) {
    if (readonly) return;
    const newItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: item.position.x + 1,
        y: item.position.y + 1
      },
      metadata: {
        ...item.metadata,
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };
    layoutItems = [...layoutItems, newItem];
    dispatch('layoutChanged', { items: layoutItems });
  }

  function updateItemProperty(itemId: string, property: string, value: any) {
    layoutItems = layoutItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          [property]: value,
          metadata: {
            ...item.metadata,
            modified: new Date().toISOString()
          }
        };
      }
      return item;
    });
    dispatch('layoutChanged', { items: layoutItems });
  }

  function loadLayout(data: any) {
    layoutItems = data.items || [];
    dispatch('layoutLoaded', data);
  }

  async function loadLayoutFromServer() {
    if (!caseId) return;

    isLoading = true;
    try {
      const response = await fetch(`/api/layout/load?caseId=${caseId}`);
      if (response.ok) {
        const data = await response.json();
        loadLayout(data);
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
    } finally {
      isLoading = false;
    }
  }

  async function saveLayoutToServer() {
    if (!caseId || readonly) return;

    try {
      const layoutData = {
        caseId,
        items: layoutItems,
        metadata: {
          gridSize,
          snapToGrid,
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      const response = await fetch('/api/layout/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layoutData)
      });

      if (response.ok) {
        dispatch('layoutSaved', layoutData);
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  }

  function exportLayout() {
    const data = {
      items: layoutItems,
      metadata: {
        gridSize,
        snapToGrid,
        exported: new Date().toISOString()
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layout_${caseId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importLayout(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        loadLayout(data);
      } catch (error) {
        console.error('Failed to import layout:', error);
      }
    };
    reader.readAsText(file);
  }

  // Generate grid lines for visual guidance
  $: gridLines = snapToGrid ? Array.from({ length: gridSize + 1 }, (_, i) => i) : [];
</script>

<div class={classes}>
  <!-- Toolbar -->
  <div class="layout-toolbar">
    {#if $$slots.toolbar}
      <slot name="toolbar" />
    {:else}
      <div class="toolbar-section">
        <h2 class="toolbar-title">Layout Editor</h2>
        <div class="toolbar-actions">
          <Button 
            variant="outline" 
            size="sm"
            on:click={loadLayoutFromServer}
            disabled={isLoading || !caseId}
          >
            📁 Load
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            on:click={saveLayoutToServer}
            disabled={isLoading || readonly || !caseId}
          >
            💾 Save
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            on:click={exportLayout}
            disabled={layoutItems.length === 0}
          >
            📤 Export
          </Button>
          <label class="btn btn-outline btn-sm">
            📥 Import
            <input 
              type="file" 
              accept=".json"
              on:change={importLayout}
              style="display: none;"
              disabled={readonly}
            />
          </label>
        </div>
      </div>
    {/if}
  </div>

  <div class="layout-content">
    <!-- Component Palette -->
    <div class="component-palette">
      {#if $$slots.sidebar}
        <slot name="sidebar" />
      {:else}
        <h3>Components</h3>
        <Grid cols={1} gap="sm">
          {#each componentTypes as componentType}
            <Tooltip text={componentType.description} position="right">
              <Card 
                clickable={!readonly}
                padding="sm"
                class="component-item"
                on:click={() => !readonly && handleComponentDrop(componentType, new DragEvent('drop'))}
              >
                <div class="component-icon">{componentType.icon}</div>
                <div class="component-name">{componentType.name}</div>
              </Card>
            </Tooltip>
          {/each}
        </Grid>
      {/if}
    </div>

    <!-- Layout Canvas -->
    <div class="layout-canvas" bind:this={layoutContainer}>
      <!-- Grid Lines -->
      {#if snapToGrid && !readonly}
        <div class="grid-overlay">
          {#each gridLines as line}
            <div 
              class="grid-line grid-line-vertical" 
              style="left: {(line / gridSize) * 100}%"
            ></div>
          {/each}
        </div>
      {/if}

      <!-- Layout Items -->
      <div 
        class="layout-items"
        use:dndzone={{
          items: layoutItems,
          flipDurationMs,
          dropTargetStyle: {},
          dragDisabled: readonly
        }}
        on:consider={handleDndConsider}
        on:finalize={handleDndFinalize}
      >
        {#each layoutItems as item (item.id)}
          <div 
            class="layout-item"
            class:selected={selectedItem?.id === item.id}
            style="
              grid-column: span {item.size.width};
              grid-row: span {item.size.height};
            "
            on:click={() => selectItem(item)}
            on:keydown={(e) => e.key === 'Enter' && selectItem(item)}
            tabindex="0"
            role="button"
          >
            <!-- Item Content -->
            <div class="item-content">
              <div class="item-header">
                <span class="item-icon">{componentTypes.find(t => t.id === item.type)?.icon}</span>
                <span class="item-title">{item.name}</span>
                {#if !readonly}
                  <div class="item-actions">
                    <button 
                      class="action-btn"
                      on:click|stopPropagation={() => duplicateItem(item)}
                      title="Duplicate"
                    >
                      📋
                    </button>
                    <button 
                      class="action-btn"
                      on:click|stopPropagation={() => deleteItem(item.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                {/if}
              </div>
              
              <!-- Render component based on type -->
              <div class="item-body">
                {#if item.type === 'text'}
                  <div class="text-component">
                    {item.props.content}
                  </div>
                {:else if item.type === 'image'}
                  <div class="image-component">
                    {#if item.props.src}
                      <img src={item.props.src} alt={item.props.alt} />
                    {:else}
                      <div class="image-placeholder">📷 Image</div>
                    {/if}
                  </div>
                {:else if item.type === 'evidence'}
                  <div class="evidence-component">
                    <h4>{item.props.title}</h4>
                    <p>Type: {item.props.type}</p>
                    {#if item.props.tags.length > 0}
                      <div class="tags">
                        {#each item.props.tags as tag}
                          <span class="tag">{tag}</span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {:else if item.type === 'notes'}
                  <div class="notes-component" style="background-color: {item.props.color}">
                    <h4>{item.props.title}</h4>
                    <p>{item.props.content}</p>
                  </div>
                {:else}
                  <div class="generic-component">
                    {item.name}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Selection Indicator -->
            {#if selectedItem?.id === item.id && !readonly}
              <div class="selection-indicator"></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Property Panel -->
    {#if showPropertyPanel && selectedItem && !readonly}
      <div class="property-panel">
        <Card title="Properties" padding="md">
          <div class="property-form">
            <div class="form-group">
              <label for="itemName">Name</label>
              <input
                id="itemName"
                type="text"
                class="form-input"
                bind:value={selectedItem.name}
                on:input={() => updateItemProperty(selectedItem.id, 'name', selectedItem.name)}
              />
            </div>

            <div class="form-group">
              <label for="itemWidth">Width (Grid Units)</label>
              <input
                id="itemWidth"
                type="number"
                min="1"
                max={gridSize}
                class="form-input"
                bind:value={selectedItem.size.width}
                on:input={() => updateItemProperty(selectedItem.id, 'size', selectedItem.size)}
              />
            </div>

            <div class="form-group">
              <label for="itemHeight">Height (Grid Units)</label>
              <input
                id="itemHeight"
                type="number"
                min="1"
                max="10"
                class="form-input"
                bind:value={selectedItem.size.height}
                on:input={() => updateItemProperty(selectedItem.id, 'size', selectedItem.size)}
              />
            </div>

            <!-- Type-specific properties -->
            {#if selectedItem.type === 'text'}
              <div class="form-group">
                <label for="itemContent">Content</label>
                <textarea
                  id="itemContent"
                  class="form-textarea"
                  bind:value={selectedItem.props.content}
                  on:input={() => updateItemProperty(selectedItem.id, 'props', selectedItem.props)}
                ></textarea>
              </div>
              <div class="form-group">
                <label for="itemFontSize">Font Size</label>
                <input
                  id="itemFontSize"
                  type="number"
                  min="8"
                  max="72"
                  class="form-input"
                  bind:value={selectedItem.props.fontSize}
                  on:input={() => updateItemProperty(selectedItem.id, 'props', selectedItem.props)}
                />
              </div>
            {/if}

            {#if selectedItem.type === 'notes'}
              <div class="form-group">
                <label for="itemColor">Color</label>
                <input
                  id="itemColor"
                  type="color"
                  class="form-input"
                  bind:value={selectedItem.props.color}
                  on:input={() => updateItemProperty(selectedItem.id, 'props', selectedItem.props)}
                />
              </div>
            {/if}

            <div class="form-actions">
              <Button 
                variant="outline" 
                size="sm"
                on:click={() => showPropertyPanel = false}
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      </div>
    {/if}
  </div>

  <!-- Loading Overlay -->
  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading layout...</p>
    </div>
  {/if}
</div>

<style>
  .layout-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-primary);
  }

  .layout-toolbar {
    flex-shrink: 0;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-secondary);
  }

  .toolbar-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .toolbar-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  .toolbar-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .layout-content {
    flex: 1;
    display: grid;
    grid-template-columns: 250px 1fr auto;
    gap: var(--spacing-md);
    min-height: 0;
  }

  .component-palette {
    padding: var(--spacing-md);
    border-right: 1px solid var(--color-border);
    background-color: var(--color-secondary);
    overflow-y: auto;
  }

  .component-palette h3 {
    margin: 0 0 var(--spacing-md) 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
  }

  .component-item {
    cursor: pointer;
    text-align: center;
    transition: all var(--transition-fast);
  }

  .component-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .component-icon {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-xs);
  }

  .component-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }

  .layout-canvas {
    position: relative;
    flex: 1;
    overflow: auto;
    background-color: var(--color-primary);
    background-image: 
      linear-gradient(var(--color-border) 1px, transparent 1px),
      linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  .grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
  }

  .grid-line {
    position: absolute;
    background-color: var(--color-accent);
    opacity: 0.3;
  }

  .grid-line-vertical {
    top: 0;
    bottom: 0;
    width: 1px;
  }

  .layout-items {
    display: grid;
    grid-template-columns: repeat(var(--grid-size, 12), 1fr);
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    min-height: 100%;
  }

  .layout-item {
    position: relative;
    background-color: var(--color-primary);
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-fast);
    cursor: pointer;
  }

  .layout-item:hover {
    border-color: var(--color-accent);
    box-shadow: var(--shadow-md);
  }

  .layout-item.selected {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .selection-indicator {
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid var(--color-accent);
    border-radius: var(--border-radius-md);
    pointer-events: none;
  }

  .item-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .item-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-secondary);
    border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
  }

  .item-icon {
    font-size: var(--font-size-base);
  }

  .item-title {
    flex: 1;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .action-btn {
    background: none;
    border: none;
    padding: var(--spacing-xs);
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    transition: background-color var(--transition-fast);
  }

  .action-btn:hover {
    background-color: var(--color-hover);
  }

  .item-body {
    flex: 1;
    padding: var(--spacing-sm);
    overflow: hidden;
  }

  .text-component {
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
  }

  .image-component img {
    max-width: 100%;
    height: auto;
    border-radius: var(--border-radius-sm);
  }

  .image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    background-color: var(--color-tertiary);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-muted);
  }

  .evidence-component h4 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  .evidence-component p {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .tag {
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: var(--color-accent);
    color: white;
    font-size: var(--font-size-xs);
    border-radius: var(--border-radius-sm);
  }

  .notes-component {
    padding: var(--spacing-sm);
    border-radius: var(--border-radius-sm);
  }

  .notes-component h4 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  .notes-component p {
    margin: 0;
    font-size: var(--font-size-xs);
  }

  .property-panel {
    width: 300px;
    padding: var(--spacing-md);
    border-left: 1px solid var(--color-border);
    background-color: var(--color-secondary);
    overflow-y: auto;
  }

  .property-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .form-group label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--spacing-md);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .layout-content {
      grid-template-columns: 200px 1fr;
    }

    .property-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      box-shadow: var(--shadow-lg);
    }
  }

  @media (max-width: 768px) {
    .layout-content {
      grid-template-columns: 1fr;
    }

    .component-palette {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 999;
      transform: translateX(-100%);
      transition: transform var(--transition-normal);
    }

    .component-palette.open {
      transform: translateX(0);
    }
  }

  /* Accessibility */
  .layout-item:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* Print styles */
  @media print {
    .layout-toolbar,
    .component-palette,
    .property-panel {
      display: none !important;
    }

    .layout-canvas {
      background: white !important;
    }

    .layout-item {
      border-color: #ccc !important;
      box-shadow: none !important;
    }
  }
</style>
