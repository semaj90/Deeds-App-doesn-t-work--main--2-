<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let href: string | undefined = undefined;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let fullWidth: boolean = false;
  export let icon: string | undefined = undefined;
  export let iconPosition: 'left' | 'right' = 'left';

  const dispatch = createEventDispatcher();

  // Variant styles
  const variants = {
    primary: 'bg-primary-gold text-white hover:bg-hover-primary focus:ring-primary-gold border-transparent',
    secondary: 'bg-transparent text-primary-navy border-primary-navy hover:bg-primary-navy hover:text-white focus:ring-primary-navy',
    success: 'bg-accent-success text-white hover:bg-green-600 focus:ring-accent-success border-transparent',
    warning: 'bg-accent-warning text-white hover:bg-yellow-600 focus:ring-accent-warning border-transparent',
    error: 'bg-accent-error text-white hover:bg-red-600 focus:ring-accent-error border-transparent',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-secondary hover:text-text-primary focus:ring-primary-silver border-transparent'
  };

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  $: classes = [
    'btn-base',
    'inline-flex items-center justify-center',
    'font-medium border transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    loading ? 'opacity-75 cursor-wait' : ''
  ].filter(Boolean).join(' ');

  function handleClick(event: Event) {
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
    class:opacity-50={disabled}
    class:cursor-not-allowed={disabled}
    on:click={handleClick}
    {...$$restProps}
  >
    {#if loading}
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {:else if icon && iconPosition === 'left'}
      <span class="mr-2 text-base">{icon}</span>
    {/if}
    
    <slot />
    
    {#if icon && iconPosition === 'right'}
      <span class="ml-2 text-base">{icon}</span>
    {/if}
  </a>
{:else}
  <button
    {type}
    {disabled}
    class={classes}
    on:click={handleClick}
    {...$$restProps}
  >
    {#if loading}
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {:else if icon && iconPosition === 'left'}
      <span class="mr-2 text-base">{icon}</span>
    {/if}
    
    <slot />
    
    {#if icon && iconPosition === 'right'}
      <span class="ml-2 text-base">{icon}</span>
    {/if}
  </button>
{/if}

<style>
  /* Custom button styles using CSS variables */
  :global(.btn-base) {
    background-color: var(--primary-gold);
    color: var(--text-inverse);
    border-color: transparent;
  }
  
  :global(.btn-base:hover) {
    background-color: var(--hover-primary);
  }
  
  :global(.btn-base:focus) {
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  
  /* Animation for spinner */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }
</style>
