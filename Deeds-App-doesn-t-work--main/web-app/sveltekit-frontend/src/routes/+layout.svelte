<script lang="ts">
  import { page } from '$app/stores';
  import Header from '$lib/components/+Header.svelte';
  import Sidebar from '$lib/components/+Sidebar.svelte';
  import { browser } from '$app/environment';
  import type { PageData } from './$types';
  import { userSessionStore } from '$lib/auth/userStore';
  import '$lib/components/app.css';

  export let data: PageData;

  $: user = data.user;

  $: if (browser && data.user !== undefined) {
    if (data.user) {
      userSessionStore.set({
        user: {
          id: data.user.id ?? '',
          name: data.user.name ?? '',
          email: data.user.email ?? '',
          image: data.user.image ?? undefined,
          username: data.user.username ?? '',
          role: data.user.role ?? '',
          bio: data.user.bio ?? '',
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

<div class="app-container">
  <Header {user} />
  <div class="main-content">
    {#if user}
      <Sidebar />
    {/if}
    <main class="container-fluid py-4">
      <slot />
    </main>
  </div>
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .main-content {
    display: flex;
    flex: 1;
  }

  main {
    flex: 1;
    padding: 2rem;
  }
</style>