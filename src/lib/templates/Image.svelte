<script>
	import { base } from '$app/paths';

	let { src, alt = 'Image', property, class: className, style, loading = 'lazy' } = $props();

	/**
	 * Extract image filename from wikilink format [[image.jpg]]
	 * @param {string} value - Image value
	 * @returns {string} Image filename or original value
	 */
	function extractFilename(value) {
		if (!value) return '';

		// Handle wikilink format
		const match = value.match(/\[\[([^\]]+)\]\]/);
		if (match) {
			return match[1];
		}

		return value;
	}

	// Process the src to handle wikilinks
	const imageSrc = $derived(() => {
		const filename = extractFilename(src);
		if (!filename) return '';

		// Handle absolute URLs
		if (filename.startsWith('http://') || filename.startsWith('https://')) {
			return filename;
		}

		// Handle relative paths with base
		if (filename.startsWith('/')) {
			return `${base}${filename}`;
		}

		return `${base}/${filename}`;
	});
</script>

{#if imageSrc()}
	<img src={imageSrc()} {alt} class={className || 'note-image'} {style} {loading} />
{:else}
	<!-- No image available -->
	<div class="text-muted-foreground text-sm">No image available</div>
{/if}

<style>
	:global(.note-image) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}
</style>
