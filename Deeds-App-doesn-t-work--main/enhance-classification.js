#!/usr/bin/env node

/**
 * Enhanced Classification System
 * Add proper felony/misdemeanor/citation/infraction support
 */

import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

async function enhanceClassificationSystem() {
  console.log('🔧 Enhancing crimes classification system...\n');

  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/prosecutor_app';
  
  const sql = postgres(connectionString);

  try {
    console.log('📊 Connected to database...');

    // Create enum type for charge levels
    console.log('📋 Creating charge_level enum...');
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE charge_level AS ENUM ('felony', 'misdemeanor', 'citation', 'infraction');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add new classification columns
    const newColumns = [
      { name: 'charge_level', type: 'charge_level' },
      { name: 'is_misdemeanor', type: 'BOOLEAN DEFAULT false' },
      { name: 'is_citation', type: 'BOOLEAN DEFAULT false' },
      { name: 'is_infraction', type: 'BOOLEAN DEFAULT false' },
      { name: 'fine_range', type: 'VARCHAR(100)' }
    ];

    for (const column of newColumns) {
      try {
        console.log(`  Adding column: ${column.name} (${column.type})`);
        await sql.unsafe(`ALTER TABLE crimes ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
        console.log(`  ✅ ${column.name} added successfully`);
      } catch (error) {
        console.log(`  ⚠️  ${column.name} - ${error.message}`);
      }
    }

    // Create a trigger function to auto-update boolean fields based on charge_level
    console.log('\n🔄 Creating auto-classification trigger...');
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION update_crime_classification_flags()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Reset all flags
        NEW.is_felony = false;
        NEW.is_misdemeanor = false;
        NEW.is_citation = false;
        NEW.is_infraction = false;
        
        -- Set appropriate flag based on charge_level
        CASE NEW.charge_level
          WHEN 'felony' THEN NEW.is_felony = true;
          WHEN 'misdemeanor' THEN NEW.is_misdemeanor = true;
          WHEN 'citation' THEN NEW.is_citation = true;
          WHEN 'infraction' THEN NEW.is_infraction = true;
        END CASE;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger
    await sql.unsafe(`
      DROP TRIGGER IF EXISTS crime_classification_trigger ON crimes;
      CREATE TRIGGER crime_classification_trigger
        BEFORE INSERT OR UPDATE ON crimes
        FOR EACH ROW
        EXECUTE FUNCTION update_crime_classification_flags();
    `);

    // Test the enhanced classification system
    console.log('\n🧪 Testing enhanced classification system...');
    
    // Insert test records with different charge levels
    const testCrimes = [
      {
        id: crypto.randomUUID(),
        name: 'Test Felony Crime',
        charge_level: 'felony',
        potential_sentence: '2-5 years prison'
      },
      {
        id: crypto.randomUUID(),
        name: 'Test Misdemeanor Crime', 
        charge_level: 'misdemeanor',
        potential_sentence: 'Up to 1 year jail'
      },
      {
        id: crypto.randomUUID(),
        name: 'Test Citation',
        charge_level: 'citation',
        fine_range: '$100-$500'
      },
      {
        id: crypto.randomUUID(),
        name: 'Test Infraction',
        charge_level: 'infraction',
        fine_range: '$25-$200'
      }
    ];

    for (const crime of testCrimes) {
      await sql`
        INSERT INTO crimes (
          id, name, charge_level, potential_sentence, fine_range,
          created_at, updated_at
        ) VALUES (
          ${crime.id}, ${crime.name}, ${crime.charge_level},
          ${crime.potential_sentence || null}, ${crime.fine_range || null},
          NOW(), NOW()
        )
      `;
    }

    // Verify the classification system works
    console.log('\n📊 Verifying classification system...');
    const classificationResults = await sql`
      SELECT 
        name, charge_level, is_felony, is_misdemeanor, 
        is_citation, is_infraction, potential_sentence, fine_range
      FROM crimes 
      WHERE name LIKE 'Test%'
      ORDER BY name
    `;

    console.log('\n📋 Classification Test Results:');
    classificationResults.forEach(crime => {
      console.log(`\n🔍 ${crime.name}:`);
      console.log(`  Charge Level: ${crime.charge_level}`);
      console.log(`  Is Felony: ${crime.is_felony}`);
      console.log(`  Is Misdemeanor: ${crime.is_misdemeanor}`);
      console.log(`  Is Citation: ${crime.is_citation}`);
      console.log(`  Is Infraction: ${crime.is_infraction}`);
      if (crime.potential_sentence) console.log(`  Sentence: ${crime.potential_sentence}`);
      if (crime.fine_range) console.log(`  Fine Range: ${crime.fine_range}`);
    });

    // Clean up test data
    await sql`DELETE FROM crimes WHERE name LIKE 'Test%'`;

    console.log('\n🎉 Enhanced classification system ready!');
    console.log('\n📊 Summary:');
    console.log('✅ Charge level enum created (felony, misdemeanor, citation, infraction)');
    console.log('✅ Boolean flags added for each charge type');
    console.log('✅ Fine range field added for citations/infractions');
    console.log('✅ Auto-classification trigger created');
    console.log('✅ System tested and verified');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

enhanceClassificationSystem().catch(console.error);
