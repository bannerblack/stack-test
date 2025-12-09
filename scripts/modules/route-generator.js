/**
 * Route generation from content tree
 * Creates SvelteKit route files from markdown content
 */

import fs from 'fs';
import path from 'path';
import { generateTemplatedRoute, generateBaseFileRoute } from '../../src/lib/templates/template-selector.js';

/**
 * Build flat array of routes from tree structure
 * @param {Object} tree - Content tree
 * @param {string} currentPath - Current path in recursion
 * @returns {Array<Object>} Array of route objects
 */
export function buildRouteList(tree, currentPath = '') {
    const routes = [];

    for (const [key, value] of Object.entries(tree)) {
        if (key === '_meta') continue;

        if (value.path) {
            const routeSlug = currentPath ? `${currentPath}/${key}` : key;
            routes.push({
                slug: routeSlug,
                key: key,
                ...value
            });
        } else {
            const nestedPath = currentPath ? `${currentPath}/${key}` : key;
            routes.push(...buildRouteList(value, nestedPath));
        }
    }

    return routes;
}

/**
 * Generate route files from content tree
 * @param {Object} tree - Content tree
 * @param {string} contentDir - Content directory path
 * @param {string} routesDir - Routes output directory
 * @param {Object} obsidianTypes - Obsidian type definitions
 */
export function generateRoutes(tree, contentDir, routesDir, obsidianTypes = {}) {
    const routes = buildRouteList(tree);

    for (const route of routes) {
        const routePath = path.join(routesDir, route.slug);

        // Create directory
        if (!fs.existsSync(routePath)) {
            fs.mkdirSync(routePath, { recursive: true });
        }

        // Read original content
        const contentPath = path.join(contentDir, route.path);

        let pageContent;
        if (route.path.endsWith('.base')) {
            pageContent = generateBaseFileRoute(route);
        } else {
            const rawContent = fs.readFileSync(contentPath, 'utf-8');
            const fileStats = fs.statSync(contentPath);
            pageContent = generateTemplatedRoute(
                rawContent,
                route.path,
                route.slug,
                obsidianTypes,
                fileStats
            );
        }

        // Write route file
        const pagePath = path.join(routePath, '+page.svx');
        fs.writeFileSync(pagePath, pageContent, 'utf-8');
    }
}

/**
 * Clean up all existing generated routes
 * @param {string} routesDir - Routes directory to clean
 */
export function cleanupRoutes(routesDir) {
    if (fs.existsSync(routesDir)) {
        console.log('🧹 Cleaning up existing generated routes...');
        fs.rmSync(routesDir, { recursive: true, force: true });
    }
    fs.mkdirSync(routesDir, { recursive: true });
}
