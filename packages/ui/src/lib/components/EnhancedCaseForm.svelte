<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import SmartTextarea from '$lib/components/SmartTextarea.svelte';
  import CaseRelationshipAnalyzer from '$lib/components/CaseRelationshipAnalyzer.svelte';  import { caseWorkflowManager, getStateColor, getStateLabel, type CaseState } from 'packages/lib/src/stores/caseStateMachine';
  import { nlpClient } from 'packages/lib/src/nlp/client';
  import type { CaseAnalysis } from 'packages/lib/src/nlp/types';
  import type { Book } from 'packages/lib/src/data/types';

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
    } catch (error) {
      console.error('Error analyzing description:', error);
    } finally {
      isAnalyzing = false;
    }
  }

  function addTag() {
    if (newTag && !tags.includes(newTag)) {
      tags = [...tags, newTag];
      newTag = '';
    }
  }

  function removeTag(tag: string) {
    tags = tags.filter(t => t !== tag);
  }

  function applyTemplate() {
    if (selectedTemplate) {
      description = selectedTemplate.content;
      // You can also apply other template properties here
    }
  }

  function handleAutoSave() {
    if (autoSaveEnabled) {
      // Implement your auto-save logic here, e.g., using a debounce function
      lastSaved = new Date().toLocaleTimeString();
      console.log('Auto-saving...');
    }
  }

  function handleStateChange(event: CustomEvent) {
    const { newState } = event.detail;
    currentState = newState;
    updateAvailableTransitions();
  }

  function handleMergeSuggestion(event: CustomEvent) {
    const { casesToMerge } = event.detail;
    // Handle the merge suggestion, e.g., by showing a confirmation dialog
    console.log('Merge suggested for:', casesToMerge);
  }

  function handleSubmit(event: any) {
    // You can add additional client-side validation here
    console.log('Submitting form...');
  }
</script>

<form method="POST" use:enhance on:submit={handleSubmit}>
  <div class="space-y-6">
    <div class="form-control">
      <label for="title" class="label">Title</label>
      <input type="text" id="title" name="title" bind:value={title} class="input input-bordered" required />
    </div>

    <div class="form-control">
      <label for="description" class="label">Description</label>
      <SmartTextarea 
        bind:value={description} 
        on:input={handleAutoSave} 
        on:change={analyzeDescription}
        placeholder="Describe the case details..."
        caseId={caseId}
        userId={userId}
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-control">
        <label for="caseType" class="label">Case Type</label>
        <input type="text" id="caseType" name="caseType" bind:value={caseType} class="input input-bordered" />
      </div>
      <div class="form-control">
        <label for="priority" class="label">Priority</label>
        <select id="priority" name="priority" bind:value={priority} class="select select-bordered">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>

    <div class="form-control">
      <label for="tags" class="label">Tags</label>
      <div class="flex items-center gap-2">
        <input type="text" id="tags" bind:value={newTag} class="input input-bordered flex-grow" placeholder="Add a tag" on:keydown.enter|preventDefault={addTag} />
        <button type="button" class="btn btn-secondary" on:click={addTag}>Add</button>
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        {#each tags as tag}
          <div class="badge badge-lg badge-outline">
            {tag}
            <button type="button" class="ml-2 text-error" on:click={() => removeTag(tag)}>x</button>
          </div>
        {/each}
      </div>
    </div>

    {#if isEditing}
      <div class="form-control">
        <label class="label">Case State</label>
        <div class="flex items-center gap-4">
          <span class="badge {getStateColor(currentState)}">{getStateLabel(currentState)}</span>
          <div class="flex gap-2">
            {#each availableTransitions as transition}
              <button type="button" class="btn btn-sm btn-outline" on:click={() => dispatch('stateChange', { newState: transition.toLowerCase() })}>
                {transition}
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <div class="flex justify-between items-center">
      <button type="submit" class="btn btn-primary">{isEditing ? 'Update' : 'Create'} Case</button>
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text mr-2">Auto-save</span>
          <input type="checkbox" bind:checked={autoSaveEnabled} class="toggle toggle-primary" />
        </label>
      </div>
    </div>
  </div>
</form>

{#if showRelationshipAnalyzer && caseId}
  <div class="mt-8">
    <h3 class="text-lg font-bold mb-4">Case Relationship Analysis</h3>
    <CaseRelationshipAnalyzer 
      caseId={caseId} 
      caseDescription={description}
      on:suggestMerge={handleMergeSuggestion}
    />
  </div>
{/if}

<style>
  .form-control {
    @apply mb-4;
  }
  .label {
    @apply text-sm font-medium text-gray-700 mb-1;
  }
  .input, .select, .textarea {
    @apply w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500;
  }
  .btn {
    @apply py-2 px-4 font-semibold rounded-md shadow-md;
  }
  .btn-primary {
    @apply bg-indigo-600 text-white hover:bg-indigo-700;
  }
  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
</style>
