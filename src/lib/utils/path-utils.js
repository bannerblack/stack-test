// Path utilities for navigation and links
import { config } from '../../docs.config.js';
import { base } from '$app/paths';

/**
 * Generate a link path based on configuration preferences
 * @param {string} targetPath - The target path (e.g., 'drafts/note')
 * @param {string} currentPath - Current page path for relative calculation
 * @param {boolean} forceAbsolute - Force absolute path regardless of config
 * @returns {string} The appropriate path to use
 */
export function getPath(targetPath, currentPath = '', forceAbsolute = false) {
    // Clean up paths
    const cleanTarget = targetPath.startsWith('/') ? targetPath.slice(1) : targetPath;
    
    // For navigation, always use base path to ensure proper GitHub Pages URLs
    // This ensures links like /drafts/note become /stack-test/drafts/note
    return `${base}/${cleanTarget}`;
}

/**
 * Get absolute path (useful for canonical URLs, etc.)
 * @param {string} targetPath - The target path
 * @returns {string} Absolute path
 */
export function getAbsolutePath(targetPath) {
    const cleanTarget = targetPath.startsWith('/') ? targetPath.slice(1) : targetPath;
    return `${base || config.site.baseUrl}/${cleanTarget}`;
}

/**
 * Get relative path from current location
 * @param {string} targetPath - The target path
 * @param {string} currentPath - Current page path
 * @returns {string} Relative path
 */
export function getRelativePath(targetPath, currentPath = '') {
    return getPath(targetPath, currentPath, false);
}

/**
 * Utility for navigation components to get appropriate paths
 * @param {string} href - Original href
 * @param {string} currentPath - Current page path
 * @returns {string} Processed path based on config
 */
export function processNavLink(href, currentPath = '') {
    if (!href || href.startsWith('http') || href.startsWith('mailto:')) {
        // External links or special protocols - return as-is
        return href;
    }

    // For navigation links, always use base path to ensure proper GitHub Pages URLs
    const cleanTarget = href.startsWith('/') ? href.slice(1) : href;
    return `${base}/${cleanTarget}`;
}