<script lang="ts">
  import '$lib/styles/unified.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Settings from '$lib/components/Settings.svelte';
  import { onMount } from 'svelte';

  let user = $page.data?.user;
  let showSettings = false;
  let showMobileMenu = false;

  // Settings state
  let settings = {
    theme: 'light',
    language: 'en',
    ttsEngine: 'browser',
    voiceLanguage: 'en-US',
    enableSuggestions: true,
    enableMasking: false,
    enableAutoSave: true,
    maxHistoryItems: 50,
    enableNotifications: true,
    fontFamily: 'Inter',
    fontSize: 'medium'
  };

  function handleSettingsClose() {
    showSettings = false;
  }

  function handleSettingsSave(event: CustomEvent<any>) {
    settings = { ...event.detail };
    // Apply theme immediately
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
    showSettings = false;
  }

  function toggleMobileMenu() {
    showMobileMenu = !showMobileMenu;
  }

  function closeMobileMenu() {
    showMobileMenu = false;
  }

  onMount(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }

    // Update user from page data
    const unsubscribe = page.subscribe((pageData) => {
      user = pageData.data?.user;
    });

    return unsubscribe;
  });
</script>

<nav class="main-navbar">
  <div class="navbar-container">
    <!-- Logo and Brand -->
    <div class="navbar-brand">
      <a href="/" class="brand-link">
        <div class="brand-icon">⚖️</div>
        <span class="brand-text">WardenNet</span>
      </a>
    </div>

    <!-- Mobile Menu Button -->
    <button 
      class="mobile-menu-button"
      on:click={toggleMobileMenu}
      aria-label="Toggle menu"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>

    <!-- Navigation Links -->
    <div class="navbar-links {showMobileMenu ? 'mobile-open' : ''}">
      <div class="nav-section">
        <a href="/cases" class="nav-link" on:click={closeMobileMenu}>Cases</a>
        <a href="/evidence" class="nav-link" on:click={closeMobileMenu}>Evidence</a>
        <a href="/ai" class="nav-link" on:click={closeMobileMenu}>AI Assistant</a>
      </div>

      <div class="nav-section user-section">
        <button 
          class="settings-button" 
          on:click={() => showSettings = true}
          title="Settings"
        >
          ⚙️
        </button>
        
        {#if user}
          <div class="user-menu">
            <span class="user-name">Welcome, {user.firstName || user.email}</span>
            <a href="/profile" class="nav-link" on:click={closeMobileMenu}>Profile</a>
            <a href="/logout" class="nav-link logout-link" on:click={closeMobileMenu}>Logout</a>
          </div>
        {:else}
          <div class="auth-links">
            <a href="/login" class="nav-link login-link" on:click={closeMobileMenu}>Login</a>
            <a href="/register" class="nav-link register-link" on:click={closeMobileMenu}>Register</a>
          </div>
        {/if}
      </div>
    </div>
  </div>
</nav>

<main class="main-content">
  <slot />
</main>

<!-- Settings Modal -->
<Settings 
  bind:isOpen={showSettings}
  bind:settings={settings}
  on:close={handleSettingsClose}
  on:save={handleSettingsSave}
/>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #f8fafc;
    font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
  }
  
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  .main-navbar {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .navbar-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
  }

  .brand-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: #1e293b;
    font-weight: 700;
    font-size: 1.25rem;
    transition: color 0.2s;
  }

  .brand-link:hover {
    color: #3b82f6;
  }

  .brand-icon {
    font-size: 1.5rem;
  }

  .brand-text {
    font-size: 1.5rem;
  }

  .mobile-menu-button {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
  }

  .hamburger-line {
    width: 24px;
    height: 3px;
    background: #374151;
    border-radius: 2px;
    transition: all 0.3s;
  }

  .navbar-links {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .nav-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .nav-link {
    text-decoration: none;
    color: #64748b;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    transition: all 0.2s;
    position: relative;
  }

  .nav-link:hover {
    color: #3b82f6;
    background: #f1f5f9;
  }

  .nav-link:global(.active) {
    color: #3b82f6;
    background: #eff6ff;
    font-weight: 600;
  }

  .settings-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 1.25rem;
    transition: background-color 0.2s;
  }

  .settings-button:hover {
    background: #f1f5f9;
  }

  .user-section {
    border-left: 1px solid #e2e8f0;
    padding-left: 1.5rem;
    margin-left: 1rem;
  }

  .user-menu {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-name {
    color: #374151;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .auth-links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .login-link {
    color: #64748b;
  }

  .register-link {
    background: #3b82f6;
    color: white;
  }

  .register-link:hover {
    background: #2563eb;
    color: white;
  }

  .logout-link {
    color: #ef4444;
  }

  .logout-link:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  .main-content {
    min-height: calc(100vh - 80px);
    padding: 2rem 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .mobile-menu-button {
      display: flex;
    }

    .navbar-links {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      flex-direction: column;
      align-items: stretch;
      gap: 0;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s;
    }

    .navbar-links.mobile-open {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .nav-section {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
      width: 100%;
    }

    .user-section {
      border-left: none;
      border-top: 1px solid #e2e8f0;
      padding-left: 0;
      padding-top: 1rem;
      margin-left: 0;
      margin-top: 1rem;
    }

    .user-menu {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .user-name {
      padding: 0.5rem 1rem;
      background: #f8fafc;
      border-radius: 6px;
      text-align: center;
    }

    .auth-links {
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-link {
      padding: 0.75rem 1rem;
      text-align: center;
    }

    .main-content {
      padding: 1rem;
    }
  }

  /* Small Mobile */
  @media (max-width: 480px) {
    .navbar-container {
      padding: 0.75rem 1rem;
    }

    .brand-text {
      font-size: 1.25rem;
    }

    .main-content {
      padding: 0.5rem;
    }
  }
</style>