// Dynamic icon loader to avoid importing all Lucide icons
// This significantly improves page load performance

const iconCache = new Map();

// Convert kebab-case to PascalCase for icon lookup
function toPascalCase(str) {
    return str
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

/**
 * Dynamically load a Lucide icon by name
 * @param {string} iconName - Icon name in kebab-case (e.g., 'chevron-right')
 * @returns {Promise<any>} - The icon component
 */
export async function loadIcon(iconName) {
    if (!iconName) return null;

    const pascalName = toPascalCase(iconName) + 'Icon';

    if (iconCache.has(pascalName)) {
        return iconCache.get(pascalName);
    }

    try {
        // Dynamic import of specific icon
        const module = await import(`@lucide/svelte/icons/${iconName}`);
        const icon = module.default;
        iconCache.set(pascalName, icon);
        return icon;
    } catch {
        console.warn(`Icon "${iconName}" not found`);
        return null;
    }
}

/**
 * Preload multiple icons
 * @param {string[]} iconNames - Array of icon names in kebab-case
 * @returns {Promise<Map<string, any>>} - Map of icon name to component
 */
export async function preloadIcons(iconNames) {
    const results = new Map();
    await Promise.all(
        iconNames.map(async (name) => {
            const icon = await loadIcon(name);
            if (icon) results.set(name, icon);
        })
    );
    return results;
}
