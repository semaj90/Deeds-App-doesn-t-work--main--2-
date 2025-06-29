<script lang="ts">
	// EvidenceViewer Component - Interactive Multimodal Evidence Display
	// Renders markdown summaries with interactive anchor points
	
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import type { EvidenceFile, EvidenceAnchorPoint, CaseEvidenceSummary } from '../types/multimodal';
	
	export let evidenceFile: EvidenceFile;
	export let anchorPoints: EvidenceAnchorPoint[] = [];
	export let sceneSummary: CaseEvidenceSummary | null = null;
	export let caseId: string;
	export let interactive = true;
	export let showTimeline = true;
	
	let mediaElement: HTMLVideoElement | HTMLImageElement | HTMLAudioElement;
	let overlayContainer: HTMLDivElement;
	let selectedAnchor: EvidenceAnchorPoint | null = null;
	let hoveredAnchor: EvidenceAnchorPoint | null = null;
	let currentTime = 0;
	let duration = 0;
	let isPlaying = false;
		// Reactive statements
	$: isVideo = evidenceFile.fileType === 'video' || evidenceFile.mimeType?.startsWith('video/');
	$: isImage = evidenceFile.fileType === 'image' || evidenceFile.mimeType?.startsWith('image/');
	$: isAudio = evidenceFile.fileType === 'audio' || evidenceFile.mimeType?.startsWith('audio/');
	$: isDocument = evidenceFile.fileType === 'document' || evidenceFile.mimeType?.includes('pdf');
	
	$: visibleAnchors = anchorPoints.filter(anchor => {
		if (!isVideo && !isAudio) return true;
		if (!anchor.timestamp) return true;
		return Math.abs(currentTime - anchor.timestamp) <= 2.0; // Show anchors within 2 seconds
	});
	
	$: markdownHtml = sceneSummary?.markdownContent ? marked.parse(sceneSummary.markdownContent) : '';
	
	onMount(() => {
		setupMediaElement();
		setupAnchorInteractions();
	});
	
	function setupMediaElement() {
		if (!mediaElement) return;
		
		if (isVideo || isAudio) {
			mediaElement.addEventListener('loadedmetadata', () => {
				duration = (mediaElement as HTMLVideoElement | HTMLAudioElement).duration;
			});
			
			mediaElement.addEventListener('timeupdate', () => {
				currentTime = (mediaElement as HTMLVideoElement | HTMLAudioElement).currentTime;
			});
			
			mediaElement.addEventListener('play', () => {
				isPlaying = true;
			});
			
			mediaElement.addEventListener('pause', () => {
				isPlaying = false;
			});
		}
	}
	
	function setupAnchorInteractions() {
		// Set up click handlers for anchor points
		anchorPoints.forEach(anchor => {
			// These will be bound to anchor point elements
		});
	}
	
	function handleAnchorClick(anchor: EvidenceAnchorPoint) {
		selectedAnchor = selectedAnchor?.id === anchor.id ? null : anchor;
		
		// If this is a time-based anchor, seek to that position
		if ((isVideo || isAudio) && anchor.timestamp && mediaElement) {
			(mediaElement as HTMLVideoElement | HTMLAudioElement).currentTime = anchor.timestamp;
		}
		
		// Dispatch event for parent components
		dispatchAnchorEvent('click', anchor);
	}
	
	function handleAnchorHover(anchor: EvidenceAnchorPoint | null) {
		hoveredAnchor = anchor;
		dispatchAnchorEvent('hover', anchor);
	}
		function handleTimelineClick(event: MouseEvent) {
		if (!isVideo && !isAudio) return;
		
		const timeline = event.currentTarget as HTMLElement;
		const rect = timeline.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const timelineWidth = rect.width;
		const clickTime = (clickX / timelineWidth) * duration;
		
		if (mediaElement) {
			(mediaElement as HTMLVideoElement | HTMLAudioElement).currentTime = clickTime;
		}
	}

	function handleTimelineKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && isVideo || isAudio) {
			// Simulate a click at the center of the timeline
			const timeline = event.currentTarget as HTMLElement;
			const rect = timeline.getBoundingClientRect();
			const centerX = rect.width / 2;
			const clickTime = (centerX / rect.width) * duration;
			
			if (mediaElement) {
				(mediaElement as HTMLVideoElement | HTMLAudioElement).currentTime = clickTime;
			}
		}
	}
	
	function togglePlayPause() {
		if (!mediaElement || (!isVideo && !isAudio)) return;
		
		const media = mediaElement as HTMLVideoElement | HTMLAudioElement;
		if (isPlaying) {
			media.pause();
		} else {
			media.play();
		}
	}
	
	function dispatchAnchorEvent(type: string, anchor: EvidenceAnchorPoint | null) {
		// Custom event for parent components to handle
		const event = new CustomEvent(`anchor${type}`, {
			detail: { anchor, evidenceFile }
		});
		dispatchEvent(event);
	}
	
	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
		function getAnchorIconClass(anchorType: string): string {
		const icons: Record<string, string> = {
			object: 'i-heroicons-eye',
			text: 'i-heroicons-document-text',
			audio_segment: 'i-heroicons-speaker-wave',
			timeline_event: 'i-heroicons-clock',
			custom: 'i-heroicons-bookmark'
		};
		return icons[anchorType] || icons.custom;
	}
	
	async function analyzeWithAI() {
		try {
			const response = await fetch(`/api/evidence/analyze-scene`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					case_id: caseId,
					evidence_id: evidenceFile.id,
					prompt: "Analyze this evidence for legal significance, potential contradictions, and key findings",
					include_emotions: true,
					include_timeline: true
				})
			});
			
			if (response.ok) {
				const analysis = await response.json();				// Update scene summary or create new one
				sceneSummary = {
					id: analysis.analysis_id || 'temp',
					caseId,
					evidenceFileId: evidenceFile.id,
					summaryType: 'scene_analysis',
					title: 'AI Scene Analysis',
					markdownContent: analysis.analysis,
					plainTextContent: analysis.analysis,
					keyFindings: [],
					confidence: 0.85,
					reviewStatus: 'pending', // Added required property
					generatedBy: 'ai',
					createdAt: new Date(),
					updatedAt: new Date(),
					evidenceCount: 1,
					totalFiles: 1,
					categories: [],
					timeline: []
				} as CaseEvidenceSummary;
			}
		} catch (error) {
			console.error('AI analysis failed:', error);
		}
	}
</script>

<div class="evidence-viewer bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
	<!-- Evidence Header -->
	<div class="evidence-header p-4 bg-gray-50 dark:bg-gray-700 border-b">
		<div class="flex items-center justify-between">
			<div>				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
					{evidenceFile.fileName || evidenceFile.fileName}
				</h3>
				<p class="text-sm text-gray-600 dark:text-gray-300">
					{(evidenceFile.fileType || evidenceFile.mimeType)?.toUpperCase()} • {Math.round(evidenceFile.fileSize / 1024)} KB
					{#if evidenceFile.duration}
						• {formatTime(evidenceFile.duration)}
					{/if}
				</p>
			</div>
			<div class="flex gap-2">
				<button
					on:click={analyzeWithAI}
					class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
					<span class="i-heroicons-sparkles w-4 h-4 inline-block mr-1"></span>
					AI Analysis
				</button>
			</div>
		</div>
	</div>
	
	<!-- Media Display -->
	<div class="media-container relative">
		{#if isVideo}
			<video
				bind:this={mediaElement}
				class="w-full h-auto max-h-96 object-contain bg-black"
				controls
				preload="metadata"
			>
				<source src={evidenceFile.filePath} type="video/mp4" />
				<track kind="captions" />
			</video>
		{:else if isImage}			<img
				bind:this={mediaElement}
				src={evidenceFile.filePath}
				alt={evidenceFile.fileName || evidenceFile.fileName}
				class="w-full h-auto max-h-96 object-contain bg-gray-100 dark:bg-gray-700"
			/>
		{:else if isAudio}
			<div class="audio-player p-8 bg-gray-100 dark:bg-gray-700">
				<audio
					bind:this={mediaElement}
					class="w-full"
					controls
					preload="metadata"
				>
					<source src={evidenceFile.filePath} type="audio/wav" />
				</audio>
			</div>
		{:else if isDocument}
			<div class="document-preview p-8 bg-gray-100 dark:bg-gray-700 text-center">
				<div class="i-heroicons-document-text w-16 h-16 mx-auto text-gray-400 mb-4"></div>
				<p class="text-gray-600 dark:text-gray-300">
					Document preview not available. Click to download.
				</p>				<a
					href={evidenceFile.filePath}
					download={evidenceFile.fileName || evidenceFile.fileName}
					class="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
					Download Document
				</a>
			</div>
		{/if}
		
		<!-- Anchor Point Overlay -->
		{#if interactive && (isVideo || isImage)}
			<div
				bind:this={overlayContainer}
				class="anchor-overlay absolute inset-0 pointer-events-none"
			>				{#each visibleAnchors as anchor (anchor.id)}
					<button
						class="anchor-point absolute w-6 h-6 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110 pointer-events-auto z-10"
						style="left: {anchor.positionX * 100}%; top: {anchor.positionY * 100}%; transform: translate(-50%, -50%)"
						on:click={() => handleAnchorClick(anchor)}
						on:mouseenter={() => handleAnchorHover(anchor)}
						on:mouseleave={() => handleAnchorHover(null)}
						title={anchor.description}
						aria-label={`Anchor point: ${anchor.description}`}
					>
						<span class="{getAnchorIconClass(anchor.anchorType)} w-3 h-3 block m-auto"></span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
	
	<!-- Timeline (for video/audio) -->
	{#if showTimeline && (isVideo || isAudio) && duration > 0}
		<div class="timeline-container p-4 bg-gray-50 dark:bg-gray-700 border-t">
			<div class="timeline-wrapper relative">				<!-- Timeline track -->
				<div					class="timeline-track w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer relative"					on:click={handleTimelineClick}
					on:keydown={handleTimelineKeydown}
					role="slider"
					aria-label="Timeline scrubber"
					aria-valuenow={currentTime}
					aria-valuemin={0}
					aria-valuemax={duration}
					tabindex="0"
				>
					<!-- Progress indicator -->
					<div
						class="timeline-progress h-full bg-blue-600 rounded-full"
						style="width: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
					></div>
							<!-- Timeline anchor points -->					{#each anchorPoints.filter(a => a.timestamp !== null && a.timestamp !== undefined) as anchor}
						<button
							class="timeline-anchor absolute w-3 h-3 bg-red-500 rounded-full transform -translate-y-0.5 hover:bg-red-600 transition-colors"
							style="left: {duration > 0 && anchor.timestamp ? (anchor.timestamp / duration) * 100 : 0}%"
							on:click|stopPropagation={() => handleAnchorClick(anchor)}
							title="{anchor.timestamp ? formatTime(anchor.timestamp) : '0:00'}: {anchor.label}"
							aria-label="Timeline anchor at {anchor.timestamp ? formatTime(anchor.timestamp) : '0:00'}: {anchor.label}"
						></button>
					{/each}
				</div>
				
				<!-- Timeline controls -->
				<div class="timeline-controls flex items-center justify-between mt-2 text-sm text-gray-600 dark:text-gray-300">
					<span>{formatTime(currentTime)}</span>
					<button
						on:click={togglePlayPause}
						class="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
					>
						{isPlaying ? 'Pause' : 'Play'}
					</button>
					<span>{formatTime(duration)}</span>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Anchor Point Details Panel -->
	{#if selectedAnchor}
		<div class="anchor-details p-4 bg-blue-50 dark:bg-blue-900/20 border-t">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-1">
						{selectedAnchor.label}
					</h4>
					<p class="text-sm text-blue-700 dark:text-blue-200 mb-2">
						{selectedAnchor.description}
					</p>
					<div class="flex gap-4 text-xs text-blue-600 dark:text-blue-300">
						<span>Type: {selectedAnchor.anchorType}</span>
						<span>Confidence: {Math.round((selectedAnchor.confidence || 0) * 100)}%</span>
						{#if selectedAnchor.timestamp}
							<span>Time: {formatTime(selectedAnchor.timestamp)}</span>
						{/if}
					</div>
				</div>				<button
					on:click={() => selectedAnchor = null}
					class="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
					aria-label="Close anchor details"
				>
					<span class="i-heroicons-x-mark w-5 h-5"></span>
				</button>
			</div>
		</div>
	{/if}
	
	<!-- Scene Summary -->
	{#if sceneSummary}
		<div class="scene-summary p-4 border-t">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
				<span class="i-heroicons-document-text w-5 h-5 mr-2"></span>
				Scene Analysis
			</h3>
			
			<div class="prose dark:prose-invert max-w-none">
				{@html markdownHtml}
			</div>
			
			{#if sceneSummary.keyFindings && sceneSummary.keyFindings.length > 0}
				<div class="key-findings mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
					<h4 class="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
						Key Findings
					</h4>
					<ul class="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-200">
						{#each sceneSummary.keyFindings as finding}
							<li>{finding}</li>
						{/each}
					</ul>
				</div>
			{/if}
			
			<div class="analysis-meta mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300">				<div class="flex justify-between">
					<span>Confidence: {Math.round((sceneSummary.confidence || 0) * 100)}%</span>
					<span>Generated by: {sceneSummary.generatedBy || 'unknown'}</span>
					<span>Created: {sceneSummary.createdAt ? new Date(sceneSummary.createdAt).toLocaleDateString() : 'unknown'}</span>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Anchor Points List -->
	{#if anchorPoints.length > 0}
		<div class="anchor-list p-4 border-t">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
				Interactive Points ({anchorPoints.length})
			</h3>
			
			<div class="grid gap-2 max-h-64 overflow-y-auto">
				{#each anchorPoints as anchor (anchor.id)}
					<button
						class="anchor-item p-2 text-left bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
						class:bg-blue-100={selectedAnchor?.id === anchor.id}
						class:dark:bg-blue-900={selectedAnchor?.id === anchor.id}
						on:click={() => handleAnchorClick(anchor)}
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-1">
									<span class="{getAnchorIconClass(anchor.anchorType)} w-4 h-4"></span>
									<span class="font-medium text-sm">{anchor.label}</span>
									<span class="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-1 rounded">
										{anchor.anchorType}
									</span>
								</div>
								<p class="text-xs text-gray-600 dark:text-gray-300">
									{anchor.description}
								</p>
								{#if anchor.timestamp}
									<p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
										{formatTime(anchor.timestamp)}
									</p>
								{/if}
							</div>							<span class="text-xs text-gray-500">
								{Math.round((anchor.confidence || 0) * 100)}%
							</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.anchor-point {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		border: 2px solid white;
	}
	
	.anchor-point:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
	}
	
	.timeline-anchor {		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
	}
</style>
