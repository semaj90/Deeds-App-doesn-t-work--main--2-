const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendPath = path.join('web-app', 'sveltekit-frontend');
const markdownPath = 'markdown_files';
const rootDir = process.cwd();

async function runSetup() {
    console.log('--- Running Frontend Check ---');
    try {
        execSync('npm run check', { cwd: path.join(rootDir, frontendPath), stdio: 'inherit' });
        console.log('Frontend check completed successfully.');
    } catch (error) {
        console.error(`Frontend check failed: ${error.message}`);
    }

    console.log('\n--- Generating Work Summary ---');
    const filesToConsider = [];

    // Function to recursively get files and their stats
    function getFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                getFiles(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (ext === '.md' || ['.ts', '.js', '.svelte', '.html', '.css'].includes(ext)) {
                    try {
                        const stats = fs.statSync(fullPath);
                        filesToConsider.push({
                            path: path.relative(rootDir, fullPath),
                            mtime: stats.mtime.getTime(),
                            mtimeDate: stats.mtime
                        });
                    } catch (statError) {
                        console.warn(`Could not get stats for ${fullPath}: ${statError.message}`);
                    }
                }
            }
        }
    }

    // Get files from frontend and markdown directories
    getFiles(path.join(rootDir, frontendPath));
    getFiles(path.join(rootDir, markdownPath));

    // Sort by modification time (most recent first)
    filesToConsider.sort((a, b) => b.mtime - a.mtime);

    console.log('Recently Modified Files (Top 10):');
    if (filesToConsider.length === 0) {
        console.log('No relevant files found.');
    } else {
        filesToConsider.slice(0, 10).forEach(file => {
            console.log(`- ${file.path} (Last Modified: ${file.mtimeDate.toLocaleString()})`);
        });
    }

    console.log('\nSummary of potential work areas:');
    console.log('Based on recent modifications, focus on the files listed above. Markdown files often indicate documentation or planning, while code files show active development.');
    console.log('Consider reviewing these files for pending tasks, recent changes, or areas requiring further attention.');
}

runSetup();