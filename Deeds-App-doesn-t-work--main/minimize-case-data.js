#!/usr/bin/env node

/**
 * Minimize Case Data
 * Reduce the number of cases to a very small set for testing
 */

import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

async function minimizeCaseData() {
  console.log('🗂️ Minimizing case data to very small set...\n');

  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/prosecutor_app';
  
  const sql = postgres(connectionString);

  try {
    console.log('📊 Connected to database...');

    // Check current case count
    const currentCases = await sql`SELECT COUNT(*) as count FROM cases`;
    console.log(`📋 Current cases: ${currentCases[0].count}`);

    // Keep only 3 test cases
    console.log('\n🗑️ Removing excess cases...');
    
    // First, get the IDs of the first 3 cases
    const keepCases = await sql`
      SELECT id FROM cases 
      ORDER BY created_at ASC 
      LIMIT 3
    `;

    if (keepCases.length > 0) {
      const keepIds = keepCases.map(c => c.id);
      
      // Delete related data first (foreign key constraints)
      await sql`DELETE FROM case_activities WHERE case_id NOT IN (${sql(keepIds)})`;
      await sql`DELETE FROM case_criminals WHERE case_id NOT IN (${sql(keepIds)})`;
      await sql`DELETE FROM crimes WHERE case_id NOT IN (${sql(keepIds)})`;
      await sql`DELETE FROM evidence WHERE case_id NOT IN (${sql(keepIds)})`;
      
      // Delete the excess cases
      await sql`DELETE FROM cases WHERE id NOT IN (${sql(keepIds)})`;
    } else {
      console.log('⚠️ No cases found, creating minimal test set...');
      
      // Create 3 minimal test cases
      const testCases = [
        {
          id: crypto.randomUUID(),
          title: 'Test Case Alpha',
          description: 'Minimal test case for development',
          status: 'open',
          priority: 'medium'
        },
        {
          id: crypto.randomUUID(),
          title: 'Test Case Beta', 
          description: 'Another minimal test case',
          status: 'investigating',
          priority: 'high'
        },
        {
          id: crypto.randomUUID(),
          title: 'Test Case Gamma',
          description: 'Final minimal test case',
          status: 'closed',
          priority: 'low'
        }
      ];

      for (const testCase of testCases) {
        await sql`
          INSERT INTO cases (id, title, description, status, priority, created_at, updated_at)
          VALUES (${testCase.id}, ${testCase.title}, ${testCase.description}, 
                  ${testCase.status}, ${testCase.priority}, NOW(), NOW())
        `;
      }
    }

    // Check final case count
    const finalCases = await sql`SELECT COUNT(*) as count FROM cases`;
    console.log(`✅ Final cases: ${finalCases[0].count}`);

    // Also minimize criminals to a small set
    console.log('\n👥 Minimizing criminals data...');
    const currentCriminals = await sql`SELECT COUNT(*) as count FROM criminals`;
    console.log(`📋 Current criminals: ${currentCriminals[0].count}`);

    const keepCriminals = await sql`
      SELECT id FROM criminals 
      ORDER BY created_at ASC 
      LIMIT 2
    `;

    if (keepCriminals.length > 0) {
      const keepCriminalIds = keepCriminals.map(c => c.id);
      await sql`DELETE FROM case_criminals WHERE criminal_id NOT IN (${sql(keepCriminalIds)})`;
      await sql`DELETE FROM crimes WHERE criminal_id NOT IN (${sql(keepCriminalIds)})`;
      await sql`DELETE FROM evidence WHERE criminal_id NOT IN (${sql(keepCriminalIds)})`;
      await sql`DELETE FROM criminals WHERE id NOT IN (${sql(keepCriminalIds)})`;
    }

    const finalCriminals = await sql`SELECT COUNT(*) as count FROM criminals`;
    console.log(`✅ Final criminals: ${finalCriminals[0].count}`);

    console.log('\n🎉 Data minimization complete!');
    console.log('\n📊 Final Summary:');
    console.log(`✅ Cases: ${finalCases[0].count} (very small set)`);
    console.log(`✅ Criminals: ${finalCriminals[0].count} (minimal set)`);
    console.log('✅ System ready for development with minimal data');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

minimizeCaseData().catch(console.error);
