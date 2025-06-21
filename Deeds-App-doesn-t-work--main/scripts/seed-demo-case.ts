import { db, closeDbConnection } from '../web-app/sveltekit-frontend/src/lib/server/db';
import { cases, users } from '../web-app/sveltekit-frontend/src/lib/server/db/schema-new'; // Use unified schema
import { eq } from 'drizzle-orm'; // Ensure eq is imported

async function seedDemoCase() {
	// Find an admin or fallback user for createdBy
	let adminUser = await db.query.users.findFirst({ where: eq(users.email, 'admin@example.com') });
	if (!adminUser) {
		adminUser = await db.query.users.findFirst();
	}
	if (!adminUser) {
		throw new Error('No user found to assign as case creator. Please seed users first.');
	}
	const createdBy = adminUser.id;

	const existing = await db.query.cases.findFirst({ where: eq(cases.title, 'State v. John Doe') });
	if (existing) {
		console.log('ℹ️ Demo case "State v. John Doe" already exists.');
		return;
	}

	console.log('🌱 Seeding demo case "State v. John Doe"...');
	await db.insert(cases).values({
		title: 'State v. John Doe',
		description:
			'A high-profile case involving alleged financial fraud by John Doe, a local business owner. The case includes multiple pieces of evidence and several witness testimonies.',
		createdBy,
		status: 'active',
		aiSummary: 'A demo case for testing and development.',
		aiTags: ['fraud', 'demo'],
		dangerScore: 2
	});

	console.log('✅ Demo case seeded successfully!');
}

seedDemoCase().catch((err) => {
  console.error('Error seeding demo case:', err);
  process.exit(1);
}).finally(async () => {
	console.log('Closing database connection.');
	await closeDbConnection();
});
