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
    `btn-${size}`,
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  function handleClick(event: MouseEvent) {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    dispatch('click', event);
  }
</script>

{#if href}
  <a
    {href}
    class={classes}
    aria-disabled={disabled || loading}
    aria-label={ariaLabel}
    role="button"
    tabindex={disabled || loading ? -1 : 0}
    on:click={handleClick}
    {...$$restProps}
  >
    {#if loading}
      <div class="btn-spinner" aria-hidden="true"></div>
    {/if}
    {#if $$slots.icon && !loading}
      <span class="btn-icon"><slot name="icon" /></span>
    {/if}
    <span class="btn-content"><slot /></span>
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
      <span class="btn-icon"><slot name="icon" /></span>
    {/if}
    <span class="btn-content"><slot /></span>
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: var(--font-family, sans-serif);
    font-weight: 600;
    border-radius: var(--btn-radius, 6px);
    border: 1px solid transparent;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s, color 0.2s;
    white-space: nowrap;
    text-decoration: none;
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-accent, #007bff);
    outline-offset: 2px;
  }

  .btn[disabled] {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Variants */
  .btn-primary {
    background-color: var(--color-primary, #007bff);
    color: var(--color-primary-contrast, #fff);
  }
  .btn-primary:hover:not([disabled]) { background-color: var(--color-primary-dark, #0056b3); }

  .btn-secondary {
    background-color: var(--color-secondary, #6c757d);
    color: var(--color-secondary-contrast, #fff);
  }
  .btn-secondary:hover:not([disabled]) { background-color: var(--color-secondary-dark, #545b62); }

  .btn-outline {
    background-color: transparent;
    border-color: var(--color-primary, #007bff);
    color: var(--color-primary, #007bff);
  }
  .btn-outline:hover:not([disabled]) {
    background-color: var(--color-primary, #007bff);
    color: var(--color-primary-contrast, #fff);
  }

  .btn-ghost {
    background-color: transparent;
    border-color: transparent;
    color: var(--color-text, #212529);
  }
  .btn-ghost:hover:not([disabled]) { background-color: rgba(0,0,0,0.05); }

  /* Sizes */
  .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
  .btn-md { padding: 0.5rem 1rem; font-size: 1rem; }
  .btn-lg { padding: 0.75rem 1.5rem; font-size: 1.25rem; }

  /* Loading state */
  .btn-loading .btn-content, .btn-loading .btn-icon {
    visibility: hidden;
  }

  .btn-spinner {
    position: absolute;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
