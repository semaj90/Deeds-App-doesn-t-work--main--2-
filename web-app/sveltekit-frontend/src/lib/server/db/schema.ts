// Schema selector - automatically uses SQLite for dev, PostgreSQL for prod
// Simple re-export approach for better TypeScript compatibility

// For now, use SQLite schema for development
// This can be switched to dynamic imports later if needed
export * from './schema-sqlite';
