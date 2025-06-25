<script lang="ts">
  import { onMount } from 'svelte';
  import { debounce } from 'lodash-es';

  export let caseData: any;
  export let onSave: (data: any) => Promise<void>;
  export let onSummarize: (data: any) => Promise<string>;

  let evidenceItems = caseData.evidence || [];
  let summary = '';
  let draggingItem: any = null;

  const debouncedSave = debounce(async () => {
    await onSave({ ...caseData, evidence: evidenceItems });
  }, 1000);

  function handleDragStart(event: DragEvent, item: any) {
    draggingItem = item;
    event.dataTransfer!.setData('text/plain', JSON.stringify(item));
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    if (draggingItem) {
      const target = event.target as HTMLElement;
      const targetIndex = parseInt(target.dataset.index || '0', 10);
      const currentIndex = evidenceItems.findIndex((i) => i.id === draggingItem.id);

      if (currentIndex !== -1) {
        const [movedItem] = evidenceItems.splice(currentIndex, 1);
        evidenceItems.splice(targetIndex, 0, movedItem);
        evidenceItems = [...evidenceItems];
        debouncedSave();
      }
    }
  }

  async function summarizeCase() {
    summary = 'Summarizing...';
    summary = await onSummarize(caseData);
  }
</script>

<div class="case-editor">
  <h2>Case: {caseData.title}</h2>

  <div class="evidence-list" on:dragover={handleDragOver} on:drop={handleDrop}>
    {#each evidenceItems as item, index (item.id)}
      <div
        class="evidence-item"
        draggable="true"
        on:dragstart={(e) => handleDragStart(e, item)}
        data-index={index}
      >
        {item.content}
      </div>
    {/each}
  </div>

  <button on:click={summarizeCase}>Summarize Case</button>

  {#if summary}
    <div class="summary">
      <h3>Summary</h3>
      <p>{summary}</p>
    </div>
  {/if}
</div>

<style>
  .case-editor {
    font-family: sans-serif;
  }
  .evidence-list {
    border: 1px solid #ccc;
    padding: 1rem;
    min-height: 200px;
  }
  .evidence-item {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border: 1px solid #eee;
    background: #f9f9f9;
    cursor: grab;
  }
</style>
