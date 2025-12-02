<script module>
	import { navMain, pinnedNotes, pageNotes, iconMap } from '$lib/../toc/nav.js';
	import { config } from '$lib/../docs.config.js';
	// Import icons used in config - these are static
	import CommandIcon from '@lucide/svelte/icons/command';

	// Static icon map for config icons
	const configIconMap = {
		command: CommandIcon
	};

	// Get icon component from icon name string
	function getIconComponent(iconName) {
		if (!iconName) return null;
		// Check config icons first, then generated iconMap
		return configIconMap[iconName] || iconMap[iconName] || null;
	}

	// Build navSecondary with resolved icons from pageNotes
	const navSecondary = pageNotes.map((item) => ({
		...item,
		icon: getIconComponent(item.icon)
	}));

	// Build pinnedNotes with resolved icons from generated data
	const resolvedPinnedNotes = pinnedNotes.map((item) => ({
		...item,
		icon: getIconComponent(item.icon)
	}));

	const data = {
		site: config.site,
		user: config.user,
		navMain: navMain,
		navSecondary: navSecondary,
		pinnedNotes: resolvedPinnedNotes
	};
</script>

<script>
	import { page } from '$app/stores';
	import { getAbsolutePath } from '$lib/utils/path-utils.js';
	import NavMain from './nav-main.svelte';
	import NavProjects from './nav-projects.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	// Get site logo icon
	const SiteLogo = getIconComponent(data.site.logo);

	let { ref = $bindable(null), ...restProps } = $props();
</script>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href={getAbsolutePath('')} {...props}>
							<div
								class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
							>
								{#if SiteLogo}
									<SiteLogo class="size-4" />
								{/if}
							</div>
							<div class="grid flex-1 text-start text-sm leading-tight">
								<span class="truncate font-medium">{data.site.name}</span>
								<span class="truncate text-xs">{data.site.description}</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavProjects pinnedNotes={data.pinnedNotes} />
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
</Sidebar.Root>
