<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import EnhancedReportEditor from '$lib/components/EnhancedReportEditor.svelte';
	import CitationSidebar from '$lib/components/CitationSidebar.svelte';
	import { enhancedCitationStore } from '$lib/stores/enhancedCitationStore';

	let reportId = '';
	let caseId = '';
	let reportContent = '';
	let reportTitle = 'New Legal Report';
	let loading = true;
	let sidebarVisible = true;

	// State management
	let hasUnsavedChanges = false;
	let lastSaveTime: Date | null = null;
	let aiSuggestions: any[] = [];
	let showAISuggestions = false;

	onMount(async () => {
		// Get URL parameters
		const params = new URLSearchParams(window.location.search);
		reportId = params.get('reportId') || crypto.randomUUID();
		caseId = params.get('caseId') || '';

		// Load existing report if reportId exists
		if (reportId && reportId !== 'new') {
			try {
				const response = await fetch(`/api/reports/${reportId}`);
				if (response.ok) {
					const data = await response.json();
					reportContent = data.content || '';
					reportTitle = data.title || 'Legal Report';
					caseId = data.caseId || caseId;
				}
			} catch (error) {
				console.error('Failed to load report:', error);
			}
		}

		// Initialize citation store
		await enhancedCitationStore.loadFromServer();
		
		loading = false;

		// Handle keyboard shortcuts
		window.addEventListener('keydown', handleGlobalKeydown);
		
		return () => {
			window.removeEventListener('keydown', handleGlobalKeydown);
		};
	});

	function handleGlobalKeydown(e: KeyboardEvent) {
		// Ctrl+S or Cmd+S to save
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			saveReport();
		}
		
		// Ctrl+Shift+C to toggle citation sidebar
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
			e.preventDefault();
			sidebarVisible = !sidebarVisible;
		}

		// Ctrl+Shift+A for AI assistance
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
			e.preventDefault();
			triggerAIAssistance();
		}
	}

	async function saveReport() {
		try {
			const response = await fetch(`/api/reports/${reportId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: reportTitle,
					content: reportContent,
					caseId: caseId
				})
			});

			if (response.ok) {
				hasUnsavedChanges = false;
				lastSaveTime = new Date();
				
				// Show success notification
				showNotification('Report saved successfully', 'success');
			} else {
				throw new Error('Save failed');
			}
		} catch (error) {
			console.error('Failed to save report:', error);
			showNotification('Failed to save report', 'error');
		}
	}

	async function triggerAIAssistance() {
		try {
			showAISuggestions = true;
			
			const response = await fetch('/api/ai/legal-bert', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					text: reportContent,
					context: { caseId, reportId }
				})
			});

			if (response.ok) {
				const data = await response.json();
				aiSuggestions = [data.analysis];
				showNotification('AI analysis generated', 'success');
			} else {
				throw new Error('AI request failed');
			}
		} catch (error) {
			console.error('AI assistance failed:', error);
			showNotification('AI assistance failed', 'error');
			showAISuggestions = false;
		}
	}

	async function exportToPDF() {
		try {
			// First save the current state
			await saveReport();
			
			// Then request PDF export
			const response = await fetch(`/api/export/pdf?reportId=${reportId}`, {
				method: 'GET'
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
				
				showNotification('PDF exported successfully', 'success');
			} else {
				throw new Error('PDF export failed');
			}
		} catch (error) {
			console.error('PDF export failed:', error);
			showNotification('PDF export failed', 'error');
		}
	}

	function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
		// This would integrate with a notification system
		console.log(`${type.toUpperCase()}: ${message}`);
	}

	function handleReportUpdate(event: CustomEvent) {
		reportContent = event.detail;
		hasUnsavedChanges = true;
	}

	function handleCitationInsert(event: CustomEvent) {
		const citation = event.detail;
		// This would be handled by the editor component
		console.log('Citation inserted:', citation);
	}

	function toggleSidebar() {
		sidebarVisible = !sidebarVisible;
	}

	// Auto-save every 30 seconds if there are unsaved changes
	setInterval(() => {
		if (hasUnsavedChanges) {
			saveReport();
		}
	}, 30000);
</script>

<svelte:head>
	<title>{reportTitle} - Legal Report Builder</title>
</svelte:head>

{#if loading}
	<div class="loading-screen">
		<div class="loading-spinner"></div>
		<p>Loading report...</p>
	</div>
{:else}
	<div class="report-builder">
		<!-- Header -->
		<header class="report-header">
			<div class="header-left">
				<input
					type="text"
					bind:value={reportTitle}
					class="title-input"
					placeholder="Report Title"
					on:input={() => hasUnsavedChanges = true}
				/>
				{#if hasUnsavedChanges}
					<span class="unsaved-indicator">● Unsaved changes</span>
				{:else if lastSaveTime}
					<span class="save-status">
						✓ Saved at {lastSaveTime.toLocaleTimeString()}
					</span>
				{/if}
			</div>
			
			<div class="header-actions">
				<button class="header-btn" on:click={toggleSidebar} title="Toggle Citations (Ctrl+Shift+C)">
					{sidebarVisible ? '◀' : '▶'} Citations
				</button>
				<button class="header-btn ai-btn" on:click={triggerAIAssistance} title="AI Assistance (Ctrl+Shift+A)">
					🤖 AI Assist
				</button>
				<button class="header-btn save-btn" on:click={saveReport} title="Save Report (Ctrl+S)">
					💾 Save
				</button>
				<button class="header-btn export-btn" on:click={exportToPDF} title="Export to PDF">
					📄 Export PDF
				</button>
			</div>
		</header>

		<!-- Main Content -->
		<main class="report-main">
			{#if sidebarVisible}
				<CitationSidebar {caseId} {reportId} on:insert-citation={handleCitationInsert} />
			{/if}
			
			<div class="editor-section">
				<EnhancedReportEditor
					bind:content={reportContent}
					{reportId}
					{caseId}
					on:update={handleReportUpdate}
				/>
			</div>
		</main>

		<!-- AI Suggestions Panel -->
		{#if showAISuggestions && aiSuggestions.length > 0}
			<aside class="ai-suggestions-panel">
				<div class="panel-header">
					<h3>AI Suggestions</h3>
					<button class="close-btn" on:click={() => showAISuggestions = false}>×</button>
				</div>
				
				{#each aiSuggestions as suggestion}
					<div class="suggestion-card">
						<h4>Legal Analysis</h4>
						<p class="suggestion-summary">{suggestion.summary}</p>
						
						{#if suggestion.relevantStatutes}
							<div class="statutes-section">
								<h5>Relevant Statutes:</h5>
								<ul>
									{#each suggestion.relevantStatutes as statute}
										<li>{statute}</li>
									{/each}
								</ul>
							</div>
						{/if}
						
						{#if suggestion.recommendations}
							<div class="recommendations-section">
								<h5>Recommendations:</h5>
								<ul>
									{#each suggestion.recommendations as rec}
										<li>{rec}</li>
									{/each}
								</ul>
							</div>
						{/if}
						
						<div class="suggestion-meta">
							<span class="confidence">Confidence: {Math.round(suggestion.confidence * 100)}%</span>
							<span class="evidence-type">Type: {suggestion.evidenceType}</span>
							<span class="significance">Significance: {Math.round(suggestion.significance * 100)}%</span>
						</div>
					</div>
				{/each}
			</aside>
		{/if}
	</div>
{/if}

<style>
	.loading-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background: #f8f9fa;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e9ecef;
		border-left: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.report-builder {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f8f9fa;
	}

	.report-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		background: white;
		border-bottom: 1px solid #ddd;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.title-input {
		font-size: 18px;
		font-weight: bold;
		border: none;
		background: transparent;
		padding: 8px;
		border-bottom: 2px solid transparent;
		transition: border-color 0.2s;
		min-width: 300px;
	}

	.title-input:focus {
		outline: none;
		border-bottom-color: #007bff;
	}

	.unsaved-indicator {
		color: #ffc107;
		font-size: 14px;
		font-weight: 500;
	}

	.save-status {
		color: #28a745;
		font-size: 14px;
	}

	.header-actions {
		display: flex;
		gap: 8px;
	}

	.header-btn {
		padding: 8px 16px;
		border: 1px solid #ccc;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s;
	}

	.header-btn:hover {
		background: #f8f9fa;
	}

	.ai-btn {
		background: #e3f2fd !important;
		border-color: #007bff !important;
		color: #0d47a1 !important;
	}

	.save-btn {
		background: #e8f5e8 !important;
		border-color: #28a745 !important;
		color: #155724 !important;
	}

	.export-btn {
		background: #fff3cd !important;
		border-color: #ffc107 !important;
		color: #856404 !important;
	}

	.report-main {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.editor-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: white;
		margin: 16px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		overflow: hidden;
	}

	.ai-suggestions-panel {
		position: fixed;
		top: 80px;
		right: 16px;
		width: 350px;
		max-height: 70vh;
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		box-shadow: 0 4px 16px rgba(0,0,0,0.15);
		overflow-y: auto;
		z-index: 1000;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		border-bottom: 1px solid #eee;
		background: #f8f9fa;
	}

	.panel-header h3 {
		margin: 0;
		font-size: 16px;
		color: #333;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 20px;
		cursor: pointer;
		color: #666;
		padding: 0;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: #e9ecef;
	}

	.suggestion-card {
		padding: 16px;
		border-bottom: 1px solid #eee;
	}

	.suggestion-card:last-child {
		border-bottom: none;
	}

	.suggestion-card h4 {
		margin: 0 0 8px 0;
		font-size: 14px;
		color: #007bff;
	}

	.suggestion-summary {
		font-size: 13px;
		line-height: 1.4;
		color: #333;
		margin-bottom: 12px;
	}

	.statutes-section,
	.recommendations-section {
		margin-bottom: 12px;
	}

	.statutes-section h5,
	.recommendations-section h5 {
		margin: 0 0 6px 0;
		font-size: 12px;
		color: #666;
		text-transform: uppercase;
		font-weight: 600;
	}

	.statutes-section ul,
	.recommendations-section ul {
		margin: 0;
		padding-left: 16px;
	}

	.statutes-section li,
	.recommendations-section li {
		font-size: 12px;
		line-height: 1.3;
		margin-bottom: 4px;
	}

	.suggestion-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		font-size: 11px;
		color: #666;
	}

	.suggestion-meta span {
		background: #f8f9fa;
		padding: 2px 6px;
		border-radius: 10px;
	}

	.confidence {
		background: #e3f2fd !important;
		color: #0d47a1 !important;
	}

	.evidence-type {
		background: #f3e5f5 !important;
		color: #4a148c !important;
	}

	.significance {
		background: #e8f5e8 !important;
		color: #1b5e20 !important;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.report-header {
			flex-direction: column;
			gap: 12px;
			align-items: stretch;
		}

		.header-left,
		.header-actions {
			justify-content: center;
		}

		.title-input {
			min-width: auto;
			text-align: center;
		}

		.ai-suggestions-panel {
			position: fixed;
			top: 0;
			right: 0;
			left: 0;
			width: auto;
			max-height: 100vh;
			border-radius: 0;
		}
	}
</style>
