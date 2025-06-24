<script lang="ts">
  import { onMount } from 'svelte';
  import Typewriter from '$lib/components/Typewriter.svelte';
  import UploadArea from '$lib/components/UploadArea.svelte';
  import { browser } from '$app/environment';
  
  let recentCases: any[] = [];
  
  onMount(async () => {
    // Load recent cases
    try {
      const casesRes = await fetch('/api/cases/recent');
      
      if (casesRes.ok) {
        recentCases = await casesRes.json();
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }

    // Setup AI search functionality
    if (browser) {
      const aiSearchBtn = document.getElementById('aiSearchBtn');
      const aiSearchInputEl = document.getElementById('aiSearchInput') as HTMLInputElement;
      
      if (aiSearchBtn && aiSearchInputEl) {
        aiSearchBtn.addEventListener('click', () => handleAiSearch(aiSearchInputEl.value));
        aiSearchInputEl.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            handleAiSearch(aiSearchInputEl.value);
          }
        });
      }
    }
  });
  
  function handleQuickUpload(files: any) {
    // Handle quick upload from homepage
    if (files.length > 0) {
      window.location.href = `/upload?files=${files.length}`;
    }
  }

  async function handleAiSearch(query: string) {
    if (!query.trim()) return;
    
    try {
      // Navigate to AI search results page
      window.location.href = `/ai/search?q=${encodeURIComponent(query)}`;
    } catch (error) {
      console.error('AI search failed:', error);
    }
  }
</script>

<svelte:head>
  <title>Prosecutor Case Management System</title>
  <meta name="description" content="Advanced legal case management with AI-powered document analysis" />
</svelte:head>

<!-- Hero Section -->
<section class="hero-section min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
  <div class="container mx-auto px-6 text-center">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
        <Typewriter 
          text="Advanced Legal Case Management"
          speed={100}
          delay={500}
        />
      </h1>
      
      <p class="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
        Who, what, why, how - We help you find the answers.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
        <a href="/cases" class="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-lg font-semibold transition-colors duration-200 text-lg shadow-lg">
          View Cases
        </a>
        <a href="/upload" class="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold transition-colors duration-200 text-lg">
          Upload Evidence
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Quick Actions Section -->
<section class="py-16 bg-gray-50">
  <div class="container mx-auto px-6">
    <h2 class="text-4xl font-bold text-center mb-12 text-gray-800">Quick Actions</h2>
    
    <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <!-- AI Search -->
      <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-2xl font-semibold mb-4 text-gray-900">AI-Powered Search</h3>
        <p class="text-gray-600 mb-6">
          Instantly search through case files, evidence, and legal precedents with our intelligent AI.
        </p>
        <a href="/ai" class="text-blue-600 hover:text-blue-800 font-semibold">Learn More &rarr;</a>
      </div>
      
      <!-- Evidence Upload -->
      <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
        </div>
        <h3 class="text-2xl font-semibold mb-4 text-gray-900">Upload Evidence</h3>
        <p class="text-gray-600 mb-6">
          Securely upload and manage all your case evidence in one centralized location.
        </p>
        <a href="/evidence" class="text-green-600 hover:text-green-800 font-semibold">Upload Now &rarr;</a>
      </div>
      
      <!-- Case Management -->
      <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
        <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h3 class="text-2xl font-semibold mb-4 text-gray-900">Manage Cases</h3>
        <p class="text-gray-600 mb-6">
          Organize, track, and manage all your legal cases with our intuitive interface.
        </p>
        <a href="/cases" class="text-purple-600 hover:text-purple-800 font-semibold">View Cases &rarr;</a>
      </div>
    </div>
  </div>
</section>

<!-- Recent Cases Section -->
<section class="py-16 bg-white">
  <div class="container mx-auto px-6">
    <h2 class="text-4xl font-bold text-center mb-12 text-gray-800">Recent Cases</h2>
    
    {#if recentCases.length > 0}
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each recentCases as caseItem}
          <div class="bg-gray-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 class="text-xl font-bold mb-2 text-gray-900">{caseItem.title}</h3>
            <p class="text-gray-600 mb-4">{caseItem.description}</p>
            <a href="/cases/{caseItem.id}" class="text-blue-600 hover:text-blue-800 font-semibold">View Details &rarr;</a>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-center text-gray-500">No recent cases found.</p>
    {/if}
  </div>
</section>

<style>
  .search-container {
    position: relative;
  }
  
  .search-input {
    font-size: 1.1rem !important;
    padding: 1.2rem 1.5rem !important;
    border-radius: 12px 0 0 12px !important;
    border: 2px solid #e9ecef !important;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
    transition: all 0.3s ease !important;
  }
  
  .search-input:focus {
    border-color: #007bff !important;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
    background: #ffffff !important;
  }
  
  .search-btn {
    border-radius: 0 12px 12px 0 !important;
    font-size: 1.1rem !important;
    padding: 1.2rem 2rem !important;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
    border: 2px solid #007bff !important;
    transition: all 0.3s ease !important;
  }
  
  .search-btn:hover {
    background: linear-gradient(135deg, #0056b3 0%, #004085 100%) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3) !important;
  }
  
  .input-group-lg {
    border-radius: 12px !important;
  }
  
  .search-container .shadow-lg {
    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
  }
</style>