<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/tauri';
  import VoiceAssistant from './VoiceAssistant.svelte';
  
  // Chat state
  let messages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}> = [];
  let chatInput = '';
  let isGenerating = false;
  let isSidebarOpen = true;
  let chatHistory: Array<{id: string, title: string, timestamp: Date}> = [];
  let currentChatId = '';
    // Voice state
  let voiceAssistant: VoiceAssistant;
  let isVoiceEnabled = false;
  
  // TTS state
  let isSpeaking = false;
  let speechSynthesis: SpeechSynthesis | null = null;
  
  // Model state
  let availableModels: Array<{model_name: string, is_active: boolean}> = [];
  let selectedModel = '';
  let isServiceRunning = false;
    onMount(async () => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis = window.speechSynthesis;
    }
    
    // Check if voice recognition is supported
    isVoiceEnabled = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    // Load available models and check service status
    await refreshModels();
    await checkServiceStatus();
    loadChatHistory();
    startNewChat();
  });
  
  async function refreshModels() {
    try {
      const models = await invoke('plugin:llm|list_local_models') as Array<any>;
      availableModels = models;
      if (models.length > 0 && !selectedModel) {
        selectedModel = models[0].model_name;
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  }
  
  async function checkServiceStatus() {
    try {
      const status = await invoke('plugin:llm|check_llm_service_status') as any;
      isServiceRunning = status.available;
    } catch (error) {
      console.error('Failed to check service status:', error);
      isServiceRunning = false;
    }
  }
  
  function loadChatHistory() {
    // Load from localStorage for now - could be from database later
    const saved = localStorage.getItem('llm_chat_history');
    if (saved) {
      chatHistory = JSON.parse(saved).map((chat: any) => ({
        ...chat,
        timestamp: new Date(chat.timestamp)
      }));
    }
  }
  
  function saveChatHistory() {
    localStorage.setItem('llm_chat_history', JSON.stringify(chatHistory));
  }
  
  function startNewChat() {
    currentChatId = generateId();
    messages = [];
    const newChat = {
      id: currentChatId,
      title: 'New Chat',
      timestamp: new Date()
    };
    chatHistory = [newChat, ...chatHistory];
    saveChatHistory();
  }
  
  function selectChat(chatId: string) {
    currentChatId = chatId;
    const saved = localStorage.getItem(`llm_chat_${chatId}`);
    if (saved) {
      messages = JSON.parse(saved).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } else {
      messages = [];
    }
  }
  
  function saveCurrentChat() {
    localStorage.setItem(`llm_chat_${currentChatId}`, JSON.stringify(messages));
    
    // Update chat title if this is the first message
    const chatIndex = chatHistory.findIndex(chat => chat.id === currentChatId);
    if (chatIndex >= 0 && messages.length > 0 && chatHistory[chatIndex].title === 'New Chat') {
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        chatHistory[chatIndex].title = firstUserMessage.content.substring(0, 50) + '...';
        saveChatHistory();
      }
    }
  }
  
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
    function handleVoiceMessage(event: CustomEvent) {
    chatInput = event.detail.text;
    // Auto-send if the message looks complete
    if (chatInput.trim().length > 10 && chatInput.includes('?')) {
      sendMessage();
    }
  }
  
  function handleClearInput() {
    chatInput = '';
  }
  
  function startVoiceInput() {
    if (voiceAssistant && isVoiceEnabled) {
      voiceAssistant.startListening();
    }
  }
  
  function stopVoiceInput() {
    if (voiceAssistant && isVoiceEnabled) {
      voiceAssistant.stopListening();
    }
  }
  
  async function speakText(text: string) {
    if (!speechSynthesis) {
      // Fallback to OpenTTS if available
      try {
        const response = await fetch('http://localhost:5500/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            voice: 'en',
            speaker_id: 0
          })
        });
        
        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          isSpeaking = true;
          
          audio.onended = () => {
            isSpeaking = false;
            URL.revokeObjectURL(audioUrl);
          };
          
          audio.play();
          return;
        }
      } catch (error) {
        console.log('OpenTTS not available, falling back to browser TTS');
      }
    }
    
    // Browser TTS fallback
    if (speechSynthesis) {
      speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => { isSpeaking = true; };
      utterance.onend = () => { isSpeaking = false; };
      utterance.onerror = () => { isSpeaking = false; };
      
      speechSynthesis.speak(utterance);
    }
  }
  
  function stopSpeaking() {
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    isSpeaking = false;
  }
  
  async function sendMessage() {
    if (!chatInput.trim() || isGenerating) return;
    
    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content: chatInput.trim(),
      timestamp: new Date()
    };
    
    messages = [...messages, userMessage];
    const prompt = chatInput.trim();
    chatInput = '';
    isGenerating = true;
    
    try {
      // Call the SvelteKit API endpoint for chat
      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          context: messages.slice(-5), // Send last 5 messages for context
          model: selectedModel
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
        // PII masking commented out - focusing on core functionality
      let assistantContent = data.response;
      
      // TODO: Optional - add PII masking later if needed
      // if (data.response.includes('PII') || data.response.includes('sensitive')) {
      //   try {
      //     const maskResponse = await fetch('http://localhost:8002/api/mask', {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({ text: data.response })
      //     });
      //     if (maskResponse.ok) {
      //       const maskData = await maskResponse.json();
      //       assistantContent = maskData.masked_text;
      //     }
      //   } catch (maskError) {
      //     console.log('PII masking service not available:', maskError);
      //   }
      // }
      
      const assistantMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: assistantContent,
        timestamp: new Date()
      };
      
      messages = [...messages, assistantMessage];
      saveCurrentChat();
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate response'}. Please ensure your model is uploaded and the service is running.`,
        timestamp: new Date()
      };
      
      messages = [...messages, errorMessage];
    } finally {
      isGenerating = false;
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  function deleteChat(chatId: string) {
    chatHistory = chatHistory.filter(chat => chat.id !== chatId);
    localStorage.removeItem(`llm_chat_${chatId}`);
    saveChatHistory();
    
    if (currentChatId === chatId) {
      startNewChat();
    }
  }
  
  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function formatDate(date: Date) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }
</script>

<div class="llm-assistant-container">
  <!-- Sidebar -->
  <div class="sidebar" class:open={isSidebarOpen}>
    <div class="sidebar-header">
      <h3>Chat History</h3>
      <button
        class="sidebar-toggle"
        on:click={() => isSidebarOpen = !isSidebarOpen}
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? '←' : '→'}
      </button>
    </div>
    
    <button class="new-chat-btn" on:click={startNewChat}>
      + New Chat
    </button>
    
    <div class="model-selector">
      <label for="model-select">Model:</label>
      <select id="model-select" bind:value={selectedModel}>
        {#each availableModels as model}
          <option value={model.model_name}>{model.model_name}</option>
        {/each}
      </select>
      <div class="service-status" class:running={isServiceRunning}>
        {isServiceRunning ? '● Online' : '● Offline'}
      </div>
    </div>
    
    <div class="chat-history">
      {#each chatHistory as chat}
        <div
          class="chat-item"
          class:active={chat.id === currentChatId}
          on:click={() => selectChat(chat.id)}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && selectChat(chat.id)}
        >
          <div class="chat-title">{chat.title}</div>
          <div class="chat-date">{formatDate(chat.timestamp)}</div>
          <button
            class="delete-chat"
            on:click|stopPropagation={() => deleteChat(chat.id)}
            aria-label="Delete chat"
          >
            ×
          </button>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Main Chat Area -->
  <div class="chat-main">
    <div class="chat-header">
      <h2>AI Legal Assistant</h2>
      <div class="chat-actions">
        <button on:click={refreshModels} title="Refresh models">
          🔄
        </button>
        <button on:click={checkServiceStatus} title="Check service status">
          📡
        </button>
      </div>
    </div>
    
    <div class="messages-container">
      {#each messages as message}
        <div class="message {message.role}">
          <div class="message-content">
            {message.content}
          </div>
          <div class="message-actions">
            <span class="message-time">{formatTime(message.timestamp)}</span>
            {#if message.role === 'assistant'}
              <button
                class="speak-btn"
                class:speaking={isSpeaking}
                on:click={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                title={isSpeaking ? 'Stop speaking' : 'Speak text'}
              >
                {isSpeaking ? '🔇' : '🔊'}
              </button>
            {/if}
          </div>
        </div>
      {/each}
      
      {#if isGenerating}
        <div class="message assistant generating">
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      {/if}
    </div>
      <div class="input-area">
      <!-- Voice Assistant Component -->
      {#if isVoiceEnabled}
        <VoiceAssistant
          bind:this={voiceAssistant}
          on:voiceMessage={handleVoiceMessage}
          on:clearInput={handleClearInput}
        />
      {/if}
      
      <div class="input-container">
        <textarea
          bind:value={chatInput}
          on:keydown={handleKeydown}
          placeholder="Ask your legal AI assistant anything..."
          rows="2"
          disabled={isGenerating}
        ></textarea>
          <div class="input-actions">
          <button
            class="voice-btn"
            on:click={startVoiceInput}
            title="Start voice commands"
            disabled={isGenerating}
          >
            🎤
          </button>
          
          <button
            class="send-btn"
            on:click={sendMessage}
            disabled={!chatInput.trim() || isGenerating}
            title="Send message"
          >
            {isGenerating ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .llm-assistant-container {
    display: flex;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8f9fa;
  }
  
  .sidebar {
    width: 300px;
    background: #ffffff;
    border-right: 1px solid #e1e5e9;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
    position: relative;
    z-index: 10;
  }
  
  .sidebar:not(.open) {
    transform: translateX(-100%);
    position: absolute;
    height: 100%;
  }
  
  .sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid #e1e5e9;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .sidebar-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
  }
  
  .sidebar-toggle {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
  }
  
  .sidebar-toggle:hover {
    background: #f3f4f6;
  }
  
  .new-chat-btn {
    margin: 1rem;
    padding: 0.75rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
  }
  
  .new-chat-btn:hover {
    background: #2563eb;
  }
  
  .model-selector {
    padding: 0 1rem 1rem;
    border-bottom: 1px solid #e1e5e9;
  }
  
  .model-selector label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }
  
  .model-selector select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
  }
  
  .service-status {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #ef4444;
  }
  
  .service-status.running {
    color: #10b981;
  }
  
  .chat-history {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }
  
  .chat-item {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
    position: relative;
  }
  
  .chat-item:hover {
    background: #f3f4f6;
  }
  
  .chat-item.active {
    background: #eff6ff;
    border-left: 3px solid #3b82f6;
  }
  
  .chat-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 1.5rem;
  }
  
  .chat-date {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .delete-chat {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .chat-item:hover .delete-chat {
    opacity: 1;
  }
  
  .delete-chat:hover {
    background: #fef2f2;
    color: #ef4444;
  }
  
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  
  .chat-header {
    padding: 1rem;
    border-bottom: 1px solid #e1e5e9;
    background: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .chat-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
  }
  
  .chat-actions button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    margin-left: 0.5rem;
    border-radius: 6px;
  }
  
  .chat-actions button:hover {
    background: #f3f4f6;
  }
  
  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: white;
  }
  
  .message {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
  }
  
  .message.user {
    align-items: flex-end;
  }
  
  .message.assistant {
    align-items: flex-start;
  }
  
  .message-content {
    max-width: 80%;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    line-height: 1.5;
    word-wrap: break-word;
  }
  
  .message.user .message-content {
    background: #3b82f6;
    color: white;
  }
  
  .message.assistant .message-content {
    background: #f3f4f6;
    color: #374151;
  }
  
  .message.generating .message-content {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }
  
  .message-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .message.user .message-actions {
    justify-content: flex-end;
  }
  
  .speak-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .speak-btn:hover {
    background: #f3f4f6;
  }
  
  .speak-btn.speaking {
    color: #ef4444;
  }
  
  .typing-indicator {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }
  
  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9ca3af;
    animation: typing 1.4s infinite ease-in-out;
  }
  
  .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
  .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes typing {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }
  
  .input-area {
    padding: 1rem;
    background: white;
    border-top: 1px solid #e1e5e9;
  }
  
  .input-container {
    position: relative;
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
  }
  
  .input-container textarea {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    resize: none;
    max-height: 120px;
    font-family: inherit;
    font-size: 0.875rem;
  }
  
  .input-container textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .input-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .voice-btn, .send-btn {
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }
  
  .voice-btn {
    background: #f3f4f6;
    color: #374151;
  }
  
  .voice-btn:hover:not(:disabled) {
    background: #e5e7eb;
  }
  
  .voice-btn.listening {
    background: #fef2f2;
    color: #ef4444;
  }
  
  .send-btn {
    background: #3b82f6;
    color: white;
  }
  
  .send-btn:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .send-btn:disabled, .voice-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .llm-assistant-container {
      height: 100vh;
    }
    
    .sidebar {
      width: 100%;
      position: absolute;
      height: 100%;
      z-index: 20;
    }
    
    .chat-main {
      width: 100%;
    }
    
    .message-content {
      max-width: 90%;
    }
    
    .input-container {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .input-actions {
      justify-content: flex-end;
    }
  }
</style>
