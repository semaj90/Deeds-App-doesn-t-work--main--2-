<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { createFormStore, type FormOptions } from '$lib/stores/form';
	import { notifications } from '$lib/stores/notification';
	import Button from './Button.svelte';

	interface $$Props {
		options?: FormOptions;
		class?: string;
		novalidate?: boolean;
		autocomplete?: 'on' | 'off';
		submitText?: string;
		submitVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
		showSubmitButton?: boolean;
		submitFullWidth?: boolean;
		resetText?: string;
		showResetButton?: boolean;
		loading?: boolean;
	}

	export let options: NonNullable<$$Props['options']> = {};
	export let submitText: NonNullable<$$Props['submitText']> = 'Submit';
	export let submitVariant: NonNullable<$$Props['submitVariant']> = 'primary';
	export let showSubmitButton: NonNullable<$$Props['showSubmitButton']> = true;
	export let submitFullWidth: NonNullable<$$Props['submitFullWidth']> = false;
	export let resetText: NonNullable<$$Props['resetText']> = 'Reset';
	export let showResetButton: NonNullable<$$Props['showResetButton']> = false;
	export let loading: NonNullable<$$Props['loading']> = false;

	const dispatch = createEventDispatcher<{
		submit: { values: Record<string, any>; isValid: boolean };
		reset: void;
		change: { values: Record<string, any> };
	}>();

	// Create form store
	const form = createFormStore({
		...options,
		onSubmit: async (values) => {
			dispatch('submit', { values, isValid: true });
			if (options.onSubmit) {
				await options.onSubmit(values);
			}
		}
	});

	// Subscribe to form values for change events
	$: if ($form.isDirty) {
		dispatch('change', { values: $form.values });
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		
		const isValid = await form.submit();
		if (!isValid) {
			notifications.error(
				'Form validation failed', 
				'Please correct the errors and try again.'
			);
		}
	}

	function handleReset() {
		form.reset();
		dispatch('reset');
	}

	// Expose form methods for parent components
	export const formApi = {
		setField: form.setField,
		touchField: form.touchField,
		validate: form.validate,
		submit: form.submit,
		reset: form.reset,
		addField: form.addField,
		removeField: form.removeField,
		values: form.values,
		errors: form.errors
	};
</script>

<form
	on:submit={handleSubmit}
	on:reset={handleReset}
	class="space-y-4 {$$props.class || ''}"
	novalidate={$$props.novalidate}
	autocomplete={$$props.autocomplete}
	{...$$restProps}
>
	<!-- Form content -->
	<slot {form} formApi={formApi} values={$form.values} errors={$form.errors} isValid={$form.isValid} isDirty={$form.isDirty} />

	<!-- Form actions -->
	{#if showSubmitButton || showResetButton}
		<div class="flex gap-3 pt-4 {submitFullWidth ? 'flex-col' : 'flex-row justify-end'}">
			{#if showResetButton}
				<Button
					type="reset"
					variant="ghost"
					disabled={!$form.isDirty || $form.isSubmitting || loading}
					fullWidth={submitFullWidth}
				>
					{resetText}
				</Button>
			{/if}

			{#if showSubmitButton}
				<Button
					type="submit"
					variant={submitVariant}
					disabled={!$form.isValid}
					loading={$form.isSubmitting || loading}
					fullWidth={submitFullWidth}
				>
					{submitText}
				</Button>
			{/if}
		</div>
	{/if}

	<!-- Form status -->
	{#if $form.submitCount > 0 && Object.keys($form.errors).length > 0}
		<div class="rounded-md bg-red-50 dark:bg-red-900/10 p-3 border border-red-200 dark:border-red-800">
			<div class="flex">
				<iconify-icon icon="ph:warning-circle" class="w-5 h-5 text-red-400 flex-shrink-0"></iconify-icon>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800 dark:text-red-200">
						Please correct the following errors:
					</h3>
					<ul class="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
						{#each Object.entries($form.errors) as [field, error]}
							<li>{error}</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	{/if}
</form>
