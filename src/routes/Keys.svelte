<script lang="ts">
	import { freqs } from '$lib/freqs';
	const { makeSound } = $props();

	const notes = Object.keys(freqs);

	let octave = $state(4);

	// TODO: make octave choosable
</script>

<div class="flex flex-col">
	<div class="flex">
		<label class="pr-2">Octave:</label><input
			type="range"
			bind:value={octave}
			min={0}
			max={freqs['C'].length - 1}
			step={1}
		/>
	</div>
	<div class="flex flex-wrap">
		{#each notes as note}
			<button
				class="p-1 border bg-black text-white w-3xs"
				onclick={() => makeSound({ freq: freqs[note][octave] })}>{note}</button
			>
		{/each}
	</div>
</div>
