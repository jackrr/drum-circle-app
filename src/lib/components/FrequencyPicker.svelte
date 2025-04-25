<script lang="ts">
	let {
		freq = $bindable(),
		min,
		max
	}: {
		freq: number;
		min: number;
		max: number;
	} = $props();
</script>

<input class="" bind:value={freq} {min} {max} type="range" step={0.01} />
