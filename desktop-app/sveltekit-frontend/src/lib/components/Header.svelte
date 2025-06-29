<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import SearchInput from './SearchInput.svelte';
	
	import House from 'phosphor-svelte/lib/House';
	import FolderOpen from 'phosphor-svelte/lib/FolderOpen';
	import User from 'phosphor-svelte/lib/User';
	import Gear from 'phosphor-svelte/lib/Gear';
	import SignOut from 'phosphor-svelte/lib/SignOut';
	import PaintBrush from 'phosphor-svelte/lib/PaintBrush';
	import DotsThreeVertical from 'phosphor-svelte/lib/DotsThreeVertical';
	import Shield from 'phosphor-svelte/lib/Shield';

	export let user: any = null;

	let searchQuery = '';
	let userMenuOpen = false;

	function handleSearch(event: CustomEvent) {
		searchQuery = event.detail.query;
		// Handle global search
		console.log('Global search:', searchQuery);
	}

	function handleLogout() {
		goto('/logout');
	}

	function handleNavigation(path: string) {
		goto(path);
		userMenuOpen = false;
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
	}

	function closeUserMenu() {
		userMenuOpen = false;
	}
</script>

<header class="app-header">
	<div class="header-content">
		<!-- Logo and Brand -->
		<div class="brand-section">
			<button
				class="brand-button"
				on:click={() => handleNavigation('/')}
				aria-label="Go to homepage"
			>
				<PaintBrush size={24} />
				<span class="brand-text">Prosecutor Canvas</span>
			</button>
		</div>

		<!-- Navigation -->
		<nav class="main-nav" aria-label="Main navigation">
			<button
				class="nav-button {$page.url.pathname === '/dashboard' ? 'active' : ''}"
				on:click={() => handleNavigation('/dashboard')}
				aria-label="Dashboard"
			>
				<House size={18} />
				<span>Dashboard</span>
			</button>

			<button
				class="nav-button {$page.url.pathname.startsWith('/cases') ? 'active' : ''}"
				on:click={() => handleNavigation('/cases')}
				aria-label="Cases"
			>
				<FolderOpen size={18} />
				<span>Cases</span>
			</button>

			<button
				class="nav-button {$page.url.pathname === '/interactive-canvas' ? 'active' : ''}"
				on:click={() => handleNavigation('/interactive-canvas')}
				aria-label="Interactive Canvas"
			>
				<PaintBrush size={18} />
				<span>Canvas</span>
			</button>

			<button
				class="nav-button {$page.url.pathname === '/evidence/hash' ? 'active' : ''}"
				on:click={() => handleNavigation('/evidence/hash')}
				aria-label="Hash Verification"
				title="Verify evidence file integrity"
			>
				<Shield size={18} />
				<span>Hash Verify</span>
			</button>
		</nav>

		<!-- Search -->
		<div class="search-section">
			<SearchInput
				placeholder="Search cases, evidence, notes..."
				value={searchQuery}
				on:search={handleSearch}
			/>
		</div>

		<!-- User Menu -->
		<div class="user-section">
			{#if user}
				<div class="user-menu-container">
					<button
						class="user-button"
						on:click={toggleUserMenu}
						aria-label="User menu"
						aria-expanded={userMenuOpen}
					>
						<div class="user-avatar">
							{#if user.avatar}
								<img src={user.avatar} alt={user.username} />
							{:else}
								<span class="avatar-fallback">
									{user.username?.charAt(0)?.toUpperCase() || 'U'}
								</span>
							{/if}
						</div>
						<span class="user-name">{user.username}</span>
						<DotsThreeVertical size={16} />
					</button>

					{#if userMenuOpen}
						<div class="user-menu" role="menu">
							<button
								class="menu-item"
								on:click={() => handleNavigation('/profile')}
								role="menuitem"
							>
								<User size={16} />
								Profile
							</button>
							
							<button
								class="menu-item"
								on:click={() => handleNavigation('/settings')}
								role="menuitem"
							>
								<Gear size={16} />
								Settings
							</button>
							
							<hr class="menu-separator" />
							
							<button
								class="menu-item"
								on:click={handleLogout}
								role="menuitem"
							>
								<SignOut size={16} />
								Sign Out
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<button
					class="sign-in-button"
					on:click={() => handleNavigation('/login')}
					aria-label="Sign in"
				>
					Sign In
				</button>
			{/if}
		</div>
	</div>
</header>

<!-- Click outside to close menu -->
{#if userMenuOpen}
	<div 
		class="menu-overlay" 
		on:click={closeUserMenu} 
		on:keydown={(e) => e.key === 'Escape' && closeUserMenu()}
		role="button" 
		tabindex="-1"
		aria-label="Close user menu"
	></div>
{/if}

<style>
	.app-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 60px;
		background: var(--pico-card-background-color);
		border-bottom: 1px solid var(--pico-muted-border-color);
		z-index: 30;
		backdrop-filter: blur(8px);
	}

	.header-content {
		display: flex;
		align-items: center;
		height: 100%;
		padding: 0 1rem;
		max-width: 1400px;
		margin: 0 auto;
		gap: 1rem;
	}

	.brand-section {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.brand-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		font-weight: 600;
		color: var(--pico-primary);
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: 6px;
		transition: background 0.2s ease;
	}

	.brand-button:hover {
		background: var(--pico-secondary-background);
	}

	.brand-text {
		font-size: 1.1rem;
		font-weight: 700;
	}

	.main-nav {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.nav-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		color: var(--pico-muted-color);
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.nav-button:hover {
		color: var(--pico-color);
		background: var(--pico-secondary-background);
	}

	.nav-button.active {
		color: var(--pico-primary);
		background: var(--pico-primary-background);
	}

	.search-section {
		flex: 1;
		max-width: 400px;
		margin: 0 2rem;
	}

	.user-section {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.user-menu-container {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: 6px;
		transition: background 0.2s ease;
		color: var(--pico-color);
	}

	.user-button:hover {
		background: var(--pico-secondary-background);
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--pico-primary-background);
		color: var(--pico-primary);
	}

	.user-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-fallback {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.user-name {
		font-weight: 500;
		color: var(--pico-color);
	}

	.user-menu {
		position: absolute;
		top: 100%;
		right: 0;
		min-width: 180px;
		background: var(--pico-card-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 0.5rem;
		z-index: 1000;
		margin-top: 0.5rem;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		width: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: 4px;
		transition: background 0.2s ease;
		color: var(--pico-color);
		text-align: left;
	}

	.menu-item:hover {
		background: var(--pico-secondary-background);
	}

	.menu-separator {
		border: none;
		border-top: 1px solid var(--pico-muted-border-color);
		margin: 0.5rem 0;
	}

	.sign-in-button {
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid var(--pico-primary);
		color: var(--pico-primary);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.sign-in-button:hover {
		background: var(--pico-primary);
		color: var(--pico-primary-inverse);
	}

	.menu-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
		background: transparent;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.header-content {
			padding: 0 0.5rem;
			gap: 0.5rem;
		}

		.brand-text {
			display: none;
		}

		.search-section {
			margin: 0 1rem;
		}

		.nav-button span {
			display: none;
		}

		.user-name {
			display: none;
		}
	}

	@media (max-width: 480px) {
		.main-nav {
			gap: 0;
		}

		.search-section {
			max-width: 200px;
			margin: 0 0.5rem;
		}
	}
</style>
