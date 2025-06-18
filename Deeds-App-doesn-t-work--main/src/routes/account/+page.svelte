<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let user = $page.data.session?.user;

  onMount(() => {
    if (!user) {
      goto('/login');
    }
  });
</script>

<div class="container mt-5">
  {#if user}
    <div class="card">
      <div class="card-header text-center">
        <h2>Welcome, {user.name || user.email}!</h2>
      </div>
      <div class="card-body">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p>This is your prosecutor account page. From here, you can manage cases, criminals, and evidence.</p>
      </div>
    </div>
  {:else}
    <p>Redirecting to login...</p>
  {/if}
</div>

<style>
.container {
  max-width: 600px;
}
</style>
