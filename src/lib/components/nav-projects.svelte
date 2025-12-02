<script>
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PinIcon from '@lucide/svelte/icons/pin';
	import PinOffIcon from '@lucide/svelte/icons/pin-off';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	let { pinnedNotes } = $props();

	const sidebar = useSidebar();
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Pinned</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each pinnedNotes as item (item.url)}
			{@const ItemIcon = item.icon || FileTextIcon}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a href={item.url} {...props}>
							{#if ItemIcon}
								<ItemIcon />
							{:else}
								<FileTextIcon />
							{/if}
							<span>{item.name}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuAction showOnHover {...props}>
								<EllipsisIcon />
								<span class="sr-only">More</span>
							</Sidebar.MenuAction>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-48"
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align={sidebar.isMobile ? 'end' : 'start'}
					>
						<DropdownMenu.Item>
							<ExternalLinkIcon class="text-muted-foreground" />
							<span>Open in New Tab</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							<PinOffIcon class="text-muted-foreground" />
							<span>Unpin</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
