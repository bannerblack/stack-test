<script>
	/**
	 * General Note Template
	 * Default template for regular markdown notes
	 * Supports: <Image>, <Calendar>, wikilinks
	 */
	// import { base } from '$app/paths';
	import Image from './Image.svelte';
	import Calendar from './Calendar.svelte';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';

	// UI Imports
	import * as Card from '$lib/components/ui/card/index.js';
	import Star from '@lucide/svelte/icons/star';

	import { templateConfig } from '../../template-config.js';

	let { frontmatter, children } = $props();

	// Get computed style colors for conditional heading colors
	let chartColors = $derived({
		h1: templateConfig.colored_headings ? 'var(--chart-1)' : 'inherit',
		h2: templateConfig.colored_headings ? 'var(--chart-2)' : 'inherit',
		h3: templateConfig.colored_headings ? 'var(--chart-3)' : 'inherit',
		h4: templateConfig.colored_headings ? 'var(--chart-4)' : 'inherit',
		h5: templateConfig.colored_headings ? 'var(--chart-5)' : 'inherit'
	});
</script>

<!-- UNCOMMENT FOR DEBUGGING! -->
<!-- <pre>TEMPLATECONFIG: {JSON.stringify(templateConfig, null, 2)}</pre>
<pre>{JSON.stringify(frontmatter, null, 2)}</pre> -->

<!-- Note header with title -->
{#if frontmatter?.title && templateConfig.basic_note_top_title}
	<header class="note-header text-center mx-auto w-full">
		<h1 class="text-4xl font-bold mb-1">{frontmatter.title}</h1>
		{#if frontmatter.description}
			<p class="text-lg text-muted-foreground mb-4">{frontmatter.description}</p>
		{/if}
	</header>
{/if}

<!-- Optional cover image -->
{#if frontmatter?.image && templateConfig.basic_note_cover_image}
	<div
		class="note-cover-image mb-4 mx-auto"
		style:max-width={templateConfig.max_cover_image_width || '100%'}
	>
		<Image src={frontmatter.image} alt={frontmatter.title || 'Cover image'} />
	</div>
{/if}

<!-- Music Metadata -->
{#if frontmatter?.artist && templateConfig.basic_note_music_metadata}
	<Card.Root class="shadow-none flex flex-row items-center gap-2 w-[80%] mx-auto">
		<!-- <div class="icon border-r border-border h-full py-2 pr-3 pl-1 flex items-center justify-center">
			<CalendarRange color="var(--chart-1)" />
		</div> -->
		<Card.Header class="flex flex-col justify-start w-full gap-3">
			{#if frontmatter?.artist}
				<div class="date-item flex flex-row justify-between border-b w-full pb-2">
					<span class="date-label uppercase">ARTIST:</span>
					<span class="date-value">{frontmatter.artist}</span>
				</div>
			{/if}
			{#if frontmatter?.title}
				<div class="date-item flex flex-row justify-between border-b w-full pb-2">
					<span class="date-label uppercase">TITLE:</span>
					<span class="date-value">{frontmatter.title}</span>
				</div>
			{/if}
			{#if frontmatter?.release_date}
				<div class="date-item flex flex-row justify-between border-b w-full pb-2">
					<span class="date-label uppercase">YEAR:</span>
					<span class="date-value">{String(frontmatter.release_date).slice(0, 4)}</span>
				</div>
			{/if}
			<!-- Rating -->
			{#if frontmatter?.rating != null && frontmatter?.rating !== -1}
				{@const rating = Number(frontmatter.rating)}
				{@const fullStars = Math.floor(rating)}
				{@const hasHalfStar = rating % 1 >= 0.5}
				<div class="date-item flex flex-row justify-between w-full">
					<span class="date-label uppercase">RATING:</span>
					<span class="date-value flex items-center gap-1">
						{#each Array(fullStars) as _}
							<Star class="w-4 h-4 fill-current" />
						{/each}
						{#if hasHalfStar}
							<div class="relative w-4 h-4">
								<Star class="w-4 h-4 absolute" />
								<div class="absolute inset-0 overflow-hidden w-1/2">
									<Star class="w-4 h-4 fill-current" />
								</div>
							</div>
						{/if}
					</span>
				</div>
			{/if}
		</Card.Header>
	</Card.Root>
{/if}
<!-- End Music Metadata -->

<!-- Main content (markdown rendered by mdsvex) -->
<!-- Conditionals for colored headers because we don't have direct access to the content -->
<article
	class="note-content max-w-none px-10"
	style:--h1-color={chartColors.h1}
	style:--h2-color={chartColors.h2}
	style:--h3-color={chartColors.h3}
	style:--h4-color={chartColors.h4}
	style:--h5-color={chartColors.h5}
>
	{@render children?.()}
</article>

<!-- Optional calendar -->
{#if frontmatter?.created || frontmatter?.modified || frontmatter?.date}
	<Calendar class="mt-8" {frontmatter} />
{/if}

<style lang="postcss">
	@reference "tailwindcss";

	:global(.note-content p) {
		@apply mb-8;
	}

	:global(.note-content h1) {
		@apply mt-12 mb-6 text-3xl font-bold;
		color: var(--h1-color);
	}

	:global(.note-content h2) {
		@apply mt-12 mb-6 text-3xl font-bold;
		color: var(--h2-color);
	}

	:global(.note-content h3) {
		@apply mt-12 mb-6 text-3xl font-bold;
		color: var(--h3-color);
	}

	:global(.note-content h4) {
		@apply mt-12 mb-6 text-3xl font-bold;
		color: var(--h4-color);
	}

	:global(.note-content h5) {
		@apply mt-12 mb-6 text-3xl font-bold;
		color: var(--h5-color);
	}

	:global(.note-content h6) {
		@apply mt-12 mb-6 text-3xl font-bold;
	}

	:global(hr) {
		@apply my-5;
	}
</style>
