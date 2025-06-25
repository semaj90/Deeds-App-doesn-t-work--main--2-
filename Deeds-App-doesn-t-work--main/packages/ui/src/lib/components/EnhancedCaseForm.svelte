<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { page } from '$app/stores';
  import Button from './Button.svelte';
  import Card from './Card.svelte';

  export let existingCase: any = null;
  export let isEditing = false;

  const dispatch = createEventDispatcher();

  // Form data
  let title = existingCase?.title || '';
  let description = existingCase?.description || '';
  let caseType = existingCase?.caseType || '';
  let priority = existingCase?.priority || 'medium';
  let tags: string[] = existingCase?.tags || [];
  let newTag = '';
  
  // Smart features
  let isAnalyzing = false;
  let analysisResults: any = null;
  let showTemplates = false;
  let lastSaved = '';
  
  // Case types
  const caseTypes = [
    'Criminal Investigation',
    'Civil Case',
    'Family Law',
    'Corporate Law',
    'Immigration',
    'Personal Injury',
    'Property Law',
    'Contract Dispute',
    'Other'
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low Priority', color: 'success' },
    { value: 'medium', label: 'Medium Priority', color: 'warning' },
    { value: 'high', label: 'High Priority', color: 'danger' },
    { value: 'urgent', label: 'Urgent', color: 'danger' }
  ];

  function addTag() {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      tags = [...tags, newTag.trim()];
      newTag = '';
    }
  }

  function removeTag(tagToRemove: string) {
    tags = tags.filter(tag => tag !== tagToRemove);
  }

  function handleSubmit() {
    const formData = {
      title,
      description,
      caseType,
      priority,
      tags
    };
    
    dispatch('submit', formData);
  }

  function saveCase() {
    handleSubmit();
    lastSaved = new Date().toLocaleTimeString();
  }

  onMount(() => {
    // Auto-save every 30 seconds if there's content
    const autoSaveInterval = setInterval(() => {
      if (title.trim() || description.trim()) {
        saveCase();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  });
</script>

<Card class="enhanced-case-form">
  <div class="card-header">
    <h3 class="mb-0">
      <i class="bi bi-folder-plus me-2"></i>
      {isEditing ? 'Edit Case' : 'Create New Case'}
    </h3>
    {#if lastSaved}
      <small class="text-muted">Last saved: {lastSaved}</small>
    {/if}
  </div>

  <form on:submit|preventDefault={handleSubmit} class="card-body">
    <!-- Title Field -->
    <div class="form-group mb-3">
      <label for="caseTitle" class="form-label fw-semibold">
        <i class="bi bi-file-text me-1"></i>
        Case Title *
      </label>
      <input
        type="text"
        id="caseTitle"
        class="form-control"
        placeholder="Enter a descriptive case title..."
        bind:value={title}
        required
      />
    </div>

    <!-- Case Type -->
    <div class="form-group mb-3">
      <label for="caseType" class="form-label fw-semibold">
        <i class="bi bi-tags me-1"></i>
        Case Type
      </label>
      <select
        id="caseType"
        class="form-select"
        bind:value={caseType}
      >
        <option value="">Select case type...</option>
        {#each caseTypes as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
    </div>

    <!-- Priority -->
    <div class="form-group mb-3">
      <label class="form-label fw-semibold">
        <i class="bi bi-exclamation-triangle me-1"></i>
        Priority Level
      </label>
      <div class="d-flex gap-2 flex-wrap">
        {#each priorityLevels as level}
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              name="priority"
              id="priority-{level.value}"
              value={level.value}
              bind:group={priority}
            />
            <label class="form-check-label badge bg-{level.color}" for="priority-{level.value}">
              {level.label}
            </label>
          </div>
        {/each}
      </div>
    </div>

    <!-- Description -->
    <div class="form-group mb-3">
      <label for="caseDescription" class="form-label fw-semibold">
        <i class="bi bi-card-text me-1"></i>
        Case Description
      </label>
      <textarea
        id="caseDescription"
        class="form-control"
        rows="4"
        placeholder="Provide detailed information about the case..."
        bind:value={description}
      ></textarea>
      
      {#if isAnalyzing}
        <div class="mt-2">
          <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
          <small class="text-muted">Analyzing case details...</small>
        </div>
      {/if}
    </div>

    <!-- Tags -->
    <div class="form-group mb-4">
      <label class="form-label fw-semibold">
        <i class="bi bi-tags me-1"></i>
        Tags
      </label>
      
      <div class="tag-input-container">
        <div class="input-group mb-2">
          <input
            type="text"
            class="form-control"
            placeholder="Add a tag..."
            bind:value={newTag}
            on:keypress={(e) => e.key === 'Enter' && addTag()}
          />
          <Button type="button" variant="outline" on:click={addTag}>
            <i class="bi bi-plus"></i>
          </Button>
        </div>
        
        {#if tags.length > 0}
          <div class="tags-display">
            {#each tags as tag}
              <span class="badge bg-secondary d-inline-flex align-items-center gap-1">
                {tag}
                <button
                  type="button"
                  class="btn-close btn-close-white btn-sm"
                  aria-label="Remove tag"
                  on:click={() => removeTag(tag)}
                ></button>
              </span>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="d-flex gap-2 justify-content-between">
      <div class="d-flex gap-2">
        <Button type="submit" variant="primary">
          <i class="bi bi-check-circle me-1"></i>
          {isEditing ? 'Update Case' : 'Create Case'}
        </Button>
        
        <Button type="button" variant="outline" on:click={saveCase}>
          <i class="bi bi-save me-1"></i>
          Save Draft
        </Button>
      </div>

      {#if showTemplates}
        <Button type="button" variant="ghost" on:click={() => showTemplates = false}>
          <i class="bi bi-template me-1"></i>
          Hide Templates
        </Button>
      {:else}
        <Button type="button" variant="ghost" on:click={() => showTemplates = true}>
          <i class="bi bi-template me-1"></i>
          Use Template
        </Button>
      {/if}
    </div>

    <!-- Templates Section -->
    {#if showTemplates}
      <div class="mt-4 pt-3 border-top">
        <h6 class="mb-3">
          <i class="bi bi-file-template me-1"></i>
          Case Templates
        </h6>
        <div class="row g-2">
          <div class="col-md-4">
            <div class="card border-primary h-100">
              <div class="card-body p-3">
                <h6 class="card-title">Criminal Investigation</h6>
                <p class="card-text small">Standard criminal case template with evidence tracking</p>
                <Button size="sm" variant="outline">Use Template</Button>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-success h-100">
              <div class="card-body p-3">
                <h6 class="card-title">Civil Litigation</h6>
                <p class="card-text small">Civil case template with dispute resolution focus</p>
                <Button size="sm" variant="outline">Use Template</Button>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-warning h-100">
              <div class="card-body p-3">
                <h6 class="card-title">Family Law</h6>
                <p class="card-text small">Family law template for custody and divorce cases</p>
                <Button size="sm" variant="outline">Use Template</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </form>
</Card>

<style>
  .enhanced-case-form {
    max-width: 800px;
  }

  .tag-input-container {
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    padding: 0.75rem;
    background-color: var(--bs-light);
  }

  .tags-display {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .form-check-label.badge {
    cursor: pointer;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .form-check-input:checked + .form-check-label.badge {
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background-color: var(--bs-light);
    border-bottom: 1px solid var(--bs-border-color);
  }

  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
  }
</style>
