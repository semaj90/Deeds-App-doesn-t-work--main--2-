<script lang="ts">
	import Form from '$lib/components/ui/Form.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { notifications } from '$lib/stores/notification';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	export let data;

	// Form validation
	const formOptions = {
		initialValues: {
			title: '',
			description: '',
			priority: 'medium',
			assignedTo: '',
			dueDate: '',
			tags: ''
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
			priority: (value: string) => {
				if (!['low', 'medium', 'high', 'urgent'].includes(value)) {
					return 'Please select a valid priority level';
				}
				return null;
			},
			dueDate: (value: string) => {
				if (value && new Date(value) < new Date()) {
					return 'Due date cannot be in the past';
				}
				return null;
			}
		},
		requiredFields: ['title', 'description', 'priority']
	};

	let formApi: any;
	let isSubmitting = false;

	// Store form state
	let formValues: Record<string, any> = {};
	let formErrors: Record<string, string> = {};
	let isFormValid = false;
	let isFormDirty = false;

	// Handle form changes
	function handleFormChange(event: CustomEvent) {
		const { values } = event.detail;
		formValues = values;
		// Auto-save draft or other real-time updates
		console.log('Form values changed:', values);
	}

	// Update form state when formApi is available
	$: if (formApi) {
		// You can access formApi methods here if needed
	}

	async function handleSubmit(event: CustomEvent) {
		const { values, isValid } = event.detail;
		
		if (!isValid) {
			return;
		}

		isSubmitting = true;

		try {
			// You can either use the form action or API endpoint
			const response = await fetch('/api/cases', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(values)
			});

			if (response.ok) {
				const newCase = await response.json();
				notifications.success(
					'Case created successfully',
					`Case "${values.title}" has been created with ID ${newCase.id}`
				);
				goto(`/cases/${newCase.id}`);
			} else {
				const error = await response.json();
				notifications.error(
					'Failed to create case',
					error.message || 'Please try again later'
				);
			}
		} catch (error) {
			console.error('Case creation error:', error);
			notifications.error(
				'Network error',
				'Unable to create case. Please check your connection and try again.'
			);
		} finally {
			isSubmitting = false;
		}
	}

	function addTag() {
		const currentTags = formApi.getValues().tags || '';
		formApi.setField('tags', currentTags + (currentTags ? ', ' : '') + 'New Tag');
	}

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey) {
			if (event.key === 's') {
				event.preventDefault();
				formApi?.submit();
			} else if (event.key === 'r') {
				event.preventDefault();
				formApi?.reset();
			}
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="max-w-4xl mx-auto p-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
			Create New Case
		</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-400">
			Fill out the form below to create a new legal case. All required fields must be completed.
		</p>
		<div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
			<p>💡 Tip: Use <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Ctrl+S</kbd> to save, <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Ctrl+R</kbd> to reset</p>
		</div>
	</div>

	<Card variant="elevated" padding="lg">
		<Form
			bind:formApi
			options={formOptions}
			on:submit={handleSubmit}
			on:change={handleFormChange}
			submitText="Create Case"
			submitVariant="primary"
			showResetButton={true}
			loading={isSubmitting}
			class="space-y-6"
		>
			<div slot="default" let:form let:formApi let:values let:errors let:isValid let:isDirty>
				<!-- Basic Information -->
				<div class="space-y-4">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
						Basic Information
					</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="md:col-span-2">
							<Input
								label="Case Title"
								placeholder="Enter a descriptive title for the case"
								required
								value={formValues.title || ''}
								error={formErrors.title}
								icon="briefcase"
								clearable
								on:input={(e) => formApi?.setField('title', (e.target as HTMLInputElement)?.value)}
								on:blur={() => formApi?.touchField('title')}
							/>
						</div>

						<div class="md:col-span-2">
							<label for="case-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Description <span class="text-red-500">*</span>
							</label>
							<textarea
								id="case-description"
								class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
								rows="4"
								placeholder="Provide a detailed description of the case"
								value={values.description || ''}
								class:border-red-300={errors.description}
								class:border-green-300={values.description && !errors.description}
								on:input={(e) => formApi.setField('description', (e.target as HTMLTextAreaElement)?.value)}
								on:blur={() => formApi.touchField('description')}
							></textarea>
							{#if errors.description}
								<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.description}
								</p>
							{/if}
						</div>

						<div>
							<label for="case-priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Priority <span class="text-red-500">*</span>
							</label>
							<select
								id="case-priority"
								class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								value={values.priority || 'medium'}
								on:change={(e) => formApi.setField('priority', (e.target as HTMLSelectElement)?.value)}
								on:blur={() => formApi.touchField('priority')}
							>
								<option value="low">🟢 Low</option>
								<option value="medium">🟡 Medium</option>
								<option value="high">🟠 High</option>
								<option value="urgent">🔴 Urgent</option>
							</select>
						</div>

						<div>
							<Input
								label="Due Date"
								type="date"
								value={values.dueDate || ''}
								error={errors.dueDate}
								icon="calendar"
								on:input={(e) => formApi.setField('dueDate', (e.target as HTMLInputElement)?.value)}
								on:blur={() => formApi.touchField('dueDate')}
							/>
						</div>
					</div>
				</div>

				<!-- Assignment -->
				<div class="space-y-4">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
						Assignment & Tags
					</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Input
								label="Assigned To"
								placeholder="Enter assignee email or name"
								value={values.assignedTo || ''}
								error={errors.assignedTo}
								icon="user"
								on:input={(e) => formApi.setField('assignedTo', (e.target as HTMLInputElement)?.value)}
								on:blur={() => formApi.touchField('assignedTo')}
							/>
						</div>

						<div>
							<div class="flex items-end gap-2">
								<div class="flex-1">								<Input
									label="Tags"
									placeholder="Enter tags separated by commas"
									value={values.tags || ''}
									error={errors.tags}
									icon="tag"
									clearable
									on:input={(e) => formApi.setField('tags', (e.target as HTMLInputElement)?.value)}
									on:blur={() => formApi.touchField('tags')}
									/>
								</div>
								<Button
									type="button"
									variant="outline"
									size="md"
									icon="plus"
									on:click={addTag}
								>
									Add
								</Button>
							</div>
						</div>
					</div>
				</div>

				<!-- Form Status -->
				<div class="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-700">
					<div class="text-sm text-gray-500 dark:text-gray-400">
						{#if isDirty}
							<span class="flex items-center gap-1">
								<div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
								Unsaved changes
							</span>
						{:else}
							<span class="flex items-center gap-1">
								<div class="w-2 h-2 bg-green-400 rounded-full"></div>
								All changes saved
							</span>
						{/if}
					</div>
					
					<div class="text-sm text-gray-500 dark:text-gray-400">
						Valid: {isValid ? '✅' : '❌'} | 
						Fields: {Object.keys(values).length} |
						Errors: {Object.keys(errors).length}
					</div>
				</div>
			</div>
		</Form>
	</Card>
</div>

<style>
	kbd {
		font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
		font-size: 0.75rem;
	}
</style>
