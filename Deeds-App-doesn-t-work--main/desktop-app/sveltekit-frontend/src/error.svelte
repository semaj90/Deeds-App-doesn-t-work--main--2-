<script>
  export let error;
  export let status;
</script>

<div class="container mt-5">
  <h1 class="text-danger">Error {status}</h1>
  <p>{error?.message || 'An unexpected error occurred.'}</p>
  <a href="/" class="btn btn-primary mt-3">Go Home</a>
</div>

{#if error}
  <div class="alert alert-danger">{error}</div>
{/if}