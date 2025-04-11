<script lang="ts">
	let { name, changeName } = $props();

	let innerName = $state(name);
</script>

<input
	class="h-12 w-full rounded border p-1"
	bind:value={innerName}
	placeholder="Your name"
	onchange={() => changeName(innerName)}
/>
