<script lang="ts">
	import { modals } from '$lib/stores/modal';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Button from './Button.svelte';

	// Built-in modal components
	function ConfirmModal({ props, onConfirm, onClose }: any) {
		return {
			title: 'Confirm Action',
			content: props.message,
			actions: [
				{
					label: props.cancelText || 'Cancel',
					variant: 'ghost',
					action: onClose
				},
				{
					label: props.confirmText || 'Confirm',
					variant: 'primary',
					action: onConfirm
				}
			]
		};
	}

	function AlertModal({ props, onClose }: any) {
		return {
			title: 'Alert',
			content: props.message,
			actions: [
				{
					label: props.buttonText || 'OK',
					variant: 'primary',
					action: onClose
				}
			]
		};
	}

	function PromptModal({ props, onConfirm, onClose }: any) {
		let inputValue = props.defaultValue || '';

		return {
			title: 'Input Required',
			content: `
				<div class="space-y-4">
					<p class="text-gray-600 dark:text-gray-400">${props.message}</p>
					<input
						type="text"
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
						placeholder="${props.placeholder || ''}"
						value="${inputValue}"
						autofocus
					/>
				</div>
			`,
			actions: [
				{
					label: props.cancelText || 'Cancel',
					variant: 'ghost',
					action: onClose
				},
				{
					label: props.confirmText || 'OK',
					variant: 'primary',
					action: () => onConfirm?.(inputValue)
				}
			]
		};
	}

	const builtInComponents = {
		ConfirmModal,
		AlertModal,
		PromptModal
	};

	function getSizeClasses(size: string) {
		const sizeMap = {
			sm: 'max-w-md',
			md: 'max-w-lg',
			lg: 'max-w-2xl',
			xl: 'max-w-4xl',
			full: 'max-w-[95vw] max-h-[95vh]'
		};
		return sizeMap[size as keyof typeof sizeMap] || sizeMap.md;
	}

	function handleBackdropClick(event: MouseEvent, modal: any) {
		if (event.target === event.currentTarget && !modal.persistent) {
			modals.close(modal.id);
		}
	}

	function handleKeydown(event: KeyboardEvent, modal: any) {
		if (event.key === 'Escape' && modal.closable) {
			modals.close(modal.id);
		}
	}
</script>

<!-- Render all active modals -->
{#each $modals.modals as modal (modal.id)}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		on:click={(e) => handleBackdropClick(e, modal)}
		on:keydown={(e) => handleKeydown(e, modal)}
		role="dialog"
		aria-modal="true"
		aria-labelledby="{modal.id}-title"
		tabindex="-1"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 150 }}
	>
		<!-- Backdrop -->
		<div 
			class="absolute inset-0 bg-black/50 backdrop-blur-sm"
			aria-hidden="true"
		></div>

		<!-- Modal Content -->
		<div
			class={`
				relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800
				w-full ${getSizeClasses(modal.size || 'md')} max-h-[90vh] overflow-hidden flex flex-col
			`}
			in:fly={{ 
				y: 30, 
				duration: 300, 
				easing: quintOut 
			}}
			out:fly={{ 
				y: -30, 
				duration: 200, 
				easing: quintOut 
			}}
		>
			<!-- Header -->
			{#if modal.title || modal.closable !== false}
				<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
					<div class="flex-1 min-w-0">
						{#if modal.title}
							<h2 
								id="{modal.id}-title"
								class="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate"
							>
								{modal.title}
							</h2>
						{/if}
					</div>
					
					{#if modal.closable !== false}
						<button
							class="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
							on:click={() => modals.close(modal.id)}
							aria-label="Close modal"
						>
							<iconify-icon icon="ph:x" class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"></iconify-icon>
						</button>
					{/if}
				</div>
			{/if}

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6">
				{#if modal.component && typeof modal.component === 'string' && modal.component in builtInComponents}
					{@const builtInModal = (builtInComponents as any)[modal.component]({
						props: modal.props,
						onConfirm: modal.onConfirm,
						onClose: () => modals.close(modal.id)
					})}
					
					<!-- Built-in component content -->
					<div>
						{#if builtInModal.content}
							{@html builtInModal.content}
						{/if}
					</div>

					<!-- Built-in component actions -->
					{#if builtInModal.actions}
						<div class="flex gap-3 justify-end mt-6">
							{#each builtInModal.actions as action}
								<Button
									variant={action.variant}
									on:click={action.action}
								>
									{action.label}
								</Button>
							{/each}
						</div>
					{/if}
				{:else if modal.component}
					<!-- Custom Svelte component -->
					<svelte:component 
						this={modal.component} 
						{...modal.props}
						on:close={() => modals.close(modal.id)}
						on:confirm={modal.onConfirm}
					/>
				{:else}
					<!-- Default slot content -->
					<div class="text-gray-600 dark:text-gray-400">
						Modal content goes here
					</div>
				{/if}
			</div>
		</div>
	</div>
{/each}

<style>
	/* Smooth scrolling for modal content */
	.overflow-y-auto {
		scrollbar-width: thin;
		scrollbar-color: #9ca3af transparent;
	}
	
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background-color: #9ca3af;
		border-radius: 3px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background-color: #6b7280;
	}
</style>
