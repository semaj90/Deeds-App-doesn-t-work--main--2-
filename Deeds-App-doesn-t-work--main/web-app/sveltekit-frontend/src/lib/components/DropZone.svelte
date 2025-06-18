<script lang="ts">
  import { dragDropManager, dragDropClasses, type DragDropZone, type DragDropItem } from '$lib/stores/dragDrop';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import DraggableItem from './DraggableItem.svelte';

  export let zone: DragDropZone;
  export let allowReorder = true;
  export let showItemCount = true;
  export let emptyMessage = 'Drop items here';
  export let className = '';

  const dispatch = createEventDispatcher();

  let element: HTMLElement;
  let isValidDropTarget = false;
  let isHovering = false;
  let draggedOverIndex = -1;

  $: canAcceptDraggedItem = $dragDropManager.draggedItem && 
    zone.accepts.includes($dragDropManager.draggedItem.type) &&
    (!zone.maxItems || zone.items.length < zone.maxItems);
  onMount(() => {
    dragDropManager.createZone(zone);
    
    // Listen for global item dropped events
    document.addEventListener('itemDropped', handleItemDropped as EventListener);
  });

  onDestroy(() => {
    document.removeEventListener('itemDropped', handleItemDropped as EventListener);
  });

  function handleItemDropped(event: Event) {
    const customEvent = event as CustomEvent;
    const { sourceZoneId, targetZoneId, item } = customEvent.detail;
    if (targetZoneId === zone.id) {
      dispatch('itemAdded', { item, sourceZoneId });
    } else if (sourceZoneId === zone.id) {
      dispatch('itemRemoved', { item, targetZoneId });
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    
    if (!canAcceptDraggedItem) {
      isValidDropTarget = false;
      return;
    }
    
    isValidDropTarget = true;
    isHovering = true;
    
    // Calculate drop position for reordering
    if (allowReorder && zone.items.length > 0) {
      const rect = element.getBoundingClientRect();
      const y = event.clientY - rect.top;
      const itemHeight = rect.height / zone.items.length;
      draggedOverIndex = Math.floor(y / itemHeight);
    }
  }

  function handleDragLeave(event: DragEvent) {
    const rect = element.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    // Only hide if we're actually leaving the drop zone
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      isHovering = false;
      draggedOverIndex = -1;
    }
  }
  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isHovering = false;
    draggedOverIndex = -1;
    
    if (!$dragDropManager.draggedItem || !canAcceptDraggedItem) {
      return;
    }

    const success = await dragDropManager.dropItem(zone.id, $dragDropManager.draggedItem);
    
    if (success) {
      dispatch('drop', {
        item: $dragDropManager.draggedItem,
        zone: zone,
        index: draggedOverIndex >= 0 ? draggedOverIndex : zone.items.length
      });
    }
  }

  function handleItemReorder(fromIndex: number, toIndex: number) {
    if (!allowReorder) return;
    
    dragDropManager.moveItemWithinZone(zone.id, fromIndex, toIndex);
    dispatch('reorder', { fromIndex, toIndex, zone });
  }

  function removeItem(item: DragDropItem) {
    dragDropManager.filterZoneItems(zone.id, i => i.id !== item.id);
    dispatch('itemRemoved', { item, targetZoneId: null });
  }

  function getZoneClasses() {
    let classes = `${dragDropClasses.dropZone} ${className}`;
    
    if (isHovering && canAcceptDraggedItem) {
      classes += ` ${dragDropClasses.dropZoneActive}`;
    } else if (isHovering && !canAcceptDraggedItem) {
      classes += ` ${dragDropClasses.dropZoneInvalid}`;
    }
    
    return classes;
  }
</script>

<div
  bind:this={element}
  class="drop-zone {getZoneClasses()}"
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  role="region"
  aria-label="Drop zone: {zone.title}"
>
  <!-- Zone Header -->
  <div class="flex items-center justify-between mb-3 p-3 bg-base-200 rounded-t-lg">
    <h3 class="font-semibold text-base">{zone.title}</h3>
    
    <div class="flex items-center gap-2">
      {#if showItemCount}
        <span class="badge badge-sm">
          {zone.items.length}
          {#if zone.maxItems}
            / {zone.maxItems}
          {/if}
        </span>
      {/if}
      
      <!-- Zone Actions -->      <div class="dropdown dropdown-end">        <button 
          tabindex="0" 
          class="btn btn-ghost btn-xs" 
          aria-label="Zone actions"
          on:keydown={(e) => e.key === 'Enter' && e.currentTarget.click()}
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
          </svg>
        </button>
        <ul role="menu" tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li><button on:click={() => dispatch('sortItems', { zone })}>Sort Items</button></li>
          <li><button on:click={() => dispatch('clearZone', { zone })}>Clear All</button></li>
          <li><button on:click={() => dispatch('exportZone', { zone })}>Export</button></li>
        </ul>
      </div>
    </div>
  </div>
  
  <!-- Items Container -->
  <div class="items-container p-3 pt-0 min-h-[120px] space-y-2">
    {#if zone.items.length === 0}
      <!-- Empty State -->
      <div class="empty-state flex flex-col items-center justify-center py-8 text-center">
        <div class="text-4xl mb-2 opacity-50">
          {#if zone.accepts.includes('evidence')}📁
          {:else if zone.accepts.includes('case')}⚖️
          {:else if zone.accepts.includes('criminal')}👤
          {:else}📎{/if}
        </div>
        <p class="text-base-content/60 text-sm">
          {emptyMessage}
        </p>
        {#if zone.accepts.length > 0}
          <p class="text-xs text-base-content/40 mt-1">
            Accepts: {zone.accepts.join(', ')}
          </p>
        {/if}
      </div>
    {:else}
      <!-- Items List -->
      {#each zone.items as item, index (item.id)}
        <div class="item-wrapper relative">
          <!-- Drop indicator for reordering -->
          {#if allowReorder && draggedOverIndex === index && $dragDropManager.isDragging}
            <div class="drop-indicator h-0.5 bg-primary mb-2 rounded-full"></div>
          {/if}
          
          <div class="item-container group relative">
            <DraggableItem 
              {item}
              disabled={false}
              on:dragstart={() => dispatch('itemDragStart', { item, index, zone })}
              on:dragend={() => dispatch('itemDragEnd', { item, index, zone })}
            />
            
            <!-- Item Actions -->
            <div class="item-actions absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="flex gap-1">
                <button 
                  class="btn btn-ghost btn-xs text-info"
                  on:click={() => dispatch('viewItem', { item, zone })}
                  title="View details"
                >
                  👁️
                </button>
                <button 
                  class="btn btn-ghost btn-xs text-error"
                  on:click={() => removeItem(item)}
                  title="Remove from zone"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
          
          <!-- Drop indicator for reordering (end) -->
          {#if allowReorder && draggedOverIndex === zone.items.length && index === zone.items.length - 1 && $dragDropManager.isDragging}
            <div class="drop-indicator h-0.5 bg-primary mt-2 rounded-full"></div>
          {/if}
        </div>
      {/each}
    {/if}
    
    <!-- Active Drop Indicator -->
    {#if isHovering && canAcceptDraggedItem}
      <div class="drop-preview border-2 border-dashed border-primary bg-primary/5 rounded-lg p-4 text-center">
        <span class="text-primary font-medium">Drop here to add to {zone.title}</span>
      </div>
    {:else if isHovering && !canAcceptDraggedItem}
      <div class="drop-preview border-2 border-dashed border-error bg-error/5 rounded-lg p-4 text-center">
        <span class="text-error font-medium">Cannot drop here</span>
      </div>
    {/if}
  </div>
</div>

<style>  .drop-zone {
    background: oklch(var(--b1));
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }
  
  .items-container {
    max-height: 500px;
    overflow-y: auto;
  }
  
  .item-wrapper {
    position: relative;
  }
  
  .drop-indicator {
    opacity: 0.8;
    animation: pulse 1s infinite;
  }
    .item-actions {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 0.375rem;
    padding: 2px;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 0.4; }
  }
  
  /* Scrollbar styling */
  .items-container::-webkit-scrollbar {
    width: 6px;
  }
    .items-container::-webkit-scrollbar-track {
    background: oklch(var(--b2));
    border-radius: 3px;
  }

  .items-container::-webkit-scrollbar-thumb {
    background: oklch(var(--b3));
    border-radius: 3px;
  }

  .items-container::-webkit-scrollbar-thumb:hover {
    background: oklch(var(--bc) / 0.3);
  }
</style>
