<script lang="ts">
  import { page } from '$app/stores';
</script>

{#if $page.data.user}
  <p>Welcome, {$page.data.user.name || $page.data.user.email} (ID: {$page.data.user.id})!</p>
  <form action="/logout" method="POST">
    <button type="submit">Log Out</button>
  </form>
{:else}
  <p><a href="/login">Log In</a></p>
{/if}
