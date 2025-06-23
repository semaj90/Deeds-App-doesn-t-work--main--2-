<script lang="ts">
  import { onMount } from 'svelte';

  let query = '';
  let isLoading = false;
  let response = '';
  let chatHistory: Array<{role: 'user' | 'assistant', content: string}> = [];

  async function handleSubmit() {
    if (!query.trim() || isLoading) return;

    isLoading = true;
    const userQuery = query;
    query = '';

    // Add user message to chat
    chatHistory = [...chatHistory, { role: 'user', content: userQuery }];

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuery,
          history: chatHistory
        })
      });

      const data = await res.json();

      if (data.success) {
        // Add assistant response to chat
        chatHistory = [...chatHistory, { role: 'assistant', content: data.response }];
      } else {
        chatHistory = [...chatHistory, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }];
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      chatHistory = [...chatHistory, { role: 'assistant', content: 'Sorry, the AI service is currently unavailable.' }];
    } finally {
      isLoading = false;
    }
  }

  function clearChat() {
    chatHistory = [];
  }
</script>

<svelte:head>
  <title>AI Assistant - WardenNet</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">AI Assistant</h1>
      <button
        class="btn btn-outline btn-sm"
        on:click={clearChat}
        disabled={chatHistory.length === 0}
      >
        Clear Chat
      </button>
    </div>

    <!-- Chat Area -->
    <div class="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
      <div class="chat-area min-h-[400px] max-h-[600px] overflow-y-auto mb-4 space-y-4">
        {#if chatHistory.length === 0}
          <div class="text-center text-base-content/60 py-16">
            <div class="text-6xl mb-4">🤖</div>
            <h3 class="text-lg font-semibold mb-2">AI Assistant Ready</h3>
            <p>Ask me anything about law enforcement, legal procedures, or case management.</p>
            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <button
                class="btn btn-outline btn-sm"
                on:click={() => query = "Explain probable cause requirements"}
              >
                Explain probable cause requirements
              </button>
              <button
                class="btn btn-outline btn-sm"
                on:click={() => query = "How to properly document evidence"}
              >
                How to properly document evidence
              </button>
              <button
                class="btn btn-outline btn-sm"
                on:click={() => query = "Search warrant procedures"}
              >
                Search warrant procedures
              </button>
              <button
                class="btn btn-outline btn-sm"
                on:click={() => query = "Miranda rights explanation"}
              >
                Miranda rights explanation
              </button>
            </div>
          </div>
        {/if}

        {#each chatHistory as message}
          <div class="chat {message.role === 'user' ? 'chat-end' : 'chat-start'}">
            <div class="chat-image avatar">
              <div class="w-10 rounded-full">
                {#if message.role === 'user'}
                  <div class="bg-primary text-primary-content w-10 h-10 rounded-full flex items-center justify-center">
                    👤
                  </div>
                {:else}
                  <div class="bg-secondary text-secondary-content w-10 h-10 rounded-full flex items-center justify-center">
                    🤖
                  </div>
                {/if}
              </div>
            </div>
            <div class="chat-header">
              {message.role === 'user' ? 'You' : 'AI Assistant'}
            </div>
            <div class="chat-bubble {message.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}">
              {message.content}
            </div>
          </div>
        {/each}

        {#if isLoading}
          <div class="chat chat-start">
            <div class="chat-image avatar">
              <div class="bg-secondary text-secondary-content w-10 h-10 rounded-full flex items-center justify-center">
                🤖
              </div>
            </div>
            <div class="chat-header">AI Assistant</div>
            <div class="chat-bubble chat-bubble-secondary">
              <span class="loading loading-dots loading-sm"></span>
              Thinking...
            </div>
          </div>
        {/if}
      </div>

      <!-- Input Area -->
      <form on:submit|preventDefault={handleSubmit} class="flex gap-2">
        <input
          bind:value={query}
          type="text"
          placeholder="Ask me anything about law enforcement, legal procedures, or case management..."
          class="input input-bordered flex-1"
          disabled={isLoading}
        />
        <button
          type="submit"
          class="btn btn-primary"
          disabled={!query.trim() || isLoading}
        >
          {#if isLoading}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            Send
          {/if}
        </button>
      </form>
    </div>

    <!-- Features -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title text-sm">🔍 Legal Research</h3>
          <p class="text-sm">Get instant answers about laws, statutes, and legal procedures.</p>
        </div>
      </div>
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title text-sm">📋 Case Analysis</h3>
          <p class="text-sm">Analyze case details and get recommendations for next steps.</p>
        </div>
      </div>
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title text-sm">📚 Training Support</h3>
          <p class="text-sm">Access training materials and best practice guidance.</p>
        </div>
      </div>
    </div>
  </div>
</div>


<script lang="ts">
  import LLMAssistant from '$lib/components/LLMAssistant.svelte';
</script>

<svelte:head>
  <title>AI Legal Assistant - WardenNet</title>
  <meta name="description" content="Secure offline legal AI assistant with privacy-first design" />
</svelte:head>

<div class="ai-assistant-page">
  <div class="page-header">
    <h1>AI Legal Assistant</h1>
    <p class="subtitle">
      Your secure, offline-friendly legal AI assistant powered by local GGUF models.
      All conversations stay private and are processed locally.
    </p>
  </div>

  <div class="assistant-container">
    <LLMAssistant />
  </div>

  <div class="features-info">
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>Privacy First</h3>
        <p>All processing happens locally. Your conversations never leave your device.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🧠</div>
        <h3>Legal Expertise</h3>
        <p>Trained on legal documents with specialized knowledge for legal professionals.</p>
      </div>
        <div class="feature-card">
        <div class="feature-icon">🎤</div>
        <h3>Voice Commands</h3>
        <p>Use voice input for hands-free legal research and document analysis.</p>
      </div>

      <!-- PII Protection commented out - focusing on core functionality -->
      <!-- <div class="feature-card">
        <div class="feature-icon">🛡️</div>
        <h3>PII Protection</h3>
        <p>Automatic masking of sensitive information with Legal-BERT integration.</p>
      </div> -->

      <div class="feature-card">
        <div class="feature-icon">💾</div>
        <h3>Offline Ready</h3>
        <p>Works without internet connection using locally stored GGUF models.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🔊</div>
        <h3>Text-to-Speech</h3>
        <p>Listen to responses with integrated TTS for accessibility and convenience.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .ai-assistant-page {
    max-width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f8f9fa;
  }

  .page-header {
    padding: 2rem;
    background: white;
    border-bottom: 1px solid #e1e5e9;
    text-align: center;
  }

  .page-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    margin: 0;
    font-size: 1.1rem;
    color: #6b7280;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .assistant-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .features-info {
    background: white;
    border-top: 1px solid #e1e5e9;
    padding: 2rem;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .feature-card {
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 12px;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .feature-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .feature-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
  }

  .feature-card p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .page-header {
      padding: 1rem;
    }

    .page-header h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .features-info {
      padding: 1rem;
    }

    .feature-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .feature-card {
      padding: 1rem;
    }
  }

  /* Hide features on small screens to focus on chat */
  @media (max-height: 600px) {
    .features-info {
      display: none;
    }
  }
</style>


<style>
  .chat-area {
    scroll-behavior: smooth;
  }

  .chat-area::-webkit-scrollbar {
    width: 6px;
  }

  .chat-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-area::-webkit-scrollbar-thumb {
    background: hsl(var(--bc) / 0.2);
    border-radius: 3px;
  }

  .chat-area::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--bc) / 0.3);
  }
</style>
