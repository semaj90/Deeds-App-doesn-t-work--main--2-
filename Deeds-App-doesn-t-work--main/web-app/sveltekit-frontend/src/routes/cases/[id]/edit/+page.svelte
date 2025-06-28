<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  const caseDetails = data.caseDetails;

  let title = caseDetails.title || '';
  let description = caseDetails.description || '';
  let dangerScore = caseDetails.dangerScore || 0;
  let status = caseDetails.status || 'open';
  let aiSummary = caseDetails.aiSummary || '';
  let isSubmitting = false;

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'under-review', label: 'Under Review' },
    { value: 'closed', label: 'Closed' },
    { value: 'archived', label: 'Archived' }
  ];

  function handleCancel() {
    goto(`/cases/${caseDetails.id}`);
  }
</script>

<svelte:head>
  <title>Edit Case: {caseDetails.title} - WardenNet</title>
</svelte:head>

<div class="edit-case-container">
  <div class="header-section">
    <button 
      class="back-button" 
      on:click={handleCancel}
      type="button"
    >
      ← Back to Case
    </button>
    <h1>Edit Case</h1>
    <p>Update the details for case: <strong>{caseDetails.caseNumber}</strong></p>
  </div>

  <form 
    method="post" 
    action="?/update"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ result }) => {
        isSubmitting = false;
        if (result.type === 'redirect') {
          goto(result.location);
        }
      };
    }}
    class="case-form"
  >
    {#if form?.error}
      <div class="error-message">
        {form.error}
      </div>
    {/if}

    <div class="form-group">
      <label for="title">Case Title *</label>
      <input
        type="text"
        id="title"
        name="title"
        bind:value={title}
        required
        placeholder="Enter a descriptive case title"
        class="form-input"
      />
    </div>

    <div class="form-group">
      <label for="description">Case Description *</label>
      <textarea
        id="description"
        name="description"
        bind:value={description}
        required
        placeholder="Provide a detailed description of the case"
        rows="5"
        class="form-textarea"
      ></textarea>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="status">Status</label>
        <select 
          id="status" 
          name="status" 
          bind:value={status}
          class="form-select"
        >
          {#each statusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="dangerScore">Danger Score (0-100)</label>
        <input
          type="range"
          id="dangerScore"
          name="dangerScore"
          bind:value={dangerScore}
          min="0"
          max="100"
          class="form-range"
        />
        <div class="range-value">
          {dangerScore}
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="aiSummary">AI Summary (Optional)</label>
      <textarea
        id="aiSummary"
        name="aiSummary"
        bind:value={aiSummary}
        placeholder="Optional AI-generated summary or notes"
        rows="3"
        class="form-textarea"
      ></textarea>
    </div>

    <div class="form-actions">
      <button 
        type="button" 
        class="cancel-button"
        on:click={handleCancel}
        disabled={isSubmitting}
      >
        Cancel
      </button>
      <button 
        type="submit" 
        class="submit-button"
        disabled={isSubmitting || !title.trim() || !description.trim()}
      >
        {isSubmitting ? 'Updating...' : 'Update Case'}
      </button>
    </div>
  </form>
</div>

<style>
  .edit-case-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .header-section {
    margin-bottom: 2rem;
    text-align: center;
  }

  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #6b7280;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    transition: background-color 0.2s;
  }

  .back-button:hover {
    background: #4b5563;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .header-section p {
    color: #6b7280;
    font-size: 1.1rem;
    margin: 0;
  }

  .case-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .error-message {
    background: #fee2e2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid #fecaca;
    font-weight: 500;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  label {
    font-weight: 600;
    color: #374151;
    font-size: 0.95rem;
  }

  .form-input,
  .form-textarea,
  .form-select {
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s;
    background: white;
  }

  .form-input:focus,
  .form-textarea:focus,
  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-textarea {
    resize: vertical;
    min-height: 120px;
  }

  .form-range {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e5e7eb;
    outline: none;
    -webkit-appearance: none;
  }

  .form-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }

  .form-range::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
  }

  .range-value {
    text-align: center;
    font-weight: 600;
    color: #3b82f6;
    font-size: 1.1rem;
    margin-top: 0.5rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .cancel-button,
  .submit-button {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border: none;
  }

  .cancel-button {
    background: #f3f4f6;
    color: #374151;
  }

  .cancel-button:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .submit-button {
    background: #10b981;
    color: white;
  }

  .submit-button:hover:not(:disabled) {
    background: #059669;
  }

  .submit-button:disabled,
  .cancel-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .edit-case-container {
      margin: 1rem;
      padding: 1.5rem;
    }

    .form-row {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .form-actions {
      flex-direction: column;
    }

    .cancel-button,
    .submit-button {
      width: 100%;
    }
  }
</style>
