<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let caseData: any = null;
	let loading = true;
	let error = '';
	
	const caseId = $page.params.id;
	
	onMount(async () => {
		try {
			const response = await fetch(`/api/cases/${caseId}`);
			if (response.ok) {
				caseData = await response.json();
			} else {
				error = 'Case not found';
			}
		} catch (e) {
			error = 'Failed to load case';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Case Details - Legal AI CMS</title>
</svelte:head>

<div class="container mx-auto p-6">
	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
		</div>
	{:else if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
			<p>{error}</p>
		</div>
	{:else if caseData}
		<div class="bg-white shadow-lg rounded-lg p-6">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">{caseData.title}</h1>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<div>
					<h2 class="text-xl font-semibold text-gray-800 mb-2">Case Information</h2>
					<div class="space-y-2">
						<p><span class="font-medium">Case ID:</span> {caseData.id}</p>
						<p><span class="font-medium">Status:</span> {caseData.status || 'Active'}</p>
						<p><span class="font-medium">Created:</span> {new Date(caseData.created_at).toLocaleDateString()}</p>
						{#if caseData.updated_at}
							<p><span class="font-medium">Updated:</span> {new Date(caseData.updated_at).toLocaleDateString()}</p>
						{/if}
					</div>
				</div>
				
				{#if caseData.client_name}
					<div>
						<h2 class="text-xl font-semibold text-gray-800 mb-2">Client Information</h2>
						<p><span class="font-medium">Client:</span> {caseData.client_name}</p>
					</div>
				{/if}
			</div>
			
			{#if caseData.description}
				<div class="mb-6">
					<h2 class="text-xl font-semibold text-gray-800 mb-2">Description</h2>
					<div class="bg-gray-50 p-4 rounded-lg">
						<p class="whitespace-pre-wrap">{caseData.description}</p>
					</div>
				</div>
			{/if}
			
			{#if caseData.content}
				<div class="mb-6">
					<h2 class="text-xl font-semibold text-gray-800 mb-2">Case Content</h2>
					<div class="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
						<p class="whitespace-pre-wrap">{caseData.content}</p>
					</div>
				</div>
			{/if}
			
			<div class="flex space-x-4">
				<a 
					href="/cases" 
					class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
				>
					← Back to Cases
				</a>
				<button 
					class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
					on:click={() => window.location.href = `/cases/${caseId}/edit`}
				>
					Edit Case
				</button>
			</div>
		</div>
	{:else}
		<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
			<p>No case data available</p>
		</div>
	{/if}
</div>
