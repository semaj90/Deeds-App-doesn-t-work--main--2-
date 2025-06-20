<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { ActionData } from './$types';
  import EnhancedCaseForm from '$lib/components/EnhancedCaseForm.svelte';
  import { onMount } from 'svelte';

  export let form: ActionData;

  // Check for URL parameters that might indicate template or NLP suggestions
  let templateData: any = null;
  let nlpSuggestion: any = null;

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const template = urlParams.get('template');
    const nlpSuggestionId = urlParams.get('nlp_suggestion');
    
    if (template) {
      try {
        templateData = { suggestedTitle: template };
      } catch (error) {
        console.warn('Invalid template data:', error);
      }
    }

    if (nlpSuggestionId) {
      nlpSuggestion = { id: nlpSuggestionId };
    }
  });

  function handleCaseCreated(event: CustomEvent) {
    const { caseId } = event.detail;
    // Redirect to the new case
    goto(`/cases/${caseId}`);
  }

  function handleCancel() {
    goto('/cases');
  }
</script>

<svelte:head>
  <title>Create New Case - WardenNet</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  <div class="container mx-auto p-4">
    
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="breadcrumbs text-sm">
        <ul>
          <li><a href="/cases" class="link link-hover">Cases</a></li>
          <li class="font-medium">Create New Case</li>
        </ul>
      </div>
      
      <button 
        class="btn btn-ghost btn-sm"
        on:click={handleCancel}
      >
        ← Back to Cases
      </button>
    </div>

    <!-- Page Title -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-primary">Create New Case</h1>
      <p class="text-base-content/70 mt-2">Fill out the details below to create a new case in the system.</p>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      <!-- Form Section -->
      <div class="lg:col-span-3">
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <EnhancedCaseForm 
              {templateData}
              {nlpSuggestion}
              on:saved={handleCaseCreated}
              on:cancel={handleCancel}
            />
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        
        <!-- Quick Templates -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title text-sm">📋 Quick Templates</h3>
            <div class="space-y-2">
              <button 
                class="btn btn-outline btn-sm w-full" 
                on:click={() => templateData = { suggestedTitle: 'Criminal Investigation' }}
              >
                🔍 Criminal Investigation
              </button>
              <button 
                class="btn btn-outline btn-sm w-full"
                on:click={() => templateData = { suggestedTitle: 'Civil Dispute' }}
              >
                ⚖️ Civil Dispute
              </button>
              <button 
                class="btn btn-outline btn-sm w-full"
                on:click={() => templateData = { suggestedTitle: 'Administrative Review' }}
              >
                📋 Administrative Review
              </button>
              <button 
                class="btn btn-outline btn-sm w-full"
                on:click={() => templateData = { suggestedTitle: 'Traffic Violation' }}
              >
                🚗 Traffic Violation
              </button>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title text-sm">💡 Tips</h3>
            <div class="text-sm space-y-2">
              <div class="flex items-start gap-2">
                <span class="text-primary">•</span>
                <span>Use descriptive titles that clearly identify the case</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-primary">•</span>
                <span>Include relevant details in the description</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-primary">•</span>
                <span>Set appropriate danger scores for risk assessment</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-primary">•</span>
                <span>You can always edit case details later</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Cases -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title text-sm">📂 Recent Cases</h3>
            <div class="text-sm space-y-2">
              <div class="p-2 bg-base-200 rounded">
                <div class="font-medium truncate">State v. Johnson</div>
                <div class="text-xs text-base-content/70">Active • 2 days ago</div>
              </div>
              <div class="p-2 bg-base-200 rounded">
                <div class="font-medium truncate">Traffic Citation #4429</div>
                <div class="text-xs text-base-content/70">Pending • 5 days ago</div>
              </div>
              <div class="p-2 bg-base-200 rounded">
                <div class="font-medium truncate">Administrative Appeal</div>
                <div class="text-xs text-base-content/70">Closed • 1 week ago</div>
              </div>
            </div>
            <div class="mt-4">
              <a href="/cases" class="link link-primary text-sm">View all cases →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-primary">Create New Case</h1>
          <p class="text-base-content/70 mt-1">Use advanced features to create and organize your case</p>
        </div>
        <button 
          class="btn btn-outline"
          on:click={handleCancel}
        >
          ← Back to Cases
        </button>
      </div>
    </div>

    <!-- Enhanced Case Form -->
    <EnhancedCaseForm 
      {form}
      {templateData}
      {nlpSuggestion}
      isEditing={false}
      on:saved={handleCaseCreated}
      on:cancel={handleCancel}
    />
  </div>
</div>
        
        if (caseAnalysis && !title && caseAnalysis.suggestedTitle) {
          // Auto-populate fields if not already filled
          if (!title && caseAnalysis.suggestedTitle) {
            title = caseAnalysis.suggestedTitle;
          }
          if (dangerScore === 1 && caseAnalysis.estimatedDangerScore > 1) {
            dangerScore = caseAnalysis.estimatedDangerScore;
          }
        }
      } else {
        console.error('NLP analysis failed:', await response.text());
      }
    } catch (error) {
      console.error('Error analyzing case description:', error);
    } finally {
      isAnalyzing = false;
    }
  }

  function applySuggestion(field: string, value: any) {
    switch (field) {
      case 'title':
        title = value;
        break;
      case 'dangerScore':
        dangerScore = value;
        break;
    }
  }

  function toggleAutoAnalyze() {
    autoAnalyzeEnabled = !autoAnalyzeEnabled;
    if (!autoAnalyzeEnabled) {
      showSuggestions = false;
      caseAnalysis = null;
    }
  }
</script>

<svelte:head>
  <title>Create New Case - WardenNet</title>
</svelte:head>

<div class="min-h-screen bg-base-200 py-8">
  <div class="container mx-auto px-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">Create New Case</h1>
      <p class="text-lg text-base-content/70">Build a comprehensive case file with AI-powered assistance</p>
      
      <!-- AI Toggle -->
      <div class="form-control w-52 mx-auto mt-4">
        <label class="cursor-pointer label">
          <span class="label-text">🤖 AI Auto-Analysis</span> 
          <input type="checkbox" bind:checked={autoAnalyzeEnabled} on:change={toggleAutoAnalyze} class="toggle toggle-primary" />
        </label>
      </div>
    </div>

    <!-- Main Form Card -->
    <div class="max-w-4xl mx-auto">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <form 
            method="post" 
            action="?/create"
            use:enhance={() => {
              isSubmitting = true;
              return async ({ update }) => {
                await update();
                isSubmitting = false;
              };
            }}
            class="space-y-6"
          >
            <!-- Basic Information Section -->
            <div class="form-section">
              <h2 class="text-2xl font-semibold mb-4 flex items-center">
                <span class="badge badge-primary mr-3">1</span>
                Basic Information
              </h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label" for="title">
                    <span class="label-text font-medium">Case Title *</span>
                    {#if caseAnalysis?.suggestedTitle && title !== caseAnalysis.suggestedTitle}
                      <button 
                        type="button"
                        class="btn btn-xs btn-ghost text-primary"
                        on:click={() => caseAnalysis && applySuggestion('title', caseAnalysis.suggestedTitle)}
                      >
                        💡 Use AI Suggestion
                      </button>
                    {/if}
                  </label>
                  <input 
                    type="text" 
                    id="title"
                    name="title"
                    bind:value={title}
                    placeholder="Enter case title..." 
                    class="input input-bordered w-full focus:input-primary" 
                    required
                  />
                  {#if caseAnalysis?.suggestedTitle && title !== caseAnalysis.suggestedTitle}
                    <div class="label">
                      <span class="label-text-alt text-primary">💡 Suggested: "{caseAnalysis.suggestedTitle}"</span>
                    </div>
                  {/if}
                </div>

                <div class="form-control">
                  <label class="label" for="status">
                    <span class="label-text font-medium">Status</span>
                  </label>
                  <select name="status" id="status" class="select select-bordered w-full focus:select-primary">
                    <option value="open" selected>Open</option>
                    <option value="investigation">Under Investigation</option>
                    <option value="pending">Pending Review</option>
                    <option value="trial">In Trial</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div class="form-control">
                <label class="label" for="description">
                  <span class="label-text font-medium">Case Description *</span>
                  {#if isAnalyzing}
                    <span class="label-text-alt text-primary">🤖 Analyzing...</span>
                  {/if}
                </label>
                <textarea 
                  id="description"
                  name="description"
                  bind:value={description}
                  class="textarea textarea-bordered h-32 focus:textarea-primary" 
                  placeholder="Provide a detailed description of the case... (AI will analyze as you type)"
                  required
                ></textarea>
                {#if caseAnalysis}
                  <div class="label">
                    <span class="label-text-alt text-success">✓ AI Analysis Complete (Confidence: {Math.round(caseAnalysis.confidence * 100)}%)</span>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Risk Assessment Section -->
            <div class="divider"></div>
            <div class="form-section">
              <h2 class="text-2xl font-semibold mb-4 flex items-center">
                <span class="badge badge-secondary mr-3">2</span>
                Risk Assessment
              </h2>
              
              <div class="form-control">
                <label class="label" for="dangerScore">
                  <span class="label-text font-medium">Danger Score (0-10)</span>
                  {#if caseAnalysis?.estimatedDangerScore && dangerScore !== caseAnalysis.estimatedDangerScore}                    <button
                      type="button"
                      class="btn btn-xs btn-ghost text-primary"
                      on:click={() => caseAnalysis && applySuggestion('dangerScore', caseAnalysis.estimatedDangerScore)}
                    >
                      💡 Use AI Suggestion ({caseAnalysis.estimatedDangerScore})
                    </button>
                  {/if}
                </label>
                <input 
                  type="range" 
                  id="dangerScore"
                  name="dangerScore"
                  bind:value={dangerScore}
                  min="0" 
                  max="10" 
                  class="range range-primary"
                />
                <div class="w-full flex justify-between text-xs px-2 mt-1">
                  <span>0 - Low</span>
                  <span>5 - Medium</span>
                  <span>10 - Critical</span>
                </div>
                <div class="text-center mt-2">
                  <span class="badge {dangerScore <= 3 ? 'badge-success' : dangerScore <= 7 ? 'badge-warning' : 'badge-error'}">
                    Score: {dangerScore}
                  </span>
                </div>
              </div>
            </div>

            <!-- AI Analysis Section -->
            {#if showSuggestions && caseAnalysis}
              <div class="divider"></div>
              <div class="form-section">
                <h2 class="text-2xl font-semibold mb-4 flex items-center">
                  <span class="badge badge-accent mr-3">🤖</span>
                  AI Analysis & Suggestions
                </h2>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Extracted Entities -->
                  <div class="card bg-base-100 border border-primary/20">
                    <div class="card-body">
                      <h3 class="card-title text-primary">Extracted Information</h3>
                      
                      {#if caseAnalysis.extractedEntities.persons.length > 0}
                        <div class="mb-3">
                          <h4 class="font-semibold mb-1">👥 Persons Mentioned:</h4>
                          <div class="flex flex-wrap gap-1">
                            {#each caseAnalysis.extractedEntities.persons as person}
                              <span class="badge badge-primary badge-sm">{person}</span>
                            {/each}
                          </div>
                        </div>
                      {/if}
                      
                      {#if caseAnalysis.extractedEntities.locations.length > 0}
                        <div class="mb-3">
                          <h4 class="font-semibold mb-1">📍 Locations:</h4>
                          <div class="flex flex-wrap gap-1">
                            {#each caseAnalysis.extractedEntities.locations as location}
                              <span class="badge badge-secondary badge-sm">{location}</span>
                            {/each}
                          </div>
                        </div>
                      {/if}
                      
                      {#if caseAnalysis.extractedEntities.crimes.length > 0}
                        <div class="mb-3">
                          <h4 class="font-semibold mb-1">⚖️ Crime Keywords:</h4>
                          <div class="flex flex-wrap gap-1">
                            {#each caseAnalysis.extractedEntities.crimes as crime}
                              <span class="badge badge-error badge-sm">{crime}</span>
                            {/each}
                          </div>
                        </div>
                      {/if}
                      
                      {#if caseAnalysis.extractedEntities.dates.length > 0}
                        <div class="mb-3">
                          <h4 class="font-semibold mb-1">📅 Dates Found:</h4>
                          <div class="flex flex-wrap gap-1">
                            {#each caseAnalysis.extractedEntities.dates as date}
                              <span class="badge badge-info badge-sm">{date}</span>
                            {/each}
                          </div>
                        </div>
                      {/if}
                      
                      {#if caseAnalysis.keyPhrases.length > 0}
                        <div>
                          <h4 class="font-semibold mb-1">🔑 Key Phrases:</h4>
                          <div class="flex flex-wrap gap-1">
                            {#each caseAnalysis.keyPhrases as phrase}
                              <span class="badge badge-neutral badge-sm">{phrase}</span>
                            {/each}
                          </div>
                        </div>
                      {/if}
                    </div>
                  </div>
                  
                  <!-- Similar Criminals -->
                  {#if suggestedCriminals.length > 0}
                    <div class="card bg-base-100 border border-warning/20">
                      <div class="card-body">
                        <h3 class="card-title text-warning">⚠️ Potential Matches</h3>
                        <p class="text-sm text-base-content/70 mb-3">
                          Based on extracted names, these criminals might be related:
                        </p>
                        
                        {#each suggestedCriminals as criminal}
                          <div class="card bg-base-200 card-compact mb-2">
                            <div class="card-body">
                              <div class="flex justify-between items-start">
                                <div>
                                  <h4 class="font-semibold">{criminal.firstName} {criminal.lastName}</h4>
                                  <p class="text-xs text-base-content/60">Threat Level: 
                                    <span class="badge badge-{criminal.threatLevel === 'high' ? 'error' : 'warning'} badge-xs">
                                      {criminal.threatLevel}
                                    </span>
                                  </p>
                                  {#if criminal.aliases.length > 0}
                                    <p class="text-xs text-base-content/60">
                                      Aliases: {criminal.aliases.join(', ')}
                                    </p>
                                  {/if}
                                </div>
                                <a href="/criminals/{criminal.id}" class="btn btn-ghost btn-xs">View</a>
                              </div>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}

            <!-- Error Display -->
            {#if form?.error}
              <div class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{form.error}</span>
              </div>
            {/if}            <!-- Action Buttons -->
            <div class="card-actions justify-end pt-6">
              <button type="button" class="btn btn-ghost" on:click={() => history.back()}>
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                class:loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Case...' : 'Create Case'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Using standard CSS instead of @apply */
  .form-section {
    background-color: var(--base-50, #f9fafb);
    border-radius: 0.5rem;
    padding: 1.5rem;
    border: 1px solid var(--base-300, #d1d5db);
  }
</style>
