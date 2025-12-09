/**
 * Content Processing Pipeline
 * 
 * Transforms markdown content through a series of processors in a clear, linear order.
 * Each processor is a pure function that takes content and returns transformed content.
 * 
 * Pipeline stages:
 * 1. Template tokens (<Image>, <Calendar>) → Component markup
 * 2. Line breaks (Obsidian-style) → Two trailing spaces (markdown line breaks)
 * 3. Image wikilinks (![[image.jpg]]) → Standard markdown images
 * 4. Text wikilinks ([[Page]]) → WikiLink components
 * 5. Embeds (![[Note]]) → Embedded content
 * 
 * @module content-processor
 */

import { extractImageFilename } from './image-processor.js';

/**
 * Main content processing pipeline
 * Orchestrates all content transformations in a predictable order
 * 
 * @param {string} content - Raw markdown content to process
 * @param {Object} frontmatter - Parsed frontmatter properties
 * @param {Object} options - Processing options to enable/disable specific processors
 * @param {boolean} [options.processTokens=true] - Process template tokens like <Image>
 * @param {boolean} [options.processImages=true] - Convert image wikilinks to markdown
 * @param {boolean} [options.processLinks=true] - Convert text wikilinks to components
 * @param {boolean} [options.processEmbeds=true] - Process note embeds
 * @param {boolean} [options.processLineBreaks=true] - Process Obsidian-style line breaks
 * @returns {string} Fully processed content ready for rendering
 * 
 * @example
 * const processed = processContent(content, frontmatter, {
 *   processTokens: true,
 *   processLinks: false // Let mdsvex handle links
 * });
 */
export function processContent(content, frontmatter, options = {}) {
    let result = content;

    // Stage 1: Process custom template tokens first
    // These need to be resolved before markdown processing
    if (options.processTokens !== false) {
        result = processTemplateTokens(result, frontmatter);
    }

    // Stage 2: Process line breaks (Obsidian-style) BEFORE wikilinks
    // This ensures line breaks are added while the original [[syntax]] is still intact
    // so the line break logic can properly detect line boundaries
    if (options.processLineBreaks !== false) {
        result = processLineBreaks(result);
    }

    // Stage 3: Process image wikilinks
    // Convert ![[image.jpg]] to standard markdown format
    if (options.processImages !== false) {
        result = processImageWikilinks(result);
    }

    // Stage 4: Process text wikilinks
    // Convert [[Page]] to <WikiLink> components
    if (options.processLinks !== false) {
        result = processTextWikilinks(result);
    }

    // Stage 5: Process embeds
    // Convert ![[Note]] to embedded content
    if (options.processEmbeds !== false) {
        result = processEmbedWikilinks(result);
    }

    return result;
}

/**
 * Process custom template tokens
 * Replaces tokens like <Image property="cover"/> with actual component markup
 * 
 * @param {string} content - Content with potential template tokens
 * @param {Object} frontmatter - Frontmatter to extract property values from
 * @returns {string} Content with tokens replaced
 * 
 * @example
 * // Input: <Image property="cover"/>
 * // Output: <img src="/cover.jpg" alt="..." />
 */
export function processTemplateTokens(content, frontmatter) {
    let processed = content;

    // Process <Image> tokens
    // Matches: <Image/>, <Image />, <Image property="cover"/>, etc.
    const imageTokenPattern = /<Image\s*(?:property=["']([^"']+)["'])?\s*\/?>/gi;

    processed = processed.replace(imageTokenPattern, (match, propertyName) => {
        const prop = propertyName || 'image';
        const imageValue = frontmatter[prop];

        if (!imageValue) {
            // Return empty string for missing images (fail silently)
            return '';
        }

        const filename = extractImageFilename(imageValue);
        if (!filename) {
            console.warn(`Invalid image format in ${prop} property:`, imageValue);
            return '';
        }

        const alt = frontmatter.title || 'Image';
        return `<img src="/${filename}" alt="${alt}" class="note-image" loading="lazy" />`;
    });

    // Add more token processors here as needed:
    // processed = processCalendarTokens(processed, frontmatter);
    // processed = processPropertyTableTokens(processed, frontmatter);

    return processed;
}

/**
 * Process image wikilinks
 * Converts Obsidian-style image links to standard markdown format
 * 
 * @param {string} content - Content with potential image wikilinks
 * @returns {string} Content with standard markdown images
 * 
 * @example
 * // Input: ![[cover.jpg]]
 * // Output: ![cover.jpg](/cover.jpg)
 */
export function processImageWikilinks(content) {
    // Match: ![[image.jpg]] or ![[path/to/image.jpg]]
    const imageWikilinkPattern = /!\[\[([^\]]+\.(jpg|jpeg|png|gif|webp|svg|bmp))\]\]/gi;

    return content.replace(imageWikilinkPattern, (match, imagePath) => {
        // Extract just the filename from the path
        const filename = imagePath.split('/').pop();
        const cleanFilename = filename.trim();

        // Generate standard markdown image
        return `![${cleanFilename}](/${cleanFilename})`;
    });
}

/**
 * Process line breaks (Obsidian-style)
 * Converts single line breaks between text lines to markdown line breaks (two trailing spaces)
 * Preserves double line breaks (paragraph breaks) and doesn't affect code blocks
 * 
 * @param {string} content - Content with potential single line breaks
 * @returns {string} Content with trailing spaces inserted for line breaks
 * 
 * @example
 * // Input:
 * // Line 1
 * // Line 2
 * // Line 3
 * //
 * // Output:
 * // Line 1  (two trailing spaces)
 * // Line 2  (two trailing spaces)
 * // Line 3
 */
export function processLineBreaks(content) {
    // Split content into lines
    const lines = content.split('\n');
    const processed = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1];

        // Track code block state (``` or ~~~)
        if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
            inCodeBlock = !inCodeBlock;
            processed.push(line);
            continue;
        }

        // If we're in a code block, don't process line breaks
        if (inCodeBlock) {
            processed.push(line);
            continue;
        }

        // If current line has content and next line exists with content,
        // add two trailing spaces (markdown line break) after current line (Obsidian behavior)
        if (line.trim() && nextLine !== undefined && nextLine.trim()) {
            // Don't add line break if next line is a heading, list, or block element
            const nextLineStartsBlock = /^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|~~~|\||<)/.test(nextLine.trim());
            const currentLineEndsBlock = /(<\/(p|div|h[1-6]|ul|ol|li|blockquote)>|-->)$/.test(line.trim());

            if (!nextLineStartsBlock && !currentLineEndsBlock) {
                // Check if this line contains wikilink syntax - if so, we'll need <br> after conversion
                // Use <br>\n instead of trailing spaces for better compatibility with components
                if (line.includes('[[') || line.includes('![[')) {
                    processed.push(line + '<br>');
                } else {
                    // Use two trailing spaces (standard markdown line break) which mdsvex will respect
                    processed.push(line + '  ');
                }
                continue;
            }
        }

        processed.push(line);
    }

    return processed.join('\n');
}

/**
 * Process text wikilinks
 * Converts [[Page Title]] to WikiLink components with import statement
 * 
 * @param {string} content - Content with potential text wikilinks
 * @returns {string} Content with WikiLink components and import
 * 
 * @example
 * // Input: [[My Page]]
 * // Output: <WikiLink path="My Page" />
 * // Also adds: import WikiLink from '$lib/components/WikiLink.svelte';
 */
export function processTextWikilinks(content) {
    // First, convert wikilinks to components
    // Match: [[Page Title]] or [[Page|Display Text]]
    // BUT NOT ![[...]] (embeds - handled separately)
    const wikilinkPattern = /(?<!!)(\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\])/g;

    let processed = content.replace(wikilinkPattern, (match, fullMatch, path, alias) => {
        const aliasAttr = alias ? ` alias="${escapeAttribute(alias)}"` : '';
        return `<WikiLink path="${escapeAttribute(path)}"${aliasAttr} />`;
    });

    // Add WikiLink import if needed
    if (processed.includes('<WikiLink')) {
        processed = addWikiLinkImport(processed);
    }

    return processed;
}

/**
 * Process embed wikilinks
 * Converts ![[Note Title]] to embedded content or placeholder
 * 
 * @param {string} content - Content with potential embeds
 * @returns {string} Content with embeds processed
 * 
 * @example
 * // Input: ![[Another Note]]
 * // Output: <WikiLink path="Another Note" isEmbed={true} />
 */
export function processEmbedWikilinks(content) {
    // Match: ![[Note Title]] or ![[Note|Display Text]]
    // This is different from image embeds (handled in processImageWikilinks)
    const embedPattern = /!\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

    let processed = content.replace(embedPattern, (match, path, alias) => {
        // Check if this is an image (already handled)
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(path)) {
            return match; // Let processImageWikilinks handle it
        }

        // For PDFs and other file types, convert to WikiLink component with isEmbed
        // This will show the unsupported embed warning
        const aliasAttr = alias ? ` alias="${escapeAttribute(alias)}"` : '';
        return `<WikiLink path="${escapeAttribute(path)}" isEmbed={true}${aliasAttr} />`;
    });

    // Add WikiLink import if needed
    if (processed.includes('<WikiLink') && !content.includes('import WikiLink')) {
        processed = addWikiLinkImport(processed);
    }

    return processed;
}

/**
 * Add WikiLink component import to script section
 * Creates a script block if one doesn't exist
 * 
 * @param {string} content - Content that uses WikiLink components
 * @returns {string} Content with import statement added
 * @private
 */
function addWikiLinkImport(content) {
    // Check if import already exists
    if (content.includes("import WikiLink from '$lib/components/WikiLink.svelte'")) {
        return content;
    }

    // Try to find existing script tag
    const scriptMatch = content.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/);

    if (scriptMatch) {
        // Add to existing script section
        const [fullMatch, openTag, scriptContent, closeTag] = scriptMatch;
        const newScript = `${openTag}\n\timport WikiLink from '$lib/components/WikiLink.svelte';${scriptContent}${closeTag}`;
        return content.replace(fullMatch, newScript);
    }

    // No script tag exists - add one after frontmatter or at start
    const frontmatterMatch = content.match(/^---[\s\S]*?---/);

    if (frontmatterMatch) {
        // Insert after frontmatter
        const afterFrontmatter = frontmatterMatch[0];
        const rest = content.substring(afterFrontmatter.length);
        return `${afterFrontmatter}\n\n<script>\n\timport WikiLink from '$lib/components/WikiLink.svelte';\n</script>${rest}`;
    }

    // Insert at beginning
    return `<script>\n\timport WikiLink from '$lib/components/WikiLink.svelte';\n</script>\n\n${content}`;
}

/**
 * Escape attribute values for safe HTML insertion
 * Prevents XSS and malformed HTML from user content
 * 
 * @param {string} value - Attribute value to escape
 * @returns {string} Escaped value safe for HTML attributes
 * @private
 */
function escapeAttribute(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Determine note template type from frontmatter and file path
 * 
 * Priority order:
 * 1. Explicit note_template in frontmatter (highest priority)
 * 2. Table indicators (views, filters, formulas)
 * 3. Cover indicators (cover, cover_style properties)
 * 4. File extension (.base defaults differently than .md)
 * 5. Default to 'general' (lowest priority)
 * 
 * @param {Object} frontmatter - Parsed frontmatter properties
 * @param {string} filePath - File path for extension checking
 * @returns {'general'|'table'|'cover'} Template type identifier
 * 
 * @example
 * determineNoteType({ note_template: 'table' }, 'note.md') // => 'table'
 * determineNoteType({ views: [...] }, 'database.base') // => 'table'
 * determineNoteType({ cover: true }, 'page.md') // => 'cover'
 * determineNoteType({}, 'note.md') // => 'general'
 */
export function determineNoteType(frontmatter, filePath) {
    // Priority 1: Explicit override in frontmatter
    if (frontmatter.note_template) {
        const template = frontmatter.note_template.toLowerCase();
        // Validate template type
        if (['general', 'table', 'cover'].includes(template)) {
            return template;
        }
        console.warn(`Invalid note_template value: ${frontmatter.note_template}. Using auto-detection.`);
    }

    // Priority 2: Table indicators (works for both .base and .md files)
    if (frontmatter.views || frontmatter.filters || frontmatter.formulas) {
        return 'table';
    }

    // Priority 3: Cover indicators
    if (frontmatter.cover || frontmatter.cover_style) {
        return 'cover';
    }

    // Priority 4: File extension specific defaults
    const isBaseFile = filePath.endsWith('.base');

    if (isBaseFile) {
        // Base files default to table, unless they have an image (then cover)
        return frontmatter.image ? 'cover' : 'table';
    }

    // Priority 5: Default for markdown files
    return 'general';
}
