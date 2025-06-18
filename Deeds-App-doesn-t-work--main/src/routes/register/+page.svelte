<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;
  
  let loading = false;
  let passwordStrength = 0;
  let password = '';
  
  function checkPasswordStrength(pwd: string) {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return strength;
  }
  
  $: passwordStrength = checkPasswordStrength(password);
  $: strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength] || 'Very Weak';
  $: strengthColor = ['error', 'warning', 'info', 'success', 'success'][passwordStrength] || 'error';
</script>

<svelte:head>
  <title>WardenNet - Register</title>
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
        Create Account
      </h2>
      <p class="mt-2 text-sm text-base-content/70">
        Join the prosecutor case management system
      </p>
    </div>

    <form method="POST" use:enhance={(({ formElement, formData, action, cancel, submitter }) => {
      loading = true;
      return async ({ result, update }) => {
        loading = false;
        await update();
      };
    })} class="mt-8 space-y-6 bg-base-100 p-8 rounded-lg shadow-lg">

      {#if form?.error}
        <div role="alert" class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{form.error}</span>
        </div>
      {/if}

      {#if form?.success}
        <div role="alert" class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{form.success}</span>
        </div>
      {/if}

      <div class="space-y-4">
        <div class="form-control">
          <label class="label" for="name">
            <span class="label-text">Full Name</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="John Doe"
            class="input input-bordered w-full"
            required
            autocomplete="name"
          />
        </div>

        <div class="form-control">
          <label class="label" for="email">
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
          <label class="label" for="password">
            <span class="label-text">Password</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            bind:value={password}
            placeholder="••••••••"
            class="input input-bordered w-full"
            required
            autocomplete="new-password"
            minlength="8"
          />
          {#if password}
            <div class="mt-2">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm">Password Strength:</span>
                <span class="text-sm font-medium text-{strengthColor}">{strengthText}</span>
              </div>
              <progress class="progress progress-{strengthColor} w-full" value={passwordStrength} max="5"></progress>
            </div>
          {/if}
          <div class="label">
            <span class="label-text-alt">
              Must be at least 8 characters with mixed case, numbers & symbols
            </span>
          </div>
        </div>

        <div class="form-control">
          <label class="label" for="confirmPassword">
            <span class="label-text">Confirm Password</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="••••••••"
            class="input input-bordered w-full"
            required
            autocomplete="new-password"
          />
        </div>

        <div class="form-control">
          <label class="label cursor-pointer" for="agreeToTerms">
            <input type="checkbox" id="agreeToTerms" name="agreeToTerms" class="checkbox checkbox-primary" required />
            <span class="label-text">
              I agree to the
              <a href="/terms" class="link link-primary">Terms of Service</a>
              and
              <a href="/privacy" class="link link-primary">Privacy Policy</a>
            </span>
          </label>
        </div>
      </div>

      <div class="form-control mt-6">
        <button type="submit" class="btn btn-primary btn-block" class:loading disabled={loading}>
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
            Creating Account...
          {:else}
            Create Account
          {/if}
        </button>
      </div>

      <div class="divider">or</div>

      <div class="text-center">
        <p class="text-sm text-base-content/70">
          Already have an account?
          <a href="/login" class="link link-primary font-medium">
            Sign in here
          </a>
        </p>
      </div>
    </form>
  </div>
</div>