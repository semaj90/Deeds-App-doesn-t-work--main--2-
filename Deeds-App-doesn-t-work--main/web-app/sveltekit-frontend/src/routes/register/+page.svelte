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

<div class="min-h-screen bg-gradient-to-br from-secondary/20 via-base-200 to-primary/20">
  <div class="hero min-h-screen">
    <div class="hero-content flex-col lg:flex-row w-full max-w-6xl">
      <div class="text-center lg:text-left lg:w-1/2">
        <div class="flex items-center justify-center lg:justify-start mb-6">
          <div class="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mr-4">
            <svg class="w-6 h-6 text-secondary-content" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-4xl lg:text-6xl font-bold text-secondary">Join WardenNet</h1>
            <p class="text-lg text-base-content/70">Start Your Journey</p>
          </div>
        </div>
        <p class="text-lg leading-relaxed text-base-content/80 mb-6">
          Create your WardenNet account to access powerful case management tools,
          evidence tracking, and streamlined prosecution workflows designed for modern legal professionals.
        </p>

        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <div class="w-6 h-6 bg-success rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-success-content" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-base-content/80">Complete case management system</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-6 h-6 bg-success rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-success-content" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-base-content/80">Secure evidence handling</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-6 h-6 bg-success rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-success-content" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-base-content/80">Advanced analytics & reporting</span>
          </div>
        </div>
      </div>

      <div class="card shrink-0 w-full max-w-md shadow-2xl bg-base-100 lg:w-1/2">
        <div class="card-body">
          <h2 class="card-title text-2xl font-bold text-center justify-center mb-6">
            Create Your Account
          </h2>

          <form method="POST" use:enhance={(({ formElement, formData, action, cancel, submitter }) => {
            loading = true;
            return async ({ result, update }) => {
              loading = false;
              await update();
            };
          })} class="space-y-4">

            {#if form?.error}
              <div role="alert" class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{form.error}</span>
              </div>
            {/if}

            <div class="form-control">
              <label class="label" for="name">
                <span class="label-text font-medium">Full Name</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-base-content/40" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  class="input input-bordered w-full pl-10"
                  required
                  autocomplete="name"
                  aria-required="true"
                />
              </div>
            </div>

            <div class="form-control">
              <label class="label" for="email">
                <span class="label-text font-medium">Email Address</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-base-content/40" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="prosecutor@example.com"
                  class="input input-bordered w-full pl-10"
                  required
                  autocomplete="email"
                  aria-required="true"
                />
              </div>
            </div>

            <div class="form-control">
              <label class="label" for="password">
                <span class="label-text font-medium">Password</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-base-content/40" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  bind:value={password}
                  placeholder="••••••••"
                  class="input input-bordered w-full pl-10"
                  required
                  autocomplete="new-password"
                  minlength="8"
                  aria-required="true"
                />
              </div>
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
                <span class="label-text-alt text-base-content/60">
                  Must be at least 8 characters with mixed case, numbers & symbols
                </span>
              </div>
            </div>

            <div class="form-control">
              <label class="label" for="confirmPassword">
                <span class="label-text font-medium">Confirm Password</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-base-content/40" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  class="input input-bordered w-full pl-10"
                  required
                  autocomplete="new-password"
                  aria-required="true"
                />
              </div>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer" for="agreeToTerms">
                <input type="checkbox" id="agreeToTerms" name="agreeToTerms" class="checkbox checkbox-primary" required aria-required="true" />
                <span class="label-text">
                  I agree to the
                  <a href="/terms" class="link link-primary">Terms of Service</a>
                  and
                  <a href="/privacy" class="link link-primary">Privacy Policy</a>
                </span>
              </label>
            </div>

            <div class="form-control mt-8">
              <button type="submit" class="btn btn-secondary btn-lg" class:loading disabled={loading}>
                {#if loading}
                  <span class="loading loading-spinner loading-sm"></span>
                  Creating Account...
                {:else}
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 616-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                  </svg>
                  Create Account
                {/if}
              </button>
            </div>

            <div class="divider">or</div>

            <div class="text-center">
              <p class="text-base-content/70">
                Already have an account?
                <a href="/login" class="link link-primary font-medium">
                  Sign in here
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
