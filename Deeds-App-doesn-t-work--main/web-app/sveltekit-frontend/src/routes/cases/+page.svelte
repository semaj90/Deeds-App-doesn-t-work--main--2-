<script lang="ts">
  import type { PageData } from './$types';
  import type { Case, CasesPageData } from './types';
  import AdvancedCaseList from '$lib/components/AdvancedCaseList.svelte';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  export let data: CasesPageData;

  onMount(async () => {
    // Any initialization logic for the enhanced case list
    console.log('Advanced case list loaded with', data.cases.length, 'cases');
  });

  function createNewCase() {
    goto('/cases/new');
  }
</script>

<svelte:head>
  <title>Cases - WardenNet</title>
</svelte:head>

<div class="container">
  <div class="page-header">
    <h1 class="page-title">Case Management</h1>
    <p class="page-description">Manage your legal cases, track progress, and organize evidence</p>
    
    <button 
      class="btn btn-success"
      on:click={createNewCase}
      type="button"
    >
      + Create New Case
    </button>
  </div>

  <AdvancedCaseList {data} />
</div>


