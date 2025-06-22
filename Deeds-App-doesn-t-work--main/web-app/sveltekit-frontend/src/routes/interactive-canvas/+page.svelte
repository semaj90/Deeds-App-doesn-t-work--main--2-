<script lang="ts">
  import CanvasEditor from '$lib/components/CanvasEditor.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let canvasEditor: CanvasEditor;
  let caseId = '';
  let isLoading = false;
  let notifications: Array<{ type: 'success' | 'error' | 'info'; message: string; id: number }> = [];
  let notificationId = 0;

  onMount(() => {
    // Get caseId from URL params or generate a demo one
    caseId = $page.url.searchParams.get('caseId') || 'demo-case-' + Date.now();
  });

  function showNotification(type: 'success' | 'error' | 'info', message: string) {
    const id = notificationId++;
    notifications = [...notifications, { type, message, id }];
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notifications = notifications.filter(n => n.id !== id);
    }, 5000);
  }

  function removeNotification(id: number) {
    notifications = notifications.filter(n => n.id !== id);
  }

  function handleCanvasSaved() {
    showNotification('success', 'Canvas saved successfully');
  }

  function handleCanvasLoaded(event: CustomEvent) {
    showNotification('info', 'Canvas loaded successfully');
  }

  function handleEvidenceUploaded(event: CustomEvent) {
    const { originalName } = event.detail;
    showNotification('success', `Evidence "${originalName}" uploaded successfully`);
  }

  function handleAutoTagged(event: CustomEvent) {
    const tags = event.detail;
    showNotification('info', `Auto-tagged with: ${tags.join(', ')}`);
  }

  function handleError(event: CustomEvent) {
    const { message } = event.detail;
    showNotification('error', message);
  }

  async function exportCanvas() {
    if (!canvasEditor) return;
    
    isLoading = true;
    try {
      const canvasData = canvasEditor.getCanvasData();
      const imageData = canvasEditor.getCanvasImage();
      
      // Create download links
      const jsonBlob = new Blob([JSON.stringify(canvasData, null, 2)], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      
      // Download JSON
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `canvas-${caseId}-${new Date().toISOString().split('T')[0]}.json`;
      jsonLink.click();
      
      // Download image
      const imageLink = document.createElement('a');
      imageLink.href = imageData;
      imageLink.download = `canvas-${caseId}-${new Date().toISOString().split('T')[0]}.png`;
      imageLink.click();
      
      URL.revokeObjectURL(jsonUrl);
      showNotification('success', 'Canvas exported successfully');
    } catch (error) {
      showNotification('error', 'Failed to export canvas');
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Interactive Legal Canvas - Case {caseId}</title>
  <meta name="description" content="Interactive canvas for legal case evidence and documentation" />
</svelte:head>

<div class="canvas-page">
  <!-- Header -->
  <header class="header bg-gray-900 text-white p-4 flex justify-between items-center">
    <div class="header-left flex items-center gap-4">
      <h1 class="text-xl font-bold">Interactive Legal Canvas</h1>
      <span class="text-sm bg-gray-700 px-2 py-1 rounded">Case: {caseId}</span>
    </div>
    
    <div class="header-right flex items-center gap-2">
      <button 
        on:click={exportCanvas}
        class="export-btn bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
        disabled={isLoading}
      >
        📥 Export
      </button>
      
      <a 
        href="/cases" 
        class="back-btn bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-sm"
      >
        ← Back to Cases
      </a>
    </div>
  </header>

  <!-- Main Canvas Area -->
  <main class="canvas-main flex-1">
    <CanvasEditor
      bind:this={canvasEditor}
      {caseId}
      on:canvasSaved={handleCanvasSaved}
      on:canvasLoaded={handleCanvasLoaded}
      on:evidenceUploaded={handleEvidenceUploaded}
      on:autoTagged={handleAutoTagged}
      on:error={handleError}
    />
  </main>

  <!-- Notifications -->
  {#if notifications.length > 0}
    <div class="notifications fixed top-4 right-4 z-50 space-y-2">
      {#each notifications as notification (notification.id)}
        <div 
          class="notification p-3 rounded shadow-lg max-w-sm {notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white"
        >
          <div class="flex justify-between items-start">
            <p class="text-sm">{notification.message}</p>
            <button 
              on:click={() => removeNotification(notification.id)}
              class="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Loading Overlay -->
  {#if isLoading}
    <div class="loading-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div class="bg-white p-6 rounded shadow-lg text-center">
        <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p class="text-gray-700">Processing...</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .canvas-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .header {
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .canvas-main {
    flex: 1;
    overflow: hidden;
  }

  .notification {
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .export-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .back-btn, .export-btn {
    transition: background-color 0.2s ease;
  }
</style>