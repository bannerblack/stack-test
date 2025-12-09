/**
 * Route Generation Script
 * 
 * Generates SvelteKit routes from markdown/base content files.
 * This is the main orchestrator that coordinates all generation steps.
 * 
 * Process:
 * 1. Load ignore patterns from .contentignore
 * 2. Clean existing generated routes
 * 3. Scan content directory to build tree structure
 * 4. Generate route files from tree
 * 5. Generate site map route
 * 6. Copy images and clean up orphans
 * 7. Generate toc.js and nav.js for navigation
 */

import fs from 'fs';
import path from 'path';
import { loadObsidianTypes } from '../src/lib/templates/processors/frontmatter-parser.js';
import { copyImages } from '../src/lib/templates/processors/image-processor.js';
import { PATHS } from './modules/constants.js';
import { loadIgnorePatterns } from './modules/ignore-handler.js';
import { scanContentDirectory } from './modules/scanner.js';
import { generateRoutes, cleanupRoutes } from './modules/route-generator.js';
import { collectImageReferences, cleanupOrphanedImages } from './modules/image-manager.js';
import { writeTocFile, writeNavFile, writeMapRoute } from './modules/file-writers.js';

/**
 * Main execution
 */
function main() {
	console.log('📝 Generating routes from markdown files...');

	// Load Obsidian types for type conversion
	const obsidianTypes = loadObsidianTypes(PATHS.content, fs, path);

	// Load ignore patterns
	const ignorePatterns = loadIgnorePatterns(PATHS.ignoreFile);
	if (ignorePatterns.length > 0) {
		console.log(`Loaded ${ignorePatterns.length} ignore pattern(s) from .contentignore`);
	}

	// Step 1: Clean existing generated routes
	cleanupRoutes(PATHS.routes);

	// Step 2: Scan content directory to build tree structure
	const tree = scanContentDirectory(PATHS.content, PATHS.content, ignorePatterns, obsidianTypes);

	// Step 3: Generate route files
	console.log('Generating routes...');
	generateRoutes(tree, PATHS.content, PATHS.routes, obsidianTypes);

	// Step 4: Generate site map route
	writeMapRoute(tree, PATHS.routes);

	// Step 5: Copy images and clean up orphans
	console.log('📸 Copying images to static directory...');
	const copiedImages = copyImages(PATHS.content, PATHS.static, fs, path);

	const referencedImages = collectImageReferences(PATHS.content);
	const validImages = new Set([...copiedImages, ...referencedImages]);
	cleanupOrphanedImages(PATHS.static, validImages);

	// Step 6: Generate navigation files
	console.log('Generating toc.js...');
	writeTocFile(tree, PATHS.toc);

	console.log('Generating nav.js for sidebar...');
	writeNavFile(tree, PATHS.nav);

	console.log('\n✓ Routes generated successfully');
	console.log('  All content has been completely regenerated');
	console.log('  Deleted notes and orphaned images have been cleaned up');
}

main();
