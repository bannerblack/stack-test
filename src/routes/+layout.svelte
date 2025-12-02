<script>
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { getAbsolutePath } from '$lib/utils/path-utils.js';
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import FileIcon from '@lucide/svelte/icons/file';
	import './layout.css';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { toc } from '$lib/../toc/toc.js';

	let { children } = $props();

	// Generate breadcrumbs from current path
	const breadcrumbs = $derived(() => {
		const pathname = $page.url.pathname;
		if (pathname === '/' || !toc) return [];

		const segments = pathname.split('/').filter(Boolean);
		const crumbs = [];

		// Build breadcrumbs by traversing the toc structure
		let current = toc;
		let currentPath = '';

		for (const segment of segments) {
			currentPath += `/${segment}`;
			if (current[segment]) {
				const item = current[segment];
				const title = item._meta?.__originalName || item.title || segment;
				const isFile = !!item.path;
				const isBase = isFile && item.path?.endsWith('.base');

				crumbs.push({
					title,
					path: currentPath,
					isFile,
					isBase
				});

				if (!isFile) {
					current = item;
				}
			} else {
				break;
			}
		}

		return crumbs;
	});

	// Go back function
	function goBack() {
		history.back();
	}
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="flex h-16 shrink-0 items-center gap-2 justify-between pr-3">
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />

				{#if breadcrumbs().length > 0}
					<Button variant="ghost" size="sm" onclick={goBack} class="h-8 w-8 p-0">
						<ArrowLeftIcon class="h-4 w-4" />
						<span class="sr-only">Go back</span>
					</Button>
				{/if}

				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={getAbsolutePath('')}>Home</Breadcrumb.Link>
						</Breadcrumb.Item>
						{#each breadcrumbs() as crumb, index}
							<Breadcrumb.Separator />
							<Breadcrumb.Item>
								{#if index === breadcrumbs().length - 1}
									<Breadcrumb.Page class="flex items-center gap-1">
										{#if crumb.isBase}
											<DatabaseIcon class="h-3 w-3" />
										{:else if crumb.isFile}
											<FileIcon class="h-3 w-3" />
										{/if}
										{crumb.title}
									</Breadcrumb.Page>
								{:else}
									<Breadcrumb.Link href={crumb.path} class="flex items-center gap-1">
										{#if crumb.isBase}
											<DatabaseIcon class="h-3 w-3" />
										{:else if crumb.isFile}
											<FileIcon class="h-3 w-3" />
										{/if}
										{crumb.title}
									</Breadcrumb.Link>
								{/if}
							</Breadcrumb.Item>
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
			<ThemeToggle />
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
