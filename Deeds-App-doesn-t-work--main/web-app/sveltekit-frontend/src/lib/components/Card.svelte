<!--
  Card Component - Flexible card container with header, body, and footer sections
  
  Props:
  - title: string (optional - card title)
  - subtitle: string (optional - card subtitle)
  - hoverable: boolean (default: true) - adds hover effects
  - clickable: boolean (default: false) - makes entire card clickable
  - padding: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
  - class: additional CSS classes
  
  Slots:
  - header: custom header content (overrides title/subtitle)
  - default: card body content
  - footer: card footer content
  - actions: action buttons in header
-->

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
    padding !== 'md' ? `card-padding-${padding}` : '',
    elevation !== 'md' ? `card-elevation-${elevation}` : '',
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
    /* Base styles are in theme.css */
  }

  .card-hoverable:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .card-clickable {
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .card-clickable:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .card-clickable:active {
    transform: translateY(0);
    box-shadow: var(--shadow-base);
  }

  /* Padding variants */
  .card-padding-none .card-body {
    padding: 0;
  }

  .card-padding-none .card-header {
    padding: 0;
  }

  .card-padding-none .card-footer {
    padding: 0;
  }

  .card-padding-sm .card-body {
    padding: var(--spacing-sm);
  }

  .card-padding-sm .card-header {
    padding: var(--spacing-sm);
  }

  .card-padding-sm .card-footer {
    padding: var(--spacing-sm);
  }

  .card-padding-lg .card-body {
    padding: var(--spacing-xl);
  }

  .card-padding-lg .card-header {
    padding: var(--spacing-xl);
  }

  .card-padding-lg .card-footer {
    padding: var(--spacing-xl);
  }

  /* Elevation variants */
  .card-elevation-none {
    box-shadow: none;
    border: 1px solid var(--color-border);
  }

  .card-elevation-sm {
    box-shadow: var(--shadow-sm);
  }

  .card-elevation-lg {
    box-shadow: var(--shadow-lg);
  }

  /* Header layout */
  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .card-header-content {
    flex: 1;
    min-width: 0; /* Allow text truncation */
  }

  .card-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }

  /* Focus styles for accessibility */
  .card-clickable:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .card-header {
      flex-direction: column;
      align-items: stretch;
    }

    .card-actions {
      justify-content: flex-end;
    }
  }

  /* Animation for smooth transitions */
  .card {
    transition: 
      transform var(--transition-normal),
      box-shadow var(--transition-normal),
      border-color var(--transition-fast);
  }

  /* Special styling for interactive states */
  .card-clickable:focus {
    border-color: var(--color-accent);
  }

  /* Content overflow handling */
  .card-body {
    overflow-wrap: break-word;
  }

  .card-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-subtitle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
