<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  export let form; // This will hold the data from the form action

  let loading = false;
  let fromParam: string;

  $: {
    fromParam = $page.url.searchParams.get('from') || '/dashboard';
  }
</script>

<svelte:head>
  <title>Login - Prosecutor Case Management</title>
</svelte:head>

<div class="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-primary-content" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
        </svg>
      </div>
      <h2 class="text-3xl font-extrabold text-base-content">
        Prosecutor Case Management
      </h2>
      <p class="mt-2 text-sm text-base-content/70">
        Sign in to your account
      </p>
    </div>

    <form method="POST" use:enhance={() => {
      loading = true;
      return async ({ result, update }) => {
        loading = false;
        await update();
      };
    }} class="mt-8 space-y-6 bg-base-100 p-8 rounded-lg shadow-lg">

      {#if form?.error}
        <div role="alert" class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{form.error}</span>
        </div>
      {/if}

      {#if form?.message}
        <div role="alert" class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{form.message}</span>
        </div>
      {/if}

      <input type="hidden" name="callbackUrl" value={fromParam} />

      <div class="space-y-4">
        <div class="form-control">
          <label for="email" class="label">
            <span class="label-text">Email address</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="prosecutor@example.com"
            class="input input-bordered w-full"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-control">
          <label for="password" class="label">
            <span class="label-text">Password</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            class="input input-bordered w-full"
            required
            autocomplete="current-password"
          />
          <div class="label">
            <a href="/forgot-password" class="label-text-alt link link-hover">Forgot password?</a>
          </div>
        </div>
      </div>

      <div class="form-control mt-6">
        <button
          type="submit"
          disabled={loading}
          class="btn btn-primary btn-block"
        >
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
            Signing In...
          {:else}
            Sign In
          {/if}
        </button>
      </div>

      <div class="text-center">
        <p class="text-sm text-base-content/70">
          Don't have an account?
          <a href="/register" class="link link-primary font-medium">
            Register here
          </a>
        </p>
      </div>
    </form>
  </div>
</div>