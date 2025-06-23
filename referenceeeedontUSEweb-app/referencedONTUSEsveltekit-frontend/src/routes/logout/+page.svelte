<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(async () => {
    try {
      // Call logout API endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Invalidate all data and redirect to home
        await invalidateAll();
        goto('/');
      } else {
        console.error('Logout failed');
        // Redirect anyway for security
        goto('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect anyway for security
      goto('/');
    }
  });
</script>

<svelte:head>
  <title>Logging out... - WardenNet</title>
</svelte:head>

<div class="max-w-md mx-auto p-6 text-center">
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title justify-center">Logging out...</h2>
      <p>Please wait while we log you out securely.</p>
      <div class="flex justify-center mt-4">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    </div>
  </div>
</div>
