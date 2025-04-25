<script lang="ts">
	let { value = $bindable() } = $props();
</script>

<input class="h-full w-full rounded border p-1" bind:value placeholder="Your name" />
