<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { createMachine, interpret } from 'xstate';
	import debounce from 'lodash.debounce';
	import { enhancedCitationStore } from '$lib/stores/enhancedCitationStore';

	const dispatch = createEventDispatcher();

	export let content = '';
	export let reportId: string = '';
	export let caseId: string = '';
	export let editable = true;

	let editorEl: HTMLDivElement;
	let showAutocomplete = false;
	let autocompleteQuery = '';
	let autocompletePosition = { x: 0, y: 0 };
	let suggestions: any[] = [];
	let selectedSuggestionIndex = 0;
	
	// Selection-based citation popup
	let selectionText = '';
	let popupPosition = { x: 0, y: 0 };
	let showCitationPopup = false;

	// XState machine for editor state management
	const editorMachine = createMachine({
		id: 'reportEditor',
		initial: 'idle',
		context: {
			content: '',
			hasUnsavedChanges: false,
			autocompleteVisible: false,
			citationPopupVisible: false,
			aiThinking: false,
			lastSaveTime: null as Date | null
		},
		states: {
			idle: {
				on: {
					TYPING: 'editing',
					SAVE: 'saving',
					SHOW_AUTOCOMPLETE: {
						target: 'autocompleting',
						actions: 'setAutocompleteVisible'
					},
					SHOW_CITATION_POPUP: {
						target: 'citationPopup',
						actions: 'setCitationPopupVisible'
					}
				}
			},
			editing: {
				entry: 'setUnsavedChanges',
				on: {
					SAVE: 'saving',
					STOP_TYPING: {
						target: 'idle',
						actions: 'triggerAutosave'
					},
					SHOW_AUTOCOMPLETE: {
						target: 'autocompleting',
						actions: 'setAutocompleteVisible'
					}
				}
			},
			autocompleting: {
				on: {
					HIDE_AUTOCOMPLETE: {
						target: 'editing',
						actions: 'setAutocompleteHidden'
					},
					SELECT_SUGGESTION: {
						target: 'editing',
						actions: ['insertSuggestion', 'setAutocompleteHidden']
					},
					ESCAPE: {
						target: 'editing',
						actions: 'setAutocompleteHidden'
					}
				}
			},
			citationPopup: {
				on: {
					SAVE_CITATION: {
						target: 'editing',
						actions: ['saveCitation', 'setCitationPopupHidden']
					},
					CANCEL_CITATION: {
						target: 'editing',
						actions: 'setCitationPopupHidden'
					}
				}
			},
			saving: {
				invoke: {
					id: 'saveReport',
					src: 'saveToServer',
					onDone: {
						target: 'idle',
						actions: 'markAsSaved'
					},
					onError: {
						target: 'idle',
						actions: 'setSaveError'
					}
				}
			},
			aiThinking: {
				invoke: {
					id: 'getAISuggestions',
					src: 'getAISuggestions',
					onDone: {
						target: 'idle',
						actions: 'showAISuggestions'
					},
					onError: {
						target: 'idle',
						actions: 'setAIError'
					}
				}
			}
		}
	}, {
		actions: {
			setUnsavedChanges: (context) => {
				context.hasUnsavedChanges = true;
			},
			setAutocompleteVisible: (context) => {
				context.autocompleteVisible = true;
			},
			setAutocompleteHidden: (context) => {
				context.autocompleteVisible = false;
			},
			setCitationPopupVisible: (context) => {
				context.citationPopupVisible = true;
			},
			setCitationPopupHidden: (context) => {
				context.citationPopupVisible = false;
			},
			triggerAutosave: () => {
				debouncedSave();
			},
			insertSuggestion: () => {
				// Handle suggestion insertion
			},
			saveCitation: () => {
				// Handle citation saving
			},
			markAsSaved: (context) => {
				context.hasUnsavedChanges = false;
				context.lastSaveTime = new Date();
			},
			setSaveError: () => {
				console.error('Failed to save report');
			},
			showAISuggestions: () => {
				// Handle AI suggestions display
			},
			setAIError: () => {
				console.error('AI suggestions failed');
			}
		},
		services: {
			saveToServer: async (context) => {
				const response = await fetch(`/api/reports/${reportId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ content: context.content, caseId })
				});
				if (!response.ok) throw new Error('Save failed');
				return true;
			},
			getAISuggestions: async (context) => {
				const response = await fetch('/api/ai/suggestions', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ text: context.content, context: { caseId, reportId } })
				});
				if (!response.ok) throw new Error('AI request failed');
				return await response.json();
			}
		}
	});

	const service = interpret(editorMachine);
	service.start();

	onMount(() => {
		enhancedCitationStore.subscribe(citations => {
			// Update suggestions when citations change
		});

		return () => service.stop();
	});

	// Debounced autosave
	const debouncedSave = debounce(() => {
		service.send('SAVE');
	}, 2000);

	// Handle typing and autocomplete trigger
	function handleInput(e: Event) {
		const target = e.target as HTMLDivElement;
		content = target.innerHTML;
		service.send({ type: 'TYPING', content });

		// Check for @ mention trigger
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || '';
			const lastAtIndex = textBefore.lastIndexOf('@');
			
			if (lastAtIndex !== -1 && lastAtIndex === textBefore.length - 1) {
				// Just typed @, show autocomplete
				updateAutocompletePosition();
				loadSuggestions('');
				service.send('SHOW_AUTOCOMPLETE');
			} else if (lastAtIndex !== -1) {
				// Typing after @
				const query = textBefore.substring(lastAtIndex + 1);
				if (query.length > 0 && !query.includes(' ')) {
					autocompleteQuery = query;
					loadSuggestions(query);
					if (!showAutocomplete) {
						service.send('SHOW_AUTOCOMPLETE');
					}
				}
			} else if (showAutocomplete) {
				// No @ found, hide autocomplete
				service.send('HIDE_AUTOCOMPLETE');
			}
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (showAutocomplete) {
			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
					break;
				case 'ArrowUp':
					e.preventDefault();
					selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
					break;
				case 'Enter':
					e.preventDefault();
					if (suggestions[selectedSuggestionIndex]) {
						insertSuggestion(suggestions[selectedSuggestionIndex]);
					}
					break;
				case 'Escape':
					service.send('ESCAPE');
					break;
			}
		}

		// AI suggestion trigger
		if (e.key === '.' && e.ctrlKey) {
			e.preventDefault();
			service.send({ type: 'AI_THINKING', context: { caseId, reportId } });
		}
	}

	function handleMouseUp() {
		const selection = window.getSelection();
		if (selection && !selection.isCollapsed) {
			selectionText = selection.toString().trim();
			if (selectionText.length > 3) {
				updatePopupPosition();
				service.send('SHOW_CITATION_POPUP');
			}
		} else if (showCitationPopup) {
			service.send('CANCEL_CITATION');
		}
	}

	function updateAutocompletePosition() {
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			autocompletePosition = {
				x: rect.left + window.scrollX,
				y: rect.bottom + window.scrollY + 5
			};
		}
	}

	function updatePopupPosition() {
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			popupPosition = {
				x: rect.left + window.scrollX,
				y: rect.bottom + window.scrollY + 5
			};
		}
	}

	async function loadSuggestions(query: string) {
		try {
			const results = await enhancedCitationStore.search(query, 5);
			suggestions = results.map(r => r.item || r);
		} catch (error) {
			console.error('Failed to load suggestions:', error);
			suggestions = [];
		}
	}

	function insertSuggestion(suggestion: any) {
		const citation = `<sup class="citation" data-citation-id="${suggestion.id}">${suggestion.label}</sup>`;
		document.execCommand('insertHTML', false, citation);
		service.send('SELECT_SUGGESTION');
		selectedSuggestionIndex = 0;
	}

	async function saveCitation(label: string) {
		try {
			await enhancedCitationStore.addCitation({
				label,
				content: selectionText,
				sourceType: 'manual',
				caseId,
				reportId,
				tags: []
			});
			
			// Insert citation marker in text
			const citation = `<sup class="citation" data-citation-id="${label}">${label}</sup>`;
			document.execCommand('insertHTML', false, citation);
			
			service.send('SAVE_CITATION');
		} catch (error) {
			console.error('Failed to save citation:', error);
		}
	}

	// Handle drag and drop from citation sidebar
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const citationId = e.dataTransfer?.getData('text/citation-id');
		const citationLabel = e.dataTransfer?.getData('text/citation-label');
		
		if (citationId && citationLabel) {
			const citation = `<sup class="citation" data-citation-id="${citationId}">${citationLabel}</sup>`;
			document.execCommand('insertHTML', false, citation);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	// Reactive updates
	$: showAutocomplete = service.state?.context?.autocompleteVisible || false;
	$: showCitationPopup = service.state?.context?.citationPopupVisible || false;
</script>

<div class="report-editor">
	<div class="editor-toolbar">
		<button on:click={() => document.execCommand('bold')}>Bold</button>
		<button on:click={() => document.execCommand('italic')}>Italic</button>
		<button on:click={() => document.execCommand('underline')}>Underline</button>
		<div class="separator"></div>
		<button on:click={() => service.send('SAVE')} class="save-btn">
			💾 Save
		</button>
		<button on:click={() => service.send({ type: 'AI_THINKING' })} class="ai-btn">
			🤖 AI Assist
		</button>
	</div>

	<div class="editor-container">
		<div
			class="editor"
			contenteditable={editable}
			bind:this={editorEl}
			bind:innerHTML={content}
			on:input={handleInput}
			on:keydown={handleKeyDown}
			on:mouseup={handleMouseUp}
			on:drop={handleDrop}
			on:dragover={handleDragOver}
			spellcheck="true"
		></div>

		<!-- Autocomplete Dropdown -->
		{#if showAutocomplete && suggestions.length > 0}
			<div
				class="autocomplete-dropdown"
				style="top: {autocompletePosition.y}px; left: {autocompletePosition.x}px;"
			>
				{#each suggestions as suggestion, index}
					<div
						class="suggestion-item"
						class:selected={index === selectedSuggestionIndex}
						on:click={() => insertSuggestion(suggestion)}
					>
						<strong>{suggestion.label}</strong>
						<span class="suggestion-preview">{suggestion.content?.substring(0, 60)}...</span>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Citation Popup -->
		{#if showCitationPopup}
			<div
				class="citation-popup"
				style="top: {popupPosition.y}px; left: {popupPosition.x}px;"
			>
				<div class="popup-header">Save as Citation</div>
				<div class="selected-text">"{selectionText}"</div>
				<input
					type="text"
					placeholder="Citation label (e.g., [1])"
					on:keydown={(e) => {
						if (e.key === 'Enter') {
							saveCitation(e.target.value);
						} else if (e.key === 'Escape') {
							service.send('CANCEL_CITATION');
						}
					}}
				/>
				<div class="popup-actions">
					<button on:click={(e) => saveCitation(e.target.previousElementSibling.value)}>
						Save Citation
					</button>
					<button on:click={() => service.send('CANCEL_CITATION')}>Cancel</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.report-editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
	}

	.editor-toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: #f8f9fa;
		border-bottom: 1px solid #ddd;
	}

	.editor-toolbar button {
		padding: 6px 12px;
		border: 1px solid #ccc;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
	}

	.editor-toolbar button:hover {
		background: #e9ecef;
	}

	.save-btn {
		background: #28a745 !important;
		color: white !important;
		border-color: #28a745 !important;
	}

	.ai-btn {
		background: #007bff !important;
		color: white !important;
		border-color: #007bff !important;
	}

	.separator {
		width: 1px;
		height: 20px;
		background: #ddd;
		margin: 0 4px;
	}

	.editor-container {
		position: relative;
		flex: 1;
	}

	.editor {
		width: 100%;
		height: 100%;
		padding: 16px;
		border: none;
		outline: none;
		font-family: 'Georgia', serif;
		font-size: 16px;
		line-height: 1.6;
		resize: none;
		overflow-y: auto;
	}

	.autocomplete-dropdown {
		position: absolute;
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 1000;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		min-width: 300px;
	}

	.suggestion-item {
		padding: 8px 12px;
		cursor: pointer;
		border-bottom: 1px solid #eee;
	}

	.suggestion-item:hover,
	.suggestion-item.selected {
		background: #e3f2fd;
	}

	.suggestion-item strong {
		display: block;
		font-size: 14px;
		color: #333;
	}

	.suggestion-preview {
		display: block;
		font-size: 12px;
		color: #666;
		margin-top: 2px;
	}

	.citation-popup {
		position: absolute;
		background: white;
		border: 1px solid #ccc;
		border-radius: 8px;
		padding: 16px;
		z-index: 1000;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		min-width: 300px;
	}

	.popup-header {
		font-weight: bold;
		margin-bottom: 8px;
		color: #333;
	}

	.selected-text {
		background: #f8f9fa;
		padding: 8px;
		border-radius: 4px;
		font-style: italic;
		margin-bottom: 12px;
		border-left: 3px solid #007bff;
	}

	.citation-popup input {
		width: 100%;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		margin-bottom: 12px;
	}

	.popup-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}

	.popup-actions button {
		padding: 6px 12px;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
	}

	.popup-actions button:first-child {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}

	:global(.citation) {
		background: #e3f2fd;
		padding: 2px 4px;
		border-radius: 3px;
		cursor: pointer;
		user-select: none;
	}

	:global(.citation:hover) {
		background: #bbdefb;
	}
</style>
