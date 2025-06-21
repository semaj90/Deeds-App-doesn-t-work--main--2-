<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	// Props
	export let caseId: string;
	export let evidenceIds: string[] = [];
	export let statuteIds: string[] = [];

	// Component state
	let isLoading = false;
	let errorMessage = '';
	let analysisResults: Record<string, any> | null = null;
	let showRawOutput = false; // Toggle for raw vs. parsed JSON
	let analysisType = 'comprehensive';

	// Reactive statements for dynamic UI updates
	$: hasResults = analysisResults && Object.keys(analysisResults).length > 0;
	$: isAnalysisDisabled = isLoading || !caseId;

	async function performDeepAnalysis() {
		if (!caseId) {
			errorMessage = 'Case ID is required';
			return;
		}

		isLoading = true;
		errorMessage = '';
		analysisResults = null;

		try {
			const response = await fetch(`/api/cases/${caseId}/deep-analysis`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					evidenceIds,
					statuteIds,
					analysisType
				})
			});

			if (!response.ok) {
				throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			analysisResults = data.results;
		} catch (error) {
			console.error('Deep analysis error:', error);
			errorMessage = error instanceof Error ? error.message : 'Analysis failed';
		} finally {
			isLoading = false;
		}
	}

	function getSourceName(key: string): string {
		const names: Record<string, string> = {
			local_llm: "The Firm's AI (Local)",
			openai: 'OpenAI (GPT-4)',
			gemini: 'Google Gemini'
		};
		return names[key] || 'Unknown Source';
	}

	function getSourceIcon(key: string): string {
		const icons: Record<string, string> = {
			local_llm: '🏢',
			openai: '🤖',
			gemini: '✨'
		};
		return icons[key] || '🔍';
	}

	// Helper to render JSON nicely
	function formatJson(data: any): string {
		try {
			// If it's already an object, stringify it with indentation
			if (typeof data === 'object' && data !== null) {
				return JSON.stringify(data, null, 2);
			}
			// Otherwise, return as is (might be a raw string from external LLM)
			return String(data);
		} catch { 
			return String(data); 
		}
	}

	function formatProcessingTime(seconds: number): string {
		if (seconds < 1) {
			return `${Math.round(seconds * 1000)}ms`;
		}
		return `${seconds.toFixed(2)}s`;
	}

	onMount(() => {
		// Auto-trigger analysis if we have a caseId
		if (caseId) {
			// Optional: auto-run analysis on mount
			// performDeepAnalysis();
		}
	});
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title text-2xl mb-4">
			🔍 Deep Legal Analysis
			<div class="badge badge-secondary">Multi-LLM</div>
		</h2>

		<!-- Configuration Section -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
			<div class="form-control">
				<label class="label" for="analysis-type">
					<span class="label-text">Analysis Type</span>
				</label>
				<select id="analysis-type" class="select select-bordered" bind:value={analysisType}>
					<option value="comprehensive">Comprehensive Analysis</option>
					<option value="evidence-focused">Evidence-Focused</option>
					<option value="statute-compliance">Statute Compliance</option>
					<option value="case-strength">Case Strength Assessment</option>
				</select>
			</div>			<div class="form-control">
				<label class="label cursor-pointer">
					<span class="label-text">Show Raw JSON Output (Local LLM)</span>
					<input 
						id="showRawOutput"
						type="checkbox" 
						bind:checked={showRawOutput}
						class="toggle toggle-secondary" 
					/>
				</label>
			</div>
		</div>

		<!-- Analysis Trigger -->
		<div class="card-actions justify-end mb-4">
			<button 
				class="btn btn-primary btn-lg" 
				on:click={performDeepAnalysis} 
				disabled={isAnalysisDisabled}
			>
				{#if isLoading}
					<span class="loading loading-spinner"></span>
					Analyzing...
				{:else}
					🚀 Start Deep Analysis
				{/if}
			</button>
		</div>

		<!-- Error Display -->
		{#if errorMessage}
			<div class="alert alert-error mb-4" transition:slide>
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>{errorMessage}</span>
			</div>
		{/if}

		<!-- Results Display -->
		{#if hasResults}			<div class="mt-6 space-y-4" transition:fade>
				<h3 class="text-lg font-bold flex items-center">
					📊 Analysis Results
					<div class="badge badge-success ml-2">
						{analysisResults ? Object.keys(analysisResults).length : 0} LLM{(analysisResults && Object.keys(analysisResults).length > 1) ? 's' : ''}
					</div>
				</h3>

				{#each analysisResults ? Object.entries(analysisResults) : [] as [key, result]}
					<div class="collapse collapse-arrow bg-base-200" class:collapse-open={key === 'local_llm'}>
						<input type="checkbox" checked={key === 'local_llm'} />
						<div class="collapse-title text-md font-medium flex items-center justify-between">
							<span>
								{getSourceIcon(key)} {getSourceName(key)}
							</span>
							<div class="flex items-center space-x-2">
								{#if result.tokens_used}
									<div class="badge badge-outline">
										{result.tokens_used} tokens
									</div>
								{/if}
								{#if result.processing_time}
									<div class="badge badge-outline">
										{formatProcessingTime(result.processing_time)}
									</div>
								{/if}
								{#if result.grammar_used}
									<div class="badge badge-success">
										Structured JSON
									</div>
								{/if}
							</div>
						</div>
						<div class="collapse-content">
							{#if result.error}
								<div class="alert alert-warning">
									<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.876c1.38 0 2.5-1.12 2.5-2.5 0-.394-.094-.788-.276-1.154l-6.938-13.876c-.374-.748-1.45-.748-1.824 0l-6.938 13.876c-.182.366-.276.76-.276 1.154 0 1.38 1.12 2.5 2.5 2.5z" />
									</svg>
									<span>Error: {result.error}</span>
								</div>
							{:else if key === 'local_llm' && result.structured_response && !showRawOutput}
								<!-- Display structured JSON for local LLM -->
								<div class="space-y-4">
									{#if result.structured_response.analysis}
										<div>
											<h4 class="text-md font-semibold mb-2">📝 Analysis</h4>
											<div class="bg-base-300 p-4 rounded-md">
												<p class="text-sm whitespace-pre-wrap">{result.structured_response.analysis}</p>
											</div>
										</div>
									{/if}
									
									{#if result.structured_response.key_findings}
										<div>
											<h4 class="text-md font-semibold mb-2">🔍 Key Findings</h4>
											<ul class="list-disc list-inside space-y-1">
												{#each result.structured_response.key_findings as finding}
													<li class="text-sm">{finding}</li>
												{/each}
											</ul>
										</div>
									{/if}
									
									{#if result.structured_response.recommendations}
										<div>
											<h4 class="text-md font-semibold mb-2">💡 Recommendations</h4>
											<ul class="list-disc list-inside space-y-1">
												{#each result.structured_response.recommendations as rec}
													<li class="text-sm">{rec}</li>
												{/each}
											</ul>
										</div>
									{/if}
									
									{#if result.structured_response.confidence}
										<div>
											<h4 class="text-md font-semibold mb-2">📊 Confidence Level</h4>
											<div class="flex items-center space-x-2">
												<progress 
													class="progress progress-primary w-32" 
													value={result.structured_response.confidence} 
													max="10"
												></progress>
												<span class="text-sm">{result.structured_response.confidence}/10</span>
											</div>
										</div>
									{/if}
								</div>
								
								{#if result.parsing_error}
									<div class="alert alert-warning mt-4">
										<span>JSON parsing warning: {result.parsing_error}</span>
									</div>
								{/if}
							{:else}
								<!-- Display raw text for other LLMs or if showRawOutput is true -->
								<div class="bg-base-300 p-4 rounded-md overflow-auto max-h-96">
									<pre class="text-sm whitespace-pre-wrap">{result.response || formatJson(result)}</pre>
								</div>
								{#if key === 'local_llm'}
									<p class="mt-2 text-sm text-base-content/70">
										{showRawOutput ? 'Raw output from local LLM' : 'Fallback raw text display'}
									</p>
								{/if}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Help Text -->
		{#if !hasResults && !isLoading}
			<div class="alert alert-info mt-4">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				<div>
					<h3 class="font-bold">Multi-LLM Deep Analysis</h3>
					<div class="text-sm">
						This feature uses multiple AI models to provide comprehensive legal analysis:
						<ul class="list-disc list-inside mt-2 space-y-1">
							<li><strong>Local LLM:</strong> Private, structured analysis with GBNF grammar</li>
							<li><strong>OpenAI GPT-4:</strong> Advanced reasoning and case insights</li>
							<li><strong>Google Gemini:</strong> Alternative perspective and validation</li>
						</ul>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Custom styles for better JSON display */
	.collapse-content pre {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		line-height: 1.5;
	}
	
	.badge {
		font-size: 0.75rem;
	}
</style>
