<script lang="ts">
  import { goto } from '$app/navigation';
  import SearchBar from '$lib/components/+SearchBar.svelte';

  export let user: any | undefined;
  export let title: string = 'WardenNet';

  // Svelte action for SPA navigation
  function navigate(node: HTMLAnchorElement) {
    node.addEventListener('click', (e) => {
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.button === 0) {
        e.preventDefault();
        const href = node.getAttribute('href');
        if (href) {
          goto(href);
        }
      }
    });
    return {
      destroy() {
        node.removeEventListener('click', () => {});
      }
    };
  }
</script>

<nav class="w-full bg-base-100 shadow flex items-center justify-between px-4 py-2">
  <div class="flex items-center gap-4">
    <a class="text-xl font-bold text-primary" href="/">{title}</a>
    <ul class="hidden md:flex gap-4 text-base font-medium">
      <li><a class="hover:text-primary" href="/dashboard" use:navigate>Dashboard</a></li>
      <li><a class="hover:text-primary" href="/cases" use:navigate>Cases</a></li>
      <li><a class="hover:text-primary" href="/criminals" use:navigate>Criminals</a></li>
      <li><a class="hover:text-primary" href="/statutes" use:navigate>Statutes</a></li>
    </ul>
  </div>
  <div class="flex items-center gap-2">
    <SearchBar />
    {#if user}
      <div class="relative group">
        <button class="flex items-center gap-2 px-3 py-1 rounded hover:bg-base-200 focus:outline-none">
          {#if user.image}
            <img src={user.image} alt="Profile" class="rounded-full w-8 h-8 object-cover" />
          {:else}
            <div class="rounded-full bg-primary text-white flex items-center justify-center w-8 h-8 text-lg">
              {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
          {/if}
          <span class="hidden md:inline">{user.name || user.email}</span>
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div class="absolute right-0 mt-2 w-40 bg-base-100 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50">
          <a href="/profile" class="block px-4 py-2 hover:bg-base-200" use:navigate>Profile</a>
          <hr class="my-1 border-base-200" />
          <form action="/logout" method="POST">
            <button type="submit" class="block w-full text-left px-4 py-2 hover:bg-base-200">Logout</button>
          </form>
        </div>
      </div>
    {:else}
      <a href="/login" class="btn btn-outline-primary" use:navigate>Sign In</a>
      <a href="/register" class="btn btn-outline-success" use:navigate>Register</a>
    {/if}
  </div>
</nav>

<main class="container-fluid py-4">
  <slot />
</main>

{#if user}
  <div>Welcome, {user.name}</div>
{/if}
