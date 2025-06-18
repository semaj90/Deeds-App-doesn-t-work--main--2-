<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="hero min-h-screen bg-base-200">
  <div class="hero-content text-center">
    <div class="max-w-md">
      {#if $page.data.user}
        <h1 class="text-5xl font-bold">Goodbye, {$page.data.user.name || $page.data.user.email}!</h1>
        <p class="py-6">You have been successfully logged out.</p>
        <form action="/logout" method="POST">
          <button type="submit" class="btn btn-primary">Log Out</button>
        </form>
      {:else}
        <h1 class="text-5xl font-bold">Logged Out</h1>
        <p class="py-6">You are currently logged out.</p>
        <a href="/login" class="btn btn-primary">Log In</a>
      {/if}
    </div>
  </div>
</div>
