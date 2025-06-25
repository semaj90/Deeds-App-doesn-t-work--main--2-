<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Settings from '$lib/components/Settings.svelte';
  import { onMount } from 'svelte';

  let user = $page.data?.user;
  let showSettings = false;

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

  onMount(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  });
</script>

<nav class="navbar bg-base-100 shadow mb-4">
  <div class="container mx-auto flex justify-between items-center py-2 px-4">
    <div class="flex items-center gap-4">
      <a href="/" class="font-bold text-lg">WardenNet</a>
      <a href="/cases">Cases</a>
      <a href="/evidence">Evidence</a>
      <a href="/law">Law</a>
      <a href="/ai">AI Prompt</a>
      <a href="/ai-assistant">AI Assistant</a>
    </div>
    <div class="flex items-center gap-2">
      <button 
        class="btn btn-ghost btn-sm" 
        on:click={() => showSettings = true}
        title="Settings"
      >
        ⚙️
      </button>
      {#if user}
        <a href="/profile">Profile</a>
        <a href="/logout">Logout</a>
      {:else}
        <a href="/login">Login</a>
        <a href="/register">Register</a>
      {/if}
    </div>
  </div>
</nav>
<main class="container mx-auto px-4">
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
