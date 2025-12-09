/**
 * Image management
 * Handles image copying and orphan cleanup
 */

import fs from 'fs';
import path from 'path';
import { FILE_PATTERNS } from './constants.js';

/**
 * Collect all image references from markdown content
 * @param {string} contentDir - Content directory to scan
 * @returns {Set<string>} Set of referenced image filenames
 */
export function collectImageReferences(contentDir) {
    const imageRefs = new Set();

    function scanForImages(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                scanForImages(fullPath);
            } else if (entry.isFile() && isMarkdownFile(entry.name)) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                extractImageReferences(content, imageRefs);
            }
        }
    }

    scanForImages(contentDir);
    return imageRefs;
}

/**
 * Extract image references from content
 * @param {string} content - Markdown content
 * @param {Set<string>} imageRefs - Set to add references to
 */
function extractImageReferences(content, imageRefs) {
    const imagePatterns = [
        /!\[.*?\]\(([^)]+\.(jpg|jpeg|png|gif|svg|webp|bmp))\)/gi,
        /\[\[([^\]]+\.(jpg|jpeg|png|gif|svg|webp|bmp))\]\]/gi,
        /!\[\[([^\]]+\.(jpg|jpeg|png|gif|svg|webp|bmp))\]\]/gi
    ];

    for (const pattern of imagePatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const imagePath = match[1];
            const filename = path.basename(imagePath);
            imageRefs.add(filename);
        }
    }
}

/**
 * Clean up orphaned images in static directory
 * @param {string} staticDir - Static directory path
 * @param {Set<string>} validImages - Set of valid image filenames
 */
export function cleanupOrphanedImages(staticDir, validImages) {
    if (!fs.existsSync(staticDir)) return;

    console.log('🧹 Cleaning up orphaned images...');
    const staticFiles = fs.readdirSync(staticDir);

    for (const file of staticFiles) {
        const filePath = path.join(staticDir, file);
        const stat = fs.statSync(filePath);

        // Only process image files
        if (stat.isFile() && isImageFile(file)) {
            if (!validImages.has(file)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  Removed orphaned image: ${file}`);
            }
        }
    }
}

/**
 * Check if file is an image
 * @param {string} filename - Filename to check
 * @returns {boolean} True if image file
 */
function isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return FILE_PATTERNS.images.includes(ext);
}

/**
 * Check if file is markdown
 * @param {string} filename - Filename to check
 * @returns {boolean} True if markdown file
 */
function isMarkdownFile(filename) {
    return filename.endsWith('.md') ||
        filename.endsWith('.svx') ||
        filename.endsWith('.base');
}
