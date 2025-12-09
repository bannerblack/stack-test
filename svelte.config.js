import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import { processTextWikilinks, processEmbedWikilinks } from './src/lib/templates/processors/content-processor.js';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: undefined,
			pages: 'build',
			assets: 'build',
			strict: true
		}),
		paths: {
			base: dev ? '' : process.env.BASE_PATH || ''
		},
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore 404 errors for directory index pages during prerendering
				if (message.includes('404')) {
					console.warn(`Ignoring 404 for ${path} (referred from ${referrer})`);
					return;
				}
				throw new Error(message);
			}
		},
		alias: {
			"@template-config": "src/template-config.js",
			"@layout-config": "src/layout-config.js"
		}
	},
	preprocess: [
		{
			markup: ({ content, filename }) => {
				// Skip wikilink preprocessing for generated routes but let mdsvex run
				if (filename && filename.includes('(generated)')) {
					return { code: content };
				}

				// Only process .svx, .md, and .base files
				if (filename && (filename.endsWith('.svx') || filename.endsWith('.md') || filename.endsWith('.base'))) {
					// Process wikilinks and embeds for non-generated files
					let processed = content;
					processed = processTextWikilinks(processed);
					processed = processEmbedWikilinks(processed);
					return { code: processed };
				}
				return { code: content };
			}
		},
		mdsvex({
			extensions: ['.svx', '.md', '.base']
		})
	],
	extensions: ['.svelte', '.svx', '.md', '.base'],
};

export default config;
