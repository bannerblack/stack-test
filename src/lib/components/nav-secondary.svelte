<script>
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	let { ref = $bindable(null), items, ...restProps } = $props();
</script>

<Sidebar.Group bind:ref {...restProps}>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				{@const ItemIcon = item.icon || FileTextIcon}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton size="sm">
						{#snippet child({ props })}
							<a href={item.url} {...props}>
								<ItemIcon />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
