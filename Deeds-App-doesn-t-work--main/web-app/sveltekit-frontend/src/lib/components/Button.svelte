<!--
  Button Component - Reusable button with multiple variants and sizes
  
  Props:
  - variant: 'primary' | 'secondary' | 'outline' | 'ghost' (default: 'primary')
  - size: 'sm' | 'md' | 'lg' (default: 'md')
  - disabled: boolean (default: false)
  - loading: boolean (default: false)
  - href: string (optional - makes it a link)
  - type: 'button' | 'submit' | 'reset' (default: 'button')
  - class: additional CSS classes
  
  Slots:
  - default: button content
  - icon: optional icon slot
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let href: string | undefined = undefined;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let ariaLabel: string | undefined = undefined;

  // Additional classes
  let className: string = '';
  export { className as class };

  const dispatch = createEventDispatcher();

  // Computed classes
  $: classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  // Handle click events
  function handleClick(event: MouseEvent) {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    dispatch('click', event);
  }

  // Handle keyboard events
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      handleClick(event as any);
    }
  }
</script>

{#if href}
  <a
    {href}
    class={classes}
    class:disabled
    aria-label={ariaLabel}
    role="button"
    tabindex={disabled ? -1 : 0}
    on:click={handleClick}
    on:keydown={handleKeydown}
    {...$$restProps}
  >
    {#if loading}
      <div class="btn-spinner" aria-hidden="true"></div>
    {/if}
    {#if $$slots.icon && !loading}
      <span class="btn-icon">
        <slot name="icon" />
      </span>
    {/if}
    <slot />
  </a>
{:else}
  <button
    {type}
    class={classes}
    {disabled}
    aria-label={ariaLabel}
    on:click={handleClick}
    {...$$restProps}
  >
    {#if loading}
      <div class="btn-spinner" aria-hidden="true"></div>
    {/if}
    {#if $$slots.icon && !loading}
      <span class="btn-icon">
        <slot name="icon" />
      </span>
    {/if}
    <slot />
  </button>
{/if}

<style>
  .btn {
    /* Base styles are in theme.css */
    position: relative;
  }

  .btn-loading {
    color: transparent !important;
  }

  .btn-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .disabled {
    pointer-events: none;
  }

  @keyframes spin {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  /* Focus styles for accessibility */
  .btn:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* Icon alignment adjustments */
  .btn:has(.btn-icon) {
    padding-left: calc(var(--spacing-sm) * 0.75);
  }

  .btn-sm:has(.btn-icon) {
    padding-left: calc(var(--spacing-xs) * 0.75);
  }

  .btn-lg:has(.btn-icon) {
    padding-left: calc(var(--spacing-md) * 0.75);
  }
</style>
