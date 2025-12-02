<script module>
	// This component reads data table config from the page's frontmatter
	import { processDataTable, applyView } from '$lib/datatable/index.js';
	import DataTable from '$lib/components/DataTable.svelte';
</script>

<script>
	import { page } from '$app/stores';

	// Get props (viewIndex and config data)
	let { viewIndex = 0, filters, formulas, views } = $props();

	const config = { filters, formulas, views };
</script>

{#if config.views && config.views.length > 0}
	<DataTable {config} {viewIndex} />
{:else}
	<div class="text-muted-foreground p-4 border rounded-md">
		No data table configuration found. Add <code>filters</code>, <code>formulas</code>, and
		<code>views</code> to your frontmatter.
	</div>
{/if}
