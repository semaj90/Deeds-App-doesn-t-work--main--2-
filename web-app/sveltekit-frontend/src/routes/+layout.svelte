<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Settings from '$lib/components/Settings.svelte';
  
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