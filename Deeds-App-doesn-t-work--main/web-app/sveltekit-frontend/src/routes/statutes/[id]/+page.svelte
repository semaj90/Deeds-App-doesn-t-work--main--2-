<script lang="ts">
  import type { PageData } from './$types';
  import MarkdownEditor from '$lib/components/+MarkdownEditor.svelte';
  import { marked } from 'marked';

  export let data: PageData;

  // Use correct statute property names from Drizzle schema
  const { statute, paragraphs }: { statute: PageData['statute'], paragraphs: PageData['paragraphs'] } = data;
  const statuteTitle = statute?.title;
  const statuteContent = statute?.content;
  const statuteSectionNumber = statute?.meta?.sectionNumber;

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
  <h2>{statuteTitle}</h2>
  <div>Section: {statuteSectionNumber}</div>
  <MarkdownEditor bind:value={statuteContent} readOnly={true} />
  <!-- Render paragraphs if needed -->
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