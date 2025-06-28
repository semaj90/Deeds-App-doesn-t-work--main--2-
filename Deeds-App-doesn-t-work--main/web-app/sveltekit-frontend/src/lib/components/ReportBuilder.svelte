<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { enhancedCitationStore } from '../stores/enhancedCitationStore2.js';
	import type { CitationPoint, AIAnalysis } from '../data/types.js';
	
	// Props
	export let reportId: string;
	export let caseId: string;
	export let initialContent: string = '';
	
	// Local state
	let editorElement: HTMLDivElement;
	let editorContent = initialContent;
	let showCitationPopup = false;
	let citationPopupPosition = { x: 0, y: 0 };
	let selectedText = '';
	let isAIProcessing = false;
	let showAISuggestions = false;
	let aiSuggestions: AIAnalysis[] = [];
	
	// Store subscriptions
	let citations: CitationPoint[] = [];
	let searchResults: CitationPoint[] = [];
	let notifications: any[] = [];
	let editorState: any = {};
	
	// Subscribe to stores
	const unsubscribers = [
		enhancedCitationStore.citations$.subscribe(value => citations = value),
		enhancedCitationStore.searchResults$.subscribe(value => searchResults = value),
		enhancedCitationStore.notifications$.subscribe(value => notifications = value),
		enhancedCitationStore.editorState$.subscribe(value => editorState = value),
		enhancedCitationStore.aiSuggestions$.subscribe(value => aiSuggestions = value),
		enhancedCitationStore.isProcessingAI$.subscribe(value => isAIProcessing = value)
	];
	
	onMount(async () => {
		// Initialize the enhanced citation store
		await enhancedCitationStore.initialize();
		
		// Set up editor
		if (editorElement) {
			editorElement.innerHTML = editorContent;
			setupEditorListeners();
		}
		
		// Load citations for this report
		await enhancedCitationStore.loadCitationsForReport(reportId);
	});
	
	onDestroy(() => {
		unsubscribers.forEach(unsub => unsub());
	});
	
	function setupEditorListeners() {
		if (!editorElement) return;
		
		// Handle text selection for citation insertion
		editorElement.addEventListener('mouseup', handleTextSelection);
		editorElement.addEventListener('keyup', handleTextSelection);
		
		// Handle input for AI suggestions
		editorElement.addEventListener('input', handleEditorInput);
		
		// Handle keyboard shortcuts
		editorElement.addEventListener('keydown', handleKeyboardShortcuts);
	}
	
	function handleTextSelection(event: Event) {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;
		
		selectedText = selection.toString().trim();
		
		if (selectedText.length > 0) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			
			citationPopupPosition = {
				x: rect.left + window.scrollX,
				y: rect.bottom + window.scrollY + 5
			};
			
			showCitationPopup = true;
		} else {
			showCitationPopup = false;
		}
	}
	
	function handleEditorInput() {
		editorContent = editorElement.innerHTML;
		
		// Update editor state in store
		enhancedCitationStore.updateEditorState({
			content: editorContent,
			autocomplete: editorState.autocomplete,
			ai: editorState.ai
		});
		
		// Trigger AI suggestions if enabled
		if (selectedText.length > 10) {
			requestAISuggestion('next_paragraph');
		}
	}
	
	function handleKeyboardShortcuts(event: KeyboardEvent) {
		// Ctrl+Shift+C: Insert citation
		if (event.ctrlKey && event.shiftKey && event.key === 'C') {
			event.preventDefault();
			showCitationSearch();
		}
		
		// Ctrl+Shift+A: Ask AI for help
		if (event.ctrlKey && event.shiftKey && event.key === 'A') {
			event.preventDefault();
			requestAISuggestion('tell_me_what_to_do');
		}
		
		// Ctrl+S: Save
		if (event.ctrlKey && event.key === 's') {
			event.preventDefault();
			saveReport();
		}
	}
	
	async function insertCitation(citation: CitationPoint) {
		if (!selectedText || !editorElement) return;
		
		// Create citation markup
		const citationHtml = `
			<span class="citation-hover" 
				  data-citation-id="${citation.id}"
				  title="${citation.label}">
				${selectedText}
			</span>
		`;
		
		// Replace selected text with citation
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			range.deleteContents();
			range.insertNode(document.createRange().createContextualFragment(citationHtml));
		}
		
		// Add citation point to report
		await enhancedCitationStore.addCitationToReport(reportId, citation, {
			selectedText,
			position: citationPopupPosition,
			context: editorContent.substring(0, 200) // Context for AI
		});
		
		showCitationPopup = false;
		selectedText = '';
	}
	
	async function requestAISuggestion(type: string) {
		if (isAIProcessing) return;
		
		const context = {
			currentContent: editorContent,
			selectedText,
			caseId,
			reportId
		};
		
		await enhancedCitationStore.requestAISuggestion({ type, context });
		showAISuggestions = true;
	}
	
	async function applySuggestion(suggestion: AIAnalysis) {
		if (!editorElement) return;
		
		// Insert AI suggestion at cursor position
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			range.insertNode(document.createTextNode(suggestion.output));
		}
		
		// Mark suggestion as applied
		await enhancedCitationStore.applySuggestion(suggestion.id);
		showAISuggestions = false;
	}
	
	function showCitationSearch() {
		// Trigger citation search UI
		enhancedCitationStore.search('', { reportId, tags: ['legal', 'precedent'] });
	}
	
	async function saveReport() {
		// Auto-save functionality
		await enhancedCitationStore.saveReport({
			id: reportId,
			caseId,
			content: editorContent,
			citations: citations.filter(c => c.reportId === reportId)
		});
		
		// Show notification
		enhancedCitationStore.addNotification({
			type: 'success',
			message: 'Report saved successfully',
			timestamp: new Date().toISOString()
		});
	}
	
	async function exportToPDF() {
		try {
			const response = await fetch('/api/export/pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					htmlContent: editorContent,
					title: `Report ${reportId}`,
					metadata: {
						caseNumber: caseId,
						date: new Date().toLocaleDateString(),
						author: 'Legal Professional'
					}
				})
			});
			
			const result = await response.json();
			
			if (result.success) {
				// Create download link
				const link = document.createElement('a');
				link.href = `data:application/pdf;base64,${result.pdf}`;
				link.download = result.filename;
				link.click();
			}
		} catch (error) {
			console.error('PDF export failed:', error);
		}
	}
</script>

<div class="report-builder">
	<!-- Toolbar -->
	<div class="toolbar">
		<div class="toolbar-group">
			<button class="btn btn-primary" on:click={showCitationSearch}>
				📚 Citations
			</button>
			<button class="btn btn-secondary" on:click={() => requestAISuggestion('tell_me_what_to_do')} disabled={isAIProcessing}>
				🤖 AI Help
			</button>
			<button class="btn btn-secondary" on:click={() => requestAISuggestion('next_paragraph')} disabled={isAIProcessing}>
				✨ Suggest Next
			</button>
		</div>
		
		<div class="toolbar-group">
			<button class="btn btn-success" on:click={saveReport}>
				💾 Save
			</button>
			<button class="btn btn-info" on:click={exportToPDF}>
				📄 Export PDF
			</button>
		</div>
		
		{#if isAIProcessing}
			<div class="ai-processing">
				<span class="spinner"></span>
				AI Processing...
			</div>
		{/if}
	</div>
	
	<!-- Main Editor -->
	<div class="editor-container">
		<div 
			class="editor"
			bind:this={editorElement}
			contenteditable="true"
			data-placeholder="Start writing your legal report..."
		></div>
		
		<!-- Citation Popup -->
		{#if showCitationPopup}
			<div 
				class="citation-popup"
				style="left: {citationPopupPosition.x}px; top: {citationPopupPosition.y}px;"
			>
				<div class="popup-header">
					<strong>Add Citation</strong>
					<button class="close-btn" on:click={() => showCitationPopup = false}>×</button>
				</div>
				
				<div class="citation-search">
					<input 
						type="text" 
						placeholder="Search citations..."
						on:input={e => enhancedCitationStore.search(e.target.value)}
					/>
				</div>
				
				<div class="citation-results">
					{#each searchResults.slice(0, 5) as citation}
						<div class="citation-item" on:click={() => insertCitation(citation)}>
							<strong>{citation.label}</strong>
							<p>{citation.content.substring(0, 100)}...</p>
							<span class="citation-type">{citation.sourceType}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- AI Suggestions Panel -->
		{#if showAISuggestions && aiSuggestions.length > 0}
			<div class="ai-suggestions">
				<div class="suggestions-header">
					<strong>AI Suggestions</strong>
					<button class="close-btn" on:click={() => showAISuggestions = false}>×</button>
				</div>
				
				{#each aiSuggestions as suggestion}
					<div class="suggestion-item">
						<div class="suggestion-type">{suggestion.analysisType}</div>
						<div class="suggestion-content">{suggestion.output}</div>
						<div class="suggestion-actions">
							<button class="btn btn-sm btn-primary" on:click={() => applySuggestion(suggestion)}>
								Apply
							</button>
							<span class="confidence">Confidence: {Math.round(suggestion.confidence * 100)}%</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	
	<!-- Sidebar with Citations -->
	<div class="sidebar">
		<h3>Citations ({citations.length})</h3>
		
		<div class="citation-library">
			{#each citations.filter(c => c.reportId === reportId) as citation}
				<div class="sidebar-citation">
					<strong>{citation.label}</strong>
					<p>{citation.content.substring(0, 80)}...</p>
					<div class="citation-meta">
						<span class="source-type">{citation.sourceType}</span>
						<span class="created-date">{new Date(citation.createdAt).toLocaleDateString()}</span>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Recent Citations -->
		<h4>Recent</h4>
		<div class="recent-citations">
			{#each citations.slice(0, 5) as citation}
				<div class="recent-citation" on:click={() => insertCitation(citation)}>
					{citation.label}
				</div>
			{/each}
		</div>
	</div>
	
	<!-- Notifications -->
	{#if notifications.length > 0}
		<div class="notifications">
			{#each notifications as notification}
				<div class="notification notification-{notification.type}">
					{notification.message}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.report-builder {
		display: grid;
		grid-template-columns: 1fr 300px;
		grid-template-rows: auto 1fr;
		gap: 1rem;
		height: 100vh;
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
	}
	
	.toolbar {
		grid-column: 1 / -1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		border: 1px solid #e9ecef;
	}
	
	.toolbar-group {
		display: flex;
		gap: 0.5rem;
	}
	
	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
	}
	
	.btn-primary { background: #0d6efd; color: white; }
	.btn-secondary { background: #6c757d; color: white; }
	.btn-success { background: #198754; color: white; }
	.btn-info { background: #0dcaf0; color: black; }
	.btn:hover { opacity: 0.9; transform: translateY(-1px); }
	.btn:disabled { opacity: 0.6; cursor: not-allowed; }
	
	.ai-processing {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #0d6efd;
	}
	
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #e9ecef;
		border-top: 2px solid #0d6efd;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.editor-container {
		position: relative;
		background: white;
		border-radius: 8px;
		border: 1px solid #e9ecef;
		overflow: hidden;
	}
	
	.editor {
		min-height: 600px;
		padding: 2rem;
		font-family: 'Times New Roman', serif;
		font-size: 14px;
		line-height: 1.6;
		outline: none;
	}
	
	.editor[data-placeholder]:empty::before {
		content: attr(data-placeholder);
		color: #6c757d;
		font-style: italic;
	}
	
	.citation-hover {
		background-color: #e6f3ff;
		padding: 2px 4px;
		border-radius: 3px;
		text-decoration: underline;
		cursor: pointer;
	}
	
	.citation-popup {
		position: absolute;
		background: white;
		border: 1px solid #ccc;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		width: 300px;
		max-height: 400px;
		overflow-y: auto;
		z-index: 1000;
	}
	
	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #e9ecef;
		background: #f8f9fa;
	}
	
	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6c757d;
	}
	
	.citation-search input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		margin: 1rem;
		margin-bottom: 0;
	}
	
	.citation-results {
		max-height: 200px;
		overflow-y: auto;
	}
	
	.citation-item {
		padding: 1rem;
		border-bottom: 1px solid #e9ecef;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.citation-item:hover {
		background-color: #f8f9fa;
	}
	
	.citation-type {
		font-size: 0.8rem;
		color: #6c757d;
		background: #e9ecef;
		padding: 2px 6px;
		border-radius: 12px;
	}
	
	.ai-suggestions {
		position: absolute;
		top: 0;
		right: -320px;
		width: 300px;
		background: white;
		border: 1px solid #ccc;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		max-height: 500px;
		overflow-y: auto;
		z-index: 1000;
	}
	
	.suggestions-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #e9ecef;
		background: #f8f9fa;
	}
	
	.suggestion-item {
		padding: 1rem;
		border-bottom: 1px solid #e9ecef;
	}
	
	.suggestion-type {
		font-size: 0.8rem;
		color: #0d6efd;
		font-weight: bold;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
	}
	
	.suggestion-content {
		font-size: 0.9rem;
		margin-bottom: 1rem;
		line-height: 1.4;
	}
	
	.suggestion-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.confidence {
		font-size: 0.8rem;
		color: #6c757d;
	}
	
	.sidebar {
		background: white;
		border-radius: 8px;
		border: 1px solid #e9ecef;
		padding: 1rem;
		overflow-y: auto;
	}
	
	.citation-library {
		margin-bottom: 2rem;
	}
	
	.sidebar-citation {
		padding: 1rem;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		margin-bottom: 1rem;
	}
	
	.citation-meta {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: #6c757d;
	}
	
	.recent-citations {
		max-height: 200px;
		overflow-y: auto;
	}
	
	.recent-citation {
		padding: 0.5rem;
		cursor: pointer;
		border-radius: 4px;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}
	
	.recent-citation:hover {
		background-color: #f8f9fa;
	}
	
	.notifications {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 2000;
	}
	
	.notification {
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 0.5rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}
	
	.notification-success { background: #d1edff; border: 1px solid #0d6efd; }
	.notification-error { background: #ffebee; border: 1px solid #dc3545; }
	.notification-warning { background: #fff3cd; border: 1px solid #ffc107; }
</style>
