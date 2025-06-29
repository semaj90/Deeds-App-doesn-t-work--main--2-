<script lang="ts">
  import { createDialog, createPopover, createDropdownMenu, melt } from '@melt-ui/svelte';
  import { fade } from 'svelte/transition';
  
  // Create dialog state
  const {
    elements: { trigger: dialogTrigger, overlay: dialogOverlay, content: dialogContent, title: dialogTitle, description: dialogDescription, close: dialogClose, portalled: dialogPortalled },
    states: { open: dialogOpen }
  } = createDialog();
  
  // Create popover state
  const {
    elements: { trigger: popoverTrigger, content: popoverContent, arrow: popoverArrow },
    states: { open: popoverOpen }
  } = createPopover();
  
  // Create dropdown state
  const {
    elements: { trigger: dropdownTrigger, menu: dropdownMenu, item: dropdownItem, separator: dropdownSeparator },
    states: { open: dropdownOpen }
  } = createDropdownMenu();
</script>

<div class="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
  <!-- Header -->
  <div class="max-w-4xl mx-auto">
    <h1 class="text-4xl font-bold text-gray-800 mb-2 text-center">
      Melt UI + UnoCSS Integration Demo
    </h1>
    <p class="text-lg text-gray-600 text-center mb-8">
      Showcasing seamless integration between Melt UI components and UnoCSS utilities
    </p>

    <!-- Main Demo Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <!-- Dialog Demo -->
      <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
        <h3 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span class="text-2xl mr-2">💬</span>
          Dialog Component
        </h3>
        <p class="text-gray-600 mb-4">Modal dialogs with UnoCSS styling</p>
        
        <button 
          use:melt={$dialogTrigger}
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Open Dialog
        </button>
        
        <div use:melt={$dialogPortalled}>
          {#if $dialogOpen}
            <div use:melt={$dialogOverlay} class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" in:fade={{ duration: 150 }} out:fade={{ duration: 150 }}></div>
            <div 
              use:melt={$dialogContent}
              class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl border border-gray-200"
              in:fade={{ duration: 150 }}
              out:fade={{ duration: 150 }}
            >
              <h2 use:melt={$dialogTitle} class="text-xl font-semibold text-gray-800 mb-4">
                UnoCSS Styled Dialog
              </h2>
              <p use:melt={$dialogDescription} class="text-gray-600 mb-6">
                This dialog showcases Melt UI components styled with UnoCSS utility classes for a modern, responsive design.
              </p>
              
              <div class="flex justify-end space-x-3">
                <button 
                  use:melt={$dialogClose}
                  class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  use:melt={$dialogClose}
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Popover Demo -->
      <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
        <h3 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span class="text-2xl mr-2">🎯</span>
          Popover Component
        </h3>
        <p class="text-gray-600 mb-4">Context menus and tooltips</p>
        
        <button 
          use:melt={$popoverTrigger}
          class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Show Popover
        </button>
        
        {#if $popoverOpen}
          <div 
            use:melt={$popoverContent}
            class="z-50 w-72 rounded-lg bg-white p-4 shadow-xl border border-gray-200"
            in:fade={{ duration: 150 }}
            out:fade={{ duration: 150 }}
          >
            <div class="space-y-3">
              <h4 class="font-semibold text-gray-800">UnoCSS Features</h4>
              <ul class="space-y-2 text-sm text-gray-600">
                <li class="flex items-center">
                  <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Utility-first CSS framework
                </li>
                <li class="flex items-center">
                  <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  On-demand compilation
                </li>
                <li class="flex items-center">
                  <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Highly customizable
                </li>
              </ul>
            </div>
          </div>
        {/if}
      </div>

      <!-- Dropdown Demo -->
      <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
        <h3 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span class="text-2xl mr-2">📋</span>
          Dropdown Menu
        </h3>
        <p class="text-gray-600 mb-4">Navigation and action menus</p>
        
        <button 
          use:melt={$dropdownTrigger}
          class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          Open Menu
          <span class="ml-2 transform transition-transform {$dropdownOpen ? 'rotate-180' : ''}">▼</span>
        </button>
        
        {#if $dropdownOpen}
          <div 
            use:melt={$dropdownMenu}
            class="z-50 min-w-48 rounded-lg bg-white p-2 shadow-xl border border-gray-200 mt-2"
            in:fade={{ duration: 150 }}
            out:fade={{ duration: 150 }}
          >
            <div use:melt={$dropdownItem} class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer transition-colors">
              <span class="mr-2">⚙️</span>
              Settings
            </div>
            <div use:melt={$dropdownItem} class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer transition-colors">
              <span class="mr-2">👤</span>
              Profile
            </div>
            <div use:melt={$dropdownSeparator} class="my-1 h-px bg-gray-200"></div>
            <div use:melt={$dropdownItem} class="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors">
              <span class="mr-2">🚪</span>
              Sign out
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Feature Showcase -->
    <div class="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
      <h3 class="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Integration Highlights
      </h3>
      
      <div class="grid md:grid-cols-2 gap-8">
        <div>
          <h4 class="text-lg font-semibold text-blue-600 mb-3">Bits UI Features</h4>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start">
              <span class="text-green-500 mr-2 mt-1">✓</span>
              Accessible components out of the box
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2 mt-1">✓</span>
              Keyboard navigation support
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2 mt-1">✓</span>
              Customizable with any CSS framework
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2 mt-1">✓</span>
              Built for Svelte with TypeScript
            </li>
          </ul>
        </div>
        
        <div>
          <h4 class="text-lg font-semibold text-purple-600 mb-3">UnoCSS Benefits</h4>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start">
              <span class="text-green-500 mr-2 mt-1">✓</span>
              Instant CSS generation
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2 mt-1">✓</span>
              Minimal bundle size
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2 mt-1">✓</span>
              Flexible theming system
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2 mt-1">✓</span>
              IDE autocompletion support
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Status Indicator -->
    <div class="mt-8 text-center">
      <div class="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
        <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
        Bits UI + UnoCSS Integration Active
      </div>
    </div>
  </div>
</div>
