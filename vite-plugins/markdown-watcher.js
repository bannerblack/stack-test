import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Vite plugin to watch markdown files and regenerate routes
 * Set VITE_WATCH_MARKDOWN=false to disable runtime watching
 */
export function markdownWatcher() {
    const isEnabled = process.env.VITE_WATCH_MARKDOWN !== 'false';

    return {
        name: 'markdown-watcher',

        async buildStart() {
            if (isEnabled) {
                console.log('📝 Generating routes from markdown files...');
                try {
                    await execAsync('node scripts/generate-routes.js');
                    console.log('✓ Routes generated successfully');
                } catch (error) {
                    console.error('❌ Failed to generate routes:', error.message);
                }
            }
        },

        configureServer(server) {
            if (!isEnabled) {
                console.log('⏸️  Markdown watching disabled (VITE_WATCH_MARKDOWN=false)');
                return;
            }

            console.log('👀 Watching for markdown file changes...');

            server.watcher.on('all', async (event, filePath) => {
                const normalizedPath = path.normalize(filePath);

                // Check if the changed file is in src/content and is a markdown file
                if (normalizedPath.includes('src/content') &&
                    (normalizedPath.endsWith('.md') || normalizedPath.endsWith('.svx'))) {

                    console.log(`\n📝 Markdown file ${event}: ${path.basename(filePath)}`);
                    console.log('🔄 Regenerating routes...');

                    try {
                        await execAsync('node scripts/generate-routes.js');
                        console.log('✓ Routes regenerated');

                        // Trigger a full page reload
                        server.ws.send({
                            type: 'full-reload',
                            path: '*'
                        });
                    } catch (error) {
                        console.error('❌ Failed to regenerate routes:', error.message);
                    }
                }
            });
        }
    };
}
