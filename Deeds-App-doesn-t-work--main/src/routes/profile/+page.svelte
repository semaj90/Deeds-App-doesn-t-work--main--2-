<script lang="ts">
  import { page } from '$app/stores';
  import { invalidate } from '$app/navigation';
  let user = $page.data.session?.user;
  let editing = false;
  let bio = user?.profile?.bio || '';
  let saveStatus = '';

  let user = $page.data?.user;
  
  // If no user, redirect to login
  if (!user) {
    goto('/login');
  }
</script>


  async function saveProfile() {
    saveStatus = 'Saving...';
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio })
    });
    if (res.ok) {
      saveStatus = 'Saved!';
      editing = false;
      await invalidate(); // SSR reload
    } else {
      saveStatus = 'Error saving profile';
    }
  }
</script>

<svelte:head>
  <title>User Profile</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="card bg-base-100 shadow-xl max-w-xl mx-auto">
    <div class="card-body flex flex-col items-center gap-4">
      {#if user?.image}
        <div class="avatar">
          <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img src={user.image} alt="Profile" />
          </div>
        </div>
      {:else}
        <div class="avatar placeholder">
          <div class="w-24 rounded-full bg-neutral text-neutral-content">
            <span class="text-3xl">{user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : '?'}</span>
          </div>
        </div>
      {/if}
      <h2 class="text-2xl font-bold">{user?.name || 'No Name'}</h2>
      <p class="text-base-content/70">{user?.email}</p>
      <div class="divider w-full"></div>
      <div class="w-full">
        <h3 class="font-semibold mb-2">Account Details</h3>
        <ul class="list-disc pl-6 space-y-1">
          <li><b>Username:</b> {user?.username || '-'}</li>
          <li><b>Role:</b> {user?.role || '-'}</li>
        </ul>
      </div>
      <div class="divider w-full"></div>
      <div class="w-full">
        <h3 class="font-semibold mb-2">Profile Bio</h3>
        {#if editing}
          <textarea class="textarea textarea-bordered w-full" bind:value={bio} rows="4"></textarea>
          <div class="mt-2 flex gap-2">
            <button class="btn btn-primary btn-sm" on:click={saveProfile}>Save</button>
            <button class="btn btn-ghost btn-sm" on:click={() => { editing = false; bio = user?.profile?.bio || ''; }}>Cancel</button>
          </div>
          {#if saveStatus}
            <div class="mt-2 text-sm {saveStatus.startsWith('Error') ? 'text-error' : 'text-success'}">{saveStatus}</div>
          {/if}
        {:else}
          {#if user?.profile?.bio}
            <div class="mb-2 text-base-content">{user.profile.bio}</div>
          {:else}
            <div class="mb-2 text-base-content/50">No bio set.</div>
          {/if}
          <button class="btn btn-outline btn-sm" on:click={() => editing = true}>Edit Bio</button>
        {/if}
      </div>
    </div>
  </div>
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