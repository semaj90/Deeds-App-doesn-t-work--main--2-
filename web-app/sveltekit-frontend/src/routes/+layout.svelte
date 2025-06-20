<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  let user = $page.data?.user;
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
<main class="container mx-auto px-4">
  <slot />
</main>
