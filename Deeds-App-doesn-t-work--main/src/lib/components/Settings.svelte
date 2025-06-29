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
  
  function handleSave() {
    settings = { ...tempSettings };
    
    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Save to localStorage
    localStorage.setItem('ai-assistant-settings', JSON.stringify(settings));
    
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
  
  // Initialize temp settings when modal opens
  $: if (isOpen) {
    tempSettings = { ...settings };
  }
</script>

<!-- Settings Modal -->
{#if isOpen}
  <!-- Modal Overlay -->
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">⚙️ Settings</h2>
        <button class="modal-close" on:click={closeModal} aria-label="Close settings">
          ✕
        </button>
      </div>
      
      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Appearance Section -->
        <section class="settings-section">
          <h3 class="settings-section-title">🎨 Appearance</h3>
          
          <div class="form-group">
            <label class="form-label" for="theme-select">Theme</label>
            <select id="theme-select" class="form-control" bind:value={tempSettings.theme}>
              {#each themes as theme}
                <option value={theme.value}>{theme.label}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="font-family-select">Font Family</label>
            <select id="font-family-select" class="form-control" bind:value={tempSettings.fontFamily}>
              {#each fontFamilies as font}
                <option value={font.value}>{font.label}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="font-size-select">Font Size</label>
            <select id="font-size-select" class="form-control" bind:value={tempSettings.fontSize}>
              {#each fontSizes as size}
                <option value={size.value}>{size.label}</option>
              {/each}
            </select>
          </div>
        </section>
        
        <!-- Language & Voice Section -->
        <section class="settings-section">
          <h3 class="settings-section-title">🗣️ Language & Voice</h3>
          
          <div class="form-group">
            <label class="form-label" for="language-select">Interface Language</label>
            <select id="language-select" class="form-control" bind:value={tempSettings.language}>
              {#each languages as lang}
                <option value={lang.value}>{lang.label}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="voice-language-select">Voice Recognition Language</label>
            <select id="voice-language-select" class="form-control" bind:value={tempSettings.voiceLanguage}>
              {#each voiceLanguages as voiceLang}
                <option value={voiceLang.value}>{voiceLang.label}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="tts-engine-select">Text-to-Speech Engine</label>
            <select id="tts-engine-select" class="form-control" bind:value={tempSettings.ttsEngine}>
              {#each ttsEngines as engine}
                <option value={engine.value}>{engine.label}</option>
              {/each}
            </select>
            <div class="form-help">
              {#if tempSettings.ttsEngine === 'openTTS'}
                Requires OpenTTS service running on localhost:5002
              {:else if tempSettings.ttsEngine === 'coqui'}
                Requires Coqui TTS service
              {:else}
                Uses browser's built-in speech synthesis
              {/if}
            </div>
          </div>
        </section>
        
        <!-- AI Features Section -->
        <section class="settings-section">
          <h3 class="settings-section-title">🤖 AI Features</h3>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={tempSettings.enableSuggestions}
              />
              <span class="checkbox-text">Enable AI Suggestions</span>
            </label>
            <div class="form-help">
              Show \"Did you mean...\" suggestions based on your chat history
            </div>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={tempSettings.enableMasking}
              />
              <span class="checkbox-text">Enable PII Masking (Experimental)</span>
            </label>
            <div class="form-help">
              Automatically redact personally identifiable information (requires FastAPI service)
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="max-history">Max History Items</label>
            <input
              id="max-history"
              type="number"
              class="form-control"
              min="10"
              max="200"
              bind:value={tempSettings.maxHistoryItems}
            />
            <div class="form-help">
              Maximum number of chat sessions to keep in history
            </div>
          </div>
        </section>
        
        <!-- Privacy & Data Section -->
        <section class="settings-section">
          <h3 class="settings-section-title">🔒 Privacy & Data</h3>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={tempSettings.enableAutoSave}
              />
              <span class="checkbox-text">Auto-save Conversations</span>
            </label>
            <div class="form-help">
              Automatically save chat history to local storage
            </div>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={tempSettings.enableNotifications}
              />
              <span class="checkbox-text">Enable Notifications</span>
            </label>
            <div class="form-help">
              Show browser notifications for important events
            </div>
          </div>
          
          <div class="form-group">
            <div class="flex gap-sm">
              <button class="btn btn-outline btn-sm" on:click={exportSettings}>
                📤 Export Settings
              </button>
              <label class="btn btn-outline btn-sm" style="cursor: pointer;">
                📥 Import Settings
                <input
                  type="file"
                  accept=".json"
                  style="display: none;"
                  on:change={importSettings}
                />
              </label>
            </div>
          </div>
        </section>
        
        <!-- Advanced Section -->
        <section class="settings-section">
          <h3 class="settings-section-title">⚡ Advanced</h3>
          
          <div class="form-group">
            <button class="btn btn-outline btn-sm btn-warning" on:click={resetToDefaults}>
              🔄 Reset to Defaults
            </button>
            <div class="form-help">
              Reset all settings to their default values
            </div>
          </div>
          
          <div class="form-group">
            <div class="card card-compact bg-secondary">
              <h4 class="text-sm font-medium mb-xs">🛠️ Debug Information</h4>
              <div class="text-xs text-muted">
                <p>Theme: {tempSettings.theme}</p>
                <p>TTS Engine: {tempSettings.ttsEngine}</p>
                <p>Voice Support: {'webkitSpeechRecognition' in window ? '✅' : '❌'}</p>
                <p>Local Storage: {typeof Storage !== 'undefined' ? '✅' : '❌'}</p>
                <p>Browser: {navigator.userAgent.split(' ').pop()}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <!-- Modal Footer -->
      <div class="modal-footer">
        <button class="btn btn-ghost" on:click={handleCancel}>
          Cancel
        </button>
        <button class="btn btn-primary" on:click={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
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
    animation: fadeIn 0.2s ease-out;
  }
  
  .modal {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
    animation: slideIn 0.3s ease-out;
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg);
    border-bottom: var(--border-width) var(--border-style) var(--border-primary);
  }
  
  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
  
  .modal-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    font-size: 1.25rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .modal-close:hover {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }
  
  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
  }
  
  .modal-footer {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    padding: var(--space-lg);
    border-top: var(--border-width) var(--border-style) var(--border-primary);
  }
  
  .settings-section {
    margin-bottom: var(--space-xl);
  }
  
  .settings-section:last-child {
    margin-bottom: 0;
  }
  
  .settings-section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-sm);
    border-bottom: var(--border-width) var(--border-style) var(--border-primary);
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .checkbox-text {
    flex: 1;
  }
  
  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: var(--accent-primary);
  }
  
  .btn-warning {
    background: var(--accent-warning);
    color: var(--text-inverse);
  }
  
  .btn-warning:hover {
    background: #d97706;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .modal {
      width: 95%;
      max-height: 95vh;
    }
    
    .modal-header,
    .modal-content,
    .modal-footer {
      padding: var(--space-md);
    }
    
    .modal-footer {
      flex-direction: column;
    }
    
    .btn {
      width: 100%;
    }
  }
</style>
