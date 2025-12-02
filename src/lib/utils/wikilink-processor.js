// Process wikilinks and embeds in markdown content
export function processWikilinks(content) {
    // Process embeds first (they start with !)
    content = content.replace(/!\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (match, path, alias) => {
        return `<WikiLink path="${path}" ${alias ? `alias="${alias}"` : ''} isEmbed={true} />`;
    });

    // Process regular wikilinks
    content = content.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (match, path, alias) => {
        return `<WikiLink path="${path}" ${alias ? `alias="${alias}"` : ''} />`;
    });

    return content;
}

// Add WikiLink import to script section
export function addWikiLinkImport(content) {
    // Only add import if content actually contains WikiLink components
    if (!content.includes('<WikiLink')) {
        return content;
    }

    // Check if there's already a script section
    const scriptMatch = content.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/);

    if (scriptMatch) {
        // Add import to existing script section
        const existingScript = scriptMatch[2];
        if (!existingScript.includes('WikiLink')) {
            const newScript = `${scriptMatch[1]}\n\timport WikiLink from '$lib/components/WikiLink.svelte';${existingScript}${scriptMatch[3]}`;
            return content.replace(scriptMatch[0], newScript);
        }
    } else {
        // Add new script section
        const frontmatterMatch = content.match(/^---[\s\S]*?---/);
        if (frontmatterMatch) {
            // After frontmatter
            const afterFrontmatter = frontmatterMatch[0];
            const rest = content.substring(afterFrontmatter.length);
            return `${afterFrontmatter}\n\n<script>\n\timport WikiLink from '$lib/components/WikiLink.svelte';\n</script>${rest}`;
        } else {
            // At the beginning
            return `<script>\n\timport WikiLink from '$lib/components/WikiLink.svelte';\n</script>\n\n${content}`;
        }
    }

    return content;
}