// Schema validation test
import * as schema from './src/lib/server/db/unified-schema.js';

console.log('✅ Schema imported successfully');
console.log('📋 Available tables:', Object.keys(schema));

// Check for evidence table specifically
if (schema.evidence) {
    console.log('✅ Evidence table found');
} else {
    console.log('❌ Evidence table missing');
}
