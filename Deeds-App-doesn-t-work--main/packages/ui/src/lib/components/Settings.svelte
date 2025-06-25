<!-- Enhanced Settings Component for both Web and Desktop (Tauri) -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  
  const dispatch = createEventDispatcher();
  
  export let isOpen = false;
  
  // Settings state
  let settings = {
    theme: 'light',
    notifications: true,
    autoSave: true,
    fontSize: 'medium',
    language: 'en',
    aiAssistant: true,
    cacheSize: '100MB',
    dataRetention: '1 year'
  };
  
  // Theme options
  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' }
  ];
  
  // Font size options
  const fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];
  
  // Language options
  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' }
  ];
  
  // Check if we're in Tauri environment
  let isTauri = false;
  if (browser) {
    isTauri = !!window.__TAURI__;
  }
  
  // Load settings from storage
  function loadSettings() {
    if (browser) {
      const stored = localStorage.getItem('app_settings');
      if (stored) {
        settings = { ...settings, ...JSON.parse(stored) };
      }
    }
  }
  
  // Save settings
  async function saveSettings() {
    if (browser) {
      localStorage.setItem('app_settings', JSON.stringify(settings));
    }
    
    // If in Tauri, also save to backend
    if (isTauri && window.__TAURI__) {
      try {
        await window.__TAURI__.tauri.invoke('save_settings', { settings });
      } catch (error) {
        console.error('Failed to save settings to Tauri:', error);
      }
    }
    
    dispatch('settingsChanged', settings);
  }
  
  // Handle setting changes
  function handleChange() {
    saveSettings();
  }
  
  // Clear cache (Tauri specific)
  async function clearCache() {
    if (isTauri && window.__TAURI__) {
      try {
        await window.__TAURI__.tauri.invoke('clear_cache');
        alert('Cache cleared successfully');
      } catch (error) {
        console.error('Failed to clear cache:', error);
        alert('Failed to clear cache');
      }
    }
  }
  
  // Export data
  async function exportData() {
    if (isTauri && window.__TAURI__) {
      try {
        await window.__TAURI__.tauri.invoke('export_data');
        alert('Data export started');
      } catch (error) {
        console.error('Failed to export data:', error);
        alert('Failed to export data');
      }
    }
  }
  
  // Reset settings
  function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      settings = {
        theme: 'light',
        notifications: true,
        autoSave: true,
        fontSize: 'medium',
        language: 'en',
        aiAssistant: true,
        cacheSize: '100MB',
        dataRetention: '1 year'
      };
      handleChange();
    }
  }
  
  // Load settings on mount
  loadSettings();
</script>

{#if isOpen}
<div class="settings-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
  <div class="settings-container">
    <div class="settings-header">
      <h2 id="settings-title">Settings</h2>
      <button 
        class="close-btn" 
        on:click={() => isOpen = false}
        aria-label="Close settings"
      >
        ×
      </button>
    </div>
    
    <div class="settings-content">
      <div class="settings-section">
        <h3>Appearance</h3>
        
        <div class="setting-item">
          <label for="theme-select">Theme:</label>
          <select 
            id="theme-select"
            bind:value={settings.theme} 
            on:change={handleChange}
          >
            {#each themes as theme}
              <option value={theme.value}>{theme.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="setting-item">
          <label for="font-size-select">Font Size:</label>
          <select 
            id="font-size-select"
            bind:value={settings.fontSize} 
            on:change={handleChange}
          >
            {#each fontSizes as fontSize}
              <option value={fontSize.value}>{fontSize.label}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>General</h3>
        
        <div class="setting-item">
          <label for="language-select">Language:</label>
          <select 
            id="language-select"
            bind:value={settings.language} 
            on:change={handleChange}
          >
            {#each languages as language}
              <option value={language.value}>{language.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              bind:checked={settings.notifications} 
              on:change={handleChange}
              role="checkbox"
              aria-describedby="notifications-desc"
            />
            <span id="notifications-desc">Enable notifications</span>
          </label>
        </div>
        
        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              bind:checked={settings.autoSave} 
              on:change={handleChange}
              role="checkbox"
              aria-describedby="autosave-desc"
            />
            <span id="autosave-desc">Auto-save documents</span>
          </label>
        </div>
        
        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              bind:checked={settings.aiAssistant} 
              on:change={handleChange}
              role="checkbox"
              aria-describedby="ai-desc"
            />
            <span id="ai-desc">Enable AI Assistant</span>
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>Data Management</h3>
        
        <div class="setting-item">
          <label for="cache-size">Cache Size: {settings.cacheSize}</label>
          <div class="button-group">
            {#if isTauri}
              <button on:click={clearCache} class="btn btn-secondary">
                Clear Cache
              </button>
            {/if}
          </div>
        </div>
        
        <div class="setting-item">
          <label for="data-retention">Data Retention: {settings.dataRetention}</label>
          {#if isTauri}
            <button on:click={exportData} class="btn btn-secondary">
              Export Data
            </button>
          {/if}
        </div>
      </div>
      
      <div class="settings-section">
        <h3>Actions</h3>
        <div class="button-group">
          <button on:click={resetSettings} class="btn btn-warning">
            Reset to Defaults
          </button>
          <button on:click={() => isOpen = false} class="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .settings-container {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .settings-header h2 {
    margin: 0;
    color: #333;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    color: #666;
  }
  
  .close-btn:hover {
    color: #333;
  }
  
  .settings-content {
    padding: 1rem;
  }
  
  .settings-section {
    margin-bottom: 2rem;
  }
  
  .settings-section h3 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
  
  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.5rem 0;
  }
  
  .setting-item label {
    font-weight: 500;
    color: #555;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  
  .checkbox-label input {
    margin-right: 0.5rem;
  }
  
  select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    min-width: 120px;
  }
  
  .button-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .btn-primary {
    background: #007bff;
    color: white;
  }
  
  .btn-primary:hover {
    background: #0056b3;
  }
  
  .btn-secondary {
    background: #6c757d;
    color: white;
  }
  
  .btn-secondary:hover {
    background: #545b62;
  }
  
  .btn-warning {
    background: #ffc107;
    color: #212529;
  }
  
  .btn-warning:hover {
    background: #e0a800;
  }
  
  /* Dark theme support */
  @media (prefers-color-scheme: dark) {
    .settings-container {
      background: #2a2a2a;
      color: #e0e0e0;
    }
    
    .settings-header {
      border-bottom-color: #444;
    }
    
    .settings-header h2 {
      color: #e0e0e0;
    }
    
    .settings-section h3 {
      color: #e0e0e0;
    }
    
    .setting-item label {
      color: #ccc;
    }
    
    select {
      background: #333;
      color: #e0e0e0;
      border-color: #555;
    }
  }
</style>
