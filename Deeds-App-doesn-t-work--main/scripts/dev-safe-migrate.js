import { execSync } from 'child_process';

if (process.env.NODE_ENV === 'production') {
	console.error('❌ Refusing to run migrations in production. Use a different script.');
	process.exit(1);
}

try {
	console.log('🧪 Running development-safe migrations...');
	execSync('drizzle-kit migrate', { stdio: 'inherit' });
	// execSync('drizzle-kit push', { stdio: 'inherit' }); // Test push alone
	console.log('✅ Migrations applied.');
} catch (err) {
	console.error('❌ Migration failed:', err.message);
	process.exit(1);
}