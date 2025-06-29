<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { aiStore, conversation, settings, status } from '$lib/stores/ai-store';
	import AIChatInterface from '$lib/components/ai/AIChatInterface.svelte';
	import type { AIResponse } from '$lib/data/types';
	
	// Page state
	let isPageReady = false;
	let manualTestQuery = 'What are the key elements of a valid contract?';
	let manualTestResponse: any = null;
	let manualTestLoading = false;
	let manualTestError: string | null = null;
	
	// Initialize page
	onMount(async () => {
		if (browser) {
			// Wait for AI store to initialize
			await new Promise(resolve => setTimeout(resolve, 200));
			isPageReady = true;
		}
	});
	
	// Manual API test function (for debugging)
	async function testAPIDirectly() {
		if (!manualTestQuery.trim()) return;
		
		manualTestLoading = true;
		manualTestError = null;
		manualTestResponse = null;
		
		try {
			const res = await fetch('/api/ai/ask', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query: manualTestQuery,
					context: [],
					includeHistory: false,
					maxSources: 3,
					searchThreshold: 0.7,
					useCache: false
				})
			});
			
			const data = await res.json();
			
			if (!res.ok) {
				throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
			}
			
			if (!data.success) {
				throw new Error(data.error || 'API request failed');
			}
			
			manualTestResponse = data.data;
			
		} catch (error) {
			console.error('Manual API test failed:', error);
			manualTestError = error instanceof Error ? error.message : 'Unknown error occurred';
		} finally {
			manualTestLoading = false;
		}
	}

	// Check health endpoints
	async function checkHealthEndpoints() {
		try {
			console.log('🔍 Checking AI health endpoints...');
			
			// Check local AI health
			const localRes = await fetch('/api/ai/health/local');
			const localHealth = await localRes.json();
			console.log('Local AI Health:', localHealth);
			
			// Check cloud AI health  
			const cloudRes = await fetch('/api/ai/health/cloud');
			const cloudHealth = await cloudRes.json();
			console.log('Cloud AI Health:', cloudHealth);
			
		} catch (error) {
			console.error('Health check failed:', error);
		}
	}
	
	// Example queries for quick testing
	const exampleQueries = [
		'What are the key elements of a valid contract?',
		'Explain the difference between civil and criminal law',
		'What is the statute of limitations for personal injury cases?',
		'How does the discovery process work in litigation?',
		'What are the requirements for a valid will?'
	];
</script>

<svelte:head>
	<title>Gemma3 Q4_K_M Integration Test - Legal AI Assistant</title>
	<meta name="description" content="Test page for Gemma3 Q4_K_M GGUF local LLM integration with SvelteKit SSR hydration" />
</svelte:head>

<div class="test-page">
	<header class="page-header">
		<h1>🤖 Gemma3 Q4_K_M Integration Test</h1>
		<p class="subtitle">
			Testing SSR-safe AI store, Ollama service integration, and shared UI components
		</p>
		
		<div class="status-overview">
			<div class="status-item">
				<span class="label">Page Ready:</span>
				<span class="value" class:ready={isPageReady}>{isPageReady ? '✅' : '⏳'}</span>
			</div>
			<div class="status-item">
				<span class="label">AI Initializing:</span>
				<span class="value" class:loading={$status.isInitializing}>{$status.isInitializing ? '⏳' : '✅'}</span>
			</div>
			<div class="status-item">
				<span class="label">Local AI:</span>
				<span class="value" class:ready={$status.localModelAvailable}>{$status.localModelAvailable ? '✅' : '❌'}</span>
			</div>
			<div class="status-item">
				<span class="label">Cloud AI:</span>
				<span class="value" class:ready={$status.cloudModelAvailable}>{$status.cloudModelAvailable ? '✅' : '❌'}</span>
			</div>
		</div>
	</header>

	<main class="test-content">
		{#if !isPageReady}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Initializing test environment...</p>
			</div>
		{:else}
			<!-- Main AI Chat Interface -->
			<section class="chat-section">
				<h2>🗨️ Interactive AI Chat</h2>
				<p class="section-description">
					Test the full AI chat experience with SSR-safe state management and real-time interactions.
				</p>
				
				<div class="chat-container">
					<AIChatInterface 
						placeholder="Ask any legal question..."
						maxHeight="400px"
						showHistory={true}
						autoFocus={false}
						className="test-chat"
					/>
				</div>
				
				<!-- Example Queries -->
				<div class="example-queries">
					<h3>📝 Quick Test Queries</h3>
					<div class="query-grid">
						{#each exampleQueries as query}
							<button 
								type="button"
								class="query-button"
								on:click={() => aiStore.sendMessage(query)}
								disabled={$status.isLoading}
							>
								{query}
							</button>
						{/each}
					</div>
				</div>
			</section>

			<!-- Manual API Testing -->
			<section class="manual-test-section">
				<h2>🔧 Manual API Testing</h2>
				<p class="section-description">
					Direct API endpoint testing for debugging and validation.
				</p>
				
				<div class="manual-test-form">
					<div class="input-group">
						<label for="manual-query">Test Query:</label>
						<textarea
							id="manual-query"
							bind:value={manualTestQuery}
							placeholder="Enter your test query..."
							rows="3"
						></textarea>
					</div>
					
					<div class="test-actions">
						<button 
							type="button"
							class="btn-primary"
							on:click={testAPIDirectly}
							disabled={manualTestLoading}
						>
							{manualTestLoading ? '⏳ Testing...' : '🚀 Test API'}
						</button>
						
						<button 
							type="button"
							class="btn-secondary"
							on:click={checkHealthEndpoints}
						>
							🏥 Check Health
						</button>
					</div>
				</div>
				
				{#if manualTestError}
					<div class="error-display">
						<h4>❌ Error</h4>
						<pre>{manualTestError}</pre>
					</div>
				{/if}
				
				{#if manualTestResponse}
					<div class="response-display">
						<h4>✅ Response</h4>
						<div class="response-details">
							<div class="detail-item">
								<span class="label">Provider:</span>
								<span class="value">{manualTestResponse.provider}</span>
							</div>
							<div class="detail-item">
								<span class="label">Model:</span>
								<span class="value">{manualTestResponse.model}</span>
							</div>
							<div class="detail-item">
								<span class="label">Confidence:</span>
								<span class="value">{Math.round(manualTestResponse.confidence * 100)}%</span>
							</div>
							<div class="detail-item">
								<span class="label">Execution Time:</span>
								<span class="value">{manualTestResponse.executionTime}ms</span>
							</div>
							<div class="detail-item">
								<span class="label">From Cache:</span>
								<span class="value">{manualTestResponse.fromCache ? 'Yes' : 'No'}</span>
							</div>
						</div>
						
						<div class="response-content">
							<h5>Answer:</h5>
							<p>{manualTestResponse.answer}</p>
						</div>
						
						{#if manualTestResponse.sources && manualTestResponse.sources.length > 0}
							<div class="response-sources">
								<h5>Sources ({manualTestResponse.sources.length}):</h5>
								{#each manualTestResponse.sources as source}
									<div class="source-item">
										<div class="source-header">
											<span class="source-title">{source.title}</span>
											<span class="source-score">{Math.round(source.score * 100)}%</span>
										</div>
										<p class="source-content">{source.content}</p>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</section>

			<!-- Store State Debug -->
			<section class="debug-section">
				<h2>🐛 Store State Debug</h2>
				<p class="section-description">
					Real-time view of AI store state for debugging and validation.
				</p>
				
				<div class="debug-grid">
					<div class="debug-card">
						<h4>🔧 Status Store</h4>
						<pre>{JSON.stringify($status, null, 2)}</pre>
					</div>
					
					<div class="debug-card">
						<h4>⚙️ Settings Store</h4>
						<pre>{JSON.stringify($settings, null, 2)}</pre>
					</div>
					
					<div class="debug-card">
						<h4>💬 Conversation Store</h4>
						<div class="conversation-summary">
							<p><strong>ID:</strong> {$conversation.id || 'None'}</p>
							<p><strong>Messages:</strong> {$conversation.messages.length}</p>
							<p><strong>Active:</strong> {$conversation.isActive}</p>
							<p><strong>Last Updated:</strong> {$conversation.lastUpdated ? new Date($conversation.lastUpdated).toLocaleString() : 'Never'}</p>
						</div>
					</div>
				</div>
				
				<div class="debug-actions">
					<button type="button" class="btn-warning" on:click={() => aiStore.clearConversation()}>
						🗑️ Clear Conversation
					</button>
					<button type="button" class="btn-warning" on:click={() => aiStore.reset()}>
						🔄 Reset All Stores
					</button>
					<button type="button" class="btn-secondary" on:click={() => aiStore.initialize()}>
						🔄 Reinitialize AI
					</button>
				</div>
			</section>
		{/if}
	</main>
</div>
			const data = await res.json();
			
			if (data.success) {
				response = data.data;
			} else {
				error = data.error || 'Unknown error occurred';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error occurred';
		} finally {
			isLoading = false;
		}
	}
	
	const sampleQueries = [
		'What are the key elements of a valid contract?',
		'Analyze evidence for negligence in this case',
		'What are the discovery obligations in civil litigation?',
		'Explain the difference between criminal and civil law',
		'What constitutes attorney-client privilege?'
	];
	
	function selectQuery(selectedQuery: string) {
		query = selectedQuery;
	}
</script>

<svelte:head>
	<title>Gemma3 Local LLM Test - Legal AI Assistant</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
	<div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6">
		<h1 class="text-3xl font-bold mb-2">🤖 Gemma3 Local LLM Test</h1>
		<p class="text-blue-100">Test the AI assistant with local Gemma3 inference for legal queries</p>
	</div>
	
	<!-- Sample Queries -->
	<div class="bg-white rounded-lg shadow-md p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4 text-gray-800">📝 Sample Legal Queries</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			{#each sampleQueries as sampleQuery}
				<button
					class="text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
					on:click={() => selectQuery(sampleQuery)}
				>
					<span class="text-sm text-gray-700">{sampleQuery}</span>
				</button>
			{/each}
		</div>
	</div>
	
	<!-- Query Input -->
	<div class="bg-white rounded-lg shadow-md p-6 mb-6">
		<label for="query" class="block text-lg font-semibold mb-3 text-gray-800">
			💬 Ask the Legal AI Assistant
		</label>
		<textarea
			id="query"
			bind:value={query}
			placeholder="Enter your legal question here..."
			class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
			rows="3"
		></textarea>
		
		<button
			on:click={testGemma3}
			disabled={isLoading || !query.trim()}
			class="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
		>
			{#if isLoading}
				<span class="flex items-center">
					<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Processing with Gemma3...
				</span>
			{:else}
				🚀 Ask Gemma3
			{/if}
		</button>
	</div>
	
	<!-- Error Display -->
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error</h3>
					<p class="mt-1 text-sm text-red-700">{error}</p>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Response Display -->
	{#if response}
		<div class="bg-white rounded-lg shadow-md overflow-hidden">
			<!-- Response Header -->
			<div class="bg-green-50 border-b border-green-200 p-4">
				<h2 class="text-xl font-semibold text-green-800 mb-2">✅ AI Response</h2>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div class="bg-white rounded p-2">
						<span class="text-gray-600">Provider:</span>
						<span class="font-semibold ml-1 text-{response.provider === 'local' ? 'green' : response.provider === 'cloud' ? 'blue' : 'yellow'}-600">
							{response.provider === 'local' ? '🏠 Local' : response.provider === 'cloud' ? '☁️ Cloud' : '🔧 Hybrid'}
						</span>
					</div>
					<div class="bg-white rounded p-2">
						<span class="text-gray-600">Model:</span>
						<span class="font-semibold ml-1">{response.model}</span>
					</div>
					<div class="bg-white rounded p-2">
						<span class="text-gray-600">Confidence:</span>
						<span class="font-semibold ml-1">{(response.confidence * 100).toFixed(1)}%</span>
					</div>
					<div class="bg-white rounded p-2">
						<span class="text-gray-600">Time:</span>
						<span class="font-semibold ml-1">{response.executionTime}ms</span>
					</div>
				</div>
			</div>
			
			<!-- Answer -->
			<div class="p-6">
				<h3 class="text-lg font-semibold mb-3 text-gray-800">📋 Answer</h3>
				<div class="prose max-w-none text-gray-700 leading-relaxed">
					{@html response.answer.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
				</div>
			</div>
			
			<!-- Sources -->
			{#if response.sources && response.sources.length > 0}
				<div class="border-t border-gray-200 p-6">
					<h3 class="text-lg font-semibold mb-4 text-gray-800">📚 Sources ({response.sources.length})</h3>
					<div class="space-y-4">
						{#each response.sources as source, index}
							<div class="bg-gray-50 rounded-lg p-4">
								<div class="flex justify-between items-start mb-2">
									<h4 class="font-semibold text-gray-800">{source.title}</h4>
									<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
										{(source.score * 100).toFixed(1)}% match
									</span>
								</div>
								<p class="text-sm text-gray-600 mb-2">{source.content}</p>
								<span class="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
									{source.type}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Instructions -->
	<div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
		<h3 class="text-lg font-semibold text-blue-800 mb-3">🔧 Testing Instructions</h3>
		<ul class="text-blue-700 space-y-2 text-sm">
			<li>• This page tests the Gemma3 local LLM integration</li>
			<li>• Queries are processed using local AI (no data sent to external services)</li>
			<li>• If Gemma3 is not available, the system will fall back to template responses</li>
			<li>• Check the browser console for detailed debug information</li>
			<li>• Use the sample queries above or create your own legal questions</li>
		</ul>
	</div>
</div>

<style>
	.test-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.page-header {
		text-align: center;
		margin-bottom: 40px;
		padding: 24px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 12px;
	}

	.page-header h1 {
		margin: 0 0 8px 0;
		font-size: 2rem;
		font-weight: 700;
	}

	.subtitle {
		margin: 0 0 20px 0;
		opacity: 0.9;
		font-size: 1.1rem;
	}

	.status-overview {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 16px;
		margin-top: 20px;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.status-item .label {
		font-weight: 500;
	}

	.status-item .value {
		font-weight: 600;
	}

	.status-item .value.ready {
		color: #10b981;
	}

	.status-item .value.loading {
		color: #f59e0b;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 60px 20px;
		text-align: center;
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.test-content {
		display: flex;
		flex-direction: column;
		gap: 40px;
	}

	.chat-section,
	.manual-test-section,
	.debug-section {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.chat-section h2,
	.manual-test-section h2,
	.debug-section h2 {
		margin: 0 0 8px 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.section-description {
		margin: 0 0 24px 0;
		color: #6b7280;
		font-size: 0.95rem;
	}

	.chat-container {
		margin-bottom: 32px;
	}

	.example-queries {
		margin-top: 24px;
	}

	.example-queries h3 {
		margin: 0 0 16px 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
	}

	.query-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 12px;
	}

	.query-button {
		padding: 12px 16px;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #374151;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.query-button:hover:not(:disabled) {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	.query-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.manual-test-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-bottom: 24px;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.input-group label {
		font-weight: 500;
		color: #374151;
	}

	.input-group textarea {
		padding: 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.875rem;
		resize: vertical;
	}

	.input-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.test-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.btn-primary,
	.btn-secondary,
	.btn-warning {
		padding: 10px 20px;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-secondary {
		background: #6b7280;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #4b5563;
	}

	.btn-warning {
		background: #ef4444;
		color: white;
	}

	.btn-warning:hover:not(:disabled) {
		background: #dc2626;
	}

	.btn-primary:disabled,
	.btn-secondary:disabled,
	.btn-warning:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-display,
	.response-display {
		margin-top: 20px;
		padding: 16px;
		border-radius: 6px;
	}

	.error-display {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}

	.response-display {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.error-display h4,
	.response-display h4 {
		margin: 0 0 12px 0;
		font-size: 1rem;
	}

	.error-display pre {
		background: rgba(0, 0, 0, 0.05);
		padding: 8px;
		border-radius: 4px;
		font-size: 0.8125rem;
		overflow-x: auto;
	}

	.response-details {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 8px;
		margin-bottom: 16px;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		padding: 6px 8px;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 4px;
		font-size: 0.8125rem;
	}

	.detail-item .label {
		font-weight: 500;
	}

	.response-content,
	.response-sources {
		margin-top: 16px;
	}

	.response-content h5,
	.response-sources h5 {
		margin: 0 0 8px 0;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.source-item {
		margin: 8px 0;
		padding: 8px;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 4px;
		font-size: 0.8125rem;
	}

	.source-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 4px;
		font-weight: 500;
	}

	.debug-section {
		background: #f9fafb;
	}

	.debug-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
		margin-bottom: 24px;
	}

	.debug-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 16px;
	}

	.debug-card h4 {
		margin: 0 0 12px 0;
		font-size: 1rem;
		color: #374151;
	}

	.debug-card pre {
		background: #f3f4f6;
		padding: 12px;
		border-radius: 4px;
		font-size: 0.75rem;
		overflow-x: auto;
		max-height: 200px;
		overflow-y: auto;
	}

	.conversation-summary {
		font-size: 0.875rem;
	}

	.conversation-summary p {
		margin: 4px 0;
	}

	.debug-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.prose {
		white-space: pre-wrap;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.test-page {
			background: #0f172a;
			color: #f8fafc;
		}

		.chat-section,
		.manual-test-section,
		.debug-section {
			background: #1e293b;
			border-color: #334155;
		}

		.debug-section {
			background: #0f172a;
		}

		.debug-card {
			background: #1e293b;
			border-color: #334155;
		}

		.input-group textarea {
			background: #1e293b;
			border-color: #334155;
			color: #f8fafc;
		}

		.query-button {
			background: #334155;
			border-color: #475569;
			color: #e2e8f0;
		}

		.query-button:hover:not(:disabled) {
			background: #475569;
			border-color: #64748b;
		}
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.test-page {
			padding: 12px;
		}

		.page-header {
			padding: 16px;
		}

		.page-header h1 {
			font-size: 1.5rem;
		}

		.subtitle {
			font-size: 1rem;
		}

		.status-overview {
			grid-template-columns: 1fr 1fr;
			gap: 8px;
		}

		.chat-section,
		.manual-test-section,
		.debug-section {
			padding: 16px;
		}

		.test-actions {
			flex-direction: column;
		}

		.debug-grid {
			grid-template-columns: 1fr;
		}

		.debug-actions {
			flex-direction: column;
		}
	}
</style>
