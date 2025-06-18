<script lang="ts">
  import { page } from '$app/stores';
  
  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  const handleSubmit = async () => {
    loading = true;
    error = '';
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const callbackUrl = $page.url.searchParams.get('from') || '/dashboard';
      const response = await fetch(`/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(callbackUrl)}`, {
        method: 'POST',
        body: formData
      });
      
      if (response.redirected) {
        window.location.href = response.url;
      } else if (!response.ok) {
        const data = await response.json();
        error = data.error || 'Login failed';
      }
    } catch (e) {
      error = 'Network error occurred';
    } finally {
      loading = false;
    }
  };
</script>

<svelte:head>
  <title>Login - Prosecutor Case Management</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-500/20 via-gray-50 to-indigo-500/20">
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
          </svg>
        </div>
        <h2 class="text-3xl font-extrabold text-gray-900">
          Prosecutor Case Management
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Sign in to your account
        </p>
      </div>
      
      <form class="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg" on:submit|preventDefault={handleSubmit}>
        {#if error}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        {/if}
        
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              bind:value={email}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              bind:value={password}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        
        <div class="text-center">
          <a href="/register" class="text-indigo-600 hover:text-indigo-500 text-sm">
            Need an account? Register here
          </a>
        </div>
      </form>
    </div>
  </div>
</div>
        <p class="text-lg leading-relaxed text-base-content/80">
          Welcome back to WardenNet, your comprehensive case management platform. 
          Access your cases, manage evidence, and streamline your prosecution workflow.
        </p>
        <div class="stats shadow mt-6 hidden lg:inline-grid">
          <div class="stat">
            <div class="stat-figure text-primary">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="stat-title">Secure</div>
            <div class="stat-value text-primary">100%</div>
            <div class="stat-desc">Data Protection</div>
          </div>
          <div class="stat">
            <div class="stat-figure text-secondary">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
            <div class="stat-title">Users</div>
            <div class="stat-value text-secondary">1K+</div>
            <div class="stat-desc">Active Prosecutors</div>
          </div>
        </div>
      </div>      
      <div class="card shrink-0 w-full max-w-md shadow-2xl bg-base-100 lg:w-1/2">
        <div class="card-body">
          <h2 class="card-title text-2xl font-bold text-center justify-center mb-6">
            Sign In to Your Account
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
            
            {#if form?.message}
              <div role="alert" class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{form.message}</span>
              </div>
            {/if}

            <input type="hidden" name="callbackUrl" value={fromParam} />
            
            <div class="form-control">
              <label class="label" for="email">
                <span class="label-text font-medium">Email Address</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-base-content/40" fill="currentColor" viewBox="0 0 20 20">
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
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  class="input input-bordered w-full pl-10"
                  required
                  autocomplete="current-password"
                />
              </div>
              <div class="label justify-end">
                <a href="/forgot-password" class="label-text-alt link link-hover text-primary">
                  Forgot password?
                </a>
              </div>
            </div>
            
            <div class="form-control mt-8">
              <button type="submit" class="btn btn-primary btn-lg" class:loading disabled={loading}>
                {#if loading}
                  <span class="loading loading-spinner loading-sm"></span>
                  Signing In...
                {:else}
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  Sign In
                {/if}
              </button>
            </div>
            
            <div class="divider">or</div>
            
            <div class="text-center">
              <p class="text-base-content/70">
                Don't have an account? 
                <a href="/register" class="link link-primary font-medium">
                  Create one here
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>