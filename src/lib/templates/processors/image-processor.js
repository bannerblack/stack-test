/**
 * Image processing utilities
 * Handles image path resolution, copying, and template token replacement
 */

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'];

/**
 * Check if file is an image
 * @param {string} filename - File name
 * @returns {boolean}
 */
export function isImage(filename) {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Extract image filename from wikilink format
 * @param {string} value - Image value (wikilink or direct path)
 * @returns {string|null} Image filename or null
 */
export function extractImageFilename(value) {
    if (!value) return null;

    // Handle wikilink format [[image.jpg]]
    const wikilinkMatch = value.match(/\[\[([^\]]+)\]\]/);
    if (wikilinkMatch) {
        return wikilinkMatch[1];
    }

    // Handle direct path
    if (typeof value === 'string' && isImage(value)) {
        // Extract just the filename
        const parts = value.split('/');
        return parts[parts.length - 1];
    }

    return null;
}

/**
 * Copy images from source directory to static directory
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target directory path
 * @param {Object} fs - File system module
 * @param {Object} path - Path module
 * @returns {Set<string>} Set of copied image filenames
 */
export function copyImages(sourceDir, targetDir, fs, path) {
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const copiedImages = new Set();

    function copyImagesRecursively(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Skip .obsidian and other hidden directories
                if (entry.name.startsWith('.')) {
                    continue;
                }
                copyImagesRecursively(fullPath);
            } else if (entry.isFile() && isImage(entry.name)) {
                const targetPath = path.join(targetDir, entry.name);
                copiedImages.add(entry.name);

                // Only copy if file doesn't exist or is newer
                if (!fs.existsSync(targetPath) ||
                    fs.statSync(fullPath).mtime > fs.statSync(targetPath).mtime) {
                    fs.copyFileSync(fullPath, targetPath);
                }
            }
        }
    }

    copyImagesRecursively(sourceDir);
    return copiedImages;
}

/**
 * Scan content for image references
 * @param {string} contentDir - Content directory path
 * @param {Object} fs - File system module
 * @param {Object} path - Path module
 * @returns {Set<string>} Set of referenced image filenames
 */
export function scanForImageReferences(contentDir, fs, path) {
    const imageRefs = new Set();

    const imagePatterns = [
        /!\[\[([^\]]+)\]\]/g,  // ![[image.jpg]]
        /!\[([^\]]*)\]\(([^)]+)\)/g,  // ![alt](image.jpg)
        /image:\s*["']?\[\[([^\]]+)\]\]["']?/gi,  // image: [[image.jpg]]
        /image:\s*["']([^"']+)["']/gi  // image: "image.jpg"
    ];

    function scanDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                scanDirectory(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.svx'))) {
                const content = fs.readFileSync(fullPath, 'utf-8');

                for (const pattern of imagePatterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        const imagePath = match[1] || match[2];
                        const filename = path.basename(imagePath);
                        if (isImage(filename)) {
                            imageRefs.add(filename);
                        }
                    }
                }
            }
        }
    }

    scanDirectory(contentDir);
    return imageRefs;
}

/**
 * Process <Image> template token in content
 * Replaces <Image> or <Image property="name"/> with actual image component
 * @param {string} content - Note content
 * @param {Object} frontmatter - Frontmatter properties
 * @returns {string} Processed content
 */
export function processImageTokens(content, frontmatter) {
    // Pattern to match <Image/> or <Image property="name"/>
    const imageTokenPattern = /<Image\s*(?:property=["']([^"']+)["'])?\s*\/?>/gi;

    return content.replace(imageTokenPattern, (match, propertyName) => {
        // Default to 'image' property if not specified
        const prop = propertyName || 'image';
        const imageValue = frontmatter[prop];

        if (!imageValue) {
            return `<!-- No image found in ${prop} property -->`;
        }

        const filename = extractImageFilename(imageValue);
        if (!filename) {
            return `<!-- Invalid image format in ${prop} property -->`;
        }

        // Generate image component
        const alt = frontmatter.title || frontmatter['file.name'] || 'Image';
        return `<img src="/{base}/${filename}" alt="${alt}" class="note-image" loading="lazy" />`;
    });
}
