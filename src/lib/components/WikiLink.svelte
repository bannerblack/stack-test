<script>
	import { toc } from '../../toc/toc.js';

	let { path, alias, isEmbed = false } = $props();

	// Dynamic component loading
	let ComponentPromise = $state(null);

	function loadComponent(targetPath) {
		if (!targetPath) return null;

		try {
			// Dynamically import the component based on the target path
			return import(`../../routes/(generated)/${targetPath}/+page.svx`);
		} catch (error) {
			console.warn(`Could not load component for path: ${targetPath}`, error);
			return null;
		}
	}

	// Find the target file in the TOC
	function findFile(searchPath) {
		const hasPath = searchPath.includes('/');

		// Helper to search recursively through TOC
		function searchNode(node, currentPath = '') {
			for (const [key, value] of Object.entries(node)) {
				if (key === '_meta') continue;

				const newPath = currentPath ? `${currentPath}/${key}` : key;

				if (value.path) {
					if (hasPath) {
						// Exact path match - check if the full path matches
						if (
							value.path === searchPath ||
							value.path === `${searchPath}.md` ||
							value.path === `${searchPath}.svx` ||
							value.path.endsWith(`/${searchPath}.md`) ||
							value.path.endsWith(`/${searchPath}.svx`)
						) {
							return {
								file: value,
								url: `/${newPath}`
							};
						}
					} else {
						// Name-only match - check if just the filename matches
						const fileName = value.path
							.split('/')
							.pop()
							.replace(/\.(md|svx|base)$/, '');
						if (fileName === searchPath) {
							return {
								file: value,
								url: `/${newPath}`
							};
						}
					}
				} else {
					// This is a folder - recurse
					const result = searchNode(value, newPath);
					if (result) {
						return result;
					}
				}
			}
			return null;
		}

		return searchNode(toc);
	}

	const target = findFile(path);
	const displayText = alias || target?.file?.title || path;
	const url = target?.url || '#';

	// Load component dynamically when in embed mode
	$effect(() => {
		if (isEmbed && target) {
			// Extract the path from the URL by removing the leading slash
			const componentPath = url.startsWith('/') ? url.slice(1) : url;
			ComponentPromise = loadComponent(componentPath);
		} else {
			ComponentPromise = null;
		}
	});
</script>

{#if isEmbed && target}
	<!-- Embed mode - render the target component -->
	<div class="border rounded-md my-4 bg-muted/20">
		<a
			href={url}
			class="flex items-center justify-between px-4 py-2 border-b bg-muted/30 rounded-t-md hover:bg-muted/40 transition-colors group"
		>
			<div class="text-sm text-muted-foreground group-hover:text-primary transition-colors">
				📄 {target.file.title}
			</div>
			<div
				class="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1"
			>
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					/>
				</svg>
				Open
			</div>
		</a>
		<div class="p-4">
			{#if ComponentPromise}
				{#await ComponentPromise}
					<div class="text-sm text-muted-foreground">Loading...</div>
				{:then module}
					{#if module?.default}
						{@const Component = module.default}
						<Component />
					{:else}
						<div class="text-sm text-red-500">Component export not found for: {path}</div>
					{/if}
				{:catch error}
					<div class="text-sm text-red-500">Failed to load component for: {path}</div>
				{/await}
			{:else}
				<div class="text-sm text-red-500">Component path not found for: {path}</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Link mode - render as clickable link -->
	<a href={url} class="text-primary hover:underline">
		{displayText}
	</a>
{/if}
