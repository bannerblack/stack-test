/**
 * Configuration constants for route generation
 * Centralizes all paths and file patterns used throughout the build process
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..', '..');

export const PATHS = {
    root: PROJECT_ROOT,
    content: path.join(PROJECT_ROOT, 'src', 'content'),
    routes: path.join(PROJECT_ROOT, 'src', 'routes', '(generated)'),
    toc: path.join(PROJECT_ROOT, 'src', 'toc', 'toc.js'),
    nav: path.join(PROJECT_ROOT, 'src', 'toc', 'nav.js'),
    static: path.join(PROJECT_ROOT, 'static'),
    ignoreFile: path.join(PROJECT_ROOT, '.contentignore')
};

export const FILE_PATTERNS = {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'],
    markdown: ['.md', '.svx', '.base']
};
