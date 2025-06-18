<script lang="ts">
  import { dragDropManager, dragDropClasses, type DragDropItem } from '$lib/stores/dragDrop';
  import { createEventDispatcher } from 'svelte';

  export let item: DragDropItem;
  export let disabled = false;
  export let showPreview = true;

  const dispatch = createEventDispatcher();
  let isDragging = false;
  let element: HTMLElement;

  $: {
    if ($dragDropManager.draggedItem?.id === item.id) {
      isDragging = true;
    } else {
      isDragging = false;
    }
  }

  function handleDragStart(event: DragEvent) {
    if (disabled) {
      event.preventDefault();
      return;
    }

    dragDropManager.startDrag(item, event);
    dispatch('dragstart', { item, event });

    // Set drag data for native drag and drop
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify(item));
    }
  }

  function handleDragEnd(event: DragEvent) {
    dragDropManager.endDrag();
    dispatch('dragend', { item, event });
  }

  function handleMouseDown(event: MouseEvent) {
    if (disabled) return;
    
    // For touch/mobile support
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        dragDropManager.startDrag(item, event);
        isDragging = true;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (isDragging) {
        dragDropManager.endDrag();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function getStatusColor(status?: string) {
    switch (status) {
      case 'active': return 'border-l-success';
      case 'pending': return 'border-l-warning';
      case 'completed': return 'border-l-primary';
      case 'critical': return 'border-l-error';
      default: return 'border-l-base-300';
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'evidence': return '📁';
      case 'case': return '⚖️';
      case 'criminal': return '👤';
      case 'file': return '📄';
      default: return '📎';
    }
  }
</script>

<div
  bind:this={element}
  class="draggable-item {dragDropClasses.item} {getStatusColor(item.status)} 
         {!disabled ? dragDropClasses.draggable : 'cursor-default'}
         {isDragging ? dragDropClasses.itemDragging : ''}
         border-l-4"
  draggable={!disabled}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
  on:mousedown={handleMouseDown}
  role="button"
  tabindex={disabled ? -1 : 0}
  aria-label="Draggable item: {item.title}"
>
  <div class="flex items-start justify-between gap-3">
    <div class="flex items-start gap-3 flex-1 min-w-0">
      <!-- Type Icon -->
      <div class="text-xl flex-shrink-0 mt-0.5">
        {getTypeIcon(item.type)}
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h4 class="font-semibold text-sm truncate mb-1" title={item.title}>
          {item.title}
        </h4>
        
        {#if item.description}
          <p class="text-xs text-base-content/70 line-clamp-2 mb-2">
            {item.description}
          </p>
        {/if}
        
        <!-- Metadata -->
        {#if item.metadata}
          <div class="flex flex-wrap gap-1">
            {#each Object.entries(item.metadata).slice(0, 3) as [key, value]}
              <span class="badge badge-xs badge-ghost">
                {key}: {value}
              </span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Status Badge -->
    {#if item.status}
      <div class="flex-shrink-0">
        <span class="badge badge-xs {
          item.status === 'active' ? 'badge-success' :
          item.status === 'pending' ? 'badge-warning' :
          item.status === 'completed' ? 'badge-primary' :
          item.status === 'critical' ? 'badge-error' :
          'badge-ghost'
        }">
          {item.status}
        </span>
      </div>
    {/if}
  </div>
  
  <!-- Drag Handle -->
  {#if !disabled}
    <div class="drag-handle absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <svg class="w-4 h-4 text-base-content/50" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
      </svg>
    </div>
  {/if}
  
  <!-- Preview when dragging -->
  {#if showPreview && isDragging}
    <div class="absolute inset-0 bg-base-100/80 flex items-center justify-center rounded-lg border-2 border-dashed border-primary">
      <span class="text-primary font-medium text-sm">Moving...</span>
    </div>
  {/if}
</div>

<style>
  .draggable-item {
    position: relative;
    user-select: none;
  }
  
  .draggable-item:hover .drag-handle {
    opacity: 1;
  }
    .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  :global(.dragging) .draggable-item {
    pointer-events: none;
  }
  
  :global(.dragging) .draggable-item.dragging {
    pointer-events: auto;
  }
</style>
