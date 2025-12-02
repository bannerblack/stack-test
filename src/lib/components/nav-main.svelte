<script>
	import { page } from '$app/stores';
	import { processNavLink } from '$lib/utils/path-utils.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ChevronsDownUpIcon from '@lucide/svelte/icons/chevrons-down-up';
	import { iconMap } from '$lib/../toc/nav.js';

	let { items } = $props();

	// Get current path for relative link calculation
	const currentPath = $derived($page.url.pathname);

	// Helper to process nav URL based on config preferences
	function getNavUrl(url) {
		return processNavLink(url, currentPath);
	}

	// Helper to build initial open states from items
	function buildInitialStates(itemsList) {
		const states = {};
		function initFolder(item, path) {
			if ((item.isFolder || item.isCategory) && item.items?.length) {
				// Categories auto-expand, folders use isActive
				states[path] = item.isCategory ? true : (item.isActive ?? false);
				item.items.forEach((child, i) => initFolder(child, `${path}-${i}`));
			}
		}
		itemsList.forEach((item, i) => initFolder(item, `${i}`));
		return states;
	}

	// Track open state for all collapsible folders - initialize immediately
	let openStates = $state(buildInitialStates(items));

	// Collapse all folders
	function collapseAll() {
		const newStates = {};
		Object.keys(openStates).forEach((key) => {
			newStates[key] = false;
		});
		openStates = newStates;
	}

	// Get icon component from icon name string
	function getIconComponent(iconName) {
		if (!iconName) return null;
		return iconMap[iconName] || null;
	}
</script>

<!-- Recursive snippet for rendering nested sub-items -->
{#snippet renderSubItem(item, depth = 1, path = '')}
	{@const ItemIcon = item.icon
		? getIconComponent(item.icon)
		: item.isFolder && !item.isCategory
			? FolderIcon
			: FileTextIcon}

	{#if item.isCategory && item.items?.length}
		<!-- Category group - render as collapsible with category styling -->
		<Collapsible.Root bind:open={openStates[path]}>
			{#snippet child({ props })}
				<Sidebar.MenuSubItem {...props}>
					<Collapsible.Trigger
						class="text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground outline-hidden flex h-7 min-w-0 w-full -translate-x-px items-center gap-1.5 overflow-hidden rounded-md px-2 text-xs font-medium uppercase tracking-wide focus-visible:ring-2 cursor-default"
					>
						<!-- Small category icon -->
						<svg
							class="size-2.5 shrink-0 opacity-60"
							viewBox="0 0 8 8"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle cx="4" cy="4" r="1.5" fill="currentColor" />
							<circle cx="4" cy="4" r="3" stroke="currentColor" stroke-width="0.5" />
						</svg>
						<span class="flex-1 text-left truncate">{item.title}</span>
						<ChevronRightIcon
							class="size-3 shrink-0 transition-transform duration-200 in-data-[state=open]:rotate-90"
						/>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<!-- No MenuSub wrapper - items render at same level -->
						{#each item.items as nestedItem, i (nestedItem.url || `${path}-${i}`)}
							<!-- Render items directly without extra indentation -->
							<Sidebar.MenuSubItem>
								<Sidebar.MenuSubButton href={getNavUrl(nestedItem.url)}>
									{@const NestedIcon = nestedItem.icon
										? getIconComponent(nestedItem.icon)
										: FileTextIcon}
									{#if NestedIcon}
										<NestedIcon
											class="size-4 mr-2"
											style={nestedItem.iconColor ? `color: ${nestedItem.iconColor}` : ''}
										/>
									{:else}
										<FileTextIcon class="size-4 mr-2" />
									{/if}
									<span>{nestedItem.title}</span>
								</Sidebar.MenuSubButton>
							</Sidebar.MenuSubItem>
						{/each}
					</Collapsible.Content>
				</Sidebar.MenuSubItem>
			{/snippet}
		</Collapsible.Root>
	{:else if item.isFolder && item.items?.length}
		<!-- Nested folder - render as collapsible -->
		<Collapsible.Root bind:open={openStates[path]}>
			{#snippet child({ props })}
				<Sidebar.MenuSubItem {...props}>
					<Collapsible.Trigger
						class="text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground outline-hidden flex h-7 min-w-0 w-full -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sm focus-visible:ring-2 cursor-default"
					>
						{#if ItemIcon}
							<ItemIcon
								class="size-4 shrink-0"
								style={item.iconColor ? `color: ${item.iconColor}` : ''}
							/>
						{:else}
							<FolderIcon class="size-4 shrink-0" />
						{/if}
						<span class="flex-1 text-left truncate">{item.title}</span>
						<ChevronRightIcon
							class="size-4 shrink-0 transition-transform duration-200 in-data-[state=open]:rotate-90"
						/>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Sidebar.MenuSub>
							{#each item.items as nestedItem, i (nestedItem.url || `${path}-${i}`)}
								{@render renderSubItem(nestedItem, depth + 1, `${path}-${i}`)}
							{/each}
						</Sidebar.MenuSub>
					</Collapsible.Content>
				</Sidebar.MenuSubItem>
			{/snippet}
		</Collapsible.Root>
	{:else}
		<!-- Leaf file item -->
		<Sidebar.MenuSubItem>
			<Sidebar.MenuSubButton href={getNavUrl(item.url)}>
				{#if ItemIcon}
					<ItemIcon class="size-4 mr-2" style={item.iconColor ? `color: ${item.iconColor}` : ''} />
				{:else}
					<FileTextIcon class="size-4 mr-2" />
				{/if}
				<span>{item.title}</span>
			</Sidebar.MenuSubButton>
		</Sidebar.MenuSubItem>
	{/if}
{/snippet}

<Sidebar.Group>
	<Sidebar.GroupLabel class="flex items-center justify-between pr-2">
		<span>Documentation</span>
		<button
			type="button"
			onclick={collapseAll}
			class="size-5 flex items-center justify-center rounded hover:bg-sidebar-accent transition-colors"
			title="Collapse all"
		>
			<ChevronsDownUpIcon class="size-3.5" />
		</button>
	</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as mainItem, idx (mainItem.url || `main-${idx}`)}
			{@const MainIcon = mainItem.icon ? getIconComponent(mainItem.icon) : FolderIcon}
			{@const itemPath = `${idx}`}

			{#if mainItem.isFolder && mainItem.items?.length}
				<!-- Top-level folder with children -->
				<Collapsible.Root bind:open={openStates[itemPath]}>
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<Collapsible.Trigger
								class="peer/menu-button outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-start text-sm h-8 cursor-default"
							>
								{#if MainIcon}
									<MainIcon
										class="size-4 shrink-0"
										style={mainItem.iconColor ? `color: ${mainItem.iconColor}` : ''}
									/>
								{:else}
									<FolderIcon class="size-4 shrink-0" />
								{/if}
								<span class="flex-1 text-left">{mainItem.title}</span>
								<ChevronRightIcon
									class="ml-auto size-4 shrink-0 transition-transform duration-200 in-data-[state=open]:rotate-90"
								/>
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each mainItem.items as subItem, i (subItem.url || `${itemPath}-${i}`)}
										{@render renderSubItem(subItem, 1, `${itemPath}-${i}`)}
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{:else}
				<!-- Top-level file (no children) -->
				<Sidebar.MenuItem>
					<Sidebar.MenuButton href={getNavUrl(mainItem.url)} tooltipContent={mainItem.title}>
						{#snippet child({ props })}
							<a href={getNavUrl(mainItem.url)} class="flex items-center gap-2 w-full" {...props}>
								{#if MainIcon}
									<MainIcon style={mainItem.iconColor ? `color: ${mainItem.iconColor}` : ''} />
								{:else}
									<FileTextIcon />
								{/if}
								<span>{mainItem.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
