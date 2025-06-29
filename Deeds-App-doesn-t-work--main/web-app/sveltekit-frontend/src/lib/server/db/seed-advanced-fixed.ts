import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema-new';
import { resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';

const databasePath = resolve('../../dev.db');
const sqlite = new Database(databasePath);
const db = drizzle(sqlite, { schema });

async function seedAdvancedData() {
  console.log('Seeding advanced features data...');
  
  const adminUserId = 'user_admin01';
  const regularUserId = 'user_regular01';
  
  // Create sample cases
  const case1Id = uuidv4();
  const case2Id = uuidv4();
  const case3Id = uuidv4();
  
  await db.insert(schema.cases).values([
    {
      id: case1Id,
      caseNumber: 'CASE-2024-001',
      title: 'Financial Fraud Investigation',
      description: 'Investigation into a complex financial fraud scheme involving multiple corporations and individuals. The scheme appears to involve fraudulent invoicing, money laundering, and tax evasion.',
      createdBy: adminUserId,
      status: 'investigating',
      priority: 'high',
      category: 'felony',
      dangerScore: 8,
      aiTags: ['fraud', 'financial', 'corporate', 'money-laundering'],
      metadata: {
        caseType: 'fraud',
        originalState: 'under_review'
      }
    },
    {
      id: case2Id,
      caseNumber: 'CASE-2024-002',
      title: 'Cybercrime Network Takedown',
      description: 'Multi-jurisdictional operation to dismantle a cybercrime network engaged in ransomware attacks, data theft, and cryptocurrency fraud.',
      createdBy: adminUserId,
      status: 'investigating',
      priority: 'urgent',
      category: 'felony',
      dangerScore: 9,
      aiTags: ['cybercrime', 'ransomware', 'cryptocurrency', 'international'],
      metadata: {
        caseType: 'cybercrime',
        originalState: 'active'
      }
    },
    {
      id: case3Id,
      caseNumber: 'CASE-2024-003',
      title: 'Environmental Crime - Illegal Dumping',
      description: 'Investigation into illegal dumping of hazardous waste by industrial companies. Environmental impact assessment shows significant contamination of local water sources.',
      createdBy: regularUserId,
      status: 'open',
      priority: 'medium',
      category: 'misdemeanor',
      dangerScore: 6,
      aiTags: ['environmental', 'hazardous-waste', 'contamination', 'industrial'],
      metadata: {
        caseType: 'environmental',
        originalState: 'draft'
      }
    }
  ]);
  
  console.log('✅ Cases seeded successfully');
  
  // TODO: The following tables don't exist in the current schema:
  // - caseEvents (event sourcing pattern)
  // - caseRelationships (case connections)
  // - savedStatements (saved queries)
  // - caseTemplates (case templates)
  // - caseTextFragments (text analysis)
  // - userPreferences (user settings)
  // These would need to be added to the schema before seeding

  console.log('✅ Advanced features data seeded successfully!');
  console.log('Created:');
  console.log('- 3 sample cases with different types and priorities');
  console.log('Note: Additional features (events, relationships, templates, etc.) require schema updates');
}

seedAdvancedData().catch(console.error);
