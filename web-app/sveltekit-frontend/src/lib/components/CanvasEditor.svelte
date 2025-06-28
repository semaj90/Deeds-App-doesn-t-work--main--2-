<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { CanvasState, CanvasStateData, Evidence, CitationPoint } from '$lib/data/types';
	
	// Note: Fabric.js needs to be imported dynamically in browser
	let fabric: any;
	
	export let canvasState: CanvasState | null = null;
	export let reportId: string;
	export let evidence: Evidence[] = [];
	export let citationPoints: CitationPoint[] = [];
	export let onSave: (canvasState: CanvasState) => Promise<void> = async () => {};
	export let readOnly = false;
	export let width = 800;
	export let height = 600;

	let canvasElement: HTMLCanvasElement;
	let fabricCanvas: any;
	let isLoading = false;
	let isDirty = false;
	let selectedTool = 'select';
	let selectedObject: any = null;
	let clipboardData: any = null;
	let autoSaveTimer: NodeJS.Timeout | null = null;

	// Drawing state
	let isDrawing = false;
	let drawingPath: any = null;
	let currentColor = '#000000';
	let currentStrokeWidth = 2;
	let currentFontSize = 16;

	// Zoom and pan state
	let zoomLevel = 1;
	let panX = 0;
	let panY = 0;

	// Tool options
	const tools = [
		{ id: 'select', name: 'Select', icon: '🔍' },
		{ id: 'text', name: 'Text', icon: 'T' },
		{ id: 'rectangle', name: 'Rectangle', icon: '⬜' },
		{ id: 'circle', name: 'Circle', icon: '⭕' },
		{ id: 'arrow', name: 'Arrow', icon: '➡️' },
		{ id: 'pen', name: 'Pen', icon: '✏️' },
		{ id: 'highlight', name: 'Highlight', icon: '🖍️' },
		{ id: 'evidence', name: 'Evidence', icon: '📋' },
		{ id: 'citation', name: 'Citation', icon: '📎' }
	];

	onMount(async () => {
		if (browser) {
			await loadFabricJs();
			initializeCanvas();
			loadCanvasState();
		}
	});

	onDestroy(() => {
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
		}
		if (fabricCanvas) {
			fabricCanvas.dispose();
		}
	});

	async function loadFabricJs() {
		try {
			// Import Fabric.js dynamically
			const fabricModule = await import('fabric');
			fabric = fabricModule.default || fabricModule;
		} catch (error) {
			console.error('Failed to load Fabric.js:', error);
			// Fallback: load from CDN
			await loadFabricFromCDN();
		}
	}

	function loadFabricFromCDN(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (typeof window !== 'undefined' && (window as any).fabric) {
				fabric = (window as any).fabric;
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';
			script.onload = () => {
				fabric = (window as any).fabric;
				resolve();
			};
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}

	function initializeCanvas() {
		if (!fabric || !canvasElement) return;

		fabricCanvas = new fabric.Canvas(canvasElement, {
			width,
			height,
			backgroundColor: '#ffffff',
			selection: !readOnly,
			interactive: !readOnly
		});

		// Set up event listeners
		fabricCanvas.on('object:added', handleObjectAdded);
		fabricCanvas.on('object:modified', handleObjectModified);
		fabricCanvas.on('object:removed', handleObjectRemoved);
		fabricCanvas.on('selection:created', handleSelectionCreated);
		fabricCanvas.on('selection:cleared', handleSelectionCleared);
		fabricCanvas.on('mouse:down', handleMouseDown);
		fabricCanvas.on('mouse:move', handleMouseMove);
		fabricCanvas.on('mouse:up', handleMouseUp);
		fabricCanvas.on('path:created', handlePathCreated);

		// Set up keyboard shortcuts
		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);

		// Enable high DPI support
		const ratio = window.devicePixelRatio || 1;
		const canvas = fabricCanvas.getElement();
		canvas.width = width * ratio;
		canvas.height = height * ratio;
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		fabricCanvas.setDimensions({ width: width * ratio, height: height * ratio }, { cssOnly: false });
		fabricCanvas.setZoom(fabricCanvas.getZoom() * ratio);
	}

	function loadCanvasState() {
		if (!fabricCanvas || !canvasState) return;

		try {
			const canvasData = canvasState.canvasData as CanvasStateData;
			
			if (canvasData.objects && canvasData.objects.length > 0) {
				// Load objects from saved state
				fabricCanvas.loadFromJSON(canvasData, () => {
					fabricCanvas.renderAll();
					
					// Restore viewport
					if (canvasData.viewport) {
						zoomLevel = canvasData.viewport.zoom;
						panX = canvasData.viewport.panX;
						panY = canvasData.viewport.panY;
						fabricCanvas.setZoom(zoomLevel);
						fabricCanvas.relativePan(new fabric.Point(panX, panY));
					}
				});
			}

			// Set background if specified
			if (canvasData.background) {
				fabricCanvas.setBackgroundColor(canvasData.background, fabricCanvas.renderAll.bind(fabricCanvas));
			}
		} catch (error) {
			console.error('Failed to load canvas state:', error);
		}
	}

	function handleObjectAdded(event: any) {
		if (readOnly) return;
		markDirty();
	}

	function handleObjectModified(event: any) {
		if (readOnly) return;
		markDirty();
	}

	function handleObjectRemoved(event: any) {
		if (readOnly) return;
		markDirty();
	}

	function handleSelectionCreated(event: any) {
		selectedObject = event.selected[0];
	}

	function handleSelectionCleared(event: any) {
		selectedObject = null;
	}

	function handleMouseDown(event: any) {
		if (readOnly) return;

		const pointer = fabricCanvas.getPointer(event.e);
		
		switch (selectedTool) {
			case 'text':
				addText(pointer);
				break;
			case 'rectangle':
				startDrawingRectangle(pointer);
				break;
			case 'circle':
				startDrawingCircle(pointer);
				break;
			case 'arrow':
				startDrawingArrow(pointer);
				break;
			case 'pen':
				startDrawingPath(pointer);
				break;
			case 'highlight':
				startHighlighting(pointer);
				break;
		}
	}

	function handleMouseMove(event: any) {
		if (!isDrawing || readOnly) return;

		const pointer = fabricCanvas.getPointer(event.e);
		
		// Update drawing object based on current tool
		// Implementation depends on the specific drawing logic
	}

	function handleMouseUp(event: any) {
		if (readOnly) return;
		
		isDrawing = false;
		drawingPath = null;
		markDirty();
	}

	function handlePathCreated(event: any) {
		if (readOnly) return;
		
		const path = event.path;
		path.set({
			stroke: currentColor,
			strokeWidth: currentStrokeWidth,
			fill: selectedTool === 'highlight' ? currentColor + '40' : 'transparent'
		});
		
		markDirty();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (readOnly) return;

		if (event.ctrlKey || event.metaKey) {
			switch (event.key) {
				case 'c':
					event.preventDefault();
					copySelected();
					break;
				case 'v':
					event.preventDefault();
					paste();
					break;
				case 'z':
					event.preventDefault();
					if (event.shiftKey) {
						redo();
					} else {
						undo();
					}
					break;
				case 's':
					event.preventDefault();
					saveCanvas();
					break;
			}
		} else {
			switch (event.key) {
				case 'Delete':
				case 'Backspace':
					deleteSelected();
					break;
				case 'Escape':
					fabricCanvas.discardActiveObject();
					fabricCanvas.renderAll();
					break;
			}
		}
	}

	function handleKeyUp(event: KeyboardEvent) {
		// Handle key up events if needed
	}

	function selectTool(toolId: string) {
		selectedTool = toolId;
		
		// Configure canvas based on selected tool
		switch (toolId) {
			case 'select':
				fabricCanvas.isDrawingMode = false;
				fabricCanvas.selection = true;
				break;
			case 'pen':
				fabricCanvas.isDrawingMode = true;
				fabricCanvas.freeDrawingBrush.width = currentStrokeWidth;
				fabricCanvas.freeDrawingBrush.color = currentColor;
				break;
			case 'highlight':
				fabricCanvas.isDrawingMode = true;
				fabricCanvas.freeDrawingBrush.width = currentStrokeWidth * 3;
				fabricCanvas.freeDrawingBrush.color = currentColor + '40';
				break;
			default:
				fabricCanvas.isDrawingMode = false;
				fabricCanvas.selection = false;
				break;
		}
	}

	function addText(pointer: any) {
		const text = new fabric.IText('Click to edit', {
			left: pointer.x,
			top: pointer.y,
			fontSize: currentFontSize,
			fill: currentColor,
			fontFamily: 'Arial'
		});
		
		fabricCanvas.add(text);
		fabricCanvas.setActiveObject(text);
		text.enterEditing();
		markDirty();
	}

	function startDrawingRectangle(pointer: any) {
		isDrawing = true;
		const rect = new fabric.Rect({
			left: pointer.x,
			top: pointer.y,
			width: 0,
			height: 0,
			fill: 'transparent',
			stroke: currentColor,
			strokeWidth: currentStrokeWidth
		});
		
		fabricCanvas.add(rect);
		drawingPath = rect;
	}

	function startDrawingCircle(pointer: any) {
		isDrawing = true;
		const circle = new fabric.Circle({
			left: pointer.x,
			top: pointer.y,
			radius: 0,
			fill: 'transparent',
			stroke: currentColor,
			strokeWidth: currentStrokeWidth
		});
		
		fabricCanvas.add(circle);
		drawingPath = circle;
	}

	function startDrawingArrow(pointer: any) {
		isDrawing = true;
		const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
			stroke: currentColor,
			strokeWidth: currentStrokeWidth,
			originX: 'center',
			originY: 'center'
		});
		
		fabricCanvas.add(line);
		drawingPath = line;
	}

	function startDrawingPath(pointer: any) {
		isDrawing = true;
		// Free drawing is handled by Fabric.js automatically
	}

	function startHighlighting(pointer: any) {
		isDrawing = true;
		// Highlighting uses free drawing with transparent color
	}

	function addEvidenceMarker(evidence: Evidence) {
		if (readOnly) return;

		const marker = new fabric.Group([
			new fabric.Circle({
				radius: 20,
				fill: '#ef4444',
				stroke: '#dc2626',
				strokeWidth: 2
			}),
			new fabric.Text('E', {
				fontSize: 16,
				fill: 'white',
				fontWeight: 'bold',
				originX: 'center',
				originY: 'center'
			})
		], {
			left: 100,
			top: 100,
			selectable: true
		});

		// Add evidence metadata
		marker.set({
			evidenceId: evidence.id,
			evidenceTitle: evidence.title,
			type: 'evidence-marker'
		});

		fabricCanvas.add(marker);
		markDirty();
	}

	function addCitationMarker(citation: CitationPoint) {
		if (readOnly) return;

		const marker = new fabric.Group([
			new fabric.Rect({
				width: 60,
				height: 30,
				fill: '#3b82f6',
				stroke: '#2563eb',
				strokeWidth: 2,
				rx: 4,
				ry: 4
			}),
			new fabric.Text('Cite', {
				fontSize: 12,
				fill: 'white',
				fontWeight: 'bold',
				originX: 'center',
				originY: 'center'
			})
		], {
			left: 100,
			top: 100,
			selectable: true
		});

		// Add citation metadata
		marker.set({
			citationId: citation.id,
			citationSource: citation.source,
			type: 'citation-marker'
		});

		fabricCanvas.add(marker);
		markDirty();
	}

	function deleteSelected() {
		if (readOnly) return;
		
		const activeObjects = fabricCanvas.getActiveObjects();
		if (activeObjects.length > 0) {
			fabricCanvas.remove(...activeObjects);
			fabricCanvas.discardActiveObject();
			markDirty();
		}
	}

	function copySelected() {
		const activeObject = fabricCanvas.getActiveObject();
		if (activeObject) {
			activeObject.clone((cloned: any) => {
				clipboardData = cloned;
			});
		}
	}

	function paste() {
		if (clipboardData) {
			clipboardData.clone((clonedObj: any) => {
				fabricCanvas.discardActiveObject();
				clonedObj.set({
					left: clonedObj.left + 10,
					top: clonedObj.top + 10,
					evented: true,
				});
				
				if (clonedObj.type === 'activeSelection') {
					clonedObj.canvas = fabricCanvas;
					clonedObj.forEachObject((obj: any) => {
						fabricCanvas.add(obj);
					});
					clonedObj.setCoords();
				} else {
					fabricCanvas.add(clonedObj);
				}
				
				fabricCanvas.setActiveObject(clonedObj);
				fabricCanvas.requestRenderAll();
				markDirty();
			});
		}
	}

	function undo() {
		// Implement undo functionality
		// This would require maintaining a history stack
	}

	function redo() {
		// Implement redo functionality
		// This would require maintaining a history stack
	}

	function zoomIn() {
		zoomLevel = Math.min(zoomLevel * 1.2, 5);
		fabricCanvas.setZoom(zoomLevel);
	}

	function zoomOut() {
		zoomLevel = Math.max(zoomLevel / 1.2, 0.1);
		fabricCanvas.setZoom(zoomLevel);
	}

	function resetZoom() {
		zoomLevel = 1;
		panX = 0;
		panY = 0;
		fabricCanvas.setZoom(1);
		fabricCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];
		fabricCanvas.requestRenderAll();
	}

	function markDirty() {
		isDirty = true;
		scheduleAutoSave();
	}

	function scheduleAutoSave() {
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
		}
		
		autoSaveTimer = setTimeout(() => {
			saveCanvas();
		}, 2000);
	}

	async function saveCanvas() {
		if (!isDirty || isLoading || readOnly) return;
		
		isLoading = true;
		
		try {
			// Get canvas data
			const canvasData: CanvasStateData = {
				objects: fabricCanvas.toObject().objects,
				background: fabricCanvas.backgroundColor,
				dimensions: { width, height },
				viewport: {
					zoom: zoomLevel,
					panX,
					panY
				},
				metadata: {
					title: canvasState?.title || 'Untitled Canvas',
					description: '',
					tags: [],
					evidenceIds: getEvidenceIds(),
					citationIds: getCitationIds()
				}
			};

			// Generate thumbnail
			const thumbnailUrl = generateThumbnail();

			const canvasStateData: Partial<CanvasState> = {
				...canvasState,
				reportId,
				canvasData,
				thumbnailUrl,
				updatedAt: new Date().toISOString()
			};

			const response = await fetch('/api/canvas-states', {
				method: canvasState ? 'PUT' : 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(canvasStateData)
			});

			if (response.ok) {
				const savedCanvasState = await response.json();
				canvasState = savedCanvasState;
				isDirty = false;
				await onSave(savedCanvasState);
			} else {
				throw new Error('Failed to save canvas state');
			}
		} catch (error) {
			console.error('Canvas save failed:', error);
		} finally {
			isLoading = false;
		}
	}

	function getEvidenceIds(): string[] {
		const evidenceIds: string[] = [];
		fabricCanvas.getObjects().forEach((obj: any) => {
			if (obj.evidenceId) {
				evidenceIds.push(obj.evidenceId);
			}
		});
		return evidenceIds;
	}

	function getCitationIds(): string[] {
		const citationIds: string[] = [];
		fabricCanvas.getObjects().forEach((obj: any) => {
			if (obj.citationId) {
				citationIds.push(obj.citationId);
			}
		});
		return citationIds;
	}

	function generateThumbnail(): string {
		// Generate a thumbnail of the canvas
		const scale = Math.min(200 / width, 150 / height);
		return fabricCanvas.toDataURL({
			format: 'png',
			quality: 0.8,
			multiplier: scale
		});
	}

	function exportCanvas(format: 'png' | 'svg' | 'pdf' = 'png') {
		let dataUrl: string;
		
		switch (format) {
			case 'svg':
				dataUrl = 'data:image/svg+xml;base64,' + btoa(fabricCanvas.toSVG());
				break;
			case 'png':
			default:
				dataUrl = fabricCanvas.toDataURL({
					format: 'png',
					quality: 1.0
				});
				break;
		}

		// Download the file
		const link = document.createElement('a');
		link.download = `canvas-${Date.now()}.${format}`;
		link.href = dataUrl;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function clearCanvas() {
		if (readOnly) return;
		
		if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
			fabricCanvas.clear();
			fabricCanvas.setBackgroundColor('#ffffff', fabricCanvas.renderAll.bind(fabricCanvas));
			markDirty();
		}
	}
</script>

<div class="canvas-editor-container">
	<!-- Toolbar -->
	<div class="canvas-toolbar">
		<div class="tool-group">
			{#each tools as tool}
				<button
					class="tool-btn"
					class:active={selectedTool === tool.id}
					on:click={() => selectTool(tool.id)}
					title={tool.name}
					disabled={readOnly}
				>
					<span class="tool-icon">{tool.icon}</span>
					<span class="tool-name">{tool.name}</span>
				</button>
			{/each}
		</div>

		<div class="tool-options">
			<div class="color-picker">
				<label for="color">Color:</label>
				<input
					id="color"
					type="color"
					bind:value={currentColor}
					disabled={readOnly}
				/>
			</div>

			<div class="stroke-width">
				<label for="stroke">Stroke:</label>
				<input
					id="stroke"
					type="range"
					min="1"
					max="20"
					bind:value={currentStrokeWidth}
					disabled={readOnly}
				/>
				<span>{currentStrokeWidth}px</span>
			</div>

			<div class="font-size">
				<label for="font-size">Font:</label>
				<input
					id="font-size"
					type="range"
					min="8"
					max="48"
					bind:value={currentFontSize}
					disabled={readOnly}
				/>
				<span>{currentFontSize}px</span>
			</div>
		</div>

		<div class="canvas-controls">
			<div class="zoom-controls">
				<button on:click={zoomOut} disabled={readOnly} title="Zoom Out">-</button>
				<span class="zoom-level">{(zoomLevel * 100).toFixed(0)}%</span>
				<button on:click={zoomIn} disabled={readOnly} title="Zoom In">+</button>
				<button on:click={resetZoom} disabled={readOnly} title="Reset Zoom">⌂</button>
			</div>

			<div class="action-buttons">
				<button on:click={() => exportCanvas('png')} title="Export as PNG">
					📤 PNG
				</button>
				<button on:click={() => exportCanvas('svg')} title="Export as SVG">
					📤 SVG
				</button>
				<button on:click={clearCanvas} disabled={readOnly} title="Clear Canvas">
					🗑️ Clear
				</button>
			</div>

			<div class="save-status">
				{#if isLoading}
					<span class="saving">Saving...</span>
				{:else if isDirty}
					<span class="unsaved">Unsaved changes</span>
				{:else}
					<span class="saved">Saved</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Canvas container -->
	<div class="canvas-container">
		<canvas bind:this={canvasElement} class="fabric-canvas"></canvas>
	</div>

	<!-- Evidence panel -->
	<div class="evidence-panel">
		<h3>Evidence</h3>
		<div class="evidence-list">
			{#each evidence as item}
				<div class="evidence-item">
					<div class="evidence-info">
						<div class="evidence-title">{item.title}</div>
						<div class="evidence-type">{item.fileType}</div>
					</div>
					<button
						class="add-evidence-btn"
						on:click={() => addEvidenceMarker(item)}
						disabled={readOnly}
						title="Add evidence marker to canvas"
					>
						+
					</button>
				</div>
			{/each}
		</div>
	</div>

	<!-- Citation panel -->
	<div class="citation-panel">
		<h3>Citations</h3>
		<div class="citation-list">
			{#each citationPoints as citation}
				<div class="citation-item">
					<div class="citation-info">
						<div class="citation-source">{citation.source}</div>
						<div class="citation-text">{citation.text.substring(0, 50)}...</div>
					</div>
					<button
						class="add-citation-btn"
						on:click={() => addCitationMarker(citation)}
						disabled={readOnly}
						title="Add citation marker to canvas"
					>
						+
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.canvas-editor-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-height: 800px;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		background: white;
		position: relative;
	}

	.canvas-toolbar {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid #e2e8f0;
		background: #f8fafc;
		gap: 24px;
		flex-wrap: wrap;
	}

	.tool-group {
		display: flex;
		gap: 4px;
	}

	.tool-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 60px;
	}

	.tool-btn:hover:not(:disabled) {
		background: #f3f4f6;
	}

	.tool-btn.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.tool-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tool-icon {
		font-size: 16px;
		margin-bottom: 2px;
	}

	.tool-name {
		font-size: 10px;
		font-weight: 500;
	}

	.tool-options {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.tool-options > div {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.tool-options label {
		font-size: 12px;
		font-weight: 500;
		color: #374151;
	}

	.tool-options input[type="color"] {
		width: 30px;
		height: 30px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		cursor: pointer;
	}

	.tool-options input[type="range"] {
		width: 80px;
	}

	.tool-options span {
		font-size: 12px;
		color: #6b7280;
		min-width: 35px;
	}

	.canvas-controls {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-left: auto;
	}

	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.zoom-controls button {
		width: 30px;
		height: 30px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
	}

	.zoom-controls button:hover:not(:disabled) {
		background: #f3f4f6;
	}

	.zoom-level {
		font-size: 12px;
		font-weight: 500;
		min-width: 40px;
		text-align: center;
	}

	.action-buttons {
		display: flex;
		gap: 8px;
	}

	.action-buttons button {
		padding: 6px 12px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 12px;
		transition: all 0.2s;
	}

	.action-buttons button:hover {
		background: #f3f4f6;
	}

	.save-status {
		font-size: 12px;
		font-weight: 500;
	}

	.saving { color: #f59e0b; }
	.saved { color: #10b981; }
	.unsaved { color: #ef4444; }

	.canvas-container {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #f9fafb;
		overflow: hidden;
		position: relative;
	}

	.fabric-canvas {
		border: 1px solid #d1d5db;
		border-radius: 4px;
		background: white;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	.evidence-panel,
	.citation-panel {
		position: absolute;
		right: 16px;
		width: 250px;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		max-height: 300px;
		overflow-y: auto;
		z-index: 10;
	}

	.evidence-panel {
		top: 80px;
	}

	.citation-panel {
		top: 400px;
	}

	.evidence-panel h3,
	.citation-panel h3 {
		margin: 0;
		padding: 12px 16px;
		font-size: 14px;
		font-weight: 600;
		border-bottom: 1px solid #e2e8f0;
		background: #f8fafc;
	}

	.evidence-list,
	.citation-list {
		padding: 8px;
	}

	.evidence-item,
	.citation-item {
		display: flex;
		align-items: center;
		padding: 8px;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		margin-bottom: 4px;
		background: white;
	}

	.evidence-info,
	.citation-info {
		flex: 1;
		min-width: 0;
	}

	.evidence-title,
	.citation-source {
		font-size: 12px;
		font-weight: 500;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.evidence-type,
	.citation-text {
		font-size: 11px;
		color: #6b7280;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.add-evidence-btn,
	.add-citation-btn {
		width: 24px;
		height: 24px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 14px;
		color: #3b82f6;
		margin-left: 8px;
	}

	.add-evidence-btn:hover:not(:disabled),
	.add-citation-btn:hover:not(:disabled) {
		background: #f3f4f6;
	}

	.add-evidence-btn:disabled,
	.add-citation-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Hide panels on smaller screens */
	@media (max-width: 1200px) {
		.evidence-panel,
		.citation-panel {
			display: none;
		}
	}
</style>
