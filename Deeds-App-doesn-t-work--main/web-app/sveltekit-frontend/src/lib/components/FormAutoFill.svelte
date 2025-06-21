<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import type { EntityExtraction } from '$lib/types';
  
  export let evidenceData: any = null;
  export let existingCase: any = null;
  export let caseId: string = '';
  
  const dispatch = createEventDispatcher();
  
  let formData = {
    title: '',
    description: '',
    location: '',
    suspectName: '',
    victimName: '',
    incidentDate: '',
    incidentTime: '',
    severity: 'medium',
    category: '',
    tags: '',
    notes: ''
  };
    let isAnalyzing = false;
  let confidence = 0;
  let extractedEntities: EntityExtraction[] = [];
  let isLoading = false;
  
  // Auto-fill from evidence data when it changes
  $: if (evidenceData) {
    autoFillFromEvidence();
  }
  
  // Load existing case data
  $: if (existingCase) {
    loadExistingCaseData();
  }
  
  onMount(() => {
    if (caseId) {
      loadCaseFromId(caseId);
    }
  });
  
  async function autoFillFromEvidence() {
    if (!evidenceData) return;
    
    isAnalyzing = true;
    try {
      // Extract structured data from evidence
      const analysis = await analyzeEvidence(evidenceData);
      
      // Auto-populate form fields
      if (analysis.entities) {
        extractedEntities = analysis.entities;
          // Extract common entities
        const persons = analysis.entities.filter((e: EntityExtraction) => e.type === 'PERSON');
        const locations = analysis.entities.filter((e: EntityExtraction) => e.type === 'GPE' || e.type === 'LOC');
        const dates = analysis.entities.filter((e: EntityExtraction) => e.type === 'DATE');
        const times = analysis.entities.filter((e: EntityExtraction) => e.type === 'TIME');
        
        // Auto-fill fields with highest confidence entities
        if (persons.length > 0) {
          const highestConfidencePerson = persons.reduce((a: EntityExtraction, b: EntityExtraction) => a.confidence > b.confidence ? a : b);
          formData.suspectName = highestConfidencePerson.text;
        }
        
        if (locations.length > 0) {
          const highestConfidenceLocation = locations.reduce((a: EntityExtraction, b: EntityExtraction) => a.confidence > b.confidence ? a : b);
          formData.location = highestConfidenceLocation.text;
          formData.location = highestConfidenceLocation.text;
        }
        
        if (dates.length > 0) {
          const dateEntity = dates[0];
          formData.incidentDate = formatDateFromEntity(dateEntity.text);
        }
        
        if (times.length > 0) {
          formData.incidentTime = times[0].text;
        }
        
        // Generate smart title
        formData.title = generateSmartTitle(analysis);
        
        // Generate description from summary
        if (analysis.summary) {
          formData.description = analysis.summary;
        }
        
        // Extract category from keywords
        formData.category = detectCategory(analysis);
        
        // Calculate overall confidence
        confidence = analysis.confidence || 0;
      }
    } catch (error) {
      console.error('Failed to analyze evidence:', error);
    } finally {
      isAnalyzing = false;
    }
  }
  
  async function analyzeEvidence(evidence: any) {
    const response = await fetch('/api/nlp/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: evidence.text || evidence.transcription || evidence.ocrText,
        type: evidence.type,
        fileName: evidence.fileName
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze evidence');
    }
    
    return await response.json();
  }
    function generateSmartTitle(analysis: any): string {
    const entities = analysis.entities || [];
    const persons = entities.filter((e: EntityExtraction) => e.type === 'PERSON');
    const locations = entities.filter((e: EntityExtraction) => e.type === 'GPE' || e.type === 'LOC');
    const keywords = analysis.keywords || [];
    
    let title = 'Case';
    
    if (persons.length > 0) {
      title += ` involving ${persons[0].text}`;
    }
    
    if (locations.length > 0) {
      title += ` at ${locations[0].text}`;
    }
      if (keywords.length > 0) {
      const crimeKeywords = keywords.filter((k: string) => 
        ['theft', 'robbery', 'assault', 'fraud', 'burglary', 'murder', 'vandalism'].includes(k.toLowerCase())
      );
      if (crimeKeywords.length > 0) {
        title = `${crimeKeywords[0]} case`;
        if (persons.length > 0) title += ` - ${persons[0].text}`;
        if (locations.length > 0) title += ` @ ${locations[0].text}`;
      }
    }
    
    return title;
  }
    function detectCategory(analysis: any): string {
    const keywords = (analysis.keywords || []).map((k: string) => k.toLowerCase());
    const text = (analysis.summary || '').toLowerCase();
    
    if (keywords.some((k: string) => ['theft', 'robbery', 'stolen', 'burglary'].includes(k))) return 'theft';
    if (keywords.some((k: string) => ['assault', 'battery', 'violence', 'attack'].includes(k))) return 'assault';
    if (keywords.some((k: string) => ['fraud', 'scam', 'embezzlement'].includes(k))) return 'fraud';
    if (keywords.some((k: string) => ['murder', 'homicide', 'killing'].includes(k))) return 'homicide';
    if (keywords.some((k: string) => ['drug', 'narcotics', 'trafficking'].includes(k))) return 'drug-related';
    if (keywords.some((k: string) => ['traffic', 'vehicle', 'dui', 'accident'].includes(k))) return 'traffic';
    
    return 'other';
  }
  
  function formatDateFromEntity(dateText: string): string {
    try {
      const date = new Date(dateText);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
    function loadExistingCaseData(options?: { existingCase?: any }) {
    const caseData = options?.existingCase || existingCase;
    if (!caseData) return;
    
    formData = {
      title: caseData.title || '',
      description: caseData.description || '',
      location: caseData.location || '',
      suspectName: caseData.suspectName || '',
      victimName: caseData.victimName || '',
      incidentDate: caseData.incidentDate ? new Date(caseData.incidentDate).toISOString().split('T')[0] : '',
      incidentTime: caseData.incidentTime || '',
      severity: caseData.severity || 'medium',
      category: caseData.category || '',
      tags: caseData.tags ? caseData.tags.join(', ') : '',
      notes: caseData.notes || ''
    };
  }
  
  async function loadCaseFromId(id: string) {
    if (!id) return;
    
    isLoading = true;
    try {
      const response = await fetch(`/api/cases/${id}`);
      if (response.ok) {
        const caseData = await response.json();
        loadExistingCaseData({ existingCase: caseData });
      }
    } catch (error) {
      console.error('Failed to load case:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function saveCase() {
    isLoading = true;
    try {
      const caseData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        incidentDate: formData.incidentDate ? new Date(formData.incidentDate).toISOString() : null,
        evidenceData: evidenceData
      };
      
      const url = caseId ? `/api/cases/${caseId}` : '/api/cases';
      const method = caseId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData)
      });
      
      if (response.ok) {
        const savedCase = await response.json();
        dispatch('case-saved', { case: savedCase, isUpdate: !!caseId });
      } else {
        throw new Error('Failed to save case');
      }    } catch (error) {
      console.error('Error saving case:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch('case-error', { error: errorMessage });
    } finally {
      isLoading = false;
    }
  }
  
  function clearForm() {
    formData = {
      title: '',
      description: '',
      location: '',
      suspectName: '',
      victimName: '',
      incidentDate: '',
      incidentTime: '',
      severity: 'medium',
      category: '',
      tags: '',
      notes: ''
    };
    extractedEntities = [];
    confidence = 0;
  }
</script>

<div class="auto-fill-form">
  <!-- Analysis Status -->
  {#if isAnalyzing}
    <div class="alert alert-info d-flex align-items-center">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      <div>
        <strong>Analyzing evidence...</strong>
        <br><small>Extracting entities and generating case details</small>
      </div>
    </div>
  {/if}
  
  <!-- Confidence Indicator -->
  {#if confidence > 0 && !isAnalyzing}
    <div class="alert alert-success">
      <i class="bi bi-check-circle me-2"></i>
      <strong>Auto-fill Confidence: {Math.round(confidence * 100)}%</strong>
      <small class="d-block">
        {extractedEntities.length} entities extracted from evidence
      </small>
    </div>
  {/if}
  
  <form on:submit|preventDefault={saveCase}>
    <div class="row">
      <!-- Basic Information -->
      <div class="col-md-8">
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-info-circle me-2"></i>
              Case Information
            </h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="title" class="form-label">Case Title</label>
              <input 
                type="text" 
                class="form-control" 
                id="title"
                bind:value={formData.title}
                placeholder="Enter case title..."
                required
              />
            </div>
            
            <div class="mb-3">
              <label for="description" class="form-label">Description</label>
              <textarea 
                class="form-control" 
                id="description"
                rows="4"
                bind:value={formData.description}
                placeholder="Case description and summary..."
              ></textarea>
            </div>
            
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="category" class="form-label">Category</label>
                <select class="form-select" id="category" bind:value={formData.category}>
                  <option value="">Select category...</option>
                  <option value="theft">Theft</option>
                  <option value="assault">Assault</option>
                  <option value="fraud">Fraud</option>
                  <option value="homicide">Homicide</option>
                  <option value="drug-related">Drug-related</option>
                  <option value="traffic">Traffic</option>
                  <option value="cybercrime">Cybercrime</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div class="col-md-6 mb-3">
                <label for="severity" class="form-label">Severity</label>
                <select class="form-select" id="severity" bind:value={formData.severity}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <!-- People & Locations -->
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-people me-2"></i>
              People & Locations
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="suspectName" class="form-label">Suspect Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="suspectName"
                  bind:value={formData.suspectName}
                  placeholder="Enter suspect name..."
                />
              </div>
              
              <div class="col-md-6 mb-3">
                <label for="victimName" class="form-label">Victim Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="victimName"
                  bind:value={formData.victimName}
                  placeholder="Enter victim name..."
                />
              </div>
            </div>
            
            <div class="mb-3">
              <label for="location" class="form-label">Location</label>
              <input 
                type="text" 
                class="form-control" 
                id="location"
                bind:value={formData.location}
                placeholder="Incident location..."
              />
            </div>
          </div>
        </div>
        
        <!-- Timeline -->
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-clock me-2"></i>
              Timeline
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="incidentDate" class="form-label">Incident Date</label>
                <input 
                  type="date" 
                  class="form-control" 
                  id="incidentDate"
                  bind:value={formData.incidentDate}
                />
              </div>
              
              <div class="col-md-6 mb-3">
                <label for="incidentTime" class="form-label">Incident Time</label>
                <input 
                  type="time" 
                  class="form-control" 
                  id="incidentTime"
                  bind:value={formData.incidentTime}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sidebar -->
      <div class="col-md-4">
        <!-- Extracted Entities -->
        {#if extractedEntities.length > 0}
          <div class="card mb-3">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="bi bi-tag me-2"></i>
                Extracted Entities
              </h6>
            </div>
            <div class="card-body">
              {#each extractedEntities as entity}
                <span 
                  class="badge bg-secondary me-2 mb-2"
                  title="Confidence: {Math.round(entity.confidence * 100)}%"
                >
                  {entity.text} ({entity.type})
                </span>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Tags & Notes -->
        <div class="card mb-3">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-tags me-2"></i>
              Tags & Notes
            </h6>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="tags" class="form-label">Tags</label>
              <input 
                type="text" 
                class="form-control" 
                id="tags"
                bind:value={formData.tags}
                placeholder="tag1, tag2, tag3..."
              />
              <div class="form-text">Separate tags with commas</div>
            </div>
            
            <div class="mb-3">
              <label for="notes" class="form-label">Notes</label>
              <textarea 
                class="form-control" 
                id="notes"
                rows="4"
                bind:value={formData.notes}
                placeholder="Additional notes..."
              ></textarea>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="card">
          <div class="card-body">
            <div class="d-grid gap-2">
              <button 
                type="submit" 
                class="btn btn-primary"
                disabled={isLoading || !formData.title}
              >
                {#if isLoading}
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                {/if}
                <i class="bi bi-save me-2"></i>
                {caseId ? 'Update Case' : 'Create Case'}
              </button>
              
              <button 
                type="button" 
                class="btn btn-outline-secondary"
                on:click={clearForm}
                disabled={isLoading}
              >
                <i class="bi bi-arrow-clockwise me-2"></i>
                Clear Form
              </button>
              
              {#if evidenceData}
                <button 
                  type="button" 
                  class="btn btn-outline-info"
                  on:click={autoFillFromEvidence}
                  disabled={isAnalyzing}
                >
                  <i class="bi bi-magic me-2"></i>
                  Re-analyze Evidence
                </button>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</div>

<style>
  .auto-fill-form {
    animation: fadeIn 0.3s ease-in;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .badge {
    cursor: help;
  }
</style>
