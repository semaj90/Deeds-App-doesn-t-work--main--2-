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

  $: user = $page.data.session?.user;

  $: if (browser && data.user !== undefined) {
    if (data.user) {
      userSessionStore.set({
        user: {
          id: data.user.id ?? '',
          name: data.user.name ?? '',
          email: data.user.email ?? '',
          image: data.user.image ?? undefined,
          username: data.user.username ?? '',
          role: data.user.role ?? ''
        },
        expires: null
      });
    } else {
      userSessionStore.set({ user: null, expires: null });
    }
  }

  if (typeof window !== 'undefined') {
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