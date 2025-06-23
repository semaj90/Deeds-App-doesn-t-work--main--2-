<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  let user = $page.data?.user;
  
  // If no user, redirect to login
  if (!user) {
    goto('/login');
  }
</script>

<svelte:head>
  <title>Profile - WardenNet</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">User Profile</h1>
  
  {#if user}
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Profile Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label class="label">
              <span class="label-text">Email</span>
            </label>
            <input 
              type="email" 
              class="input input-bordered w-full" 
              value={user.email || ''} 
              readonly 
            />
          </div>
          
          <div>
            <label class="label">
              <span class="label-text">Name</span>
            </label>
            <input 
              type="text" 
              class="input input-bordered w-full" 
              value={user.name || ''} 
              readonly 
            />
          </div>
          
          <div>
            <label class="label">
              <span class="label-text">Role</span>
            </label>
            <input 
              type="text" 
              class="input input-bordered w-full" 
              value={user.role || 'User'} 
              readonly 
            />
          </div>
          
          <div>
            <label class="label">
              <span class="label-text">Member Since</span>
            </label>
            <input 
              type="text" 
              class="input input-bordered w-full" 
              value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'} 
              readonly 
            />
          </div>
        </div>
        
        <div class="card-actions justify-end mt-6">
          <button class="btn btn-primary" onclick="alert('Profile editing coming soon!')">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="alert alert-warning">
      <span>Please log in to view your profile.</span>
    </div>
  {/if}
</div>
