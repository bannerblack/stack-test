/**
 * Frontmatter parsing for markdown and base files
 * Handles YAML frontmatter extraction and type conversion
 */

import yaml from 'js-yaml';
import { convertToProperType } from '../../src/lib/templates/processors/frontmatter-parser.js';

/**
 * Parse frontmatter from markdown content
 * @param {string} content - File content with optional frontmatter
 * @param {boolean} isBaseFile - Whether this is a .base file (entire content is YAML)
 * @param {Object} obsidianTypes - Obsidian type definitions
 * @returns {{metadata: Object, content: string}} Parsed metadata and remaining content
 */
export function parseFrontmatter(content, isBaseFile = false, obsidianTypes = {}) {
    // Base files treat entire content as YAML
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

    // Regular markdown files with frontmatter delimiters
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return { metadata: {}, content };
    }

    const frontmatterYaml = match[1];
    let metadata = {};

    try {
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

    return {
        metadata,
        content: content.substring(match[0].length)
    };
}
