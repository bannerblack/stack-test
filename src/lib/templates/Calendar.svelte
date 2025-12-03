<script>
	let { class: className, frontmatter } = $props();

	// Get dates from frontmatter
	const createdDate = $derived(frontmatter?.created || frontmatter?.date);
	const modifiedDate = $derived(frontmatter?.modified || frontmatter?.updated);

	/**
	 * Format date to readable string
	 * @param {string|Date} date - Date to format
	 * @returns {string} Formatted date
	 */
	function formatDate(date) {
		if (!date) return 'Unknown';

		try {
			const d = typeof date === 'string' ? new Date(date) : date;
			return d.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return 'Invalid date';
		}
	}

	import * as Card from '$lib/components/ui/card/index.js';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
</script>

<Card.Root
	class="shadow-none mt-20 p-2 flex flex-row items-center gap-2
 {className}"
>
	<div class="icon border-r border-border h-full py-2 pr-3 pl-1 flex items-center justify-center">
		<CalendarRange color="var(--chart-1)" />
	</div>
	<Card.Header class="flex flex-col m-0 px-2 justify-start w-full gap-1 pr-4">
		<!-- <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wide border-b w-full">
			Timeline
		</h3> -->
		{#if createdDate}
			<div
				class="date-item flex flex-row justify-between text-muted-foreground text-xs border-b pb-1 w-full"
			>
				<span class="date-label uppercase">Created:</span>
				<span class="date-value">{formatDate(createdDate)}</span>
			</div>
		{/if}
		{#if modifiedDate && modifiedDate !== createdDate}
			<div class="date-item flex flex-row justify-between text-muted-foreground text-xs w-full">
				<span class="date-label uppercase">Modified:</span>
				<span class="date-value">{formatDate(modifiedDate)}</span>
			</div>
		{/if}
		{#if !createdDate && !modifiedDate}
			<div class="text-xs text-muted-foreground">No date information available</div>
		{/if}
	</Card.Header>
</Card.Root>
