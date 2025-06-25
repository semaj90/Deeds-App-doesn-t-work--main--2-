<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let score: number = 5; // Current attractiveness score (1-10)
  export let label: string = 'Attractiveness Rating';
  export let readOnly: boolean = false;
  export let showDescription: boolean = true;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  const dispatch = createEventDispatcher();
  
  let hoveredScore: number | null = null;
  
  const descriptions: Record<number, string> = {
    1: 'Very Low',
    2: 'Low', 
    3: 'Below Average',
    4: 'Slightly Below Average',
    5: 'Average',
    6: 'Slightly Above Average',
    7: 'Above Average',
    8: 'High',
    9: 'Very High',
    10: 'Exceptional'
  };
  
  function handleRatingClick(rating: number) {
    if (!readOnly) {
      score = rating;
      dispatch('change', { score });
    }
  }
  
  function handleMouseEnter(rating: number) {
    if (!readOnly) {
      hoveredScore = rating;
    }
  }
  
  function handleMouseLeave() {
    hoveredScore = null;
  }
  
  $: displayScore = hoveredScore !== null ? hoveredScore : score;
  $: sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };
</script>

<div class="attractiveness-meter">
  <div class="flex items-center gap-2 mb-2">
    <label class="font-semibold text-sm text-gray-700">{label}:</label>
    <span class="badge badge-primary badge-sm">{displayScore}/10</span>
    {#if showDescription}
      <span class="text-xs text-gray-500">({descriptions[displayScore]})</span>
    {/if}
  </div>
  
  <div class="flex gap-1">
    {#each Array(10) as _, i}
      {@const rating = i + 1}
      {@const isActive = rating <= displayScore}
      {@const isHovered = hoveredScore !== null && rating <= hoveredScore}
      
      <button
        type="button"
        class="star-button {sizeClasses[size]} transition-all duration-200 {readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}"
        class:active={isActive}
        class:hovered={isHovered}
        disabled={readOnly}
        on:click={() => handleRatingClick(rating)}
        on:mouseenter={() => handleMouseEnter(rating)}
        on:mouseleave={handleMouseLeave}
        aria-label="Rate {rating} out of 10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          stroke-width="2"
          class="w-full h-full"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      </button>
    {/each}
  </div>
  
  {#if !readOnly}
    <div class="mt-2">
      <input
        type="range"
        min="1"
        max="10"
        bind:value={score}
        on:input={() => dispatch('change', { score })}
        class="range range-primary range-sm"
      />
    </div>
  {/if}
</div>

<style>
  .star-button {
    @apply text-gray-300 border-none bg-transparent p-0;
  }
  
  .star-button.active {
    @apply text-yellow-400;
  }
  
  .star-button.hovered {
    @apply text-yellow-300;
  }
  
  .star-button:not(.active):hover {
    @apply text-yellow-200;
  }
  
  .star-button:disabled {
    @apply opacity-70;
  }
</style>
