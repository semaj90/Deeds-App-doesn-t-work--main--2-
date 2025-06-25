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
      z-index: 50; /* z-tooltip */
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
    ? 'theme-dark' 
    : 'theme-light';

  $: arrowClasses = arrow ? 'tooltip-arrow' : '';
</script>

<div
  bind:this={triggerElement}
  class="tooltip-trigger"
  on:mouseenter={show}
  on:mouseleave={hide}
  on:focus={show}
  on:blur={hide}
  aria-describedby={isVisible ? 'tooltip-content' : undefined}
  {...$$restProps}
>
  <slot />
</div>

{#if isVisible && text}
  <div
    bind:this={tooltipElement}
    id="tooltip-content"
    class="tooltip-content {themeClasses} {arrowClasses}"
    style="{tooltipStyles} transition: opacity {duration}ms;"
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
  .tooltip-trigger {
    position: relative;
    display: inline-block;
  }
  
  .tooltip-content {
    position: fixed;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    line-height: 1.4;
    border-radius: 0.375rem;
    pointer-events: none;
    word-wrap: break-word;
    white-space: normal;
    opacity: 0;
    transition-property: opacity;
  }

  .tooltip-content.theme-dark {
    background-color: #111827; /* gray-900 */
    color: #ffffff;
    border: 1px solid #374151; /* gray-700 */
  }

  .tooltip-content.theme-light {
    background-color: #ffffff;
    color: #111827; /* gray-900 */
    border: 1px solid #e5e7eb; /* gray-200 */
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }

  /* Arrow styles */
  .tooltip-arrow-element {
    position: absolute;
    width: 0;
    height: 0;
    border: 5px solid transparent;
  }
  
  /* Arrow positioning based on tooltip position */
  .tooltip-arrow-element[data-position="top"] {
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .tooltip-arrow-element[data-position="bottom"] {
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .tooltip-arrow-element[data-position="left"] {
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  .tooltip-arrow-element[data-position="right"] {
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  /* Arrow colors */
  .theme-dark .tooltip-arrow-element[data-position="top"] {
    border-top-color: #111827;
  }
  .theme-dark .tooltip-arrow-element[data-position="bottom"] {
    border-bottom-color: #111827;
  }
  .theme-dark .tooltip-arrow-element[data-position="left"] {
    border-left-color: #111827;
  }
  .theme-dark .tooltip-arrow-element[data-position="right"] {
    border-right-color: #111827;
  }

  .theme-light .tooltip-arrow-element[data-position="top"] {
    border-top-color: #ffffff;
  }
  .theme-light .tooltip-arrow-element[data-position="bottom"] {
    border-bottom-color: #ffffff;
  }
  .theme-light .tooltip-arrow-element[data-position="left"] {
    border-left-color: #ffffff;
  }
  .theme-light .tooltip-arrow-element[data-position="right"] {
    border-right-color: #ffffff;
  }

  /* Show the tooltip when isVisible is true */
  .tooltip-content[aria-hidden="false"] {
    opacity: 1;
  }
</style>
