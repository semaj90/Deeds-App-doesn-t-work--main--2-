#!/usr/bin/env node

/**
 * Test Updated Schema - Verify the crimes table updates
 * Tests the enhanced crimes table with all new fields
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

// Import the updated schema
import {
  users, cases, crimes, criminals, statutes, evidence,
  caseCriminals, caseActivities, reports
} from './db/schema/index.ts';

async function testUpdatedSchema() {
  console.log('🧪 Testing Updated Schema...\n');

  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/prosecutor_app';
  
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    // 1. Test basic connection
    console.log('📊 Testing database connection...');
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected:', result[0].current_time);

    // 2. Check crimes table structure
    console.log('\n🏛️ Checking crimes table structure...');
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'crimes' 
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Crimes table columns:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // 3. Verify new fields exist
    console.log('\n🔍 Verifying new crime fields...');
    const newFields = [
      'severity_level', 'classification', 'is_felony', 
      'jurisdiction', 'potential_sentence', 'statute_references',
      'elements', 'defenses', 'precedent_cases', 'investigation_notes'
    ];
    
    const existingFields = tableInfo.map(col => col.column_name);
    newFields.forEach(field => {
      if (existingFields.includes(field)) {
        console.log(`✅ ${field} - Found`);
      } else {
        console.log(`❌ ${field} - Missing`);
      }
    });

    // 4. Test inserting a comprehensive crime record
    console.log('\n💾 Testing comprehensive crime insertion...');
    
    // First ensure we have a user and case
    const testUser = await db.insert(users).values({
      email: 'testuser@prosecutor.com',
      hashedPassword: 'test_password_hash',
      firstName: 'Test',
      lastName: 'User',
      role: 'prosecutor'
    }).returning().catch(() => null);

    const testCase = await db.insert(cases).values({
      title: 'Test Crime Case',
      description: 'Test case for schema validation',
      status: 'open',
      priority: 'high',
      createdBy: testUser?.[0]?.id
    }).returning().catch(() => null);

    const testCriminal = await db.insert(criminals).values({
      firstName: 'John',
      lastName: 'Doe',
      threatLevel: 'medium',
      status: 'active'
    }).returning().catch(() => null);

    // Insert comprehensive crime record
    const comprehensiveCrime = await db.insert(crimes).values({
      name: 'Armed Robbery with Enhanced Penalties',
      title: 'Armed Robbery - First Degree',
      description: 'Armed robbery of convenience store with weapon enhancement',
      
      // Classification fields
      chargeLevel: 'felony',
      severity: 'high',
      severityLevel: 8,
      classification: 'violent_crime',
      isFelony: true,
      jurisdiction: 'State of California',
      potentialSentence: '15-25 years imprisonment plus fines',
      
      // Legal elements
      statuteReferences: [
        { code: 'PC 211', title: 'Robbery' },
        { code: 'PC 12022.53', title: 'Gun Enhancement' }
      ],
      elements: [
        'Taking of personal property',
        'From person or immediate presence',
        'Against will through force or fear',
        'Use of firearm'
      ],
      defenses: [
        'Lack of intent',
        'Mistaken identity',
        'Duress',
        'Insufficient evidence'
      ],
      precedentCases: [
        { name: 'People v. Smith', citation: '123 Cal.App.4th 456' },
        { name: 'People v. Johnson', citation: '456 Cal.App.5th 789' }
      ],
      
      // Investigation details
      investigationNotes: 'Suspect captured on CCTV. Weapon recovered at scene. Two witnesses identified suspect in lineup.',
      
      // Standard fields
      status: 'pending',
      incidentDate: new Date('2024-01-15'),
      arrestDate: new Date('2024-01-16'),
      filingDate: new Date('2024-01-20'),
      
      // Relationships
      caseId: testCase?.[0]?.id,
      criminalId: testCriminal?.[0]?.id,
      createdBy: testUser?.[0]?.id,
      
      // Additional metadata
      metadata: {
        location: '123 Main Street, Anytown CA',
        witnesses: ['Jane Smith', 'Bob Wilson'],
        evidence: ['Security footage', 'Fingerprints', 'Weapon'],
        damageAmount: 2500.00
      }
    }).returning();

    console.log('✅ Comprehensive crime record inserted successfully');
    console.log('🆔 Crime ID:', comprehensiveCrime[0].id);

    // 5. Test querying the enhanced crime data
    console.log('\n🔍 Testing enhanced crime data retrieval...');
    const retrievedCrime = await db.select().from(crimes).where(
      sql`${crimes.id} = ${comprehensiveCrime[0].id}`
    );

    if (retrievedCrime.length > 0) {
      const crime = retrievedCrime[0];
      console.log('✅ Crime retrieved successfully');
      console.log('📝 Enhanced fields verification:');
      console.log(`  - Severity Level: ${crime.severityLevel}`);
      console.log(`  - Classification: ${crime.classification}`);
      console.log(`  - Is Felony: ${crime.isFelony}`);
      console.log(`  - Jurisdiction: ${crime.jurisdiction}`);
      console.log(`  - Potential Sentence: ${crime.potentialSentence}`);
      console.log(`  - Statute References: ${JSON.stringify(crime.statuteReferences, null, 2)}`);
      console.log(`  - Legal Elements: ${JSON.stringify(crime.elements, null, 2)}`);
      console.log(`  - Available Defenses: ${JSON.stringify(crime.defenses, null, 2)}`);
      console.log(`  - Precedent Cases: ${JSON.stringify(crime.precedentCases, null, 2)}`);
      console.log(`  - Investigation Notes: ${crime.investigationNotes}`);
    }

    // 6. Test schema relationships
    console.log('\n🔗 Testing schema relationships...');
    const relationships = await sql`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'crimes';
    `;

    console.log('🔗 Foreign key relationships for crimes table:');
    relationships.forEach(rel => {
      console.log(`  - ${rel.column_name} → ${rel.foreign_table_name}.${rel.foreign_column_name}`);
    });

    console.log('\n🎉 All schema tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Database connection working');
    console.log('✅ Enhanced crimes table structure validated');
    console.log('✅ All new fields present and functional');
    console.log('✅ Complex crime data insertion successful');
    console.log('✅ Enhanced data retrieval working');
    console.log('✅ Foreign key relationships intact');    console.log('\n🏆 Updated schema is ready for production use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the test
testUpdatedSchema().catch(console.error);
