<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import CanvasEditor from '$lib/components/CanvasEditor.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Header from '$lib/components/Header.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import AIFabButton from '$lib/components/AIFabButton.svelte';
	import FileUploadSection from '$lib/components/FileUploadSection.svelte';
	import { sidebarStore, toolbarStore, canvasStore } from '$lib/stores/canvas';
	import { lokiStore, loki } from '$lib/stores/lokiStore';

	export let data;

	// Case ID - extract from data or generate
	let caseId = data?.reportData?.id || data?.reportId || 'demo-case-' + Date.now();

	// Canvas state
	let canvasElement: HTMLCanvasElement;
	let canvasWidth = 0;
	let canvasHeight = 0;
	let isFullscreen = false;

	// Layout state
	let mainContainer: HTMLElement;
	let sidebarOpen = false;

	onMount(() => {
		// Initialize canvas dimensions
		updateCanvasDimensions();
		window.addEventListener('resize', updateCanvasDimensions);
		
		// Load cached data
		loki.init();
		
		// Subscribe to sidebar state
		const unsubscribeSidebar = sidebarStore.subscribe(state => {
			sidebarOpen = state.open;
		});

		return () => {
			unsubscribeSidebar();
		};
	});

	onDestroy(() => {
		window.removeEventListener('resize', updateCanvasDimensions);
	});

	function updateCanvasDimensions() {
		if (mainContainer) {
			const rect = mainContainer.getBoundingClientRect();
			canvasWidth = rect.width;
			canvasHeight = rect.height;
		}
	}

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
		updateCanvasDimensions();
	}

	// Enhanced file upload state
	let uploadProgress: { [key: string]: number } = {};
	let uploadingFiles: { [key: string]: { name: string; size: number; hash?: string } } = {};
	let completedUploads: { [key: string]: { name: string; hash: string; id: string } } = {};

	// Handle file drops with hash calculation
	async function handleFileDrop(event: DragEvent) {
		event.preventDefault();
		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			await processFileUploads(Array.from(files));
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	// Process multiple file uploads with hash calculation
	async function processFileUploads(files: File[]) {
		for (const file of files) {
			const fileId = crypto.randomUUID();
			uploadingFiles[fileId] = { 
				name: file.name, 
				size: file.size 
			};
			uploadProgress[fileId] = 0;

			try {
				// Calculate hash while uploading
				const hash = await calculateFileHash(file, (progress) => {
					uploadProgress[fileId] = progress * 0.3; // Hash calculation is 30% of progress
				});

				uploadingFiles[fileId].hash = hash;
				uploadProgress[fileId] = 30;

				// Upload file with hash
				const result = await uploadFileWithHash(file, hash, (progress) => {
					uploadProgress[fileId] = 30 + (progress * 0.7); // Upload is 70% of progress
				});

				// Mark as completed
				completedUploads[fileId] = {
					name: file.name,
					hash: hash,
					id: result.id
				};
				uploadProgress[fileId] = 100;

				// Remove from uploading after delay
				setTimeout(() => {
					delete uploadingFiles[fileId];
					delete uploadProgress[fileId];
				}, 3000);

			} catch (error) {
				console.error('Upload failed:', error);
				// Handle error state
				delete uploadingFiles[fileId];
				delete uploadProgress[fileId];
			}
		}
	}

	// Calculate SHA256 hash with progress
	async function calculateFileHash(file: File, onProgress?: (progress: number) => void): Promise<string> {
		const chunkSize = 1024 * 1024; // 1MB chunks
		const chunks = Math.ceil(file.size / chunkSize);
		const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
		
		// Simulate progress for demo (real implementation would process chunks)
		if (onProgress) {
			for (let i = 0; i <= 100; i += 10) {
				await new Promise(resolve => setTimeout(resolve, 10));
				onProgress(i / 100);
			}
		}
		
		return Array.from(new Uint8Array(hash))
			.map(b => b.toString(16).padStart(2, '0'))
			.join('');
	}

	// Upload file with calculated hash
	async function uploadFileWithHash(file: File, hash: string, onProgress?: (progress: number) => void): Promise<{ id: string }> {
		const formData = new FormData();
		formData.append('files', file);
		formData.append('caseId', caseId);
		formData.append('hash', hash);

		// Simulate upload progress
		if (onProgress) {
			for (let i = 0; i <= 100; i += 5) {
				await new Promise(resolve => setTimeout(resolve, 50));
				onProgress(i / 100);
			}
		}

		const response = await fetch('/api/evidence/upload', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error('Upload failed');
		}

		const result = await response.json();
		return { id: result.uploaded?.[0]?.id || crypto.randomUUID() };
	}
</script>

<svelte:head>
	<title>Interactive Canvas - Prosecutor Case Management</title>
</svelte:head>

<div class="canvas-layout" class:fullscreen={isFullscreen}>
	<!-- Header -->
	<Header />

	<!-- Main Content Area -->
	<div class="main-content" bind:this={mainContainer}>
		<!-- Sidebar -->
		<Sidebar />

		<!-- Canvas Container -->
		<div 
			class="canvas-container"
			class:sidebar-open={sidebarOpen}
			on:drop={handleFileDrop}
			on:dragover={handleDragOver}
			role="main"
			aria-label="Interactive canvas workspace"
		>
			<!-- Toolbar -->
			<div class="toolbar-container">
				<Toolbar />
			</div>

			<!-- Canvas Editor -->
			<div class="canvas-editor-container">
				<CanvasEditor 
					width={canvasWidth}
					height={canvasHeight - 80}
					reportId={data?.reportId || 'new'}
					evidence={data?.evidence || []}
					canvasState={data?.canvasState as any}
				/>
			</div>

			<!-- File Upload Zone with Progress -->
			<div class="upload-zone">
				<FileUploadSection />
				
				<!-- Upload Progress Indicators -->
				{#if Object.keys(uploadingFiles).length > 0}
					<div class="upload-progress-container">
						<h4>🔄 Uploading Files</h4>
						{#each Object.entries(uploadingFiles) as [fileId, file]}
							<div class="upload-item">
								<div class="upload-info">
									<span class="file-name">{file.name}</span>
									<span class="file-size">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
								</div>
								<div class="progress-bar">
									<div 
										class="progress-fill" 
										style="width: {uploadProgress[fileId] || 0}%"
									></div>
								</div>
								<div class="upload-status">
									{#if uploadProgress[fileId] < 30}
										🔐 Calculating hash...
									{:else if uploadProgress[fileId] < 100}
										📤 Uploading... {uploadProgress[fileId].toFixed(0)}%
									{:else}
										✅ Complete
									{/if}
								</div>
								{#if file.hash}
									<div class="hash-preview">
										🔑 <span class="hash-text">{file.hash.substring(0, 16)}...</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Completed Uploads -->
				{#if Object.keys(completedUploads).length > 0}
					<div class="completed-uploads">
						<h4>✅ Upload Complete</h4>
						{#each Object.entries(completedUploads) as [fileId, upload]}
							<div class="completed-item">
								<span class="file-name">{upload.name}</span>
								<div class="hash-verification">
									<span class="hash-label">Hash:</span>
									<span class="hash-value">{upload.hash.substring(0, 12)}...{upload.hash.substring(-4)}</span>
									<button 
										class="verify-btn"
										on:click={() => window.open(`/evidence/hash?hash=${upload.hash}`, '_blank')}
									>
										🔍 Verify
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- AI Floating Action Button -->
	<AIFabButton />
</div>

<style>
	.canvas-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		background: var(--pico-background-color);
	}

	.canvas-layout.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999;
	}

	.main-content {
		display: flex;
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.canvas-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		position: relative;
		transition: margin-left 0.3s ease;
		background: var(--pico-card-background-color);
	}

	.canvas-container.sidebar-open {
		margin-left: 320px;
	}

	.toolbar-container {
		border-bottom: 1px solid var(--pico-muted-border-color);
		background: var(--pico-card-background-color);
		z-index: 10;
	}

	.canvas-editor-container {
		flex: 1;
		position: relative;
		overflow: hidden;
	}

	.upload-zone {
		position: absolute;
		bottom: 20px;
		left: 20px;
		right: 20px;
		z-index: 5;
		max-width: 400px;
		opacity: 0.9;
		transition: opacity 0.3s ease;
	}

	.upload-zone:hover {
		opacity: 1;
	}

	/* Upload Progress Styles */
	.upload-progress-container {
		background: var(--pico-card-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.upload-progress-container h4 {
		margin: 0 0 12px 0;
		font-size: 14px;
		color: var(--pico-color);
	}

	.upload-item {
		margin-bottom: 12px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	.upload-item:last-child {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	.upload-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}

	.file-name {
		font-weight: 500;
		font-size: 13px;
		color: var(--pico-color);
	}

	.file-size {
		font-size: 12px;
		color: var(--pico-muted-color);
	}

	.progress-bar {
		width: 100%;
		height: 6px;
		background: var(--pico-muted-border-color);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: 6px;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #3b82f6, #10b981);
		transition: width 0.3s ease;
		border-radius: 3px;
	}

	.upload-status {
		font-size: 12px;
		color: var(--pico-muted-color);
		margin-bottom: 4px;
	}

	.hash-preview {
		font-size: 11px;
		color: var(--pico-muted-color);
		font-family: monospace;
		background: var(--pico-code-background-color);
		padding: 4px 6px;
		border-radius: 4px;
	}

	.hash-text {
		color: var(--pico-primary);
	}

	/* Completed Uploads Styles */
	.completed-uploads {
		background: var(--pico-card-background-color);
		border: 1px solid #10b981;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 12px;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
	}

	.completed-uploads h4 {
		margin: 0 0 12px 0;
		font-size: 14px;
		color: #10b981;
	}

	.completed-item {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 12px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	.completed-item:last-child {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	.hash-verification {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
	}

	.hash-label {
		color: var(--pico-muted-color);
		font-weight: 500;
	}

	.hash-value {
		font-family: monospace;
		background: var(--pico-code-background-color);
		padding: 2px 6px;
		border-radius: 4px;
		color: var(--pico-primary);
	}

	.verify-btn {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 11px;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.verify-btn:hover {
		background: #2563eb;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.canvas-container.sidebar-open {
			margin-left: 0;
		}
	}
</style>
