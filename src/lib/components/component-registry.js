// Auto-generated component registry for WikiLink embeds
// This file maps page paths to their component imports

export const componentRegistry = new Map();

// Import all generated page components
const pages = import.meta.glob('../../routes/(generated)/**/+page.svx');

// Populate the registry
for (const [path, importFn] of Object.entries(pages)) {
    // Extract the path from the file path
    // e.g., '../../routes/(generated)/examples/recipes/miso-soup/+page.svx' -> 'examples/recipes/miso-soup'
    const routePath = path
        .replace('../../routes/(generated)/', '')
        .replace('/+page.svx', '');

    componentRegistry.set(routePath, importFn);
}

export { componentRegistry as default };