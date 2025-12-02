<script>
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { processDataTable, applyView } from '$lib/datatable/index.js';
	import { base } from '$app/paths';

	let {
		config,
		viewIndex = 0,
		allViews = null,
		currentViewIndex = 0,
		onViewChange = null
	} = $props();

	// Simple client-side only icon handling to prevent hydration issues
	import { browser } from '$app/environment';

	// Only load icons on client side to prevent hydration mismatches
	let iconComponents = $state(new Map());

	async function loadIconIfBrowser(iconName) {
		if (!browser || !iconName) return null;

		if (iconComponents.has(iconName)) {
			return iconComponents.get(iconName);
		}

		try {
			let iconComponent;
			switch (iconName) {
				case 'Rocket':
					iconComponent = (await import('@lucide/svelte/icons/rocket')).default;
					break;
				case 'Heart':
					iconComponent = (await import('@lucide/svelte/icons/heart')).default;
					break;
				case 'Star':
					iconComponent = (await import('@lucide/svelte/icons/star')).default;
					break;
				case 'Book':
					iconComponent = (await import('@lucide/svelte/icons/book')).default;
					break;
				case 'Home':
					iconComponent = (await import('@lucide/svelte/icons/home')).default;
					break;
				case 'User':
					iconComponent = (await import('@lucide/svelte/icons/user')).default;
					break;
				case 'Settings':
					iconComponent = (await import('@lucide/svelte/icons/settings')).default;
					break;
				case 'Calendar':
					iconComponent = (await import('@lucide/svelte/icons/calendar')).default;
					break;
				case 'File':
					iconComponent = (await import('@lucide/svelte/icons/file')).default;
					break;
				default:
					return null;
			}

			iconComponents.set(iconName, iconComponent);
			return iconComponent;
		} catch (error) {
			console.warn(`Failed to load icon: ${iconName}`, error);
			return null;
		}
	} // Process data - make reactive to viewIndex changes
	const processedNotes = processDataTable(config);
	const currentView = $derived(config.views?.[viewIndex] || { name: 'Default', order: [] });
	const viewData = $derived(applyView(processedNotes, currentView));
	const columns = $derived(viewData.columns);
	const sortedData = $derived(viewData.data);

	// State for client-side filtering
	let filterText = $state('');

	// Filter data based on search - simplified approach
	let filteredData = $derived(
		!filterText || filterText.trim().length === 0
			? sortedData
			: sortedData.filter((row) => {
					const searchLower = filterText.toLowerCase();
					return columns.some((col) => {
						const value = row[col];
						if (value == null) return false;
						return String(value).toLowerCase().includes(searchLower);
					});
				})
	);

	function formatValue(value) {
		if (value == null || value === '') return '';
		if (typeof value === 'boolean') return value ? '✓' : '';
		if (typeof value === 'number') return value.toString();
		return String(value);
	}

	function formatColumnName(column) {
		return column
			.split('.')
			.pop()
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, (str) => str.toUpperCase())
			.trim();
	}

	// Extract image URL from wikilink format [[image.jpg]] or direct URL
	function getImageUrl(imageValue) {
		if (!imageValue) {
			return null;
		}

		// Handle wikilink format [[image.jpg]]
		const wikilinkMatch = imageValue.match(/\[\[([^\]]+)\]\]/);
		if (wikilinkMatch) {
			const imageName = wikilinkMatch[1];
			// Use base path for GitHub Pages compatibility
			const imageUrl = `${base}/${imageName}`;
			return imageUrl;
		}

		// For direct URLs/paths, check if they need base path
		if (imageValue.startsWith('/')) {
			return `${base}${imageValue}`;
		}
		
		// Return direct URL or path as-is (for external URLs)
		return imageValue;
	}

	// Get image property from view config
	const imageProperty = $derived.by(() => {
		const configProperty = currentView.image || 'image';
		// Handle note.property -> property mapping
		if (configProperty.startsWith('note.')) {
			return configProperty.substring(5); // Remove 'note.' prefix
		}
		return configProperty;
	});

	// Get icon property - handle both wikilinks and icon names
	function getIconUrl(row) {
		const iconValue = row['icon'] || row['note.icon'];
		if (!iconValue) return null;

		// Handle wikilink format for image files
		if (iconValue.includes('[[') && iconValue.includes(']]')) {
			return getImageUrl(iconValue);
		}

		// For icon names, return null (we'll handle these separately)
		return null;
	}

	async function getIconComponent(row) {
		const iconValue = row['icon'] || row['note.icon'];
		if (!iconValue) return null;

		// Skip wikilink format
		if (iconValue.includes('[[') && iconValue.includes(']]')) {
			return null;
		}

		// Check if already loaded
		if (iconComponents.has(iconValue)) {
			return iconComponents.get(iconValue);
		}

		// Load icon asynchronously - only on client side
		const iconComponent = await loadIconIfBrowser(iconValue);
		iconComponents.set(iconValue, iconComponent);
		return iconComponent;
	}

	// Preload icons for current data - only on client side
	$effect(() => {
		if (browser && sortedData) {
			sortedData.forEach((row) => {
				const iconValue = row['icon'] || row['note.icon'];
				if (iconValue && !iconValue.includes('[[') && !iconComponents.has(iconValue)) {
					getIconComponent(row); // Trigger async loading
				}
			});
		}
	});

	// Get card color from card-color property
	function getCardColor(row) {
		return row['card-color'] || row['note.card-color'] || null;
	}
</script>

<div class="space-y-4">
	<!-- View name, selector, and search -->
	<div class="flex items-center justify-between gap-4">
		<h3 class="text-lg font-medium">{currentView.name || 'Card View'}</h3>

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

	<!-- Cards Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
		{#each filteredData as row}
			{@const imageUrl = getImageUrl(row[imageProperty])}
			{@const iconUrl = getIconUrl(row)}
			{@const cardColor = getCardColor(row)}
			{@const iconValue = row['icon'] || row['note.icon']}
			{@const iconComponent =
				iconValue && !iconValue.includes('[[') ? iconComponents.get(iconValue) : null}

			<div
				class="bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
			>
				<!-- Image Section -->
				{#if imageUrl}
					<!-- Primary image -->
					<div
						class="aspect-square relative overflow-hidden"
						style="background-color: {cardColor || '#f1f5f9'};"
					>
						<img
							src={imageUrl}
							alt={row['file.name'] || 'Card image'}
							class="w-full h-full object-cover"
							loading="lazy"
							onerror={(e) => {
								e.target.style.display = 'none';
							}}
						/>
					</div>
				{:else if iconUrl}
					<!-- Fallback to icon image file -->
					<div
						class="aspect-square relative overflow-hidden flex items-center justify-center"
						style="background-color: {cardColor || '#f1f5f9'};"
					>
						<img
							src={iconUrl}
							alt={row['file.name'] || 'Card icon'}
							class="w-12 h-12 object-contain"
							loading="lazy"
							onerror={(e) => {
								e.target.style.display = 'none';
							}}
						/>
					</div>
				{:else if browser && iconComponent}
					<!-- Fallback to Lucide icon component - only on client side -->
					<div
						class="aspect-square relative overflow-hidden flex items-center justify-center"
						style="background-color: {cardColor || '#f1f5f9'};"
					>
						{#if iconComponent}
							{@const IconComponent = iconComponent}
							<IconComponent class="w-12 h-12 text-muted-foreground" />
						{/if}
					</div>
				{:else if cardColor}
					<!-- Card color background, no text -->
					<div
						class="aspect-square relative overflow-hidden"
						style="background-color: {cardColor};"
					></div>
				{:else}
					<!-- No image fallback -->
					<div class="aspect-square bg-muted flex items-center justify-center">
						<div class="text-muted-foreground text-sm">No Image</div>
					</div>
				{/if}

				<!-- Content Section -->
				<div class="p-3 space-y-2">
					{#each columns as column}
						{#if row[column] != null && row[column] !== ''}
							<div class="flex flex-col">
								<div class="text-xs text-muted-foreground font-medium uppercase tracking-wide">
									{formatColumnName(column)}
								</div>
								<div class="text-sm">
									{#if column === 'file.name' && row['file.url']}
										<a href={row['file.url']} class="hover:underline text-primary font-medium">
											{formatValue(row[column])}
										</a>
									{:else}
										{formatValue(row[column])}
									{/if}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>

	{#if filteredData.length === 0}
		<div class="text-center text-muted-foreground py-8">No cards found</div>
	{/if}

	<!-- Stats -->
	<div class="text-sm text-muted-foreground">
		Showing {filteredData.length} of {sortedData.length} cards
		<div class="text-xs mt-1">
			View: {currentView.name || 'Unknown'} | Type: {currentView.type || 'Unknown'}
		</div>
	</div>
</div>
