<script lang="ts">
  import { invalidate } from '$app/navigation';
  import type { PageData } from './$types'; // Import PageData
  export let data: PageData; // Change from form to data

  let message = '';

  async function seed() {
    const res = await fetch('/admin/seed-user', { method: 'POST' }); // POST to the +server.ts endpoint
    const data = await res.json();
    message = data.message;
    await invalidate('admin:seed-user'); // Invalidate data to re-fetch users
  }
</script>

<h1>Admin Seeder</h1>
<button on:click={seed}>Seed Users</button>
{#if message}<p>{message}</p>{/if}

<h2>Existing Users</h2>
<ul>
  {#each data.users as u}<li>{u.email} – {u.role}</li>{/each}
</ul>

<style>
  /* Add any specific styles for this page here */
  h1 {
    color: #333;
    margin-bottom: 20px;
  }

  button {
    background-color: #007bff;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
  }

  button:hover {
    background-color: #0056b3;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin-top: 20px;
  }

  li {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    padding: 10px;
    margin-bottom: 5px;
    border-radius: 4px;
  }

  p {
    margin-top: 10px;
    font-weight: bold;
  }
</style>