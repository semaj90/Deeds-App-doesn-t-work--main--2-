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
    const newState = ('on' in stateConfig && stateConfig.on && event in stateConfig.on) ? 
      (stateConfig.on as any)[event] as CaseState : undefined;

    if (!newState) return null;

    // Record transition
    this.recordTransition(caseId, currentState, newState, event, userId, reason);

    // Update state
    let caseState = this.caseStates.get(caseId);
    if (caseState) {
      caseState.currentState = newState;
      caseState.availableTransitions = this.getAvailableTransitions(caseId, newState);
    }

    return newState;
  }

  private recordTransition(caseId: string, from: CaseState, to: CaseState, event: CaseEvent, userId?: string, reason?: string) {
    const caseState = this.caseStates.get(caseId);
    if (caseState) {
      caseState.history.push({
        from,
        to,
        event,
        timestamp: new Date(),
        userId,
        reason
      });
    }
  }

  initializeCaseState(caseId: string, initialState: CaseState = 'draft') {
    if (!this.caseStates.has(caseId)) {
      this.caseStates.set(caseId, {
        id: caseId,
        currentState: initialState,
        availableTransitions: this.getAvailableTransitions(caseId, initialState),
        history: []
      });
    }
  }
}

export const caseWorkflowManager = new CaseWorkflowManager();

export const getStateLabel = (state: CaseState): string => {
  return state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getStateColor = (state: CaseState): string => {
  const colors: Record<CaseState, string> = {
    draft: 'bg-gray-200 text-gray-800',
    under_review: 'bg-yellow-200 text-yellow-800',
    active: 'bg-green-200 text-green-800',
    suspended: 'bg-orange-200 text-orange-800',
    closed: 'bg-blue-200 text-blue-800',
    merged: 'bg-purple-200 text-purple-800',
  };
  return colors[state] || 'bg-gray-200 text-gray-800';
};
