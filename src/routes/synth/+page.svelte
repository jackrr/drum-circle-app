<script lang="ts">
	import { onMount } from 'svelte';
	import { SoundMachine } from '$lib/sound';
	import Synth from '$lib/components/Synth.svelte';

	let soundMachine: SoundMachine | undefined = $state();

	onMount(() => {
		soundMachine = new SoundMachine();
	});
</script>

<Synth onSoundEvent={soundMachine?.handleEvent.bind(soundMachine)} />
