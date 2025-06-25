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
    sm: 'star-sm',
    md: 'star-md', 
    lg: 'star-lg'
  };
</script>

<div class="attractiveness-meter">
  <div class="meter-header">
    <label class="meter-label">{label}:</label>
    <span class="score-badge">{displayScore}/10</span>
    {#if showDescription}
      <span class="description">({descriptions[displayScore]})</span>
    {/if}
  </div>
  
  <div class="stars-container">
    {#each Array(10) as _, i}
      {@const rating = i + 1}
      {@const isActive = rating <= displayScore}
      {@const isHovered = hoveredScore !== null && rating <= hoveredScore}
      
      <button
        type="button"
        class="star-button {sizeClasses[size]}"
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
          class="star-icon"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      </button>
    {/each}
  </div>
  
  {#if !readOnly}
    <div class="range-container">
      <input
        type="range"
        min="1"
        max="10"
        bind:value={score}
        on:input={() => dispatch('change', { score })}
        class="score-range"
      />
    </div>
  {/if}
</div>

<style>
  .attractiveness-meter {
    margin: 0.5rem 0;
  }
  
  .meter-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .meter-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
  }
  
  .score-badge {
    background: #3b82f6;
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .description {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .stars-container {
    display: flex;
    gap: 0.25rem;
  }
  
  .star-button {
    background: transparent;
    border: none;
    padding: 0;
    color: #d1d5db;
    transition: all 0.2s;
    cursor: pointer;
  }
  
  .star-button:disabled {
    cursor: default;
    opacity: 0.7;
  }
  
  .star-button:not(:disabled):hover {
    transform: scale(1.1);
  }
  
  .star-button.active {
    color: #fbbf24;
  }
  
  .star-button.hovered {
    color: #fde047;
  }
  
  .star-button:not(.active):hover {
    color: #fef3c7;
  }
  
  .star-icon {
    width: 100%;
    height: 100%;
  }
  
  .star-sm {
    width: 1rem;
    height: 1rem;
  }
  
  .star-md {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .star-lg {
    width: 2rem;
    height: 2rem;
  }
  
  .range-container {
    margin-top: 0.5rem;
  }
  
  .score-range {
    width: 100%;
    height: 0.25rem;
    background: #e5e7eb;
    outline: none;
    border-radius: 9999px;
  }
  
  .score-range::-webkit-slider-thumb {
    appearance: none;
    width: 1rem;
    height: 1rem;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
  }
  
  .score-range::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
</style>
