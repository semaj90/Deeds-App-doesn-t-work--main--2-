<!--
	TransformSyncDemo.svelte - Demo component showing transform sync integration
	
	This component demonstrates:
	- Integration with Fabric.js canvas
	- Real-time transform synchronization
	- Undo/redo functionality
	- Matrix-based transformations
	- Auto-save with visual feedback
-->

<script lang="ts">	import { onMount, onDestroy } from 'svelte';	import { browser } from '$app/environment';
	import {
		initializeTransformSync,
		cleanupTransformSync,
		canUndo,
		canRedo,
		hasUnsavedChanges,
		isProcessing,
		UndoRedoManager,
		MatrixUtils,
		helpers,
		CacheManager,
		AutoSaveManager
	} from '$lib/stores/transform-sync';

	// Fabric.js dynamic import
	let fabric: any;
	let canvasElement: HTMLCanvasElement;
	let fabricCanvas: fabric.Canvas;
	let selectedObject: fabric.Object | null = null;

	// Transform controls
	let translateX = 0;
	let translateY = 0;
	let rotateAngle = 0;
	let scaleX = 1;
	let scaleY = 1;

	// Demo state
	let showMatrix = false;
	let currentMatrix: number[][] = MatrixUtils.identity();
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

		// Initialize Fabric.js canvas
		fabricCanvas = new fabric.Canvas(canvasElement, {
			width: 800,
			height: 600,
			backgroundColor: 'white'
		});

		// Add some demo objects
		await addDemoObjects();

		// Initialize transform sync
		initializeTransformSync(fabricCanvas);

		// Set up selection handler
		fabricCanvas.on('selection:created', (e) => {
			selectedObject = e.selected?.[0] || null;
			updateTransformControls();
		});

		fabricCanvas.on('selection:updated', (e) => {
			selectedObject = e.selected?.[0] || null;
			updateTransformControls();
		});

		fabricCanvas.on('selection:cleared', () => {
			selectedObject = null;
			resetTransformControls();
		});

		fabricCanvas.on('object:modified', () => {
			updateTransformControls();
		});
	});

	onDestroy(() => {
		cleanupTransformSync();
		fabricCanvas?.dispose();
	});

	async function addDemoObjects() {
		// Add a rectangle
		const rect = new fabric.Rect({
			left: 100,
			top: 100,
			width: 100,
			height: 80,
			fill: '#ff6b6b',
			stroke: '#c92a2a',
			strokeWidth: 2
		});
		(rect as any).id = 'demo-rect';
		fabricCanvas.add(rect);

		// Add a circle
		const circle = new fabric.Circle({
			left: 250,
			top: 150,
			radius: 50,
			fill: '#4ecdc4',
			stroke: '#0ca678',
			strokeWidth: 2
		});
		(circle as any).id = 'demo-circle';
		fabricCanvas.add(circle);

		// Add some text
		const text = new fabric.Text('Transform Demo', {
			left: 400,
			top: 200,
			fontSize: 24,
			fill: '#495057',
			fontFamily: 'Arial'
		});
		(text as any).id = 'demo-text';
		fabricCanvas.add(text);

		fabricCanvas.renderAll();
	}

	function updateTransformControls() {
		if (!selectedObject) return;

		// Get current transform values
		translateX = selectedObject.left || 0;
		translateY = selectedObject.top || 0;
		rotateAngle = selectedObject.angle || 0;
		scaleX = selectedObject.scaleX || 1;
		scaleY = selectedObject.scaleY || 1;

		// Update matrix display
		if (showMatrix) {
			currentMatrix = MatrixUtils.fabricToMatrix(selectedObject);
		}
	}

	function resetTransformControls() {
		translateX = 0;
		translateY = 0;
		rotateAngle = 0;
		scaleX = 1;
		scaleY = 1;
		currentMatrix = MatrixUtils.identity();
	}

	// Transform operations using the sync system
	function applyTranslate() {
		if (!selectedObject) return;
		const objectId = (selectedObject as any).id;
		helpers.translate(objectId, translateX - (selectedObject.left || 0), translateY - (selectedObject.top || 0));
	}

	function applyRotate() {
		if (!selectedObject) return;
		const objectId = (selectedObject as any).id;
		const currentAngle = selectedObject.angle || 0;
		const deltaAngle = (rotateAngle - currentAngle) * Math.PI / 180;
		helpers.rotate(objectId, deltaAngle);
	}

	function applyScale() {
		if (!selectedObject) return;
		const objectId = (selectedObject as any).id;
		const currentScaleX = selectedObject.scaleX || 1;
		const currentScaleY = selectedObject.scaleY || 1;
		helpers.scale(objectId, scaleX / currentScaleX, scaleY / currentScaleY);
	}

	function applyCompositeTransform() {
		if (!selectedObject) return;
		const objectId = (selectedObject as any).id;

		// Create composite transformation matrix
		const translateMatrix = MatrixUtils.translate(translateX, translateY);
		const rotateMatrix = MatrixUtils.rotate(rotateAngle * Math.PI / 180);
		const scaleMatrix = MatrixUtils.scale(scaleX, scaleY);

		// Combine transformations: T * R * S
		let compositeMatrix = MatrixUtils.multiply(translateMatrix, rotateMatrix);
		compositeMatrix = MatrixUtils.multiply(compositeMatrix, scaleMatrix);

		helpers.transform(objectId, compositeMatrix);
	}

	// Matrix operations
	function createCustomMatrix() {
		// Example: Create a shear transformation
		const shearMatrix = [
			[1, 0.5, 0],
			[0.3, 1, 0],
			[0, 0, 1]
		];

		if (selectedObject) {
			const objectId = (selectedObject as any).id;
			helpers.transform(objectId, shearMatrix);
		}
	}

	function resetTransform() {
		if (!selectedObject) return;
		const objectId = (selectedObject as any).id;
		helpers.transform(objectId, MatrixUtils.identity());
	}

	// Utility functions
	function clearCanvas() {
		fabricCanvas.clear();
		addDemoObjects();
	}

	async function manualSave() {
		await AutoSaveManager.save();
	}

	function getCacheStats() {
		return CacheManager.getStats();
	}

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
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
				case 's':
					event.preventDefault();
					manualSave();
					break;
			}
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="transform-sync-demo">
	<header class="demo-header">
		<h1>Transform Sync Demo</h1>
		<div class="status-indicators">
			<div class="indicator" class:active={$isProcessing}>
				<span class="dot processing"></span>
				Processing
			</div>
			<div class="indicator" class:active={$hasUnsavedChanges}>
				<span class="dot unsaved"></span>
				Unsaved Changes
			</div>
		</div>
	</header>

	<div class="demo-layout">
		<!-- Canvas Area -->
		<div class="canvas-container">
			<canvas bind:this={canvasElement}></canvas>
		</div>

		<!-- Control Panel -->
		<div class="control-panel">
			<!-- Undo/Redo Controls -->
			<section class="control-section">
				<h3>History</h3>
				<div class="button-group">
					<button 
						on:click={() => UndoRedoManager.undo()} 
						disabled={!$canUndo}
						title="Ctrl+Z"
					>
						↶ Undo
					</button>
					<button 
						on:click={() => UndoRedoManager.redo()} 
						disabled={!$canRedo}
						title="Ctrl+Y or Ctrl+Shift+Z"
					>
						↷ Redo
					</button>
				</div>
			</section>

			<!-- Transform Controls -->
			<section class="control-section">
				<h3>Transform Controls</h3>
				{#if selectedObject}
					<div class="transform-inputs">
						<div class="input-group">
							<label>Translate X:</label>
							<input type="number" bind:value={translateX} step="1" />
							<label>Y:</label>
							<input type="number" bind:value={translateY} step="1" />
							<button on:click={applyTranslate}>Apply</button>
						</div>

						<div class="input-group">
							<label>Rotate:</label>
							<input type="number" bind:value={rotateAngle} step="1" min="-360" max="360" />
							<span>degrees</span>
							<button on:click={applyRotate}>Apply</button>
						</div>

						<div class="input-group">
							<label>Scale X:</label>
							<input type="number" bind:value={scaleX} step="0.1" min="0.1" max="5" />
							<label>Y:</label>
							<input type="number" bind:value={scaleY} step="0.1" min="0.1" max="5" />
							<button on:click={applyScale}>Apply</button>
						</div>

						<div class="button-group">
							<button on:click={applyCompositeTransform} class="primary">
								Apply Composite
							</button>
							<button on:click={resetTransform}>
								Reset Transform
							</button>
						</div>
					</div>
				{:else}
					<p class="no-selection">Select an object to transform</p>
				{/if}
			</section>

			<!-- Matrix Operations -->
			<section class="control-section">
				<h3>Matrix Operations</h3>
				<div class="button-group">
					<button on:click={createCustomMatrix} disabled={!selectedObject}>
						Apply Shear
					</button>
					<button on:click={() => showMatrix = !showMatrix}>
						{showMatrix ? 'Hide' : 'Show'} Matrix
					</button>
				</div>

				{#if showMatrix && selectedObject}
					<div class="matrix-display">
						<h4>Current Transform Matrix:</h4>
						<div class="matrix">
							{#each currentMatrix as row}
								<div class="matrix-row">
									{#each row as cell}
										<span class="matrix-cell">{cell.toFixed(3)}</span>
									{/each}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</section>

			<!-- Canvas Operations -->
			<section class="control-section">
				<h3>Canvas Operations</h3>
				<div class="button-group">
					<button on:click={clearCanvas}>Clear Canvas</button>
					<button on:click={manualSave} disabled={!$hasUnsavedChanges}>
						Save Now
					</button>
				</div>
			</section>

			<!-- Cache Stats -->
			<section class="control-section">
				<h3>Cache Stats</h3>
				<div class="stats">
					{@const stats = getCacheStats()}
					<div>Entries: {stats.entries}</div>
					<div>Size: {(stats.totalSize / 1024).toFixed(1)} KB</div>
				</div>
			</section>

			<!-- Help -->
			<section class="control-section">
				<h3>Keyboard Shortcuts</h3>
				<div class="shortcuts">
					<div><kbd>Ctrl+Z</kbd> Undo</div>
					<div><kbd>Ctrl+Y</kbd> Redo</div>
					<div><kbd>Ctrl+S</kbd> Save</div>
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.transform-sync-demo {
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.demo-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 10px;
		border-bottom: 2px solid #e9ecef;
	}

	.demo-header h1 {
		margin: 0;
		color: #2d3748;
	}

	.status-indicators {
		display: flex;
		gap: 15px;
	}

	.indicator {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		border-radius: 4px;
		background: #f8f9fa;
		color: #6c757d;
		font-size: 12px;
		transition: all 0.2s;
	}

	.indicator.active {
		background: #d4edda;
		color: #155724;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #6c757d;
	}

	.dot.processing {
		background: #007bff;
		animation: pulse 1s infinite;
	}

	.dot.unsaved {
		background: #ffc107;
	}

	.indicator.active .dot {
		background: #28a745;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.demo-layout {
		display: flex;
		gap: 20px;
	}

	.canvas-container {
		flex: 1;
		border: 2px solid #dee2e6;
		border-radius: 8px;
		overflow: hidden;
	}

	.control-panel {
		width: 320px;
		background: #f8f9fa;
		border-radius: 8px;
		padding: 20px;
		height: fit-content;
	}

	.control-section {
		margin-bottom: 25px;
		padding-bottom: 20px;
		border-bottom: 1px solid #dee2e6;
	}

	.control-section:last-child {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	.control-section h3 {
		margin: 0 0 15px 0;
		color: #495057;
		font-size: 16px;
	}

	.button-group {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	button {
		padding: 8px 12px;
		border: 1px solid #ced4da;
		border-radius: 4px;
		background: white;
		color: #495057;
		cursor: pointer;
		font-size: 13px;
		transition: all 0.2s;
	}

	button:hover:not(:disabled) {
		background: #e9ecef;
		border-color: #adb5bd;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button.primary {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}

	button.primary:hover:not(:disabled) {
		background: #0056b3;
		border-color: #0056b3;
	}

	.transform-inputs {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.input-group {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.input-group label {
		font-size: 12px;
		color: #6c757d;
		min-width: 60px;
	}

	.input-group input {
		width: 80px;
		padding: 4px 8px;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 13px;
	}

	.no-selection {
		color: #6c757d;
		font-style: italic;
		margin: 0;
	}

	.matrix-display {
		margin-top: 15px;
	}

	.matrix-display h4 {
		margin: 0 0 10px 0;
		font-size: 14px;
		color: #495057;
	}

	.matrix {
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background: white;
		padding: 10px;
		border-radius: 4px;
		border: 1px solid #dee2e6;
	}

	.matrix-row {
		display: flex;
		gap: 10px;
	}

	.matrix-cell {
		min-width: 60px;
		text-align: right;
		padding: 2px 4px;
	}

	.stats {
		display: flex;
		flex-direction: column;
		gap: 5px;
		font-size: 13px;
		color: #6c757d;
	}

	.shortcuts {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 13px;
	}

	.shortcuts div {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	kbd {
		background: #e9ecef;
		border: 1px solid #ced4da;
		border-radius: 3px;
		padding: 2px 6px;
		font-size: 11px;
		font-family: monospace;
	}
</style>
