<script lang="ts">
	import { notifications, type Notification } from '$lib/stores/notification';
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Button from './Button.svelte';

	// Icons for different notification types
	const icons = {
		success: 'ph:check-circle',
		error: 'ph:x-circle',
		warning: 'ph:warning-circle',
		info: 'ph:info'
	};

	const colorClasses = {
		success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/10 dark:border-green-800 dark:text-green-200',
		error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800 dark:text-red-200',
		warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-800 dark:text-yellow-200',
		info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-200'
	};

	const iconColorClasses = {
		success: 'text-green-400',
		error: 'text-red-400',
		warning: 'text-yellow-400',
		info: 'text-blue-400'
	};

	function handleClose(notification: Notification) {
		notifications.remove(notification.id);
	}

	function handleAction(notification: Notification, action: NonNullable<Notification['actions']>[0]) {
		action.action();
		notifications.remove(notification.id);
	}
</script>

<!-- Notification Container -->
<div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
	{#each $notifications.notifications as notification (notification.id)}
		<div
			class={`
				relative p-4 rounded-lg border shadow-lg backdrop-blur-sm
				${colorClasses[notification.type]}
			`}
			in:fly={{ x: 300, duration: 300, easing: quintOut }}
			out:fly={{ x: 300, duration: 200, easing: quintOut }}
		>
			<div class="flex">
				<!-- Icon -->
				<div class="flex-shrink-0">
					<iconify-icon 
						icon={icons[notification.type]} 
						class={`w-5 h-5 ${iconColorClasses[notification.type]}`}
					></iconify-icon>
				</div>

				<!-- Content -->
				<div class="ml-3 flex-1">
					<p class="font-medium text-sm">
						{notification.title}
					</p>
					{#if notification.message}
						<p class="mt-1 text-sm opacity-90">
							{notification.message}
						</p>
					{/if}

					<!-- Actions -->
					{#if notification.actions && notification.actions.length > 0}
						<div class="mt-3 flex gap-2">
							{#each notification.actions as action}
								<Button
									size="xs"
									variant={action.variant || 'ghost'}
									on:click={() => handleAction(notification, action)}
								>
									{action.label}
								</Button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Close button -->
				<div class="ml-4 flex-shrink-0">
					<button
						type="button"
						class="inline-flex rounded-md p-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
						on:click={() => handleClose(notification)}
					>
						<span class="sr-only">Dismiss</span>
						<iconify-icon icon="ph:x" class="w-4 h-4"></iconify-icon>
					</button>
				</div>
			</div>

			<!-- Progress bar for timed notifications -->
			{#if notification.duration && notification.duration > 0}
				<div class="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-lg w-full">
					<div 
						class="h-full bg-current rounded-b-lg transition-all linear"
						style="animation: shrink {notification.duration}ms linear forwards;"
					></div>
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	@keyframes shrink {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
