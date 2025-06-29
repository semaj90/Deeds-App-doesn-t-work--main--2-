<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Form from '$lib/components/ui/Form.svelte';
	import { notifications } from '$lib/stores/notification';
	import { modals } from '$lib/stores/modal';
	import { createFormStore } from '$lib/stores/form';

	// Demo notification functions
	function showSuccessNotification() {
		notifications.success(
			'Success!',
			'Your action was completed successfully.',
			{
				actions: [
					{
						label: 'View Details',
						action: () => console.log('View details clicked'),
						variant: 'primary'
					}
				]
			}
		);
	}

	function showErrorNotification() {
		notifications.error(
			'Error Occurred',
			'Something went wrong. Please try again.',
			{
				duration: 0, // Don't auto-dismiss
				actions: [
					{
						label: 'Retry',
						action: () => console.log('Retry clicked'),
						variant: 'primary'
					},
					{
						label: 'Cancel',
						action: () => console.log('Cancel clicked'),
						variant: 'secondary'
					}
				]
			}
		);
	}

	function showWarningNotification() {
		notifications.warning(
			'Warning',
			'This action may have consequences. Please review before proceeding.'
		);
	}

	function showInfoNotification() {
		notifications.info(
			'Information',
			'Here is some useful information about the current process.'
		);
	}

	// Demo modal functions
	function showConfirmModal() {
		modals.confirm({
			title: 'Delete Case',
			message: 'Are you sure you want to delete this case? This action cannot be undone.',
			confirmText: 'Delete',
			cancelText: 'Cancel',
			onConfirm: () => {
				notifications.success('Case deleted', 'The case has been successfully deleted.');
			},
			onCancel: () => {
				notifications.info('Cancelled', 'Delete operation was cancelled.');
			}
		});
	}

	function showAlertModal() {
		modals.alert({
			title: 'System Maintenance',
			message: 'The system will be undergoing maintenance from 2:00 AM to 4:00 AM EST.',
			onClose: () => {
				console.log('Alert dismissed');
			}
		});
	}

	function showPromptModal() {
		modals.prompt({
			title: 'Add Note',
			message: 'Please enter a note for this case:',
			placeholder: 'Enter your note here...',
			defaultValue: '',
			onConfirm: (value) => {
				notifications.success('Note added', `Note: "${value}" has been added to the case.`);
			},
			onCancel: () => {
				console.log('Prompt cancelled');
			}
		});
	}

	// Demo form
	const demoFormOptions = {
		initialValues: {
			email: '',
			password: '',
			confirmPassword: '',
			name: '',
			terms: false
		},
		validators: {
			email: (value: string) => {
				if (!value) return 'Email is required';
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
				return null;
			},
			password: (value: string) => {
				if (!value) return 'Password is required';
				if (value.length < 8) return 'Password must be at least 8 characters';
				return null;
			},
			confirmPassword: (value: string) => {
				if (!value) return 'Please confirm your password';
				// Note: For now we can't cross-validate with password field
				return null;
			},
			name: (value: string) => {
				if (!value) return 'Name is required';
				if (value.length < 2) return 'Name must be at least 2 characters';
				return null;
			},
			terms: (value: boolean) => {
				if (!value) return 'You must accept the terms and conditions';
				return null;
			}
		},
		requiredFields: ['email', 'password', 'confirmPassword', 'name', 'terms']
	};

	function handleDemoFormSubmit(event: CustomEvent) {
		const { values, isValid } = event.detail;
		if (isValid) {
			notifications.success(
				'Form submitted!',
				`Welcome ${values.name}! Your account has been created.`
			);
		}
	}

	let interactiveCardSelected = false;
</script>

<svelte:head>
	<title>UI Components Demo - Legal Case Management</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
	<div class="max-w-7xl mx-auto px-4">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
				UI Components Demo
			</h1>
			<p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
				Explore our comprehensive UI component library built with Svelte stores, UnoCSS, PicoCSS, Melt UI, and Bits UI.
				All components feature interactive updates, modern styling, and accessibility support.
			</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Buttons Demo -->
			<Card variant="elevated" padding="lg">
				<div slot="header">
					<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
						Button Variants
					</h2>
					<p class="text-gray-600 dark:text-gray-400 mt-1">
						Different button styles and states with loading support
					</p>
				</div>

				<div class="space-y-4">
					<div class="flex flex-wrap gap-2">
						<Button variant="primary">Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="success">Success</Button>
						<Button variant="danger">Danger</Button>
						<Button variant="warning">Warning</Button>
						<Button variant="info">Info</Button>
					</div>

					<div class="flex flex-wrap gap-2">
						<Button variant="ghost">Ghost</Button>
						<Button variant="outline">Outline</Button>
						<Button disabled>Disabled</Button>
						<Button loading>Loading</Button>
					</div>

					<div class="flex flex-wrap gap-2">
						<Button size="xs">Extra Small</Button>
						<Button size="sm">Small</Button>
						<Button size="md">Medium</Button>
						<Button size="lg">Large</Button>
						<Button size="xl">Extra Large</Button>
					</div>

					<div class="space-y-2">
						<Button fullWidth icon="plus" iconPosition="left">
							Full Width with Icon
						</Button>
						<Button variant="outline" fullWidth icon="download" iconPosition="right">
							Download Report
						</Button>
					</div>
				</div>
			</Card>

			<!-- Notifications Demo -->
			<Card variant="elevated" padding="lg">
				<div slot="header">
					<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
						Notification System
					</h2>
					<p class="text-gray-600 dark:text-gray-400 mt-1">
						Toast notifications with actions and auto-dismiss
					</p>
				</div>

				<div class="space-y-3">
					<Button variant="success" on:click={showSuccessNotification} fullWidth>
						<iconify-icon icon="ph:check-circle" class="mr-2"></iconify-icon>
						Show Success
					</Button>
					<Button variant="danger" on:click={showErrorNotification} fullWidth>
						<iconify-icon icon="ph:x-circle" class="mr-2"></iconify-icon>
						Show Error
					</Button>
					<Button variant="warning" on:click={showWarningNotification} fullWidth>
						<iconify-icon icon="ph:warning" class="mr-2"></iconify-icon>
						Show Warning
					</Button>
					<Button variant="info" on:click={showInfoNotification} fullWidth>
						<iconify-icon icon="ph:info" class="mr-2"></iconify-icon>
						Show Info
					</Button>
				</div>
			</Card>

			<!-- Modals Demo -->
			<Card variant="elevated" padding="lg">
				<div slot="header">
					<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
						Modal System
					</h2>
					<p class="text-gray-600 dark:text-gray-400 mt-1">
						Confirm dialogs, alerts, and prompts
					</p>
				</div>

				<div class="space-y-3">
					<Button variant="danger" on:click={showConfirmModal} fullWidth>
						<iconify-icon icon="ph:trash" class="mr-2"></iconify-icon>
						Confirm Dialog
					</Button>
					<Button variant="info" on:click={showAlertModal} fullWidth>
						<iconify-icon icon="ph:bell" class="mr-2"></iconify-icon>
						Alert Dialog
					</Button>
					<Button variant="primary" on:click={showPromptModal} fullWidth>
						<iconify-icon icon="ph:pencil" class="mr-2"></iconify-icon>
						Prompt Dialog
					</Button>
				</div>
			</Card>

			<!-- Interactive Cards Demo -->
			<Card variant="elevated" padding="lg">
				<div slot="header">
					<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
						Interactive Cards
					</h2>
					<p class="text-gray-600 dark:text-gray-400 mt-1">
						Cards with hover effects and selection states
					</p>
				</div>

				<div class="space-y-4">
					<Card 
						variant="outlined" 
						interactive 
						selected={interactiveCardSelected}
						on:click={() => interactiveCardSelected = !interactiveCardSelected}
						padding="md"
					>
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-medium text-gray-900 dark:text-gray-100">
									Clickable Card
								</h3>
								<p class="text-sm text-gray-600 dark:text-gray-400">
									Click to select/deselect
								</p>
							</div>
							<div class="text-2xl">
								{interactiveCardSelected ? '✅' : '⭕'}
							</div>
						</div>
					</Card>

					<Card variant="filled" padding="md">
						<div slot="header">
							<h3 class="font-medium text-gray-900 dark:text-gray-100">
								Card with Slots
							</h3>
						</div>
						
						<p class="text-gray-600 dark:text-gray-400">
							This card demonstrates the header and footer slots.
						</p>

						<div slot="footer">
							<div class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
								<span>Footer content</span>
								<span>Created today</span>
							</div>
						</div>
					</Card>

					<Card variant="elevated" loading padding="md">
						<p class="text-gray-600 dark:text-gray-400">
							This card is in a loading state...
						</p>
					</Card>
				</div>
			</Card>

			<!-- Form Demo -->
			<div class="lg:col-span-2">
				<Card variant="elevated" padding="lg">
					<div slot="header">
						<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
							Advanced Form System
						</h2>
						<p class="text-gray-600 dark:text-gray-400 mt-1">
							Forms with validation, error handling, and real-time feedback
						</p>
					</div>

					<Form
						options={demoFormOptions}
						on:submit={handleDemoFormSubmit}
						submitText="Create Account"
						showResetButton={true}
						resetText="Clear Form"
						class="grid grid-cols-1 md:grid-cols-2 gap-4"
					>
						<div slot="default" let:form let:formApi let:values let:errors let:isValid let:isDirty>
							<div class="space-y-4 md:col-span-2">
								<h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
									Account Information
								</h3>
							</div>

							<Input
								label="Full Name"
								placeholder="Enter your full name"
								required
								icon="user"
								value={values.name || ''}
								error={errors.name}
								on:input={(e) => formApi.setField('name', (e.target as HTMLInputElement)?.value)}
								on:blur={() => formApi.touchField('name')}
							/>

							<Input
								label="Email Address"
								type="email"
								placeholder="Enter your email"
								required
								icon="envelope"
								value={values.email || ''}
								error={errors.email}
								success={values.email && !errors.email}
								on:input={(e) => formApi.setField('email', (e.target as HTMLInputElement)?.value)}
								on:blur={() => formApi.touchField('email')}
							/>

							<Input
								label="Password"
								type="password"
								placeholder="Create a password"
								required
								icon="lock"
								value={values.password || ''}
								error={errors.password}
								hint="Must be at least 8 characters long"
								on:input={(e) => formApi.setField('password', (e.target as HTMLInputElement)?.value)}
								on:blur={() => formApi.touchField('password')}
							/>

							<Input
								label="Confirm Password"
								type="password"
								placeholder="Confirm your password"
								required
								icon="lock"
								value={values.confirmPassword || ''}
								error={errors.confirmPassword}
								on:input={(e) => formApi.setField('confirmPassword', (e.target as HTMLInputElement)?.value)}
								on:blur={() => formApi.touchField('confirmPassword')}
							/>

							<div class="md:col-span-2">
								<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
									<input
										type="checkbox"
										class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
										checked={values.terms || false}
										on:change={(e) => formApi.setField('terms', (e.target as HTMLInputElement)?.checked)}
										on:blur={() => formApi.touchField('terms')}
									/>
									I agree to the terms and conditions *
								</label>
								{#if errors.terms}
									<p class="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.terms}
									</p>
								{/if}
							</div>
						</div>
					</Form>
				</Card>
			</div>
		</div>

		<!-- Component Features -->
		<Card variant="outlined" padding="lg" class="mt-8">
			<div slot="header">
				<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
					🚀 Component Features
				</h2>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<div class="space-y-2">
					<h3 class="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<iconify-icon icon="ph:palette" class="text-blue-500"></iconify-icon>
						Modern Styling
					</h3>
					<ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
						<li>• UnoCSS utility classes</li>
						<li>• PicoCSS base styles</li>
						<li>• Dark mode support</li>
						<li>• Responsive design</li>
					</ul>
				</div>

				<div class="space-y-2">
					<h3 class="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<iconify-icon icon="ph:lightning" class="text-yellow-500"></iconify-icon>
						Interactive Updates
					</h3>
					<ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
						<li>• Svelte stores integration</li>
						<li>• Real-time state management</li>
						<li>• Optimistic updates</li>
						<li>• Smooth animations</li>
					</ul>
				</div>

				<div class="space-y-2">
					<h3 class="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<iconify-icon icon="ph:shield-check" class="text-green-500"></iconify-icon>
						Accessibility
					</h3>
					<ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
						<li>• ARIA labels and roles</li>
						<li>• Keyboard navigation</li>
						<li>• Screen reader support</li>
						<li>• Focus management</li>
					</ul>
				</div>
			</div>
		</Card>
	</div>
</div>
