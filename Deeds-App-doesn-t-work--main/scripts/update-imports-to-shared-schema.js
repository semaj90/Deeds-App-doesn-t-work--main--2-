/**
 * Script to update all schema imports in SvelteKit app to use the shared monorepo schema
 * Converts imports from local schema files to the shared schema
 */

const fs = require('fs');
const glob = require('glob');
const path = require('path');

// Define the import mappings
const importMappings = [
  {
    // From schema-new.ts imports
    from: /from ['"]\$lib\/server\/db\/schema-new['"][;]?/g,
    to: "from '$lib/server/db/shared-db';"
  },
  {
    // From schema.ts imports
    from: /from ['"]\$lib\/server\/db\/schema['"][;]?/g,
    to: "from '$lib/server/db/shared-db';"
  },
  {
    // From relative schema imports
    from: /from ['"]\.\/schema-new['"][;]?/g,
    to: "from './shared-db';"
  },
  {
    // From relative schema imports
    from: /from ['"]\.\/schema['"][;]?/g,
    to: "from './shared-db';"
  },
  {
    // From relative schema imports (with .js extension)
    from: /from ['"]\$lib\/server\/db\/schema-new\.js['"][;]?/g,
    to: "from '$lib/server/db/shared-db';"
  },
  {
    // From relative schema imports (with .js extension)
    from: /from ['"]\$lib\/server\/db\/schema\.js['"][;]?/g,
    to: "from '$lib/server/db/shared-db';"
  }
];

// Files to process
const filePatterns = [
  'web-app/sveltekit-frontend/src/**/*.ts',
  'web-app/sveltekit-frontend/src/**/*.js',
  'web-app/sveltekit-frontend/src/**/*.svelte'
];

async function updateImports() {
  console.log('🔄 Updating schema imports to use shared monorepo schema...');
  
  let totalFiles = 0;
  let updatedFiles = 0;

  for (const pattern of filePatterns) {
    const files = glob.sync(pattern, { 
      cwd: process.cwd(),
      absolute: true 
    });

    for (const filePath of files) {
      totalFiles++;
        try {
        const originalContent = fs.readFileSync(filePath, 'utf8');
        let updatedContent = originalContent;
        let hasChanges = false;

        // Apply each mapping
        for (const mapping of importMappings) {
          const beforeUpdate = updatedContent;
          updatedContent = updatedContent.replace(mapping.from, mapping.to);
          
          if (beforeUpdate !== updatedContent) {
            hasChanges = true;
          }
        }

        // Write back if changes were made
        if (hasChanges) {
          fs.writeFileSync(filePath, updatedContent, 'utf8');
          updatedFiles++;
          console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files updated: ${updatedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - updatedFiles}`);
  
  if (updatedFiles > 0) {
    console.log('\n✅ Import update completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the changes');
    console.log('2. Test the application');
    console.log('3. Run database migrations if needed');
  } else {
    console.log('\nℹ️  No files needed updating');
  }
}

// Run the script
updateImports().catch(console.error);
