<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { scale } from 'svelte/transition';
	import { debounce } from '$lib/utils/debounce';
	import Tag from 'phosphor-svelte/lib/Tag';
	import X from 'phosphor-svelte/lib/X';
	import Plus from 'phosphor-svelte/lib/Plus';
	
	export let tags: string[] = [];
	export let availableTags: string[] = [];
	export let placeholder = 'Add tags...';
	export let maxTags = 10;
	export let allowCustomTags = true;
	export let readonly = false;

	const dispatch = createEventDispatcher<{
		change: string[];
		add: string;
		remove: string;
		search: string;
	}>();

	let inputValue = '';
	let showSuggestions = false;
	let suggestions: string[] = [];
	let inputElement: HTMLInputElement;
	let suggestionsContainer: HTMLElement;
	let activeIndex = -1;

	$: filteredSuggestions = availableTags
		.filter(tag => 
			!tags.includes(tag) && 
			tag.toLowerCase().includes(inputValue.toLowerCase())
		)
		.slice(0, 5);

	$: suggestions = filteredSuggestions;

	const debouncedSearch = debounce(async (query: string) => {
		dispatch('search', query);
		
		// Also fetch suggestions from Qdrant API
		if (query.length > 1) {
			try {
				const response = await fetch('/api/qdrant/tag', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query, limit: 5 })
				});
				
				if (response.ok) {
					const data = await response.json();
					const apiSuggestions = data.suggestions.map((s: any) => s.tag);
					// Merge with existing available tags
					availableTags = [...new Set([...availableTags, ...apiSuggestions])];
				}
			} catch (error) {
				console.error('Failed to fetch tag suggestions:', error);
			}
		}
	}, 300);

	function handleInput() {
		showSuggestions = inputValue.length > 0;
		activeIndex = -1;
		debouncedSearch(inputValue);
	}

	function addTag(tag: string) {
		if (!tag.trim()) return;
		
		const trimmedTag = tag.trim();
		
		if (tags.includes(trimmedTag)) return;
		if (tags.length >= maxTags) return;
		
		const newTags = [...tags, trimmedTag];
		tags = newTags;
		
		dispatch('change', newTags);
		dispatch('add', trimmedTag);
		
		inputValue = '';
		showSuggestions = false;
		activeIndex = -1;
	}

	function removeTag(tag: string) {
		const newTags = tags.filter(t => t !== tag);
		tags = newTags;
		
		dispatch('change', newTags);
		dispatch('remove', tag);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (readonly) return;

		switch (event.key) {
			case 'Enter':
				event.preventDefault();
				if (activeIndex >= 0 && suggestions[activeIndex]) {
					addTag(suggestions[activeIndex]);
				} else if (inputValue.trim() && allowCustomTags) {
					addTag(inputValue);
				}
				break;
				
			case 'ArrowDown':
				event.preventDefault();
				activeIndex = Math.min(activeIndex + 1, suggestions.length - 1);
				break;
				
			case 'ArrowUp':
				event.preventDefault();
				activeIndex = Math.max(activeIndex - 1, -1);
				break;
				
			case 'Escape':
				showSuggestions = false;
				activeIndex = -1;
				inputElement?.blur();
				break;
				
			case 'Backspace':
				if (!inputValue && tags.length > 0) {
					removeTag(tags[tags.length - 1]);
				}
				break;
		}
	}

	function handleSuggestionClick(tag: string) {
		addTag(tag);
		inputElement?.focus();
	}

	function handleClickOutside(event: MouseEvent) {
		if (!suggestionsContainer?.contains(event.target as Node)) {
			showSuggestions = false;
			activeIndex = -1;
		}
	}

	function handleFocus() {
		if (inputValue.length > 0) {
			showSuggestions = true;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="tag-list" class:readonly>
	<div class="tag-container">
		{#each tags as tag (tag)}
			<div class="tag" transition:scale={{ duration: 200 }}>
				<Tag class="tag-icon" size={14} />
				<span class="tag-text">{tag}</span>
				{#if !readonly}
					<button
						type="button"
						class="tag-remove"
						on:click={() => removeTag(tag)}
						aria-label="Remove {tag} tag"
					>
						<X size={12} />
					</button>
				{/if}
			</div>
		{/each}
		
		{#if !readonly && tags.length < maxTags}
			<div class="tag-input-container" bind:this={suggestionsContainer}>
				<input
					bind:this={inputElement}
					bind:value={inputValue}
					on:input={handleInput}
					on:keydown={handleKeyDown}
					on:focus={handleFocus}
					class="tag-input"
					type="text"
					{placeholder}
					aria-label="Add new tag"
				/>
				
				{#if showSuggestions && suggestions.length > 0}
					<div class="suggestions" role="listbox">
						{#each suggestions as suggestion, index (suggestion)}
							<button
								type="button"
								class="suggestion"
								class:active={index === activeIndex}
								on:click={() => handleSuggestionClick(suggestion)}
								role="option"
								aria-selected={index === activeIndex}
							>
								<Tag class="suggestion-icon" size={14} />
								<span>{suggestion}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
		
		{#if !readonly && allowCustomTags && inputValue.trim() && !suggestions.includes(inputValue.trim())}
			<button
				type="button"
				class="add-custom-tag"
				on:click={() => addTag(inputValue)}
				aria-label="Add custom tag: {inputValue}"
			>
				<Plus size={14} />
				Add "{inputValue}"
			</button>
		{/if}
	</div>
	
	{#if tags.length >= maxTags}
		<div class="max-tags-message" role="status" aria-live="polite">
			Maximum {maxTags} tags allowed
		</div>
	{/if}
</div>

<style>
	.tag-list {
		width: 100%;
	}

	.tag-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background-color: #dbeafe;
		color: #1e40af;
		border-radius: 9999px;
		font-size: 0.875rem;
		border: 1px solid #bfdbfe;
		transition: all 0.2s;
	}

	.tag:hover {
		background-color: #bfdbfe;
	}

	.tag-text {
		font-weight: 500;
	}

	.tag-remove {
		margin-left: 0.25rem;
		padding: 0.125rem;
		border-radius: 9999px;
		color: #2563eb;
		transition: all 0.15s;
		border: none;
		background: none;
		cursor: pointer;
	}

	.tag-remove:hover {
		background-color: #93c5fd;
		color: #1e40af;
	}

	.tag-remove:focus {
		outline: none;
		box-shadow: 0 0 0 2px #3b82f6;
	}

	.tag-input-container {
		position: relative;
	}

	.tag-input {
		padding: 0.375rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background-color: white;
		min-width: 8rem;
	}

	.tag-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
	}

	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.25rem;
		background-color: white;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
		max-height: 10rem;
		overflow-y: auto;
		z-index: 50;
	}

	.suggestion {
		width: 100%;
		padding: 0.5rem 0.75rem;
		text-align: left;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.15s;
		border: none;
		background: none;
		cursor: pointer;
	}

	.suggestion:hover,
	.suggestion:focus {
		background-color: #eff6ff;
		outline: none;
	}

	.suggestion.active {
		background-color: #eff6ff;
	}

	.suggestion-icon {
		color: #6b7280;
	}

	.add-custom-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		color: #2563eb;
		border: 1px dashed #93c5fd;
		border-radius: 0.375rem;
		transition: all 0.15s;
		background: none;
		cursor: pointer;
	}

	.add-custom-tag:hover {
		color: #1e40af;
		border-color: #3b82f6;
	}

	.add-custom-tag:focus {
		outline: none;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
	}

	.max-tags-message {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.readonly .tag {
		background-color: #f3f4f6;
		color: #374151;
		border-color: #e5e7eb;
	}
</style>
