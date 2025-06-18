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

<div class="container-fluid mt-4">
  <div class="row">
    <!-- Main Content Area -->
    <div class="col-md-8">
      <h1 class="mb-4">Statute: {statute.title} ({statute.code})</h1>
      <p class="lead">{statute.description}</p>

      <div class="card mb-4">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs">
            <li class="nav-item">
              <button class="nav-link" class:active={activeTab === 'markdown'} on:click={() => (activeTab = 'markdown')}>
                Markdown
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" class:active={activeTab === 'preview'} on:click={() => (activeTab = 'preview')}>
                Preview
              </button>
            </li>
          </ul>
        </div>
        <div class="card-body">
          {#if activeTab === 'markdown'}
            <MarkdownEditor content={paragraphs.map((p: { paragraphText: string | null }) => p.paragraphText || '').join('\n\n')} height="600px" initialEditType="markdown" showToolbar={false} readOnly={true} />
          {:else}
            <div class="markdown-preview">
              {#each paragraphs as paragraph (paragraph.id)}
                <div id={paragraph.anchorId} class="paragraph-section mb-3">
                  <h5>Paragraph {paragraph.anchorId || 'Unknown'}</h5>
                  {@html marked(paragraph.paragraphText || '')}
                  <button class="btn btn-sm btn-outline-primary mt-2" on:click={() => toggleLinkedCasesSidebar(paragraph.linkedCases)}>
                    🔗 Link to Case ({paragraph.linkedCases.length})
                  </button>
                  <a href={generateAnchorLink(paragraph.anchorId || '')} on:click|preventDefault={() => scrollToAnchor(paragraph.anchorId || '')} class="btn btn-sm btn-outline-secondary mt-2 ms-2">
                    # Anchor
                  </a>
                  {#if paragraph.crimeSuggestions && Array.isArray(paragraph.crimeSuggestions) && paragraph.crimeSuggestions.length > 0}
                    <div class="mt-2">
                      <strong>AI Crime Suggestions:</strong>
                      {#each paragraph.crimeSuggestions as suggestion (suggestion)}
                        <span class="badge bg-info text-dark me-1">{suggestion}</span>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Right Sidebar for Linked Cases -->
    <div class="col-md-4">
      {#if showLinkedCasesSidebar}
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Linked Cases</h5>
            <button type="button" class="btn-close" aria-label="Close" on:click={() => (showLinkedCasesSidebar = false)}></button>
          </div>
          <div class="card-body">
            {#if selectedParagraphLinkedCases.length > 0}
              <ul class="list-group">
                {#each selectedParagraphLinkedCases as linkedCase (linkedCase.id)}
                  <li class="list-group-item">
                    <a href="/case/{linkedCase.id}">{linkedCase.title || linkedCase.name}</a>
                    <p class="text-muted small mb-0">{linkedCase.summary || 'No summary available.'}</p>
                  </li>
                {/each}
              </ul>
            {:else}
              <p>No cases linked to this paragraph.</p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .container-fluid {
    padding-right: 15px;
    padding-left: 15px;
  }

  .markdown-preview {
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    background-color: #f9f9f9;
  }

  .paragraph-section {
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #e0e0e0;
  }

  .paragraph-section:last-child {
    border-bottom: none;
  }

  .paragraph-section h5 {
    color: #007bff;
    margin-bottom: 10px;
  }

  .list-group-item a {
    font-weight: bold;
    color: #007bff;
    text-decoration: none;
  }

  .list-group-item a:hover {
    text-decoration: underline;
  }
</style>