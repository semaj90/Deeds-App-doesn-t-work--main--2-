/**
 * Transform Sync Module - Fabric.js + MathJS + Svelte Store Integration
 * 
 * Provides:
 * - Synchronized transform operations between Fabric.js and MathJS
 * - Undo/redo functionality with JSON state caching
 * - Matrix operations for precise transformations
 * - Canvas state management with automatic serialization
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import * as math from 'mathjs';
// @ts-ignore - Fabric.js types for Canvas objects
type FabricObject = any;
type FabricCanvas = any;

// Types for our transform system
export interface CanvasState {
	objects: any[];
	metadata: {
		timestamp: number;
		version: string;
		canvasSize: { width: number; height: number };
		zoom: number;
		pan: { x: number; y: number };
	};
}

export interface TransformOperation {
	id: string;
	type: 'translate' | 'rotate' | 'scale' | 'skew' | 'composite';
	objectId: string;
	matrix: number[][]; // 3x3 transformation matrix
	timestamp: number;
	inverse?: number[][]; // For undo operations
}

export interface CacheEntry {
	key: string;
	state: CanvasState;
	timestamp: number;
	size: number; // Serialized size in bytes
}

// Configuration
const UNDO_STACK_LIMIT = 50;
const CACHE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

// Core stores
export const canvasInstance = writable<fabric.Canvas | null>(null);
export const currentState = writable<CanvasState | null>(null);
export const undoStack = writable<CanvasState[]>([]);
export const redoStack = writable<CanvasState[]>([]);
export const transformQueue = writable<TransformOperation[]>([]);
export const isProcessing = writable(false);
export const lastSaved = writable<number>(0);

// Cache management
let stateCache = new Map<string, CacheEntry>();
let cacheSize = 0;

// Derived stores
export const canUndo = derived(undoStack, ($undoStack) => $undoStack.length > 0);
export const canRedo = derived(redoStack, ($redoStack) => $redoStack.length > 0);
export const hasUnsavedChanges = derived(
	[currentState, lastSaved],
	([$currentState, $lastSaved]) => {
		if (!$currentState) return false;
		return $currentState.metadata.timestamp > $lastSaved;
	}
);

/**
 * Matrix utility functions using MathJS
 */
export const MatrixUtils = {	// Create identity matrix
	identity(): number[][] {
		const matrix = math.identity(3) as math.Matrix;
		return matrix.toArray() as number[][];
	},

	// Create translation matrix
	translate(x: number, y: number): number[][] {
		const matrix = math.identity(3) as math.Matrix;
		const arr = matrix.toArray() as number[][];
		arr[0][2] = x;
		arr[1][2] = y;
		return arr;
	},

	// Create rotation matrix
	rotate(angle: number): number[][] {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return [
			[cos, -sin, 0],
			[sin, cos, 0],
			[0, 0, 1]
		];
	},

	// Create scale matrix
	scale(sx: number, sy: number): number[][] {
		return [
			[sx, 0, 0],
			[0, sy, 0],
			[0, 0, 1]
		];
	},

	// Matrix multiplication
	multiply(a: number[][], b: number[][]): number[][] {
		return math.multiply(a, b) as number[][];
	},

	// Matrix inversion
	invert(matrix: number[][]): number[][] {
		try {
			return math.inv(matrix) as number[][];
		} catch (error) {
			console.warn('Matrix inversion failed:', error);
			return MatrixUtils.identity();
		}
	},

	// Apply matrix to point
	transformPoint(matrix: number[][], point: { x: number; y: number }): { x: number; y: number } {
		const result = math.multiply(matrix, [point.x, point.y, 1]) as number[];
		return { x: result[0], y: result[1] };
	},

	// Convert Fabric.js transform to matrix
	fabricToMatrix(obj: fabric.Object): number[][] {
		const matrix = obj.calcTransformMatrix();
		return [
			[matrix[0], matrix[1], matrix[4]],
			[matrix[2], matrix[3], matrix[5]],
			[0, 0, 1]
		];
	},

	// Convert matrix to Fabric.js transform
	matrixToFabric(matrix: number[][]): number[] {
		return [matrix[0][0], matrix[1][0], matrix[0][1], matrix[1][1], matrix[0][2], matrix[1][2]];
	}
};

/**
 * Cache management functions
 */
export const CacheManager = {
	// Add state to cache
	set(key: string, state: CanvasState): void {
		const serialized = JSON.stringify(state);
		const size = new Blob([serialized]).size;

		// Check if we need to clear cache
		if (cacheSize + size > CACHE_SIZE_LIMIT) {
			CacheManager.clearOldest();
		}

		const entry: CacheEntry = {
			key,
			state: JSON.parse(serialized), // Deep clone
			timestamp: Date.now(),
			size
		};

		stateCache.set(key, entry);
		cacheSize += size;
	},

	// Get state from cache
	get(key: string): CanvasState | null {
		const entry = stateCache.get(key);
		if (!entry) return null;

		// Update access time
		entry.timestamp = Date.now();
		return JSON.parse(JSON.stringify(entry.state)); // Deep clone
	},

	// Clear oldest entries to make space
	clearOldest(): void {
		const entries = Array.from(stateCache.entries())
			.sort((a, b) => a[1].timestamp - b[1].timestamp);

		while (cacheSize > CACHE_SIZE_LIMIT * 0.7 && entries.length > 0) {
			const [key, entry] = entries.shift()!;
			stateCache.delete(key);
			cacheSize -= entry.size;
		}
	},

	// Clear all cache
	clear(): void {
		stateCache.clear();
		cacheSize = 0;
	},

	// Get cache stats
	getStats(): { size: number; entries: number; totalSize: number } {
		return {
			size: stateCache.size,
			entries: stateCache.size,
			totalSize: cacheSize
		};
	}
};

/**
 * State management functions
 */
export const StateManager = {
	// Capture current canvas state
	captureState(canvas: fabric.Canvas): CanvasState {
		const objects = canvas.toObject().objects;
		const zoom = canvas.getZoom();
		const vpt = canvas.viewportTransform;

		return {
			objects,
			metadata: {
				timestamp: Date.now(),
				version: '1.0.0',
				canvasSize: {
					width: canvas.getWidth(),
					height: canvas.getHeight()
				},
				zoom,
				pan: {
					x: vpt ? vpt[4] : 0,
					y: vpt ? vpt[5] : 0
				}
			}
		};
	},

	// Restore canvas from state
	async restoreState(canvas: fabric.Canvas, state: CanvasState): Promise<void> {
		isProcessing.set(true);

		try {
			// Clear canvas
			canvas.clear();

			// Restore canvas size and viewport
			canvas.setWidth(state.metadata.canvasSize.width);
			canvas.setHeight(state.metadata.canvasSize.height);
			canvas.setZoom(state.metadata.zoom);

			if (state.metadata.pan) {
				canvas.absolutePan({ x: state.metadata.pan.x, y: state.metadata.pan.y });
			}

			// Restore objects
			if (state.objects && state.objects.length > 0) {
				await new Promise<void>((resolve) => {
					canvas.loadFromJSON({ objects: state.objects }, () => {
						canvas.renderAll();
						resolve();
					});
				});
			}

			currentState.set(state);
		} finally {
			isProcessing.set(false);
		}
	},

	// Save current state to undo stack
	saveToUndoStack(): void {
		const canvas = get(canvasInstance);
		if (!canvas) return;

		const state = StateManager.captureState(canvas);
		const $undoStack = get(undoStack);
		const $redoStack = get(redoStack);

		// Add to undo stack
		const newUndoStack = [...$undoStack, state];

		// Limit stack size
		if (newUndoStack.length > UNDO_STACK_LIMIT) {
			newUndoStack.shift();
		}

		undoStack.set(newUndoStack);
		redoStack.set([]); // Clear redo stack on new action
		currentState.set(state);

		// Cache the state
		const cacheKey = `state_${state.metadata.timestamp}`;
		CacheManager.set(cacheKey, state);
	}
};

/**
 * Transform operations
 */
export const TransformManager = {
	// Queue a transform operation
	queueTransform(operation: TransformOperation): void {
		const $queue = get(transformQueue);
		transformQueue.set([...$queue, operation]);
		TransformManager.processQueue();
	},

	// Process queued transforms
	async processQueue(): Promise<void> {
		const canvas = get(canvasInstance);
		const $queue = get(transformQueue);

		if (!canvas || $queue.length === 0 || get(isProcessing)) return;

		isProcessing.set(true);

		try {
			for (const operation of $queue) {
				await TransformManager.applyTransform(canvas, operation);
			}

			// Clear queue and save state
			transformQueue.set([]);
			StateManager.saveToUndoStack();
		} finally {
			isProcessing.set(false);
		}
	},

	// Apply a single transform operation
	async applyTransform(canvas: fabric.Canvas, operation: TransformOperation): Promise<void> {
		const obj = canvas.getObjects().find(o => (o as any).id === operation.objectId);
		if (!obj) return;

		const fabricMatrix = MatrixUtils.matrixToFabric(operation.matrix);

		// Apply transform based on type
		switch (operation.type) {
			case 'translate':
				obj.set({
					left: obj.left! + operation.matrix[0][2],
					top: obj.top! + operation.matrix[1][2]
				});
				break;

			case 'scale':
				obj.set({
					scaleX: (obj.scaleX || 1) * operation.matrix[0][0],
					scaleY: (obj.scaleY || 1) * operation.matrix[1][1]
				});
				break;

			case 'rotate':
				const angle = Math.atan2(operation.matrix[1][0], operation.matrix[0][0]);
				obj.set({ angle: obj.angle! + (angle * 180) / Math.PI });
				break;			case 'composite':
				// Apply full transformation matrix
				(obj as any).transformMatrix = fabricMatrix;
				break;
		}

		obj.setCoords();
		canvas.renderAll();
	},

	// Create transform operation
	createTransform(
		type: TransformOperation['type'],
		objectId: string,
		matrix: number[][]
	): TransformOperation {
		return {
			id: `transform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			type,
			objectId,
			matrix,
			timestamp: Date.now(),
			inverse: MatrixUtils.invert(matrix)
		};
	}
};

/**
 * Undo/Redo functionality
 */
export const UndoRedoManager = {
	// Undo last operation
	async undo(): Promise<void> {
		const canvas = get(canvasInstance);
		const $undoStack = get(undoStack);
		const $redoStack = get(redoStack);

		if (!canvas || $undoStack.length === 0) return;

		// Save current state to redo stack
		const currentStateValue = StateManager.captureState(canvas);
		redoStack.set([...$redoStack, currentStateValue]);

		// Get previous state
		const newUndoStack = [...$undoStack];
		const previousState = newUndoStack.pop()!;
		undoStack.set(newUndoStack);

		// Restore previous state
		await StateManager.restoreState(canvas, previousState);
	},

	// Redo last undone operation
	async redo(): Promise<void> {
		const canvas = get(canvasInstance);
		const $undoStack = get(undoStack);
		const $redoStack = get(redoStack);

		if (!canvas || $redoStack.length === 0) return;

		// Save current state to undo stack
		const currentStateValue = StateManager.captureState(canvas);
		undoStack.set([...$undoStack, currentStateValue]);

		// Get next state
		const newRedoStack = [...$redoStack];
		const nextState = newRedoStack.pop()!;
		redoStack.set(newRedoStack);

		// Restore next state
		await StateManager.restoreState(canvas, nextState);
	}
};

/**
 * Auto-save functionality
 */
let autoSaveInterval: NodeJS.Timeout | null = null;

export const AutoSaveManager = {
	// Start auto-save
	start(): void {
		if (!browser || autoSaveInterval) return;

		autoSaveInterval = setInterval(async () => {
			const canvas = get(canvasInstance);
			const $hasUnsavedChanges = get(hasUnsavedChanges);

			if (canvas && $hasUnsavedChanges) {
				await AutoSaveManager.save();
			}
		}, AUTO_SAVE_INTERVAL);
	},

	// Stop auto-save
	stop(): void {
		if (autoSaveInterval) {
			clearInterval(autoSaveInterval);
			autoSaveInterval = null;
		}
	},

	// Save current state
	async save(): Promise<void> {
		const canvas = get(canvasInstance);
		if (!canvas) return;

		try {
			const state = StateManager.captureState(canvas);

			// Save to API
			const response = await fetch('/api/canvas/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(state)
			});

			if (response.ok) {
				lastSaved.set(Date.now());
				console.log('Canvas auto-saved successfully');
			}
		} catch (error) {
			console.error('Auto-save failed:', error);
		}
	}
};

/**
 * Initialize the transform sync system
 */
export function initializeTransformSync(canvas: fabric.Canvas): void {
	// Set canvas instance
	canvasInstance.set(canvas);

	// Set up event listeners
	canvas.on('object:modified', () => {
		StateManager.saveToUndoStack();
	});

	canvas.on('path:created', () => {
		StateManager.saveToUndoStack();
	});

	canvas.on('object:added', () => {
		StateManager.saveToUndoStack();
	});

	canvas.on('object:removed', () => {
		StateManager.saveToUndoStack();
	});

	// Initialize with current state
	StateManager.saveToUndoStack();

	// Start auto-save
	AutoSaveManager.start();

	console.log('Transform sync system initialized');
}

/**
 * Cleanup function
 */
export function cleanupTransformSync(): void {
	AutoSaveManager.stop();
	CacheManager.clear();
	canvasInstance.set(null);
	currentState.set(null);
	undoStack.set([]);
	redoStack.set([]);
	transformQueue.set([]);
}

// Helper functions for common operations
export const helpers = {
	// Quick translate
	translate(objectId: string, x: number, y: number): void {
		const matrix = MatrixUtils.translate(x, y);
		const operation = TransformManager.createTransform('translate', objectId, matrix);
		TransformManager.queueTransform(operation);
	},

	// Quick rotate
	rotate(objectId: string, angle: number): void {
		const matrix = MatrixUtils.rotate(angle);
		const operation = TransformManager.createTransform('rotate', objectId, matrix);
		TransformManager.queueTransform(operation);
	},

	// Quick scale
	scale(objectId: string, sx: number, sy: number = sx): void {
		const matrix = MatrixUtils.scale(sx, sy);
		const operation = TransformManager.createTransform('scale', objectId, matrix);
		TransformManager.queueTransform(operation);
	},

	// Composite transform
	transform(objectId: string, matrix: number[][]): void {
		const operation = TransformManager.createTransform('composite', objectId, matrix);
		TransformManager.queueTransform(operation);
	}
};
