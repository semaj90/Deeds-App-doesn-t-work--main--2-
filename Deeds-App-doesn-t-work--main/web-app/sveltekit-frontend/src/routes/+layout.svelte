<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import 'bootstrap/dist/css/bootstrap.min.css';

  let aiSearchInput: string = '';
  let aiSearchVisible = false;

  onMount(async () => {
    if (browser) {
      // Import Bootstrap JS only in the browser
      const { default: bootstrap } = await import('bootstrap');
      
      // Initialize all Bootstrap components that require JS, like dropdowns
      const dropdownElementList = Array.from(document.querySelectorAll('[data-bs-toggle="dropdown"]'));
      dropdownElementList.forEach(dropdownToggleEl => {
        new bootstrap.Dropdown(dropdownToggleEl);
      });

      // Setup AI search functionality
      const aiSearchBtn = document.getElementById('aiSearchBtn');
      const aiSearchInputEl = document.getElementById('aiSearchInput') as HTMLInputElement;
      
      if (aiSearchBtn && aiSearchInputEl) {
        aiSearchBtn.addEventListener('click', () => handleAiSearch(aiSearchInputEl.value));
        aiSearchInputEl.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            handleAiSearch(aiSearchInputEl.value);
          }
        });

        // Add example prompts on focus
        aiSearchInputEl.addEventListener('focus', () => {
          aiSearchVisible = true;
        });
      }
    }
  });

  async function handleAiSearch(query: string) {
    if (!query.trim()) return;
    
    try {
      // Show loading state
      const btn = document.getElementById('aiSearchBtn');
      if (btn) {
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
      }

      // Call AI search API
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const result = await response.json();
      
      // Show result in modal or navigate to results page
      if (result.success) {
        // Navigate to AI search results page with the response
        window.location.href = `/ai/search?q=${encodeURIComponent(query)}&r=${encodeURIComponent(JSON.stringify(result.data))}`;
      } else {
        alert('AI search failed: ' + result.error);
      }
    } catch (error) {
      console.error('AI search error:', error);
      alert('AI search service unavailable');
    } finally {
      // Reset button
      const btn = document.getElementById('aiSearchBtn');
      if (btn) {
        btn.innerHTML = '<i class="bi bi-search"></i>';
      }
    }
  }

  $: user = $page.data.user || $page.data.session?.user;
  $: avatar = (user as any)?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || user?.email || 'U') + '&background=0D8ABC&color=fff';
</script>

<svelte:head>
  <title>Legal Intelligence CMS</title>
  <meta name="description" content="Multimodal Legal Scene Understanding with AI" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
</svelte:head>

<nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
  <div class="container-fluid">
    <a class="navbar-brand fw-bold" href="/">
      <i class="bi bi-shield-check me-2"></i>
      Legal Intelligence CMS
    </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link" href="/dashboard" class:active={$page.url.pathname === '/dashboard'}>
            <i class="bi bi-speedometer2 me-1"></i>Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/cases" class:active={$page.url.pathname.startsWith('/cases')}>
            <i class="bi bi-folder2-open me-1"></i>Cases
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/evidence" class:active={$page.url.pathname.startsWith('/evidence')}>
            <i class="bi bi-camera-video me-1"></i>Evidence
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/upload" class:active={$page.url.pathname === '/upload'}>
            <i class="bi bi-cloud-upload me-1"></i>Upload
          </a>        </li>      </ul>
      
      <ul class="navbar-nav">
        {#if user}
          <li class="nav-item dropdown d-flex align-items-center">
            <span class="me-2 text-light">Hello, {user.name || user.email}</span>            <button class="nav-link dropdown-toggle d-flex align-items-center btn btn-link border-0 p-0" data-bs-toggle="dropdown" aria-label="User menu">
              <img src={avatar} alt="User avatar" class="rounded-circle me-2" style="width:32px;height:32px;object-fit:cover;" />
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="/profile"><i class="bi bi-person me-2"></i>Profile & Stats</a></li>
              <li><a class="dropdown-item" href="/settings"><i class="bi bi-gear me-2"></i>Settings</a></li>
              <li><hr class="dropdown-divider" /></li>
              <li><a class="dropdown-item" href="/logout"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
            </ul>
          </li>
        {:else}
          <li class="nav-item me-2">
            <a class="btn btn-outline-light" href="/login">
              <i class="bi bi-box-arrow-in-right me-1"></i>Login
            </a>
          </li>
          <li class="nav-item">
            <a class="btn btn-light" href="/register">
              <i class="bi bi-person-plus me-1"></i>Register
            </a>
          </li>
        {/if}
      </ul>
    </div>
  </div>
</nav>

<main class="container-fluid py-4">
  <slot />
</main>

<footer class="bg-dark text-light py-4 mt-5">
  <div class="container">
    <div class="row">
      <div class="col-md-6">
        <h6>Legal Intelligence CMS</h6>
        <p class="text-muted small">Multimodal evidence analysis with AI-powered scene understanding</p>
      </div>
      <div class="col-md-6 text-md-end">
        <p class="text-muted small">
          Secure • Local Processing • User-Provided Models
        </p>
      </div>
    </div>
  </div>
</footer>

<style>
  :global(body) {
    background-color: #f8f9fa;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  :global(.navbar-brand) {
    font-size: 1.5rem;
  }
  
  :global(.nav-link.active) {
    font-weight: 600;
    background-color: rgba(255, 255, 255, 0.1) !important;
    border-radius: 0.375rem;
  }
  
  :global(main) {
    min-height: calc(100vh - 200px);
  }
  
  :global(.highlight-word) {
    background-color: rgba(255, 193, 7, 0.3);
    border-bottom: 2px solid #ffc107;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0 2px;
    border-radius: 2px;
  }
  
  :global(.highlight-word:hover) {
    background-color: rgba(255, 193, 7, 0.5);
    border-bottom-color: #ff8c00;
    transform: translateY(-1px);
  }
  :global(.typewriter) {
    border-right: 2px solid #007bff;
    animation: -global-blink 1s infinite;
  }
  
  @keyframes -global-blink {
    0%, 50% { border-color: #007bff; }
    51%, 100% { border-color: transparent; }
  }
  
  :global(.drop-zone) {
    border: 2px dashed #dee2e6;
    border-radius: 0.5rem;
    padding: 3rem;
    text-align: center;
    transition: all 0.3s ease;
    background-color: #f8f9fa;
  }
  
  :global(.drop-zone:hover),
  :global(.drop-zone.dragover) {
    border-color: #007bff;
    background-color: rgba(0, 123, 255, 0.05);
  }
  
  :global(.card) {
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    border: 1px solid rgba(0, 0, 0, 0.125);
  }
  
  :global(.card:hover) {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
    transition: all 0.3s ease;
  }
  
  :global(.fade-in) {    animation: -global-fadeIn 0.5s ease-in-out;
  }
  
  @keyframes -global-fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .navbar-brand {
    font-size: 1.3rem;
  }
  .dropdown-toggle::after {
    margin-left: 0.5em;
  }
</style>
