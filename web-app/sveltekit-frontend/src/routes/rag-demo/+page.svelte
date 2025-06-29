<!-- RAG System Demo Page -->
<script lang="ts">
  import { onMount } from 'svelte';
  import AskAI from '$lib/components/ai/AskAI.svelte';
  import { Search, Database, Brain, Zap, CheckCircle, AlertTriangle } from 'lucide-svelte';

  interface SystemStatus {
    database: boolean;
    qdrant: boolean;
    embeddings: boolean;
    vectorSearch: boolean;
  }

  let systemStatus: SystemStatus = {
    database: false,
    qdrant: false,
    embeddings: false,
    vectorSearch: false
  };

  let isLoadingStatus = true;
  let testQuery = '';
  let testResults: any = null;
  let isTestingSearch = false;

  // Demo queries
  const demoQueries = [
    "What are the most common types of evidence in fraud cases?",
    "Explain the legal requirements for search warrants",
    "How should digital evidence be preserved?",
    "What are the key elements of a criminal investigation?",
    "Summarize the chain of custody procedures"
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
            searchType: 'hybrid'
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
</script>

<svelte:head>
  <title>RAG System Demo - AI Legal Assistant</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        RAG System Demo
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Production-ready Retrieval-Augmented Generation system with PostgreSQL + pgvector, 
        Qdrant vector database, and intelligent legal assistant capabilities.
      </p>
    </div>

    <!-- System Status -->
    <div class="mb-8">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">System Status</h2>
          <button
            on:click={checkSystemStatus}
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isLoadingStatus}
          >
            {isLoadingStatus ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>
      </div>
    </div>

    <!-- Main Demo Area -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- AI Assistant -->
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">AI Legal Assistant</h3>
            <p class="text-sm text-gray-600 mt-1">
              Ask questions about legal procedures, cases, and evidence. 
              The AI uses vector search to find relevant information.
            </p>
          </div>
          
          <div class="p-4">
            <AskAI
              placeholder="Ask about legal procedures, cases, or evidence..."
              showReferences={true}
              enableVoiceInput={true}
              maxHeight="500px"
              on:response={handleAIResponse}
              on:referenceClicked={handleReferenceClick}
            />
          </div>
        </div>

        <!-- Demo Queries -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 class="font-medium text-gray-900 mb-3">Try these sample questions:</h4>
          <div class="space-y-2">
            {#each demoQueries as query}
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

      <!-- Vector Search Test -->
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Vector Search Test</h3>
            <p class="text-sm text-gray-600 mt-1">
              Test the vector similarity search directly to see raw results.
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
                            <span class="text-xs text-gray-500">
                              {Math.round(result.score * 100)}% match
                            </span>
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

        <!-- System Information -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 class="font-medium text-gray-900 mb-3">System Information</h4>
          <div class="text-sm text-gray-600 space-y-2">
            <div class="flex justify-between">
              <span>Vector Database:</span>
              <span>PostgreSQL + pgvector / Qdrant</span>
            </div>
            <div class="flex justify-between">
              <span>Embedding Model:</span>
              <span>OpenAI text-embedding-ada-002</span>
            </div>
            <div class="flex justify-between">
              <span>LLM:</span>
              <span>GPT-3.5-turbo / Ollama (Local)</span>
            </div>
            <div class="flex justify-between">
              <span>Search Types:</span>
              <span>Similarity, Hybrid, Semantic</span>
            </div>
            <div class="flex justify-between">
              <span>Caching:</span>
              <span>Redis + IndexedDB</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 class="font-medium text-gray-900 mb-3">Quick Actions</h4>
          <div class="space-y-2">
            <a
              href="/api/embeddings"
              target="_blank"
              class="block text-sm text-blue-600 hover:text-blue-800"
            >
              → View Embeddings API Status
            </a>
            <a
              href="/api/qdrant"
              target="_blank"
              class="block text-sm text-blue-600 hover:text-blue-800"
            >
              → View Qdrant Collection Status
            </a>
            <button
              class="block text-sm text-blue-600 hover:text-blue-800"
              on:click={() => window.open('/cases', '_blank')}
            >
              → Browse Case Database
            </button>
            <button
              class="block text-sm text-blue-600 hover:text-blue-800"
              on:click={() => window.open('/evidence', '_blank')}
            >
              → Browse Evidence Collection
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Setup Instructions -->
    <div class="mt-8 bg-blue-50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-blue-900 mb-3">Setup Instructions</h3>
      <div class="text-sm text-blue-800 space-y-2">
        <p><strong>1. Start the services:</strong> <code>npm run db:start</code></p>
        <p><strong>2. Initialize vector search:</strong> <code>npm run vector:init</code></p>
        <p><strong>3. Sync existing data:</strong> <code>npm run vector:sync</code></p>
        <p><strong>4. Configure environment:</strong> Set OpenAI API key in <code>.env</code></p>
      </div>
    </div>
  </div>
</div>

<style>
  code {
    @apply bg-blue-100 px-2 py-1 rounded text-sm font-mono;
  }
</style>
