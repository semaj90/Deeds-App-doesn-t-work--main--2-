<script lang="ts">
  import EvidencePanel from '$lib/components/EvidencePanel.svelte';
  import CanvasEditor from '$lib/components/CanvasEditor.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let caseId = $page.params.id;
  let caseDetails = $page.data.caseDetails;
  let evidence = caseDetails?.evidence || [];
  let canvasState: any = null;

  let showSidebar = writable(false);
  let sidebarHovered = false;

  function handleSidebarMouseEnter() {
    sidebarHovered = true;
    showSidebar.set(true);
  }
  function handleSidebarMouseLeave() {
    sidebarHovered = false;
    setTimeout(() => {
      if (!sidebarHovered) showSidebar.set(false);
    }, 300);
  }

  function handleEvidenceDrop(evd: any) {
    // Forward to CanvasEditor (could push to a store or call a method)
    // For now, just log
    console.log('Dropped on canvas:', evd);
  }
</script>

<section class="case-layout grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="col-span-1 relative">
    <div
      class="sidebar-trigger absolute left-0 top-1/2 -translate-y-1/2 z-20"
      on:mouseenter={handleSidebarMouseEnter}
      on:mouseleave={handleSidebarMouseLeave}
    >
      <div class="sidebar-tab bg-primary text-white rounded-r px-2 py-4 shadow cursor-pointer">
        &#9776;
      </div>
    </div>
    {#if $showSidebar}
      <div
        class="sidebar-panel fixed left-0 top-0 h-full w-64 bg-background-alt shadow-lg z-30 flex flex-col"
        on:mouseenter={handleSidebarMouseEnter}
        on:mouseleave={handleSidebarMouseLeave}
      >
        <EvidencePanel {caseId} onEvidenceDrop={handleEvidenceDrop} />
      </div>
    {/if}
  </div>
  <div class="col-span-2 relative">
    <div class="canvas-stretch-container">
      <CanvasEditor
        bind:canvasState
        reportId={caseId}
        {evidence}
        on:evidenceDrop={handleEvidenceDrop}
        width={undefined}
        height={undefined}
      />
      <button class="ai-fab" aria-label="Ask AI">
        <svg width="32" height="32" fill="currentColor" class="text-primary"><circle cx="16" cy="16" r="16" fill="currentColor" opacity=".1"/><path d="M16 8a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 16 10zm1 3v2h2v2h-2v2h-2v-2h-2v-2h2v-2h2z" fill="currentColor"/></svg>
      </button>
      <div class="infinite-scroll-list">
        <!-- Infinite scroll logic: load more on scroll bottom, show evidence or canvas items -->
      </div>
    </div>
  </div>
</section>

<style>
.case-layout {
  margin-top: 2rem;
  margin-bottom: 2rem;
}
.canvas-stretch-container {
  position: relative;
  width: 100%;
  height: 80vh;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  background: var(--pico-background, #fff);
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.sidebar-trigger {
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}
.sidebar-tab {
  --uno: bg-primary text-white rounded-r px-2 py-4 shadow hover:bg-primary-600 transition;
}
.sidebar-panel {
  --uno: bg-background-alt shadow-lg w-64 h-full fixed left-0 top-0 z-30 flex flex-col;
  animation: slideInSidebar 0.3s;
}
@keyframes slideInSidebar {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.ai-fab {
  position: absolute;
  right: 2rem;
  bottom: 2rem;
  --uno: bg-primary text-white rounded-full shadow-lg p-3 hover:bg-primary-600 transition;
  border: none;
  z-index: 40;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.infinite-scroll-list {
  flex: 1;
  overflow-y: auto;
  margin-top: 1rem;
}
</style>
