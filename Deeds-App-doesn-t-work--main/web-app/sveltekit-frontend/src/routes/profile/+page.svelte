<script lang="ts">
  import { page } from '$app/stores';
  import { invalidate } from '$app/navigation';
  let user = $page.data.user;
  let editing = false;
  let bio = user?.bio || '';
  let saveStatus = '';

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
      await invalidate('user'); // SSR reload user
    } else {
      saveStatus = 'Error saving profile';
    }
  }
</script>

<svelte:head>
  <title>User Profile</title>
</svelte:head>

<div class="container mt-5 max-w-xl mx-auto bg-base-100 rounded-lg shadow p-6">
  <div class="flex flex-col items-center gap-4">
    {#if user?.image}
      <img src={user.image} alt="Profile" class="rounded-full border-2 border-primary" style="width:96px;height:96px;object-fit:cover;" />
    {:else}
      <div class="rounded-full bg-primary text-white flex items-center justify-center" style="width:96px;height:96px;font-size:2.5rem;">
        {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : '?'}
      </div>
    {/if}
    <h2 class="text-2xl font-bold">{user?.name || 'No Name'}</h2>
    <p class="text-base-content/70">{user?.email}</p>
    <div class="divider"></div>
    <div class="w-full">
      <h3 class="font-semibold mb-2">Account Details</h3>
      <ul class="list-disc pl-6">
        <li><b>Username:</b> {user?.username || '-'}</li>
        <li><b>Role:</b> {user?.role || '-'}</li>
      </ul>
    </div>
    <div class="divider"></div>
    <div class="w-full">
      <h3 class="font-semibold mb-2">Profile Bio</h3>
      {#if editing}
        <textarea class="textarea textarea-bordered w-full" bind:value={bio} rows="4"></textarea>
        <div class="mt-2 flex gap-2">
          <button class="btn btn-primary btn-sm" on:click={saveProfile}>Save</button>
          <button class="btn btn-ghost btn-sm" on:click={() => { editing = false; bio = user?.bio || ''; }}>Cancel</button>
        </div>
        {#if saveStatus}
          <div class="mt-2 text-sm">{saveStatus}</div>
        {/if}
      {:else}
        {#if user?.bio}
          <div class="mb-2">{user.bio}</div>
        {:else}
          <div class="mb-2"><span class="text-base-content/50">No bio set.</span></div>
        {/if}
        <button class="btn btn-outline btn-sm" on:click={() => editing = true}>Edit Bio</button>
      {/if}
    </div>
  </div>
</div>

<style>
.container {
  min-height: 60vh;
}
</style>
