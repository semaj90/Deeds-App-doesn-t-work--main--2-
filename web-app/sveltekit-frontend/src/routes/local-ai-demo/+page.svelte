<!-- Enhanced RAG Demo with Local LLM Support -->
<script lang="ts">
  import { onMount } from 'svelte';
  import AskAI from '$lib/components/ai/AskAI.svelte';
  import { tauriLLM, type LocalModel } from '$lib/services/tauri-llm';
  import { aiService } from '$lib/services/ai-service';
  import { Search, Database, Brain, Zap, CheckCircle, AlertTriangle, Cpu, Cloud, Shield } from 'lucide-svelte';

  interface SystemStatus {
    database: boolean;
    qdrant: boolean;
    embeddings: boolean;
    vectorSearch: boolean;
    tauriLLM: boolean;
    localModels: LocalModel[];
  }

  let systemStatus: SystemStatus = {
    database: false,
    qdrant: false,
    embeddings: false,
    vectorSearch: false,
    tauriLLM: false,
    localModels: []
  };

  let isLoadingStatus = true;
  let testQuery = '';
  let testResults: any = null;
  let isTestingSearch = false;
  let selectedProvider: 'auto' | 'local' | 'cloud' = 'auto';
  let legalAnalysisText = '';
  let analysisResults: any = null;
  let isAnalyzing = false;

  // Demo queries optimized for legal domain
  const legalDemoQueries = [
    "What are the key elements required to establish a breach of contract?",
    "Explain the difference between criminal and civil liability",
    "What constitutes admissible evidence in federal court?",
    "How does attorney-client privilege protect confidential communications?",
    "What are the requirements for a valid search warrant?",
    "Explain the burden of proof in criminal vs civil cases"
  ];

  onMount(async () => {
    await checkSystemStatus();
  });

  async function checkSystemStatus() {
    isLoadingStatus = true;

    try {
      // Check database connection
      const dbResponse = await fetch('/api/search/cases?limit=1');
      systemStatus.database = dbResponse.ok;

      // Check Qdrant
      const qdrantResponse = await fetch('/api/qdrant');
      systemStatus.qdrant = qdrantResponse.ok;

      // Check embeddings
      const embeddingResponse = await fetch('/api/embeddings');
      systemStatus.embeddings = embeddingResponse.ok;

      // Check vector search
      const vectorResponse = await fetch('/api/search/vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'test', 
          options: { limit: 1 } 
        })
      });
      systemStatus.vectorSearch = vectorResponse.ok;

      // Check Tauri LLM capabilities
      await tauriLLM.initialize();
      systemStatus.tauriLLM = tauriLLM.isAvailable();
      systemStatus.localModels = tauriLLM.getAvailableModels();

    } catch (error) {
      console.error('Status check failed:', error);
    } finally {
      isLoadingStatus = false;
    }
  }

  async function testVectorSearch() {
    if (!testQuery.trim()) return;

    isTestingSearch = true;
    testResults = null;

    try {
      const response = await fetch('/api/search/vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery,
          options: {
            limit: 5,
            threshold: 0.5,
            searchType: 'hybrid',
            provider: selectedProvider
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        testResults = data.data;
      } else {
        const error = await response.json();
        testResults = { error: error.error };
      }
    } catch (error) {
      testResults = { error: 'Network error' };
    } finally {
      isTestingSearch = false;
    }
  }

  async function analyzeLegalDocument() {
    if (!legalAnalysisText.trim()) return;

    isAnalyzing = true;
    analysisResults = null;

    try {
      // Use enhanced AI service for legal analysis
      await aiService.initialize();
      
      if (systemStatus.tauriLLM) {
        // Use local legal analysis
        analysisResults = await aiService.analyzeLegalDocument(legalAnalysisText);
      } else {
        // Fallback to cloud analysis
        const response = await fetch('/api/ai/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `Analyze this legal document and provide classification, key points, and risk assessment: ${legalAnalysisText}`,
            options: {
              provider: 'auto',
              legalContext: true,
              maxTokens: 800
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          analysisResults = {
            classification: { category: 'document', confidence: 0.8 },
            summary: data.data.answer,
            keyEntities: ['Legal Document'],
            riskAssessment: 'Analysis completed using cloud AI'
          };
        }
      }
    } catch (error) {
      analysisResults = { error: error.message };
    } finally {
      isAnalyzing = false;
    }
  }

  async function loadLocalModel(modelId: string) {
    try {
      await tauriLLM.loadModel(modelId);
      await checkSystemStatus(); // Refresh status
    } catch (error) {
      console.error('Failed to load model:', error);
    }
  }

  function handleAIResponse(event: CustomEvent) {
    console.log('AI Response:', event.detail);
  }

  function handleReferenceClick(event: CustomEvent) {
    console.log('Reference clicked:', event.detail);
  }

  function getStatusIcon(status: boolean) {
    return status ? CheckCircle : AlertTriangle;
  }

  function getStatusColor(status: boolean) {
    return status ? 'text-green-600' : 'text-red-600';
  }

  function getProviderIcon(provider: string) {
    switch (provider) {
      case 'local': return Cpu;
      case 'cloud': return Cloud;
      default: return Brain;
    }
  }
</script>

<svelte:head>
  <title>Enhanced RAG Demo - Local AI + Cloud Integration</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Enhanced RAG System Demo
      </h1>
      <p class="text-xl text-gray-600 max-w-4xl mx-auto">
        Production-ready Retrieval-Augmented Generation with <strong>Local Rust LLMs</strong>, 
        Legal-BERT models, PostgreSQL + pgvector, Qdrant, and intelligent fallback mechanisms.
      </p>
      <div class="mt-4 flex justify-center space-x-4">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <Shield class="w-4 h-4 mr-1" />
          Privacy-First Local AI
        </span>
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <Cpu class="w-4 h-4 mr-1" />
          Rust + Legal-BERT
        </span>
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          <Cloud class="w-4 h-4 mr-1" />
          Cloud Fallback
        </span>
      </div>
    </div>

    <!-- System Status -->
    <div class="mb-8">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Enhanced System Status</h2>
          <button
            on:click={checkSystemStatus}
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isLoadingStatus}
          >
            {isLoadingStatus ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div class="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <Database class="w-5 h-5 {getStatusColor(systemStatus.database)}" />
            <div>
              <p class="text-sm font-medium text-gray-900">Database</p>
              <p class="text-xs {getStatusColor(systemStatus.database)}">
                {systemStatus.database ? 'Connected' : 'Offline'}
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <Zap class="w-5 h-5 {getStatusColor(systemStatus.qdrant)}" />
            <div>
              <p class="text-sm font-medium text-gray-900">Qdrant</p>
              <p class="text-xs {getStatusColor(systemStatus.qdrant)}">
                {systemStatus.qdrant ? 'Ready' : 'Unavailable'}
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <Brain class="w-5 h-5 {getStatusColor(systemStatus.embeddings)}" />
            <div>
              <p class="text-sm font-medium text-gray-900">Embeddings</p>
              <p class="text-xs {getStatusColor(systemStatus.embeddings)}">
                {systemStatus.embeddings ? 'Active' : 'Disabled'}
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <Search class="w-5 h-5 {getStatusColor(systemStatus.vectorSearch)}" />
            <div>
              <p class="text-sm font-medium text-gray-900">Vector Search</p>
              <p class="text-xs {getStatusColor(systemStatus.vectorSearch)}">
                {systemStatus.vectorSearch ? 'Operational' : 'Error'}
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
            <Cpu class="w-5 h-5 {getStatusColor(systemStatus.tauriLLM)}" />
            <div>
              <p class="text-sm font-medium text-gray-900">Local LLM</p>
              <p class="text-xs {getStatusColor(systemStatus.tauriLLM)}">
                {systemStatus.tauriLLM ? 'Available' : 'Not Available'}
              </p>
            </div>
          </div>
        </div>

        <!-- Local Models Status -->
        {#if systemStatus.tauriLLM && systemStatus.localModels.length > 0}
          <div class="mt-6 pt-6 border-t border-gray-200">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Local AI Models</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each systemStatus.localModels as model}
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-medium text-gray-900">{model.name}</h4>
                    <span class="text-xs px-2 py-1 rounded-full {model.isLoaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
                      {model.isLoaded ? 'Loaded' : 'Available'}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600 space-y-1">
                    <p><span class="font-medium">Type:</span> {model.type}</p>
                    <p><span class="font-medium">Domain:</span> {model.domain}</p>
                    <p><span class="font-medium">Architecture:</span> {model.architecture}</p>
                    {#if model.dimensions}
                      <p><span class="font-medium">Dimensions:</span> {model.dimensions}</p>
                    {/if}
                  </div>
                  {#if !model.isLoaded}
                    <button
                      on:click={() => loadLocalModel(model.id)}
                      class="mt-3 w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Load Model
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Main Demo Area -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <!-- AI Assistant -->
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Enhanced AI Legal Assistant</h3>
            <p class="text-sm text-gray-600 mt-1">
              Ask questions using local Legal-BERT models or cloud LLMs with automatic fallback.
            </p>
          </div>
          
          <div class="p-4">
            <!-- Provider Selection -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
              <div class="flex space-x-3">
                <button
                  class="flex items-center px-3 py-2 text-sm rounded-md {selectedProvider === 'auto' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}"
                  on:click={() => selectedProvider = 'auto'}
                >
                  <Brain class="w-4 h-4 mr-1" />
                  Auto
                </button>
                <button
                  class="flex items-center px-3 py-2 text-sm rounded-md {selectedProvider === 'local' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}"
                  on:click={() => selectedProvider = 'local'}
                  disabled={!systemStatus.tauriLLM}
                >
                  <Cpu class="w-4 h-4 mr-1" />
                  Local Only
                </button>
                <button
                  class="flex items-center px-3 py-2 text-sm rounded-md {selectedProvider === 'cloud' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}"
                  on:click={() => selectedProvider = 'cloud'}
                >
                  <Cloud class="w-4 h-4 mr-1" />
                  Cloud Only
                </button>
              </div>
            </div>

            <AskAI
              placeholder="Ask about legal procedures, cases, or evidence..."
              showReferences={true}
              enableVoiceInput={true}
              maxHeight="400px"
              on:response={handleAIResponse}
              on:referenceClicked={handleReferenceClick}
            />
          </div>
        </div>

        <!-- Legal Demo Queries -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 class="font-medium text-gray-900 mb-3">Legal Domain Sample Questions:</h4>
          <div class="space-y-2">
            {#each legalDemoQueries as query}
              <button
                class="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded"
                on:click={() => testQuery = query}
              >
                "{query}"
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Legal Document Analysis & Vector Search -->
      <div class="space-y-6">
        <!-- Document Analysis -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Legal Document Analysis</h3>
            <p class="text-sm text-gray-600 mt-1">
              Analyze legal documents using local Legal-BERT models for classification and risk assessment.
            </p>
          </div>
          
          <div class="p-4">
            <textarea
              bind:value={legalAnalysisText}
              placeholder="Paste a legal document excerpt for analysis..."
              class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            ></textarea>
            
            <button
              on:click={analyzeLegalDocument}
              disabled={!legalAnalysisText.trim() || isAnalyzing}
              class="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Document'}
            </button>

            {#if analysisResults}
              <div class="mt-4 bg-gray-50 rounded-md p-4">
                {#if analysisResults.error}
                  <div class="text-red-600">
                    <strong>Error:</strong> {analysisResults.error}
                  </div>
                {:else}
                  <div class="space-y-3">
                    {#if analysisResults.classification}
                      <div>
                        <h5 class="font-medium text-gray-900">Classification:</h5>
                        <p class="text-sm text-gray-600">
                          {analysisResults.classification.category} 
                          ({Math.round(analysisResults.classification.confidence * 100)}% confidence)
                        </p>
                      </div>
                    {/if}
                    
                    {#if analysisResults.summary}
                      <div>
                        <h5 class="font-medium text-gray-900">Summary:</h5>
                        <p class="text-sm text-gray-600">{analysisResults.summary}</p>
                      </div>
                    {/if}
                    
                    {#if analysisResults.keyEntities}
                      <div>
                        <h5 class="font-medium text-gray-900">Key Entities:</h5>
                        <div class="flex flex-wrap gap-1 mt-1">
                          {#each analysisResults.keyEntities.slice(0, 5) as entity}
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {entity}
                            </span>
                          {/each}
                        </div>
                      </div>
                    {/if}
                    
                    {#if analysisResults.riskAssessment}
                      <div>
                        <h5 class="font-medium text-gray-900">Risk Assessment:</h5>
                        <p class="text-sm text-gray-600">{analysisResults.riskAssessment}</p>
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- Vector Search Test -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Vector Search Test</h3>
            <p class="text-sm text-gray-600 mt-1">
              Test vector similarity search with hybrid local/cloud embedding generation.
            </p>
          </div>
          
          <div class="p-4">
            <div class="flex space-x-3 mb-4">
              <input
                bind:value={testQuery}
                placeholder="Enter search query..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                on:click={testVectorSearch}
                disabled={!testQuery.trim() || isTestingSearch}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isTestingSearch ? 'Searching...' : 'Search'}
              </button>
            </div>

            {#if testResults}
              <div class="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                {#if testResults.error}
                  <div class="text-red-600">
                    <strong>Error:</strong> {testResults.error}
                  </div>
                {:else}
                  <div class="space-y-3">
                    <div class="text-sm text-gray-600">
                      Found {testResults.results?.length || 0} results in {testResults.executionTime || 0}ms
                      (Source: {testResults.source || 'unknown'})
                    </div>
                    
                    {#if testResults.results && testResults.results.length > 0}
                      {#each testResults.results as result}
                        <div class="bg-white p-3 rounded border border-gray-200">
                          <div class="flex justify-between items-start mb-2">
                            <h5 class="font-medium text-gray-900">{result.title}</h5>
                            <div class="flex items-center space-x-2">
                              <span class="text-xs text-gray-500">
                                {Math.round(result.score * 100)}% match
                              </span>
                              <svelte:component 
                                this={getProviderIcon(result.source)} 
                                class="w-3 h-3 text-gray-400" 
                              />
                            </div>
                          </div>
                          <p class="text-sm text-gray-600 mb-2">
                            {result.content.substring(0, 200)}...
                          </p>
                          <div class="flex space-x-2 text-xs text-gray-500">
                            <span>Type: {result.type}</span>
                            <span>Source: {result.source}</span>
                          </div>
                        </div>
                      {/each}
                    {:else}
                      <p class="text-gray-500">No results found.</p>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Architecture Information -->
    <div class="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Enhanced RAG Architecture</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Local AI (Rust)</h4>
          <ul class="text-gray-600 space-y-1">
            <li>• Legal-BERT embeddings</li>
            <li>• Document classification</li>
            <li>• Privacy-first processing</li>
            <li>• Offline capabilities</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Vector Databases</h4>
          <ul class="text-gray-600 space-y-1">
            <li>• PostgreSQL + pgvector</li>
            <li>• Qdrant for advanced search</li>
            <li>• HNSW indexing</li>
            <li>• Metadata filtering</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Cloud Fallbacks</h4>
          <ul class="text-gray-600 space-y-1">
            <li>• OpenAI embeddings</li>
            <li>• GPT-3.5/4 chat</li>
            <li>• Ollama local LLMs</li>
            <li>• Intelligent routing</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Performance</h4>
          <ul class="text-gray-600 space-y-1">
            <li>• Redis caching</li>
            <li>• IndexedDB storage</li>
            <li>• Batch processing</li>
            <li>• Memory optimization</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Setup Instructions -->
    <div class="mt-8 bg-blue-50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-blue-900 mb-3">Setup Instructions</h3>
      <div class="text-sm text-blue-800 space-y-2">
        <p><strong>1. Start services:</strong> <code>npm run db:start</code></p>
        <p><strong>2. Initialize vector search:</strong> <code>npm run vector:init</code></p>
        <p><strong>3. Set up Tauri (optional):</strong> See <code>TAURI_RUST_SETUP.md</code></p>
        <p><strong>4. Configure environment:</strong> Set API keys in <code>.env</code></p>
        <p><strong>5. Test local models:</strong> Load legal-BERT models for offline AI</p>
      </div>
    </div>
  </div>
</div>

<style>
  code {
    @apply bg-blue-100 px-2 py-1 rounded text-sm font-mono;
  }
</style>
