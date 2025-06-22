<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types'; // This should be correct if $types is generated properly
  import type { PageData } from './$types';

  export let data: PageData;

  export let form: ActionData;

  let loading = false;
  let fromParam: string = '';

  $: {
    if ($page.url.searchParams.has('from')) {
      fromParam = $page.url.searchParams.get('from') || '';
    }
  }
</script>

<svelte:head>
  <title>Login - Prosecutor Case Management</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-500/20 via-gray-50 to-indigo-500/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
        </svg>
      </div>
      <h2 class="text-3xl font-extrabold text-gray-900">
        Prosecutor Case Management
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        Sign in to your account
      </p>
      <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
        <div class="text-xs text-blue-700 space-y-1">
          <div><strong>Admin:</strong> admin@example.com / admin123</div>
          <div><strong>User:</strong> user@example.com / user123</div>
        </div>
      </div>
    </div>
    
    <form method="POST" use:enhance={({ formElement, formData, action, cancel, submitter }) => {
      loading = true;
      return async ({ result, update }) => {
        loading = false;
        await update();
      };
    }} class="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg">
      
      {#if form?.error}
        <div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {form.error}
        </div>
      {/if}
      
      {#if data.message}
        <div role="alert" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {data.message}
        </div>
      {/if}

      <input type="hidden" name="callbackUrl" value={fromParam} />
      
      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
          <div class="relative mt-1">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </div>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="prosecutor@example.com"
              class="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              autocomplete="email"
            />
          </div>
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <div class="relative mt-1">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              class="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              autocomplete="current-password"
            />
          </div>
          <div class="text-sm text-right mt-2">
            <a href="/forgot-password" class="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
      
      <div>
        <button
          type="submit"
          disabled={loading}
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {#if loading}
            <span class="loading loading-spinner loading-sm mr-2"></span>
            Signing In...
          {:else}
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            Sign In
          {/if}
        </button>
      </div>
      
      <div class="text-center">
        <p class="text-sm text-gray-600">
          Don't have an account?
          <a href="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
            Create one here
          </a>
        </p>
      </div>
    </form>
  </div>
</div>