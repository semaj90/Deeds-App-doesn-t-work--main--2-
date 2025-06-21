<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Case, Book } from '$lib/data/types';
	
	let caseData: any = null;
	let loading = true;
	let error = '';
	let userSession: any = null;
	let canEdit = false;
	
	const caseId = $page.params.id;
	
	onMount(async () => {
		await loadUserSession();
		await loadCase();
	});
	
	async function loadUserSession() {
		try {
			const response = await fetch('/api/auth/session');
			if (response.ok) {
				userSession = await response.json();
				canEdit = !!userSession?.user;
			}
		} catch (e) {
			console.error('Failed to load user session:', e);
		}
	}
	
	async function loadCase() {
		if (!caseId) {
			error = 'Invalid case ID';
			loading = false;
			return;
		}
		
		try {
			const response = await fetch(`/api/cases/${caseId}`);
			
			if (response.status === 404) {
				error = 'Case not found';
			} else if (response.status === 403) {
				error = 'Access denied - insufficient permissions';
			} else if (!response.ok) {
				error = `Failed to load case (${response.status})`;
			} else {
				const result = await response.json();
				if (result.success && result.case) {
					caseData = result.case;
				} else {
					error = 'Case data not available';
				}
			}
		} catch (e) {
			console.error('Error loading case:', e);
			error = 'Network error - please try again';
		} finally {
			loading = false;
		}
	}
	
	function handleBack() {
		goto('/cases');
	}
	
	function handleEdit() {
		if (canEdit && caseData) {
			goto(`/cases/${caseId}/edit`);
		}
	}
</script>

<svelte:head>
	<title>{caseData?.title || 'Case Details'} - Legal AI CMS</title>
</svelte:head>

<div class="container mx-auto p-6 min-h-screen">
	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="flex flex-col items-center space-y-4">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				<p class="text-gray-600">Loading case details...</p>
			</div>
		</div>
	
	{:else if error}
		<div class="max-w-2xl mx-auto">
			<div class="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
				<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
					<svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				<h2 class="text-xl font-semibold text-red-800 mb-2">Nothing to see here</h2>
				<p class="text-red-700 mb-6">{error}</p>
				<div class="space-x-4">
					<button 
						on:click={handleBack}
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
