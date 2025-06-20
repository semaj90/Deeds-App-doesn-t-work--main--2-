<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  let user = $page.data.session?.user;
</script>

<nav class="navbar bg-base-100 shadow flex items-center justify-between px-4 py-2">
  <div class="flex items-center gap-4">
    <a href="/" class="font-bold text-lg">WardenNet</a>
    <a href="/cases">Cases</a>
    <a href="/persons">Persons</a>
    <a href="/evidence">Evidence</a>
    <a href="/laws">Laws</a>
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
</nav>
<main class="container mx-auto py-6">
  <slot />
</main>
