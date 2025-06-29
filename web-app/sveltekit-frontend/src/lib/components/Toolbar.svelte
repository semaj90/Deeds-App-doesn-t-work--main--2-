<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { toolbarStore } from '$lib/stores/canvas';
	
	import TextB from 'phosphor-svelte/lib/TextB';
	import TextItalic from 'phosphor-svelte/lib/TextItalic';
	import TextUnderline from 'phosphor-svelte/lib/TextUnderline';
	import TextStrikethrough from 'phosphor-svelte/lib/TextStrikethrough';
	import TextAlignLeft from 'phosphor-svelte/lib/TextAlignLeft';
	import TextAlignCenter from 'phosphor-svelte/lib/TextAlignCenter';
	import TextAlignRight from 'phosphor-svelte/lib/TextAlignRight';
	import PaintBrush from 'phosphor-svelte/lib/PaintBrush';
	import Selection from 'phosphor-svelte/lib/Selection';
	import Hand from 'phosphor-svelte/lib/Hand';
	import Rectangle from 'phosphor-svelte/lib/Rectangle';
	import Circle from 'phosphor-svelte/lib/Circle';
	import ArrowCounterClockwise from 'phosphor-svelte/lib/ArrowCounterClockwise';
	import ArrowClockwise from 'phosphor-svelte/lib/ArrowClockwise';
	import Copy from 'phosphor-svelte/lib/Copy';
	import Trash from 'phosphor-svelte/lib/Trash';
	import MagnifyingGlassPlus from 'phosphor-svelte/lib/MagnifyingGlassPlus';
	import MagnifyingGlassMinus from 'phosphor-svelte/lib/MagnifyingGlassMinus';

	const dispatch = createEventDispatcher();

	// Tool categories
	const tools = [
		{ id: 'select', icon: Selection, label: 'Select', category: 'selection' },
		{ id: 'pan', icon: Hand, label: 'Pan', category: 'navigation' },
		{ id: 'text', icon: TextB, label: 'Text', category: 'content' },
		{ id: 'rectangle', icon: Rectangle, label: 'Rectangle', category: 'shapes' },
		{ id: 'circle', icon: Circle, label: 'Circle', category: 'shapes' },
		{ id: 'draw', icon: PaintBrush, label: 'Draw', category: 'drawing' }
	];

	const formatActions = [
		{ id: 'bold', icon: TextB, label: 'Bold' },
		{ id: 'italic', icon: TextItalic, label: 'Italic' },
		{ id: 'underline', icon: TextUnderline, label: 'Underline' },
		{ id: 'strikethrough', icon: TextStrikethrough, label: 'Strikethrough' }
	];

	const alignActions = [
		{ id: 'left', icon: TextAlignLeft, label: 'Align Left' },
		{ id: 'center', icon: TextAlignCenter, label: 'Align Center' },
		{ id: 'right', icon: TextAlignRight, label: 'Align Right' }
	];

	// Reactive toolbar state
	$: selectedTool = $toolbarStore.selectedTool;
	$: formatting = $toolbarStore.formatting;
	$: drawing = $toolbarStore.drawing;
	$: canUndo = $toolbarStore.canUndo;
	$: canRedo = $toolbarStore.canRedo;
	$: zoom = $toolbarStore.zoom;

	function selectTool(toolId: string) {
		toolbarStore.update(state => ({
			...state,
			selectedTool: toolId
		}));
		dispatch('toolSelected', { tool: toolId });
	}

	function toggleFormatting(formatType: string) {
		toolbarStore.update(state => ({
			...state,
			formatting: {
				...state.formatting,
				[formatType]: !(state.formatting as any)[formatType]
			}
		}));
		dispatch('formatToggled', { type: formatType, value: !(formatting as any)[formatType] });
	}

	function setAlignment(alignment: string) {
		toolbarStore.update(state => ({
			...state,
			formatting: {
				...state.formatting,
				textAlign: alignment
			}
		}));
		dispatch('alignmentChanged', { alignment });
	}

	function handleColorChange(event: Event, type: 'color' | 'backgroundColor') {
		const target = event.target as HTMLInputElement;
		const color = target.value;
		
		toolbarStore.update(state => ({
			...state,
			formatting: {
				...state.formatting,
				[type]: color
			}
		}));
		dispatch('colorChanged', { type, color });
	}

	function handleFontSizeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const fontSize = parseInt(target.value, 10);
		
		toolbarStore.update(state => ({
			...state,
			formatting: {
				...state.formatting,
				fontSize
			}
		}));
		dispatch('fontSizeChanged', { fontSize });
	}

	function handleStrokeWidthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const strokeWidth = parseInt(target.value, 10);
		
		toolbarStore.update(state => ({
			...state,
			drawing: {
				...state.drawing,
				strokeWidth
			}
		}));
		dispatch('strokeWidthChanged', { strokeWidth });
	}

	function handleAction(action: string) {
		dispatch('action', { action });
	}

	function handleZoom(delta: number) {
		const newZoom = Math.max(10, Math.min(500, zoom + delta));
		toolbarStore.update(state => ({
			...state,
			zoom: newZoom
		}));
		dispatch('zoomChanged', { zoom: newZoom });
	}
</script>

<div class="toolbar-container" role="toolbar" aria-label="Canvas tools">
	<!-- Tool Selection -->
	<div class="toolbar-section">
		<div class="tool-group">
			{#each tools as tool}
				<button
					class="tool-button"
					class:active={selectedTool === tool.id}
					on:click={() => selectTool(tool.id)}
					aria-label={tool.label}
					title={tool.label}
				>
					<svelte:component this={tool.icon} size={18} />
				</button>
			{/each}
		</div>
	</div>

	<div class="toolbar-separator"></div>

	<!-- Text Formatting -->
	<div class="toolbar-section">
		<div class="tool-group">
			{#each formatActions as action}
				<button
					class="format-button"
					class:active={(formatting as any)[action.id]}
					on:click={() => toggleFormatting(action.id)}
					aria-label={action.label}
					title={action.label}
					disabled={selectedTool !== 'text'}
				>
					<svelte:component this={action.icon} size={16} />
				</button>
			{/each}
		</div>

		<div class="tool-group">
			{#each alignActions as action}
				<button
					class="align-button"
					class:active={formatting.textAlign === action.id}
					on:click={() => setAlignment(action.id)}
					aria-label={action.label}
					title={action.label}
					disabled={selectedTool !== 'text'}
				>
					<svelte:component this={action.icon} size={16} />
				</button>
			{/each}
		</div>

		<div class="tool-group">
			<label class="color-input">
				<input
					type="color"
					value={formatting.color}
					on:change={(e) => handleColorChange(e, 'color')}
					title="Text Color"
					disabled={selectedTool !== 'text'}
				/>
				<span class="color-preview" style="background-color: {formatting.color}"></span>
			</label>

			<label class="size-input">
				<input
					type="range"
					min="8"
					max="72"
					value={formatting.fontSize}
					on:input={handleFontSizeChange}
					title="Font Size: {formatting.fontSize}px"
					disabled={selectedTool !== 'text'}
				/>
				<span class="size-label">{formatting.fontSize}px</span>
			</label>
		</div>
	</div>

	<div class="toolbar-separator"></div>

	<!-- Drawing Tools -->
	<div class="toolbar-section">
		<div class="tool-group">
			<label class="color-input">
				<input
					type="color"
					value={drawing.strokeColor}
					on:change={(e) => handleColorChange(e, 'color')}
					title="Stroke Color"
					disabled={!['draw', 'rectangle', 'circle'].includes(selectedTool)}
				/>
				<span class="color-preview" style="background-color: {drawing.strokeColor}"></span>
			</label>

			<label class="size-input">
				<input
					type="range"
					min="1"
					max="20"
					value={drawing.strokeWidth}
					on:input={handleStrokeWidthChange}
					title="Stroke Width: {drawing.strokeWidth}px"
					disabled={!['draw', 'rectangle', 'circle'].includes(selectedTool)}
				/>
				<span class="size-label">{drawing.strokeWidth}px</span>
			</label>
		</div>
	</div>

	<div class="toolbar-separator"></div>

	<!-- Actions -->
	<div class="toolbar-section">
		<div class="tool-group">
			<button
				class="action-button"
				on:click={() => handleAction('undo')}
				disabled={!canUndo}
				aria-label="Undo"
				title="Undo"
			>
				<ArrowCounterClockwise size={18} />
			</button>

			<button
				class="action-button"
				on:click={() => handleAction('redo')}
				disabled={!canRedo}
				aria-label="Redo"
				title="Redo"
			>
				<ArrowClockwise size={18} />
			</button>
		</div>

		<div class="tool-group">
			<button
				class="action-button"
				on:click={() => handleAction('copy')}
				aria-label="Copy"
				title="Copy"
			>
				<Copy size={18} />
			</button>

			<button
				class="action-button"
				on:click={() => handleAction('delete')}
				aria-label="Delete"
				title="Delete"
			>
				<Trash size={18} />
			</button>
		</div>
	</div>

	<div class="toolbar-separator"></div>

	<!-- Zoom Controls -->
	<div class="toolbar-section">
		<div class="tool-group">
			<button
				class="action-button"
				on:click={() => handleZoom(-10)}
				aria-label="Zoom Out"
				title="Zoom Out"
			>
				<MagnifyingGlassMinus size={18} />
			</button>

			<span class="zoom-level">{zoom}%</span>

			<button
				class="action-button"
				on:click={() => handleZoom(10)}
				aria-label="Zoom In"
				title="Zoom In"
			>
				<MagnifyingGlassPlus size={18} />
			</button>
		</div>
	</div>
</div>

<style>
	.toolbar-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--pico-card-background-color);
		border-bottom: 1px solid var(--pico-muted-border-color);
		overflow-x: auto;
		min-height: 60px;
	}

	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.tool-group {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem;
		background: var(--pico-background-color);
		border-radius: 6px;
		border: 1px solid var(--pico-muted-border-color);
	}

	.tool-button,
	.format-button,
	.align-button,
	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s ease;
		color: var(--pico-color);
	}

	.tool-button:hover,
	.format-button:hover,
	.align-button:hover,
	.action-button:hover {
		background: var(--pico-secondary-background);
	}

	.tool-button.active,
	.format-button.active,
	.align-button.active {
		background: var(--pico-primary);
		color: var(--pico-primary-inverse);
	}

	.tool-button:disabled,
	.format-button:disabled,
	.align-button:disabled,
	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.color-input {
		position: relative;
		cursor: pointer;
	}

	.color-input input[type="color"] {
		position: absolute;
		opacity: 0;
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	.color-preview {
		display: block;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: 2px solid var(--pico-muted-border-color);
		cursor: pointer;
	}

	.size-input {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	.size-input input[type="range"] {
		width: 80px;
		height: 4px;
		background: var(--pico-muted-background);
		border-radius: 2px;
		outline: none;
		cursor: pointer;
	}

	.size-input input[type="range"]::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		background: var(--pico-primary);
		border-radius: 50%;
		cursor: pointer;
	}

	.size-label {
		font-size: 0.75rem;
		color: var(--pico-muted-color);
		min-width: 35px;
		text-align: center;
	}

	.zoom-level {
		font-size: 0.875rem;
		color: var(--pico-color);
		min-width: 45px;
		text-align: center;
		font-weight: 500;
	}

	.toolbar-separator {
		width: 1px;
		height: 32px;
		background: var(--pico-muted-border-color);
		margin: 0 0.5rem;
		flex-shrink: 0;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.toolbar-container {
			padding: 0.5rem;
			gap: 0.25rem;
		}

		.size-input input[type="range"] {
			width: 60px;
		}

		.size-label {
			display: none;
		}
	}
</style>
