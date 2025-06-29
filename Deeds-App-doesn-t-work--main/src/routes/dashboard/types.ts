import type { User, Case, Criminal } from '../../lib/server/db/schema';

export interface DashboardStats {
  totalCases: number;
  totalCriminals: number;
  openCases: number;
  activeCriminals: number;
}

export interface SearchResults {
  cases: Case[];
  criminals: Criminal[];
}

export interface CaseStats {
  total: number;
  status: string;
}

export interface CriminalStats {
  total: number;
  threatLevel: string;
}

export interface DashboardData {
  user: User;
  recentCases: Case[];
  highPriorityCases?: Case[];
  recentCriminals: Criminal[];
  highThreatCriminals?: Criminal[];
  caseStats?: CaseStats[];
  criminalStats?: CriminalStats[];
  searchResults?: SearchResults;
  searchTerm?: string;
  dashboardStats?: DashboardStats;
  error?: string;
}
