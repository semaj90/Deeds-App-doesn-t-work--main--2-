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
</script>

<AdvancedCaseList {data} />
