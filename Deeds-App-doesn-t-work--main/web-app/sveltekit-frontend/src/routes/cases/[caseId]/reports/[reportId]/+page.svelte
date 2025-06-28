<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import ReportBuilder from '$lib/components/ReportBuilder.svelte';
	
	// Extract route parameters
	$: caseId = $page.params.caseId || 'default-case';
	$: reportId = $page.params.reportId || `report-${Date.now()}`;
	
	// Page state
	let reportData: any = null;
	let loading = true;
	let error = '';
	
	onMount(async () => {
		try {
			// Load existing report if reportId exists
			if (reportId && reportId !== `report-${Date.now()}`) {
				const response = await fetch(`/api/reports/${reportId}`);
				if (response.ok) {
					reportData = await response.json();
				}
			}
			
			// Initialize empty report if none exists
			if (!reportData) {
				reportData = {
					id: reportId,
					caseId: caseId,
					title: 'New Legal Report',
					content: '',
					citations: [],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};
			}
			
		} catch (err) {
			console.error('Failed to load report:', err);
			error = 'Failed to load report data';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Legal Report Builder - Case {caseId}</title>
	<meta name="description" content="AI-powered legal report builder with citation management" />
</svelte:head>

<div class="page-container">
	{#if loading}
		<div class="loading-container">
			<div class="spinner-large"></div>
			<p>Loading report builder...</p>
		</div>
	{:else if error}
		<div class="error-container">
			<h2>Error Loading Report</h2>
			<p>{error}</p>
			<button class="btn btn-primary" on:click={() => window.location.reload()}>
				Try Again
			</button>
		</div>
	{:else if reportData}
		<ReportBuilder 
			reportId={reportData.id}
			caseId={reportData.caseId}
			initialContent={reportData.content || ''}
		/>
	{/if}
</div>

<style>
	.page-container {
		min-height: 100vh;
		background: #f8f9fa;
	}
	
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		gap: 1rem;
	}
	
	.spinner-large {
		width: 48px;
		height: 48px;
		border: 4px solid #e9ecef;
		border-top: 4px solid #0d6efd;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		gap: 1rem;
		text-align: center;
		padding: 2rem;
	}
	
	.error-container h2 {
		color: #dc3545;
		margin: 0;
	}
	
	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
	}
	
	.btn-primary {
		background: #0d6efd;
		color: white;
	}
	
	.btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
</style>
