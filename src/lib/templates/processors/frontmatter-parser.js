/**
 * Frontmatter parsing utilities
 * Handles parsing and type conversion of frontmatter properties
 */

import yaml from 'js-yaml';

/**
 * Load Obsidian type definitions if available
 * @param {string} contentDir - Path to content directory
 * @param {Object} fs - File system module
 * @param {Object} path - Path module
 * @returns {Object} Obsidian type definitions
 */
export function loadObsidianTypes(contentDir, fs, path) {
    let obsidianTypes = {};
    try {
        const typesPath = path.join(contentDir, '.obsidian', 'types.json');
        if (fs.existsSync(typesPath)) {
            const typesContent = fs.readFileSync(typesPath, 'utf-8');
            const typesData = JSON.parse(typesContent);
            obsidianTypes = typesData.types || {};
        }
    } catch (e) {
        console.warn('Could not load Obsidian types.json:', e.message);
    }
    return obsidianTypes;
}

/**
 * Convert value to proper type based on Obsidian types and smart defaults
 * @param {string} key - Property key
 * @param {any} value - Property value
 * @param {Object} obsidianTypes - Obsidian type definitions
 * @returns {any} Converted value
 */
export function convertToProperType(key, value, obsidianTypes = {}) {
    if (value == null) return value;

    // Convert Date objects to YYYY-MM-DD string format
    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Check if we have a specific type from Obsidian
    const obsidianType = obsidianTypes[key];
    if (obsidianType === 'text' || obsidianType === 'multitext') {
        return String(value);
    }
    if (obsidianType === 'number') {
        const num = Number(value);
        return isNaN(num) ? value : num;
    }

    // Smart defaults: only convert to number if it looks like a number
    if (typeof value === 'string') {
        // If it's a string that looks like a number
        if (/^-?\d+$/.test(value.trim())) {
            // Integer - convert to number
            return parseInt(value, 10);
        } else if (/^-?\d+\.\d+$/.test(value.trim())) {
            // Float - convert to number
            return parseFloat(value);
        }
        // Keep as string if it doesn't look like a number
        return value;
    }

    // Return as-is for other types
    return value;
}

/**
 * Parse frontmatter from markdown content
 * @param {string} content - Markdown content
 * @param {Object} obsidianTypes - Obsidian type definitions
 * @returns {Object} { frontmatter, content }
 */
export function parseFrontmatter(content, obsidianTypes = {}) {
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

    if (!frontmatterMatch) {
        return { frontmatter: {}, content };
    }

    try {
        const rawFrontmatter = yaml.load(frontmatterMatch[1]) || {};
        const bodyContent = frontmatterMatch[2];

        // Convert types
        const frontmatter = {};
        for (const [key, value] of Object.entries(rawFrontmatter)) {
            frontmatter[key] = convertToProperType(key, value, obsidianTypes);
        }

        return { frontmatter, content: bodyContent };
    } catch (e) {
        console.warn('Error parsing frontmatter:', e.message);
        return { frontmatter: {}, content };
    }
}

/**
 * Serialize frontmatter back to YAML string
 * @param {Object} frontmatter - Frontmatter object
 * @returns {string} YAML frontmatter string with delimiters
 */
export function serializeFrontmatter(frontmatter) {
    if (!frontmatter || Object.keys(frontmatter).length === 0) {
        return '';
    }

    const yamlStr = yaml.dump(frontmatter, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
    });

    return `---\n${yamlStr}---\n\n`;
}
