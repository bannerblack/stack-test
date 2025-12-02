import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content');

console.log('👀 Watching for changes in content directory...');
console.log(`📁 ${CONTENT_DIR}\n`);

let timeout;

function regenerate() {
	clearTimeout(timeout);
	timeout = setTimeout(() => {
		console.log('🔄 Regenerating routes...');
		exec('npm run generate', (error, stdout, stderr) => {
			if (error) {
				console.error('❌ Error:', error);
				return;
			}
			console.log(stdout);
			if (stderr) console.error(stderr);
		});
	}, 500); // Debounce 500ms
}

fs.watch(CONTENT_DIR, { recursive: true }, (eventType, filename) => {
	if (filename && (filename.endsWith('.md') || filename.endsWith('.svx'))) {
		console.log(`📝 ${eventType}: ${filename}`);
		regenerate();
	}
});

console.log('✅ Watcher started. Press Ctrl+C to stop.\n');
