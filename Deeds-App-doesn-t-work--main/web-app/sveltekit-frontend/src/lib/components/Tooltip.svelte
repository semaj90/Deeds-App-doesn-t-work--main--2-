<!--
  Tooltip Component - Accessible tooltip with configurable positioning
  
  Props:
  - text: string - tooltip text content
  - position: 'top' | 'bottom' | 'left' | 'right' (default: 'top') - tooltip position
  - delay: number (default: 500) - delay before showing tooltip in ms
  - disabled: boolean (default: false) - disable tooltip
  - maxWidth: string (default: '200px') - maximum tooltip width
  - class: additional CSS classes
  
  Slots:
  - default: element that triggers the tooltip
  - content: custom tooltip content (overrides text prop)
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  // Props
  export let text: string = '';
  export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  export let delay: number = 500;
  export let disabled: boolean = false;
  export let maxWidth: string = '200px';
  export let offset: number = 8;

  // Additional classes
  let className: string = '';
  export { className as class };

  const dispatch = createEventDispatcher();

  // State
  let visible = false;
  let triggerElement: HTMLElement;
  let tooltipElement: HTMLElement;
  let showTimeout: NodeJS.Timeout | null = null;
  let hideTimeout: NodeJS.Timeout | null = null;
  let mounted = false;

  // Computed classes
  $: classes = [
    'tooltip-wrapper',
    className
  ].filter(Boolean).join(' ');

  $: tooltipClasses = [
    'tooltip-content',
    `tooltip-${position}`,
    visible ? 'tooltip-visible' : ''
  ].filter(Boolean).join(' ');

  onMount(() => {
    mounted = true;
    return () => {
      clearTimeouts();
    };
  });

  function clearTimeouts() {
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  function show() {
    if (disabled || !mounted) return;

    clearTimeouts();
    hideTimeout = null;

    showTimeout = setTimeout(() => {
      visible = true;
      dispatch('show');
      updatePosition();
    }, delay);
  }

  function hide() {
    if (!mounted) return;

    clearTimeouts();
    showTimeout = null;

    // Small delay for hiding to prevent flickering
    hideTimeout = setTimeout(() => {
      visible = false;
      dispatch('hide');
    }, 100);
  }

  function updatePosition() {
    if (!triggerElement || !tooltipElement || !visible) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let left = 0;
    let top = 0;

    switch (position) {
      case 'top':
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        top = triggerRect.top - tooltipRect.height - offset;
        break;
      case 'bottom':
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        top = triggerRect.bottom + offset;
        break;
      case 'left':
        left = triggerRect.left - tooltipRect.width - offset;
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'right':
        left = triggerRect.right + offset;
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(8, Math.min(left, viewport.width - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, viewport.height - tooltipRect.height - 8));

    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${top}px`;
  }

  function handleMouseEnter() {
    show();
  }

  function handleMouseLeave() {
    hide();
  }

  function handleFocus() {
    show();
  }

  function handleBlur() {
    hide();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && visible) {
      hide();
    }
  }

  // Generate unique ID for accessibility
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
</script>

<svelte:window on:scroll={updatePosition} on:resize={updatePosition} />

<div 
  class={classes}
  bind:this={triggerElement}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:focus={handleFocus}
  on:blur={handleBlur}
  on:keydown={handleKeydown}
  aria-describedby={visible ? tooltipId : undefined}
  {...$$restProps}
>
  <slot />
</div>

{#if mounted}
  <div
    bind:this={tooltipElement}
    class={tooltipClasses}
    style="max-width: {maxWidth};"
    role="tooltip"
    id={tooltipId}
    aria-hidden={!visible}
  >
    {#if $$slots.content}
      <slot name="content" />
    {:else}
      {text}
    {/if}
    <div class="tooltip-arrow" />
  </div>
{/if}

<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-block;
  }

  .tooltip-content {
    position: fixed;
    z-index: var(--z-index-tooltip);
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-tertiary);
    color: var(--color-text);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-md);
    opacity: 0;
    visibility: hidden;
    transform: scale(0.95);
    transition: 
      opacity var(--transition-fast),
      visibility var(--transition-fast),
      transform var(--transition-fast);
    pointer-events: none;
    word-wrap: break-word;
    hyphens: auto;
    line-height: var(--line-height-tight);
  }

  .tooltip-visible {
    opacity: 1;
    visibility: visible;
    transform: scale(1);
  }

  .tooltip-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: var(--color-tertiary);
    border: 1px solid var(--color-border);
    transform: rotate(45deg);
  }

  /* Arrow positioning for different positions */
  .tooltip-top .tooltip-arrow {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-top: none;
    border-left: none;
  }

  .tooltip-bottom .tooltip-arrow {
    top: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-bottom: none;
    border-right: none;
  }

  .tooltip-left .tooltip-arrow {
    right: -5px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-left: none;
    border-bottom: none;
  }

  .tooltip-right .tooltip-arrow {
    left: -5px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-right: none;
    border-top: none;
  }

  /* Dark theme adjustments */
  [data-theme="gothic"] .tooltip-content {
    background-color: var(--color-secondary);
    border-color: var(--color-border);
    box-shadow: var(--shadow-gothic-md);
  }

  [data-theme="gothic"] .tooltip-arrow {
    background-color: var(--color-secondary);
    border-color: var(--color-border);
  }

  /* Animation variants */
  .tooltip-top {
    transform-origin: bottom center;
  }

  .tooltip-bottom {
    transform-origin: top center;
  }

  .tooltip-left {
    transform-origin: right center;
  }

  .tooltip-right {
    transform-origin: left center;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .tooltip-content {
      max-width: calc(100vw - 32px) !important;
      font-size: var(--font-size-sm);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .tooltip-content {
      border-width: 2px;
      font-weight: var(--font-weight-semibold);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .tooltip-content {
      transition: opacity 0.1s ease, visibility 0.1s ease;
      transform: none !important;
    }

    .tooltip-visible {
      transform: none !important;
    }
  }

  /* Print styles */
  @media print {
    .tooltip-content {
      display: none !important;
    }
  }

  /* Focus indicators for accessibility */
  .tooltip-wrapper:focus-within .tooltip-content {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* Improved readability */
  .tooltip-content {
    text-align: center;
    white-space: pre-line;
  }

  /* Handle long text gracefully */
  .tooltip-content {
    overflow-wrap: break-word;
    word-break: break-word;
  }
</style>
