<script>
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { processDataTable, applyView } from '$lib/datatable/index.js';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';

	let {
		config,
		viewIndex = 0,
		allViews = null,
		currentViewIndex = 0,
		onViewChange = null
	} = $props();

	// Process data - make reactive to viewIndex changes
	const processedNotes = processDataTable(config);
	const currentView = $derived(config.views?.[viewIndex] || { name: 'Default', order: [] });
	const viewData = $derived(applyView(processedNotes, currentView));
	const columns = $derived(viewData.columns);
	const sortedData = $derived(viewData.data);
	const groupBy = $derived(viewData.groupBy);

	// State for client-side filtering and sorting
	let filterText = $state('');
	let sortConfig = $state({ column: null, direction: null });

	// Filter data based on search
	const filteredData = $derived(() => {
		if (!filterText) return sortedData;

		const searchLower = filterText.toLowerCase();
		return sortedData.filter((row) => {
			return columns.some((col) => {
				const value = row[col];
				return value != null && String(value).toLowerCase().includes(searchLower);
			});
		});
	});

	// Apply additional client-side sorting
	const displayData = $derived(() => {
		const data = filteredData();
		if (!sortConfig.column) return data;

		// If we have grouping enabled, sort within each group
		if (groupBy) {
			const result = [];
			let currentGroupItems = [];
			let currentGroupHeader = null;

			for (const row of data) {
				if (row.__isGroupHeader) {
					// Sort and add the previous group's items
					if (currentGroupHeader && currentGroupItems.length > 0) {
						result.push(currentGroupHeader);
						const sortedGroupItems = [...currentGroupItems].sort((a, b) => {
							const aVal = a[sortConfig.column];
							const bVal = b[sortConfig.column];

							if (aVal == null && bVal == null) return 0;
							if (aVal == null) return 1;
							if (bVal == null) return -1;

							let comparison = 0;
							if (typeof aVal === 'number' && typeof bVal === 'number') {
								comparison = aVal - bVal;
							} else {
								comparison = String(aVal).localeCompare(String(bVal));
							}

							return sortConfig.direction === 'asc' ? comparison : -comparison;
						});
						result.push(...sortedGroupItems);
					}

					// Start a new group
					currentGroupHeader = row;
					currentGroupItems = [];
				} else {
					// Collect items for the current group
					currentGroupItems.push(row);
				}
			}

			// Don't forget the last group
			if (currentGroupHeader && currentGroupItems.length > 0) {
				result.push(currentGroupHeader);
				const sortedGroupItems = [...currentGroupItems].sort((a, b) => {
					const aVal = a[sortConfig.column];
					const bVal = b[sortConfig.column];

					if (aVal == null && bVal == null) return 0;
					if (aVal == null) return 1;
					if (bVal == null) return -1;

					let comparison = 0;
					if (typeof aVal === 'number' && typeof bVal === 'number') {
						comparison = aVal - bVal;
					} else {
						comparison = String(aVal).localeCompare(String(bVal));
					}

					return sortConfig.direction === 'asc' ? comparison : -comparison;
				});
				result.push(...sortedGroupItems);
			}

			return result;
		}

		// If no grouping, sort normally
		return [...data].sort((a, b) => {
			const aVal = a[sortConfig.column];
			const bVal = b[sortConfig.column];

			if (aVal == null && bVal == null) return 0;
			if (aVal == null) return 1;
			if (bVal == null) return -1;

			let comparison = 0;
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				comparison = aVal - bVal;
			} else {
				comparison = String(aVal).localeCompare(String(bVal));
			}

			return sortConfig.direction === 'asc' ? comparison : -comparison;
		});
	});

	// Toggle sort on column
	function toggleSort(column) {
		if (sortConfig.column === column) {
			// Cycle: asc -> desc -> none
			if (sortConfig.direction === 'asc') {
				sortConfig = { column, direction: 'desc' };
			} else if (sortConfig.direction === 'desc') {
				sortConfig = { column: null, direction: null };
			}
		} else {
			sortConfig = { column, direction: 'asc' };
		}
	}

	// Format column name for display
	function formatColumnName(col) {
		return col
			.replace(/^file\./, '')
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (l) => l.toUpperCase());
	}

	// Format cell value
	function formatValue(value, isGroupHeader = false) {
		if (value == null || value === '') return '';
		if (typeof value === 'number') {
			// Only show decimal places if the number is actually a float
			if (Number.isInteger(value)) {
				return value.toString();
			} else {
				return value.toFixed(2);
			}
		}
		return String(value);
	}
</script>

<div class="space-y-4">
	<!-- View name, selector, and search -->
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-medium">{currentView.name || 'Data Table'}</h3>

		<div class="flex items-center gap-4">
			<!-- View Selector -->
			{#if allViews && allViews.length > 1 && onViewChange}
				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground">View:</span>
					<Select.Root
						type="single"
						value={currentViewIndex.toString()}
						onValueChange={onViewChange}
					>
						<Select.Trigger class="w-40">
							{allViews[currentViewIndex]?.name || `View ${currentViewIndex + 1}`}
						</Select.Trigger>
						<Select.Content>
							{#each allViews as view, index}
								<Select.Item value={index.toString()}
									>{view.name || `View ${index + 1}`}</Select.Item
								>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			<!-- Search Bar -->
			<Input type="text" placeholder="Search..." class="max-w-sm" bind:value={filterText} />
		</div>
	</div>

	<!-- Table -->
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					{#each columns as column}
						<Table.Head>
							<Button
								variant="ghost"
								size="sm"
								class="h-auto p-0 font-medium hover:bg-transparent"
								onclick={() => toggleSort(column)}
							>
								{formatColumnName(column)}
								{#if sortConfig.column === column}
									{#if sortConfig.direction === 'asc'}
										<ArrowUpIcon class="ml-2 size-4" />
									{:else}
										<ArrowDownIcon class="ml-2 size-4" />
									{/if}
								{:else}
									<ArrowUpDownIcon class="ml-2 size-4 opacity-50" />
								{/if}
							</Button>
						</Table.Head>
					{/each}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if displayData().length === 0}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="text-center text-muted-foreground">
							No data found
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each displayData() as row}
						{#if row.__isGroupHeader}
							<!-- Group Header Row -->
							<Table.Row class="bg-muted/30">
								<Table.Cell
									colspan={columns.length}
									class="text-xs font-medium text-muted-foreground uppercase tracking-wide py-2"
								>
									{groupBy
										? `${formatColumnName(groupBy.property)} : ${row.__groupKey}`
										: row.__groupKey}
								</Table.Cell>
							</Table.Row>
						{:else}
							<!-- Regular Data Row -->
							<Table.Row>
								{#each columns as column}
									<Table.Cell>
										{#if column === 'file.name' && row['file.url']}
											<a href={row['file.url']} class="hover:underline text-primary">
												{formatValue(row[column])}
											</a>
										{:else}
											{formatValue(row[column])}
										{/if}
									</Table.Cell>
								{/each}
							</Table.Row>
						{/if}
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Stats -->
	<div class="text-sm text-muted-foreground">
		Showing {displayData().length} of {sortedData.length} rows
	</div>
</div>
