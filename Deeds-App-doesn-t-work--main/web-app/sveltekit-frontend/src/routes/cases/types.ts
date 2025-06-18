import type { Session } from '@auth/sveltekit';

// Define types based on the schema
export interface Case {
  id: string;
  title: string;
  description: string;
  dangerScore?: number;
  aiSummary?: string;
  createdAt: Date | string;
  status: string;
  createdBy: string;
}

// Define PageData that can be used in the +page.svelte file
export interface CasesPageData {
  session: Session | null;
  cases: Case[];
}
