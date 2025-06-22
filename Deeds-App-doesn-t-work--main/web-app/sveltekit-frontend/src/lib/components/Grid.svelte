<!--
  Grid Component - Responsive CSS Grid layout system
  
  Props:
  - cols: number | 'auto' | 'fit' (default: 'auto') - number of columns
  - gap: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md') - grid gap size
  - minWidth: string (default: '200px') - minimum column width for auto-fit/auto-fill
  - responsive: boolean (default: true) - enable responsive behavior
  - align: 'start' | 'center' | 'end' | 'stretch' (default: 'stretch') - align items
  - justify: 'start' | 'center' | 'end' | 'stretch' (default: 'stretch') - justify items
  - class: additional CSS classes
  
  Slots:
  - default: grid items
-->

<script lang="ts">
  // Props
  export let cols: number | 'auto' | 'fit' = 'auto';
  export let gap: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let minWidth: string = '200px';
  export let responsive: boolean = true;
  export let align: 'start' | 'center' | 'end' | 'stretch' = 'stretch';
  export let justify: 'start' | 'center' | 'end' | 'stretch' = 'stretch';

  // Additional classes
  let className: string = '';
  export { className as class };

  // Computed grid template columns
  $: gridTemplateColumns = (() => {
    if (typeof cols === 'number') {
      return `repeat(${cols}, 1fr)`;
    } else if (cols === 'auto') {
      return `repeat(auto-fill, minmax(${minWidth}, 1fr))`;
    } else if (cols === 'fit') {
      return `repeat(auto-fit, minmax(${minWidth}, 1fr))`;
    }
    return 'repeat(auto-fill, minmax(200px, 1fr))';
  })();

  // Computed classes
  $: classes = [
    'grid',
    `grid-gap-${gap}`,
    responsive ? 'grid-responsive' : '',
    `grid-align-${align}`,
    `grid-justify-${justify}`,
    className
  ].filter(Boolean).join(' ');

  // Computed styles
  $: styles = [
    `grid-template-columns: ${gridTemplateColumns}`,
    `align-items: ${align}`,
    `justify-items: ${justify}`
  ].join('; ');
</script>

<div class={classes} style={styles} {...$$restProps}>
  <slot />
</div>

<style>
  .grid {
    display: grid;
  }

  /* Gap variants */
  .grid-gap-xs {
    gap: var(--spacing-xs);
  }

  .grid-gap-sm {
    gap: var(--spacing-sm);
  }

  .grid-gap-md {
    gap: var(--spacing-md);
  }

  .grid-gap-lg {
    gap: var(--spacing-lg);
  }

  .grid-gap-xl {
    gap: var(--spacing-xl);
  }

  /* Responsive behavior */
  .grid-responsive {
    width: 100%;
  }

  @media (max-width: 640px) {
    .grid-responsive {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 768px) and (min-width: 641px) {
    .grid-responsive {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
    }
  }

  /* Alignment utilities */
  .grid-align-start {
    align-items: start;
  }

  .grid-align-center {
    align-items: center;
  }

  .grid-align-end {
    align-items: end;
  }

  .grid-align-stretch {
    align-items: stretch;
  }

  .grid-justify-start {
    justify-items: start;
  }

  .grid-justify-center {
    justify-items: center;
  }

  .grid-justify-end {
    justify-items: end;
  }

  .grid-justify-stretch {
    justify-items: stretch;
  }

  /* Grid item utilities that can be applied to children */
  :global(.grid-item-span-2) {
    grid-column: span 2;
  }

  :global(.grid-item-span-3) {
    grid-column: span 3;
  }

  :global(.grid-item-span-4) {
    grid-column: span 4;
  }

  :global(.grid-item-span-full) {
    grid-column: 1 / -1;
  }

  :global(.grid-item-row-span-2) {
    grid-row: span 2;
  }

  :global(.grid-item-row-span-3) {
    grid-row: span 3;
  }

  /* Responsive grid item spans */
  @media (max-width: 768px) {
    :global(.grid-item-span-2),
    :global(.grid-item-span-3),
    :global(.grid-item-span-4) {
      grid-column: span 1;
    }
  }

  /* Auto-sizing behavior */
  .grid {
    min-height: 0; /* Allow grid to shrink */
    min-width: 0;
  }

  :global(.grid > *) {
    min-width: 0; /* Prevent grid items from overflowing */
    min-height: 0;
  }

  /* Dense packing for better space utilization */
  .grid {
    grid-auto-flow: row dense;
  }

  /* Equal height rows */
  .grid {
    grid-auto-rows: 1fr;
  }

  /* Override for content-sized rows */
  :global(.grid-auto-rows) {
    grid-auto-rows: auto !important;
  }

  /* Masonry-like behavior for varying content heights */
  :global(.grid-masonry) {
    grid-auto-rows: auto;
    align-items: start;
  }

  /* Accessibility improvements */
  .grid {
    /* Ensure keyboard navigation works properly */
    container-type: inline-size;
  }

  /* Print styles */
  @media print {
    .grid-responsive {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: var(--spacing-sm);
    }
  }
</style>
