<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	
	export let data: PageData;
	
	const caseDetails = data.caseDetails;
	const user = data.session?.user;
	const canEdit = !!user;
	
	function handleBack() {
		goto('/cases');
	}
	
	function handleEdit() {
		if (canEdit && caseDetails) {
			goto(`/cases/${caseDetails.id}/edit`);
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'open': return 'bg-blue-100 text-blue-800';
			case 'in-progress': return 'bg-yellow-100 text-yellow-800';
			case 'under-review': return 'bg-orange-100 text-orange-800';
			case 'closed': return 'bg-green-100 text-green-800';
			case 'archived': return 'bg-gray-100 text-gray-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getDangerScoreColor(score: number) {
		if (score >= 80) return 'text-red-600 bg-red-100';
		if (score >= 60) return 'text-orange-600 bg-orange-100';
		if (score >= 40) return 'text-yellow-600 bg-yellow-100';
		return 'text-green-600 bg-green-100';
	}
</script>

<svelte:head>
	<title>{caseDetails?.title || 'Case Details'} - WardenNet</title>
</svelte:head>

<div class="case-details-container">
	{#if caseDetails}
		<div class="header-section">
			<button 
				class="back-button" 
				on:click={handleBack}
				type="button"
			>
				← Back to Cases
			</button>
			
			<div class="case-header">
				<div class="case-title-section">
					<h1>{caseDetails.title}</h1>
					<p class="case-number">{caseDetails.caseNumber}</p>
				</div>
				
				{#if canEdit}
					<button 
						class="edit-button"
						on:click={handleEdit}
						type="button"
					>
						Edit Case
					</button>
				{/if}
			</div>
		</div>

		<div class="case-content">
			<div class="case-info-grid">
				<div class="info-card">
					<h3>Status</h3>
					<span class="status-badge {getStatusColor(caseDetails.status)}">
						{caseDetails.status || 'Unknown'}
					</span>
				</div>

				<div class="info-card">
					<h3>Danger Score</h3>
					<div class="danger-score {getDangerScoreColor(caseDetails.dangerScore || 0)}">
						{caseDetails.dangerScore || 0}/100
					</div>
				</div>

				<div class="info-card">
					<h3>Created</h3>
					<p class="date-text">
						{new Date(caseDetails.createdAt).toLocaleDateString()}
					</p>
				</div>

				<div class="info-card">
					<h3>Last Updated</h3>
					<p class="date-text">
						{new Date(caseDetails.updatedAt || caseDetails.createdAt).toLocaleDateString()}
					</p>
				</div>
			</div>

			<div class="description-section">
				<h3>Description</h3>
				<div class="description-content">
					{caseDetails.description || 'No description available.'}
				</div>
			</div>

			{#if caseDetails.aiSummary}
				<div class="ai-summary-section">
					<h3>AI Summary</h3>
					<div class="ai-summary-content">
						{caseDetails.aiSummary}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="error-state">
			<div class="error-icon">⚠️</div>
			<h2>Case Not Found</h2>
			<p>The requested case could not be found or you don't have permission to view it.</p>
			<button class="back-button" on:click={handleBack}>
				← Back to Cases
			</button>
		</div>
	{/if}
</div>

<style>
	.case-details-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header-section {
		margin-bottom: 2rem;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #6b7280;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
		transition: background-color 0.2s;
	}

	.back-button:hover {
		background: #4b5563;
	}

	.case-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.case-title-section h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		line-height: 1.2;
	}

	.case-number {
		font-size: 1.1rem;
		color: #6b7280;
		font-weight: 500;
		margin: 0;
	}

	.edit-button {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.edit-button:hover {
		background: #2563eb;
	}

	.case-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.case-info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.info-card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.info-card h3 {
		font-size: 0.9rem;
		font-weight: 600;
		color: #6b7280;
		margin: 0 0 0.75rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.danger-score {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.date-text {
		font-size: 1rem;
		color: #374151;
		margin: 0;
	}

	.description-section,
	.ai-summary-section {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.description-section h3,
	.ai-summary-section h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}

	.description-content {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #374151;
		white-space: pre-wrap;
	}

	.ai-summary-content {
		font-size: 1rem;
		line-height: 1.6;
		color: #374151;
		background: #f8fafc;
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid #3b82f6;
		white-space: pre-wrap;
	}

	.error-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.error-state h2 {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}

	.error-state p {
		font-size: 1.1rem;
		color: #6b7280;
		margin: 0 0 2rem 0;
	}

	@media (max-width: 768px) {
		.case-details-container {
			padding: 1rem;
		}

		.case-header {
			flex-direction: column;
			align-items: stretch;
			text-align: center;
		}

		.case-title-section h1 {
			font-size: 2rem;
		}

		.case-info-grid {
			grid-template-columns: 1fr;
		}

		.edit-button {
			width: 100%;
		}
	}
</style>
						class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors"
					>
						← Back to Cases
					</button>
					<button 
						on:click={loadCase}
						class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		</div>
	
	{:else if caseData}
		<div class="max-w-4xl mx-auto">
			<!-- Header Navigation -->
			<nav class="flex items-center space-x-2 text-sm text-gray-600 mb-6">
				<button on:click={handleBack} class="hover:text-blue-600 transition-colors">Cases</button>
				<span>›</span>
				<span class="font-medium text-gray-900">Case Details</span>
			</nav>
			
			<!-- Case Header -->
			<div class="bg-white shadow-lg rounded-lg p-6 mb-6">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<h1 class="text-3xl font-bold text-gray-900 mb-2">{caseData.title}</h1>
						<div class="flex items-center space-x-4">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
								{caseData.status === 'active' ? 'bg-green-100 text-green-800' : 
								 caseData.status === 'closed' ? 'bg-gray-100 text-gray-800' : 
								 caseData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
								 'bg-blue-100 text-blue-800'}">
								{caseData.status || 'Active'}
							</span>
							<span class="text-sm text-gray-500">ID: {caseData.id}</span>
							{#if caseData.created_at}
								<span class="text-sm text-gray-500">
									Created: {new Date(caseData.created_at).toLocaleDateString()}
								</span>
							{/if}
						</div>
					</div>
					
					{#if canEdit}
						<button 
							on:click={handleEdit}
							class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
							<span>Edit Case</span>
						</button>
					{/if}
				</div>
			</div>
			
			<!-- Case Content -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Main Content -->
				<div class="lg:col-span-2 space-y-6">
					{#if caseData.description}
						<div class="bg-white shadow-lg rounded-lg p-6">
							<h2 class="text-xl font-semibold text-gray-800 mb-4">Description</h2>
							<div class="prose max-w-none">
								<p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{caseData.description}</p>
							</div>
						</div>
					{/if}
					
					{#if caseData.content}
						<div class="bg-white shadow-lg rounded-lg p-6">
							<h2 class="text-xl font-semibold text-gray-800 mb-4">Case Content</h2>
							<div class="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
								<p class="text-gray-700 whitespace-pre-wrap">{caseData.content}</p>
							</div>
						</div>
					{/if}
					
					{#if caseData.books && caseData.books.length > 0}
						<div class="bg-white shadow-lg rounded-lg p-6">
							<h2 class="text-xl font-semibold text-gray-800 mb-4">Case Books</h2>
							<div class="mt-3">
								<ul class="list-group list-group-flush mb-2">
									{#each caseData.books as book}
										<li class="list-group-item px-0 py-1">
											<strong>{book.title}</strong>{book.author ? ` by ${book.author}` : ''}
											{#if book.publishedAt}
												<span class="text-muted small ms-2">({book.publishedAt})</span>
											{/if}
											{#if book.description}
												<div class="small text-muted">{book.description}</div>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						</div>
					{:else}
						<div class="bg-white shadow-lg rounded-lg p-6">
							<h2 class="text-xl font-semibold text-gray-800 mb-4">Case Books</h2>
							<div class="text-muted small">No books linked.</div>
						</div>
					{/if}
				</div>
				
				<!-- Sidebar -->
				<div class="space-y-6">
					<!-- Case Information -->
					<div class="bg-white shadow-lg rounded-lg p-6">
						<h3 class="text-lg font-semibold text-gray-800 mb-4">Case Information</h3>
						<div class="space-y-3">
							{#if caseData.client_name}
								<div>
									<span class="text-sm font-medium text-gray-600">Client:</span>
									<p class="text-gray-900">{caseData.client_name}</p>
								</div>
							{/if}
							
							{#if caseData.case_type}
								<div>
									<span class="text-sm font-medium text-gray-600">Type:</span>
									<p class="text-gray-900">{caseData.case_type}</p>
								</div>
							{/if}
							
							{#if caseData.priority}
								<div>
									<span class="text-sm font-medium text-gray-600">Priority:</span>
									<p class="text-gray-900">{caseData.priority}</p>
								</div>
							{/if}
							
							{#if caseData.assigned_to}
								<div>
									<span class="text-sm font-medium text-gray-600">Assigned to:</span>
									<p class="text-gray-900">{caseData.assigned_to}</p>
								</div>
							{/if}
							
							{#if caseData.updated_at}
								<div>
									<span class="text-sm font-medium text-gray-600">Last updated:</span>
									<p class="text-gray-900">{new Date(caseData.updated_at).toLocaleDateString()}</p>
								</div>
							{/if}
						</div>
					</div>
					
					<!-- Quick Actions -->
					<div class="bg-white shadow-lg rounded-lg p-6">
						<h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
						<div class="space-y-2">
							<button 
								on:click={handleBack}
								class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors text-left flex items-center space-x-2"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
								</svg>
								<span>Back to Cases</span>
							</button>
							
							{#if canEdit}
								<button 
									on:click={handleEdit}
									class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-left flex items-center space-x-2"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
									<span>Edit Case</span>
								</button>
								
								<button 
									class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors text-left flex items-center space-x-2"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									<span>Export Case</span>
								</button>
							{/if}
						</div>
					</div>
					
					{#if !userSession?.user}
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div class="flex items-start">
								<svg class="h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
								</svg>
								<div>
									<h4 class="text-sm font-medium text-yellow-800">Limited Access</h4>
									<p class="text-sm text-yellow-700 mt-1">
										Please log in to edit cases and access full features.
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
		
	{:else}
		<div class="max-w-2xl mx-auto">
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
				<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
					<svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<h2 class="text-xl font-semibold text-gray-800 mb-2">Nothing to see here</h2>
				<p class="text-gray-600 mb-6">No case data is available for this ID.</p>
				<button 
					on:click={handleBack}
					class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
				>
					← Back to Cases
				</button>
			</div>
		</div>
	{/if}
</div>
