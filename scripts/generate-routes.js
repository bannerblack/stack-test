import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { loadObsidianTypes } from '../src/lib/templates/processors/frontmatter-parser.js';
import { copyImages } from '../src/lib/templates/processors/image-processor.js';
import { generateTemplatedRoute, generateBaseFileRoute } from '../src/lib/templates/template-selector.js';
import { convertToProperType } from '../src/lib/templates/processors/frontmatter-parser.js';
import { pinnedConfig } from '../src/pinned-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content');
const ROUTES_DIR = path.join(__dirname, '..', 'src', 'routes', '(generated)');
const TOC_FILE = path.join(__dirname, '..', 'src', 'toc', 'toc.js');
const NAV_FILE = path.join(__dirname, '..', 'src', 'toc', 'nav.js');
const STATIC_DIR = path.join(__dirname, '..', 'static');

// Load Obsidian types if available
const obsidianTypes = loadObsidianTypes(CONTENT_DIR, fs, path);

// Image extensions to check
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'];

const IGNORE_FILE = path.join(__dirname, '..', '.contentignore');

// Create a URL-safe slug from a string
function createSlug(text) {
	return text
		.toString()
		.toLowerCase()
		.trim()
		// Replace spaces and special characters with hyphens
		.replace(/[\s\W-]+/g, '-')
		// Remove leading/trailing hyphens
		.replace(/^-+|-+$/g, '')
		// Ensure it's not empty
		|| 'untitled';
}

// Load and parse .contentignore file
function loadIgnorePatterns() {
	if (!fs.existsSync(IGNORE_FILE)) {
		return [];
	}

	const content = fs.readFileSync(IGNORE_FILE, 'utf-8');
	return content
		.split('\n')
		.map(line => line.trim())
		.filter(line => line && !line.startsWith('#')) // Remove comments and empty lines
		.map(pattern => {
			// Convert glob patterns to regex
			if (pattern.includes('*')) {
				// Escape special regex chars
				let escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
				// Replace * with .* for regex (match any characters)
				escaped = escaped.replace(/\\\*/g, '.*');
				// Handle patterns starting with *
				if (pattern.startsWith('*')) {
					escaped = escaped.substring(2); // Remove the leading .*
					return new RegExp(escaped + '$'); // Match at end
				}
				return new RegExp('^' + escaped + '$');
			}
			return pattern;
		});
}

// Check if a path should be ignored
function shouldIgnore(itemName, ignorePatterns) {
	for (const pattern of ignorePatterns) {
		if (pattern instanceof RegExp) {
			if (pattern.test(itemName)) {
				return true;
			}
		} else if (itemName === pattern || itemName.startsWith(pattern + '/')) {
			return true;
		}
	}
	return false;
}

// Parse frontmatter from markdown content (supports complex YAML)
function parseFrontmatter(content, isBaseFile = false) {
	// For .base files, treat entire content as YAML
	if (isBaseFile) {
		try {
			const metadata = yaml.load(content) || {};
			// Convert values to proper types
			for (const [key, value] of Object.entries(metadata)) {
				metadata[key] = convertToProperType(key, value, obsidianTypes);
			}
			return { metadata, content: '' };
		} catch (e) {
			console.warn('Failed to parse .base file YAML:', e.message);
			return { metadata: {}, content };
		}
	}

	// For regular markdown files, extract frontmatter
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
	const match = content.match(frontmatterRegex);

	if (!match) return { metadata: {}, content };

	const frontmatterYaml = match[1];
	let metadata = {};

	try {
		// Use js-yaml for proper YAML parsing (handles nested structures)
		metadata = yaml.load(frontmatterYaml) || {};

		// Convert values to proper types
		for (const [key, value] of Object.entries(metadata)) {
			metadata[key] = convertToProperType(key, value, obsidianTypes);
		}
	} catch (e) {
		console.warn('Failed to parse YAML frontmatter:', e.message);
		// Fallback to simple parser
		frontmatterYaml.split('\n').forEach(line => {
			const colonIndex = line.indexOf(':');
			if (colonIndex > 0) {
				const key = line.substring(0, colonIndex).trim();
				const value = line.substring(colonIndex + 1).trim();
				metadata[key] = value.replace(/^['"]|['"]$/g, '');
			}
		});
	}

	return { metadata, content: content.substring(match[0].length) };
}

// Recursively scan content directory and build tree structure
function scanContentDirectory(dir, baseDir = CONTENT_DIR, ignorePatterns = []) {
	const tree = {};
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		// Check if this entry should be ignored
		const relativePath = path.relative(baseDir, path.join(dir, entry.name));
		const normalizedPath = relativePath.replace(/\\/g, '/');

		if (shouldIgnore(normalizedPath, ignorePatterns) || shouldIgnore(entry.name, ignorePatterns)) {
			continue; // Skip ignored items
		}

		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			const subtree = scanContentDirectory(fullPath, baseDir, ignorePatterns);
			// Only add directory if it has content
			if (Object.keys(subtree).length > 0) {
				// Create a slug for the directory name
				const dirSlug = createSlug(entry.name);

				// Check for index.md in the directory for folder metadata
				const indexPath = path.join(fullPath, 'index.md');
				if (fs.existsSync(indexPath)) {
					const indexContent = fs.readFileSync(indexPath, 'utf-8');
					const { metadata } = parseFrontmatter(indexContent);
					subtree._meta = { ...metadata, __originalName: entry.name };
				} else {
					subtree._meta = { __originalName: entry.name };
				}
				tree[dirSlug] = subtree;
			}
		} else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.svx') || entry.name.endsWith('.base'))) {
			const content = fs.readFileSync(fullPath, 'utf-8');
			const isBaseFile = entry.name.endsWith('.base');
			const { metadata } = parseFrontmatter(content, isBaseFile);
			const baseName = path.basename(entry.name, path.extname(entry.name));
			const extension = path.extname(entry.name).substring(1); // Remove the dot

			// Create a slug for the base name
			const baseSlug = createSlug(baseName);

			// If there's already an entry with this base name, append extension to make it unique
			let finalKey = baseSlug;
			if (tree[baseSlug]) {
				// If the existing entry doesn't have an extension suffix, add one
				if (!tree[baseSlug].__hasExtension) {
					const existingPath = tree[baseSlug].path;
					const existingExt = path.extname(existingPath).substring(1);
					const existingSlug = `${baseSlug}-${existingExt}`;

					// Move the existing entry to the new key
					tree[existingSlug] = { ...tree[baseSlug], __hasExtension: true };
					delete tree[baseSlug];
				}

				// Use extension-suffixed key for the new entry
				finalKey = `${baseSlug}-${extension}`;
			}

			tree[finalKey] = {
				path: normalizedPath,
				title: metadata.title || baseName,
				__hasExtension: finalKey !== baseSlug,
				// Set default database icon for .base files if no icon is specified
				icon: isBaseFile && !metadata.icon ? 'database' : metadata.icon,
				...metadata
			};
		}
	}

	return tree;
}

// Build route path from tree structure
function buildRoutePath(tree, currentPath = '') {
	const routes = [];

	for (const [key, value] of Object.entries(tree)) {
		// Skip metadata
		if (key === '_meta') continue;

		if (value.path) {
			// This is a file - store its route
			const routeSlug = currentPath ? `${currentPath}/${key}` : key;
			routes.push({
				slug: routeSlug,
				key: key,
				...value
			});
		} else {
			// This is a nested directory - recurse
			const nestedPath = currentPath ? `${currentPath}/${key}` : key;
			routes.push(...buildRoutePath(value, nestedPath));
		}
	}

	return routes;
}

// Generate markdown content for .base files
// Clean up all existing generated routes
function cleanupGeneratedRoutes() {
	if (fs.existsSync(ROUTES_DIR)) {
		console.log('🧹 Cleaning up existing generated routes...');
		fs.rmSync(ROUTES_DIR, { recursive: true, force: true });
	}
	// Recreate the directory
	fs.mkdirSync(ROUTES_DIR, { recursive: true });
}

// Clean up orphaned images in static directory
function cleanupOrphanedImages(validImages) {
	if (!fs.existsSync(STATIC_DIR)) return;

	console.log('🧹 Cleaning up orphaned images...');
	const staticFiles = fs.readdirSync(STATIC_DIR);

	for (const file of staticFiles) {
		const filePath = path.join(STATIC_DIR, file);
		const stat = fs.statSync(filePath);

		// Only process image files
		if (stat.isFile() && IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
			// Check if this image is still referenced in content
			if (!validImages.has(file)) {
				fs.unlinkSync(filePath);
				console.log(`🗑️  Removed orphaned image: ${file}`);
			}
		}
	}
}

// Collect all image references from content
function collectImageReferences(contentDir) {
	const imageRefs = new Set();

	function scanForImages(dir) {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory() && !entry.name.startsWith('.')) {
				scanForImages(fullPath);
			} else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.svx') || entry.name.endsWith('.base'))) {
				const content = fs.readFileSync(fullPath, 'utf-8');

				// Find image references: ![alt](image.jpg), [[image.jpg]], wikilink embeds, etc.
				const imagePatterns = [
					/!\[.*?\]\(([^)]+\.(jpg|jpeg|png|gif|svg|webp|bmp))\)/gi,
					/\[\[([^\]]+\.(jpg|jpeg|png|gif|svg|webp|bmp))\]\]/gi,
					/!\[\[([^\]]+\.(jpg|jpeg|png|gif|svg|webp|bmp))\]\]/gi
				];

				for (const pattern of imagePatterns) {
					let match;
					while ((match = pattern.exec(content)) !== null) {
						const imagePath = match[1];
						// Extract just the filename
						const filename = path.basename(imagePath);
						imageRefs.add(filename);
					}
				}
			}
		}
	}

	scanForImages(contentDir);
	return imageRefs;
}

// Generate route structure from content
function generateRoutes(tree) {
	const routes = buildRoutePath(tree);

	for (const route of routes) {
		const routePath = path.join(ROUTES_DIR, route.slug);

		// Create directory if it doesn't exist
		if (!fs.existsSync(routePath)) {
			fs.mkdirSync(routePath, { recursive: true });
		}

		// Read the original content
		const contentPath = path.join(CONTENT_DIR, route.path);

		let pageContent;
		if (route.path.endsWith('.base')) {
			// Use new template system for .base files
			pageContent = generateBaseFileRoute(route);
		} else {
			// Use new template system for .md/.svx files
			const rawContent = fs.readFileSync(contentPath, 'utf-8');
			const fileStats = fs.statSync(contentPath);
			pageContent = generateTemplatedRoute(rawContent, route.path, route.slug, obsidianTypes, fileStats);
		}

		// Write the content to +page.svx
		const pagePath = path.join(routePath, '+page.svx');
		fs.writeFileSync(pagePath, pageContent, 'utf-8');
	}
}

// Generate toc.js
function generateTocFile(tree) {
	const tocContent = `export const toc = ${JSON.stringify(tree, null, 2)};
`;
	fs.writeFileSync(TOC_FILE, tocContent, 'utf-8');
}

// Recursively build nested nav structure (preserves folder hierarchy, groups by category)
function buildNestedItems(node, currentPath) {
	const items = [];
	const categorizedItems = {}; // category -> items[]
	const uncategorizedItems = [];

	for (const [key, value] of Object.entries(node).sort(([a], [b]) => a.localeCompare(b))) {
		if (key === '_meta' || key === 'index') continue;

		if (value.path) {
			// Skip page notes - they appear in the secondary section
			if (value.page === 'true' || value.page === true) continue;

			// This is a file (leaf node)
			const item = {
				title: value.title || key,
				url: `/${currentPath}/${key}`,
				icon: value.icon || null,
				iconColor: value.iconColor || null,
				isFolder: false
			};

			// Group by category if present
			if (value.category) {
				if (!categorizedItems[value.category]) {
					categorizedItems[value.category] = [];
				}
				categorizedItems[value.category].push(item);
			} else {
				uncategorizedItems.push(item);
			}
		} else {
			// This is a nested folder - recurse to preserve hierarchy
			const folderMeta = value._meta || {};
			const nestedPath = `${currentPath}/${key}`;
			const nestedItems = buildNestedItems(value, nestedPath);

			// Only add folder if it has items (not empty after filtering)
			if (nestedItems.length > 0) {
				items.push({
					title: folderMeta.title || folderMeta.__originalName || key,
					url: `/${nestedPath}`,
					icon: folderMeta.icon || null,
					iconColor: folderMeta.iconColor || null,
					isFolder: true,
					isActive: false,
					items: nestedItems
				});
			}
		}
	}

	// Build final items array: uncategorized first, then category groups
	const finalItems = [...uncategorizedItems];

	// Add category groups (sorted alphabetically by category name)
	for (const category of Object.keys(categorizedItems).sort()) {
		finalItems.push({
			title: category,
			isCategory: true,
			isFolder: true,
			items: categorizedItems[category]
		});
	}

	// Add folders after categories
	finalItems.push(...items);

	return finalItems;
}

// Convert tree structure to navMain format for app-sidebar
function buildNavMain(tree, parentPath = '') {
	const navItems = [];

	for (const [key, value] of Object.entries(tree).sort(([a], [b]) => a.localeCompare(b))) {
		// Skip metadata and index files
		if (key === '_meta' || key === 'index') continue;

		if (value.path) {
			// Skip page notes - they appear in the secondary section
			if (value.page === 'true' || value.page === true) continue;

			// This is a file (leaf node) at root level - add as standalone nav item
			if (parentPath === '') {
				const route = `/${key}`;
				navItems.push({
					title: value.title || key,
					url: route,
					icon: value.icon || null,
					iconColor: value.iconColor || null,
					isFolder: false,
					items: []
				});
			}
		} else {
			// This is a folder - create a nav group with nested structure preserved
			const folderMeta = value._meta || {};
			const folderTitle = folderMeta.title || folderMeta.__originalName || key;
			const folderIcon = folderMeta.icon || null;
			const folderIconColor = folderMeta.iconColor || null;
			const folderPath = parentPath ? `${parentPath}/${key}` : key;

			// Build nested items (preserves subfolder hierarchy)
			const subItems = buildNestedItems(value, folderPath);

			// Only add folder if it has items (not empty after filtering)
			if (subItems.length > 0) {
				navItems.push({
					title: folderTitle,
					url: `/${folderPath}`,
					icon: folderIcon,
					iconColor: folderIconColor,
					isFolder: true,
					isActive: false,
					items: subItems
				});
			}
		}
	}

	return navItems;
}

// Collect pinned notes from tree (notes with pin: true in frontmatter OR bases listed in pinned-config.js)
function collectPinnedNotes(tree, currentPath = '') {
	const pinned = [];

	for (const [key, value] of Object.entries(tree).sort(([a], [b]) => a.localeCompare(b))) {
		if (key === '_meta' || key === 'index') continue;

		if (value.path) {
			// This is a file
			const fileName = path.basename(value.path);
			const isBaseFile = value.path.endsWith('.base');
			const isPinnedInConfig = isBaseFile && pinnedConfig.pinned_bases?.includes(fileName);
			const isPinnedInFrontmatter = value.pin === 'true' || value.pin === true;
			
			// Check if it's pinned via frontmatter OR config
			if (isPinnedInFrontmatter || isPinnedInConfig) {
				const route = currentPath ? `/${currentPath}/${key}` : `/${key}`;
				pinned.push({
					name: value.title || key,
					url: route,
					icon: value.icon || null,
					iconColor: value.iconColor || null
				});
			}
		} else {
			// This is a folder - recurse into it
			const nestedPath = currentPath ? `${currentPath}/${key}` : key;
			pinned.push(...collectPinnedNotes(value, nestedPath));
		}
	}

	return pinned;
}

// Collect page notes from tree (notes with page: true in frontmatter)
function collectPageNotes(tree, currentPath = '') {
	const pages = [];

	for (const [key, value] of Object.entries(tree).sort(([a], [b]) => a.localeCompare(b))) {
		if (key === '_meta' || key === 'index') continue;

		if (value.path) {
			// This is a file - check if it's a page
			if (value.page === 'true' || value.page === true) {
				const route = currentPath ? `/${currentPath}/${key}` : `/${key}`;
				pages.push({
					title: value.title || key,
					url: route,
					icon: value.icon || null
				});
			}
		} else {
			// This is a folder - recurse into it
			const nestedPath = currentPath ? `${currentPath}/${key}` : key;
			pages.push(...collectPageNotes(value, nestedPath));
		}
	}

	return pages;
}

// Collect all unique icon names from nav items
function collectIcons(items, icons = new Set()) {
	for (const item of items) {
		if (item.icon) {
			icons.add(item.icon);
		}
		if (item.items?.length) {
			collectIcons(item.items, icons);
		}
	}
	return icons;
}

// Convert kebab-case to PascalCase
function toPascalCase(str) {
	return str
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
}

// Generate a site map route that displays the entire note structure
function generateMapRoute(tree) {
	console.log('🗺️  Generating map route...');

	// Create map directory
	const mapPath = path.join(ROUTES_DIR, 'map');
	if (!fs.existsSync(mapPath)) {
		fs.mkdirSync(mapPath, { recursive: true });
	}

	// Generate the map page content
	const mapContent = `---
title: Site Map
description: Complete overview of all notes and content in this knowledge base
---

<script>
	import { toc } from '$lib/../toc/toc.js';
	import { processNavLink } from '$lib/utils/path-utils.js';
	import { page } from '$app/stores';
	import MapIcon from '@lucide/svelte/icons/map';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import FileIcon from '@lucide/svelte/icons/file';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	
	// Get current path for relative navigation
	const currentPath = $derived($page.url.pathname);
	
	// Helper to create relative links
	function getMapLink(path) {
		return processNavLink(\`/\${path}\`, currentPath);
	}
	
	// Count total notes in a tree section
	function countNotes(node) {
		let count = 0;
		for (const [key, value] of Object.entries(node)) {
			if (key === '_meta') continue;
			if (value.path) {
				count++;
			} else {
				count += countNotes(value);
			}
		}
		return count;
	}
	
	// Get folder metadata
	function getFolderMeta(value) {
		return value._meta || {};
	}
	
	// Sort entries: folders first, then files, alphabetically within each type
	function sortEntries(entries) {
		return entries.sort(([aKey, aValue], [bKey, bValue]) => {
			if (aKey === '_meta' || bKey === '_meta') return 0;
			
			// Folders first
			const aIsFolder = !aValue.path;
			const bIsFolder = !bValue.path;
			
			if (aIsFolder && !bIsFolder) return -1;
			if (!aIsFolder && bIsFolder) return 1;
			
			// Then alphabetically
			return aKey.localeCompare(bKey);
		});
	}
</script>

# {title}

<div class="text-muted-foreground mb-6">
	Explore the complete structure of this knowledge base. Click any item to navigate directly to that content.
</div>

<!-- Root level overview -->
<div class="mb-8">
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<MapIcon class="h-5 w-5" />
				Knowledge Base Overview
			</Card.Title>
			<Card.Description>
				Total notes: <Badge variant="secondary">{countNotes(toc)}</Badge>
			</Card.Description>
		</Card.Header>
	</Card.Root>
</div>

<!-- Directory tree display -->
<div class="space-y-6">
	{#each sortEntries(Object.entries(toc)) as [key, value]}
		{#if key !== '_meta'}
			{#if !value.path}
				<!-- This is a folder -->
				{@const folderMeta = getFolderMeta(value)}
				{@const folderTitle = folderMeta.title || folderMeta.__originalName || key}
				{@const noteCount = countNotes(value)}
				
				<Card.Root class="border-l-4 border-l-primary">
					<Card.Header>
						<Card.Title class="flex items-center gap-2 text-lg">
							<FolderIcon class="h-5 w-5" />
							<a href={getMapLink(key)} class="hover:underline">{folderTitle}</a>
							<Badge variant="outline">{noteCount} notes</Badge>
						</Card.Title>
						{#if folderMeta.description}
							<Card.Description>{folderMeta.description}</Card.Description>
						{/if}
					</Card.Header>
					<Card.Content>
						<!-- Show first few files in folder as preview -->
						<div class="grid gap-2">
							{#each sortEntries(Object.entries(value)).slice(0, 8) as [subKey, subValue]}
								{#if subKey !== '_meta'}
									{#if !subValue.path}
										<!-- Subfolder -->
										{@const subFolderMeta = getFolderMeta(subValue)}
										{@const subFolderTitle = subFolderMeta.title || subFolderMeta.__originalName || subKey}
										{@const subNoteCount = countNotes(subValue)}
										
										<div class="flex items-center gap-2 p-2 rounded-md bg-muted/30">
											<FolderIcon class="h-4 w-4" />
											<a href={getMapLink(key + '/' + subKey)} class="hover:underline font-medium flex-1">{subFolderTitle}</a>
											<Badge variant="secondary" class="text-xs">{subNoteCount}</Badge>
										</div>
									{:else}
										<!-- File -->
										<div class="flex items-center gap-2 text-sm">
											{#if subValue.path?.endsWith('.base')}
												<DatabaseIcon class="h-4 w-4" />
											{:else}
												<FileIcon class="h-4 w-4" />
											{/if}
											<a href={getMapLink(key + '/' + subKey)} class="hover:underline">{subValue.title || subKey}</a>
											{#if subValue.path?.endsWith('.base')}
												<Badge variant="outline" class="text-xs">Database</Badge>
											{/if}
										</div>
									{/if}
								{/if}
							{/each}
							{#if sortEntries(Object.entries(value)).length > 8}
								<div class="text-sm text-muted-foreground italic">
									...and {sortEntries(Object.entries(value)).length - 8} more items
								</div>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{:else}
				<!-- This is a root-level file -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							{#if value.path?.endsWith('.base')}
								<DatabaseIcon class="h-5 w-5" />
							{:else}
								<FileIcon class="h-5 w-5" />
							{/if}
							<a href={getMapLink(key)} class="hover:underline">{value.title || key}</a>
							{#if value.path?.endsWith('.base')}
								<Badge variant="outline">Database</Badge>
							{/if}
						</Card.Title>
						{#if value.description}
							<Card.Description>{value.description}</Card.Description>
						{/if}
					</Card.Header>
				</Card.Root>
			{/if}
		{/if}
	{/each}
</div>

<!-- Footer stats -->
<div class="mt-12 text-center text-sm text-muted-foreground">
	Site map generated from {Object.keys(toc).length} top-level sections
</div>
`;

	// Write the map page
	const pageFilePath = path.join(mapPath, '+page.svx');
	fs.writeFileSync(pageFilePath, mapContent, 'utf-8');

	console.log('  ✓ Created /map route with complete site overview');
}

// Generate nav.js for app-sidebar
function generateNavFile(tree) {
	const navMain = buildNavMain(tree);
	const pinnedNotes = collectPinnedNotes(tree);
	const pageNotes = collectPageNotes(tree);

	// Collect all unique icons
	const icons = collectIcons(navMain);
	collectIcons(pinnedNotes, icons);
	collectIcons(pageNotes, icons);

	// Generate icon imports
	const iconImports = Array.from(icons)
		.map(icon => `import ${toPascalCase(icon)}Icon from '@lucide/svelte/icons/${icon}';`)
		.join('\n');

	// Generate icon map
	const iconMapEntries = Array.from(icons)
		.map(icon => `  '${icon}': ${toPascalCase(icon)}Icon`)
		.join(',\n');

	const navContent = `// Auto-generated navigation data for app-sidebar
${iconImports}

// Map of icon names to components
export const iconMap = {
${iconMapEntries}
};

export const navMain = ${JSON.stringify(navMain, null, 2)};

export const pinnedNotes = ${JSON.stringify(pinnedNotes, null, 2)};

export const pageNotes = ${JSON.stringify(pageNotes, null, 2)};
`;
	fs.writeFileSync(NAV_FILE, navContent, 'utf-8');
}

// Main execution
function main() {
	console.log('📝 Generating routes from markdown files...');

	// Load ignore patterns
	const ignorePatterns = loadIgnorePatterns();
	if (ignorePatterns.length > 0) {
		console.log(`Loaded ${ignorePatterns.length} ignore pattern(s) from .contentignore`);
	}

	// STEP 1: Clean up existing generated routes (complete regeneration)
	cleanupGeneratedRoutes();

	// STEP 2: Scan content directory to build tree structure
	const tree = scanContentDirectory(CONTENT_DIR, CONTENT_DIR, ignorePatterns);

	// STEP 3: Generate new routes from current content
	console.log('Generating routes...');
	generateRoutes(tree);

	// STEP 3.5: Generate site map route
	generateMapRoute(tree);

	// STEP 4: Copy images and clean up orphaned ones
	console.log('📸 Copying images to static directory...');
	const copiedImages = copyImages(CONTENT_DIR, STATIC_DIR, fs, path);

	// Collect image references from content to identify orphans
	const referencedImages = collectImageReferences(CONTENT_DIR);

	// Combine copied images and referenced images to get all valid images
	const validImages = new Set([...copiedImages, ...referencedImages]);
	cleanupOrphanedImages(validImages);

	// STEP 5: Generate fresh navigation files
	console.log('Generating toc.js...');
	generateTocFile(tree);

	console.log('Generating nav.js for sidebar...');
	generateNavFile(tree);

	console.log('\n✓ Routes generated successfully');
	console.log('  All content has been completely regenerated');
	console.log('  Deleted notes and orphaned images have been cleaned up');
}

main();
