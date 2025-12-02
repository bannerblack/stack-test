<script>
	import { cn } from '$lib/utils.js';
	let { ref = $bindable(null), class: className, children, ...restProps } = $props();
</script>

<ul
	bind:this={ref}
	data-slot="sidebar-menu-sub"
	data-sidebar="menu-sub"
	class={cn(
		'border-sidebar-border ml-3.5 mr-0 flex min-w-0 translate-x-px flex-col gap-1 border-s pl-2.5 pr-0 py-0.5',
		'group-data-[collapsible=icon]:hidden',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</ul>
