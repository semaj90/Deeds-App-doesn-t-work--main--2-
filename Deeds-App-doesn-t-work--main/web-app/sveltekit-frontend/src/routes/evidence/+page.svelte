<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import DropZone from '$lib/components/DropZone.svelte';
  import DraggableItem from '$lib/components/DraggableItem.svelte';
  import { dragDropManager, type DragDropZone, type DragDropItem } from '$lib/stores/dragDrop';

  // Evidence management zones
  let evidenceZones: DragDropZone[] = [
    {
      id: 'pending-review',
      title: '📋 Pending Review',
      accepts: ['evidence', 'file'],
      items: [],
      className: 'border-warning/30'
    },
    {
      id: 'verified-evidence',
      title: '✅ Verified Evidence',
      accepts: ['evidence'],
      items: [],
      className: 'border-success/30'
    },
    {
      id: 'digital-forensics',
      title: '💻 Digital Forensics',
      accepts: ['evidence', 'file'],
      items: [],
      className: 'border-info/30'
    },
    {
      id: 'physical-evidence',
      title: '📦 Physical Evidence',
      accepts: ['evidence'],
      items: [],
      className: 'border-primary/30'
    }
  ];

  // Sample evidence items
  let availableEvidence: DragDropItem[] = [
    {
      id: 'evidence-1',
      type: 'evidence',
      title: 'Security Camera Footage',
      description: 'Recorded on 2024-01-15 at 14:30',
      status: 'pending',
      metadata: {
        type: 'video',
        duration: '2:45',
        quality: 'HD'
      }
    },
    {
      id: 'evidence-2',
      type: 'evidence',
      title: 'Fingerprint Analysis',
      description: 'Collected from crime scene',
      status: 'verified',
      metadata: {
        type: 'forensic',
        confidence: '98%'
      }
    }
  ];

  let searchTerm = '';
  let selectedType = 'all';

  // Filter available evidence
  $: filteredEvidence = availableEvidence.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  onMount(() => {
    evidenceZones.forEach(zone => {
      dragDropManager.createZone(zone);
    });
  });

  function handleZoneItemAdded(event: CustomEvent) {
    const { item } = event.detail;
    availableEvidence = availableEvidence.filter(e => e.id !== item.id);
  }

  function handleZoneItemRemoved(event: CustomEvent) {
    const { item, targetZoneId } = event.detail;
    if (!targetZoneId) {
      availableEvidence = [...availableEvidence, item];
    }
  }
</script>

<svelte:head>
  <title>Evidence Management - WardenNet</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  <div class="bg-base-100 shadow-sm">
    <div class="container mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold text-primary">Evidence Management</h1>
      <p class="text-base-content/70 mt-1">Organize and track evidence using drag-and-drop workflow</p>
    </div>
  </div>

  <div class="container mx-auto px-4 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Available Evidence Panel -->
      <div class="lg:col-span-1">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title mb-4">Available Evidence</h2>
            
            <div class="space-y-3 mb-4">
              <input 
                type="text" 
                bind:value={searchTerm}
                placeholder="Search evidence..." 
                class="input input-bordered input-sm w-full"
              />
              
              <select bind:value={selectedType} class="select select-bordered select-sm w-full">
                <option value="all">All Types</option>
                <option value="evidence">Evidence</option>
                <option value="file">Files</option>
              </select>
            </div>
            
            <div class="space-y-2 max-h-96 overflow-y-auto">
              {#each filteredEvidence as item (item.id)}
                <DraggableItem {item} showPreview={false} />
              {:else}
                <div class="text-center text-base-content/60 py-8">
                  <div class="text-4xl mb-2">📁</div>
                  <p>No evidence items found</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Evidence Management Zones -->
      <div class="lg:col-span-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each evidenceZones as zone (zone.id)}
            <DropZone 
              {zone}
              allowReorder={true}
              showItemCount={true}
              emptyMessage="Drop evidence items here"
              className={zone.className}
              on:itemAdded={handleZoneItemAdded}
              on:itemRemoved={handleZoneItemRemoved}
            />
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>