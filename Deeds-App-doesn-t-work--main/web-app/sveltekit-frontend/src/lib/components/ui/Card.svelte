<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let variant: 'default' | 'elevated' | 'outline' | 'glass' = 'default';
  export let padding: 'none' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let hover: boolean = true;
  export let clickable: boolean = false;
  export let fullHeight: boolean = false;

  const dispatch = createEventDispatcher();

  // Variant styles
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-200 shadow-md hover:shadow-lg',
    outline: 'bg-transparent border-2 border-gray-300',
    glass: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg'
  };

  // Padding styles
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  $: classes = [
    'card-base',
    'rounded-lg transition-all duration-200',
    variants[variant],
    paddings[padding],
    hover && clickable ? 'hover:shadow-md transform hover:-translate-y-1' : '',
    clickable ? 'cursor-pointer' : '',
    fullHeight ? 'h-full' : ''
  ].filter(Boolean).join(' ');

  function handleClick(event: MouseEvent) {
    if (clickable) {
      dispatch('click', event);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (clickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      dispatch('click', event);
    }
  }
</script>

<div
  class={classes}
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
  on:click={handleClick}
  on:keydown={handleKeyDown}
  {...$$restProps}
>
  <!-- Optional header slot -->
  {#if $$slots.header}
    <div class="card-header mb-4 pb-3 border-b border-gray-100">
      <slot name="header" />
    </div>
  {/if}

  <!-- Main content -->
  <div class="card-content">
    <slot />
  </div>

  <!-- Optional footer slot -->
  {#if $$slots.footer}
    <div class="card-footer mt-4 pt-3 border-t border-gray-100">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  /* Enhanced card styles using CSS variables */
  :global(.card-base) {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast);
  }
  
  :global(.card-base:hover) {
    box-shadow: var(--shadow-md);
  }
  
  /* Card header styling */
  :global(.card-header) {
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-light);
  }
  
  /* Card footer styling */
  :global(.card-footer) {
    margin-top: var(--space-4);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-light);
  }
  
  /* Glass card effect */
  :global(.card-base.glass) {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  /* Elevated card effect */
  :global(.card-base.elevated) {
    box-shadow: var(--shadow-lg);
  }
  
  :global(.card-base.elevated:hover) {
    box-shadow: var(--shadow-xl);
    transform: translateY(-2px);
  }
</style>
