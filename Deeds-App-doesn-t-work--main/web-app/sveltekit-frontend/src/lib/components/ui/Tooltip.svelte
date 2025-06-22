<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Props
  export let text: string = '';
  export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  export let theme: 'dark' | 'light' = 'dark';
  export let delay: number = 500;
  export let duration: number = 200;
  export let offset: number = 8;
  export let disabled: boolean = false;
  export let arrow: boolean = true;
  export let maxWidth: string = '200px';

  let triggerElement: HTMLElement;
  let tooltipElement: HTMLElement;
  let isVisible: boolean = false;
  let showTimeout: number;
  let hideTimeout: number;

  // Position calculations
  let tooltipStyles: string = '';

  function calculatePosition() {
    if (!triggerElement || !tooltipElement || !isVisible) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let top: number = 0;
    let left: number = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - offset;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + offset;
        break;
    }

    // Boundary checks
    if (left < 0) left = 8;
    if (left + tooltipRect.width > viewport.width) {
      left = viewport.width - tooltipRect.width - 8;
    }
    if (top < 0) top = 8;
    if (top + tooltipRect.height > viewport.height) {
      top = viewport.height - tooltipRect.height - 8;
    }

    tooltipStyles = `
      position: fixed;
      top: ${top}px;
      left: ${left}px;
      z-index: var(--z-tooltip);
      max-width: ${maxWidth};
    `;
  }

  function show() {
    if (disabled) return;
    
    clearTimeout(hideTimeout);
    showTimeout = setTimeout(() => {
      isVisible = true;
      // Use requestAnimationFrame to ensure tooltip is rendered before calculating position
      requestAnimationFrame(calculatePosition);
    }, delay) as unknown as number;
  }

  function hide() {
    clearTimeout(showTimeout);
    hideTimeout = setTimeout(() => {
      isVisible = false;
    }, 50) as unknown as number;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      hide();
    }
  }

  onMount(() => {
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    clearTimeout(showTimeout);
    clearTimeout(hideTimeout);
    window.removeEventListener('scroll', calculatePosition, true);
    window.removeEventListener('resize', calculatePosition);
    window.removeEventListener('keydown', handleKeydown);
  });

  $: themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-200 shadow-lg';

  $: arrowClasses = arrow ? 'tooltip-arrow' : '';
</script>

<div
  bind:this={triggerElement}
  class="tooltip-trigger relative inline-block"
  on:mouseenter={show}
  on:mouseleave={hide}
  on:focus={show}
  on:blur={hide}
  {...$$restProps}
>
  <slot />
</div>

{#if isVisible && text}
  <div
    bind:this={tooltipElement}
    class="tooltip-content px-2 py-1 text-sm rounded-md border transition-opacity duration-{duration} {themeClasses} {arrowClasses}"
    style={tooltipStyles}
    role="tooltip"
    aria-hidden={!isVisible}
  >
    {text}
    <slot name="content" />
    
    {#if arrow}
      <div class="tooltip-arrow-element" data-position={position}></div>
    {/if}
  </div>
{/if}

<style>
  /* Tooltip base styles */
  :global(.tooltip-trigger) {
    position: relative;
    display: inline-block;
  }
  
  :global(.tooltip-content) {
    position: fixed;
    z-index: var(--z-tooltip);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    line-height: 1.4;
    border-radius: var(--radius-md);
    transition: opacity var(--transition-fast);
    pointer-events: none;
    word-wrap: break-word;
    white-space: normal;
  }
  
  /* Arrow styles */
  :global(.tooltip-arrow-element) {
    position: absolute;
    width: 0;
    height: 0;
    border: 5px solid transparent;
  }
  
  /* Arrow positioning based on tooltip position */
  :global(.tooltip-arrow-element[data-position="top"]) {
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: var(--bg-dark);
  }
  
  :global(.tooltip-arrow-element[data-position="bottom"]) {
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: var(--bg-dark);
  }
  
  :global(.tooltip-arrow-element[data-position="left"]) {
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    border-left-color: var(--bg-dark);
  }
  
  :global(.tooltip-arrow-element[data-position="right"]) {
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    border-right-color: var(--bg-dark);
  }
  
  /* Light theme arrow colors */
  :global(.tooltip-content.bg-white .tooltip-arrow-element[data-position="top"]) {
    border-top-color: white;
  }
  
  :global(.tooltip-content.bg-white .tooltip-arrow-element[data-position="bottom"]) {
    border-bottom-color: white;
  }
  
  :global(.tooltip-content.bg-white .tooltip-arrow-element[data-position="left"]) {
    border-left-color: white;
  }
  
  :global(.tooltip-content.bg-white .tooltip-arrow-element[data-position="right"]) {
    border-right-color: white;
  }
  
  /* Animation classes */
  :global(.transition-opacity) {
    transition-property: opacity;
    transition-timing-function: ease;
  }
  
  :global(.duration-200) {
    transition-duration: 200ms;
  }
</style>
