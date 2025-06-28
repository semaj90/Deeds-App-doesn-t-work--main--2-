<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Dropdown from '$lib/components/+Dropdown.svelte';
  import Checkbox from '$lib/components/+Checkbox.svelte';

  const dispatch = createEventDispatcher();

  let selectedAutomationType: string = '';
  let selectedSource: string = '';
  let enableAutoProcessing: boolean = false;

  const handleSubmit = async () => {
    // In a real application, you would send this data to your backend API
    // For now, we'll just log it and dispatch an event.
    console.log('Automate Upload Data:', {
      selectedAutomationType,
      selectedSource,
      enableAutoProcessing,
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    alert('Automation settings saved!');
    dispatch('automationSuccess');

    // Reset form
    selectedAutomationType = '';
    selectedSource = '';
    enableAutoProcessing = false;
  };

  // Dummy data for dropdowns - replace with actual data fetched from API
  const automationTypeOptions = [
    { value: 'folder_watch', label: 'Folder Watch' },
    { value: 'email_attachment', label: 'Email Attachment' },
    { value: 'api_integration', label: 'API Integration' },
  ];

  const sourceOptions = [
    { value: 'source1', label: 'Shared Drive A' },
    { value: 'source2', label: 'Outlook Inbox' },
    { value: 'source3', label: 'External API' },
  ];
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title">Automate Upload</h3>
  </div>
  <div class="card-body">
    <div class="form-group">
      <label for="automationTypeSelect" class="form-label">Automation Type:</label>
      <Dropdown id="automationTypeSelect" bind:selected={selectedAutomationType} options={automationTypeOptions} />
    </div>
    <div class="form-group">
      <label for="sourceSelect" class="form-label">Source:</label>
      <Dropdown id="sourceSelect" bind:selected={selectedSource} options={sourceOptions} />
    </div>
    <div class="form-group form-check">
      <Checkbox id="autoProcessCheckbox" bind:checked={enableAutoProcessing} label="Enable Auto-Processing" />
    </div>
    <button class="btn btn-primary" on:click={handleSubmit}>Save Automation</button>
  </div>
</div>

