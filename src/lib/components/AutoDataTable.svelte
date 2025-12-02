<script>
	import { processDataTable, applyView } from '$lib/datatable/index.js';
	import DataTable from '$lib/components/DataTable.svelte';
	import CardView from '$lib/components/CardView.svelte';
	import { toc } from '../../toc/toc.js';
	import * as Select from '$lib/components/ui/select/index.js';

	// Get props - only viewIndex is required if using frontmatter auto-detection
	let { viewIndex = 0, filters, formulas, views, pagePath } = $props();

	// If config not passed as props, try to get from frontmatter via pagePath
	let config = $state({ filters, formulas, views });
	let selectedViewIndex = $state(viewIndex);
	let selectedViewString = $state(viewIndex.toString());

	// Keep selectedViewString in sync with selectedViewIndex
	$effect(() => {
		selectedViewString = selectedViewIndex.toString();
	});

	// Auto-detect config from TOC if pagePath provided
	if (pagePath && !views) {
		const pathParts = pagePath.split('/').filter(Boolean);
		let node = toc;

		// Navigate to the page in TOC
		for (const part of pathParts) {
			if (node[part]) {
				node = node[part];
			}
		}

		// Extract config from node
		if (node.views || node.filters || node.formulas) {
			config = {
				filters: node.filters,
				formulas: node.formulas,
				views: node.views
			};
		}
	}

	// Handle view selection
	function handleViewChange(value) {
		selectedViewIndex = parseInt(value);
		selectedViewString = value;
	}
</script>

{#if config.views && config.views.length > 0}
	<!-- Display selected view -->
	{#if config.views?.[selectedViewIndex]?.type === 'cards'}
		<CardView
			{config}
			viewIndex={selectedViewIndex}
			allViews={config.views}
			currentViewIndex={selectedViewIndex}
			onViewChange={handleViewChange}
		/>
	{:else}
		<DataTable
			{config}
			viewIndex={selectedViewIndex}
			allViews={config.views}
			currentViewIndex={selectedViewIndex}
			onViewChange={handleViewChange}
		/>
	{/if}
{:else}
	<div class="text-muted-foreground p-4 border rounded-md">
		No data table configuration found. Add <code>views</code> to your frontmatter or pass as props.
	</div>
{/if}
