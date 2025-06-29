<script lang="ts">
  import BitsUnoDemo from '$lib/components/ui/BitsUnoDemo.svelte';
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>Bits UI + UnoCSS Demo | Legal Case Management</title>
  <meta name="description" content="Demonstration of Bits UI and UnoCSS integration in the legal case management system." />
</svelte:head>

<!-- Navigation Header -->
<div class="bg-white border-b border-gray-200 sticky top-0 z-40">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <div class="flex items-center">
        <button 
          on:click={() => goto('/')}
          class="text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          ← Back to Dashboard
        </button>
      </div>
      <h1 class="text-lg font-semibold text-gray-800">UI Integration Demo</h1>
      <div class="w-32"></div> <!-- Spacer for centering -->
    </div>
  </div>
</div>

<!-- Demo Component -->
<BitsUnoDemo />

<!-- Additional Information -->
<div class="bg-gray-50 py-12">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="bg-white rounded-xl shadow-lg p-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Technical Implementation</h2>
      
      <div class="grid md:grid-cols-2 gap-8">
        <div>
          <h3 class="text-lg font-semibold text-blue-600 mb-4">Installed Packages</h3>
          <div class="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <div class="space-y-1 text-gray-700">
              <div>bits-ui@2.8.10</div>
              <div>unocss@66.3.2</div>
              <div>@unocss/vite@66.3.2</div>
              <div>@unocss/preset-uno@66.3.2</div>
              <div>@unocss/preset-attributify@66.3.2</div>
              <div>@unocss/preset-icons@66.3.2</div>
              <div>@unocss/preset-typography@66.3.2</div>
              <div>@unocss/preset-web-fonts@66.3.2</div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-semibold text-purple-600 mb-4">Configuration Files</h3>
          <div class="space-y-2 text-sm text-gray-700">
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              <code class="bg-gray-100 px-2 py-1 rounded">unocss.config.ts</code>
            </div>
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              <code class="bg-gray-100 px-2 py-1 rounded">vite.config.ts</code>
            </div>
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              <code class="bg-gray-100 px-2 py-1 rounded">+layout.svelte</code>
            </div>
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              <code class="bg-gray-100 px-2 py-1 rounded">package.json</code>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 class="font-semibold text-blue-800 mb-2">Integration Status</h4>
        <p class="text-blue-700 text-sm">
          ✅ Both Bits UI and UnoCSS are successfully integrated and working together in both the web-app and desktop-app (which shares the same frontend).
          The desktop app uses the web-app's SvelteKit frontend as specified in the Tauri configuration.
        </p>
      </div>
    </div>
  </div>
</div>
