<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Avatar from '$lib/components/Avatar.svelte';
	import { avatarStore } from '$lib/stores/avatarStore';

	let user = $page.data.user;
	let profileForm = {
		name: '',
		email: '',
		firstName: '',
		lastName: ''
	};

	let isUpdating = false;
	let updateMessage = '';

	onMount(() => {
		if (user) {
			profileForm = {
				name: user.name || '',
				email: user.email || '',
				firstName: user.firstName || '',
				lastName: user.lastName || ''
			};
		}
		
		// Load avatar
		avatarStore.loadAvatar();
	});
	
	async function updateProfile() {
		isUpdating = true;
		updateMessage = '';
		
		try {
			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(profileForm)
			});
			
			const data = await response.json();
			
			if (response.ok) {
				updateMessage = 'Profile updated successfully!';
				user = data.user;
			} else {
				updateMessage = data.error || 'Update failed';
			}
		} catch (error) {
			updateMessage = 'Network error occurred';
		} finally {
			isUpdating = false;
		}
	}
</script>

<svelte:head>
	<title>Profile Settings - WardenNet</title>
</svelte:head>

{#if user}
<div class="profile-container">
	<div class="profile-header">
		<h1>Profile Settings</h1>
		<p>Manage your account information and avatar</p>
	</div>
	
	<div class="profile-content">
		<!-- Avatar Section -->
		<div class="avatar-section">
			<h2>Profile Picture</h2>
			<div class="avatar-display">
				<Avatar size="large" showUploadButton={true} />
				<div class="avatar-info">
					<h3>Your Avatar</h3>
					<p>Upload a profile picture to personalize your account. Supported formats: JPEG, PNG, GIF, SVG, WebP (max 5MB)</p>
					
					{#if $avatarStore.error}
						<div class="error-banner">
							{$avatarStore.error}
						</div>
					{/if}
				</div>
			</div>
		</div>
		
		<div class="divider"></div>
		
		<!-- Profile Information -->
		<div class="profile-form-section">
			<h2>Account Information</h2>
			
			<form on:submit|preventDefault={updateProfile} class="profile-form">
				<div class="form-grid">
					<div class="form-group">
						<label for="name">Full Name</label>
						<input 
							id="name"
							type="text" 
							bind:value={profileForm.name}
							placeholder="Enter your full name"
							required
						/>
					</div>
					
					<div class="form-group">
						<label for="email">Email Address</label>
						<input 
							id="email"
							type="email" 
							bind:value={profileForm.email}
							placeholder="Enter your email"
							required
						/>
					</div>
					
					<div class="form-group">
						<label for="firstName">First Name</label>
						<input 
							id="firstName"
							type="text" 
							bind:value={profileForm.firstName}
							placeholder="Enter your first name"
						/>
					</div>
					
					<div class="form-group">
						<label for="lastName">Last Name</label>
						<input 
							id="lastName"
							type="text" 
							bind:value={profileForm.lastName}
							placeholder="Enter your last name"
						/>
					</div>
				</div>
				
				{#if updateMessage}
					<div class="update-message" class:success={updateMessage.includes('success')} class:error={!updateMessage.includes('success')}>
						{updateMessage}
					</div>
				{/if}
				
				<div class="form-actions">
					<button 
						type="submit" 
						class="save-btn"
						disabled={isUpdating}
					>
						{isUpdating ? 'Updating...' : 'Save Changes'}
					</button>
					
					<a href="/dashboard" class="cancel-btn">
						Cancel
					</a>
				</div>
			</form>
		</div>
		
		<div class="divider"></div>
		
		<!-- Account Stats -->
		<div class="stats-section">
			<h2>Account Statistics</h2>
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-value">--</div>
					<div class="stat-label">Cases Created</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">--</div>
					<div class="stat-label">Evidence Files</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{user?.role || 'User'}</div>
					<div class="stat-label">Role</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '--'}</div>
					<div class="stat-label">Member Since</div>
				</div>
			</div>
		</div>
	</div>
</div>
{:else}
<div class="alert alert-warning">
	<span>Please log in to view your profile.</span>
</div>
{/if}

<style>
	.profile-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 24px;
	}
	
	.profile-header {
		text-align: center;
		margin-bottom: 32px;
	}
	
	.profile-header h1 {
		font-size: 32px;
		font-weight: 700;
		color: var(--text-primary, #111827);
		margin-bottom: 8px;
	}
	
	.profile-header p {
		color: var(--text-secondary, #6b7280);
		font-size: 16px;
	}
	
	.profile-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}
	
	.avatar-section {
		padding: 32px;
	}
	
	.avatar-section h2 {
		font-size: 20px;
		font-weight: 600;
		margin-bottom: 20px;
		color: var(--text-primary, #111827);
	}
	
	.avatar-display {
		display: flex;
		gap: 24px;
		align-items: flex-start;
	}
	
	.avatar-info h3 {
		font-size: 18px;
		font-weight: 600;
		margin-bottom: 8px;
		color: var(--text-primary, #111827);
	}
	
	.avatar-info p {
		color: var(--text-secondary, #6b7280);
		line-height: 1.6;
		margin-bottom: 16px;
	}
	
	.error-banner {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 12px;
		border-radius: 8px;
		font-size: 14px;
	}
	
	.divider {
		height: 1px;
		background: var(--border-color, #e5e7eb);
	}
	
	.profile-form-section {
		padding: 32px;
	}
	
	.profile-form-section h2 {
		font-size: 20px;
		font-weight: 600;
		margin-bottom: 24px;
		color: var(--text-primary, #111827);
	}
	
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin-bottom: 24px;
	}
	
	.form-group {
		display: flex;
		flex-direction: column;
	}
	
	.form-group label {
		font-weight: 500;
		margin-bottom: 8px;
		color: var(--text-primary, #374151);
	}
	
	.form-group input {
		padding: 12px;
		border: 1px solid var(--border-color, #d1d5db);
		border-radius: 8px;
		font-size: 16px;
		transition: border-color 0.2s ease;
	}
	
	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.update-message {
		padding: 12px;
		border-radius: 8px;
		margin-bottom: 20px;
		font-weight: 500;
	}
	
	.update-message.success {
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		color: #065f46;
	}
	
	.update-message.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
	}
	
	.form-actions {
		display: flex;
		gap: 12px;
	}
	
	.save-btn {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s ease;
	}
	
	.save-btn:hover:not(:disabled) {
		background: #2563eb;
	}
	
	.save-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.cancel-btn {
		background: #f3f4f6;
		color: #374151;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.2s ease;
	}
	
	.cancel-btn:hover {
		background: #e5e7eb;
	}
	
	.stats-section {
		padding: 32px;
	}
	
	.stats-section h2 {
		font-size: 20px;
		font-weight: 600;
		margin-bottom: 20px;
		color: var(--text-primary, #111827);
	}
	
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 16px;
	}
	
	.stat-card {
		background: #f9fafb;
		padding: 20px;
		border-radius: 8px;
		text-align: center;
	}
	
	.stat-value {
		font-size: 24px;
		font-weight: 700;
		color: var(--text-primary, #111827);
		margin-bottom: 4px;
	}
	
	.stat-label {
		font-size: 14px;
		color: var(--text-secondary, #6b7280);
		font-weight: 500;
	}
	
	.alert {
		background: #fef3cd;
		border: 1px solid #facc15;
		color: #a16207;
		padding: 16px;
		border-radius: 8px;
		text-align: center;
		margin: 32px auto;
		max-width: 400px;
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		
		.avatar-display {
			flex-direction: column;
			text-align: center;
		}
		
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
