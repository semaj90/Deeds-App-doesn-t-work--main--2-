import { writable, derived, get } from 'svelte/store';

export interface DragDropItem {
  id: string;
  type: 'evidence' | 'case' | 'criminal' | 'file';
  title: string;
  description?: string;
  status?: string;
  metadata?: Record<string, any>;
  position?: { x: number; y: number };
}

export interface DragDropZone {
  id: string;
  title: string;
  accepts: string[];
  items: DragDropItem[];
  maxItems?: number;
  className?: string;
}

export interface DragDropState {
  draggedItem: DragDropItem | null;
  zones: DragDropZone[];
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}

const initialState: DragDropState = {
  draggedItem: null,
  zones: [],
  isDragging: false,
  dragOffset: { x: 0, y: 0 }
};

// Create the main store
const dragDropStore = writable<DragDropState>(initialState);

// Create derived stores for individual properties
export const draggedItem = derived(dragDropStore, state => state.draggedItem);
export const zones = derived(dragDropStore, state => state.zones);
export const isDragging = derived(dragDropStore, state => state.isDragging);
export const dragOffset = derived(dragDropStore, state => state.dragOffset);

class DragDropManager {
  // Make the store subscribable
  subscribe = dragDropStore.subscribe;

  startDrag(item: DragDropItem, event: DragEvent | MouseEvent) {
    dragDropStore.update(state => ({
      ...state,
      draggedItem: item,
      isDragging: true,
      dragOffset: event instanceof MouseEvent 
        ? (() => {
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            return {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            };
          })()
        : { x: 0, y: 0 }
    }));

    // Add visual feedback
    document.body.classList.add('dragging');
  }

  endDrag() {
    dragDropStore.update(state => ({
      ...state,
      draggedItem: null,
      isDragging: false,
      dragOffset: { x: 0, y: 0 }
    }));
    document.body.classList.remove('dragging');
  }
  async dropItem(targetZoneId: string, item: DragDropItem): Promise<boolean> {
    const currentState = get(dragDropStore);
    const targetZone = currentState.zones.find(z => z.id === targetZoneId);
    const sourceZone = currentState.zones.find(z => z.items.some(i => i.id === item.id));

    if (!targetZone) return false;

    // Check if zone accepts this item type
    if (!targetZone.accepts.includes(item.type)) {
      return false;
    }

    // Check max items limit
    if (targetZone.maxItems && targetZone.items.length >= targetZone.maxItems) {
      return false;
    }

    dragDropStore.update(state => {
      const newState = { ...state };
      const newZones = newState.zones.map(zone => ({ ...zone, items: [...zone.items] }));
      
      const newTargetZone = newZones.find(z => z.id === targetZoneId);
      const newSourceZone = newZones.find(z => z.items.some(i => i.id === item.id));

      // Remove from source zone
      if (newSourceZone) {
        newSourceZone.items = newSourceZone.items.filter(i => i.id !== item.id);
      }

      // Add to target zone
      if (newTargetZone) {
        newTargetZone.items.push(item);
      }

      return {
        ...newState,
        zones: newZones,
        draggedItem: null,
        isDragging: false,
        dragOffset: { x: 0, y: 0 }
      };
    });

    // Emit custom event for handling
    this.emitDropEvent(sourceZone?.id, targetZoneId, item);
    
    return true;
  }
  private emitDropEvent(sourceZoneId: string | undefined, targetZoneId: string, item: DragDropItem) {
    const event = new CustomEvent('itemDropped', {
      detail: {
        sourceZoneId,
        targetZoneId,
        item
      }
    });
    document.dispatchEvent(event);
  }

  createZone(zone: DragDropZone) {
    dragDropStore.update(state => {
      const newZones = [...state.zones];
      const existingIndex = newZones.findIndex(z => z.id === zone.id);
      if (existingIndex >= 0) {
        newZones[existingIndex] = zone;
      } else {
        newZones.push(zone);
      }
      return { ...state, zones: newZones };
    });
  }

  removeZone(zoneId: string) {
    dragDropStore.update(state => ({
      ...state,
      zones: state.zones.filter(z => z.id !== zoneId)
    }));
  }

  updateZone(zoneId: string, updates: Partial<DragDropZone>) {
    dragDropStore.update(state => {
      const newZones = state.zones.map(zone => 
        zone.id === zoneId ? { ...zone, ...updates } : zone
      );
      return { ...state, zones: newZones };
    });
  }
  moveItemWithinZone(zoneId: string, fromIndex: number, toIndex: number) {
    dragDropStore.update(state => {
      const newZones = state.zones.map(zone => {
        if (zone.id === zoneId && zone.items.length > Math.max(fromIndex, toIndex)) {
          const newItems = [...zone.items];
          const [movedItem] = newItems.splice(fromIndex, 1);
          newItems.splice(toIndex, 0, movedItem);
          return { ...zone, items: newItems };
        }
        return zone;
      });
      return { ...state, zones: newZones };
    });
  }

  sortZoneItems(zoneId: string, compareFn: (a: DragDropItem, b: DragDropItem) => number) {
    dragDropStore.update(state => {
      const newZones = state.zones.map(zone => {
        if (zone.id === zoneId) {
          const sortedItems = [...zone.items].sort(compareFn);
          return { ...zone, items: sortedItems };
        }
        return zone;
      });
      return { ...state, zones: newZones };
    });
  }

  filterZoneItems(zoneId: string, predicate: (item: DragDropItem) => boolean) {
    dragDropStore.update(state => {
      const newZones = state.zones.map(zone => {
        if (zone.id === zoneId) {
          const filteredItems = zone.items.filter(predicate);
          return { ...zone, items: filteredItems };
        }
        return zone;
      });
      return { ...state, zones: newZones };
    });
  }

  getItemsByType(type: string): DragDropItem[] {
    const state = get(dragDropStore);
    return state.zones.flatMap(zone => zone.items.filter(item => item.type === type));
  }

  searchItems(query: string): DragDropItem[] {
    const state = get(dragDropStore);
    return state.zones.flatMap(zone => 
      zone.items.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
      )
    );
  }
}

export const dragDropManager = new DragDropManager();

// CSS classes for drag and drop states
export const dragDropClasses = {
  draggable: 'cursor-move transition-transform hover:scale-105',
  dragging: 'opacity-50 scale-95 z-50',
  dropZone: 'border-2 border-dashed border-transparent transition-colors min-h-[100px]',
  dropZoneActive: 'border-primary bg-primary/10',
  dropZoneInvalid: 'border-error bg-error/10',
  item: 'bg-base-100 rounded-lg p-3 shadow-sm border border-base-300',
  itemDragging: 'transform rotate-3 shadow-lg',
};
