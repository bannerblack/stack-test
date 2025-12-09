/**
 * Navigation structure builders
 * Generates navigation data for sidebar components
 */

import path from 'path';
import { pinnedConfig } from '../../src/layout-config.js';
import { toPascalCase } from './text-utils.js';

/**
 * Build navigation hierarchy from tree
 * @param {Object} tree - Content tree
 * @param {string} parentPath - Parent path in recursion
 * @returns {Array<Object>} Navigation items
 */
export function buildNavigation(tree, parentPath = '') {
    const navItems = [];

    for (const [key, value] of Object.entries(tree).sort(sortAlphabetically)) {
        if (key === '_meta' || key === 'index') continue;

        if (value.path) {
            // Root-level file
            if (parentPath === '' && !isPageNote(value)) {
                navItems.push(createNavItem(key, value, `/${key}`, false));
            }
        } else {
            // Folder with nested structure
            const folderMeta = value._meta || {};
            const folderPath = parentPath ? `${parentPath}/${key}` : key;
            const subItems = buildNestedNav(value, folderPath);

            if (subItems.length > 0) {
                navItems.push(createFolderNavItem(key, folderMeta, folderPath, subItems));
            }
        }
    }

    return navItems;
}

/**
 * Build nested navigation items
 * @param {Object} node - Tree node
 * @param {string} currentPath - Current path
 * @returns {Array<Object>} Navigation items
 */
function buildNestedNav(node, currentPath) {
    const items = [];
    const categorizedItems = {};
    const uncategorizedItems = [];

    for (const [key, value] of Object.entries(node).sort(sortAlphabetically)) {
        if (key === '_meta' || key === 'index') continue;

        if (value.path) {
            if (isPageNote(value)) continue;

            const item = createNavItem(key, value, `/${currentPath}/${key}`, false);

            // Group by category
            if (value.category) {
                if (!categorizedItems[value.category]) {
                    categorizedItems[value.category] = [];
                }
                categorizedItems[value.category].push(item);
            } else {
                uncategorizedItems.push(item);
            }
        } else {
            // Nested folder
            const folderMeta = value._meta || {};
            const nestedPath = `${currentPath}/${key}`;
            const nestedItems = buildNestedNav(value, nestedPath);

            if (nestedItems.length > 0) {
                items.push(createFolderNavItem(key, folderMeta, nestedPath, nestedItems));
            }
        }
    }

    // Combine: uncategorized -> categories -> folders
    const finalItems = [...uncategorizedItems];

    for (const category of Object.keys(categorizedItems).sort()) {
        finalItems.push({
            title: category,
            isCategory: true,
            isFolder: true,
            items: categorizedItems[category]
        });
    }

    finalItems.push(...items);
    return finalItems;
}

/**
 * Collect pinned notes from tree
 * @param {Object} tree - Content tree
 * @param {string} currentPath - Current path in recursion
 * @returns {Array<Object>} Pinned note items
 */
export function collectPinnedNotes(tree, currentPath = '') {
    const pinned = [];

    for (const [key, value] of Object.entries(tree).sort(sortAlphabetically)) {
        if (key === '_meta' || key === 'index') continue;

        if (value.path) {
            const fileName = path.basename(value.path);
            const isBaseFile = value.path.endsWith('.base');
            const isPinnedInConfig = isBaseFile && pinnedConfig.pinned_bases?.includes(fileName);
            const isPinnedInFrontmatter = value.pin === 'true' || value.pin === true;

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
            const nestedPath = currentPath ? `${currentPath}/${key}` : key;
            pinned.push(...collectPinnedNotes(value, nestedPath));
        }
    }

    return pinned;
}

/**
 * Collect page notes from tree
 * @param {Object} tree - Content tree
 * @param {string} currentPath - Current path in recursion
 * @returns {Array<Object>} Page note items
 */
export function collectPageNotes(tree, currentPath = '') {
    const pages = [];

    for (const [key, value] of Object.entries(tree).sort(sortAlphabetically)) {
        if (key === '_meta' || key === 'index') continue;

        if (value.path) {
            if (isPageNote(value)) {
                const route = currentPath ? `/${currentPath}/${key}` : `/${key}`;
                pages.push({
                    title: value.title || key,
                    url: route,
                    icon: value.icon || null
                });
            }
        } else {
            const nestedPath = currentPath ? `${currentPath}/${key}` : key;
            pages.push(...collectPageNotes(value, nestedPath));
        }
    }

    return pages;
}

/**
 * Collect all unique icons from navigation items
 * @param {Array<Object>} items - Navigation items
 * @param {Set<string>} icons - Set to add icons to
 * @returns {Set<string>} Set of icon names
 */
export function collectIcons(items, icons = new Set()) {
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

/**
 * Generate icon imports and map for nav file
 * @param {Set<string>} icons - Set of icon names
 * @returns {{imports: string, map: string}} Icon imports and map strings
 */
export function generateIconCode(icons) {
    const iconArray = Array.from(icons);

    const imports = iconArray
        .map(icon => `import ${toPascalCase(icon)}Icon from '@lucide/svelte/icons/${icon}';`)
        .join('\n');

    const map = iconArray
        .map(icon => `  '${icon}': ${toPascalCase(icon)}Icon`)
        .join(',\n');

    return { imports, map };
}

// Helper functions

function sortAlphabetically([a], [b]) {
    return a.localeCompare(b);
}

function isPageNote(value) {
    return value.page === 'true' || value.page === true;
}

function createNavItem(key, value, url, isFolder) {
    return {
        title: value.title || key,
        url,
        icon: value.icon || null,
        iconColor: value.iconColor || null,
        isFolder,
        items: []
    };
}

function createFolderNavItem(key, meta, path, items) {
    return {
        title: meta.title || meta.__originalName || key,
        url: `/${path}`,
        icon: meta.icon || null,
        iconColor: meta.iconColor || null,
        isFolder: true,
        isActive: false,
        items
    };
}
