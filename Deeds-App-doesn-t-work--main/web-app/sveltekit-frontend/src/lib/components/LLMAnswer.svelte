<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  import type { SavedItem } from '$lib/server/db/schema-new';

  export let answer: string;
  export let query: string;
  export let sources: Array<{
    type: string;
    id: string;
    title: string;
    relevance: number;
    content: string;
  }> = [];
  export let sessionId: string = '';
  export let isLoading: boolean = false;
  export let canSave: boolean = true;

  const dispatch = createEventDispatcher();

  let userRating: number = 0;
  let feedbackComment: string = '';
  let saveTitle: string = '';
  let saveTags: string = '';
  let showSaveDialog: boolean = false;
  let showFeedbackDialog: boolean = false;
  let isSaving: boolean = false;
  let isSubmittingFeedback: boolean = false;
  let savedItemId: string | null = null;

  // Auto-generate title from query or answer
  $: if (showSaveDialog && !saveTitle.trim()) {
    saveTitle = query.length > 50 ? query.substring(0, 50) + '...' : query;
  }

  async function saveForLater() {
    if (!saveTitle.trim()) return;
    
    isSaving = true;
    try {
      const response = await fetch('/api/llm/save-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: saveTitle.trim(),
          content: answer,
          originalQuery: query,
          tags: saveTags.split(',').map(tag => tag.trim()).filter(Boolean),
          sources: sources.map(source => ({
            sourceType: source.type,
            sourceId: source.id,
            chunkText: source.content,
            relevanceScore: source.relevance,
            metadata: { title: source.title }
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        savedItemId = result.id;
        showSaveDialog = false;
        dispatch('saved', { id: result.id, title: saveTitle });
        
        // Reset form
        saveTitle = '';
        saveTags = '';
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      isSaving = false;
    }
  }

  async function submitFeedback() {
    if (userRating === 0) return;
    
    isSubmittingFeedback = true;
    try {
      const response = await fetch('/api/llm/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          llmResponse: answer,
          userRating,
          feedbackType: determineFeedbackType(userRating),
          userComments: feedbackComment.trim() || null,
          sessionId,
          context: { sources }
        })
      });

      if (response.ok) {
        showFeedbackDialog = false;
        dispatch('feedback', { rating: userRating, comment: feedbackComment });
        
        // Reset form
        userRating = 0;
        feedbackComment = '';
      } else {
        const error = await response.json();
        alert(`Failed to submit feedback: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      isSubmittingFeedback = false;
    }
  }

  function determineFeedbackType(rating: number): string {
    if (rating >= 4) return 'helpful';
    if (rating === 3) return 'incomplete';
    if (rating === 2) return 'inaccurate';
    return 'irrelevant';
  }

  function formatContent(content: string): string {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
</script>

<div class="llm-answer bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
  <!-- Answer Content -->
  <div class="answer-content mb-4">
    <div class="prose max-w-none">
      {@html formatContent(answer)}
    </div>
  </div>

  <!-- Sources Section -->
  {#if sources.length > 0}
    <div class="sources-section mb-4">
      <h4 class="text-sm font-semibold text-gray-700 mb-2">Sources:</h4>
      <div class="grid gap-2">
        {#each sources as source, index}
          <div class="source-item bg-gray-50 rounded p-3 text-sm">
            <div class="flex justify-between items-start mb-1">
              <span class="font-medium text-gray-800">{source.title}</span>
              <span class="text-xs text-gray-500">
                {Math.round(source.relevance * 100)}% relevant
              </span>
            </div>
            <p class="text-gray-600 text-xs">
              {source.content.length > 150 
                ? source.content.substring(0, 150) + '...' 
                : source.content}
            </p>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="action-buttons flex gap-2 items-center">
    {#if canSave && !savedItemId}
      <button
        class="save-btn btn btn-sm btn-outline-primary"
        on:click={() => showSaveDialog = true}
        disabled={isLoading}
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
        </svg>
        Save for Later
      </button>
    {:else if savedItemId}
      <span class="text-green-600 text-sm flex items-center">
        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
        </svg>
        Saved
      </span>
    {/if}

    <button
      class="feedback-btn btn btn-sm btn-outline-secondary"
      on:click={() => showFeedbackDialog = true}
      disabled={isLoading}
    >
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8"></path>
      </svg>
      Give Feedback
    </button>

    <button
      class="copy-btn btn btn-sm btn-outline-secondary"
      on:click={() => navigator.clipboard.writeText(answer)}
      disabled={isLoading}
    >
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
      </svg>
      Copy
    </button>
  </div>
</div>

<!-- Save Dialog -->
{#if showSaveDialog}
  <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="modal-content bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h3 class="text-lg font-semibold mb-4">Save for Later</h3>
      
      <div class="form-group mb-4">
        <label for="save-title" class="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          id="save-title"
          type="text"
          bind:value={saveTitle}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a title for this saved item"
          required
        />
      </div>

      <div class="form-group mb-6">
        <label for="save-tags" class="block text-sm font-medium text-gray-700 mb-2">
          Tags (comma-separated)
        </label>
        <input
          id="save-tags"
          type="text"
          bind:value={saveTags}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., criminal law, evidence, important"
        />
      </div>

      <div class="flex gap-3">
        <button
          class="btn btn-primary flex-1"
          on:click={saveForLater}
          disabled={isSaving || !saveTitle.trim()}
        >
          {#if isSaving}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          {:else}
            Save
          {/if}
        </button>
        <button
          class="btn btn-outline-secondary flex-1"
          on:click={() => showSaveDialog = false}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Feedback Dialog -->
{#if showFeedbackDialog}
  <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="modal-content bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h3 class="text-lg font-semibold mb-4">Provide Feedback</h3>
        <div class="form-group mb-4">
        <label for="feedback-rating" class="block text-sm font-medium text-gray-700 mb-2">
          How helpful was this response? *
        </label>
        <div class="flex gap-2" id="feedback-rating">
          {#each [1, 2, 3, 4, 5] as rating}
            <button
              type="button"
              class="star-btn w-8 h-8 text-2xl {userRating >= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors"
              on:click={() => userRating = rating}
              aria-label="Rate {rating} star{rating !== 1 ? 's' : ''}"
            >
              ★
            </button>
          {/each}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          1 = Not helpful, 5 = Very helpful
        </div>
      </div>

      <div class="form-group mb-6">
        <label for="feedback-comment" class="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments
        </label>
        <textarea
          id="feedback-comment"
          bind:value={feedbackComment}
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="How could this response be improved?"
        ></textarea>
      </div>

      <div class="flex gap-3">
        <button
          class="btn btn-primary flex-1"
          on:click={submitFeedback}
          disabled={isSubmittingFeedback || userRating === 0}
        >
          {#if isSubmittingFeedback}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          {:else}
            Submit Feedback
          {/if}
        </button>
        <button
          class="btn btn-outline-secondary flex-1"
          on:click={() => showFeedbackDialog = false}
          disabled={isSubmittingFeedback}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .llm-answer {
    transition: all 0.2s ease;
  }

  .llm-answer:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    font-weight: 500;
    font-size: 0.875rem;
    transition: colors 0.2s ease;
    outline: none;
    border: 1px solid transparent;
  }

  .btn:focus {
    outline: 2px solid;
    outline-offset: 2px;
  }

  .btn-primary {
    background-color: #2563eb;
    color: white;
  }

  .btn-primary:hover {
    background-color: #1d4ed8;
  }

  .btn-primary:focus {
    outline-color: #3b82f6;
  }

  .btn-outline-primary {
    border: 1px solid #2563eb;
    color: #2563eb;
  }

  .btn-outline-primary:hover {
    background-color: #eff6ff;
  }

  .btn-outline-primary:focus {
    outline-color: #3b82f6;
  }

  .btn-outline-secondary {
    border: 1px solid #d1d5db;
    color: #374151;
  }

  .btn-outline-secondary:hover {
    background-color: #f9fafb;
  }

  .btn-outline-secondary:focus {
    outline-color: #6b7280;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .prose {
    line-height: 1.7;
  }

  .prose :global(strong) {
    font-weight: 600;
    color: #374151;
  }

  .prose :global(em) {
    font-style: italic;
    color: #6b7280;
  }

  .star-btn {
    transition: all 0.15s ease;
    border: none;
    background: none;
    cursor: pointer;
  }

  .star-btn:hover {
    transform: scale(1.1);
  }

  .modal-overlay {
    backdrop-filter: blur(2px);
  }

  .modal-content {
    animation: fadeInScale 0.2s ease-out;
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .source-item {
    border-left: 3px solid #e5e7eb;
    transition: border-color 0.2s ease;
  }

  .source-item:hover {
    border-left-color: #3b82f6;
  }
</style>
