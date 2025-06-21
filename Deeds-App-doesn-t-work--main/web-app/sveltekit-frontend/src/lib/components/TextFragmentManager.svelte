<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { page } from '$app/stores';
  import { dragDropManager } from '$lib/stores/dragDrop';

  export let caseId: string;
  export let description: string;
  export let canEdit = true;

  const dispatch = createEventDispatcher();

  let selectedText = '';
  let selectionStart = 0;
  let selectionEnd = 0;
  let showMoveMenu = false;
  let moveOptions: any[] = [];
  let isAnalyzing = false;
  let textAreaElement: HTMLTextAreaElement;
  let extractedFragments: any[] = [];
  let showFragmentPanel = false;

  onMount(async () => {
    // Load move suggestions when component initializes
    if (caseId) {
      await loadExtractedFragments();
    }
  });

  function handleTextSelection(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    
    if (start !== end) {
      selectedText = target.value.substring(start, end);
      selectionStart = start;
      selectionEnd = end;
      
      if (selectedText.length > 10) {
        showMoveOptions();
      }
    } else {
      selectedText = '';
      showMoveMenu = false;
    }
  }

  async function showMoveOptions() {
    if (!selectedText.trim()) return;
    
    isAnalyzing = true;
    try {
      const response = await fetch(`/api/cases/move-text/suggestions?sourceCaseId=${caseId}&textContent=${encodeURIComponent(selectedText)}`);
      
      if (response.ok) {
        const data = await response.json();
        moveOptions = data.suggestions;
        showMoveMenu = true;
      }
    } catch (error) {
      console.error('Failed to get move suggestions:', error);
    } finally {
      isAnalyzing = false;
    }
  }

  async function moveTextToCase(targetCaseId: string, targetTitle: string) {
    if (!selectedText.trim()) return;
    
    try {
      const response = await fetch('/api/cases/move-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCaseId: caseId,
          targetCaseId,
          textContent: selectedText,
          fragmentType: 'moved_text',
          position: 'end'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Remove the selected text from the current description
        const newDescription = description.substring(0, selectionStart) + 
                              description.substring(selectionEnd);
        
        // Update the description
        dispatch('textMoved', {
          newDescription,
          targetCaseId,
          targetTitle,
          movedText: selectedText
        });
        
        // Reset selection
        selectedText = '';
        showMoveMenu = false;
        
        // Show success message
        alert(`Text successfully moved to "${targetTitle}"`);
        
      } else {
        const error = await response.json();
        alert(`Failed to move text: ${error.error}`);
      }
    } catch (error) {
      console.error('Move text error:', error);
      alert('Failed to move text');
    }
  }

  async function loadExtractedFragments() {
    try {
      const response = await fetch('/api/cases/move-text/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId })
      });

      if (response.ok) {
        const data = await response.json();
        extractedFragments = [
          ...data.extractedContent.paragraphs.map((p: any) => ({ ...p, type: 'paragraph' })),
          ...data.extractedContent.sentences.map((s: any) => ({ ...s, type: 'sentence' })),
          ...data.extractedContent.lists.map((l: any) => ({ ...l, type: 'list' })),
          ...data.extractedContent.quotes.map((q: any) => ({ ...q, type: 'quote' }))
        ];
      }
    } catch (error) {
      console.error('Failed to extract fragments:', error);
    }
  }

  function handleTextAreaChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    description = target.value;
    dispatch('descriptionChange', { description });
  }

  function createNewCaseFromText() {
    if (!selectedText.trim()) return;
    
    // Create a new case with the selected text as the description
    const newCaseUrl = `/cases/new?template=${encodeURIComponent(selectedText)}&source_case=${caseId}`;
    window.open(newCaseUrl, '_blank');
  }

  function highlightFragment(fragment: any) {
    const content = fragment.content;
    const startIndex = description.indexOf(content);
    
    if (startIndex !== -1) {
      textAreaElement.focus();
      textAreaElement.setSelectionRange(startIndex, startIndex + content.length);
      selectedText = content;
      selectionStart = startIndex;
      selectionEnd = startIndex + content.length;
      showMoveOptions();
    }
  }

  // Drag and drop functionality
  function handleDragStart(event: DragEvent, fragment: any) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', fragment.content);
      event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'text-fragment',
        sourceCaseId: caseId,
        content: fragment.content,
        fragmentType: fragment.type
      }));
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    
    try {
      const jsonData = event.dataTransfer?.getData('application/json');
      if (jsonData) {
        const fragmentData = JSON.parse(jsonData);
        
        if (fragmentData.type === 'text-fragment' && fragmentData.sourceCaseId !== caseId) {
          // Insert the dropped text at cursor position
          const cursorPos = textAreaElement.selectionStart;
          const newDescription = 
            description.substring(0, cursorPos) + 
            '\n\n' + fragmentData.content + '\n\n' + 
            description.substring(cursorPos);
          
          dispatch('textDropped', {
            newDescription,
            droppedText: fragmentData.content,
            sourceCaseId: fragmentData.sourceCaseId
          });
        }
      }
    } catch (error) {
      console.error('Drop handling error:', error);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }
</script>

<div class="text-fragment-manager">
  <!-- Main Text Area with Enhanced Features -->
  <div class="form-control mb-4">
    <label class="label">
      <span class="label-text font-medium">Case Description</span>
      <div class="label-text-alt flex gap-2">
        {#if selectedText}
          <span class="badge badge-info badge-sm">
            {selectedText.length} chars selected
          </span>
        {/if}
        <button 
          class="btn btn-xs btn-outline"
          on:click={() => showFragmentPanel = !showFragmentPanel}
        >
          📝 Fragments
        </button>
      </div>
    </label>
    
    <div class="relative">
      <textarea
        bind:this={textAreaElement}
        bind:value={description}
        class="textarea textarea-bordered w-full h-64 resize-y"
        class:textarea-info={selectedText}
        placeholder="Enter case description... Select text to move it to another case."
        disabled={!canEdit}
        on:input={handleTextAreaChange}
        on:mouseup={handleTextSelection}
        on:keyup={handleTextSelection}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
      ></textarea>
      
      <!-- Selection Actions Overlay -->
      {#if selectedText && showMoveMenu}
        <div class="absolute top-2 right-2 z-10">
          <div class="dropdown dropdown-end dropdown-open">
            <div class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-80">
              <div class="menu-title">
                <span class="text-sm font-semibold">Move Selected Text</span>
                <button 
                  class="btn btn-ghost btn-xs"
                  on:click={() => showMoveMenu = false}
                >
                  ✕
                </button>
              </div>
              
              {#if isAnalyzing}
                <li><span class="loading loading-spinner loading-sm">Analyzing...</span></li>
              {:else if moveOptions.length > 0}
                <div class="text-xs text-base-content/70 mb-2 px-2">
                  Found {moveOptions.length} suitable cases:
                </div>
                {#each moveOptions as option}
                  <li>
                    <button 
                      class="justify-start"
                      on:click={() => moveTextToCase(option.case.id, option.case.title)}
                    >
                      <div class="flex-1 text-left">
                        <div class="font-medium truncate">{option.case.title}</div>
                        <div class="text-xs text-base-content/70">{option.reason}</div>
                        <div class="text-xs">
                          Relevance: {Math.round(option.relevanceScore * 100)}%
                        </div>
                      </div>
                    </button>
                  </li>
                {/each}
                <div class="divider my-1"></div>
              {:else}
                <li><span class="text-sm text-base-content/70">No suitable cases found</span></li>
              {/if}
              
              <li>
                <button 
                  class="btn btn-primary btn-sm"
                  on:click={createNewCaseFromText}
                >
                  📄 Create New Case
                </button>
              </li>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Fragment Panel -->
  {#if showFragmentPanel}
    <div class="card bg-base-100 shadow-lg mb-4">
      <div class="card-body">
        <div class="flex items-center justify-between mb-3">
          <h3 class="card-title text-sm">📋 Extracted Text Fragments</h3>
          <button 
            class="btn btn-ghost btn-xs"
            on:click={() => showFragmentPanel = false}
          >
            ✕
          </button>
        </div>
        
        {#if extractedFragments.length > 0}
          <div class="space-y-2 max-h-60 overflow-y-auto">
            {#each extractedFragments as fragment}
              <div 
                class="p-2 bg-base-200 rounded cursor-pointer hover:bg-base-300 transition-colors"
                draggable="true"
                on:dragstart={(e) => handleDragStart(e, fragment)}
                on:click={() => highlightFragment(fragment)}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && highlightFragment(fragment)}
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium text-base-content/80 mb-1">
                      {fragment.type} • {fragment.content.length} chars
                    </div>
                    <div class="text-sm line-clamp-2">
                      {fragment.content}
                    </div>
                  </div>
                  <div class="flex gap-1 ml-2">
                    <button 
                      class="btn btn-ghost btn-xs"
                      on:click|stopPropagation={() => highlightFragment(fragment)}
                      title="Select this fragment"
                    >
                      🎯
                    </button>
                    <span 
                      class="text-xs text-base-content/50"
                      title="Drag to move"
                    >
                      ⋮⋮
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-4 text-base-content/70">
            <div class="text-4xl mb-2">📝</div>
            <p class="text-sm">No fragments extracted yet</p>
            <button 
              class="btn btn-sm btn-outline mt-2"
              on:click={loadExtractedFragments}
            >
              Extract Fragments
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Quick Actions -->
  <div class="flex flex-wrap gap-2 mt-4">
    <div class="badge badge-outline">
      💡 Tip: Select text to move it to another case
    </div>
    {#if description.length > 1000}
      <div class="badge badge-warning">
        ⚠️ Long description - consider breaking it down
      </div>
    {/if}
    {#if selectedText}
      <div class="badge badge-info">
        {selectedText.split(/\s+/).length} words selected
      </div>
    {/if}
  </div>
</div>

<style>  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .dropdown-open .dropdown-content {
    display: block;
  }
</style>
