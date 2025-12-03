/**
 * Content processing utilities
 * Handles wikilink processing, template token replacement, and content transformation
 */

import { processWikilinks, addWikiLinkImport } from '../../utils/wikilink-processor.js';
import { processImageTokens } from './image-processor.js';

/**
 * Process all template tokens in content
 * @param {string} content - Note content
 * @param {Object} frontmatter - Frontmatter properties
 * @returns {string} Processed content
 */
export function processTemplateTokens(content, frontmatter) {
    let processed = content;

    // Process <Image> tokens
    processed = processImageTokens(processed, frontmatter);

    // Add more token processors here as needed
    // e.g., <Calendar>, <PropertyTable>, etc.

    return processed;
}

/**
 * Process wikilinks and add necessary imports
 * @param {string} content - Note content
 * @returns {string} Processed content
 */
export function processContentWikilinks(content) {
    let processed = processWikilinks(content);
    processed = addWikiLinkImport(processed);
    return processed;
}

/**
 * Full content processing pipeline
 * @param {string} content - Note content
 * @param {Object} frontmatter - Frontmatter properties
 * @param {Object} options - Processing options
 * @returns {string} Fully processed content
 */
export function processNoteContent(content, frontmatter, options = {}) {
    let processed = content;

    // Step 1: Process template tokens (<Image>, <Calendar>, etc.)
    if (options.processTokens !== false) {
        processed = processTemplateTokens(processed, frontmatter);
    }

    // Step 2: Process wikilinks
    if (options.processWikilinks !== false) {
        processed = processContentWikilinks(processed);
    }

    return processed;
}

/**
 * Determine note type from frontmatter or file extension
 * @param {Object} frontmatter - Frontmatter properties
 * @param {string} filePath - File path
 * @returns {string} Note type: 'table', 'cover', 'general'
 */
export function determineNoteType(frontmatter, filePath) {
    // Explicit template in frontmatter
    if (frontmatter.note_template) {
        return frontmatter.note_template.toLowerCase();
    }

    // Auto-detect from file extension
    if (filePath.endsWith('.base')) {
        // Check if it has views (table base) or cover image (cover base)
        if (frontmatter.views && Array.isArray(frontmatter.views)) {
            return 'table';
        }
        if (frontmatter.image || frontmatter.cover) {
            return 'cover';
        }
        return 'table'; // Default for .base files
    }

    // Auto-detect from properties
    if (frontmatter.views || frontmatter.filters || frontmatter.formulas) {
        return 'table';
    }

    if (frontmatter.cover || (frontmatter.image && frontmatter.cover_style)) {
        return 'cover';
    }

    // Default to general note
    return 'general';
}
