<script lang="ts">
  import { Dialog, Button, Select, AlertDialog } from 'bits-ui';
  import { fade } from 'svelte/transition';
  
  export let caseTypes = [
    { value: 'criminal', label: 'Criminal Cases' },
    { value: 'civil', label: 'Civil Cases' },
    { value: 'family', label: 'Family Law' },
    { value: 'corporate', label: 'Corporate Law' }
  ];
  
  let dialogOpen = false;
  let alertOpen = false;
</script>

<div class="bits-demo">
  <h2 class="text-2xl font-bold mb-4">Bits UI Components Demo</h2>
  
  <!-- Bits UI Button -->
  <Button.Root class="btn btn-primary mb-4">
    Create New Case
  </Button.Root>
  
  <!-- Bits UI Select -->
  <div class="mb-4">
    <label class="form-label" for="practice-area-select">Legal Practice Area</label>
    <Select.Root type="single">
      <Select.Trigger class="form-select" id="practice-area-select">
        Select practice area...
      </Select.Trigger>
      <Select.Portal>
        <Select.Content class="select-content">
          {#each caseTypes as type}
            <Select.Item value={type.value} class="select-item">
              {type.label}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </div>
  
  <!-- Bits UI Dialog -->
  <Dialog.Root bind:open={dialogOpen}>
    <Dialog.Trigger class="btn btn-secondary mb-4">
      Case Management Options
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay class="dialog-overlay" />
      <Dialog.Content class="dialog-content">
        <Dialog.Title class="dialog-title">
          Case Management System
        </Dialog.Title>
        <Dialog.Description class="dialog-description">
          Manage your legal cases with our comprehensive case management system. 
          Track evidence, deadlines, and case progress all in one place.
        </Dialog.Description>
        
        <div class="case-options">
          <div class="case-option">
            <h4>Evidence Management</h4>
            <p>Upload, organize and analyze case evidence</p>
          </div>
          <div class="case-option">
            <h4>Timeline Tracking</h4>
            <p>Keep track of important dates and deadlines</p>
          </div>
          <div class="case-option">
            <h4>AI Analysis</h4>
            <p>Get AI-powered insights on your cases</p>
          </div>
        </div>
        
        <div class="dialog-actions">
          <Dialog.Close class="btn btn-secondary">
            Close
          </Dialog.Close>
          <Button.Root class="btn btn-primary">
            Get Started
          </Button.Root>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
  
  <!-- Bits UI Alert Dialog -->
  <AlertDialog.Root bind:open={alertOpen}>
    <AlertDialog.Trigger class="btn btn-danger">
      Delete Case
    </AlertDialog.Trigger>
    <AlertDialog.Portal>
      <AlertDialog.Overlay class="dialog-overlay" />
      <AlertDialog.Content class="dialog-content">
        <AlertDialog.Title class="dialog-title text-danger">
          Delete Case Confirmation
        </AlertDialog.Title>
        <AlertDialog.Description class="dialog-description">
          Are you sure you want to delete this case? This action cannot be undone and will permanently remove all case data, evidence, and related documents.
        </AlertDialog.Description>
        
        <div class="alert-actions">
          <AlertDialog.Cancel class="btn btn-secondary">
            Cancel
          </AlertDialog.Cancel>
          <AlertDialog.Action class="btn btn-danger">
            Delete Permanently
          </AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>
  
  <div class="mt-4 p-3 border rounded">
    <p class="text-sm text-muted">
      <strong>Demo:</strong> Bits UI components provide accessible, unstyled components
    </p>
  </div>
</div>

<style>
  .bits-demo {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--spacing-lg);
  }
  
  :global(.select-content) {
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-xs);
    z-index: 50;
    max-height: 200px;
    overflow-y: auto;
  }
  
  :global(.select-item) {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background-color var(--transition-fast);
    display: block;
    width: 100%;
    text-align: left;
  }
  
  :global(.select-item:hover),
  :global(.select-item[data-highlighted]) {
    background-color: var(--color-surface);
  }
  
  :global(.dialog-overlay) {
    position: fixed;
    inset: 0;
    z-index: 50;
    background-color: rgb(0 0 0 / 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
  }
  
  :global(.dialog-content) {
    background-color: var(--color-background);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-xl);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }
  
  :global(.dialog-title) {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin-bottom: var(--spacing-md);
    color: var(--color-text);
  }
  
  :global(.dialog-description) {
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-lg);
    line-height: 1.6;
  }
  
  .case-options {
    margin-bottom: var(--spacing-lg);
  }
  
  .case-option {
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-sm);
    transition: all var(--transition-fast);
  }
  
  .case-option:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }
  
  .case-option h4 {
    margin: 0 0 var(--spacing-xs) 0;
    font-weight: 600;
    color: var(--color-text);
  }
  
  .case-option p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .dialog-actions,
  .alert-actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
  }
  
  :global(.text-danger) {
    color: var(--color-danger);
  }
  
  .text-muted {
    color: var(--color-text-muted);
  }
  
  .border {
    border: 1px solid var(--color-border);
  }
  
  .rounded {
    border-radius: var(--radius-md);
  }
</style>
