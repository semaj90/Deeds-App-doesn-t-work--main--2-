<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import type { ActionData } from './$types';
  import Form from '$lib/components/ui/Form.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { notifications } from '$lib/stores/notification';
  import { createFormStore } from '$lib/stores/form';

  export let form: ActionData;

  let isSubmitting = false;

  // Enhanced form with client-side validation
  const formOptions = {
    initialValues: {
      title: '',
      description: '',
      dangerScore: 0,
      status: 'open',
      aiSummary: ''
    },
    validators: {
      title: (value: string) => {
        if (!value || value.trim().length < 3) {
          return 'Title must be at least 3 characters long';
        }
        if (value.length > 100) {
          return 'Title must be less than 100 characters';
        }
        return null;
      },
      description: (value: string) => {
        if (!value || value.trim().length < 10) {
          return 'Description must be at least 10 characters long';
        }
        return null;
      },
      dangerScore: (value: number) => {
        if (value < 0 || value > 10) {
          return 'Danger score must be between 0 and 10';
        }
        return null;
      }
    },
    requiredFields: ['title', 'description']
  };

  // Show server-side form errors as notifications
  $: if (form?.error) {
    notifications.error('Form Error', form.error);
  }

  function handleFormSubmit(event: CustomEvent) {
    // Client-side validation passed, now enhance the form submission
    console.log('Client-side validation passed:', event.detail.values);
  }
</script>

<svelte:head>
  <title>Create New Case - WardenNet</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
  <div class="container mx-auto px-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create New Case</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">Build a comprehensive case file with evidence and documentation</p>
    </div>

    <!-- Enhanced Form with our new components -->
    <div class="max-w-4xl mx-auto">
      <Card variant="elevated" padding="lg">
        <!-- Traditional SSR form with enhanced UX -->
        <form 
          method="post" 
          action="?/create"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
            };
          }}
          class="space-y-8"
        >
          <!-- Basic Information Section -->
          <div class="space-y-6">
            <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">
                1
              </div>
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Basic Information
              </h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="md:col-span-2">
                <Input
                  label="Case Title"
                  name="title"
                  placeholder="Enter a descriptive title for the case"
                  required
                  icon="briefcase"
                  clearable
                  hint="Provide a clear, concise title that summarizes the case"
                />
              </div>

              <div class="md:col-span-2">
                <label for="case-new-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="case-new-description"
                  name="description"
                  class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  rows="4"
                  placeholder="Provide a detailed description of the case, including key facts and circumstances"
                  required
                ></textarea>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Include relevant details that will help team members understand the case context
                </p>
              </div>

              <div>
                <label for="case-new-danger-score" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Danger Score
                </label>
                <div class="relative">
                  <input
                    id="case-new-danger-score"
                    type="range"
                    name="dangerScore"
                    min="0"
                    max="10"
                    value="0"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0 - Low</span>
                    <span>5 - Medium</span>
                    <span>10 - High</span>
                  </div>
                </div>
              </div>

              <div>
                <label for="case-new-status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Status
                </label>
                <select
                  id="case-new-status"
                  name="status"
                  class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="open">🟢 Open</option>
                  <option value="investigating">🔍 Investigating</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="closed">❌ Closed</option>
                </select>
              </div>
            </div>
          </div>

          <!-- AI Summary Section -->
          <div class="space-y-4">
            <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-medium">
                2
              </div>
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                AI Analysis (Optional)
              </h2>
            </div>

            <div>
              <label for="case-new-ai-summary" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Summary
              </label>
              <textarea
                id="case-new-ai-summary"
                name="aiSummary"
                class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                rows="3"
                placeholder="Let AI analyze and summarize the case details..."
              ></textarea>
              <div class="mt-2 flex gap-2">
                <Button type="button" variant="outline" size="sm" icon="sparkles">
                  Generate AI Summary
                </Button>
                <Button type="button" variant="ghost" size="sm" icon="refresh">
                  Regenerate
                </Button>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              <p>💡 Tip: All fields can be edited after case creation</p>
            </div>
            
            <div class="flex gap-3">
              <Button type="button" variant="ghost" href="/cases">
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                loading={isSubmitting}
                icon="plus"
              >
                Create Case
              </Button>
            </div>
          </div>

          <!-- Error Display -->
          {#if form?.error}
            <div class="rounded-md bg-red-50 dark:bg-red-900/10 p-4 border border-red-200 dark:border-red-800">
              <div class="flex">
                <iconify-icon icon="ph:warning-circle" class="w-5 h-5 text-red-400 flex-shrink-0"></iconify-icon>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                    Error Creating Case
                  </h3>
                  <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                    {form.error}
                  </p>
                </div>
              </div>
            </div>
          {/if}
        </form>
      </Card>
    </div>
  </div>
</div>

