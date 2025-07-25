<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { loading, motion } from '$lib/stores/ui';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  export let variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'info' = 'primary';
  export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let disabled = false;
  export let loadingKey: string | undefined = undefined;
  export let href: string | undefined = undefined;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let fullWidth = false;
  export let icon: string | undefined = undefined;
  export let iconPosition: 'left' | 'right' = 'left';
  
  const dispatch = createEventDispatcher();
  
  $: isLoading = loadingKey ? $loading[loadingKey] : false;
  $: isDisabled = disabled || isLoading;
  
  const handleClick = (event: MouseEvent) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    dispatch('click', event);
  };
  
  // Dynamic classes using UnoCSS
  $: baseClasses = `
    inline-flex items-center justify-center gap-2 font-medium rounded-lg
    transition-all duration-200 ease-out focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;
  
  $: variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
    ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm hover:shadow-md',
    success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500 shadow-sm hover:shadow-md',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus-visible:ring-yellow-500 shadow-sm hover:shadow-md',
    info: 'bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:ring-cyan-500 shadow-sm hover:shadow-md'
  }[variant];
  
  $: sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  }[size];
  
  $: classes = `${baseClasses} ${variantClasses} ${sizeClasses}`;
</script>

{#if href}
  <a 
    {href}
    class={classes}
    class:opacity-50={isDisabled}
    on:click={handleClick}
    {...$$restProps}
  >
    {#if icon && iconPosition === 'left'}
      <i class={icon} aria-hidden="true"></i>
    {/if}
    
    {#if isLoading}
      <div 
        class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        aria-hidden="true"
        in:scale={{ duration: $motion.reduceMotion ? 0 : 200, easing: quintOut }}
      ></div>
    {/if}
    
    <slot />
    
    {#if icon && iconPosition === 'right'}
      <i class={icon} aria-hidden="true"></i>
    {/if}
  </a>
{:else}
  <button
    {type}
    class={classes}
    disabled={isDisabled}
    on:click={handleClick}
    {...$$restProps}
  >
    {#if icon && iconPosition === 'left'}
      <i class={icon} aria-hidden="true"></i>
    {/if}
    
    {#if isLoading}
      <div 
        class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        aria-hidden="true"
        in:scale={{ duration: $motion.reduceMotion ? 0 : 200, easing: quintOut }}
      ></div>
    {/if}
    
    <slot />
    
    {#if icon && iconPosition === 'right'}
      <i class={icon} aria-hidden="true"></i>
    {/if}
  </button>
{/if}
