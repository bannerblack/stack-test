/**
 * Template selection and rendering utilities
 * Handles template selection logic and route generation with templates
 */

import { parseFrontmatter, serializeFrontmatter } from './processors/frontmatter-parser.js';
import { processContent, determineNoteType } from './processors/content-processor.js';
import { extractImageFilename } from './processors/image-processor.js';

/**
 * Template type configuration
 */
export const TEMPLATE_TYPES = {
    general: {
        name: 'GeneralNote',
        component: 'GeneralNote',
        description: 'Default template for regular markdown notes'
    },
    table: {
        name: 'TableBase',
        component: 'TableBase',
        description: 'Template for database/table views'
    },
    cover: {
        name: 'CoverBase',
        component: 'CoverBase',
        description: 'Template for notes with prominent cover images'
    }
};

/**
 * Select template based on note properties
 * @param {Object} frontmatter - Note frontmatter
 * @param {string} filePath - File path
 * @returns {string} Template type: 'general', 'table', or 'cover'
 */
export function selectTemplate(frontmatter, filePath) {
    return determineNoteType(frontmatter, filePath);
}

/**
 * Generate route content using template system
 * @param {string} rawContent - Raw markdown content
 * @param {string} filePath - Source file path
 * @param {string} pagePath - Route page path (slug)
 * @param {Object} obsidianTypes - Obsidian type definitions
 * @param {Object} fileStats - Filesystem stats (birthtime, mtime)
 * @returns {string} Generated .svx content
 */
export function generateTemplatedRoute(rawContent, filePath, pagePath, obsidianTypes = {}, fileStats = null) {
    // Parse frontmatter
    const { frontmatter, content } = parseFrontmatter(rawContent, obsidianTypes);

    // Add filesystem dates if not already in frontmatter
    if (fileStats) {
        if (!frontmatter.created && !frontmatter.date) {
            frontmatter.created = fileStats.birthtime.toISOString();
        }
        if (!frontmatter.modified && !frontmatter.updated) {
            frontmatter.modified = fileStats.mtime.toISOString();
        }
    }

    // Determine template type
    const templateType = selectTemplate(frontmatter, filePath);
    const template = TEMPLATE_TYPES[templateType];

    if (!template) {
        throw new Error(`Unknown template type: ${templateType}`);
    }

    // Process content based on template type
    // All templates: Process all wikilinks, tokens, images, and embeds during generation
    // This ensures wikilinks are converted to WikiLink components before mdsvex runs
    const processOptions = {}; // Process everything for all templates
    let processedContent = processContent(content, frontmatter, processOptions);

    // Check if WikiLink components are used and remove any script tags added by processors
    const hasWikiLinks = processedContent.includes('<WikiLink');
    if (hasWikiLinks) {
        // Remove any script tags that were added for WikiLink imports (they'll be added to the outer script)
        processedContent = processedContent.replace(/<script[^>]*>\s*import WikiLink from ['"].*?['"];\s*<\/script>\s*/g, '');
    }

    // Generate the .svx file content
    let svxContent = '';

    // Add frontmatter
    svxContent += serializeFrontmatter(frontmatter);

    // Add script with imports
    svxContent += `<script>\n`;
    svxContent += `  import ${template.component} from '$lib/templates/${template.component}.svelte';\n`;
    if (hasWikiLinks) {
        svxContent += `  import WikiLink from '$lib/components/WikiLink.svelte';\n`;
    }
    svxContent += `  const frontmatter = ${JSON.stringify(frontmatter, null, 2)};\n`;
    svxContent += `  const pagePath = '${pagePath.replace(/'/g, "\\'")}';\n`;
    svxContent += `</script>\n\n`;

    // For general template, use component as wrapper with markdown in slot
    if (templateType === 'general') {
        svxContent += `<${template.component} {frontmatter} {pagePath}>\n\n`;

        // Add the markdown content directly (mdsvex will process it inside the slot)
        svxContent += processedContent + '\n\n';

        svxContent += `</${template.component}>\n`;

    } else {
        // For table/cover templates, use component with base64-encoded content
        const contentBase64 = Buffer.from(processedContent).toString('base64');
        svxContent += `  const content = atob('${contentBase64}');\n`;
        svxContent += `</script>\n\n`;

        svxContent += `<${template.component}\n`;
        svxContent += `  {frontmatter}\n`;
        svxContent += `  {pagePath}\n`;
        svxContent += `  {content}\n`;
        svxContent += `/>\n`;
    }

    return svxContent;
}

/**
 * Generate route content for .base files (backward compatible)
 * @param {Object} route - Route object with metadata
 * @returns {string} Generated .svx content
 */
export function generateBaseFileRoute(route) {
    const frontmatter = { ...route };
    delete frontmatter.path;
    delete frontmatter.slug;
    delete frontmatter.key;

    const templateType = selectTemplate(frontmatter, route.path);
    const template = TEMPLATE_TYPES[templateType];

    let svxContent = '';

    // Add frontmatter
    svxContent += serializeFrontmatter(frontmatter);

    // Add script
    svxContent += `<script>\n`;
    svxContent += `  import ${template.component} from '$lib/templates/${template.component}.svelte';\n`;
    svxContent += `\n`;
    svxContent += `  const frontmatter = ${JSON.stringify(frontmatter, null, 2)};\n`;
    svxContent += `  const pagePath = '${route.slug}';\n`;
    svxContent += `</script>\n\n`;

    // Add template component
    svxContent += `<${template.component}\n`;
    svxContent += `  {frontmatter}\n`;
    svxContent += `  {pagePath}\n`;
    svxContent += `  content=""\n`;
    svxContent += `/>\n`;

    return svxContent;
}
