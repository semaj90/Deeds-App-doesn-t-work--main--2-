// State Machine for Case Management Workflows
import { writable, derived, type Readable } from 'svelte/store';

export type CaseState = 'draft' | 'under_review' | 'active' | 'suspended' | 'closed' | 'merged';
export type CaseEvent = 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CLOSE' | 'SUSPEND' | 'REACTIVATE' | 'MERGE';

export interface CaseStateMachine {
  id: string;
  currentState: CaseState;
  availableTransitions: CaseEvent[];
  history: CaseStateTransition[];
}

export interface CaseStateTransition {
  from: CaseState;
  to: CaseState;
  event: CaseEvent;
  timestamp: Date;
  userId?: string;
  reason?: string;
}

// State machine configuration
export const caseStateMachine = {
  initial: 'draft' as CaseState,
  states: {
    draft: {
      on: {
        SUBMIT: 'under_review',
        MERGE: 'merged'
      }
    },
    under_review: {
      on: {
        APPROVE: 'active',
        REJECT: 'draft',
        MERGE: 'merged'
      }
    },
    active: {
      on: {
        CLOSE: 'closed',
        SUSPEND: 'suspended',
        MERGE: 'merged'
      }
    },
    suspended: {
      on: {
        REACTIVATE: 'active',
        CLOSE: 'closed',
        MERGE: 'merged'
      }
    },
    closed: {
      on: {
        REACTIVATE: 'active',
        MERGE: 'merged'
      }
    },
    merged: {
      type: 'final' as const
    }
  }
};

// Add a type guard for 'on' property
function getAvailableEvents(stateConfig: any): CaseEvent[] {
  if (!stateConfig || typeof stateConfig !== 'object') return [];
  if ('on' in stateConfig && stateConfig.on) {
    return Object.keys(stateConfig.on) as CaseEvent[];
  }
  return [];
}

export class CaseWorkflowManager {
  private caseStates = new Map<string, CaseStateMachine>();

  getAvailableTransitions(caseId: string, currentState: CaseState): CaseEvent[] {
    const stateConfig = caseStateMachine.states[currentState];
    const availableEvents = getAvailableEvents(stateConfig);
    return availableEvents;
  }

  canTransition(caseId: string, currentState: CaseState, event: CaseEvent): boolean {
    const availableTransitions = this.getAvailableTransitions(caseId, currentState);
    return availableTransitions.includes(event);
  }

  transition(caseId: string, currentState: CaseState, event: CaseEvent, userId?: string, reason?: string): CaseState | null {
    if (!this.canTransition(caseId, currentState, event)) {
      return null;
    }

    const stateConfig = caseStateMachine.states[currentState];
    const newState = ('on' in stateConfig && stateConfig.on) ? stateConfig.on[event] as CaseState : undefined;

    if (!newState) return null;

    // Record transition
    this.recordTransition(caseId, currentState, newState, event, userId, reason);

    return newState;
  }

  private recordTransition(caseId: string, from: CaseState, to: CaseState, event: CaseEvent, userId?: string, reason?: string) {
    const transition: CaseStateTransition = {
      from,
      to,
      event,
      timestamp: new Date(),
      userId,
      reason
    };

    // This would typically be saved to the database
    console.log(`Case ${caseId} transitioned from ${from} to ${to} via ${event}`, transition);
  }

  getCaseStateMachine(caseId: string): CaseStateMachine | undefined {
    return this.caseStates.get(caseId);
  }

  initializeCaseStateMachine(caseId: string, initialState: CaseState = 'draft'): CaseStateMachine {
    const stateMachine: CaseStateMachine = {
      id: caseId,
      currentState: initialState,
      availableTransitions: this.getAvailableTransitions(caseId, initialState),
      history: []
    };

    this.caseStates.set(caseId, stateMachine);
    return stateMachine;
  }
}

// Global instance
export const caseWorkflowManager = new CaseWorkflowManager();

// Svelte stores for reactive state management
export const activeCaseState = writable<CaseState>('draft');
export const availableTransitions = derived(
  activeCaseState,
  ($state) => caseWorkflowManager.getAvailableTransitions('current', $state)
);

// Helper functions for state management
export function getStateColor(state: CaseState): string {
  switch (state) {
    case 'draft': return 'bg-gray-500';
    case 'under_review': return 'bg-yellow-500';
    case 'active': return 'bg-blue-500';
    case 'suspended': return 'bg-orange-500';
    case 'closed': return 'bg-green-500';
    case 'merged': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
}

export function getStateLabel(state: CaseState): string {
  switch (state) {
    case 'draft': return 'Draft';
    case 'under_review': return 'Under Review';
    case 'active': return 'Active';
    case 'suspended': return 'Suspended';
    case 'closed': return 'Closed';
    case 'merged': return 'Merged';
    default: return 'Unknown';
  }
}
