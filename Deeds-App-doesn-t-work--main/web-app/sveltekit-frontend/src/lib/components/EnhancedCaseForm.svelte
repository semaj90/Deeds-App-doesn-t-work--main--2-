<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import SmartTextarea from '$lib/components/SmartTextarea.svelte';
  import CaseRelationshipAnalyzer from '$lib/components/CaseRelationshipAnalyzer.svelte';  import { caseWorkflowManager, getStateColor, getStateLabel, type CaseState } from '$lib/stores/caseStateMachine';
  import { nlpClient } from '$lib/nlp/client.js';
  import type { CaseAnalysis } from '$lib/nlp/types.js';
  import type { Book } from '$lib/data/types';

  export let existingCase: any = null;
  export let isEditing = false;

  const dispatch = createEventDispatcher();

  // Form data
  let title = existingCase?.title || '';
  let description = existingCase?.description || '';
  let caseType = existingCase?.data?.caseType || '';
  let priority = existingCase?.data?.priority || 'medium';
  let tags: string[] = existingCase?.tags || [];
  let newTag = '';
  
  // Smart features
  let isAnalyzing = false;
  let analysisResults: any = null;
  let showTemplates = false;
  let availableTemplates: any[] = [];
  let selectedTemplate: any = null;
  let recentCases: any[] = [];
  let autoSaveEnabled = true;
  let lastSaved = '';
  
  // State management
  let currentState: CaseState = existingCase?.data?.state || 'draft';
  let availableTransitions: string[] = [];
  
  // Case relationship features
  let caseId = existingCase?.id || '';
  let userId = $page.data.session?.user?.id || '';
  let showRelationshipAnalyzer = false;

  onMount(async () => {
    await loadInitialData();
    updateAvailableTransitions();
    
    if (description && description.length > 20) {
      analyzeDescription();
    }
  });

  async function loadInitialData() {
    try {      // Load recent cases for reference
      if (userId) {
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

      // Load available templates
      availableTemplates = await fetch('/api/case-templates').then(r => r.json()).catch(() => []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  function updateAvailableTransitions() {
    if (isEditing && caseId) {
      availableTransitions = caseWorkflowManager.getAvailableTransitions(caseId, currentState);
    }
  }

  async function analyzeDescription() {
    if (!description || description.length < 20) return;

    isAnalyzing = true;
    showRelationshipAnalyzer = true;

    try {
      analysisResults = await nlpClient.analyzeCaseDescription(description, caseId);
      
      // Auto-suggest tags based on analysis
      if (analysisResults.entities) {
        const suggestedTags = analysisResults.entities
          .filter((e: any) => e.type === 'crime' || e.type === 'location')
          .map((e: any) => e.value)
          .filter((tag: string) => !tags.includes(tag));
        
        if (suggestedTags.length > 0) {
          // Show tag suggestions
          console.log('Suggested tags:', suggestedTags);
        }
      }

      // Auto-suggest case type
      if (analysisResults.predictions && !caseType) {
        caseType = analysisResults.predictions.category;
      }

    } catch (error) {
      console.error('Error analyzing description:', error);
    } finally {
      isAnalyzing = false;
    }
  }

  function applyTemplate(template: any) {
    if (template.template) {
      // Apply template fields
      title = template.template.title || title;
      description = template.template.description || description;
      caseType = template.caseType || caseType;
      priority = template.template.priority || priority;
      
      if (template.template.tags) {
        tags = [...tags, ...template.template.tags.filter((tag: string) => !tags.includes(tag))];
      }
    }
    
    selectedTemplate = template;
    showTemplates = false;
  }

  function addTag() {
    if (newTag && !tags.includes(newTag)) {
      tags = [...tags, newTag];
      newTag = '';
    }
  }

  function removeTag(tagToRemove: string) {
    tags = tags.filter(tag => tag !== tagToRemove);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && event.target === event.currentTarget) {
      event.preventDefault();
      addTag();
    }
  }

  function handleStateTransition(newState: CaseState) {
    if (caseWorkflowManager.canTransition(caseId, currentState, newState as any)) {
      currentState = newState;
      updateAvailableTransitions();
      
      // This would normally update the database
      console.log(`Case state changed to: ${newState}`);
    }
  }

  function handleTextMove(event: CustomEvent) {
    const { fromCaseId, content, suggestion } = event.detail;
    
    // Add moved text to description
    description += '\n\n[Moved from Case ' + fromCaseId.slice(0, 8) + ']\n' + content;
    
    // Log the text move event
    console.log('Text moved from case:', fromCaseId);
  }

  function handleRelationshipEvent(event: CustomEvent) {
    const { type, detail } = event;
    
    if (type === 'generateSummary') {
      // Navigate to relationship summary page or open modal
      dispatch('showRelationshipSummary', detail);
    } else if (type === 'suggestMerge') {
      // Show merge suggestion modal
      dispatch('showMergeDialog', detail);
    }
  }

  // Auto-save functionality
  let saveTimeout: any;
  function handleAutoSave() {
    if (!autoSaveEnabled || !isEditing) return;
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        await fetch(`/api/cases/${caseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            tags,
            data: { caseType, priority, state: currentState }
          })
        });
        lastSaved = new Date().toLocaleTimeString();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000);
  }

  // Watch for changes to trigger auto-save
  $: if (title || description || tags || caseType || priority) {
    handleAutoSave();
  }

  $: formData = {
    title,
    description,
    tags: JSON.stringify(tags),
    data: JSON.stringify({
      caseType,
      priority,
      state: currentState,
      analysis: analysisResults
    })
  };
</script>

<div class="enhanced-case-form">
  <div class="form-header">
    <div class="header-content">
      <h2>{isEditing ? 'Edit Case' : 'Create New Case'}</h2>
      {#if isEditing}
        <div class="case-state">
          <span class="state-label">Status:</span>
          <span class="state-badge {getStateColor(currentState)}">
            {getStateLabel(currentState)}
          </span>
        </div>
      {/if}
    </div>
    
    <div class="header-actions">
      {#if autoSaveEnabled && lastSaved}
        <small class="auto-save-indicator">Last saved: {lastSaved}</small>
      {/if}
      
      <button 
        type="button" 
        class="btn btn-outline btn-sm"
        on:click={() => showTemplates = !showTemplates}
      >
        📋 Templates
      </button>
      
      {#if description.length > 20}
        <button 
          type="button" 
          class="btn btn-outline btn-sm"
          class:loading={isAnalyzing}
          on:click={analyzeDescription}
        >
          🧠 Analyze
        </button>
      {/if}
    </div>
  </div>

  {#if showTemplates && availableTemplates.length > 0}
    <div class="templates-panel">
      <h3>Case Templates</h3>
      <div class="templates-grid">
        {#each availableTemplates as template}
          <button 
            class="template-card"
            class:selected={selectedTemplate?.id === template.id}
            on:click={() => applyTemplate(template)}
          >
            <div class="template-name">{template.name}</div>
            <div class="template-description">{template.description}</div>
            <div class="template-type">{template.caseType}</div>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <form 
    method="POST" 
    use:enhance
    class="case-form"
  >
    <div class="form-grid">
      <div class="form-section">
        <label for="title" class="form-label">Case Title</label>
        <input
          id="title"
          name="title"
          type="text"
          bind:value={title}
          placeholder="Enter case title..."
          class="form-input"
          required
        />
      </div>

      <div class="form-section">
        <label for="caseType" class="form-label">Case Type</label>
        <select id="caseType" name="caseType" bind:value={caseType} class="form-select">
          <option value="">Select type...</option>
          <option value="violent_crime">Violent Crime</option>
          <option value="property_crime">Property Crime</option>
          <option value="drug_offense">Drug Offense</option>
          <option value="white_collar">White Collar</option>
          <option value="domestic_violence">Domestic Violence</option>
          <option value="cybercrime">Cybercrime</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-section">
        <label for="priority" class="form-label">Priority</label>
        <select id="priority" name="priority" bind:value={priority} class="form-select">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
    </div>

    <div class="form-section">
      <label for="description" class="form-label">Case Description</label>
      <SmartTextarea
        bind:value={description}
        placeholder="Describe the case details. Start typing for smart suggestions..."
        category="case_description"
        {caseId}
        {userId}
        on:input={analyzeDescription}
        on:moveText={handleTextMove}
      />
    </div>

    <div class="form-section">
      <label for="tags-input" class="form-label">Tags</label>
      <div class="tags-input">
        <div class="tags-list">
          {#each tags as tag}
            <span class="tag">
              {tag}
              <button type="button" class="tag-remove" on:click={() => removeTag(tag)}>×</button>
            </span>
          {/each}
        </div>
        <input
          id="tags-input"
          type="text"
          bind:value={newTag}
          placeholder="Add tag..."
          class="tag-input"
          on:keydown={handleKeydown}
        />
        <button type="button" class="btn btn-sm" on:click={addTag}>Add</button>
      </div>
    </div>

    <div class="mb-3">
      <label for="case-books-info" class="form-label">Case Books</label>
      <!-- TODO: Implement book selection/management UI when backend is ready -->
      <div id="case-books-info" class="alert alert-info p-2 small mb-0" aria-describedby="case-books-info">
        Book linking and management coming soon.
      </div>
    </div>

    {#if isEditing && availableTransitions.length > 0}
      <div class="form-section">
        <label for="state-transitions" class="form-label">Available Actions</label>
        <div id="state-transitions" class="state-transitions">
          {#each availableTransitions as transition}
            <button 
              type="button" 
              class="btn btn-outline btn-sm"
              on:click={() => handleStateTransition(transition as CaseState)}
            >
              {transition.replace('_', ' ').toUpperCase()}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Hidden fields for form data -->
    <input type="hidden" name="tags" value={JSON.stringify(tags)} />
    <input type="hidden" name="data" value={JSON.stringify({ caseType, priority, state: currentState, analysis: analysisResults })} />

    <div class="form-actions">
      <button type="submit" class="btn btn-primary">
        {isEditing ? 'Update Case' : 'Create Case'}
      </button>
      <button type="button" class="btn btn-ghost" on:click={() => dispatch('cancel')}>
        Cancel
      </button>
    </div>
  </form>

  {#if showRelationshipAnalyzer && description.length > 20}    <CaseRelationshipAnalyzer
      {caseId}
      caseDescription={description}
      on:generateSummary={handleRelationshipEvent}
      on:suggestMerge={handleRelationshipEvent}
    />
  {/if}

  {#if analysisResults && analysisResults.suggestions}
    <div class="analysis-panel">
      <h3>AI Analysis & Suggestions</h3>
      <div class="suggestions-list">
        {#each analysisResults.suggestions as suggestion}
          <div class="suggestion-card" class:high-priority={suggestion.priority === 'high'}>
            <div class="suggestion-header">
              <span class="suggestion-title">{suggestion.title}</span>
              <span class="priority-badge priority-{suggestion.priority}">{suggestion.priority}</span>
            </div>
            <p class="suggestion-description">{suggestion.description}</p>
            {#if suggestion.type === 'template'}
              <button class="btn btn-sm btn-outline" on:click={() => applyTemplate(suggestion.actionData)}>
                Apply Template
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .enhanced-case-form {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-content h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
  }

  .case-state {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .state-label {
    font-size: 14px;
    color: #6b7280;
  }

  .state-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: white;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .auto-save-indicator {
    color: #6b7280;
    font-size: 12px;
  }

  .templates-panel {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
  }

  .templates-panel h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .template-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
  }

  .template-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .template-card.selected {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .template-name {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .template-description {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 6px;
  }

  .template-type {
    font-size: 11px;
    color: #3b82f6;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .case-form {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .form-section {
    margin-bottom: 20px;
  }

  .form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: #374151;
    font-size: 14px;
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .tags-input {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 8px;
    min-height: 42px;
  }

  .tags-list {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    flex: 1;
  }

  .tag {
    background: #3b82f6;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tag-remove {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    font-size: 14px;
    line-height: 1;
  }

  .tag-input {
    border: none;
    outline: none;
    padding: 4px;
    font-size: 14px;
    min-width: 100px;
  }

  .state-transitions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
  }

  .analysis-panel {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
  }

  .analysis-panel h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .suggestion-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
  }

  .suggestion-card.high-priority {
    border-color: #f59e0b;
    background-color: #fef3c7;
  }

  .suggestion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .suggestion-title {
    font-weight: 600;
    color: #1f2937;
  }

  .priority-badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .priority-high {
    background-color: #dc2626;
    color: white;
  }

  .priority-medium {
    background-color: #f59e0b;
    color: white;
  }

  .priority-low {
    background-color: #6b7280;
    color: white;
  }

  .suggestion-description {
    margin: 0 0 12px 0;
    color: #4b5563;
    font-size: 14px;
  }

  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
    background: transparent;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-outline {
    border-color: #d1d5db;
    color: #374151;
  }

  .btn-outline:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .btn-ghost {
    color: #6b7280;
  }

  .btn-ghost:hover {
    background-color: #f3f4f6;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
