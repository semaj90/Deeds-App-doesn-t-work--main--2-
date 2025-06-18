<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import type { ActionData } from './$types';

  export let form: ActionData;

  let isSubmitting = false;
</script>

<svelte:head>
  <title>Create New Case - WardenNet</title>
</svelte:head>

<div class="min-h-screen bg-base-200 py-8">
  <div class="container mx-auto px-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">Create New Case</h1>
      <p class="text-lg text-base-content/70">Build a comprehensive case file with evidence and documentation</p>
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
                  </label>
                  <input 
                    type="text" 
                    id="title"
                    name="title"
                    placeholder="Enter case title..." 
                    class="input input-bordered w-full focus:input-primary" 
                    required
                  />
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
                </label>
                <textarea 
                  id="description"
                  name="description"
                  class="textarea textarea-bordered h-32 focus:textarea-primary" 
                  placeholder="Provide a detailed description of the case..."
                  required
                ></textarea>
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
                  <span class="label-text-alt">Rate the potential threat level</span>
                </label>
                <input 
                  type="range" 
                  id="dangerScore"
                  name="dangerScore"
                  min="0" 
                  max="10" 
                  value="0"
                  class="range range-primary" 
                  step="1"
                />
                <div class="w-full flex justify-between text-xs px-2 mt-1">
                  <span class="text-success">Low Risk</span>
                  <span class="text-warning">Medium Risk</span>
                  <span class="text-error">High Risk</span>
                </div>
              </div>
            </div>

            <!-- AI Summary Section -->
            <div class="divider"></div>
            <div class="form-section">
              <h2 class="text-2xl font-semibold mb-4 flex items-center">
                <span class="badge badge-accent mr-3">3</span>
                AI Analysis (Optional)
              </h2>
              
              <div class="form-control">
                <label class="label" for="aiSummary">
                  <span class="label-text font-medium">AI Generated Summary</span>
                  <span class="label-text-alt">AI analysis and insights</span>
                </label>
                <textarea 
                  id="aiSummary"
                  name="aiSummary"
                  class="textarea textarea-bordered h-24 focus:textarea-accent" 
                  placeholder="AI will generate insights here, or add manual analysis..."
                ></textarea>
              </div>
            </div>

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
