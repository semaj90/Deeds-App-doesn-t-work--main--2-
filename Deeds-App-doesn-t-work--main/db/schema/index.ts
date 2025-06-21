// Shared Database Schema for Prosecutor Monorepo
// Used across SvelteKit Web App, Tauri Desktop, and Flutter Mobile

// Export all tables and relations from each schema file
export * from './auth';
export * from './cases';
export * from './evidence';
export * from './legal';
export * from './ai';
export * from './reporting';

// Re-export utilities
export * from './_shared';

// Schema summary for documentation:
/*
TABLES BY CATEGORY:

🔐 Authentication & Users:
- users, sessions, account, verificationToken, userPreferences

📋 Case Management:
- cases, caseEvents, caseRelationships, caseTemplates, caseActivities

📄 Evidence Management:
- evidence, evidenceFiles, evidenceAnchorPoints

⚖️ Legal Entities:
- criminals, crimes, statutes, lawParagraphs, caseCriminals

🤖 AI & Analytics:
- aiAnalyses, contentEmbeddings, nlpAnalysisCache, savedStatements, 
  caseTextFragments, searchTags

📊 Reporting & System:
- reports, caseRelationshipFeedback, caseEvidenceSummaries

USAGE EXAMPLES:

// SvelteKit Web App
import { users, cases, evidence } from '$db/schema';

// Tauri/Rust (via HTTP API)
// Connect to same PostgreSQL instance

// Flutter Mobile (via HTTP API)
// Connect through SvelteKit API endpoints

CONNECTION STRING (all apps):
postgres://postgres:postgres@localhost:5432/prosecutor_app
*/
