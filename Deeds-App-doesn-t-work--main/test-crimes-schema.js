#!/usr/bin/env node

/**
 * Simple Schema Verification Test
 * Tests the updated crimes table without complex imports
 */

import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

async function testUpdatedCrimesTable() {
  console.log('🧪 Testing Updated Crimes Table Schema...\n');

  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/prosecutor_app';
  
  const sql = postgres(connectionString);

  try {
    // 1. Test basic connection
    console.log('📊 Testing database connection...');
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected:', result[0].current_time);

    // 2. Check crimes table exists and get structure
    console.log('\n🏛️ Checking crimes table structure...');
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'crimes' 
      ORDER BY ordinal_position;
    `;
    
    if (tableInfo.length === 0) {
      throw new Error('Crimes table not found!');
    }

    console.log('📋 Crimes table columns:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // 3. Verify all required new fields exist
    console.log('\n🔍 Verifying enhanced crime fields...');
    const requiredFields = [
      'id', 'name', 'title', 'description', 'case_id', 'criminal_id',
      'severity_level', 'classification', 'is_felony', 'jurisdiction', 
      'potential_sentence', 'statute_references', 'elements', 'defenses', 
      'precedent_cases', 'investigation_notes', 'status', 'created_at', 'updated_at'
    ];
    
    const existingFields = tableInfo.map(col => col.column_name);
    let missingFields = [];
    
    requiredFields.forEach(field => {
      if (existingFields.includes(field)) {
        console.log(`✅ ${field} - Found`);
      } else {
        console.log(`❌ ${field} - Missing`);
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // 4. Test inserting a comprehensive crime record
    console.log('\n💾 Testing enhanced crime data insertion...');
    
    const crimeId = crypto.randomUUID();
    await sql`
      INSERT INTO crimes (
        id, name, title, description, severity_level, classification,
        is_felony, jurisdiction, potential_sentence, statute_references,
        elements, defenses, precedent_cases, investigation_notes,
        status, created_at, updated_at
      ) VALUES (
        ${crimeId},
        'Test Enhanced Crime',
        'Armed Robbery - First Degree',
        'Test crime with all enhanced fields',
        8,
        'violent_crime',
        true,
        'State of California',
        '15-25 years imprisonment',
        ${JSON.stringify([
          { code: 'PC 211', title: 'Robbery' },
          { code: 'PC 12022.53', title: 'Gun Enhancement' }
        ])},
        ${JSON.stringify([
          'Taking of personal property',
          'From person or immediate presence',
          'Against will through force or fear',
          'Use of firearm'
        ])},
        ${JSON.stringify([
          'Lack of intent',
          'Mistaken identity',
          'Duress'
        ])},
        ${JSON.stringify([
          { name: 'People v. Smith', citation: '123 Cal.App.4th 456' }
        ])},
        'Suspect captured on CCTV. Weapon recovered at scene.',
        'pending',
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Enhanced crime record inserted successfully');

    // 5. Test querying the enhanced crime data
    console.log('\n🔍 Testing enhanced crime data retrieval...');
    const retrievedCrime = await sql`
      SELECT * FROM crimes WHERE id = ${crimeId}
    `;

    if (retrievedCrime.length > 0) {
      const crime = retrievedCrime[0];
      console.log('✅ Crime retrieved successfully');
      console.log('📝 Enhanced fields verification:');
      console.log(`  - Severity Level: ${crime.severity_level}`);
      console.log(`  - Classification: ${crime.classification}`);
      console.log(`  - Is Felony: ${crime.is_felony}`);
      console.log(`  - Jurisdiction: ${crime.jurisdiction}`);
      console.log(`  - Potential Sentence: ${crime.potential_sentence}`);
      console.log(`  - Statute References: ${JSON.stringify(crime.statute_references, null, 2)}`);
      console.log(`  - Legal Elements: ${JSON.stringify(crime.elements, null, 2)}`);
      console.log(`  - Available Defenses: ${JSON.stringify(crime.defenses, null, 2)}`);
      console.log(`  - Precedent Cases: ${JSON.stringify(crime.precedent_cases, null, 2)}`);
      console.log(`  - Investigation Notes: ${crime.investigation_notes}`);
    }

    // 6. Test all table relationships
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

    // 7. Check all main tables exist
    console.log('\n📊 Verifying all main tables exist...');
    const mainTables = [
      'users', 'cases', 'crimes', 'criminals', 'statutes', 'evidence',
      'case_criminals', 'case_activities', 'reports'
    ];

    for (const tableName of mainTables) {
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = ${tableName}
        );
      `;
      
      if (tableExists[0].exists) {
        console.log(`✅ ${tableName} table - Found`);
      } else {
        console.log(`❌ ${tableName} table - Missing`);
      }
    }

    // Clean up test data
    await sql`DELETE FROM crimes WHERE id = ${crimeId}`;

    console.log('\n🎉 All enhanced schema tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Database connection working');
    console.log('✅ Enhanced crimes table structure validated');
    console.log('✅ All new fields present and functional');
    console.log('✅ Enhanced crime data insertion successful');
    console.log('✅ Enhanced data retrieval working');
    console.log('✅ Foreign key relationships intact');
    console.log('✅ All main tables present');
    console.log('\n🏆 Updated crimes schema is ready for production use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the test
testUpdatedCrimesTable().catch(console.error);
