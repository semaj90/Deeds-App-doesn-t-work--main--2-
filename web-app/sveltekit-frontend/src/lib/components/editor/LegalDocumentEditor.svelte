<!-- Enhanced Legal Document Editor with Pico CSS + UnoCSS + Melt UI -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { createDialog, createDropdownMenu, createTooltip, melt } from '@melt-ui/svelte';
  import { writable } from 'svelte/store';
  import { fade, flyAndScale } from '$lib/utils/transitions';
  import { 
    Search, 
    MessageCircle, 
    Loader2, 
    Brain, 
    AlertCircle, 
    CheckCircle, 
    FileText,
    Scale,
    BookOpen,
    ChevronDown,
    Settings,
    Save,
    Share2,
    Eye,
    X
  } from 'lucide-svelte';

  // Props
  export let caseId: string | undefined = undefined;
  export let documentId: string | undefined = undefined;
  export let documentType: 'brief' | 'contract' | 'motion' | 'evidence' = 'brief';
  export let title = 'Legal Document';
  export let readonly = false;

  // Component state
  let content = '';
  let query = '';
  let isLoading = false;
  let isProcessingAI = false;
  let error = '';
  let citations: Array<{
    id: string;
    text: string;
    source: string;
    type: 'case' | 'statute' | 'regulation';
  }> = [];

  const dispatch = createEventDispatcher<{
    save: { content: string; title: string };
    aiRequest: { query: string; context: string };
    citationAdded: { citation: any };
  }>();

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

  // Melt UI Dropdown for Document Actions
  const {
    elements: {
      trigger: actionsTrigger,
      menu: actionsMenu,
      item: actionsItem,
      separator: actionsSeparator,
    },
    states: { open: actionsOpen }
  } = createDropdownMenu();

  // Melt UI Tooltip for help
  const {
    elements: { trigger: helpTrigger, content: helpContent },
    states: { open: helpOpen }
  } = createTooltip();

  async function handleAIRequest() {
    if (!query.trim()) return;
    
    isProcessingAI = true;
    error = '';
    
    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          context: { content, documentType, caseId },
          options: { includeReferences: true }
        })
      });

      if (!response.ok) throw new Error('AI request failed');
      
      const result = await response.json();
      
      // Insert AI response into document
      const aiSuggestion = `\n\n<!-- AI Suggestion -->\n${result.answer}\n`;
      content += aiSuggestion;
      
      query = '';
      $aiOpen = false;
      
      dispatch('aiRequest', { query, context: content });
    } catch (err) {
      error = err instanceof Error ? err.message : 'AI request failed';
    } finally {
      isProcessingAI = false;
    }
  }

  function insertCitation(citation: typeof citations[0]) {
    const citationText = `[${citation.source}]`;
    content += citationText;
    citations = [...citations, citation];
    dispatch('citationAdded', { citation });
  }

  function saveDocument() {
    dispatch('save', { content, title });
  }

  function getDocumentTypeIcon() {
    switch (documentType) {
      case 'brief': return FileText;
      case 'contract': return BookOpen;
      case 'motion': return Scale;
      case 'evidence': return Search;
      default: return FileText;
    }
  }

  onMount(() => {
    // Load document content if documentId is provided
    if (documentId) {
      // TODO: Load document from API
    }
  });
</script>

<!-- Main Document Editor Container -->
<div class="legal-document-editor" data-theme="light">
  
  <!-- Header with Pico CSS semantic styling -->
  <header class="document-header">
    <div class="container">
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center space-x-3">
          <svelte:component 
            this={getDocumentTypeIcon()} 
            class="w-6 h-6 text-primary-600" 
          />
          <div>
            <h1 class="text-xl font-semibold text-legal-navy">{title}</h1>
            <p class="text-sm text-legal-neutral">
              {documentType.charAt(0).toUpperCase() + documentType.slice(1)}
              {#if caseId} • Case {caseId.slice(0, 8)}{/if}
            </p>
          </div>
        </div>

        <!-- Document Actions Dropdown -->
        <div class="flex items-center space-x-2">
          <button
            use:melt={$helpTrigger}
            class="legal-button-secondary p-2"
            aria-label="Help"
          >
            <AlertCircle class="w-4 h-4" />
          </button>

          <button
            use:melt={$actionsTrigger}
            class="legal-button-secondary flex items-center space-x-2 px-3 py-2"
          >
            <Settings class="w-4 h-4" />
            <span>Actions</span>
            <ChevronDown class="w-4 h-4" />
          </button>

          <button
            on:click={saveDocument}
            class="legal-button-primary flex items-center space-x-2 px-4 py-2"
            disabled={readonly}
          >
            <Save class="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content Area with Pico CSS Grid -->
  <main class="document-main">
    <div class="container-fluid">
      <div class="grid">
        
        <!-- Document Editor (2/3 width) -->
        <div class="editor-panel">
          <div class="legal-card h-full">
            <div class="editor-toolbar border-b border-gray-200 p-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <button class="toolbar-btn" title="Bold">
                    <strong>B</strong>
                  </button>
                  <button class="toolbar-btn" title="Italic">
                    <em>I</em>
                  </button>
                  <button class="toolbar-btn" title="Underline">
                    <u>U</u>
                  </button>
                  <span class="toolbar-separator">|</span>
                  <button class="toolbar-btn" title="Insert Citation">
                    📚
                  </button>
                  <button 
                    use:melt={$aiTrigger}
                    class="toolbar-btn ai-button" 
                    title="AI Assistant"
                  >
                    <Brain class="w-4 h-4" />
                  </button>
                </div>
                
                <div class="text-sm text-legal-neutral">
                  {content.length} characters
                </div>
              </div>
            </div>

            <!-- Text Editor Area -->
            <div class="editor-content">
              <textarea
                bind:value={content}
                disabled={readonly}
                placeholder="Begin drafting your legal document..."
                class="legal-textarea w-full h-full min-h-96 p-4 border-0 resize-none focus:ring-0"
                style="font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6;"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Sidebar (1/3 width) -->
        <div class="sidebar-panel">
          
          <!-- Citations Panel -->
          <div class="legal-card mb-4">
            <div class="p-4 border-b border-gray-200">
              <h3 class="legal-heading text-base flex items-center">
                <BookOpen class="w-4 h-4 mr-2" />
                Citations
              </h3>
            </div>
            <div class="p-4">
              {#if citations.length === 0}
                <p class="text-sm text-legal-neutral">No citations added yet.</p>
              {:else}
                <div class="space-y-2">
                  {#each citations as citation}
                    <div class="citation-block text-sm">
                      <div class="font-medium text-case-{citation.type}">
                        {citation.type.toUpperCase()}
                      </div>
                      <div class="text-legal-neutral">{citation.source}</div>
                    </div>
                  {/each}
                </div>
              {/if}
              
              <button 
                class="legal-button-secondary w-full mt-3 text-sm"
                on:click={() => insertCitation({
                  id: Math.random().toString(),
                  text: 'Sample Citation',
                  source: 'Smith v. Jones, 123 F.3d 456 (2023)',
                  type: 'case'
                })}
              >
                Add Citation
              </button>
            </div>
          </div>

          <!-- Document Info -->
          <div class="legal-card">
            <div class="p-4 border-b border-gray-200">
              <h3 class="legal-heading text-base">Document Info</h3>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-legal-neutral">Type:</span>
                <span class="text-case-{documentType}">{documentType}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-legal-neutral">Word Count:</span>
                <span>{content.split(/\s+/).length}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-legal-neutral">Last Saved:</span>
                <span>Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- AI Assistant Dialog -->
{#if $aiOpen}
  <div use:melt={$aiPortalled}>
    <div
      use:melt={$aiOverlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    />
    <div
      class="ai-response fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw] max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-legal-elevated"
      transition:flyAndScale={{ duration: 150, y: 8, start: 0.96 }}
      use:melt={$aiContent}
    >
      <div class="content-header">
        <h2 use:melt={$aiTitle} class="legal-heading text-lg flex items-center">
          <Brain class="w-5 h-5 mr-2 text-primary-600" />
          AI Legal Assistant
        </h2>
        <p use:melt={$aiDescription} class="text-sm text-legal-neutral mt-1">
          Ask for help with legal research, drafting, or analysis
        </p>
        <button
          use:melt={$aiClose}
          class="absolute right-4 top-4 text-legal-neutral hover:text-legal-navy"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 pt-4">
        {#if error}
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div class="flex items-center">
              <AlertCircle class="w-4 h-4 text-red-500 mr-2" />
              <span class="text-sm text-red-700">{error}</span>
            </div>
          </div>
        {/if}

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-legal-neutral mb-2">
              What would you like help with?
            </label>
            <textarea
              bind:value={query}
              placeholder="e.g., Help me draft a motion to dismiss based on lack of jurisdiction..."
              class="legal-textarea min-h-20"
              disabled={isProcessingAI}
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              use:melt={$aiClose}
              class="legal-button-secondary"
              disabled={isProcessingAI}
            >
              Cancel
            </button>
            <button
              on:click={handleAIRequest}
              class="legal-button-primary flex items-center space-x-2"
              disabled={!query.trim() || isProcessingAI}
            >
              {#if isProcessingAI}
                <Loader2 class="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              {:else}
                <Brain class="w-4 h-4" />
                <span>Get Help</span>
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Actions Dropdown Menu -->
{#if $actionsOpen}
  <div use:melt={$actionsMenu} class="dropdown-menu">
    <button use:melt={$actionsItem} class="dropdown-item">
      <Eye class="w-4 h-4 mr-2" />
      Preview
    </button>
    <button use:melt={$actionsItem} class="dropdown-item">
      <Share2 class="w-4 h-4 mr-2" />
      Share
    </button>
    <div use:melt={$actionsSeparator} class="dropdown-separator"></div>
    <button use:melt={$actionsItem} class="dropdown-item text-red-600">
      <X class="w-4 h-4 mr-2" />
      Delete
    </button>
  </div>
{/if}

<!-- Help Tooltip -->
{#if $helpOpen}
  <div use:melt={$helpContent} class="tooltip">
    Use the AI assistant for legal research and drafting help. 
    Click the citation button to add references.
  </div>
{/if}

<style>
  .legal-document-editor {
    min-height: 100vh;
    background: #fafafa;
  }

  .document-header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .document-main {
    flex: 1;
    padding: 1rem;
  }

  .editor-panel {
    grid-column: span 8 / span 8;
  }

  .sidebar-panel {
    grid-column: span 4 / span 4;
  }

  .toolbar-btn {
    @apply px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors;
  }

  .toolbar-separator {
    @apply text-gray-300 mx-2;
  }

  .ai-button {
    @apply bg-primary-50 border-primary-300 text-primary-700 hover:bg-primary-100;
  }

  .dropdown-menu {
    @apply bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50;
    min-width: 160px;
  }

  .dropdown-item {
    @apply w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center transition-colors;
  }

  .dropdown-separator {
    @apply h-px bg-gray-200 my-1;
  }

  .tooltip {
    @apply bg-gray-900 text-white text-xs rounded px-2 py-1 max-w-xs z-50;
  }

  /* Pico CSS will handle most base styling */
  /* UnoCSS will handle utility classes */
  /* Custom styles for legal-specific components */
</style>
