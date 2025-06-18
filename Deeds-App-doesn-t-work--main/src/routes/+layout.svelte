<script lang="ts">
  import { page } from '$app/stores';
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