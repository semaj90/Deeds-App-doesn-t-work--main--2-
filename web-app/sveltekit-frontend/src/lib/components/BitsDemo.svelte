<script lang="ts">
  import { Dialog, Button, Select, AlertDialog } from 'bits-ui';
  import { fade } from 'svelte/transition';
  import { createToaster, melt } from '@melt-ui/svelte';
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  
  export let caseTypes = [
    { value: 'criminal', label: 'Criminal Cases' },
    { value: 'civil', label: 'Civil Cases' },
    { value: 'family', label: 'Family Law' },
    { value: 'corporate', label: 'Corporate Law' }
  ];
  
  interface ToastData {
    title?: string;
    description?: string;
    color: string;
  }
  
  let dialogOpen = false;
  let alertOpen = false;
  
  // Melt-UI Toast/Notification setup
  const {
    elements: { content, title, description, close },
    helpers: { addToast },
    states: { toasts },
    actions: { portal }
  } = createToaster<ToastData>();
  
  // Notification functions
  function showSuccessNotification() {
    addToast({
      data: {
        title: 'Case Created Successfully',
        description: 'Your new case has been created and is ready for evidence submission.',
        color: 'success',
      },
    });
  }
  
  function showWarningNotification() {
    addToast({
      data: {
        title: 'Practice Area Selected',
        description: 'Remember to review case requirements for this practice area.',
        color: 'warning',
      },
    });
  }
  
  function showErrorNotification() {
    addToast({
      data: {
        title: 'Case Deletion Failed',
        description: 'Unable to delete case. Please check your permissions and try again.',
        color: 'error',
      },
    });
  }
  
  function showInfoNotification() {
    addToast({
      data: {
        title: 'Dialog Opened',
        description: 'Case management options are now available.',
        color: 'info',
      },
    });
  }
</script>

<div class="bits-demo">
  <h2 class="text-2xl font-bold mb-4">Bits UI Components Demo</h2>
  
  <!-- Melt-UI Notification Demo Section -->
  <div class="notification-demo mb-6 p-4 border rounded-lg">
    <h3 class="text-lg font-semibold mb-3">Melt-UI Notifications Demo</h3>
    <div class="notification-buttons">
      <button class="btn btn-success" on:click={showSuccessNotification}>
        Success Notification
      </button>
      <button class="btn btn-warning" on:click={showWarningNotification}>
        Warning Notification
      </button>
      <button class="btn btn-danger" on:click={showErrorNotification}>
        Error Notification
      </button>
      <button class="btn btn-info" on:click={showInfoNotification}>
        Info Notification
      </button>
    </div>
  </div>
  
  <!-- Bits UI Button -->
  <Button.Root class="btn btn-primary mb-4" onclick={showSuccessNotification}>
    Create New Case
  </Button.Root>
  
  <!-- Bits UI Select -->
  <div class="mb-4">
    <label class="form-label" for="practice-area-select">Legal Practice Area</label>
    <Select.Root type="single" onValueChange={() => showWarningNotification()}>
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
  <Dialog.Root bind:open={dialogOpen} onOpenChange={(open) => { if (open) showInfoNotification(); }}>
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
          <AlertDialog.Action class="btn btn-danger" onclick={showErrorNotification}>
            Delete Permanently
          </AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>
  
  <div class="mt-4 p-3 border rounded">
    <p class="text-sm text-muted">
      <strong>Demo:</strong> Bits UI components provide accessible, unstyled components.
      Melt-UI notifications provide toast/alert functionality.
    </p>
  </div>
</div>

<!-- Melt-UI Toast/Notification Container -->
<div class="toast-container" use:portal>
  {#each $toasts as { id, data } (id)}
    <div
      class="toast toast-{(data as ToastData).color}"
      animate:flip={{ duration: 500 }}
      in:fly={{ duration: 150, x: '100%' }}
      out:fly={{ duration: 150, x: '100%' }}
      use:melt={$content(id)}
    >
      <div class="toast-header">
        {#if (data as ToastData).title}
          <div class="toast-title" use:melt={$title(id)}>
            {(data as ToastData).title}
          </div>
        {/if}
        <button class="toast-close" use:melt={$close(id)} aria-label="Close notification">
          ✕
        </button>
      </div>
      {#if (data as ToastData).description}
        <div class="toast-description" use:melt={$description(id)}>
          {(data as ToastData).description}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .bits-demo {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--spacing-lg);
  }
  
  /* Notification Demo Styles */
  .notification-demo {
    background-color: var(--color-surface);
    border-color: var(--color-border);
  }
  
  .notification-buttons {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }
  
  .btn {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: var(--font-size-sm);
  }
  
  .btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .btn-success {
    background-color: #10b981;
    color: white;
  }
  
  .btn-success:hover {
    background-color: #059669;
  }
  
  .btn-warning {
    background-color: #f59e0b;
    color: white;
  }
  
  .btn-warning:hover {
    background-color: #d97706;
  }
  
  .btn-danger {
    background-color: #ef4444;
    color: white;
  }
  
  .btn-danger:hover {
    background-color: #dc2626;
  }
  
  .btn-info {
    background-color: #3b82f6;
    color: white;
  }
  
  .btn-info:hover {
    background-color: #2563eb;
  }
  
  /* Toast/Notification Styles */
  .toast-container {
    position: fixed;
    top: var(--spacing-lg);
    right: var(--spacing-lg);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    max-width: 400px;
  }
  
  .toast {
    background-color: var(--color-background);
    border: 1px solid;
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-lg);
    min-width: 300px;
    position: relative;
  }
  
  .toast-success {
    border-color: #10b981;
    background-color: #ecfdf5;
  }
  
  .toast-warning {
    border-color: #f59e0b;
    background-color: #fffbeb;
  }
  
  .toast-error {
    border-color: #ef4444;
    background-color: #fef2f2;
  }
  
  .toast-info {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }
  
  .toast-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-xs);
  }
  
  .toast-title {
    font-weight: 600;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    margin-right: var(--spacing-sm);
  }
  
  .toast-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: 1.4;
  }
  
  .toast-close {
    background: none;
    border: none;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }
  
  .toast-close:hover {
    background-color: var(--color-surface);
    color: var(--color-text);
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
