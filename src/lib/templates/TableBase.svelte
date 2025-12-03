<script>
	/**
	 * Table Base Template
	 * Template for database/table views with AutoDataTable
	 */
	import AutoDataTable from '$lib/components/AutoDataTable.svelte';

	let { content, frontmatter, pagePath } = $props();

	const title = $derived(frontmatter?.title || 'Data Table');
	const views = $derived(frontmatter?.views || []);
</script>

<!-- Header -->
<header class="table-base-header">
	<h1 class="text-3xl font-bold mb-2">{title}</h1>
	{#if frontmatter?.description}
		<p class="text-muted-foreground mb-4">{frontmatter.description}</p>
	{/if}
</header>

<!-- Optional introductory content -->
{#if content && content.trim()}
	<div class="table-intro prose prose-slate dark:prose-invert max-w-none mb-6">
		{@html content}
	</div>
{/if}

<!-- Data table -->
{#if views.length > 0}
	<div class="table-container">
		<AutoDataTable {pagePath} />
	</div>
{:else}
	<div class="text-muted-foreground p-8 border rounded-lg text-center">
		No views defined in this database. Add <code>views</code> to your frontmatter to display data.
	</div>
{/if}

<style>
	.table-base-header {
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.table-intro {
		background: hsl(var(--muted) / 0.3);
		padding: 1.5rem;
		border-radius: 0.5rem;
		border-left: 3px solid hsl(var(--primary));
	}

	.table-container {
		margin-top: 2rem;
	}

	code {
		background: hsl(var(--muted));
		padding: 0.2em 0.4em;
		border-radius: 0.25rem;
		font-size: 0.9em;
	}
</style>
