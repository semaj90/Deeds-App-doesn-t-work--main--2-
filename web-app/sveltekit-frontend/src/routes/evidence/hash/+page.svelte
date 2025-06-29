<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  let hashInput = '81d9c48f998f9025eb8f72e28a6c4f921ed407dd75891a9e9a8778c9ad5711bd';
  let searchResult: any = null;
  let loading = false;
  let error = '';

  onMount(() => {
    // Check if hash was provided in URL
    const urlHash = $page.url.searchParams.get('hash');
    if (urlHash) {
      hashInput = urlHash;
      searchByHash();
    }
  });

  async function searchByHash() {
    if (!hashInput || hashInput.length !== 64) {
      error = 'Please enter a valid 64-character SHA256 hash';
      return;
    }

    loading = true;
    error = '';
    searchResult = null;

    try {
      const response = await fetch(`/api/evidence/hash?hash=${hashInput}`);
      const result = await response.json();
      
      if (response.ok) {
        searchResult = result;
      } else {
        error = result.error || 'Search failed';
      }
    } catch (e) {
      error = 'Network error occurred';
    } finally {
      loading = false;
    }
  }

  async function verifyIntegrity(evidenceId: string) {
    if (!evidenceId) return;
    
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/evidence/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: hashInput, evidenceId })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Integrity Check: ${result.message}`);
      } else {
        error = result.error || 'Verification failed';
      }
    } catch (e) {
      error = 'Network error occurred';
    } finally {
      loading = false;
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  }
</script>

<svelte:head>
  <title>Evidence Hash Verification - Legal Case Management</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-2">🔐 Evidence Hash Verification</h1>
    <p class="text-gray-600">
      Verify file integrity and search for evidence using SHA256 hashes
    </p>
  </div>

  <div class="bg-white rounded-lg shadow-md">
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4">Hash Search & Verification</h2>
      
      <div class="mb-4">
        <label for="hash-input" class="block text-sm font-medium mb-2">
          SHA256 Hash (64 characters)
        </label>
        <div class="flex gap-2">
          <input
            id="hash-input"
            type="text"
            bind:value={hashInput}
            placeholder="Enter SHA256 hash..."
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
            maxlength="64"
          />
          <button 
            on:click={searchByHash} 
            disabled={loading || !hashInput}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Example: 81d9c48f998f9025eb8f72e28a6c4f921ed407dd75891a9e9a8778c9ad5711bd
        </p>
      </div>

      {#if error}
        <div class="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700">
          <strong>Error:</strong> {error}
        </div>
      {/if}

      {#if searchResult}
        <div class="border-t pt-4">
          <h3 class="text-lg font-semibold mb-3">Search Results</h3>
          
          {#if searchResult.found}
            <div class="mb-3 p-3 bg-green-100 border border-green-300 rounded-md text-green-700">
              <strong>✅ {searchResult.message}</strong>
            </div>
            
            <div class="space-y-4">
              {#each searchResult.evidence as item}
                <div class="bg-white rounded-lg shadow border">
                  <div class="p-4 border-l-4 border-blue-500">
                    <div class="flex justify-between items-start mb-2">
                      <h4 class="font-semibold text-lg">{item.title}</h4>
                      <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        ID: {item.id}
                      </span>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>File:</strong> {item.fileName || 'N/A'}</p>
                        <p><strong>Size:</strong> {item.fileSize ? (item.fileSize / 1024).toFixed(1) + ' KB' : 'N/A'}</p>
                        <p><strong>Type:</strong> {item.fileType || 'N/A'}</p>
                      </div>
                      <div>
                        <p><strong>Case:</strong> {item.caseName || 'N/A'} ({item.caseNumber || 'N/A'})</p>
                        <p><strong>Uploaded by:</strong> {item.uploaderName || 'N/A'}</p>
                        <p><strong>Uploaded:</strong> {item.uploadedAt ? new Date(item.uploadedAt).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div class="mt-3 p-2 bg-gray-50 rounded font-mono text-xs">
                      <strong>Hash:</strong> {item.hash}
                      <button 
                        on:click={() => copyToClipboard(item.hash)}
                        class="ml-2 text-blue-600 hover:text-blue-800"
                        title="Copy hash"
                      >
                        📋
                      </button>
                    </div>
                    
                    {#if item.description}
                      <p class="mt-2 text-sm text-gray-600">{item.description}</p>
                    {/if}
                    
                    <div class="mt-3 flex gap-2">
                      <button 
                        on:click={() => verifyIntegrity(item.id)}
                        disabled={loading}
                        class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Verify Integrity
                      </button>
                      
                      {#if item.fileUrl}
                        <a 
                          href={item.fileUrl}
                          target="_blank"
                          class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          View File
                        </a>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-700">
              <strong>⚠️ {searchResult.message}</strong>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <div class="bg-white rounded-lg shadow-md mt-6">
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4">About Hash Verification</h2>
      
      <div class="prose prose-sm max-w-none">
        <p>
          This tool allows you to search for evidence files by their SHA256 hash and verify file integrity.
        </p>
        
        <h3>How it works:</h3>
        <ul>
          <li><strong>File Upload:</strong> When evidence is uploaded, a SHA256 hash is automatically calculated and stored</li>
          <li><strong>Hash Search:</strong> Search for evidence using the exact 64-character SHA256 hash</li>
          <li><strong>Integrity Verification:</strong> Compare provided hashes with stored hashes to detect file tampering</li>
        </ul>
        
        <h3>Use cases:</h3>
        <ul>
          <li>Verify that an evidence file hasn't been modified</li>
          <li>Find evidence files by their cryptographic fingerprint</li>
          <li>Ensure chain of custody integrity</li>
          <li>Cross-reference files across different cases</li>
        </ul>
        
        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p class="text-sm text-blue-800">
            <strong>Security Note:</strong> SHA256 hashes provide cryptographic assurance that files have not been altered.
            Each file has a unique hash that changes if even a single byte is modified.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
