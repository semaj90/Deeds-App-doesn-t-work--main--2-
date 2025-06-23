<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import type { SavedItem } from '$lib/server/db/schema-new';

  let savedItems: SavedItem[] = [];
  let isLoading = true;
  let searchQuery = '';
  let selectedTags: string[] = [];
  let sortBy: 'newest' | 'oldest' | 'most_used' | 'rating' = 'newest';
  let viewMode: 'cards' | 'list' = 'cards';
  
  let allTags: string[] = [];
  let filteredItems: SavedItem[] = [];

  onMount(async () => {
    await loadSavedItems();
  });

  async function loadSavedItems() {
    try {
      const response = await fetch('/api/llm/saved-items');
      if (response.ok) {
        savedItems = await response.json();
        extractTags();
        filterAndSort();
      } else {
        console.error('Failed to load saved items');
      }
    } catch (error) {
      console.error('Error loading saved items:', error);
    } finally {
      isLoading = false;
    }
  }

  function extractTags() {
    const tagSet = new Set<string>();
    savedItems.forEach((item: SavedItem) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag: string) => tagSet.add(tag));
      }
    });
    allTags = Array.from(tagSet).sort();
  }

  function filterAndSort() {
    let filtered = savedItems;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: SavedItem) => 
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        (item.original_query && item.original_query.toLowerCase().includes(query))
      );
    }    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((item: SavedItem) => {
        const itemTags = Array.isArray(item.tags) ? item.tags : [];
        return selectedTags.some((tag: string) => itemTags.includes(tag));
      });
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a: SavedItem, b: SavedItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a: SavedItem, b: SavedItem) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'most_used':
        filtered.sort((a: SavedItem, b: SavedItem) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'rating':
        filtered.sort((a: SavedItem, b: SavedItem) => (b.user_rating || 0) - (a.user_rating || 0));
        break;
    }

    filteredItems = filtered;
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
    filterAndSort();
  }

  function clearFilters() {
    searchQuery = '';
    selectedTags = [];
    filterAndSort();
  }

  async function deleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this saved item?')) return;

    try {
      const response = await fetch(`/api/llm/saved-items/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        savedItems = savedItems.filter((item: SavedItem) => item.id !== id);
        extractTags();
        filterAndSort();
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  }

  function formatDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function truncateContent(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
</script>

<svelte:head>
  <title>Saved Items - Legal Case Management</title>
</svelte:head>

<div class="saved-items-page p-6 max-w-7xl mx-auto">
  <div class="header mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Saved Items</h1>
    <p class="text-gray-600">Your curated knowledge base for future reference</p>
  </div>

  <!-- Filters and Controls -->
  <div class="filters-section bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <div class="flex flex-wrap gap-4 items-center justify-between mb-4">
      <!-- Search -->
      <div class="search-box flex-1 min-w-64">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search saved items..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Sort -->
      <div class="sort-controls flex items-center gap-2">
        <label for="sort-select" class="text-sm font-medium text-gray-700">Sort by:</label>
        <select
          id="sort-select"
          bind:value={sortBy}
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most_used">Most Used</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      <!-- View Mode -->
      <div class="view-controls flex items-center gap-1 border border-gray-300 rounded-lg p-1">
        <button
          class="view-btn {viewMode === 'cards' ? 'active' : ''}"
          on:click={() => viewMode = 'cards'}
          aria-label="Card view"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
          </svg>
        </button>
        <button
          class="view-btn {viewMode === 'list' ? 'active' : ''}"
          on:click={() => viewMode = 'list'}
          aria-label="List view"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Tags Filter -->
    {#if allTags.length > 0}
      <div class="tags-filter">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm font-medium text-gray-700">Filter by tags:</span>
          {#if selectedTags.length > 0}
            <button
              class="text-xs text-blue-600 hover:text-blue-800"
              on:click={clearFilters}
            >
              Clear all
            </button>
          {/if}
        </div>
        <div class="flex flex-wrap gap-2">
          {#each allTags as tag}
            <button
              class="tag-filter {selectedTags.includes(tag) ? 'selected' : ''}"
              on:click={() => toggleTag(tag)}
            >
              {tag}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Results Count -->
  <div class="results-info mb-4">
    <p class="text-sm text-gray-600">
      Showing {filteredItems.length} of {savedItems.length} saved items
    </p>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="loading-state flex items-center justify-center py-12">
      <div class="flex items-center gap-3">
        <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-gray-600">Loading saved items...</span>
      </div>
    </div>
  {:else if filteredItems.length === 0}
    <!-- Empty State -->
    <div class="empty-state text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        {savedItems.length === 0 ? 'No saved items yet' : 'No items match your filters'}
      </h3>
      <p class="text-gray-600 mb-4">
        {savedItems.length === 0 
          ? 'Start saving LLM answers to build your personalized knowledge base'
          : 'Try adjusting your search or filter criteria'}
      </p>
      {#if savedItems.length === 0}
        <a href="/interactive-canvas" class="btn btn-primary">
          Ask the AI Assistant
        </a>
      {:else}
        <button class="btn btn-outline-secondary" on:click={clearFilters}>
          Clear Filters
        </button>
      {/if}
    </div>
  {:else}
    <!-- Items Grid/List -->
    <div class="items-container {viewMode === 'cards' ? 'cards-view' : 'list-view'}">
      {#each filteredItems as item (item.id)}
        <div class="saved-item">
          <div class="item-header">
            <h3 class="item-title">{item.title}</h3>
            <div class="item-actions">
              <button
                class="action-btn text-blue-600 hover:text-blue-800"
                title="Copy content"
                aria-label="Copy content"
                on:click={() => navigator.clipboard.writeText(item.content)}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
              <button
                class="action-btn text-red-600 hover:text-red-800"
                title="Delete item"
                aria-label="Delete item"
                on:click={() => deleteItem(item.id)}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="item-content">
            <p class="content-text">{truncateContent(item.content)}</p>
          </div>

          {#if item.originalQuery}
            <div class="original-query">
              <span class="query-label">Original Query:</span>
              <span class="query-text">{truncateContent(item.originalQuery, 100)}</span>
            </div>
          {/if}

          <div class="item-footer">
            <div class="item-meta">
              <span class="meta-item">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {formatDate(item.createdAt)}
              </span>
              
              {#if item.usage_count && item.usage_count > 0}
                <span class="meta-item">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  Used {item.usage_count} time{item.usage_count !== 1 ? 's' : ''}
                </span>
              {/if}

              {#if item.userRating}
                <span class="meta-item rating">
                  <div class="stars">
                    {#each Array(5) as _, i}
                      <span class="star {i < item.userRating ? 'filled' : ''}">★</span>
                    {/each}
                  </div>
                </span>
              {/if}
            </div>            {#if Array.isArray(item.tags) && item.tags.length > 0}
              <div class="item-tags">
                {#each item.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .btn {
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    transition: colors 0.2s ease;
    outline: none;
    border: 1px solid transparent;
    cursor: pointer;
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

  .btn-outline-secondary {
    border: 1px solid #d1d5db;
    color: #374151;
  }

  .btn-outline-secondary:hover {
    background-color: #f9fafb;
  }

  .view-btn {
    padding: 0.5rem;
    color: #6b7280;
    border-radius: 0.25rem;
    transition: colors 0.2s ease;
    border: none;
    background: none;
    cursor: pointer;
  }

  .view-btn:hover {
    color: #111827;
  }

  .view-btn.active {
    background-color: #dbeafe;
    color: #2563eb;
  }

  .tag-filter {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    background-color: #f3f4f6;
    color: #374151;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    transition: colors 0.2s ease;
  }

  .tag-filter:hover {
    background-color: #e5e7eb;
  }

  .tag-filter.selected {
    background-color: #dbeafe;
    color: #1d4ed8;
  }

  .cards-view {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }

  .list-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .saved-item {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
    padding: 1.5rem;
    transition: box-shadow 0.2s ease;
  }

  .saved-item:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .item-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .item-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    flex: 1;
    margin-right: 0.5rem;
  }

  .item-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.25rem;
    border: none;
    background: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .action-btn:hover {
    background-color: #f3f4f6;
  }

  .item-content {
    margin-bottom: 1rem;
  }

  .content-text {
    color: #374151;
    line-height: 1.625;
  }

  .original-query {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .query-label {
    font-weight: 500;
    color: #6b7280;
  }

  .query-text {
    color: #1f2937;
    margin-left: 0.5rem;
  }

  .item-footer {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .stars {
    display: flex;
    gap: 0.125rem;
  }

  .star {
    font-size: 1.125rem;
  }

  .star.filled {
    color: #fbbf24;
  }

  .star:not(.filled) {
    color: #d1d5db;
  }

  .item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    padding: 0.25rem 0.5rem;
    background-color: #dbeafe;
    color: #1e40af;
    font-size: 0.75rem;
    border-radius: 9999px;
  }
</style>
