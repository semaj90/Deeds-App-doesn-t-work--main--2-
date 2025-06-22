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
      id: 'ai-analysis',
      title: '🤖 AI Analysis Queue',
      accepts: ['evidence', 'file'],
      items: [],
      className: 'border-purple-300'
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

  // AI Analysis states
  let selectedAnalysisType = 'scene_analysis';
  let analysisInProgress = false;
  let analysisResults: any = null;

  // Sample evidence items with AI capabilities
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

  async function runAIAnalysis(evidenceItem: DragDropItem) {
    analysisInProgress = true;
    analysisResults = null;

    try {
      // Simulate AI analysis call
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `Analyze ${evidenceItem.title} for legal significance and prosecution value. Type: ${selectedAnalysisType}` 
        })
      });

      const result = await response.json();
      
      if (result.success) {
        analysisResults = {
          evidence: evidenceItem,
          analysis: result.data.response,
          type: selectedAnalysisType,
          timestamp: new Date().toISOString()
        };
        
        // Move item to verified evidence after analysis
        const aiZone = evidenceZones.find(z => z.id === 'ai-analysis');
        const verifiedZone = evidenceZones.find(z => z.id === 'verified-evidence');
        
        if (aiZone && verifiedZone) {
          const itemIndex = aiZone.items.findIndex(i => i.id === evidenceItem.id);
          if (itemIndex >= 0) {
            const [item] = aiZone.items.splice(itemIndex, 1);
            item.metadata = { ...item.metadata, aiAnalyzed: true, analysisType: selectedAnalysisType };
            verifiedZone.items.push(item);
            evidenceZones = [...evidenceZones];
          }
        }
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      analysisInProgress = false;
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
    <!-- AI Analysis Controls -->
    <div class="card bg-base-100 shadow-sm mb-6">
      <div class="card-body">
        <h2 class="card-title text-purple-600">
          <i class="bi bi-robot me-2"></i>
          AI Evidence Analysis
        </h2>
        <p class="text-base-content/70 mb-4">
          Upload evidence, analyze scenes, extract insights with AI-powered analysis
        </p>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label class="label">
              <span class="label-text font-semibold">Analysis Type:</span>
            </label>
            <select bind:value={selectedAnalysisType} class="select select-bordered w-full">
              <option value="scene_analysis">Crime Scene Analysis</option>
              <option value="object_detection">Object Detection</option>
              <option value="document_ocr">Document OCR</option>
              <option value="pattern_analysis">Pattern Analysis</option>
              <option value="legal_significance">Legal Significance</option>
            </select>
          </div>
          
          <div class="flex flex-col justify-end">
            <button 
              class="btn btn-primary"
              disabled={analysisInProgress}
              on:click={() => {
                const aiZone = evidenceZones.find(z => z.id === 'ai-analysis');
                if (aiZone && aiZone.items.length > 0) {
                  runAIAnalysis(aiZone.items[0]);
                }
              }}
            >
              {#if analysisInProgress}
                <span class="loading loading-spinner loading-sm"></span>
                Analyzing...
              {:else}
                <i class="bi bi-play-circle me-2"></i>
                Run AI Analysis
              {/if}
            </button>
          </div>
          
          <div class="flex flex-col justify-end">
            <button class="btn btn-outline btn-info">
              <i class="bi bi-download me-2"></i>
              Export Results
            </button>
          </div>
        </div>
        
        {#if analysisResults}
          <div class="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 class="font-semibold text-purple-800 mb-2">
              <i class="bi bi-check-circle me-2"></i>
              Analysis Complete: {analysisResults.evidence.title}
            </h4>
            <div class="prose prose-sm max-w-none">
              <div class="bg-white p-3 rounded border text-sm">
                {analysisResults.analysis.substring(0, 200)}...
                <button class="btn btn-xs btn-link">View Full Report</button>
              </div>
            </div>
            <div class="mt-2 text-xs text-purple-600">
              Analysis Type: {analysisResults.type} | Completed: {new Date(analysisResults.timestamp).toLocaleString()}
            </div>
          </div>
        {/if}
      </div>
    </div>

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