/**
 * Ignore pattern handling for .contentignore file
 * Manages which files/folders should be excluded from route generation
 */

import fs from 'fs';

/**
 * Load and parse .contentignore file
 * @param {string} ignoreFilePath - Path to .contentignore file
 * @returns {Array<string|RegExp>} Array of ignore patterns
 */
export function loadIgnorePatterns(ignoreFilePath) {
    if (!fs.existsSync(ignoreFilePath)) {
        return [];
    }

    const content = fs.readFileSync(ignoreFilePath, 'utf-8');

    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(pattern => {
            // Convert glob patterns to regex
            if (pattern.includes('*')) {
                let escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
                escaped = escaped.replace(/\\\*/g, '.*');

                if (pattern.startsWith('*')) {
                    escaped = escaped.substring(2);
                    return new RegExp(escaped + '$');
                }
                return new RegExp('^' + escaped + '$');
            }
            return pattern;
        });
}

/**
 * Check if a path should be ignored based on patterns
 * @param {string} itemName - File or folder name/path to check
 * @param {Array<string|RegExp>} ignorePatterns - Patterns to match against
 * @returns {boolean} True if should be ignored
 */
export function shouldIgnore(itemName, ignorePatterns) {
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
