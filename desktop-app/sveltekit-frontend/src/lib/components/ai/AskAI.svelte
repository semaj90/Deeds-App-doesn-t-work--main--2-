<!-- Ask AI Component with Vector Search Integration -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import { getIndexedDBService, trackUserActivity } from '$lib/services/indexeddb';
  import { Search, MessageCircle, Loader2, Brain, AlertCircle, CheckCircle } from 'lucide-svelte';
  
  export let caseId: string | undefined = undefined;
  export let evidenceIds: string[] = [];
  export let placeholder = "Ask AI about this case...";
  export let maxHeight = "400px";
  export let showReferences = true;
  export let enableVoiceInput = false;

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
  let textareaRef: HTMLTextAreaElement;
  let messagesContainer: HTMLDivElement;

  // Advanced options
  let showAdvancedOptions = false;
  let selectedModel: 'openai' | 'ollama' = 'openai';
  let searchThreshold = 0.7;
  let maxResults = 10;
  let temperature = 0.7;

  // Voice input state
  let isListening = false;
  let recognition: SpeechRecognition | null = null;

  const dispatch = createEventDispatcher<{
    response: AIResponse;
    error: string;
    referenceClicked: { id: string; type: string };
  }>();

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
        textareaRef?.focus();
      };
      
      recognition.onerror = () => {
        isListening = false;
      };
      
      recognition.onend = () => {
        isListening = false;
      };
    }

    // Load conversation history from IndexedDB
    loadConversationHistory();
  });

  async function loadConversationHistory() {
    const indexedDB = getIndexedDBService();
    const contextKey = caseId ? `case_${caseId}` : 'general';
    const history = await indexedDB.getSetting(`ai_conversation_${contextKey}`);
    
    if (history && Array.isArray(history)) {
      conversation = history.slice(-10); // Load last 10 messages
    }
  }

  async function saveConversationHistory() {
    const indexedDB = getIndexedDBService();
    const contextKey = caseId ? `case_${caseId}` : 'general';
    await indexedDB.setSetting(`ai_conversation_${contextKey}`, conversation);
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

    // Auto-resize textarea
    if (textareaRef) {
      textareaRef.style.height = 'auto';
    }

    try {
      // Track user activity
      await trackUserActivity({
        type: 'search',
        target: caseId ? 'case' : 'evidence',
        targetId: caseId || 'general',
        query: currentQuery
      });

      // Prepare request
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
          includeReferences: showReferences
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

  // Auto-resize textarea
  function autoResize(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }
</script>

<div class="ai-chat-component legal-card">
  <!-- Header -->
  <div class="content-header">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Brain class="w-5 h-5 text-primary-600" />
        <h3 class="legal-heading text-lg">Ask AI Assistant</h3>
        {#if caseId}
          <span class="text-sm text-legal-neutral">• Case Context</span>
        {/if}
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          type="button"
          class="text-sm text-legal-neutral hover:text-primary-600 transition-colors"
          on:click={() => showAdvancedOptions = !showAdvancedOptions}
        >
          Advanced
        </button>
        
        {#if conversation.length > 0}
          <button
            type="button"
            class="text-sm text-red-500 hover:text-red-700 transition-colors"
            on:click={clearConversation}
          >
            Clear
          </button>
        {/if}
      </div>
    </div>

    <!-- Advanced Options -->
    {#if showAdvancedOptions}
      <div class="mt-4 pt-4 border-t border-gray-100 space-y-3">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-legal-neutral mb-1">
              Model
            </label>
            <select
              bind:value={selectedModel}
              class="legal-input text-sm"
            >
              <option value="openai">OpenAI GPT-3.5</option>
              <option value="ollama">Local LLM (Gemma)</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-legal-neutral mb-1">
              Search Threshold
            </label>
            <input
              type="range"
              min="0.5"
              max="0.9"
              step="0.1"
              bind:value={searchThreshold}
              class="w-full accent-primary-600"
            />
            <span class="text-xs text-legal-neutral">{searchThreshold}</span>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-legal-neutral mb-1">
              Max Results
            </label>
            <input
              type="number"
              min="5"
              max="50"
              bind:value={maxResults}
              class="legal-input text-sm"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-legal-neutral mb-1">
              Temperature
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              bind:value={temperature}
              class="w-full accent-primary-600"
            />
            <span class="text-xs text-legal-neutral">{temperature}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Conversation -->
  <div 
    bind:this={messagesContainer}
    class="h-64 overflow-y-auto p-4 space-y-4 bg-gray-50"
    style="max-height: {maxHeight};"
  >
    {#if conversation.length === 0}
      <div class="text-center text-legal-neutral py-8">
        <MessageCircle class="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p class="legal-body">Start a conversation with the AI assistant</p>
        <p class="text-sm mt-1 text-gray-500">Ask questions about cases, evidence, or legal procedures</p>
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
                  {message.type === 'user' ? 'You' : 'AI Assistant'}
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
              
              <!-- References -->
              {#if message.references && message.references.length > 0 && showReferences}
                <div class="mt-3 border-t border-gray-100 pt-3">
                  <h4 class="text-xs font-medium text-legal-neutral mb-2">References:</h4>
                  <div class="space-y-1">
                    {#each message.references as reference}
                      <button
                        type="button"
                        class="search-result block w-full text-left text-xs text-primary-600 hover:text-primary-800 p-2 rounded border border-primary-100"
                        on:click={() => handleReferenceClick(reference)}
                      >
                        <span class="font-medium statute-reference">{reference.type.toUpperCase()}:</span>
                        {reference.title}
                        <span class="text-legal-neutral">({Math.round(reference.relevanceScore * 100)}%)</span>
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <!-- Metadata -->
              {#if message.metadata}
                <div class="mt-2 text-xs text-gray-400">
                  {#if message.metadata.model}
                    Model: {message.metadata.model}
                  {/if}
                  {#if message.metadata.processingTime}
                    • {message.metadata.processingTime}ms
                  {/if}
                  {#if message.metadata.searchResults}
                    • {message.metadata.searchResults} results
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Input Area -->
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
          bind:this={textareaRef}
          bind:value={query}
          on:keypress={handleKeyPress}
          on:input={autoResize}
          placeholder={placeholder}
          disabled={isLoading}
          rows="1"
          class="legal-textarea min-h-[42px] max-h-[120px] disabled:bg-gray-100 disabled:cursor-not-allowed"
        ></textarea>
        
        {#if enableVoiceInput && recognition}
          <button
            type="button"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-legal-neutral hover:text-primary-600 transition-colors"
            class:text-red-500={isListening}
            on:click={isListening ? stopVoiceInput : startVoiceInput}
            disabled={isLoading}
          >
            🎤
          </button>
        {/if}
      </div>
      
      <button
        type="button"
        on:click={askAI}
        disabled={!query.trim() || isLoading}
        class="legal-button-primary flex items-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {#if isLoading}
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Thinking...</span>
        {:else}
          <Search class="w-4 h-4" />
          <span>Ask</span>
        {/if}
      </button>
    </div>
    
    <div class="mt-2 text-xs text-legal-neutral">
      Press Enter to send, Shift+Enter for new line
      {#if caseId}
        • Context: Case {caseId.slice(0, 8)}
      {/if}
      {#if evidenceIds.length > 0}
        • {evidenceIds.length} evidence item(s)
      {/if}
      {#if selectedModel === 'ollama'}
        • Using local LLM
      {/if}
    </div>
  </div>
</div>

<style>
  .ai-chat-component {
    font-family: system-ui, -apple-system, sans-serif;
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
  
  .user-message {
    opacity: 0.9;
  }
  
  .ai-message {
    background-color: rgb(249 250 251);
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-left: -0.5rem;
    margin-right: -0.5rem;
  }
  
  :global(.prose p) {
    margin-bottom: 0.5rem;
  }
  
  :global(.prose p:last-child) {
    margin-bottom: 0;
  }

  /* UnoCSS will handle the utility classes, this is for custom animations */
  .search-result:hover {
    background-color: rgb(239 246 255);
    border-color: rgb(147 197 253);
  }
  
  .statute-reference {
    display: inline-block;
    font-weight: 500;
  }
</style>
