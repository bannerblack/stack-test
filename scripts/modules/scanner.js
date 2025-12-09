/**
 * Content directory scanner
 * Recursively scans markdown files and builds tree structure
 */

import fs from 'fs';
import path from 'path';
import { createSlug } from './text-utils.js';
import { parseFrontmatter } from './frontmatter.js';
import { shouldIgnore } from './ignore-handler.js';

/**
 * Scan directory recursively and build content tree
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base content directory
 * @param {Array} ignorePatterns - Patterns for ignored files
 * @param {Object} obsidianTypes - Obsidian type definitions
 * @returns {Object} Tree structure representing content hierarchy
 */
export function scanContentDirectory(dir, baseDir, ignorePatterns = [], obsidianTypes = {}) {
    const tree = {};
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const relativePath = path.relative(baseDir, path.join(dir, entry.name));
        const normalizedPath = relativePath.replace(/\\/g, '/');

        // Check ignore patterns
        if (shouldIgnore(normalizedPath, ignorePatterns) ||
            shouldIgnore(entry.name, ignorePatterns)) {
            continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            const subtree = scanContentDirectory(fullPath, baseDir, ignorePatterns, obsidianTypes);

            // Only add directory if it has content
            if (Object.keys(subtree).length > 0) {
                const dirSlug = createSlug(entry.name);

                // Check for index.md for folder metadata
                const indexPath = path.join(fullPath, 'index.md');
                if (fs.existsSync(indexPath)) {
                    const indexContent = fs.readFileSync(indexPath, 'utf-8');
                    const { metadata } = parseFrontmatter(indexContent, false, obsidianTypes);
                    subtree._meta = { ...metadata, __originalName: entry.name };
                } else {
                    subtree._meta = { __originalName: entry.name };
                }

                tree[dirSlug] = subtree;
            }
        } else if (entry.isFile() && isMarkdownFile(entry.name)) {
            addFileToTree(tree, entry, fullPath, normalizedPath, obsidianTypes);
        }
    }

    return tree;
}

/**
 * Check if file is a markdown/base file
 * @param {string} filename - Filename to check
 * @returns {boolean} True if markdown file
 */
function isMarkdownFile(filename) {
    return filename.endsWith('.md') ||
        filename.endsWith('.svx') ||
        filename.endsWith('.base');
}

/**
 * Add file entry to tree structure
 * @param {Object} tree - Tree to add file to
 * @param {Object} entry - Directory entry
 * @param {string} fullPath - Full file path
 * @param {string} normalizedPath - Normalized relative path
 * @param {Object} obsidianTypes - Obsidian type definitions
 */
function addFileToTree(tree, entry, fullPath, normalizedPath, obsidianTypes) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const isBaseFile = entry.name.endsWith('.base');
    const { metadata } = parseFrontmatter(content, isBaseFile, obsidianTypes);

    const baseName = path.basename(entry.name, path.extname(entry.name));
    const extension = path.extname(entry.name).substring(1);
    const baseSlug = createSlug(baseName);

    // Handle filename collisions by appending extension
    let finalKey = baseSlug;
    if (tree[baseSlug]) {
        if (!tree[baseSlug].__hasExtension) {
            const existingPath = tree[baseSlug].path;
            const existingExt = path.extname(existingPath).substring(1);
            const existingSlug = `${baseSlug}-${existingExt}`;

            tree[existingSlug] = { ...tree[baseSlug], __hasExtension: true };
            delete tree[baseSlug];
        }

        finalKey = `${baseSlug}-${extension}`;
    }

    tree[finalKey] = {
        path: normalizedPath,
        title: metadata.title || baseName,
        __hasExtension: finalKey !== baseSlug,
        icon: isBaseFile && !metadata.icon ? 'database' : metadata.icon,
        ...metadata
    };
}
