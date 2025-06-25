<script lang="ts">
  // Props
  export let cols: number | string = 'auto'; // number or CSS grid-template-columns value
  export let gap: string = '1rem'; // CSS gap value
  export let minWidth: string = '250px';
  export let align: 'start' | 'center' | 'end' | 'stretch' = 'stretch';
  export let justify: 'start' | 'center' | 'end' | 'stretch' = 'stretch';

  let className: string = '';
  export { className as class };

  $: gridStyle = [
    `--grid-gap: ${gap}`,
    `--grid-align-items: ${align}`,
    `--grid-justify-items: ${justify}`,
    `--grid-template-columns: ${typeof cols === 'number' ? `repeat(${cols}, 1fr)` : cols === 'auto' ? `repeat(auto-fit, minmax(${minWidth}, 1fr))` : cols}`
  ].join('; ');

</script>

<div class="grid {className}" style={gridStyle} {...$$restProps}>
  <slot />
</div>

<style>
  .grid {
    display: grid;
    gap: var(--grid-gap, 1rem);
    align-items: var(--grid-align-items, stretch);
    justify-items: var(--grid-justify-items, stretch);
    grid-template-columns: var(--grid-template-columns, repeat(auto-fit, minmax(250px, 1fr)));
  }

  /* Global utilities for grid items */
  :global(.grid-item-span-2) { grid-column: span 2; }
  :global(.grid-item-span-3) { grid-column: span 3; }
  :global(.grid-item-span-full) { grid-column: 1 / -1; }

  @media (max-width: 768px) {
    :global(.grid-item-span-2), :global(.grid-item-span-3) {
      grid-column: span 1;
    }
  }
</style>
