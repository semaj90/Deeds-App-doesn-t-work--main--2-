<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  // Transform sync integration
  import {
    initializeTransformSync,
    cleanupTransformSync,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    isProcessing,
    UndoRedoManager,
    helpers as transformHelpers
  } from '$lib/stores/transform-sync';

  export let initialJson: string | null = null;
  export let caseId: string; // Prop to link canvas to a case
  export let readonly: boolean = false;
  const dispatch = createEventDispatcher();

  // Fabric.js types
  let fabric: any;
  let canvasEl: HTMLCanvasElement;
  let canvas: any; // Fabric Canvas instance
  let activeTool: string = 'select'; // 'select', 'draw', 'text'
  let selectedTool: string = 'select';
  let penSize: number = 5;
  let brushSize: number = 5;
  let penColor: string = '#000000';
  let brushColor: string = '#000000';
  let textColor: string = '#000000'; // Default for new text
  let evidenceColor: string = '#808080'; // Grey for evidence text
  let fontSize: number = 20;
  let fontFamily: string = 'Arial';
  let currentPage: number = 1;
  let totalPages: number = 1;
  let width: number = 1000;
  let height: number = 700;
  let isLoading: boolean = false;
  let showAIPanel: boolean = false;
  let aiSummary: string = '';  // Transform sync state
  let selectedObject: any = null;
  let showTransformPanel: boolean = false;
  let transformMatrix: number[][] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  let transformHistory: any[] = [];
  onMount(async () => {
    if (!browser) return;
    
    // Dynamic import of Fabric.js
    try {
      const fabricModule = await import('fabric');
      fabric = fabricModule.fabric;
    } catch (error) {
      console.error('Failed to load Fabric.js:', error);
      return;
    }

    canvas = new fabric.Canvas(canvasEl, {
      width: width,
      height: height,
      backgroundColor: '#fdfdfd',
      selection: true, // Enable object selection
    });

    // Initialize transform sync system
    initializeTransformSync(canvas);

    if (initialJson) {
      canvas.loadFromJSON(initialJson, () => {
        canvas.renderAll();
      });
    } else {
      // Add an initial textbox if no initial JSON
      addTextBox('Start typing...', false);
    }    // Event listeners for object selection to update toolbar
    canvas.on('selection:created', (e: any) => {
      updateToolbarForSelection();
      selectedObject = e.selected?.[0] || null;
      if (selectedObject) {
        showTransformPanel = true;
        updateTransformMatrix();
      }
    });
    canvas.on('selection:updated', (e: any) => {
      updateToolbarForSelection();
      selectedObject = e.selected?.[0] || null;
      if (selectedObject) {
        updateTransformMatrix();
      }
    });
    canvas.on('selection:cleared', () => {
      clearToolbarSelection();
      selectedObject = null;
      showTransformPanel = false;
    });

    // Handle object modification for saving (now handled by transform sync)
    // The transform sync module automatically handles these events
  });
  onDestroy(() => {
    cleanupTransformSync();
    if (canvas) {
      canvas.dispose(); // Clean up canvas instance
    }
  });

  // Update toolbar based on selection
  function updateToolbarForSelection() {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'textbox') {
      fontSize = activeObject.fontSize || 20;
      fontFamily = activeObject.fontFamily || 'Arial';
      textColor = activeObject.fill || '#000000';
    }
  }

  function clearToolbarSelection() {
    // Reset toolbar when nothing is selected
  }

  // Transform helpers using the sync system
  function quickTranslate(x: number, y: number) {
    if (!selectedObject || !(selectedObject as any).id) return;
    transformHelpers.translate((selectedObject as any).id, x, y);
  }

  function quickRotate(angle: number) {
    if (!selectedObject || !(selectedObject as any).id) return;
    transformHelpers.rotate((selectedObject as any).id, angle * Math.PI / 180);
  }

  function quickScale(factor: number) {
    if (!selectedObject || !(selectedObject as any).id) return;
    transformHelpers.scale((selectedObject as any).id, factor);
  }

  // Keyboard shortcuts for undo/redo
  function handleKeydown(event: KeyboardEvent) {
    if (readonly) return;
    
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'z':
          event.preventDefault();
          if (event.shiftKey) {
            UndoRedoManager.redo();
          } else {
            UndoRedoManager.undo();
          }
          break;
        case 'y':
          event.preventDefault();
          UndoRedoManager.redo();
          break;
      }
    }
  }

  // Tool selection function
  function selectTool(tool: string) {
    selectedTool = tool;
    activeTool = tool;
    
    // Update canvas mode based on tool
    if (tool === 'draw') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = brushColor;
    } else if (tool === 'text') {
      canvas.isDrawingMode = false;
    } else { // select
      canvas.isDrawingMode = false;
    }
  }

  function addTextBox(text: string, isEvidence: boolean, left: number = 100, top: number = 100) {
    const newTextBox = new fabric.Textbox(text, {
      left: left,
      top: top,
      fontSize: fontSize,
      width: 300,
      fill: isEvidence ? evidenceColor : textColor,
      editable: true,
      data: { isEvidence, caseId, uniqueId: crypto.randomUUID() } // Custom properties
    });
    canvas.add(newTextBox);
    canvas.setActiveObject(newTextBox);
    newTextBox.enterEditing(); // Automatically enter editing mode
    saveCanvasState();
  }

  function addTextbox() {
    const text = new fabric.Textbox('Click to edit...', {
      left: 100,
      top: 100 + (currentPage - 1) * 800,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      width: 300,
      editable: true
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }

  function updateTextStyle() {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'textbox') {
      activeObject.set({
        fontSize: fontSize,
        fontFamily: fontFamily,
        fill: textColor
      });
      canvas.renderAll();
    }
  }

  function updateDrawingBrush() {
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = brushColor;
    }
  }

  function addPage() {
    totalPages++;
    const newHeight = height + (totalPages - 1) * 800;
    canvas.setHeight(newHeight);
    
    // Add page separator line
    const separator = new fabric.Line([0, newHeight - 800, width, newHeight - 800], {
      stroke: '#ddd',
      strokeWidth: 2,
      selectable: false,
      evented: false
    });
    canvas.add(separator);
    
    // Add page number
    const pageNumber = new fabric.Text(`Page ${totalPages}`, {
      left: width - 100,
      top: newHeight - 780,
      fontSize: 12,
      fill: '#888',
      selectable: false,
      evented: false
    });
    canvas.add(pageNumber);
    
    canvas.renderAll();
    currentPage = totalPages;
  }

  function addInitialPage() {
    const pageNumber = new fabric.Text('Page 1', {
      left: width - 100,
      top: 20,
      fontSize: 12,
      fill: '#888',
      selectable: false,
      evented: false
    });
    canvas.add(pageNumber);
    canvas.renderAll();
  }
  function deleteSelected() {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach((obj: any) => canvas.remove(obj));
      canvas.renderAll();
    }
  }

  function groupSelected() {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 1) {
      const group = new fabric.Group(activeObjects, {
        originX: 'center',
        originY: 'center'
      });
      canvas.discardActiveObject();
      activeObjects.forEach((obj: any) => canvas.remove(obj));
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
    }
  }

  function ungroupSelected() {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'group') {
      const items = activeObject.getObjects();
      canvas.discardActiveObject();
      canvas.remove(activeObject);
      
      items.forEach((item: any) => {
        const newItem = fabric.util.object.clone(item);
        canvas.add(newItem);
      });
      canvas.renderAll();
    }
  }

  // File upload handlers
  async function handleEvidenceUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files?.length) return;

    const file = target.files[0];
    isLoading = true;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseId);

      const response = await fetch('/api/evidence/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      
      // Add uploaded evidence to canvas
      if (file.type.startsWith('image/')) {
        await addImageToCanvas(result.url, result.metadata);
      } else if (file.type === 'application/pdf') {
        await addPdfToCanvas(result.pages, result.metadata);
      } else if (file.type === 'text/plain') {
        await addTextToCanvas(result.content, result.metadata);
      }

      dispatch('evidenceUploaded', result);
    } catch (error) {
      console.error('Upload error:', error);
      dispatch('error', { message: 'Failed to upload evidence' });
    } finally {
      isLoading = false;
    }
  }
  async function addImageToCanvas(imageUrl: string, metadata: any) {
    fabric.Image.fromURL(imageUrl, (img: any) => {
      img.set({
        left: 50,
        top: 50 + (currentPage - 1) * 800,
        scaleX: 0.5,
        scaleY: 0.5,
        metadata: metadata,
        objectType: 'evidence'
      });
      canvas.add(img);
      canvas.renderAll();
    });
  }

  async function addPdfToCanvas(pages: string[], metadata: any) {
    for (let i = 0; i < pages.length; i++) {
      fabric.Image.fromURL(pages[i], (img: any) => {
        img.set({
          left: 50,
          top: 50 + i * 400,
          scaleX: 0.3,
          scaleY: 0.3,
          metadata: { ...metadata, pageNumber: i + 1 },
          objectType: 'evidence'
        });
        canvas.add(img);
        canvas.renderAll();
      });
    }
  }

  async function addTextToCanvas(content: string, metadata: any) {
    const text = new fabric.Textbox(content, {
      left: 100,
      top: 100 + (currentPage - 1) * 800,
      fontSize: 14,
      width: 400,
      backgroundColor: '#f9f9f9',
      metadata: metadata,
      objectType: 'evidence'
    });
    canvas.add(text);
    canvas.renderAll();
  }

  // AI Integration
  async function requestAISummary() {
    const selectedObjects = canvas.getActiveObjects();
    let content = '';    if (selectedObjects.length) {
      content = selectedObjects
        .filter((obj: any) => obj.type === 'textbox')
        .map((obj: any) => obj.text)
        .join('\n');
    } else {
      // Summarize entire canvas
      content = canvas.getObjects()
        .filter((obj: any) => obj.type === 'textbox')
        .map((obj: any) => obj.text)
        .join('\n');
    }

    if (!content.trim()) {
      dispatch('error', { message: 'No text content to summarize' });
      return;
    }

    isLoading = true;
    showAIPanel = true;

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, caseId })
      });

      if (!response.ok) throw new Error('Summarization failed');

      const result = await response.json();
      aiSummary = result.summary;
    } catch (error) {
      console.error('AI Summary error:', error);
      dispatch('error', { message: 'Failed to generate AI summary' });
    } finally {
      isLoading = false;
    }
  }
  async function autoTag() {
    const textObjects = canvas.getObjects().filter((obj: any) => obj.type === 'textbox');
    if (!textObjects.length) return;

    try {
      const content = textObjects.map((obj: any) => obj.text).join('\n');
      const response = await fetch('/api/ai/autotag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, caseId })
      });

      if (!response.ok) throw new Error('Auto-tagging failed');

      const result = await response.json();
      
      // Apply tags to objects
      textObjects.forEach((obj: any, index: number) => {
        if (result.tags[index]) {
          obj.set('tags', result.tags[index]);
        }
      });

      canvas.renderAll();
      dispatch('autoTagged', result.tags);
    } catch (error) {
      console.error('Auto-tag error:', error);
    }
  }

  // Save/Load functionality
  async function saveCanvasState() {
    if (!caseId) {
      dispatch('error', { message: 'No case ID provided for saving' });
      return;
    }

    isLoading = true;

    try {
      const canvasJson = canvas.toJSON(['metadata', 'objectType', 'tags']);
      const imagePreview = canvas.toDataURL({ format: 'png', quality: 0.8 });

      const response = await fetch('/api/canvas/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          canvasData: canvasJson,
          imagePreview,
          metadata: {
            totalPages,
            currentPage,
            lastModified: new Date().toISOString()
          }
        })
      });

      if (!response.ok) throw new Error('Save failed');

      dispatch('canvasSaved');
    } catch (error) {
      console.error('Save error:', error);
      dispatch('error', { message: 'Failed to save canvas' });
    } finally {
      isLoading = false;
    }
  }

  async function loadCanvasState() {
    if (!caseId) return;

    isLoading = true;

    try {
      const response = await fetch(`/api/canvas/load?caseId=${caseId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No saved state, start fresh
          addInitialPage();
          return;
        }
        throw new Error('Load failed');
      }

      const result = await response.json();
      
      canvas.loadFromJSON(result.canvasData, () => {
        canvas.renderAll();
        totalPages = result.metadata?.totalPages || 1;
        currentPage = result.metadata?.currentPage || 1;
        dispatch('canvasLoaded', result);
      });
    } catch (error) {
      console.error('Load error:', error);
      dispatch('error', { message: 'Failed to load canvas' });
      addInitialPage();
    } finally {
      isLoading = false;
    }
  }

  // Debounced functions
  let autoSaveTimeout: NodeJS.Timeout;
  let autoTagTimeout: NodeJS.Timeout;

  function debounceAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(saveCanvasState, 2000);
  }

  function debounceAutoTag() {
    clearTimeout(autoTagTimeout);
    autoTagTimeout = setTimeout(autoTag, 1000);
  }

  // Update transform matrix from selected object
  function updateTransformMatrix() {
    if (!selectedObject) return;
    
    // Get the current transform matrix from the object
    const matrix = (selectedObject as any).calcTransformMatrix();
    transformMatrix = [
      [matrix[0], matrix[1], matrix[4]],
      [matrix[2], matrix[3], matrix[5]],
      [0, 0, 1]
    ];
  }

  // Apply transform using transform sync system
  function applyMatrixTransform() {
    if (!selectedObject || !(selectedObject as any).id) return;
    
    // Ensure object has an ID for tracking
    if (!(selectedObject as any).id) {
      (selectedObject as any).id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    transformHelpers.transform((selectedObject as any).id, transformMatrix);
    
    // Add to history
    transformHistory = [...transformHistory, {
      timestamp: Date.now(),
      objectId: (selectedObject as any).id,
      matrix: [...transformMatrix.map(row => [...row])], // Deep copy
      type: 'matrix'
    }].slice(-20); // Keep last 20 transforms
  }

  // Reset transform matrix to identity
  function resetTransform() {
    transformMatrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  }

  // Create specific transform matrices
  function createTranslateMatrix(x: number, y: number) {
    transformMatrix = [
      [1, 0, x],
      [0, 1, y],
      [0, 0, 1]
    ];
  }

  function createRotateMatrix(angle: number) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    transformMatrix = [
      [cos, -sin, 0],
      [sin, cos, 0],
      [0, 0, 1]
    ];
  }

  function createScaleMatrix(sx: number, sy: number) {
    transformMatrix = [
      [sx, 0, 0],
      [0, sy, 0],
      [0, 0, 1]
    ];
  }

  // Export functions for parent component
  export function save() {
    return saveCanvasState();
  }

  export function getCanvasData() {
    return canvas.toJSON(['metadata', 'objectType', 'tags']);
  }
  export function getCanvasImage() {
    return canvas.toDataURL({ format: 'png', quality: 0.8 });
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="canvas-editor">
  <!-- Toolbar -->
  <div class="toolbar bg-gray-100 p-4 border-b flex flex-wrap gap-4 items-center">
    <!-- Tool Selection -->
    <div class="tool-group flex gap-2">
      <button 
        class="tool-btn {selectedTool === 'select' ? 'active' : ''}"
        on:click={() => selectTool('select')}
        title="Select Tool"
      >
        📍
      </button>
      <button 
        class="tool-btn {selectedTool === 'draw' ? 'active' : ''}"
        on:click={() => selectTool('draw')}
        title="Draw Tool"
      >
        ✏️
      </button>
      <button 
        class="tool-btn {selectedTool === 'text' ? 'active' : ''}"
        on:click={addTextbox}
        title="Add Text"
      >
        📝
      </button>
    </div>

    <!-- Text Controls -->
    <div class="text-controls flex gap-2 items-center">
      <select bind:value={fontFamily} on:change={updateTextStyle} class="px-2 py-1 border rounded">
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Georgia">Georgia</option>
      </select>
      
      <input 
        type="number" 
        bind:value={fontSize} 
        on:input={updateTextStyle}
        min="8" 
        max="72" 
        class="w-16 px-2 py-1 border rounded"
      />
      
      <input 
        type="color" 
        bind:value={textColor} 
        on:input={updateTextStyle}
        class="w-8 h-8 border rounded"
      />
    </div>

    <!-- Drawing Controls -->
    <div class="drawing-controls flex gap-2 items-center">
      <input 
        type="range" 
        bind:value={brushSize} 
        on:input={updateDrawingBrush}
        min="1" 
        max="20" 
        class="w-20"
      />
      <span class="text-sm">{brushSize}px</span>
      
      <input 
        type="color" 
        bind:value={brushColor} 
        on:input={updateDrawingBrush}
        class="w-8 h-8 border rounded"
      />
    </div>

    <!-- Object Controls -->
    <div class="object-controls flex gap-2">
      <button on:click={groupSelected} class="action-btn" title="Group Selected">
        📦
      </button>
      <button on:click={ungroupSelected} class="action-btn" title="Ungroup">
        📤
      </button>
      <button on:click={deleteSelected} class="action-btn text-red-600" title="Delete Selected">
        🗑️
      </button>
    </div>

    <!-- File Upload -->
    <div class="file-controls">
      <label class="action-btn cursor-pointer">
        📎 Upload Evidence
        <input 
          type="file" 
          accept="image/*,application/pdf,.txt" 
          on:change={handleEvidenceUpload}
          class="hidden"
          disabled={readonly}
        />
      </label>
    </div>

    <!-- Page Controls -->
    <div class="page-controls flex gap-2 items-center">
      <button on:click={addPage} class="action-btn">
        ➕ New Page
      </button>
      <span class="text-sm">Page {currentPage} of {totalPages}</span>
    </div>    <!-- Undo/Redo Controls -->
    <div class="undo-redo-controls flex gap-2">
      <button 
        on:click={() => UndoRedoManager.undo()} 
        class="action-btn"
        disabled={!$canUndo || $isProcessing}
        title="Undo (Ctrl+Z)"
      >
        ↶ Undo
      </button>
      <button 
        on:click={() => UndoRedoManager.redo()} 
        class="action-btn"
        disabled={!$canRedo || $isProcessing}
        title="Redo (Ctrl+Y)"
      >
        ↷ Redo
      </button>
    </div>

    <!-- Transform Controls -->
    <div class="transform-controls flex gap-2">
      <button 
        on:click={() => showTransformPanel = !showTransformPanel}
        class="action-btn {showTransformPanel ? 'active' : ''}"
        disabled={!selectedObject}
        title="Transform Panel"
      >
        🔄 Transform
      </button>
    </div>    <!-- AI Controls -->
    <div class="ai-controls flex gap-2">
      <button 
        on:click={requestAISummary} 
        class="action-btn bg-blue-500 text-white hover:bg-blue-600"
        disabled={isLoading}
      >
        🤖 AI Summary
      </button>
    </div>

    <!-- Save Control -->
    <div class="save-controls flex gap-2 items-center">
      {#if $hasUnsavedChanges}
        <span class="text-sm text-warning">●</span>
      {/if}
      <button 
        on:click={saveCanvasState} 
        class="action-btn bg-green-500 text-white hover:bg-green-600"
        disabled={isLoading || !caseId}
      >
        💾 Save
      </button>
    </div>
  </div>

  <!-- Canvas Container -->
  <div class="canvas-container relative overflow-auto border">
    <canvas bind:this={canvasEl} class="border-0"></canvas>
    
    <!-- Loading Overlay -->
    {#if isLoading}
      <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-4 rounded shadow">
          <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Processing...</p>
        </div>
      </div>
    {/if}
  </div>
  <!-- AI Panel -->
  {#if showAIPanel}
    <div class="ai-panel fixed bottom-4 right-4 w-80 bg-white border rounded-lg shadow-lg p-4">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-semibold">AI Summary</h3>
        <button on:click={() => showAIPanel = false} class="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      <div class="ai-content max-h-60 overflow-y-auto">
        {#if aiSummary}
          <p class="text-sm">{aiSummary}</p>
        {:else}
          <p class="text-sm text-gray-500">Generating summary...</p>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Transform Panel -->
  {#if showTransformPanel && selectedObject}
    <div class="transform-panel fixed top-20 right-4 w-96 bg-white border rounded-lg shadow-lg p-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-semibold">Transform Sync Panel</h3>
        <button on:click={() => showTransformPanel = false} class="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <!-- Transform Controls -->
      <div class="transform-controls-panel space-y-4">
        <!-- Quick Transform Buttons -->
        <div class="quick-transforms">
          <h4 class="text-sm font-medium mb-2">Quick Transforms</h4>
          <div class="grid grid-cols-3 gap-2">
            <button 
              class="action-btn text-xs p-2"
              on:click={() => quickTranslate(10, 0)}
              title="Move Right"
            >
              →
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => quickTranslate(0, -10)}
              title="Move Up"
            >
              ↑
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => quickTranslate(-10, 0)}
              title="Move Left"
            >
              ←
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => quickRotate(-15)}
              title="Rotate Left"
            >
              ↺
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => quickTranslate(0, 10)}
              title="Move Down"
            >
              ↓
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => quickRotate(15)}
              title="Rotate Right"
            >
              ↻
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => quickScale(0.9)}
              title="Scale Down"
            >
              ⊖
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => resetTransform()}
              title="Reset"
            >
              ⊙
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => quickScale(1.1)}
              title="Scale Up"
            >
              ⊕
            </button>
          </div>
        </div>

        <!-- Transform Matrix Editor -->
        <div class="matrix-editor">
          <h4 class="text-sm font-medium mb-2">Transform Matrix</h4>
          <div class="matrix-grid grid grid-cols-3 gap-1 mb-2">
            {#each transformMatrix as row, i}
              {#each row as cell, j}
                <input 
                  type="number" 
                  step="0.1"
                  class="matrix-cell text-xs p-1 border rounded"
                  bind:value={transformMatrix[i][j]}
                  on:input={updateTransformMatrix}
                />
              {/each}
            {/each}
          </div>
          <div class="flex gap-2">
            <button 
              class="action-btn bg-blue-500 text-white flex-1 text-xs"
              on:click={applyMatrixTransform}
              disabled={$isProcessing}
            >
              Apply Matrix
            </button>
            <button 
              class="action-btn bg-gray-500 text-white flex-1 text-xs"
              on:click={resetTransform}
            >
              Reset
            </button>
          </div>
        </div>

        <!-- Preset Transforms -->
        <div class="preset-transforms">
          <h4 class="text-sm font-medium mb-2">Preset Transforms</h4>
          <div class="grid grid-cols-2 gap-2">
            <button 
              class="action-btn text-xs p-2"
              on:click={() => createTranslateMatrix(50, 0)}
            >
              Translate +50,0
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => createRotateMatrix(Math.PI / 4)}
            >
              Rotate 45°
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => createScaleMatrix(2, 2)}
            >
              Scale 2x
            </button>
            <button 
              class="action-btn text-xs p-2"
              on:click={() => createScaleMatrix(0.5, 0.5)}
            >
              Scale 0.5x
            </button>
          </div>
        </div>

        <!-- Transform History -->
        <div class="transform-history">
          <h4 class="text-sm font-medium mb-2">Recent Transforms</h4>
          <div class="history-list max-h-32 overflow-y-auto">
            {#each transformHistory.slice(-5) as transform}
              <div class="history-item text-xs p-2 border rounded mb-1 bg-gray-50">
                <div class="flex justify-between">
                  <span>{transform.type}</span>
                  <span class="text-gray-500">
                    {new Date(transform.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div class="matrix-preview text-gray-600">
                  [{transform.matrix[0][0].toFixed(2)}, {transform.matrix[0][1].toFixed(2)}, {transform.matrix[0][2].toFixed(2)}]
                </div>
              </div>
            {/each}
            {#if transformHistory.length === 0}
              <p class="text-xs text-gray-500">No transforms yet</p>
            {/if}
          </div>
        </div>

        <!-- Transform Stats -->
        <div class="transform-stats">
          <h4 class="text-sm font-medium mb-2">Sync Status</h4>
          <div class="stats-grid text-xs space-y-1">
            <div class="flex justify-between">
              <span>Processing:</span>
              <span class="{$isProcessing ? 'text-red-500' : 'text-green-500'}">
                {$isProcessing ? 'Yes' : 'No'}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Can Undo:</span>
              <span class="{$canUndo ? 'text-green-500' : 'text-gray-500'}">
                {$canUndo ? 'Yes' : 'No'}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Can Redo:</span>
              <span class="{$canRedo ? 'text-green-500' : 'text-gray-500'}">
                {$canRedo ? 'Yes' : 'No'}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Unsaved Changes:</span>
              <span class="{$hasUnsavedChanges ? 'text-warning' : 'text-green-500'}">
                {$hasUnsavedChanges ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .canvas-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .toolbar {
    flex-shrink: 0;
  }

  .canvas-container {
    flex: 1;
    min-height: 400px;
  }
  .tool-btn, .action-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    transition: background-color 0.15s ease;
  }

  .tool-btn:hover, .action-btn:hover {
    background-color: #f3f4f6;
  }

  .tool-btn.active {
    background-color: #3b82f6;
    color: white;
  }
  .tool-group {
    border-right: 1px solid #ddd;
    padding-right: 1rem;
    margin-right: 1rem;
  }

  .text-controls, .drawing-controls, .object-controls, .file-controls, .page-controls, 
  .undo-redo-controls, .transform-controls, .ai-controls, .save-controls {
    border-right: 1px solid #ddd;
    padding-right: 1rem;
    margin-right: 1rem;
  }

  .text-controls:last-child, .drawing-controls:last-child, .object-controls:last-child, 
  .file-controls:last-child, .page-controls:last-child, .undo-redo-controls:last-child,
  .transform-controls:last-child, .ai-controls:last-child, .save-controls:last-child {
    border-right: none;
    margin-right: 0;
  }

  .ai-panel, .transform-panel {
    z-index: 1000;
  }

  /* Transform Panel Specific Styles */
  .transform-panel {
    max-height: 80vh;
    overflow-y: auto;
  }

  .matrix-cell {
    width: 60px;
    text-align: center;
  }

  .matrix-grid {
    background-color: #f8f9fa;
    padding: 0.5rem;
    border-radius: 0.375rem;
  }

  .history-item {
    transition: background-color 0.15s ease;
  }

  .history-item:hover {
    background-color: #e9ecef;
  }

  .stats-grid {
    background-color: #f8f9fa;
    padding: 0.5rem;
    border-radius: 0.375rem;
  }

  /* Active state for transform button */
  .action-btn.active {
    background-color: #3b82f6;
    color: white;
  }

  /* Warning color for unsaved changes indicator */
  .text-warning {
    color: #f59e0b;
  }

  /* Grid utility classes */
  .grid {
    display: grid;
  }

  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .gap-1 {
    gap: 0.25rem;
  }

  .gap-2 {
    gap: 0.5rem;
  }

  .space-y-1 > * + * {
    margin-top: 0.25rem;
  }

  .space-y-4 > * + * {
    margin-top: 1rem;
  }

  .flex-1 {
    flex: 1;
  }
</style>
