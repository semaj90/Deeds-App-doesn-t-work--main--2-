<script lang="ts">
	import { onMount } from 'svelte';
	import { enhancedCitationStore } from '$lib/stores/enhancedCitationStore';
	import Fuse from 'fuse.js';

	export let caseId: string = '';
	export let reportId: string = '';
	
	let citations: any[] = [];
	let filteredCitations: any[] = [];
	let searchQuery = '';
	let fuse: Fuse<any>;
	let notifications: any[] = [];
	let storeState: any = {};

	// Subscribe to store updates
	onMount(() => {
		const unsubscribeCitations = enhancedCitationStore.subscribe(citationList => {
			citations = citationList;
			updateFuse();
			filterCitations();
		});

		const unsubscribeNotifications = enhancedCitationStore.subscribeToNotifications(notificationList => {
			notifications = notificationList.filter(n => !n.read).slice(0, 5); // Show 5 recent unread
		});

		const unsubscribeState = enhancedCitationStore.subscribeToState(state => {
			storeState = state;
		});

		// Load citations from server
		enhancedCitationStore.loadFromServer();

		return () => {
			unsubscribeCitations();
			unsubscribeNotifications();
			unsubscribeState();
		};
	});

	function updateFuse() {
		if (citations.length > 0) {
			fuse = new Fuse(citations, {
				keys: ['label', 'content', 'tags'],
				threshold: 0.3,
				includeScore: true
			});
		}
	}

	function filterCitations() {
		if (!searchQuery.trim()) {
			filteredCitations = citations;
		} else if (fuse) {
			filteredCitations = fuse.search(searchQuery).map(result => result.item);
		} else {
			filteredCitations = citations.filter(c => 
				c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.content.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
	}

	function handleDragStart(e: DragEvent, citation: any) {
		if (e.dataTransfer) {
			e.dataTransfer.setData('text/citation-id', citation.id);
			e.dataTransfer.setData('text/citation-label', citation.label);
			e.dataTransfer.effectAllowed = 'copy';
		}
	}

	function insertCitationIntoEditor(citation: any) {
		// Dispatch event for parent component to handle
		const event = new CustomEvent('insert-citation', {
			detail: citation,
			bubbles: true
		});
		window.dispatchEvent(event);
	}

	async function deleteCitation(citationId: string) {
		if (confirm('Are you sure you want to delete this citation?')) {
			await enhancedCitationStore.deleteCitation(citationId);
		}
	}

	function markNotificationAsRead(notificationId: string) {
		enhancedCitationStore.markNotificationAsRead(notificationId);
	}

	async function syncAll() {
		await enhancedCitationStore.syncAll();
	}

	async function syncToQdrant() {
		await enhancedCitationStore.syncToQdrant();
	}

	// Filter citations by current context
	$: contextCitations = caseId 
		? filteredCitations.filter(c => c.caseId === caseId || !c.caseId)
		: filteredCitations;

	$: mostUsedCitations = enhancedCitationStore.getMostUsed(3);
</script>

<aside class="citation-sidebar">
	<!-- Status Bar -->
	<div class="status-bar">
		<div class="status-indicator" class:loading={storeState.matches?.('loading')} class:syncing={storeState.matches?.('syncing')}>
			{#if storeState.matches?.('loading')}
				⏳ Loading...
			{:else if storeState.matches?.('syncing')}
				🔄 Syncing...
			{:else if storeState.matches?.('ready')}
				✅ Ready
			{:else}
				❌ Error
			{/if}
		</div>
		
		<div class="sync-buttons">
			<button class="sync-btn" on:click={syncAll} title="Sync to Server">
				🌐
			</button>
			<button class="sync-btn" on:click={syncToQdrant} title="Sync to Qdrant">
				🧠
			</button>
		</div>
	</div>

	<!-- Notifications -->
	{#if notifications.length > 0}
		<div class="notifications">
			<h4>Recent Activity</h4>
			{#each notifications as notification}
				<div class="notification {notification.type}" on:click={() => markNotificationAsRead(notification.id)}>
					<div class="notification-message">{notification.message}</div>
					<div class="notification-time">{new Date(notification.timestamp).toLocaleTimeString()}</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Search -->
	<div class="search-section">
		<input
			type="text"
			placeholder="Search citations..."
			bind:value={searchQuery}
			on:input={filterCitations}
			class="search-input"
		/>
	</div>

	<!-- Quick Access: Most Used -->
	{#if mostUsedCitations.length > 0}
		<div class="section">
			<h4>Most Used</h4>
			<div class="quick-citations">
				{#each mostUsedCitations as citation}
					<button
						class="quick-citation-btn"
						on:click={() => insertCitationIntoEditor(citation)}
						title={citation.content.substring(0, 100)}
					>
						{citation.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Citations List -->
	<div class="section citations-list">
		<h4>Citations ({contextCitations.length})</h4>
		
		{#if contextCitations.length === 0}
			<div class="empty-state">
				<p>No citations found.</p>
				<p class="hint">Select text in the editor and save it as a citation to get started.</p>
			</div>
		{:else}
			<div class="citation-items">
				{#each contextCitations as citation}
					<div
						class="citation-item"
						draggable="true"
						on:dragstart={(e) => handleDragStart(e, citation)}
						title="Drag to editor or click to insert"
					>
						<div class="citation-header">
							<span class="citation-label">{citation.label}</span>
							<div class="citation-actions">
								<button
									class="action-btn insert-btn"
									on:click={() => insertCitationIntoEditor(citation)}
									title="Insert into editor"
								>
									➕
								</button>
								<button
									class="action-btn delete-btn"
									on:click={() => deleteCitation(citation.id)}
									title="Delete citation"
								>
									🗑️
								</button>
							</div>
						</div>
						
						<div class="citation-content">
							{citation.content.substring(0, 120)}{citation.content.length > 120 ? '...' : ''}
						</div>
						
						{#if citation.tags && citation.tags.length > 0}
							<div class="citation-tags">
								{#each citation.tags as tag}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						{/if}
						
						<div class="citation-meta">
							<span class="source-type">{citation.sourceType || 'manual'}</span>
							{#if citation.createdAt}
								<span class="created-date">
									{new Date(citation.createdAt).toLocaleDateString()}
								</span>
							{/if}
							{#if !citation.synced}
								<span class="sync-status">⏳ Pending sync</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Evidence Analysis Section -->
	<div class="section">
		<h4>Evidence Analysis</h4>
		<button class="analyze-btn" on:click={() => console.log('Analyze evidence')}>
			🔍 Analyze Current Evidence
		</button>
		<button class="ai-btn" on:click={() => console.log('Generate AI analysis')}>
			🤖 Generate AI Analysis
		</button>
	</div>
</aside>

<style>
	.citation-sidebar {
		width: 320px;
		height: 100%;
		border-right: 1px solid #ddd;
		background: #f8f9fa;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: white;
		border-bottom: 1px solid #ddd;
		font-size: 12px;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.status-indicator.loading {
		color: #ffc107;
	}

	.status-indicator.syncing {
		color: #007bff;
	}

	.sync-buttons {
		display: flex;
		gap: 4px;
	}

	.sync-btn {
		padding: 4px 8px;
		border: 1px solid #ccc;
		background: white;
		border-radius: 3px;
		cursor: pointer;
		font-size: 12px;
	}

	.sync-btn:hover {
		background: #e9ecef;
	}

	.notifications {
		padding: 12px;
		border-bottom: 1px solid #ddd;
		background: #fff3cd;
	}

	.notifications h4 {
		margin: 0 0 8px 0;
		font-size: 14px;
		color: #856404;
	}

	.notification {
		padding: 6px 8px;
		margin-bottom: 4px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
	}

	.notification.success {
		background: #d1edff;
		color: #0c5460;
	}

	.notification.error {
		background: #f8d7da;
		color: #721c24;
	}

	.notification.info {
		background: #d1ecf1;
		color: #0c5460;
	}

	.notification-message {
		font-weight: 500;
	}

	.notification-time {
		font-size: 11px;
		opacity: 0.7;
		margin-top: 2px;
	}

	.search-section {
		padding: 12px;
		border-bottom: 1px solid #ddd;
		background: white;
	}

	.search-input {
		width: 100%;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 14px;
	}

	.section {
		padding: 12px;
		border-bottom: 1px solid #ddd;
	}

	.section h4 {
		margin: 0 0 12px 0;
		font-size: 14px;
		color: #333;
	}

	.quick-citations {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.quick-citation-btn {
		padding: 4px 8px;
		border: 1px solid #007bff;
		background: #e3f2fd;
		color: #0d47a1;
		border-radius: 12px;
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
	}

	.quick-citation-btn:hover {
		background: #bbdefb;
	}

	.citations-list {
		flex: 1;
		overflow-y: auto;
	}

	.citation-items {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.citation-item {
		background: white;
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 10px;
		cursor: grab;
		transition: all 0.2s ease;
	}

	.citation-item:hover {
		border-color: #007bff;
		box-shadow: 0 2px 4px rgba(0,123,255,0.1);
	}

	.citation-item:active {
		cursor: grabbing;
	}

	.citation-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}

	.citation-label {
		font-weight: bold;
		color: #007bff;
		font-size: 14px;
	}

	.citation-actions {
		display: flex;
		gap: 4px;
	}

	.action-btn {
		padding: 2px 6px;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 3px;
		font-size: 12px;
	}

	.insert-btn:hover {
		background: #e3f2fd;
	}

	.delete-btn:hover {
		background: #ffebee;
	}

	.citation-content {
		font-size: 13px;
		color: #555;
		line-height: 1.4;
		margin-bottom: 6px;
	}

	.citation-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-bottom: 6px;
	}

	.tag {
		background: #e9ecef;
		color: #495057;
		padding: 2px 6px;
		border-radius: 10px;
		font-size: 11px;
	}

	.citation-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		color: #6c757d;
	}

	.sync-status {
		color: #ffc107;
		font-weight: 500;
	}

	.empty-state {
		text-align: center;
		color: #6c757d;
		padding: 20px;
	}

	.hint {
		font-size: 12px;
		font-style: italic;
	}

	.analyze-btn,
	.ai-btn {
		width: 100%;
		padding: 8px;
		margin-bottom: 6px;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
	}

	.analyze-btn {
		background: #e3f2fd;
		color: #0d47a1;
		border-color: #007bff;
	}

	.ai-btn {
		background: #f3e5f5;
		color: #4a148c;
		border-color: #9c27b0;
	}

	.analyze-btn:hover {
		background: #bbdefb;
	}

	.ai-btn:hover {
		background: #e1bee7;
	}
</style>
