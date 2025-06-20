<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { db } from '$lib/server/db/index.js';
	import { cases } from '$lib/server/db/schema.js';
	
	export let text: string = '';
	export let entity: any = null;
	export let position: { x: number; y: number } = { x: 0, y: 0 };
	export let confidence: number = 0;
	export let isVisible: boolean = false;
	export let currentCaseId: string = '';
	
	const dispatch = createEventDispatcher();
	
	let availableCases: any[] = [];
	let selectedCaseId = '';
	let isLoading = false;
	let showCreateNew = false;
	let newCaseTitle = '';
	
	// Load available cases when tooltip becomes visible
	$: if (isVisible) {
		loadAvailableCases();
	}
	
	async function loadAvailableCases() {
		try {
			const response = await fetch('/api/cases/list');
			if (response.ok) {
				availableCases = await response.json();
			}
		} catch (error) {
			console.error('Failed to load cases:', error);
		}
	}
	
	async function sendToCase(caseId: string) {
		if (!text || !entity) return;
		
		isLoading = true;
		try {
			// Create highlight entry
			const highlightData = {
				text,
				entity,
				confidence,
				caseId: caseId || currentCaseId,
				timestamp: new Date().toISOString(),
				context: getHighlightContext()
			};
			
			// Send to API to store and embed
			const response = await fetch('/api/highlights/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(highlightData)
			});
			
			if (response.ok) {
				const result = await response.json();
				
				// Store in vector database
				await storeEmbedding(result.highlightId, text, entity);
				
				dispatch('highlight-saved', {
					highlightId: result.highlightId,
					caseId: caseId || currentCaseId,
					text,
					entity
				});
				
				// Hide tooltip
				isVisible = false;
			} else {
				throw new Error('Failed to save highlight');
			}
		} catch (error) {
			console.error('Error saving highlight:', error);
			// Show error state
		} finally {
			isLoading = false;
		}
	}
	
	async function createNewCase() {
		if (!newCaseTitle.trim()) return;
		
		isLoading = true;
		try {
			const response = await fetch('/api/cases/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: newCaseTitle,
					description: `Created from highlight: "${text}"`,
					status: 'active',
					initialHighlight: {
						text,
						entity,
						confidence
					}
				})
			});
			
			if (response.ok) {
				const newCase = await response.json();
				await sendToCase(newCase.id);
				showCreateNew = false;
				newCaseTitle = '';
			}
		} catch (error) {
			console.error('Error creating case:', error);
		} finally {
			isLoading = false;
		}
	}
	
	async function storeEmbedding(highlightId: string, text: string, entity: any) {
		try {
			// Generate embedding via our NLP service
			const embeddingResponse = await fetch('http://localhost:8001/embed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			});
			
			if (embeddingResponse.ok) {
				const embeddingData = await embeddingResponse.json();
				
				// Store in Qdrant
				await fetch('/api/embeddings/store', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						id: highlightId,
						vector: embeddingData.embedding,
						payload: {
							text,
							entity,
							confidence,
							type: 'highlight',
							timestamp: new Date().toISOString()
						}
					})
				});
			}
		} catch (error) {
			console.error('Failed to store embedding:', error);
		}
	}
	
	function getHighlightContext() {
		// Get surrounding text for context
		return {
			entityType: entity?.type || 'UNKNOWN',
			confidence,
			position,
			timestamp: Date.now()
		};
	}
	
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isVisible = false;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible}
	<div 
		class="highlight-tooltip position-absolute bg-white border border-secondary rounded shadow-lg p-3"
		style="left: {position.x}px; top: {position.y}px; z-index: 1050; min-width: 300px;"
		role="dialog"
		aria-label="Highlight options"
	>
		<!-- Header -->
		<div class="d-flex justify-content-between align-items-start mb-2">
			<h6 class="mb-0 text-primary">
				<i class="bi bi-cursor-text me-1"></i>
				"{text}"
			</h6>
			<button 
				class="btn-close btn-close-sm" 
				on:click={() => isVisible = false}
				aria-label="Close"
			></button>
		</div>
		
		<!-- Entity Info -->
		{#if entity}
			<div class="mb-2">
				<small class="badge bg-info me-2">{entity.type}</small>
				<small class="text-muted">
					Confidence: {Math.round(confidence * 100)}%
				</small>
			</div>
		{/if}
		
		<!-- Loading State -->
		{#if isLoading}
			<div class="text-center p-2">
				<div class="spinner-border spinner-border-sm me-2" role="status"></div>
				<small>Processing...</small>
			</div>
		{:else if showCreateNew}
			<!-- Create New Case Form -->
			<div class="mb-3">
				<label for="newCaseTitle" class="form-label">New Case Title</label>
				<input 
					id="newCaseTitle"
					type="text" 
					class="form-control form-control-sm"
					bind:value={newCaseTitle}
					placeholder="Enter case title..."
					on:keydown={(e) => e.key === 'Enter' && createNewCase()}
				/>
			</div>
			<div class="d-flex gap-2">
				<button 
					class="btn btn-primary btn-sm"
					on:click={createNewCase}
					disabled={!newCaseTitle.trim()}
				>
					<i class="bi bi-plus-circle me-1"></i>
					Create & Add
				</button>
				<button 
					class="btn btn-outline-secondary btn-sm"
					on:click={() => showCreateNew = false}
				>
					Cancel
				</button>
			</div>
		{:else}
			<!-- Case Selection -->
			<div class="mb-3">
				<label class="form-label">Add to Case:</label>
				
				<!-- Current Case Option -->
				{#if currentCaseId}
					<button 
						class="btn btn-outline-primary btn-sm w-100 mb-2"
						on:click={() => sendToCase(currentCaseId)}
					>
						<i class="bi bi-folder-plus me-1"></i>
						Add to Current Case
					</button>
				{/if}
				
				<!-- Available Cases -->				{#if availableCases.length > 0}
					<select 
						class="form-select form-select-sm mb-2"
						bind:value={selectedCaseId}
					>
						<option value="">Select existing case...</option>
						{#each availableCases as caseItem}
							<option value={caseItem.id}>{caseItem.title}</option>
						{/each}
					</select>
					
					{#if selectedCaseId}
						<button 
							class="btn btn-success btn-sm w-100 mb-2"
							on:click={() => sendToCase(selectedCaseId)}
						>
							<i class="bi bi-arrow-right-circle me-1"></i>
							Send to Selected Case
						</button>
					{/if}
				{/if}
				
				<!-- Create New Case -->
				<button 
					class="btn btn-outline-success btn-sm w-100"
					on:click={() => showCreateNew = true}
				>
					<i class="bi bi-plus-circle me-1"></i>
					Create New Case
				</button>
			</div>
			
			<!-- Additional Actions -->
			<div class="border-top pt-2">
				<div class="d-flex gap-2">
					<button 
						class="btn btn-outline-info btn-sm flex-fill"
						on:click={() => dispatch('find-similar', { text, entity })}
					>
						<i class="bi bi-search me-1"></i>
						Find Similar
					</button>
					<button 
						class="btn btn-outline-warning btn-sm flex-fill"
						on:click={() => dispatch('annotate', { text, entity, position })}
					>
						<i class="bi bi-pencil me-1"></i>
						Annotate
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.highlight-tooltip {
		max-width: 350px;
		animation: fadeIn 0.2s ease-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	.highlight-tooltip::before {
		content: '';
		position: absolute;
		top: -8px;
		left: 20px;
		width: 0;
		height: 0;
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-bottom: 8px solid #dee2e6;
	}
	
	.highlight-tooltip::after {
		content: '';
		position: absolute;
		top: -7px;
		left: 20px;
		width: 0;
		height: 0;
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-bottom: 8px solid white;
	}
</style>
