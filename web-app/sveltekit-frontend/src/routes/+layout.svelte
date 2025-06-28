<script lang="ts">
  import '$lib/styles/unified.css';
  import 'uno.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Settings from '$lib/components/Settings.svelte';
  import UserDropdown from '$lib/components/UserDropdown.svelte';
  import { initializeTauri } from '$lib/tauri';
  
  let user = $page.data?.user;
  let showSettings = false;
  
  // Settings state
  let settings: {
    theme: string;
    language: string;
    ttsEngine: string;
    voiceLanguage: string;
    enableSuggestions: boolean;
    enableMasking: boolean;
    enableAutoSave: boolean;
    maxHistoryItems: number;
    enableNotifications: boolean;
    fontFamily: string;
    fontSize: string;
  } = {
    theme: 'light',
    language: 'en',
    ttsEngine: '',
    voiceLanguage: '',
    enableSuggestions: true,
    enableMasking: false,
    enableAutoSave: true,
    maxHistoryItems: 50,
    enableNotifications: true,
    fontFamily: 'Inter',
    fontSize: '16px',
  };
  
  function handleSettingsClose() {
    showSettings = false;
  }
  
  function handleSettingsSave(event: CustomEvent<any>) {
    settings = { ...event.detail };
    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', settings.theme);
    showSettings = false;
  }

  // Initialize Tauri when component mounts
  onMount(() => {
    initializeTauri();
  });
</script>

<nav class="main-nav">
  <div class="container">
    <div class="nav-content">
      <div class="nav-brand">
        <a href="/" class="brand-link">⚖️ Legal Case Management</a>
      </div>
      <div class="nav-links">
        <a href="/dashboard">Dashboard</a>
        <a href="/cases">Cases</a>
        <a href="/reports">Reports</a>
        <a href="/evidence">Evidence</a>
        <a href="/law">Law</a>
        <a href="/ai">AI Prompt</a>
        <a href="/ai-assistant">AI Assistant</a>
        <a href="/ui-demo" class="highlight">🎨 UI Demo</a>
        <a href="/original-home">Original Home</a>
      </div>
      <div class="nav-actions">
        <button 
          type="button"
          class="secondary outline"
          on:click={() => showSettings = true}
          title="Settings"
        >
          ⚙️
        </button>
        {#if user}
          <UserDropdown {user} />
        {:else}
          <a href="/login" role="button" class="contrast">Login</a>
          <a href="/register" role="button" class="outline">Register</a>
        {/if}
      </div>
    </div>
  </div>
</nav>

<main class="container">
  <slot />
</main>

<!-- Settings Modal -->
<Settings 
  bind:isOpen={showSettings}
  bind:settings={settings}
  on:close={handleSettingsClose}
  on:save={handleSettingsSave}
/>