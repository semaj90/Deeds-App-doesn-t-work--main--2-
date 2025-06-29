<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  // Define types for browser-specific Speech Recognition APIs
  interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }

  const dispatch = createEventDispatcher();
  
  // Voice recognition state
  let isListening = false;
  let isSupported = false;
  let recognition: any = null;
  let currentTranscript = '';
  let finalTranscript = '';
  let interimTranscript = '';
  
  // Voice command patterns
  const commands = {
    start: ['start listening', 'begin', 'listen'],
    stop: ['stop listening', 'stop', 'end'],
    send: ['send message', 'send', 'submit'],
    clear: ['clear text', 'clear', 'delete all'],
    help: ['help', 'what can you do', 'commands']
  };
  
  // Voice feedback
  let speechSynthesis: SpeechSynthesis | null = null;
  let voices: SpeechSynthesisVoice[] = [];
  
  onMount(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as unknown as IWindow).webkitSpeechRecognition || (window as unknown as IWindow).SpeechRecognition;
      recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        isListening = true;
        dispatch('start');
      };
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          dispatch('transcript', { text: finalTranscript });
        }
        // You can also dispatch interim results if needed
        // dispatch('interim-transcript', { text: interimTranscript });
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        isListening = false;
        dispatch('error', { error: event.error });
      };
      
      recognition.onend = () => {
        isListening = false;
        dispatch('end');
      };
      
      isSupported = true;
    }
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis = window.speechSynthesis;
      
      // Load voices
      const loadVoices = () => {
        voices = speechSynthesis.getVoices();
      };
      
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  });
  
  onDestroy(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
  });
  
  function processVoiceCommand(text: string) {
    // Check for specific commands
    for (const [command, patterns] of Object.entries(commands)) {
      for (const pattern of patterns) {
        if (text.includes(pattern)) {
          executeCommand(command, text);
          return;
        }
      }
    }
    
    // If no command matches, treat as a question/message
    if (text.length > 10) { // Only process substantial text
      dispatch('voiceMessage', { text: finalTranscript });
      finalTranscript = '';
    }
  }
  
  function executeCommand(command: string, fullText: string) {
    switch (command) {
      case 'start':
        if (!isListening) {
          startListening();
        }
        break;
        
      case 'stop':
        stopListening();
        break;
        
      case 'send':
        if (finalTranscript.trim()) {
          // Remove the command part and send the rest
          const messageText = finalTranscript.replace(/send message|send|submit/gi, '').trim();
          if (messageText) {
            dispatch('voiceMessage', { text: messageText });
          }
          finalTranscript = '';
        }
        break;
        
      case 'clear':
        dispatch('clearInput');
        speak("Input cleared.");
        break;
        
      case 'help':
        const helpMessage = `
          Here are the voice commands I understand:
          - "Start listening" or "Begin" to start voice input
          - "Stop listening" or "Stop" to stop voice input  
          - "Send message" or "Send" to send your current message
          - "Clear text" or "Clear" to clear the input
          - Or just ask me any legal question directly
        `;
        speak(helpMessage);
        break;
    }
  }
  
  function speak(text: string, rate: number = 0.9) {
    if (!speechSynthesis) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Use a pleasant voice if available
    const preferredVoices = voices.filter(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Karen'))
    );
    
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    } else if (voices.length > 0) {
      utterance.voice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    }
    
    speechSynthesis.speak(utterance);
  }
  
  function startListening() {
    if (!isSupported || !recognition) {
      speak("Voice recognition is not supported in your browser.");
      return;
    }
    
    if (isListening) {
      speak("I'm already listening.");
      return;
    }
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      speak("Sorry, I couldn't start listening. Please try again.");
    }
  }
  
  function stopListening() {
    if (!isListening) {
      speak("I wasn't listening.");
      return;
    }
    
    if (recognition) {
      recognition.stop();
    }
    isListening = false;
    speak("Voice input stopped.");
  }
  
  function toggleListening() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }
  
  // Expose functions to parent component
  export { startListening, stopListening, toggleListening, speak };
</script>

<div class="voice-assistant" class:listening={isListening}>
  {#if isSupported}
    <div class="voice-controls">
      <button
        class="voice-toggle"
        class:active={isListening}
        on:click={toggleListening}
        title={isListening ? 'Stop listening' : 'Start voice commands'}
      >
        {#if isListening}
          <div class="pulse-ring"></div>
          <div class="pulse-ring delay-1"></div>
          <div class="pulse-ring delay-2"></div>
        {/if}
        <span class="icon">🎤</span>
      </button>
      
      <div class="voice-status">
        {#if isListening}
          <span class="status-text">Listening...</span>
          {#if interimTranscript}
            <div class="interim-transcript">"{interimTranscript}"</div>
          {/if}
        {:else}
          <span class="status-text">Click to start voice commands</span>
        {/if}
      </div>
    </div>
    
    {#if currentTranscript}
      <div class="transcript">
        <strong>You said:</strong> "{currentTranscript}"
      </div>
    {/if}
    
    <div class="voice-help">
      <details>
        <summary>Voice Commands</summary>
        <ul>
          <li><strong>"Start listening"</strong> - Begin voice input</li>
          <li><strong>"Stop listening"</strong> - End voice input</li>
          <li><strong>"Send message"</strong> - Send current text</li>
          <li><strong>"Clear text"</strong> - Clear input field</li>
          <li><strong>"Help"</strong> - Hear available commands</li>
          <li><strong>Or just ask any legal question!</strong></li>
        </ul>
      </details>
    </div>
  {:else}
    <div class="voice-unsupported">
      <span class="icon">🚫</span>
      <span>Voice recognition not supported in this browser</span>
    </div>
  {/if}
</div>

<style>
  .voice-assistant {
    padding: 1rem;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    background: #f8f9fa;
    margin-bottom: 1rem;
  }
  
  .voice-assistant.listening {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  .voice-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .voice-toggle {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    background: #f3f4f6;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 1;
  }
  
  .voice-toggle:hover {
    background: #e5e7eb;
    transform: scale(1.05);
  }
  
  .voice-toggle.active {
    background: #3b82f6;
    color: white;
  }
  
  .voice-toggle .icon {
    font-size: 1.5rem;
    z-index: 2;
  }
  
  /* Pulse animation for active listening */
  .pulse-ring {
    position: absolute;
    width: 60px;
    height: 60px;
    border: 2px solid #3b82f6;
    border-radius: 50%;
    animation: pulse 2s linear infinite;
    z-index: 0;
  }
  
  .pulse-ring.delay-1 {
    animation-delay: 0.5s;
  }
  
  .pulse-ring.delay-2 {
    animation-delay: 1s;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  .voice-status {
    flex: 1;
  }
  
  .status-text {
    font-weight: 500;
    color: #374151;
  }
  
  .interim-transcript {
    font-size: 0.875rem;
    color: #6b7280;
    font-style: italic;
    margin-top: 0.25rem;
  }
  
  .transcript {
    padding: 0.75rem;
    background: white;
    border-radius: 6px;
    margin: 0.5rem 0;
    font-size: 0.875rem;
    color: #374151;
  }
  
  .voice-help {
    margin-top: 1rem;
  }
  
  .voice-help details {
    font-size: 0.875rem;
  }
  
  .voice-help summary {
    cursor: pointer;
    color: #6b7280;
    margin-bottom: 0.5rem;
    user-select: none;
  }
  
  .voice-help summary:hover {
    color: #374151;
  }
  
  .voice-help ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #6b7280;
  }
  
  .voice-help li {
    margin-bottom: 0.25rem;
  }
  
  .voice-unsupported {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #9ca3af;
    font-size: 0.875rem;
  }
  
  .voice-unsupported .icon {
    font-size: 1.2rem;
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .voice-assistant {
      padding: 0.75rem;
    }
    
    .voice-controls {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .voice-toggle {
      width: 50px;
      height: 50px;
    }
    
    .pulse-ring {
      width: 50px;
      height: 50px;
    }
  }
</style>
