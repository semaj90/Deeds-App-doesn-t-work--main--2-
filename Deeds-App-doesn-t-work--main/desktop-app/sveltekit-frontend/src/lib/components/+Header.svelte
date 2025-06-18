<script lang="ts">
  import { goto } from '$app/navigation';
  import SearchBar from '$lib/components/+SearchBar.svelte';

  export let user: any | undefined; // Made user prop optional
  export let title: string = 'WardenNet'; // Default title

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

<nav class="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
  <div class="container-fluid">
    <button
      class="btn btn-outline-primary me-2"
      type="button"
      data-bs-toggle="offcanvas"
      data-bs-target="#sidebarOffcanvas"
      aria-controls="sidebarOffcanvas"
      aria-label="Open sidebar menu"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <a class="navbar-brand" href="/">{title}</a>
    <div class="collapse navbar-collapse">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <!-- Existing navigation items -->
        <li class="nav-item"><a class="nav-link" href="/dashboard">Dashboard</a></li>
        <li class="nav-item"><a class="nav-link" href="/cases">Cases</a></li>
        <li class="nav-item"><a class="nav-link" href="/criminals">Criminals</a></li>
        <li class="nav-item"><a class="nav-link" href="/statutes">Statutes</a></li>
      </ul>
      <div class="d-flex align-items-center">
        <SearchBar />
        {#if user}
          <div class="dropdown ms-3">
            <button class="btn btn-secondary dropdown-toggle d-flex align-items-center gap-2" type="button" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              {#if user.image}
                <img src={user.image} alt="Profile" class="rounded-circle" style="width:32px;height:32px;object-fit:cover;" />
              {:else}
                <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width:32px;height:32px;font-size:1.1rem;">
                  {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
              {/if}
              <span>{user.name || user.email}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
              <li><a class="dropdown-item" href="/profile">Profile</a></li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <form action="/logout" method="POST">
                  <button type="submit" class="dropdown-item">Logout</button>
                </form>
              </li>
            </ul>
          </div>
        {:else}
          <a href="/login" class="btn btn-outline-primary me-2" use:navigate>Sign In</a>
          <a href="/register" class="btn btn-outline-success" use:navigate>Register</a>
        {/if}
      </div>
    </div>
  </div>
</nav>

<main class="container-fluid py-4">
  <slot />
</main>

{#if user}
  <div>Welcome, {user.name}</div>
{/if}
