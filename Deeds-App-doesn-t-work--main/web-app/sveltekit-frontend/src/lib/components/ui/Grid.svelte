<script lang="ts">
  // Props
  export let cols: number = 1;
  export let gap: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let responsive: boolean = true;
  export let minItemWidth: string = '250px';
  export let autoFit: boolean = false;
  export let autoFill: boolean = false;

  // Gap styles
  const gaps = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  // Generate grid template columns
  $: gridTemplateColumns = (() => {
    if (autoFit) {
      return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`;
    }
    if (autoFill) {
      return `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`;
    }
    return `repeat(${cols}, minmax(0, 1fr))`;
  })();

  // Responsive classes
  $: responsiveClasses = responsive ? [
    'grid-cols-1',
    'md:grid-cols-2',
    cols >= 3 ? 'lg:grid-cols-3' : '',
    cols >= 4 ? 'xl:grid-cols-4' : '',
    cols >= 6 ? '2xl:grid-cols-6' : ''
  ].filter(Boolean).join(' ') : '';

  $: classes = [
    'grid',
    gaps[gap],
    !autoFit && !autoFill ? responsiveClasses : ''
  ].filter(Boolean).join(' ');
</script>

<div
  class={classes}
  style={autoFit || autoFill ? `grid-template-columns: ${gridTemplateColumns}` : ''}
  {...$$restProps}
>
  <slot />
</div>

<style>
  /* Enhanced grid styles using CSS variables */
  :global(.grid) {
    display: grid;
  }
  
  /* Gap utilities */
  :global(.gap-2) {
    gap: var(--space-2);
  }
  
  :global(.gap-4) {
    gap: var(--space-4);
  }
  
  :global(.gap-6) {
    gap: var(--space-6);
  }
  
  :global(.gap-8) {
    gap: var(--space-8);
  }
  
  /* Grid column utilities */
  :global(.grid-cols-1) {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  :global(.grid-cols-2) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  :global(.grid-cols-3) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  
  :global(.grid-cols-4) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  
  :global(.grid-cols-6) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  
  /* Responsive grid utilities */
  @media (min-width: 768px) {
    :global(.md\\:grid-cols-2) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    :global(.md\\:grid-cols-3) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    :global(.md\\:grid-cols-4) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  
  @media (min-width: 1024px) {
    :global(.lg\\:grid-cols-3) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    :global(.lg\\:grid-cols-4) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    :global(.lg\\:grid-cols-6) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
  
  @media (min-width: 1280px) {
    :global(.xl\\:grid-cols-4) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    :global(.xl\\:grid-cols-6) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
  
  @media (min-width: 1536px) {
    :global(.\\32 xl\\:grid-cols-6) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
</style>
