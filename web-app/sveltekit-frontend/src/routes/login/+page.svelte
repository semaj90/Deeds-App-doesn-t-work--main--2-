<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';

  let loading = false;
  let email = '';
  let password = '';
  let errorMessage = '';
  
  // Check if user was redirected from registration
  $: showRegistrationSuccess = $page.url.searchParams.get('registered') === 'true';

  // Demo user credentials
  const demoUsers = [
    { email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { email: 'user@example.com', password: 'user123', role: 'user' }
  ];

  async function handleSubmit(event: Event) {
    event.preventDefault();
    loading = true;
    errorMessage = '';

    console.log('Attempting login with:', { email, password: '***' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Login response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Login successful:', result);
        // Redirect to dashboard or intended page
        const redirectTo = $page.url.searchParams.get('from') || '/dashboard';
        window.location.href = redirectTo;
      } else {
        const error = await response.json();
        console.error('Login failed:', error);
        errorMessage = error.error || error.message || 'Login failed';
      }
    } catch (error) {
      console.error('Network error:', error);
      errorMessage = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }

  function fillDemoCredentials(userType: 'admin' | 'user') {
    const demoUser = demoUsers.find(u => u.role === userType);
    if (demoUser) {
      email = demoUser.email;
      password = demoUser.password;
    }
  }
</script>

<svelte:head>
  <title>Legal Case Management - Login</title>
  <meta name="description" content="Sign in to your Legal Case Management account" />
</svelte:head>

<main class="container">
  <div class="auth-layout">
    <div class="auth-info">
      <div class="auth-header">
        <div class="brand-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/>
          </svg>
        </div>
        <div>
          <h1>Welcome Back</h1>
          <p class="auth-subtitle">Sign in to continue</p>
        </div>
      </div>
      
      <p class="auth-description">
        Access your legal case management dashboard, review ongoing cases, 
        and manage evidence with our secure and comprehensive platform.
      </p>
      
      <div class="demo-section">
        <h3>Demo Accounts</h3>
        <p>Try the application with these demo credentials:</p>
        <div class="demo-buttons">
          <button type="button" class="secondary" on:click={() => fillDemoCredentials('admin')}>
            Admin Demo
          </button>
          <button type="button" class="secondary" on:click={() => fillDemoCredentials('user')}>
            User Demo
          </button>
        </div>
      </div>
    </div>
    
    <div class="auth-form">
      <article>
        <header>
          <h2>Sign In</h2>
        </header>
        
        <form on:submit={handleSubmit}>
          {#if showRegistrationSuccess}
            <div class="success-alert" role="alert">
              <strong>Registration Successful!</strong> Your account has been created. Please sign in below.
            </div>
          {/if}
          
          {#if errorMessage}
            <div class="error-alert" role="alert">
              <strong>Error:</strong> {errorMessage}
            </div>
          {/if}

          <label for="email">
            Email Address
            <input
              type="email"
              id="email"
              name="email"
              bind:value={email}
              placeholder="prosecutor@example.com"
              required
              autocomplete="email"
              aria-required="true"
            />
          </label>
          
          <label for="password">
            Password
            <input
              type="password"
              id="password"
              name="password"
              bind:value={password}
              placeholder="••••••••"
              required
              autocomplete="current-password"
              aria-required="true"
            />
          </label>
          
          <button type="submit" class="contrast" disabled={loading} aria-busy={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <footer>
          <p>Don't have an account? <a href="/register">Create one here</a></p>
          <p><a href="/forgot-password">Forgot your password?</a></p>
        </footer>
      </article>
    </div>
  </div>
</main>

<style>
  .auth-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    min-height: 80vh;
    align-items: center;
    padding: 2rem 0;
  }
  
  .auth-info {
    padding: 2rem;
  }
  
  .auth-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .brand-icon {
    color: var(--pico-primary);
    flex-shrink: 0;
  }
  
  .auth-header h1 {
    font-size: 2.5rem;
    margin: 0;
    line-height: 1.2;
  }
  
  .auth-subtitle {
    color: var(--pico-muted-color);
    margin: 0;
    font-size: 1.1rem;
  }
  
  .auth-description {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
    color: var(--pico-muted-color);
  }
  
  .demo-section {
    background: var(--pico-card-background-color);
    padding: 1.5rem;
    border-radius: var(--pico-border-radius);
    border: 1px solid var(--pico-card-border-color);
  }
  
  .demo-section h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
  
  .demo-section p {
    margin-bottom: 1rem;
    color: var(--pico-muted-color);
  }
  
  .demo-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .demo-buttons button {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }
  
  .auth-form {
    padding: 1rem;
  }
  
  .auth-form article {
    margin: 0;
    max-width: 400px;
  }
  
  .auth-form h2 {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  
  .error-alert {
    padding: 1rem;
    margin-bottom: 1rem;
    background: var(--pico-del-background-color);
    border: 1px solid var(--pico-del-color);
    border-radius: var(--pico-border-radius);
    color: var(--pico-del-color);
  }
  
  .success-alert {
    padding: 1rem;
    margin-bottom: 1rem;
    background: var(--pico-ins-background-color);
    border: 1px solid var(--pico-ins-color);
    border-radius: var(--pico-border-radius);
    color: var(--pico-ins-color);
  }
  
  .auth-form footer {
    text-align: center;
  }
  
  .auth-form footer p {
    margin: 0.5rem 0;
  }
  
  @media (max-width: 768px) {
    .auth-layout {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    
    .auth-info {
      padding: 1rem;
      text-align: center;
    }
    
    .auth-header {
      justify-content: center;
    }
    
    .auth-header h1 {
      font-size: 2rem;
    }
  }
</style>
