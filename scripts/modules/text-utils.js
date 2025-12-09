/**
 * Text utilities for slug generation and formatting
 * Pure functions with no side effects
 */

/**
 * Create URL-safe slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-safe slug
 */
export function createSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'untitled';
}

/**
 * Convert kebab-case to PascalCase
 * @param {string} str - Kebab-case string
 * @returns {string} PascalCase string
 */
export function toPascalCase(str) {
    return str
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}
