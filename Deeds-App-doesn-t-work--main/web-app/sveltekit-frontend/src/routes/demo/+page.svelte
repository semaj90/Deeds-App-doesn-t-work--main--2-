<script lang="ts">
	import { onMount } from 'svelte';
	import { enhancedCitationStore } from '../../lib/stores/enhancedCitationStore2.js';
	import ReportBuilder from '../../lib/components/ReportBuilder.svelte';
	
	let demoMode = true;
	let currentCaseId = 'demo-case-001';
	let currentReportId = 'demo-report-001';
	
	// Demo data
	const demoCitations = [
		{
			id: 'citation-1',
			label: 'Miranda v. Arizona (1966)',
			content: 'The Supreme Court held that detained criminal suspects, prior to police questioning, must be informed of their constitutional right to an attorney and against self-incrimination.',
			sourceType: 'case_law',
			url: 'https://supreme.justia.com/cases/federal/us/384/436/',
			tags: ['constitutional-rights', 'criminal-procedure', 'miranda-warning'],
			reportId: currentReportId,
			caseId: currentCaseId,
			createdAt: new Date('2023-01-15').toISOString(),
			updatedAt: new Date('2023-01-15').toISOString()
		},
		{
			id: 'citation-2',
			label: '4th Amendment - Search and Seizure',
			content: 'The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated.',
			sourceType: 'constitutional',
			url: 'https://constitution.congress.gov/constitution/amendment-4/',
			tags: ['constitutional-rights', 'search-seizure', 'evidence'],
			reportId: currentReportId,
			caseId: currentCaseId,
			createdAt: new Date('2023-01-15').toISOString(),
			updatedAt: new Date('2023-01-15').toISOString()
		},
		{
			id: 'citation-3',
			label: 'Brady v. Maryland (1963)',
			content: 'Prosecution must disclose materially exculpatory evidence in its possession to the defense.',
			sourceType: 'case_law',
			url: 'https://supreme.justia.com/cases/federal/us/373/83/',
			tags: ['disclosure', 'exculpatory-evidence', 'brady-material'],
			reportId: currentReportId,
			caseId: currentCaseId,
			createdAt: new Date('2023-01-16').toISOString(),
			updatedAt: new Date('2023-01-16').toISOString()
		}
	];
	
	onMount(async () => {
		// Initialize the citation store with demo data
		await enhancedCitationStore.initialize();
		
		// Add demo citations
		for (const citation of demoCitations) {
			await enhancedCitationStore.addCitation(citation);
		}
		
		// Add a demo notification
		enhancedCitationStore.addNotification({
			type: 'success',
			message: 'Demo data loaded successfully! Try selecting text and adding citations.',
			timestamp: new Date().toISOString()
		});
	});
	
	function toggleDemoMode() {
		demoMode = !demoMode;
	}
</script>

<svelte:head>
	<title>Enhanced Legal Citation System - Demo</title>
	<meta name="description" content="AI-powered legal report builder with intelligent citation management" />
</svelte:head>

<div class="demo-container">
	<div class="demo-header">
		<h1>🏛️ Enhanced Legal Citation System</h1>
		<p class="subtitle">AI-Powered Report Builder with Intelligent Citation Management</p>
		
		<div class="demo-controls">
			<button class="btn btn-outline" on:click={toggleDemoMode}>
				{demoMode ? '📝 Switch to Production Mode' : '🎮 Switch to Demo Mode'}
			</button>
		</div>
		
		<div class="feature-highlights">
			<div class="feature">
				<span class="feature-icon">🤖</span>
				<span>AI-Powered Suggestions</span>
			</div>
			<div class="feature">
				<span class="feature-icon">🔍</span>
				<span>Semantic Search</span>
			</div>
			<div class="feature">
				<span class="feature-icon">📚</span>
				<span>Citation Management</span>
			</div>
			<div class="feature">
				<span class="feature-icon">📄</span>
				<span>PDF Export</span>
			</div>
			<div class="feature">
				<span class="feature-icon">⚡</span>
				<span>Real-time Sync</span>
			</div>
		</div>
	</div>
	
	{#if demoMode}
		<div class="demo-instructions">
			<h3>🎯 How to Use This Demo</h3>
			<ol>
				<li><strong>Text Selection:</strong> Select any text in the editor below to see citation options</li>
				<li><strong>AI Help:</strong> Click the "🤖 AI Help" button for intelligent writing assistance</li>
				<li><strong>Citation Search:</strong> Use "📚 Citations" to search and insert legal references</li>
				<li><strong>Keyboard Shortcuts:</strong>
					<ul>
						<li><kbd>Ctrl+Shift+C</kbd> - Quick citation insertion</li>
						<li><kbd>Ctrl+Shift+A</kbd> - AI assistance</li>
						<li><kbd>Ctrl+S</kbd> - Save report</li>
					</ul>
				</li>
				<li><strong>PDF Export:</strong> Click "📄 Export PDF" to generate a formatted legal document</li>
			</ol>
		</div>
	{/if}
	
	<div class="demo-content">
		<ReportBuilder 
			reportId={currentReportId}
			caseId={currentCaseId}
			initialContent={demoMode ? `
				<h2>People v. Defendant - Case Analysis</h2>
				
				<h3>I. Constitutional Issues</h3>
				<p>The defendant's constitutional rights under the Fourth Amendment must be carefully considered in this case. Any evidence obtained through unlawful search and seizure would be inadmissible under the exclusionary rule.</p>
				
				<h3>II. Miranda Rights Compliance</h3>
				<p>The interrogation procedures must be examined to ensure full compliance with Miranda requirements. Select this text to add a Miranda citation.</p>
				
				<h3>III. Evidence Analysis</h3>
				<p>All physical evidence must be properly authenticated and its chain of custody established. The prosecution has a duty to disclose any exculpatory evidence to the defense.</p>
				
				<h3>IV. Legal Precedents</h3>
				<p>Several key Supreme Court decisions are relevant to this case. Try selecting this text and clicking the AI Help button for suggestions on relevant precedents.</p>
				
				<h3>V. Recommended Action</h3>
				<p>Based on the analysis above, I recommend proceeding with the charges while ensuring all constitutional protections are observed.</p>
			` : ''}
		/>
	</div>
	
	{#if demoMode}
		<div class="demo-footer">
			<div class="tech-stack">
				<h4>🛠️ Technology Stack</h4>
				<div class="tech-items">
					<span class="tech-item">SvelteKit</span>
					<span class="tech-item">XState</span>
					<span class="tech-item">TypeScript</span>
					<span class="tech-item">Playwright</span>
					<span class="tech-item">Fuse.js</span>
					<span class="tech-item">LokiJS</span>
					<span class="tech-item">Legal-BERT (AI)</span>
				</div>
			</div>
			
			<div class="feature-list">
				<h4>✨ Key Features</h4>
				<ul>
					<li>AI-powered writing assistance with Legal-BERT integration</li>
					<li>Intelligent citation suggestions based on context</li>
					<li>Real-time semantic search across legal databases</li>
					<li>Drag-and-drop evidence management with image analysis</li>
					<li>Professional PDF export with proper legal formatting</li>
					<li>Offline-first architecture with background sync</li>
					<li>State machine-driven workflow management</li>
					<li>Citation hover previews and quick access</li>
				</ul>
			</div>
		</div>
	{/if}
</div>

<style>
	.demo-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	}
	
	.demo-header {
		background: white;
		padding: 2rem;
		border-bottom: 1px solid #dee2e6;
		text-align: center;
	}
	
	.demo-header h1 {
		margin: 0 0 0.5rem 0;
		color: #212529;
		font-size: 2.5rem;
		font-weight: 700;
	}
	
	.subtitle {
		color: #6c757d;
		font-size: 1.2rem;
		margin: 0 0 2rem 0;
	}
	
	.demo-controls {
		margin-bottom: 2rem;
	}
	
	.btn {
		padding: 0.75rem 1.5rem;
		border: 2px solid #0d6efd;
		border-radius: 8px;
		background: transparent;
		color: #0d6efd;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.3s ease;
		text-decoration: none;
		display: inline-block;
	}
	
	.btn:hover {
		background: #0d6efd;
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
	}
	
	.feature-highlights {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap;
		margin-top: 2rem;
	}
	
	.feature {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 25px;
		font-weight: 500;
		color: #495057;
	}
	
	.feature-icon {
		font-size: 1rem;
	}
	
	.demo-instructions {
		background: #e3f2fd;
		border: 1px solid #1976d2;
		border-radius: 8px;
		padding: 1.5rem;
		margin: 1rem;
		margin-bottom: 0;
	}
	
	.demo-instructions h3 {
		color: #1976d2;
		margin-top: 0;
	}
	
	.demo-instructions ol {
		margin: 1rem 0;
	}
	
	.demo-instructions li {
		margin-bottom: 0.5rem;
	}
	
	.demo-instructions ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}
	
	kbd {
		background: #343a40;
		color: white;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 0.9em;
		font-family: monospace;
	}
	
	.demo-content {
		margin: 1rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}
	
	.demo-footer {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		padding: 2rem;
		background: white;
		margin: 1rem;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}
	
	.tech-stack h4,
	.feature-list h4 {
		color: #212529;
		margin-top: 0;
		margin-bottom: 1rem;
	}
	
	.tech-items {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.tech-item {
		background: #0d6efd;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 15px;
		font-size: 0.9rem;
		font-weight: 500;
	}
	
	.feature-list ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	
	.feature-list li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #f8f9fa;
		color: #6c757d;
	}
	
	.feature-list li:last-child {
		border-bottom: none;
	}
	
	@media (max-width: 768px) {
		.demo-header h1 {
			font-size: 2rem;
		}
		
		.feature-highlights {
			gap: 1rem;
		}
		
		.feature {
			font-size: 0.9rem;
		}
		
		.demo-footer {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		
		.demo-content {
			margin: 0.5rem;
		}
	}
</style>
