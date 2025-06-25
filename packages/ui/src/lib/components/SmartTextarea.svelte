<script lang="ts">  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { nlpClient } from 'packages/lib/src/nlp/client';
  import type { CaseAnalysis } from 'packages/lib/src/nlp/types';
    export let value: string = '';
  export let placeholder: string = 'Start typing...';
  export let category: string = ''; // 'opening', 'closing', 'evidence_description', etc.
  export const caseId: string = '';
  export const userId: string = '';
  export let maxSuggestions: number = 5;
  export let minQueryLength: number = 2;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher();

  let inputElement: HTMLTextAreaElement;
  let suggestions: any[] = [];
  let showSuggestions = false;
  let selectedIndex = -1;
  let isLoading = false;
  let recentCases: any[] = [];
  let savedStatements: any[] = [];
  
  onMount(async () => {
    await loadData();
  });
  async function loadData() {
    if (userId) {
      // TODO: Replace with API call to /api/cases/recent
      try {
        const response = await fetch('/api/cases/recent');
        if (response.ok) {
          recentCases = await response.json();
        } else {
          recentCases = [];
        }
      } catch (error) {
        console.warn('Failed to load recent cases:', error);
        recentCases = [];
      }
    }
    if (category) {
      // TODO: Create API endpoint for saved statements
      savedStatements = [];
    }
  }

  async function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    value = target.value;
    dispatch('input', { value });

    if (value.length >= minQueryLength) {
      await generateSuggestions();
    } else {
      hideSuggestions();
    }
  }

  async function generateSuggestions() {
    isLoading = true;
    suggestions = [];

    try {
      // Get auto-completion suggestions from multiple sources
      const allSuggestions = [];

      // 1. Saved statements that match current input
      const matchingStatements = savedStatements.filter(statement => 
        statement.content.toLowerCase().includes(value.toLowerCase()) ||
        statement.title.toLowerCase().includes(value.toLowerCase())
      );

      matchingStatements.forEach(statement => {
        allSuggestions.push({
          type: 'statement',
          title: statement.title,
          content: statement.content,
          source: 'Saved Statement',
          confidence: 0.9
        });
      });

      // 2. Recent case text fragments that match
      const matchingCases = recentCases.filter(case_item => 
        case_item.description?.toLowerCase().includes(value.toLowerCase()) ||
        case_item.title.toLowerCase().includes(value.toLowerCase())
      );

      matchingCases.forEach(case_item => {
        allSuggestions.push({
          type: 'case_text',
          title: `From: ${case_item.title}`,
          content: case_item.description?.substring(0, 200) + '...',
          source: 'Recent Case',
          caseId: case_item.id,
          confidence: 0.7
        });
      });

      // 3. NLP-generated completions (simulated)
      if (value.length > 5) {
        const nlpSuggestions = await nlpClient.getCompletion(value);
        if (nlpSuggestions && nlpSuggestions.suggestion) {
          allSuggestions.push({
            type: 'nlp_completion',
            title: 'AI Suggestion',
            content: nlpSuggestions.suggestion,
            source: 'NLP Service',
            confidence: 0.5
          });
        }
      }

      // Sort and limit suggestions
      suggestions = allSuggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxSuggestions);

      showSuggestions = suggestions.length > 0;
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      isLoading = false;
    }
  }

  function hideSuggestions() {
    showSuggestions = false;
    selectedIndex = -1;
  }

  function selectSuggestion(suggestion: any) {
    value = suggestion.content;
    hideSuggestions();
    dispatch('change', { value });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (showSuggestions) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % suggestions.length;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        if (selectedIndex !== -1) {
          event.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
        }
      } else if (event.key === 'Escape') {
        hideSuggestions();
      }
    }
  }

  function handleBlur() {
    // Delay hiding so that click events on suggestions can register
    setTimeout(() => {
      hideSuggestions();
    }, 200);
  }
</script>

<div class="relative">
  <textarea
    bind:this={inputElement}
    bind:value
    {placeholder}
    {disabled}
    on:input={handleInput}
    on:keydown={handleKeydown}
    on:blur={handleBlur}
    class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
  ></textarea>

  {#if isLoading}
    <div class="absolute top-2 right-2">
      <div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {/if}

  {#if showSuggestions}
    <ul class="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
      {#each suggestions as suggestion, i}
        <li 
          role="option" 
          aria-selected={selectedIndex === i}
          class="p-2 cursor-pointer hover:bg-gray-100 {selectedIndex === i ? 'bg-gray-200' : ''}"
          on:mousedown={() => selectSuggestion(suggestion)}
          on:keydown={(e) => { if (e.key === 'Enter') selectSuggestion(suggestion) }}
          tabindex="0"
        >
          <div class="font-bold text-sm">{suggestion.title}</div>
          <div class="text-xs text-gray-600">{suggestion.content}</div>
          <div class="text-xs text-gray-400 italic">Source: {suggestion.source}</div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
