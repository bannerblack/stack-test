<script>
	import { Collapsible as CollapsiblePrimitive } from 'bits-ui';

	let { ref = $bindable(null), class: className, ...restProps } = $props();
</script>

<CollapsiblePrimitive.Trigger
	bind:ref
	data-slot="collapsible-trigger"
	class="cursor-default {className}"
	{...restProps}
/>
