<!-- Copilot Instructions:
- This is a shared Settings modal component for both web and desktop apps
- Should include theme switching, language options, TTS settings, and user preferences  
- Works with both browser localStorage and Tauri preferences storage
- Provides consistent UI across web and desktop platforms
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Settings state
  export let isOpen = false;
  export let settings = {
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
  
  let tempSettings = { ...settings };
  
  // Available options
  const themes = [
    { value: 'light', label: '☀️ Light' },
    { value: 'dark', label: '🌙 Dark' },
    { value: 'normal', label: '⚖️ Normal' }
  ];
  
  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' }
  ];
  
  const ttsEngines = [
    { value: 'browser', label: 'Browser TTS' },
    { value: 'openTTS', label: 'OpenTTS (Local)' },
    { value: 'coqui', label: 'Coqui TTS' }
  ];
  
  const voiceLanguages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' }
  ];
  
  const fontFamilies = [
    { value: 'Inter', label: 'Inter' },
    { value: 'system', label: 'System Default' },
    { value: 'serif', label: 'Serif' },
    { value: 'mono', label: 'Monospace' }
  ];
  
  const fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];
  
  // TODO: Detect if running in Tauri and use appropriate storage
  async function saveSettings() {
    settings = { ...tempSettings };
    
    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    try {
      // Try Tauri storage first if available
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        try {
          const { Store } = await import('@tauri-apps/plugin-store');
          const store = new Store('.settings.dat');
          await store.set('ai-assistant-settings', settings);
          await store.save();
        } catch (importError) {
          // Fallback to localStorage if Tauri store not available
          localStorage.setItem('ai-assistant-settings', JSON.stringify(settings));
        }
      } else {
        // Fallback to localStorage for web app
        localStorage.setItem('ai-assistant-settings', JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Fallback to localStorage
      localStorage.setItem('ai-assistant-settings', JSON.stringify(settings));
    }
    
    // Dispatch settings change event
    dispatch('settingsChanged', settings);
    
    closeModal();
  }
  
  function handleCancel() {
    tempSettings = { ...settings };
    closeModal();
  }
  
  function closeModal() {
    isOpen = false;
  }
  
  function resetToDefaults() {
    tempSettings = {
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
  }
  
  function exportSettings() {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'ai-assistant-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
  
  function importSettings(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        tempSettings = { ...settings, ...importedSettings };
      } catch (error) {
        alert('Invalid settings file');
      }
    };
    reader.readAsText(file);
  }
  
  // Handle keyboard events for accessibility
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
  
  // Initialize temp settings when modal opens
  $: if (isOpen) {
    tempSettings = { ...settings };
  }
</script>

<!-- Settings Modal -->
{#if isOpen}
  <!-- Modal Overlay -->
  <div 
    class="modal-overlay" 
    on:click={closeModal} 
    on:keydown={handleKeyDown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-title"
  >
    <div 
      class="modal-content" 
      on:click|stopPropagation
      on:keydown={handleKeyDown}
      role="document"
    >
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 id="settings-title" class="modal-title">
          <i class="bi bi-gear me-2"></i>
          Settings
        </h2>
        <button 
          class="btn btn-outline-secondary btn-sm" 
          on:click={closeModal} 
          aria-label="Close settings"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      
      <!-- Modal Body -->
      <div class="modal-body">
        <div class="row">
          <!-- Appearance Settings -->
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">
                  <i class="bi bi-palette me-2"></i>
                  Appearance
                </h5>
                
                <!-- Theme -->
                <div class="mb-3">
                  <label for="theme-select" class="form-label">Theme</label>
                  <select id="theme-select" bind:value={tempSettings.theme} class="form-select">
                    {#each themes as theme}
                      <option value={theme.value}>{theme.label}</option>
                    {/each}
                  </select>
                </div>
                
                <!-- Font Family -->
                <div class="mb-3">
                  <label for="font-family-select" class="form-label">Font Family</label>
                  <select id="font-family-select" bind:value={tempSettings.fontFamily} class="form-select">
                    {#each fontFamilies as font}
                      <option value={font.value}>{font.label}</option>
                    {/each}
                  </select>
                </div>
                
                <!-- Font Size -->
                <div class="mb-3">
                  <label for="font-size-select" class="form-label">Font Size</label>
                  <select id="font-size-select" bind:value={tempSettings.fontSize} class="form-select">
                    {#each fontSizes as size}
                      <option value={size.value}>{size.label}</option>
                    {/each}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Language & TTS Settings -->
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">
                  <i class="bi bi-globe me-2"></i>
                  Language & TTS
                </h5>
                
                <!-- Language -->
                <div class="mb-3">
                  <label for="language-select" class="form-label">Language</label>
                  <select id="language-select" bind:value={tempSettings.language} class="form-select">
                    {#each languages as lang}
                      <option value={lang.value}>{lang.label}</option>
                    {/each}
                  </select>
                </div>
                
                <!-- TTS Engine -->
                <div class="mb-3">
                  <label for="tts-engine-select" class="form-label">Text-to-Speech Engine</label>
                  <select id="tts-engine-select" bind:value={tempSettings.ttsEngine} class="form-select">
                    {#each ttsEngines as engine}
                      <option value={engine.value}>{engine.label}</option>
                    {/each}
                  </select>
                </div>
                
                <!-- Voice Language -->
                <div class="mb-3">
                  <label for="voice-language-select" class="form-label">Voice Language</label>
                  <select id="voice-language-select" bind:value={tempSettings.voiceLanguage} class="form-select">
                    {#each voiceLanguages as voice}
                      <option value={voice.value}>{voice.label}</option>
                    {/each}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Features Settings -->
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">
                  <i class="bi bi-toggles me-2"></i>
                  Features
                </h5>
                
                <!-- Enable Suggestions -->
                <div class="form-check mb-3">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="enableSuggestions"
                    bind:checked={tempSettings.enableSuggestions}
                  />
                  <label class="form-check-label" for="enableSuggestions">
                    Enable AI Suggestions
                  </label>
                </div>
                
                <!-- Enable Masking -->
                <div class="form-check mb-3">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="enableMasking"
                    bind:checked={tempSettings.enableMasking}
                  />
                  <label class="form-check-label" for="enableMasking">
                    Enable Data Masking
                  </label>
                </div>
                
                <!-- Enable Auto Save -->
                <div class="form-check mb-3">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="enableAutoSave"
                    bind:checked={tempSettings.enableAutoSave}
                  />
                  <label class="form-check-label" for="enableAutoSave">
                    Enable Auto Save
                  </label>
                </div>
                
                <!-- Enable Notifications -->
                <div class="form-check mb-3">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="enableNotifications"
                    bind:checked={tempSettings.enableNotifications}
                  />
                  <label class="form-check-label" for="enableNotifications">
                    Enable Notifications
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Advanced Settings -->
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">
                  <i class="bi bi-sliders me-2"></i>
                  Advanced
                </h5>
                
                <!-- Max History Items -->
                <div class="mb-3">
                  <label for="max-history-input" class="form-label">Max History Items</label>
                  <input 
                    id="max-history-input"
                    type="number" 
                    class="form-control" 
                    min="10" 
                    max="1000"
                    bind:value={tempSettings.maxHistoryItems}
                  />
                </div>
                
                <!-- Import/Export -->
                <div class="mb-3">
                  <div class="form-label">Backup Settings</div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-outline-secondary btn-sm" on:click={exportSettings}>
                      <i class="bi bi-download me-1"></i>
                      Export
                    </button>
                    <label class="btn btn-outline-secondary btn-sm">
                      <i class="bi bi-upload me-1"></i>
                      Import
                      <input 
                        type="file" 
                        accept=".json" 
                        on:change={importSettings}
                        style="display: none;"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal Footer -->
      <div class="modal-footer">
        <button class="btn btn-outline-secondary" on:click={resetToDefaults}>
          <i class="bi bi-arrow-clockwise me-1"></i>
          Reset to Defaults
        </button>
        <div class="ms-auto d-flex gap-2">
          <button class="btn btn-outline-secondary" on:click={handleCancel}>
            Cancel
          </button>
          <button class="btn btn-primary" on:click={saveSettings}>
            <i class="bi bi-check-lg me-1"></i>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    padding: 1rem;
  }
  
  .modal-content {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    align-items: center;
    justify-content: between;
  }
  
  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    flex: 1;
  }
  
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }
  
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  /* Dark theme support */
  :global([data-theme="dark"]) .modal-content {
    background: #1a1a1a;
    color: #ffffff;
  }
  
  :global([data-theme="dark"]) .modal-header,
  :global([data-theme="dark"]) .modal-footer {
    border-color: #333;
  }
  
  :global([data-theme="dark"]) .form-control,
  :global([data-theme="dark"]) .form-select {
    background-color: #2d2d2d;
    border-color: #444;
    color: #ffffff;
  }
  
  :global([data-theme="dark"]) .form-control:focus,
  :global([data-theme="dark"]) .form-select:focus {
    background-color: #2d2d2d;
    border-color: #0d6efd;
    color: #ffffff;
  }
</style>
