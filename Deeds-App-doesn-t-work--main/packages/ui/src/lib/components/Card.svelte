<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let title: string | undefined = undefined;
  export let subtitle: string | undefined = undefined;
  export let hoverable: boolean = true;
  export let clickable: boolean = false;
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let elevation: 'none' | 'sm' | 'md' | 'lg' = 'md';

  // Additional classes
  let className: string = '';
  export { className as class };

  const dispatch = createEventDispatcher();

  // Computed classes
  $: classes = [
    'card',
    hoverable ? 'card-hoverable' : '',
    clickable ? 'card-clickable' : '',
    `card-padding-${padding}`,
    `card-elevation-${elevation}`,
    className
  ].filter(Boolean).join(' ');

  // Handle card click
  function handleClick(event: MouseEvent) {
    if (clickable) {
      dispatch('click', event);
    }
  }

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
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
  on:keydown={handleKeydown}
  {...$$restProps}
>
  {#if $$slots.header || title || subtitle || $$slots.actions}
    <div class="card-header">
      {#if $$slots.header}
        <slot name="header" />
      {:else}
        <div class="card-header-content">
          {#if title}
            <h3 class="card-title">{title}</h3>
          {/if}
          {#if subtitle}
            <p class="card-subtitle">{subtitle}</p>
          {/if}
        </div>
        {#if $$slots.actions}
          <div class="card-actions">
            <slot name="actions" />
          </div>
        {/if}
      {/if}
    </div>
  {/if}

  {#if $$slots.default}
    <div class="card-body">
      <slot />
    </div>
  {/if}

  {#if $$slots.footer}
    <div class="card-footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .card {
    background-color: var(--card-bg, #ffffff);
    border: 1px solid var(--card-border-color, #e0e0e0);
    border-radius: var(--card-border-radius, 8px);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    font-family: var(--font-family, sans-serif);
  }

  .card-hoverable:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg, 0 8px 16px rgba(0,0,0,0.1));
  }

  .card-clickable {
    cursor: pointer;
  }

  .card-clickable:focus-visible {
    outline: 2px solid var(--color-accent, #007bff);
    outline-offset: 2px;
  }

  /* Padding variants */
  .card-padding-none .card-body, .card-padding-none .card-header, .card-padding-none .card-footer { padding: 0; }
  .card-padding-sm .card-body, .card-padding-sm .card-header, .card-padding-sm .card-footer { padding: 0.5rem; }
  .card-padding-md .card-body, .card-padding-md .card-header, .card-padding-md .card-footer { padding: 1rem; }
  .card-padding-lg .card-body, .card-padding-lg .card-header, .card-padding-lg .card-footer { padding: 1.5rem; }

  /* Elevation variants */
  .card-elevation-none { box-shadow: none; }
  .card-elevation-sm { box-shadow: var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.05)); }
  .card-elevation-md { box-shadow: var(--shadow-md, 0 4px 8px rgba(0,0,0,0.1)); }
  .card-elevation-lg { box-shadow: var(--shadow-lg, 0 8px 16px rgba(0,0,0,0.1)); }

  /* Header */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid var(--card-border-color, #e0e0e0);
  }

  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .card-subtitle {
    font-size: 0.875rem;
    color: #6c757d;
    margin: 0;
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
  }

  /* Body */
  .card-body {
    overflow-wrap: break-word;
  }

  /* Footer */
  .card-footer {
    border-top: 1px solid var(--card-border-color, #e0e0e0);
    color: #6c757d;
    font-size: 0.875rem;
  }
</style>
