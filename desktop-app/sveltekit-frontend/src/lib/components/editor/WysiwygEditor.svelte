// Enhanced WYSIWYG Editor with Melt UI Integration
// Combines Hugerte with Melt UI components for legal document editing

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { createDialog, melt } from '@melt-ui/svelte';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';

  // Props
  export let content = '';
  export let placeholder = 'Start typing your legal document...';
  export let readonly = false;
  export let height = '400px';
  export let enableAI = true;
  export let enableCitation = true;
  export let enableCollaboration = false;

  // Events
  const dispatch = createEventDispatcher<{
    change: { content: string; wordCount: number };
    save: { content: string };
    aiRequest: { selectedText: string; action: string };
    citationRequest: { text: string; position: number };
  }>();

  // Stores
  let editorElement: HTMLElement;
  let hugerte: any;
  let isInitialized = false;
  const wordCount: Writable<number> = writable(0);
  const charCount: Writable<number> = writable(0);

  // Melt UI Dialog for AI Assistant
  const {
    elements: { 
      trigger: aiTrigger, 
      overlay: aiOverlay, 
      content: aiContent, 
      title: aiTitle, 
      description: aiDescription, 
      close: aiClose, 
      portalled: aiPortalled 
    },
    states: { open: aiOpen }
  } = createDialog({
    forceVisible: true,
  });

  // Melt UI Dialog for Citations
  const {
    elements: { 
      trigger: citeTrigger, 
      overlay: citeOverlay, 
      content: citeContent, 
      title: citeTitle, 
      close: citeClose, 
      portalled: citePortalled 
    },
    states: { open: citeOpen }
  } = createDialog();

  // AI Assistant state
  let aiQuery = '';
  let aiResults = '';
  let isProcessingAI = false;
  let selectedText = '';

  // Citation state
  let citationQuery = '';
  let citationResults: Array<{
    title: string;
    citation: string;
    relevance: number;
  }> = [];

  onMount(async () => {
    await initializeEditor();
  });

  async function initializeEditor() {
    try {
      // Dynamically import Hugerte
      const { default: Hugerte } = await import('hugerte');
      
      hugerte = new Hugerte({
        target: editorElement,
        props: {
          content,
          placeholder,
          readonly,
          config: {
            height,
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'codesample', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
              'autosave', 'save', 'directionality', 'emoticons', 'template',
              'textpattern', 'nonbreaking', 'pagebreak', 'permanentpen', 'powerpaste',
              'advtable', 'tinymcespellchecker', 'mentions', 'linkchecker'
            ],
            toolbar: [
              'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify',
              'outdent indent | numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen preview save print',
              'insertfile image media template link anchor codesample | ltr rtl | ai-assistant citation-helper'
            ],
            content_style: `
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                font-size: 14px; 
                line-height: 1.6;
                color: #374151;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              h1, h2, h3, h4, h5, h6 { 
                color: #1f2937; 
                font-weight: 600;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
              }
              .citation {
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
                padding: 0.5em;
                margin: 1em 0;
                border-radius: 0 4px 4px 0;
              }
              .ai-suggestion {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                padding: 0.5em;
                border-radius: 4px;
                margin: 0.5em 0;
              }
            `,
            setup: (editor: any) => {
              // Custom AI Assistant button
              editor.ui.registry.addButton('ai-assistant', {
                text: '🤖 AI',
                tooltip: 'AI Assistant',
                onAction: () => openAIAssistant(editor.selection.getContent())
              });

              // Custom Citation Helper button
              editor.ui.registry.addButton('citation-helper', {
                text: '📚 Cite',
                tooltip: 'Citation Helper',
                onAction: () => openCitationHelper(editor.selection.getContent())
              });

              // Auto-save functionality
              editor.on('NodeChange', () => {
                updateCounts(editor.getContent());
              });

              // Content change listener
              editor.on('input', () => {
                const newContent = editor.getContent();
                content = newContent;
                updateCounts(newContent);
                dispatch('change', { content: newContent, wordCount: $wordCount });
              });

              // Save handler
              editor.on('save', () => {
                dispatch('save', { content: editor.getContent() });
              });
            },
            save_enablewhendirty: true,
            save_onsavecallback: () => {
              dispatch('save', { content: hugerte.getContent() });
            },
            autosave_interval: '10s',
            autosave_retention: '30m',
            // Legal document specific settings
            spellchecker_language: 'en_US',
            spellchecker_whitelist: ['appellant', 'appellee', 'plaintiff', 'defendant', 'jurisdiction'],
            word_count: true,
            character_count: true,
          }
        }
      });

      // Listen to content changes from Hugerte
      hugerte.$on('input', (event: any) => {
        content = event.detail.content;
        updateCounts(content);
      });

      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize editor:', error);
    }
  }

  function updateCounts(text: string) {
    const plainText = text.replace(/<[^>]*>/g, '');
    wordCount.set(plainText.trim().split(/\s+/).filter(word => word.length > 0).length);
    charCount.set(plainText.length);
  }

  function openAIAssistant(text: string) {
    selectedText = text;
    aiQuery = '';
    aiResults = '';
    aiOpen.set(true);
  }

  function openCitationHelper(text: string) {
    citationQuery = text;
    citationResults = [];
    citeOpen.set(true);
  }

  async function processAIRequest() {
    if (!aiQuery.trim()) return;
    
    isProcessingAI = true;
    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiQuery,
          context: selectedText ? [{ role: 'user', content: `Selected text: ${selectedText}` }] : [],
          options: {
            maxSources: 5,
            provider: 'auto',
            enableLegalClassification: true
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        aiResults = data.data.answer;
        dispatch('aiRequest', { selectedText, action: aiQuery });
      } else {
        aiResults = 'Sorry, I encountered an error processing your request.';
      }
    } catch (error) {
      console.error('AI request failed:', error);
      aiResults = 'Failed to connect to AI service.';
    } finally {
      isProcessingAI = false;
    }
  }

  async function searchCitations() {
    if (!citationQuery.trim()) return;

    try {
      const response = await fetch('/api/search/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: citationQuery,
          limit: 10
        })
      });

      const data = await response.json();
      if (data.success) {
        citationResults = data.results.map((r: any) => ({
          title: r.title,
          citation: r.citation,
          relevance: r.similarity
        }));
      }
    } catch (error) {
      console.error('Citation search failed:', error);
    }
  }

  function insertCitation(citation: any) {
    if (hugerte) {
      const citationHtml = `
        <div class="citation">
          <strong>${citation.title}</strong><br>
          <em>${citation.citation}</em>
        </div>
      `;
      hugerte.insertContent(citationHtml);
      citeOpen.set(false);
    }
  }

  function insertAIContent() {
    if (hugerte && aiResults) {
      const aiHtml = `
        <div class="ai-suggestion">
          <strong>AI Suggestion:</strong><br>
          ${aiResults.replace(/\n/g, '<br>')}
        </div>
      `;
      hugerte.insertContent(aiHtml);
      aiOpen.set(false);
    }
  }

  // Export content
  export function getContent(): string {
    return hugerte ? hugerte.getContent() : content;
  }

  // Import content
  export function setContent(newContent: string) {
    if (hugerte) {
      hugerte.setContent(newContent);
    }
    content = newContent;
    updateCounts(newContent);
  }
</script>

<!-- Main Editor Container -->
<div class="wysiwyg-container">
  <!-- Editor Toolbar -->
  <div class="editor-toolbar">
    <div class="toolbar-left">
      <button 
        use:melt={$aiTrigger} 
        class="toolbar-btn ai-btn"
        disabled={!enableAI}
      >
        🤖 AI Assistant
      </button>
      
      <button 
        use:melt={$citeTrigger}
        class="toolbar-btn cite-btn"
        disabled={!enableCitation}
      >
        📚 Citations
      </button>
    </div>
    
    <div class="toolbar-right">
      <span class="word-count">Words: {$wordCount}</span>
      <span class="char-count">Characters: {$charCount}</span>
    </div>
  </div>

  <!-- Main Editor -->
  <div 
    bind:this={editorElement}
    class="editor-content"
    style="height: {height};"
  ></div>
</div>

<!-- AI Assistant Dialog -->
<div use:melt={$aiPortalled}>
  {#if $aiOpen}
    <div use:melt={$aiOverlay} class="dialog-overlay" />
    <div use:melt={$aiContent} class="dialog-content ai-dialog">
      <h2 use:melt={$aiTitle} class="dialog-title">AI Legal Assistant</h2>
      
      {#if selectedText}
        <div class="selected-text">
          <strong>Selected text:</strong>
          <p>"{selectedText}"</p>
        </div>
      {/if}
      
      <div class="dialog-body">
        <label for="ai-query">What would you like help with?</label>
        <textarea
          id="ai-query"
          bind:value={aiQuery}
          placeholder="E.g., 'Analyze this clause', 'Suggest improvements', 'Find relevant precedents'..."
          rows="3"
          class="ai-query-input"
        ></textarea>
        
        <button 
          on:click={processAIRequest}
          disabled={isProcessingAI || !aiQuery.trim()}
          class="btn btn-primary"
        >
          {#if isProcessingAI}
            Processing...
          {:else}
            Ask AI
          {/if}
        </button>
        
        {#if aiResults}
          <div class="ai-results">
            <strong>AI Response:</strong>
            <div class="ai-response">{aiResults}</div>
            <button on:click={insertAIContent} class="btn btn-secondary">
              Insert into Document
            </button>
          </div>
        {/if}
      </div>
      
      <button use:melt={$aiClose} class="dialog-close">×</button>
    </div>
  {/if}
</div>

<!-- Citation Helper Dialog -->
<div use:melt={$citePortalled}>
  {#if $citeOpen}
    <div use:melt={$citeOverlay} class="dialog-overlay" />
    <div use:melt={$citeContent} class="dialog-content cite-dialog">
      <h2 use:melt={$citeTitle} class="dialog-title">Citation Helper</h2>
      
      <div class="dialog-body">
        <label for="cite-query">Search for citations:</label>
        <input
          id="cite-query"
          bind:value={citationQuery}
          placeholder="Enter legal concept, case name, or statute..."
          class="cite-query-input"
        />
        
        <button 
          on:click={searchCitations}
          disabled={!citationQuery.trim()}
          class="btn btn-primary"
        >
          Search
        </button>
        
        {#if citationResults.length > 0}
          <div class="citation-results">
            <h4>Found Citations:</h4>
            {#each citationResults as citation}
              <div class="citation-item">
                <div class="citation-title">{citation.title}</div>
                <div class="citation-text">{citation.citation}</div>
                <div class="citation-meta">
                  Relevance: {Math.round(citation.relevance * 100)}%
                </div>
                <button 
                  on:click={() => insertCitation(citation)}
                  class="btn btn-sm btn-secondary"
                >
                  Insert Citation
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <button use:melt={$citeClose} class="dialog-close">×</button>
    </div>
  {/if}
</div>

<style>
  .wysiwyg-container {
    @apply border border-gray-300 rounded-lg overflow-hidden bg-white;
  }

  .editor-toolbar {
    @apply flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-300;
  }

  .toolbar-left {
    @apply flex gap-2;
  }

  .toolbar-btn {
    @apply px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors;
  }

  .ai-btn {
    @apply border-blue-300 text-blue-700 hover:bg-blue-50;
  }

  .cite-btn {
    @apply border-green-300 text-green-700 hover:bg-green-50;
  }

  .toolbar-right {
    @apply flex gap-4 text-sm text-gray-600;
  }

  .editor-content {
    @apply w-full;
  }

  .dialog-overlay {
    @apply fixed inset-0 bg-black bg-opacity-50 z-40;
  }

  .dialog-content {
    @apply fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
           bg-white rounded-lg shadow-xl z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto;
  }

  .dialog-title {
    @apply text-xl font-semibold p-6 pb-0;
  }

  .dialog-body {
    @apply p-6;
  }

  .dialog-close {
    @apply absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl leading-none;
  }

  .selected-text {
    @apply bg-blue-50 border border-blue-200 rounded p-3 mb-4;
  }

  .ai-query-input, .cite-query-input {
    @apply w-full p-3 border border-gray-300 rounded-md mb-4 resize-vertical;
  }

  .ai-results {
    @apply mt-4 p-4 bg-green-50 border border-green-200 rounded;
  }

  .ai-response {
    @apply my-3 p-3 bg-white border rounded;
  }

  .citation-results {
    @apply mt-4;
  }

  .citation-item {
    @apply border border-gray-200 rounded p-3 mb-3;
  }

  .citation-title {
    @apply font-semibold text-gray-900;
  }

  .citation-text {
    @apply text-sm text-gray-700 mt-1;
  }

  .citation-meta {
    @apply text-xs text-gray-500 mt-2;
  }

  .btn {
    @apply px-4 py-2 rounded font-medium transition-colors;
  }

  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }

  .btn-sm {
    @apply px-2 py-1 text-sm;
  }

  .btn:disabled {
    @apply opacity-50 cursor-not-allowed;
  }
</style>
