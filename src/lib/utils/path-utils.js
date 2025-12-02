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
    const cleanCurrent = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;

    // If forcing absolute or config says to use absolute
    if (forceAbsolute || config.paths.forceAbsolute || !config.paths.useRelative) {
        return `${base || config.site.baseUrl}/${cleanTarget}`;
    }

    // For relative paths, calculate the relationship
    if (!cleanCurrent || cleanCurrent === cleanTarget) {
        // Same level or root
        return cleanTarget || './';
    }

    // Calculate relative path
    const currentParts = cleanCurrent.split('/').filter(Boolean);
    const targetParts = cleanTarget.split('/').filter(Boolean);

    // Find common base
    let commonLength = 0;
    while (
        commonLength < currentParts.length &&
        commonLength < targetParts.length &&
        currentParts[commonLength] === targetParts[commonLength]
    ) {
        commonLength++;
    }

    // Build relative path
    const upLevels = currentParts.length - commonLength;
    const downPath = targetParts.slice(commonLength);

    if (upLevels === 0 && downPath.length === 0) {
        return './';
    }

    const relativePath = '../'.repeat(upLevels) + downPath.join('/');
    return relativePath || './';
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

    return getPath(href, currentPath);
}