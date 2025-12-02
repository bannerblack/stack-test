import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { markdownWatcher } from './vite-plugins/markdown-watcher.js';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), markdownWatcher()],
	optimizeDeps: {
		// Pre-bundle these dependencies to speed up dev server
		include: ['bits-ui', 'clsx', 'tailwind-merge', 'tailwind-variants', '@lucide/svelte']
	},
	build: {
		// Reduce chunk size warnings threshold
		chunkSizeWarningLimit: 1000,
		// Enable minification and compression
		minify: 'esbuild',
		sourcemap: false, // Disable sourcemaps in production
		// CSS code splitting
		cssCodeSplit: true
	},
	server: {
		// Warm up frequently used files
		warmup: {
			clientFiles: ['./src/routes/**/+page.svelte', './src/lib/components/**/*.svelte']
		}
	}
});
