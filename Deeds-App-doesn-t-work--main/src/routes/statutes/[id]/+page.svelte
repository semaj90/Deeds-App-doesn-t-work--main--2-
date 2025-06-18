<script lang="ts">
  import type { PageData } from './$types';
  import MarkdownEditor from '$lib/components/+MarkdownEditor.svelte';
  import { marked } from 'marked';

  export let data: PageData;

  const { statute, paragraphs }: { statute: PageData['statute'], paragraphs: PageData['paragraphs'] } = data;

  let activeTab: 'markdown' | 'preview' = 'preview'; // Default to preview for laws
  let showLinkedCasesSidebar = false;
  let selectedParagraphLinkedCases: any[] = [];

  function toggleLinkedCasesSidebar(paragraphLinkedCases: any[] = []) {
    selectedParagraphLinkedCases = paragraphLinkedCases;
    showLinkedCasesSidebar = !showLinkedCasesSidebar;
  }

  function generateAnchorLink(anchorId: string): string {
    return `#${anchorId}`;
  }

  function scrollToAnchor(anchorId: string) {
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex flex-col lg:flex-row gap-6">
    <!-- Main Content Area -->
    <div class="flex-1">
      <h1 class="text-3xl font-bold mb-4">Statute: {statute.title} ({statute.code})</h1>
      <p class="text-lg text-gray-700 mb-6">{statute.description}</p>

      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <div role="tablist" class="tabs tabs-boxed mb-4">
            <button
              role="tab"
              class="tab"
              class:tab-active={activeTab === 'markdown'}
              on:click={() => (activeTab = 'markdown')}
            >
              Markdown
            </button>
            <button
              role="tab"
              class="tab"
              class:tab-active={activeTab === 'preview'}
              on:click={() => (activeTab = 'preview')}
            >
              Preview
            </button>
          </div>

          {#if activeTab === 'markdown'}
            <MarkdownEditor content={paragraphs.map((p: { paragraphText: string }) => p.paragraphText).join('\n\n')} height="600px" initialEditType="markdown" showToolbar={false} readOnly={true} />
          {:else}
            <div class="prose max-w-none">
              {#each paragraphs as paragraph (paragraph.id)}
                <div id={paragraph.anchorId} class="mb-6 pb-4 border-b border-dashed border-gray-300 last:border-b-0">
                  <h5 class="text-xl font-semibold text-primary mb-2">Paragraph {paragraph.anchorId}</h5>
                  {@html marked(paragraph.paragraphText)}
                  <div class="mt-4 flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-outline btn-primary" on:click={() => toggleLinkedCasesSidebar(paragraph.linkedCases)}>
                      🔗 Link to Case ({paragraph.linkedCases.length})
                    </button>
                    <a href={generateAnchorLink(paragraph.anchorId)} on:click|preventDefault={() => scrollToAnchor(paragraph.anchorId)} class="btn btn-sm btn-outline btn-secondary">
                      # Anchor
                    </a>
                    {#if paragraph.crimeSuggestions && paragraph.crimeSuggestions.length > 0}
                      <div class="flex flex-wrap items-center gap-1 mt-2">
                        <strong class="text-sm">AI Crime Suggestions:</strong>
                        {#each paragraph.crimeSuggestions as suggestion (suggestion)}
                          <span class="badge badge-info badge-outline">{suggestion}</span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Right Sidebar for Linked Cases -->
    {#if showLinkedCasesSidebar}
      <div class="w-full lg:w-1/3">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-header flex justify-between items-center p-4 border-b border-base-200">
            <h5 class="text-lg font-semibold">Linked Cases</h5>
            <button type="button" class="btn btn-sm btn-ghost" aria-label="Close" on:click={() => (showLinkedCasesSidebar = false)}>
              ✕
            </button>
          </div>
          <div class="card-body">
            {#if selectedParagraphLinkedCases.length > 0}
              <ul class="space-y-3">
                {#each selectedParagraphLinkedCases as linkedCase (linkedCase.id)}
                  <li class="p-3 bg-base-200 rounded-lg shadow-sm">
                    <a href="/case/{linkedCase.id}" class="text-primary font-bold hover:underline">{linkedCase.title || linkedCase.name}</a>
                    <p class="text-sm text-gray-500 mt-1">{linkedCase.summary || 'No summary available.'}</p>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="text-gray-600">No cases linked to this paragraph.</p>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>