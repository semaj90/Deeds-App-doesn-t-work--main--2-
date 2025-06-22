#!/usr/bin/env node

/**
 * Add Missing Columns to Crimes Table
 * Manually adds the enhanced fields to match the legal.ts schema
 */

import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to crimes table...\n');

  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/prosecutor_app';
  
  const sql = postgres(connectionString);

  try {
    console.log('📊 Connected to database...');

    // List of columns to add
    const columnsToAdd = [
      { name: 'crime_type', type: 'VARCHAR(100)' },
      { name: 'crime_code', type: 'VARCHAR(50)' },
      { name: 'severity_level', type: 'INTEGER' },
      { name: 'classification', type: 'VARCHAR(100)' },
      { name: 'is_felony', type: 'BOOLEAN DEFAULT false' },
      { name: 'potential_sentence', type: 'TEXT' },
      { name: 'statute_references', type: 'JSONB DEFAULT \'[]\'::jsonb' },
      { name: 'elements', type: 'JSONB DEFAULT \'[]\'::jsonb' },
      { name: 'defenses', type: 'JSONB DEFAULT \'[]\'::jsonb' },
      { name: 'precedent_cases', type: 'JSONB DEFAULT \'[]\'::jsonb' },
      { name: 'investigation_notes', type: 'TEXT' },
      { name: 'modus_operandi', type: 'TEXT' },
      { name: 'location', type: 'TEXT' },
      { name: 'address', type: 'TEXT' },
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'state', type: 'VARCHAR(50)' },
      { name: 'zip_code', type: 'VARCHAR(10)' },
      { name: 'coordinates', type: 'JSONB' },
      { name: 'occurred_at', type: 'TIMESTAMP' },
      { name: 'reported_at', type: 'TIMESTAMP' },
      { name: 'discovered_at', type: 'TIMESTAMP' }
    ];

    // Add each column
    for (const column of columnsToAdd) {
      try {
        console.log(`  Adding column: ${column.name} (${column.type})`);
        await sql.unsafe(`ALTER TABLE crimes ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
        console.log(`  ✅ ${column.name} added successfully`);
      } catch (error) {
        console.log(`  ⚠️  ${column.name} - ${error.message}`);
      }
    }

    // Verify the new structure
    console.log('\n🔍 Verifying updated table structure...');
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'crimes' 
      ORDER BY ordinal_position;
    `;

    console.log(`\n📋 Crimes table now has ${tableInfo.length} columns:`);
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n🎉 Enhanced crimes table is ready!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

addMissingColumns().catch(console.error);
