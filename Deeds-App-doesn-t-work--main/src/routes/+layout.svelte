<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Header from '$lib/components/+Header.svelte';
  import Sidebar from '$lib/components/+Sidebar.svelte';
  import { browser } from '$app/environment';
  import type { PageData } from './$types';
  import { userSessionStore } from '$lib/auth/userStore';
  import '$lib/components/app.css';

  export let data: PageData;

  // Use reactive statement to get user from data, fallback to $page store if needed
  $: user = data?.session?.user ?? $page.data.session?.user ?? null;

  // Only update userSessionStore on the client and when user changes
  $: if (browser) {
    if (user) {
      userSessionStore.set({
        user: {
          id: user.id ?? '',
          name: user.name ?? '',
          email: user.email ?? '',
          image: user.image ?? undefined,
          username: user.username ?? '',
          role: user.role ?? ''
        },
        expires: null
      });
    } else {
      userSessionStore.set({ user: null, expires: null });
    }
  }

  // Defensive: only attach window.onerror in browser
  if (browser && typeof window !== 'undefined') {
    window.onerror = function(message, source, lineno, colno, error) {
      console.error('Client-side error caught by window.onerror:');
      console.error('Message:', message);
      console.error('Source:', source);
      console.error('Line:', lineno);
      console.error('Column:', colno);
      console.error('Error object:', error);
      return true;
    };
  }
</script>

<nav class="navbar bg-base-100 shadow mb-4">
  <div class="container mx-auto flex justify-between items-center py-2 px-4">
    <div class="flex items-center gap-4">
      <a href="/" class="font-bold text-lg">WardenNet</a>
      <a href="/cases">Cases</a>
      <a href="/evidence">Evidence</a>
      <a href="/law">Law</a>
      <a href="/ai">AI Prompt</a>
    </div>
    <div class="flex items-center gap-2">
      {#if user}
        <a href="/profile">Profile</a>
        <a href="/logout">Logout</a>
      {:else}
        <a href="/login">Login</a>
        <a href="/register">Register</a>
      {/if}
    </div>
  </div>
</nav>
<div class="drawer lg:drawer-open">
  <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col">
    <!-- Page content here -->
    <Header {user} />
    <main class="flex-1 p-4 lg:p-8">
      <slot />
    </main>
  </div>
  {#if user}
    <div class="drawer-side">
      <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
      <Sidebar />
    </div>
  {/if}
</div>