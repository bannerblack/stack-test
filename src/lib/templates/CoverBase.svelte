<script>
	/**
	 * Cover Base Template
	 * Template for notes with prominent cover images/hero sections
	 * Good for portfolios, albums, galleries, etc.
	 */
	import { base } from '$app/paths';
	import Image from './Image.svelte';

	let { content, frontmatter } = $props();

	const title = $derived(frontmatter?.title || 'Untitled');
	const coverImage = $derived(frontmatter?.image || frontmatter?.cover);
	const coverColor = $derived(frontmatter?.['cover-color'] || frontmatter?.cover_color);

	/**
	 * Extract image filename from wikilink format
	 */
	function extractImageFilename(value) {
		if (!value) return '';
		const match = value.match(/\[\[([^\]]+)\]\]/);
		return match ? match[1] : value;
	}

	const coverSrc = $derived(() => {
		if (!coverImage) return '';
		const filename = extractImageFilename(coverImage);
		if (filename.startsWith('http')) return filename;
		if (filename.startsWith('/')) return `${base}${filename}`;
		return `${base}/${filename}`;
	});
</script>

<!-- Hero/Cover Section -->
<div class="cover-hero" style:background-color={coverColor || 'transparent'}>
	{#if coverSrc()}
		<img src={coverSrc()} alt={title} class="cover-image" loading="eager" />
	{/if}
	<div class="cover-overlay">
		<h1 class="cover-title">{title}</h1>
		{#if frontmatter?.description}
			<p class="cover-description">{frontmatter.description}</p>
		{/if}
	</div>
</div>

<!-- Metadata section -->
{#if frontmatter && Object.keys(frontmatter).length > 0}
	<div class="metadata-section">
		<div class="metadata-grid">
			{#each Object.entries(frontmatter).filter(([key]) => !['title', 'description', 'image', 'cover', 'cover-color', 'cover_color', 'note_template'].includes(key)) as [key, value]}
				{#if value && value !== ''}
					<div class="metadata-item">
						<span class="metadata-key">{key.replace(/_/g, ' ')}:</span>
						<span class="metadata-value">{value}</span>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<!-- Main content -->
{#if content && content.trim()}
	<article class="cover-content prose prose-slate dark:prose-invert max-w-none">
		{@html content}
	</article>
{/if}

<style>
	.cover-hero {
		position: relative;
		width: 100%;
		height: 400px;
		margin: -2rem -2rem 2rem -2rem;
		overflow: hidden;
		border-radius: 0 0 1rem 1rem;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.cover-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 0;
	}

	.cover-overlay {
		position: relative;
		z-index: 1;
		width: 100%;
		padding: 2rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
		color: white;
		text-align: center;
	}

	.cover-title {
		font-size: 3rem;
		font-weight: 700;
		margin: 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	}

	.cover-description {
		font-size: 1.25rem;
		margin: 0.5rem 0 0 0;
		opacity: 0.9;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
	}

	.metadata-section {
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.metadata-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.metadata-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.metadata-key {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--muted-foreground));
		font-weight: 600;
	}

	.metadata-value {
		font-size: 0.95rem;
		color: hsl(var(--foreground));
	}

	.cover-content {
		margin-top: 2rem;
	}

	@media (max-width: 768px) {
		.cover-hero {
			height: 300px;
			margin: -1rem -1rem 1rem -1rem;
		}

		.cover-title {
			font-size: 2rem;
		}

		.cover-description {
			font-size: 1rem;
		}

		.metadata-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
