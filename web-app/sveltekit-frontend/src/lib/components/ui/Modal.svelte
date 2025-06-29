<script lang="ts">
  import { createDialog, melt } from '@melt-ui/svelte';
  import { modals, uiStore, motion } from '$lib/stores/ui';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { X } from 'lucide-svelte';
  
  export let modalId: string;
  export let title: string;
  export let description: string = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  export let closeOnEscape = true;
  export let closeOnOutsideClick = true;
  
  $: isOpen = $modals[modalId] || false;
  
  const {
    elements: { trigger, overlay, content, title: titleEl, description: descEl, close },
    states: { open }
  } = createDialog({
    closeOnOutsideClick,
    onOpenChange: ({ next }) => {
      if (next) {
        uiStore.openModal(modalId);
      } else {
        uiStore.closeModal(modalId);
      }
      return next;
    }
  });
  
  // Sync store state with melt state
  $: if (isOpen !== $open) {
    open.set(isOpen);
  }
  
  // Size classes
  $: sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  }[size];
  
  // Animation durations
  $: duration = $motion.reduceMotion ? 0 : $motion.duration === 'fast' ? 150 : $motion.duration === 'slow' ? 400 : 250;
</script>

{#if $open}
  <!-- Overlay -->
  <div
    use:melt={$overlay}
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    in:fade={{ duration }}
    out:fade={{ duration }}
  />
  
  <!-- Modal Container -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      use:melt={$content}
      class={`
        relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800
        w-full ${sizeClasses} max-h-[90vh] overflow-hidden flex flex-col
      `}
      in:fly={{ 
        y: 30, 
        duration, 
        easing: quintOut 
      }}
      out:fly={{ 
        y: -30, 
        duration: duration * 0.7, 
        easing: quintOut 
      }}
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
        <div class="flex-1 min-w-0">
          <h2 
            use:melt={$titleEl}
            class="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate"
          >
            {title}
          </h2>
          {#if description}
            <p 
              use:melt={$descEl}
              class="mt-1 text-sm text-gray-500 dark:text-gray-400"
            >
              {description}
            </p>
          {/if}
        </div>
        
        <button
          use:melt={$close}
          class="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </button>
      </div>
      
      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <slot />
      </div>
      
      <!-- Footer (if provided) -->
      {#if $$slots.footer}
        <div class="border-t border-gray-200 dark:border-gray-800 p-6">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Export trigger for external use -->
<slot name="trigger" {trigger} />

<style>
  /* Smooth scrolling for modal content */
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: #9ca3af transparent;
  }
  
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: #9ca3af;
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background-color: #6b7280;
  }
</style>
