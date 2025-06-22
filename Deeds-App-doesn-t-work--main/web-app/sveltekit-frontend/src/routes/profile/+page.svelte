<script lang="ts">
  import { page } from '$app/stores';
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let user = $page.data.user;
  let userStats = $page.data.userStats;
  let editing = false;
  let bio = user?.bio || '';
  let saveStatus = '';
  
  // System stats for the overview
  let systemStats = {
    totalCases: 3,
    totalEvidence: 0,
    modelsLoaded: 0,
    processingJobs: 4
  };

  onMount(async () => {
    // Load system stats
    try {
      const statsRes = await fetch('/api/system/stats');
      if (statsRes.ok) {
        systemStats = await statsRes.json();
      }
    } catch (error) {
      console.error('Failed to load system stats:', error);
      // Use default values if API fails
    }
  });

  async function saveProfile() {
    saveStatus = 'Saving...';
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio })
    });
    if (res.ok) {
      saveStatus = 'Saved!';
      editing = false;
      await invalidate('user'); // SSR reload user
    } else {
      saveStatus = 'Error saving profile';
    }
  }
</script>

<svelte:head>
  <title>User Profile</title>
</svelte:head>

<div class="container mt-5 max-w-xl mx-auto bg-base-100 rounded-lg shadow p-6">
  <div class="flex flex-col items-center gap-4">
    {#if user?.image}
      <img src={user.image} alt="Profile" class="rounded-full border-2 border-primary" style="width:96px;height:96px;object-fit:cover;" />
    {:else}
      <div class="rounded-full bg-primary text-white flex items-center justify-center" style="width:96px;height:96px;font-size:2.5rem;">
        {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : '?'}
      </div>
    {/if}
    <h2 class="text-2xl font-bold">{user?.name || 'No Name'}</h2>
    <p class="text-base-content/70">{user?.email}</p>
    <div class="divider"></div>
    <div class="w-full">
      <h3 class="font-semibold mb-2">Account Details</h3>
      <ul class="list-disc pl-6">
        <li><b>Username:</b> {user?.username || '-'}</li>
        <li><b>Role:</b> {user?.role || '-'}</li>
      </ul>
    </div>
    
    <!-- User Account Statistics -->
    <div class="divider"></div>
    <div class="w-full">
      <h3 class="font-semibold mb-4 text-xl">📊 System Overview & Account Statistics</h3>
      
      <!-- System Overview Stats -->
      <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
        <h4 class="font-semibold mb-3 text-lg text-blue-800">
          <i class="bi bi-graph-up me-2"></i>
          System Overview
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-white rounded-lg shadow-sm">
            <i class="bi bi-folder2 text-3xl text-primary mb-2"></i>
            <div class="text-2xl font-bold text-primary">{systemStats.totalCases}</div>
            <div class="text-sm text-gray-600">Total Cases</div>
          </div>
          <div class="text-center p-3 bg-white rounded-lg shadow-sm">
            <i class="bi bi-camera-video text-3xl text-success mb-2"></i>
            <div class="text-2xl font-bold text-success">{systemStats.totalEvidence}</div>
            <div class="text-sm text-gray-600">Evidence Files</div>
          </div>
          <div class="text-center p-3 bg-white rounded-lg shadow-sm">
            <i class="bi bi-cpu text-3xl text-warning mb-2"></i>
            <div class="text-2xl font-bold text-warning">{systemStats.modelsLoaded}</div>
            <div class="text-sm text-gray-600">AI Models Loaded</div>
          </div>
          <div class="text-center p-3 bg-white rounded-lg shadow-sm">
            <i class="bi bi-gear text-3xl text-info mb-2"></i>
            <div class="text-2xl font-bold text-info">{systemStats.processingJobs}</div>
            <div class="text-sm text-gray-600">Processing Jobs</div>
          </div>
        </div>
      </div>
      
      <!-- System Performance Metrics -->
      <div class="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold mb-3 text-lg text-blue-800">
          <i class="bi bi-speedometer2 me-2"></i>
          System Performance Overview
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {userStats.totalCases > 0 ? Math.round((userStats.closedCases / userStats.totalCases) * 100) : 0}%
            </div>
            <div class="text-sm text-blue-700">Case Resolution Rate</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{userStats.openCases}</div>
            <div class="text-sm text-green-700">Active Investigations</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{userStats.totalEvidence}</div>
            <div class="text-sm text-purple-700">Evidence Items</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">
              {userStats.totalCases > 0 ? Math.round(userStats.totalEvidence / userStats.totalCases * 10) / 10 : 0}
            </div>
            <div class="text-sm text-orange-700">Evidence per Case</div>
          </div>
        </div>
      </div>
      
      <!-- Case Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="stat bg-blue-50 rounded-lg p-4">
          <div class="stat-figure text-blue-500">
            <i class="bi bi-folder text-2xl"></i>
          </div>
          <div class="stat-title text-blue-700">Total Cases</div>
          <div class="stat-value text-blue-900">{userStats.totalCases}</div>
          <div class="stat-desc text-blue-600">Cases in system</div>
        </div>
        
        <div class="stat bg-green-50 rounded-lg p-4">
          <div class="stat-figure text-green-500">
            <i class="bi bi-folder-plus text-2xl"></i>
          </div>
          <div class="stat-title text-green-700">Open Cases</div>
          <div class="stat-value text-green-900">{userStats.openCases}</div>
          <div class="stat-desc text-green-600">Active investigations</div>
        </div>
        
        <div class="stat bg-gray-50 rounded-lg p-4">
          <div class="stat-figure text-gray-500">
            <i class="bi bi-folder-check text-2xl"></i>
          </div>
          <div class="stat-title text-gray-700">Closed Cases</div>
          <div class="stat-value text-gray-900">{userStats.closedCases}</div>
          <div class="stat-desc text-gray-600">Completed cases</div>
        </div>
      </div>
      
      <!-- Crime Classification Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="stat bg-red-50 rounded-lg p-4">
          <div class="stat-figure text-red-500">
            <i class="bi bi-exclamation-triangle text-2xl"></i>
          </div>
          <div class="stat-title text-red-700">Felony Cases</div>
          <div class="stat-value text-red-900">{userStats.felonyCases}</div>
          <div class="stat-desc text-red-600">Serious crimes</div>
        </div>
        
        <div class="stat bg-yellow-50 rounded-lg p-4">
          <div class="stat-figure text-yellow-500">
            <i class="bi bi-exclamation-circle text-2xl"></i>
          </div>
          <div class="stat-title text-yellow-700">Misdemeanor Cases</div>
          <div class="stat-value text-yellow-900">{userStats.misdemeanorCases}</div>
          <div class="stat-desc text-yellow-600">Minor crimes</div>
        </div>
        
        <div class="stat bg-orange-50 rounded-lg p-4">
          <div class="stat-figure text-orange-500">
            <i class="bi bi-clipboard text-2xl"></i>
          </div>
          <div class="stat-title text-orange-700">Citation Cases</div>
          <div class="stat-value text-orange-900">{userStats.citationCases}</div>
          <div class="stat-desc text-orange-600">Citations issued</div>
        </div>
      </div>
      
      <!-- Additional Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat bg-purple-50 rounded-lg p-4">
          <div class="stat-figure text-purple-500">
            <i class="bi bi-people text-2xl"></i>
          </div>
          <div class="stat-title text-purple-700">Total Criminals</div>
          <div class="stat-value text-purple-900">{userStats.totalCriminals}</div>
          <div class="stat-desc text-purple-600">In database</div>
        </div>
        
        <div class="stat bg-indigo-50 rounded-lg p-4">
          <div class="stat-figure text-indigo-500">
            <i class="bi bi-file-earmark text-2xl"></i>
          </div>
          <div class="stat-title text-indigo-700">Total Evidence</div>
          <div class="stat-value text-indigo-900">{userStats.totalEvidence}</div>
          <div class="stat-desc text-indigo-600">Items collected</div>
        </div>
        
        <div class="stat bg-teal-50 rounded-lg p-4">
          <div class="stat-figure text-teal-500">
            <i class="bi bi-shield-check text-2xl"></i>
          </div>
          <div class="stat-title text-teal-700">Total Crimes</div>
          <div class="stat-value text-teal-900">{userStats.totalCrimes}</div>
          <div class="stat-desc text-teal-600">All classifications</div>
        </div>
      </div>
      
      <!-- Performance Indicators -->
      <div class="mt-6 p-4 bg-base-200 rounded-lg">
        <h4 class="font-semibold mb-2 text-lg">⚖️ Performance Indicators & System Insights</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">Case Closure Rate:</span>
            <span class="text-sm">
              {userStats.totalCases > 0 ? Math.round((userStats.closedCases / userStats.totalCases) * 100) : 0}%
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">Active Caseload:</span>
            <span class="text-sm">{userStats.openCases} cases</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">Felony Case Ratio:</span>
            <span class="text-sm">
              {userStats.totalCrimes > 0 ? Math.round((userStats.felonyCases / userStats.totalCrimes) * 100) : 0}%
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">Evidence per Case:</span>
            <span class="text-sm">
              {userStats.totalCases > 0 ? Math.round(userStats.totalEvidence / userStats.totalCases * 10) / 10 : 0}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">Investigation Efficiency:</span>
            <span class="text-sm text-green-600">
              {userStats.openCases < 10 ? 'Optimal' : userStats.openCases < 20 ? 'Good' : 'High Load'}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">System Health:</span>
            <span class="text-sm text-blue-600">
              <i class="bi bi-check-circle me-1"></i>
              Operational
            </span>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions from System Overview -->
      <div class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h4 class="font-semibold mb-3 text-lg">
          <i class="bi bi-lightning me-2"></i>
          System Quick Actions
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/cases/new" class="btn btn-primary btn-sm">
            <i class="bi bi-plus-circle me-2"></i>
            Create New Case
          </a>
          <a href="/evidence" class="btn btn-success btn-sm">
            <i class="bi bi-camera-video me-2"></i>
            Manage Evidence
          </a>
          <a href="/ai/search" class="btn btn-info btn-sm">
            <i class="bi bi-robot me-2"></i>
            AI Legal Assistant
          </a>
          <a href="/upload" class="btn btn-warning btn-sm">
            <i class="bi bi-cloud-upload me-2"></i>
            Upload Evidence
          </a>
        </div>
      </div>
    </div>
    
    <div class="divider"></div>
    <div class="w-full">
      <h3 class="font-semibold mb-2">Profile Bio</h3>
      {#if editing}
        <textarea class="textarea textarea-bordered w-full" bind:value={bio} rows="4"></textarea>
        <div class="mt-2 flex gap-2">
          <button class="btn btn-primary btn-sm" on:click={saveProfile}>Save</button>
          <button class="btn btn-ghost btn-sm" on:click={() => { editing = false; bio = user?.bio || ''; }}>Cancel</button>
        </div>
        {#if saveStatus}
          <div class="mt-2 text-sm">{saveStatus}</div>
        {/if}
      {:else}
        {#if user?.bio}
          <div class="mb-2">{user.bio}</div>
        {:else}
          <div class="mb-2"><span class="text-base-content/50">No bio set.</span></div>
        {/if}
        <button class="btn btn-outline btn-sm" on:click={() => editing = true}>Edit Bio</button>
      {/if}
    </div>
  </div>
</div>

<style>
.container {
  min-height: 60vh;
}
</style>
