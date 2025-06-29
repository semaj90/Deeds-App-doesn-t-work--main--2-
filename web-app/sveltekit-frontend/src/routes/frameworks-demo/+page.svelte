<!-- Legal Frameworks Demo - Pico CSS + UnoCSS + Melt UI -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { createTabs, createToast, melt } from '@melt-ui/svelte';
  import AskAI from '$lib/components/ai/AskAI.svelte';
  import WysiwygEditor from '$lib/components/editor/WysiwygEditor.svelte';
  import LegalDocumentEditor from '$lib/components/editor/LegalDocumentEditor.svelte';
  import { Brain, FileText, MessageCircle, Settings, Scales, BookOpen } from 'lucide-svelte';

  // Melt UI Tabs for switching between demos
  const {
    elements: { root, list, content, trigger },
    states: { value }
  } = createTabs({
    defaultValue: 'document-editor'
  });

  // Demo data
  let sampleCaseId = 'case-12345';
  let sampleContent = `MOTION TO DISMISS

Comes now the Defendant, by and through undersigned counsel, and respectfully moves this Honorable Court to dismiss the Plaintiff's Complaint pursuant to Federal Rule of Civil Procedure 12(b)(6) for failure to state a claim upon which relief can be granted.

I. STATEMENT OF FACTS

The Plaintiff filed a complaint alleging breach of contract. However, the complaint fails to...`;

  // Handle component events
  function handleSave(event: CustomEvent) {
    console.log('Document saved:', event.detail);
    // TODO: Save to backend
  }

  function handleAIResponse(event: CustomEvent) {
    console.log('AI Response:', event.detail);
  }

  onMount(() => {
    console.log('Legal Frameworks Demo loaded');
  });
</script>

<svelte:head>
  <title>Legal AI Frameworks Demo - Pico CSS + UnoCSS + Melt UI</title>
</svelte:head>

<!-- Main Container with Pico CSS semantic structure -->
<div class="demo-container" data-theme="light">
  
  <!-- Header -->
  <header class="demo-header">
    <div class="container">
      <nav class="flex items-center justify-between p-4">
        <div class="flex items-center space-x-3">
          <Scales class="w-8 h-8 text-primary-600" />
          <div>
            <h1 class="text-2xl font-bold text-legal-navy">Legal AI Demo</h1>
            <p class="text-sm text-legal-neutral">Pico CSS + UnoCSS + Melt UI Integration</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <span class="text-sm text-legal-neutral">Frameworks:</span>
          <span class="px-2 py-1 bg-primary-100 text-primary-800 rounded-md text-xs font-medium">Pico CSS</span>
          <span class="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">UnoCSS</span>
          <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium">Melt UI</span>
        </div>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="demo-main">
    <div class="container-fluid">
      
      <!-- Framework Integration Showcase -->
      <section class="mb-8">
        <div class="legal-card p-6">
          <h2 class="legal-heading text-xl mb-4">Framework Integration Showcase</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <!-- Pico CSS Demo -->
            <article class="framework-demo">
              <h3 class="legal-heading text-lg mb-3">Pico CSS</h3>
              <p class="legal-body mb-4">Semantic HTML styling with minimal classes</p>
              
              <!-- Pico CSS styled form -->
              <form class="space-y-3">
                <fieldset>
                  <label for="client-name">Client Name</label>
                  <input type="text" id="client-name" placeholder="Enter client name" />
                </fieldset>
                
                <fieldset>
                  <label for="case-type">Case Type</label>
                  <select id="case-type">
                    <option>Criminal Defense</option>
                    <option>Civil Litigation</option>
                    <option>Corporate Law</option>
                  </select>
                </fieldset>
                
                <fieldset>
                  <label for="notes">Case Notes</label>
                  <textarea id="notes" rows="3" placeholder="Enter case notes..."></textarea>
                </fieldset>
                
                <button type="submit" class="w-full">Save Case</button>
              </form>
            </article>

            <!-- UnoCSS Demo -->
            <article class="framework-demo">
              <h3 class="legal-heading text-lg mb-3">UnoCSS</h3>
              <p class="legal-body mb-4">Utility-first styling with legal-specific classes</p>
              
              <div class="space-y-3">
                <div class="citation-block">
                  <div class="statute-reference">42 U.S.C. § 1983</div>
                  <p class="text-sm">Civil action for deprivation of rights</p>
                </div>
                
                <div class="evidence-highlight">
                  <strong>Key Evidence:</strong> Security camera footage from 10:30 PM
                </div>
                
                <div class="rag-context">
                  <strong>AI Context:</strong> Similar cases show a 78% success rate for this type of motion.
                </div>
                
                <div class="flex space-x-2">
                  <button class="legal-button-primary">
                    <FileText class="w-4 h-4 mr-2" />
                    Draft Motion
                  </button>
                  <button class="legal-button-secondary">
                    <BookOpen class="w-4 h-4 mr-2" />
                    Research
                  </button>
                </div>
              </div>
            </article>

            <!-- Melt UI Demo -->
            <article class="framework-demo">
              <h3 class="legal-heading text-lg mb-3">Melt UI</h3>
              <p class="legal-body mb-4">Accessible interactive components</p>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <span class="text-sm font-medium">Case Status</span>
                  <select class="text-sm border-0 bg-transparent">
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Closed</option>
                  </select>
                </div>
                
                <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-blue-900">AI Analysis</span>
                    <Brain class="w-4 h-4 text-blue-600" />
                  </div>
                  <p class="text-xs text-blue-800">
                    Based on similar cases, this motion has a high probability of success.
                  </p>
                </div>
                
                <button class="legal-button-primary w-full flex items-center justify-center space-x-2">
                  <MessageCircle class="w-4 h-4" />
                  <span>Open AI Assistant</span>
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Component Demos with Melt UI Tabs -->
      <section class="demo-tabs">
        <div use:melt={$root} class="legal-card">
          
          <!-- Tab List -->
          <div use:melt={$list} class="flex border-b border-gray-200">
            <button
              use:melt={$trigger('document-editor')}
              class="tab-trigger"
              class:active={$value === 'document-editor'}
            >
              <FileText class="w-4 h-4 mr-2" />
              Document Editor
            </button>
            <button
              use:melt={$trigger('wysiwyg-editor')}
              class="tab-trigger"
              class:active={$value === 'wysiwyg-editor'}
            >
              <Settings class="w-4 h-4 mr-2" />
              WYSIWYG Editor
            </button>
            <button
              use:melt={$trigger('ai-assistant')}
              class="tab-trigger"
              class:active={$value === 'ai-assistant'}
            >
              <Brain class="w-4 h-4 mr-2" />
              AI Assistant
            </button>
          </div>

          <!-- Tab Content -->
          <div use:melt={$content('document-editor')} class="tab-content">
            <div class="p-6">
              <h3 class="legal-heading text-lg mb-4">Legal Document Editor</h3>
              <p class="legal-body mb-4">
                Full-featured document editor with AI assistance, citations, and collaborative features.
              </p>
              <LegalDocumentEditor
                {sampleCaseId}
                documentType="motion"
                title="Motion to Dismiss"
                on:save={handleSave}
                on:aiRequest={handleAIResponse}
              />
            </div>
          </div>

          <div use:melt={$content('wysiwyg-editor')} class="tab-content">
            <div class="p-6">
              <h3 class="legal-heading text-lg mb-4">WYSIWYG Editor with Hugerte</h3>
              <p class="legal-body mb-4">
                Rich text editor with legal-specific formatting and AI integration.
              </p>
              <WysiwygEditor
                content={sampleContent}
                enableAI={true}
                enableCitation={true}
                height="400px"
                on:change={(e) => console.log('Content changed:', e.detail)}
              />
            </div>
          </div>

          <div use:melt={$content('ai-assistant')} class="tab-content">
            <div class="p-6">
              <h3 class="legal-heading text-lg mb-4">AI Assistant</h3>
              <p class="legal-body mb-4">
                Intelligent legal AI with vector search and contextual responses.
              </p>
              <AskAI
                caseId={sampleCaseId}
                evidenceIds={['evidence-1', 'evidence-2']}
                placeholder="Ask about legal procedures, case law, or document drafting..."
                showReferences={true}
                enableVoiceInput={true}
                on:response={handleAIResponse}
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Technical Details -->
      <section class="mt-8">
        <div class="legal-card p-6">
          <h2 class="legal-heading text-xl mb-4">Technical Implementation</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <h3 class="legal-heading text-base mb-3">CSS Framework Stack</h3>
              <ul class="list-disc list-inside space-y-2 text-sm legal-body">
                <li><strong>Pico CSS:</strong> Semantic HTML base styling</li>
                <li><strong>UnoCSS:</strong> Utility classes with legal theme</li>
                <li><strong>Custom CSS:</strong> Legal-specific components</li>
                <li><strong>CSS Variables:</strong> Consistent theming</li>
              </ul>
            </div>
            
            <div>
              <h3 class="legal-heading text-base mb-3">Component Architecture</h3>
              <ul class="list-disc list-inside space-y-2 text-sm legal-body">
                <li><strong>Melt UI:</strong> Accessible interactive primitives</li>
                <li><strong>Svelte:</strong> Reactive component framework</li>
                <li><strong>TypeScript:</strong> Type safety and intellisense</li>
                <li><strong>Local LLM:</strong> Privacy-focused AI integration</li>
              </ul>
            </div>
          </div>
          
          <div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 class="font-medium text-green-900 mb-2">Benefits of This Stack</h4>
            <ul class="text-sm text-green-800 space-y-1">
              <li>✅ Semantic HTML with minimal CSS classes</li>
              <li>✅ Utility-first styling for rapid development</li>
              <li>✅ Accessible interactive components</li>
              <li>✅ Legal-specific design system</li>
              <li>✅ Privacy-focused local AI processing</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </main>
</div>

<style>
  .demo-container {
    min-height: 100vh;
    background: #fafafa;
  }

  .demo-header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .demo-main {
    padding: 2rem 0;
  }

  .framework-demo {
    @apply p-4 border border-gray-200 rounded-lg bg-white;
  }

  .tab-trigger {
    @apply px-4 py-3 text-sm font-medium text-legal-neutral hover:text-legal-navy border-b-2 border-transparent transition-colors flex items-center;
  }

  .tab-trigger.active {
    @apply text-primary-600 border-primary-600;
  }

  .tab-content {
    @apply hidden;
  }

  .tab-content[data-state="active"] {
    @apply block;
  }

  /* Ensure Pico CSS form styles work properly */
  :global(form fieldset) {
    border: none;
    padding: 0;
    margin: 0 0 1rem 0;
  }

  :global(form fieldset:last-child) {
    margin-bottom: 0;
  }
</style>
