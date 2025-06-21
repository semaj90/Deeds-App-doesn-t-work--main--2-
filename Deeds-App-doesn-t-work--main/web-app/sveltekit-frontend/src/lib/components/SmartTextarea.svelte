<script lang="ts">  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { nlpClient } from '$lib/nlp/client.js';
  import type { CaseAnalysis } from '$lib/nlp/types.js';
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
      if (value.length > 10) {
        const nlpSuggestions = await generateNLPSuggestions(value);
        allSuggestions.push(...nlpSuggestions);
      }

      // Sort by confidence and limit
      suggestions = allSuggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxSuggestions);

      showSuggestions = suggestions.length > 0;
      selectedIndex = -1;
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      isLoading = false;
    }
  }

  async function generateNLPSuggestions(text: string): Promise<any[]> {
    // Simulate NLP-powered auto-completion
    const nlpSuggestions = [];

    // Pattern-based suggestions
    if (text.toLowerCase().includes('the defendant')) {
      nlpSuggestions.push({
        type: 'nlp',
        title: 'Legal continuation',
        content: 'the defendant was found to be in possession of',
        source: 'NLP Pattern',
        confidence: 0.8
      });
    }

    if (text.toLowerCase().includes('evidence shows')) {
      nlpSuggestions.push({
        type: 'nlp',
        title: 'Evidence statement',
        content: 'evidence shows a clear pattern of criminal behavior that',
        source: 'NLP Pattern',
        confidence: 0.8
      });
    }

    if (text.toLowerCase().includes('on the date of')) {
      nlpSuggestions.push({
        type: 'nlp',
        title: 'Date continuation',
        content: 'on the date of the incident, the suspect was observed',
        source: 'NLP Pattern',
        confidence: 0.7
      });
    }

    return nlpSuggestions;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!showSuggestions) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        break;      case 'Enter':
        if (selectedIndex >= 0) {
          event.preventDefault();
          applySuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        hideSuggestions();
        break;
    }
  }

  async function applySuggestion(suggestion: any) {
    if (suggestion.type === 'statement' || suggestion.type === 'nlp') {
      // Replace or append the suggestion content
      const cursorPosition = inputElement.selectionStart || 0;
      const beforeCursor = value.substring(0, cursorPosition);
      const afterCursor = value.substring(cursorPosition);
      
      // Smart insertion - try to complete the current sentence
      let newContent = suggestion.content;
      if (!beforeCursor.endsWith(' ') && beforeCursor.length > 0) {
        newContent = ' ' + newContent;
      }
      
      value = beforeCursor + newContent + afterCursor;
      
      // Update usage count for saved statements
      if (suggestion.type === 'statement') {
        await updateStatementUsage(suggestion);
      }
    } else if (suggestion.type === 'case_text') {
      // Offer to copy text from another case
      dispatch('moveText', {
        fromCaseId: suggestion.caseId,
        content: suggestion.content,
        suggestion
      });
    }

    hideSuggestions();
    dispatch('input', { value });
    
    // Focus back to textarea
    await tick();
    inputElement.focus();
  }

  async function updateStatementUsage(suggestion: any) {
    try {
      // This would update the database
      console.log('Updated usage for statement:', suggestion.title);
    } catch (error) {
      console.error('Error updating statement usage:', error);
    }
  }

  function hideSuggestions() {
    showSuggestions = false;
    selectedIndex = -1;
  }

  function handleBlur() {
    // Delay hiding to allow clicking on suggestions
    setTimeout(hideSuggestions, 200);
  }

  // Drag and drop handlers
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const data = event.dataTransfer!.getData('text/plain');
    
    if (data) {
      try {
        const droppedData = JSON.parse(data);
        if (droppedData.type === 'case_text') {
          value += '\n\n' + droppedData.content;
          dispatch('input', { value });
          dispatch('textDropped', droppedData);
        }
      } catch {
        // Plain text drop
        value += '\n\n' + data;
        dispatch('input', { value });
      }
    }
  }
</script>

<div class="smart-textarea-container">
  <div class="textarea-wrapper">
    <textarea
      bind:this={inputElement}
      bind:value
      {placeholder}
      {disabled}
      class="smart-textarea"
      class:loading={isLoading}
      on:input={handleInput}
      on:keydown={handleKeydown}
      on:blur={handleBlur}
      on:dragover={handleDragOver}
      on:drop={handleDrop}
      rows="6"
    ></textarea>
    
    {#if isLoading}
      <div class="loading-indicator">
        <div class="spinner"></div>
      </div>
    {/if}
  </div>

  {#if showSuggestions}
    <div class="suggestions-dropdown">
      {#each suggestions as suggestion, index}
        <button
          class="suggestion-item"
          class:selected={index === selectedIndex}
          on:click={() => applySuggestion(suggestion)}
        >
          <div class="suggestion-header">
            <span class="suggestion-title">{suggestion.title}</span>
            <span class="suggestion-source">{suggestion.source}</span>
            <span class="confidence-badge" style="background-color: {suggestion.confidence > 0.8 ? '#10b981' : suggestion.confidence > 0.6 ? '#f59e0b' : '#6b7280'}">
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </div>
          <div class="suggestion-content">
            {suggestion.content.length > 100 ? suggestion.content.substring(0, 100) + '...' : suggestion.content}
          </div>
          {#if suggestion.type === 'case_text'}
            <div class="suggestion-action">
              <small>Click to copy text from case</small>
            </div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .smart-textarea-container {
    position: relative;
    width: 100%;
  }

  .textarea-wrapper {
    position: relative;
  }

  .smart-textarea {
    width: 100%;
    min-height: 120px;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
    resize: vertical;
    transition: border-color 0.2s;
    background-color: #fff;
  }

  .smart-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .smart-textarea.loading {
    border-color: #f59e0b;
  }

  .smart-textarea:hover {
    border-color: #d1d5db;
  }

  .loading-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
  }

  .spinner {
    width: 100%;
    height: 100%;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .suggestions-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
  }

  .suggestion-item {
    width: 100%;
    padding: 12px;
    border: none;
    background: white;
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.2s;
  }

  .suggestion-item:hover,
  .suggestion-item.selected {
    background-color: #f8fafc;
  }

  .suggestion-item:last-child {
    border-bottom: none;
  }

  .suggestion-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .suggestion-title {
    font-weight: 600;
    color: #1f2937;
    flex: 1;
  }

  .suggestion-source {
    font-size: 12px;
    color: #6b7280;
  }

  .confidence-badge {
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    color: white;
  }

  .suggestion-content {
    color: #4b5563;
    font-size: 13px;
    line-height: 1.4;
  }

  .suggestion-action {
    margin-top: 4px;
    color: #3b82f6;
    font-size: 11px;
  }
</style>
