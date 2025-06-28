<script lang="ts">
  import { onMount } from 'svelte';
  import CitationManager from '$lib/components/CitationManager.svelte';
  import type { LegacyCitationPoint } from '$lib/data/types';
  
  let selectedTab: 'manager' | 'search' | 'api' = 'manager';
  let demoResults: LegacyCitationPoint[] = [];
  let searchQuery = '';
  let loading = false;

  // Demo API interaction
  async function testAPISearch() {
    if (!searchQuery.trim()) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/citations?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        demoResults = data.citations;
      } else {
        console.error('API Error:', data.error);
      }
    } catch (error) {
      console.error('Failed to search citations:', error);
    } finally {
      loading = false;
    }
  }

  async function testCreateCitation() {
    loading = true;
    try {
      const response = await fetch('/api/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          summary: 'Test citation created via API demo',
          source: 'demo/api_test',
          labels: ['api', 'demo', 'test']
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Citation created successfully!');
        // Refresh if on manager tab
        if (selectedTab === 'manager') {
          window.location.reload();
        }
      } else {
        alert('Failed to create citation: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create citation:', error);
      alert('Failed to create citation');
    } finally {
      loading = false;
    }
  }

  async function testAISummarization() {
    loading = true;
    try {
      const response = await fetch('/api/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          sourceData: 'Sample evidence data for AI processing',
          sourceType: 'document'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`AI Summary: ${data.summary}\nConfidence: ${(data.confidence * 100).toFixed(1)}%`);
      } else {
        alert('Failed to generate summary: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Failed to generate summary');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Citation Point System Demo - Legal AI Platform</title>
</svelte:head>

<div class="demo-container">
  <div class="demo-header">
    <h1>Citation Point System Demo</h1>
    <p class="subtitle">
      Intelligent legal citation management with AI-powered summarization, 
      hybrid search, and case linking capabilities.
    </p>
  </div>

  <div class="demo-tabs">
    <button 
      class="tab-button {selectedTab === 'manager' ? 'active' : ''}"
      on:click={() => selectedTab = 'manager'}
    >
      Citation Manager
    </button>
    <button 
      class="tab-button {selectedTab === 'search' ? 'active' : ''}"
      on:click={() => selectedTab = 'search'}
    >
      Search Demo
    </button>
    <button 
      class="tab-button {selectedTab === 'api' ? 'active' : ''}"
      on:click={() => selectedTab = 'api'}
    >
      API Demo
    </button>
  </div>

  <div class="demo-content">
    {#if selectedTab === 'manager'}
      <div class="tab-panel">
        <div class="panel-header">
          <h2>Citation Manager</h2>
          <p>
            Full-featured citation point management with search, creation, and case linking.
            Powered by LokiJS for fast in-memory operations.
          </p>
        </div>
        
        <CitationManager />
      </div>

    {:else if selectedTab === 'search'}
      <div class="tab-panel">
        <div class="panel-header">
          <h2>Hybrid Search Demo</h2>
          <p>
            Test the hybrid search functionality combining fuzzy text matching 
            with semantic similarity ranking.
          </p>
        </div>

        <div class="search-demo">
          <div class="search-controls">
            <div class="search-input-group">
              <input
                type="text"
                placeholder="Search citations by content, source, or labels..."
                bind:value={searchQuery}
                on:keydown={(e) => e.key === 'Enter' && testAPISearch()}
              />
              <button on:click={testAPISearch} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          <div class="search-results">
            {#if demoResults.length > 0}
              <h3>Search Results ({demoResults.length})</h3>
              <div class="results-grid">
                {#each demoResults as citation}
                  <div class="result-card">
                    <div class="result-header">
                      <span class="result-source">{citation.source}</span>
                      <span class="result-date">
                        {new Date(citation.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div class="result-summary">{citation.summary}</div>
                    <div class="result-labels">
                      {#each citation.labels as label}
                        <span class="result-label">{label}</span>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="no-results">
                <p>No search results. Try searching for terms like "forensics", "timeline", or "evidence".</p>
              </div>
            {/if}
          </div>
        </div>
      </div>

    {:else if selectedTab === 'api'}
      <div class="tab-panel">
        <div class="panel-header">
          <h2>API Demo</h2>
          <p>
            Test the Citation Point API endpoints for integration with external systems.
          </p>
        </div>

        <div class="api-demo">
          <div class="api-actions">
            <div class="action-group">
              <h3>Create Citation</h3>
              <p>Creates a new citation point with sample data.</p>
              <button on:click={testCreateCitation} disabled={loading}>
                {loading ? 'Creating...' : 'Create Test Citation'}
              </button>
            </div>

            <div class="action-group">
              <h3>AI Summarization</h3>
              <p>Test the AI-powered evidence summarization feature.</p>
              <button on:click={testAISummarization} disabled={loading}>
                {loading ? 'Processing...' : 'Generate AI Summary'}
              </button>
            </div>

            <div class="action-group">
              <h3>API Endpoints</h3>
              <div class="endpoint-list">
                <div class="endpoint">
                  <span class="method get">GET</span>
                  <span class="path">/api/citations</span>
                  <span class="description">List and search citations</span>
                </div>
                <div class="endpoint">
                  <span class="method post">POST</span>
                  <span class="path">/api/citations</span>
                  <span class="description">Create, link, or summarize citations</span>
                </div>
                <div class="endpoint">
                  <span class="method put">PUT</span>
                  <span class="path">/api/citations/[id]</span>
                  <span class="description">Update existing citation</span>
                </div>
                <div class="endpoint">
                  <span class="method delete">DELETE</span>
                  <span class="path">/api/citations/[id]</span>
                  <span class="description">Delete citation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="demo-footer">
    <div class="feature-highlights">
      <h3>Key Features</h3>
      <ul>
        <li>🧠 <strong>AI-Powered Summarization:</strong> Automatically extract key insights from evidence</li>
        <li>🔍 <strong>Hybrid Search:</strong> Combine fuzzy matching with semantic similarity</li>
        <li>🔗 <strong>Case Linking:</strong> Connect citations to cases with drag-and-drop interface</li>
        <li>⚡ <strong>Fast Operations:</strong> LokiJS in-memory database for instant responses</li>
        <li>📱 <strong>Responsive UI:</strong> Works seamlessly on desktop and mobile</li>
        <li>🌐 <strong>API Ready:</strong> RESTful endpoints for external integrations</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .demo-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .demo-header {
    text-align: center;
    margin-bottom: 40px;
    padding: 40px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px;
  }

  .demo-header h1 {
    margin: 0 0 16px 0;
    font-size: 2.5rem;
    font-weight: 700;
  }

  .subtitle {
    margin: 0;
    font-size: 1.125rem;
    opacity: 0.9;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .demo-tabs {
    display: flex;
    margin-bottom: 32px;
    border-bottom: 1px solid #e5e7eb;
  }

  .tab-button {
    background: none;
    border: none;
    padding: 12px 24px;
    font-size: 1rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .tab-button:hover {
    color: #374151;
    background: #f9fafb;
  }

  .tab-button.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }

  .demo-content {
    min-height: 600px;
  }

  .tab-panel {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .panel-header {
    margin-bottom: 32px;
    text-align: center;
  }

  .panel-header h2 {
    margin: 0 0 8px 0;
    color: #111827;
    font-size: 1.875rem;
    font-weight: 600;
  }

  .panel-header p {
    margin: 0;
    color: #6b7280;
    font-size: 1.125rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .search-demo {
    max-width: 800px;
    margin: 0 auto;
  }

  .search-controls {
    margin-bottom: 32px;
  }

  .search-input-group {
    display: flex;
    gap: 12px;
  }

  .search-input-group input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .search-input-group input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }

  .search-input-group button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .search-input-group button:hover:not(:disabled) {
    background: #2563eb;
  }

  .search-input-group button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .results-grid {
    display: grid;
    gap: 16px;
  }

  .result-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    transition: box-shadow 0.2s ease;
  }

  .result-card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .result-source {
    font-weight: 500;
    color: #3b82f6;
  }

  .result-summary {
    margin-bottom: 12px;
    line-height: 1.5;
    color: #374151;
  }

  .result-labels {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .result-label {
    background: #f3f4f6;
    color: #374151;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .no-results {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
  }

  .api-demo {
    max-width: 800px;
    margin: 0 auto;
  }

  .api-actions {
    display: grid;
    gap: 32px;
  }

  .action-group {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
  }

  .action-group h3 {
    margin: 0 0 8px 0;
    color: #111827;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .action-group p {
    margin: 0 0 16px 0;
    color: #6b7280;
  }

  .action-group button {
    background: #10b981;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .action-group button:hover:not(:disabled) {
    background: #059669;
  }

  .action-group button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .endpoint-list {
    display: grid;
    gap: 8px;
  }

  .endpoint {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    font-size: 0.875rem;
  }

  .method {
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    min-width: 50px;
    text-align: center;
  }

  .method.get { background: #dbeafe; color: #1e40af; }
  .method.post { background: #d1fae5; color: #065f46; }
  .method.put { background: #fef3c7; color: #92400e; }
  .method.delete { background: #fee2e2; color: #991b1b; }

  .path {
    font-family: 'Monaco', 'Menlo', monospace;
    color: #374151;
    font-weight: 500;
  }

  .description {
    color: #6b7280;
  }

  .demo-footer {
    margin-top: 60px;
    padding: 40px 0;
    border-top: 1px solid #e5e7eb;
  }

  .feature-highlights {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
  }

  .feature-highlights h3 {
    margin: 0 0 24px 0;
    color: #111827;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .feature-highlights ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 16px;
    text-align: left;
  }

  .feature-highlights li {
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    line-height: 1.5;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .demo-container {
      padding: 16px;
    }

    .demo-header {
      padding: 32px 16px;
    }

    .demo-header h1 {
      font-size: 2rem;
    }

    .demo-tabs {
      overflow-x: auto;
    }

    .tab-button {
      flex-shrink: 0;
      padding: 12px 20px;
    }

    .search-input-group {
      flex-direction: column;
    }

    .endpoint {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .feature-highlights ul {
      gap: 12px;
    }
  }
</style>
