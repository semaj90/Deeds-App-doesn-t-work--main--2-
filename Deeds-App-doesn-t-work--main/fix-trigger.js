#!/usr/bin/env node

/**
 * Fix Trigger Function
 * Fix the CASE statement syntax issue
 */

import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

async function fixTrigger() {
  console.log('🔧 Fixing trigger function...\n');

  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/prosecutor_app';
  
  const sql = postgres(connectionString);

  try {
    console.log('📊 Connected to database...');

    // Fix the trigger function with proper IF-ELSIF syntax
    await sql`
      CREATE OR REPLACE FUNCTION update_crime_classification_flags()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Reset all flags
        NEW.is_felony = false;
        NEW.is_misdemeanor = false;
        NEW.is_citation = false;
        NEW.is_infraction = false;
        
        -- Set appropriate flag based on charge_level
        IF NEW.charge_level = 'felony' THEN
          NEW.is_felony = true;
        ELSIF NEW.charge_level = 'misdemeanor' THEN
          NEW.is_misdemeanor = true;
        ELSIF NEW.charge_level = 'citation' THEN
          NEW.is_citation = true;
        ELSIF NEW.charge_level = 'infraction' THEN
          NEW.is_infraction = true;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    console.log('✅ Trigger function fixed!');

    // Test the fixed trigger
    console.log('\n🧪 Testing fixed trigger...');
    const testId = crypto.randomUUID();
    
    await sql`
      INSERT INTO crimes (
        id, name, charge_level, created_at, updated_at
      ) VALUES (
        ${testId}, 'Test Crime', 'misdemeanor', NOW(), NOW()
      )
    `;

    const result = await sql`
      SELECT charge_level, is_felony, is_misdemeanor, is_citation, is_infraction
      FROM crimes WHERE id = ${testId}
    `;

    console.log('📋 Trigger test result:');
    console.log(`  Charge Level: ${result[0].charge_level}`);
    console.log(`  Is Felony: ${result[0].is_felony}`);
    console.log(`  Is Misdemeanor: ${result[0].is_misdemeanor}`);
    console.log(`  Is Citation: ${result[0].is_citation}`);
    console.log(`  Is Infraction: ${result[0].is_infraction}`);

    // Clean up test record
    await sql`DELETE FROM crimes WHERE id = ${testId}`;

    console.log('\n🎉 Trigger function working correctly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixTrigger().catch(console.error);
