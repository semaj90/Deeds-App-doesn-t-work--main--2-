<!-- Enhanced Legal Document AI Assistant with Bits UI + Melt UI + UnoCSS -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import DialogRoot from 'bits-ui/dialog-root.svelte';
  import DialogTrigger from 'bits-ui/dialog-trigger.svelte';
  import DialogContent from 'bits-ui/dialog-content.svelte';
  import DialogHeader from 'bits-ui/dialog-header.svelte';
  import DialogTitle from 'bits-ui/dialog-title.svelte';
  import DialogDescription from 'bits-ui/dialog-description.svelte';
  import DialogClose from 'bits-ui/dialog-close.svelte';
  import Popover from 'bits-ui/popover.svelte';
  import DropdownMenu from 'bits-ui/dropdown-menu.svelte';
  import Button from 'bits-ui/button.svelte';
  import Input from 'bits-ui/input.svelte';
  import Label from 'bits-ui/label.svelte';
  import { Search, MessageCircle, Loader2, Brain, AlertCircle, CheckCircle, Settings, FileText, Quote, Scale } from 'lucide-svelte';
  
  export let caseId: string | undefined = undefined;
  export let evidenceIds: string[] = [];
  export let placeholder = "Ask AI about this case...";
  export let maxHeight = "400px";
  export let showReferences = true;
  export let enableVoiceInput = false;
  export let variant: 'web' | 'desktop' = 'web';

  interface AIResponse {
    answer: string;
    references: Array<{
      id: string;
      type: string;
      title: string;
      relevanceScore: number;
      citation: string;
    }>;
    confidence: number;
    searchResults: number;
    model: string;
    processingTime: number;
  }

  interface ConversationMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: number;
    references?: AIResponse['references'];
    confidence?: number;
    metadata?: Record<string, any>;
  }

  // Component state
  let query = '';
  let isLoading = false;
  let error = '';
  let conversation: ConversationMessage[] = [];
  let messagesContainer: HTMLDivElement;

  // Advanced options state
  let showAdvancedOptions = false;
  let selectedModel: 'openai' | 'ollama' | 'local' = 'openai';
  let searchThreshold = 0.7;
  let maxResults = 10;
  let temperature = 0.7;
  let enableLocalLLM = true;

  // Dialog states
  let showSettingsDialog = false;
  let showCitationDialog = false;
  let selectedCitation = '';

  // Voice input state
  let isListening = false;
  let recognition: SpeechRecognition | null = null;

  const dispatch = createEventDispatcher<{
    response: AIResponse;
    error: string;
    referenceClicked: { id: string; type: string };
  }>();

  // Reactive styles based on variant
  $: containerClasses = variant === 'desktop' 
    ? 'desktop-panel max-h-full' 
    : 'legal-card';

  $: headerClasses = variant === 'desktop'
    ? 'desktop-toolbar border-b border-desktop-border'
    : 'content-header';

  onMount(() => {
    // Initialize speech recognition if supported and enabled
    if (enableVoiceInput && 'webkitSpeechRecognition' in window) {
      recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        query = transcript;
      };
      
      recognition.onerror = () => {
        isListening = false;
      };
      
      recognition.onend = () => {
        isListening = false;
      };
    }

    // Load conversation history
    loadConversationHistory();
  });

  async function loadConversationHistory() {
    // Implementation for loading conversation from IndexedDB/localStorage
    const contextKey = caseId ? `case_${caseId}` : 'general';
    const stored = localStorage.getItem(`ai_conversation_${contextKey}`);
    
    if (stored) {
      try {
        conversation = JSON.parse(stored).slice(-10); // Load last 10 messages
      } catch (e) {
        console.error('Failed to load conversation history:', e);
      }
    }
  }

  async function saveConversationHistory() {
    const contextKey = caseId ? `case_${caseId}` : 'general';
    localStorage.setItem(`ai_conversation_${contextKey}`, JSON.stringify(conversation));
  }

  async function askAI() {
    if (!query.trim() || isLoading) return;

    const userMessage: ConversationMessage = {
      id: generateId(),
      type: 'user',
      content: query.trim(),
      timestamp: Date.now()
    };

    conversation = [...conversation, userMessage];
    
    const currentQuery = query;
    query = '';
    isLoading = true;
    error = '';

    try {
      // Prepare request with advanced options
      const requestBody = {
        question: currentQuery,
        context: {
          caseId,
          evidenceIds,
          maxResults,
          searchThreshold
        },
        options: {
          model: selectedModel,
          temperature,
          maxTokens: 1000,
          includeReferences: showReferences,
          useLocalLLM: enableLocalLLM && selectedModel === 'local'
        }
      };

      // Call AI endpoint
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const aiResponse: AIResponse = await response.json();

      // Add AI message to conversation
      const aiMessage: ConversationMessage = {
        id: generateId(),
        type: 'ai',
        content: aiResponse.answer,
        timestamp: Date.now(),
        references: aiResponse.references,
        confidence: aiResponse.confidence,
        metadata: {
          model: aiResponse.model,
          processingTime: aiResponse.processingTime,
          searchResults: aiResponse.searchResults
        }
      };

      conversation = [...conversation, aiMessage];
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);

      // Save conversation
      await saveConversationHistory();

      // Dispatch events
      dispatch('response', aiResponse);

    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
      console.error('AI request failed:', err);
      dispatch('error', error);
    } finally {
      isLoading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      askAI();
    }
  }

  function startVoiceInput() {
    if (recognition && !isListening) {
      isListening = true;
      recognition.start();
    }
  }

  function stopVoiceInput() {
    if (recognition && isListening) {
      recognition.stop();
      isListening = false;
    }
  }

  function handleReferenceClick(reference: NonNullable<ConversationMessage['references']>[0]) {
    selectedCitation = `${reference.title} - ${reference.citation}`;
    showCitationDialog = true;
    dispatch('referenceClicked', {
      id: reference.id,
      type: reference.type
    });
  }

  function clearConversation() {
    conversation = [];
    saveConversationHistory();
  }

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getConfidenceIcon(confidence: number) {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return AlertCircle;
    return AlertCircle;
  }

  function insertCitation() {
    // Dispatch event to parent component to insert citation
    dispatch('referenceClicked', { id: 'insert', type: 'citation' });
    showCitationDialog = false;
  }
</script>

<div class="{containerClasses} ai-legal-assistant">
  <!-- Header with Enhanced Controls -->
  <div class="{headerClasses}">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="flex items-center space-x-2">
          <Brain class="w-5 h-5 text-primary-600" />
          <h3 class="legal-heading text-lg">Legal AI Assistant</h3>
        </div>
        
        {#if caseId}
          <div class="flex items-center space-x-1 text-sm text-legal-neutral">
            <FileText class="w-4 h-4" />
            <span>Case Context</span>
          </div>
        {/if}
        
        {#if selectedModel === 'local' || selectedModel === 'ollama'}
          <div class="flex items-center space-x-1 text-sm text-green-600">
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Local LLM</span>
          </div>
        {/if}
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- Settings Dialog Trigger -->
        <DialogRoot bind:open={showSettingsDialog}>
          <DialogTrigger asChild let:builder>
            <Button.Root builders={[builder]} variant="ghost" size="sm" class="p-2">
              <Settings class="w-4 h-4" />
            </Button.Root>
          </DialogTrigger>
          <DialogContent class="legal-card max-w-md">
            <DialogHeader>
              <DialogTitle class="legal-heading">AI Assistant Settings</DialogTitle>
              <DialogDescription class="text-legal-neutral text-sm">
                Configure your AI assistant preferences
              </DialogDescription>
            </DialogHeader>
            
            <div class="space-y-4 py-4">
              <div class="space-y-2">
                <Label.Root class="text-sm font-medium text-legal-neutral">Model</Label.Root>
                <select
                  bind:value={selectedModel}
                  class="legal-input text-sm"
                >
                  <option value="openai">OpenAI GPT-3.5</option>
                  <option value="ollama">Ollama (Local)</option>
                  <option value="local">Legal-BERT (Local)</option>
                </select>
              </div>
              
              <div class="space-y-2">
                <Label.Root class="text-sm font-medium text-legal-neutral">Search Threshold: {searchThreshold}</Label.Root>
                <input
                  type="range"
                  min="0.5"
                  max="0.9"
                  step="0.1"
                  bind:value={searchThreshold}
                  class="w-full accent-primary-600"
                />
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label.Root class="text-sm font-medium text-legal-neutral">Max Results</Label.Root>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    bind:value={maxResults}
                    class="legal-input text-sm"
                  />
                </div>
                
                <div class="space-y-2">
                  <Label.Root class="text-sm font-medium text-legal-neutral">Temperature: {temperature}</Label.Root>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    bind:value={temperature}
                    class="w-full accent-primary-600"
                  />
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableLocal"
                  bind:checked={enableLocalLLM}
                  class="accent-primary-600"
                />
                <Label.Root for="enableLocal" class="text-sm text-legal-neutral">Enable Local LLM Processing</Label.Root>
              </div>
            </div>
            
            <Dialog.Footer>
              <DialogClose asChild let:builder>
                <Button.Root builders={[builder]} class="legal-button-primary">
                  Save Settings
                </Button.Root>
              </DialogClose>
            </Dialog.Footer>
          </DialogContent>
        </DialogRoot>
        
        {#if conversation.length > 0}
          <Button.Root variant="ghost" size="sm" class="text-red-500 hover:text-red-700" on:click={clearConversation}>
            Clear
          </Button.Root>
        {/if}
      </div>
    </div>
  </div>

  <!-- Conversation Area -->
  <div 
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-64"
    style="max-height: {maxHeight};"
  >
    {#if conversation.length === 0}
      <div class="text-center text-legal-neutral py-8">
        <div class="flex justify-center space-x-4 mb-4">
          <Scale class="w-8 h-8 text-gray-300" />
          <MessageCircle class="w-8 h-8 text-gray-300" />
          <Brain class="w-8 h-8 text-gray-300" />
        </div>
        <p class="legal-body text-lg mb-2">Legal AI Assistant Ready</p>
        <p class="text-sm text-gray-500">Ask questions about cases, evidence, legal precedents, or get help with document analysis</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 max-w-md mx-auto">
          <button
            class="legal-button-secondary text-xs p-2"
            on:click={() => query = "Summarize the key evidence in this case"}
          >
            Summarize Evidence
          </button>
          <button
            class="legal-button-secondary text-xs p-2"
            on:click={() => query = "Find relevant legal precedents"}
          >
            Find Precedents
          </button>
          <button
            class="legal-button-secondary text-xs p-2"
            on:click={() => query = "Analyze contract clauses"}
          >
            Analyze Contracts
          </button>
          <button
            class="legal-button-secondary text-xs p-2"
            on:click={() => query = "Draft legal arguments"}
          >
            Draft Arguments
          </button>
        </div>
      </div>
    {:else}
      {#each conversation as message (message.id)}
        <div class="message transition-all duration-300 ease-in-out">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              {#if message.type === 'user'}
                <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-primary-600 text-sm font-medium">U</span>
                </div>
              {:else}
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Brain class="w-4 h-4 text-purple-600" />
                </div>
              {/if}
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-1">
                <span class="text-sm font-medium text-legal-navy">
                  {message.type === 'user' ? 'You' : 'Legal AI'}
                </span>
                <span class="text-xs text-legal-neutral">
                  {formatTimestamp(message.timestamp)}
                </span>
                
                {#if message.type === 'ai' && message.confidence !== undefined}
                  <div class="flex items-center space-x-1">
                    <svelte:component 
                      this={getConfidenceIcon(message.confidence)} 
                      class="w-3 h-3 {getConfidenceColor(message.confidence)}" 
                    />
                    <span class="text-xs {getConfidenceColor(message.confidence)}">
                      {Math.round(message.confidence * 100)}%
                    </span>
                  </div>
                {/if}
              </div>
              
              <div class="prose prose-sm max-w-none">
                <p class="legal-body whitespace-pre-wrap">{message.content}</p>
              </div>
              
              <!-- Enhanced References with Citation Tools -->
              {#if message.references && message.references.length > 0 && showReferences}
                <div class="mt-3 border-t border-gray-100 pt-3">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-xs font-medium text-legal-neutral flex items-center">
                      <Quote class="w-3 h-3 mr-1" />
                      Legal References:
                    </h4>
                    <span class="text-xs text-gray-400">{message.references.length} found</span>
                  </div>
                  <div class="space-y-1">
                    {#each message.references as reference}
                      <div class="search-result flex items-center justify-between border border-primary-100 rounded p-2">
                        <button
                          type="button"
                          class="flex-1 text-left"
                          on:click={() => handleReferenceClick(reference)}
                        >
                          <div class="flex items-center space-x-2">
                            <span class="statute-reference text-xs">{reference.type.toUpperCase()}</span>
                            <span class="text-xs text-legal-neutral truncate">{reference.title}</span>
                            <span class="text-xs text-gray-400">({Math.round(reference.relevanceScore * 100)}%)</span>
                          </div>
                        </button>
                        
                        <DropdownMenu>
                          <DropdownMenu.Trigger asChild let:builder>
                            <Button.Root builders={[builder]} variant="ghost" size="sm" class="p-1 h-6">
                              <span class="text-xs">⋯</span>
                            </Button.Root>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content class="context-menu">
                            <DropdownMenu.Item class="menu-item" on:click={() => handleReferenceClick(reference)}>
                              View Details
                            </DropdownMenu.Item>
                            <DropdownMenu.Item class="menu-item" on:click={() => {
                              selectedCitation = reference.citation;
                              showCitationDialog = true;
                            }}>
                              Copy Citation
                            </DropdownMenu.Item>
                            <DropdownMenu.Item class="menu-item">
                              Export Reference
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <!-- Metadata -->
              {#if message.metadata}
                <div class="mt-2 text-xs text-gray-400 flex items-center space-x-3">
                  {#if message.metadata.model}
                    <span>Model: {message.metadata.model}</span>
                  {/if}
                  {#if message.metadata.processingTime}
                    <span>• {message.metadata.processingTime}ms</span>
                  {/if}
                  {#if message.metadata.searchResults}
                    <span>• {message.metadata.searchResults} results</span>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Enhanced Input Area -->
  <div class="border-t border-gray-200 p-4 bg-white">
    {#if error}
      <div class="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <div class="flex items-center">
          <AlertCircle class="w-4 h-4 text-red-500 mr-2" />
          <span class="text-sm text-red-700">{error}</span>
        </div>
      </div>
    {/if}

    <div class="flex space-x-3">
      <div class="flex-1 relative">
        <textarea
          bind:value={query}
          on:keypress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading}
          rows="1"
          class="legal-textarea min-h-[42px] max-h-[120px] pr-20 disabled:bg-gray-100 disabled:cursor-not-allowed"
          style="resize: none;"
        ></textarea>
        
        <div class="absolute right-2 top-2 flex items-center space-x-1">
          {#if enableVoiceInput && recognition}
            <Button.Root
              variant="ghost"
              size="sm"
              class="p-1 h-6 w-6 {isListening ? 'text-red-500' : 'text-legal-neutral hover:text-primary-600'}"
              on:click={isListening ? stopVoiceInput : startVoiceInput}
              disabled={isLoading}
            >
              🎤
            </Button.Root>
          {/if}
          
          <span class="text-xs text-gray-400">{query.length}</span>
        </div>
      </div>
      
      <Button.Root
        variant="default"
        on:click={askAI}
        disabled={!query.trim() || isLoading}
        class="legal-button-primary flex items-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {#if isLoading}
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Analyzing...</span>
        {:else}
          <Search class="w-4 h-4" />
          <span>Ask AI</span>
        {/if}
      </Button.Root>
    </div>
    
    <div class="mt-2 text-xs text-legal-neutral flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {#if caseId}
          <span>• Context: Case {caseId.slice(0, 8)}</span>
        {/if}
        {#if evidenceIds.length > 0}
          <span>• {evidenceIds.length} evidence item(s)</span>
        {/if}
      </div>
      
      <div class="flex items-center space-x-2">
        {#if selectedModel === 'local' || selectedModel === 'ollama'}
          <span class="text-green-600">Local Processing</span>
        {/if}
        <span>{conversation.length} messages</span>
      </div>
    </div>
  </div>
</div>

<!-- Citation Dialog -->
<DialogRoot bind:open={showCitationDialog}>
  <DialogContent class="legal-card max-w-lg">
    <DialogHeader>
      <DialogTitle class="legal-heading flex items-center">
        <Quote class="w-5 h-5 mr-2" />
        Legal Citation
      </DialogTitle>
    </DialogHeader>
    
    <div class="py-4">
      <div class="citation-block">
        <p class="text-sm">{selectedCitation}</p>
      </div>
      
      <div class="mt-4 flex space-x-2">
        <Button.Root class="legal-button-primary" on:click={insertCitation}>
          Insert into Document
        </Button.Root>
        <Button.Root variant="outline" on:click={() => navigator.clipboard.writeText(selectedCitation)}>
          Copy Citation
        </Button.Root>
      </div>
    </div>
    
    <Dialog.Footer>
      <DialogClose asChild let:builder>
        <Button.Root builders={[builder]} variant="ghost">Close</Button.Root>
      </DialogClose>
    </Dialog.Footer>
  </DialogContent>
</DialogRoot>

<style>
  .ai-legal-assistant {
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .message {
    animation: slideInFromBottom 0.3s ease-in-out;
    transform: translateY(0);
  }
  
  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .search-result:hover {
    background-color: rgb(239 246 255);
    border-color: rgb(147 197 253);
  }
  
  .statute-reference {
    display: inline-block;
    font-weight: 500;
  }

  /* Custom scrollbar for conversation area */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>
