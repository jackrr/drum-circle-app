<script lang="ts">
	import type { SoundEvent } from '$lib/sound';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { DrumCircle } from '$lib/peerpool';
	import { SoundMachine } from '$lib/sound';
	import Synth from '$lib/components/Synth.svelte';

	// import Name from './Name.svelte';
	// import Peers from './Peers.svelte';

	// TODO?: encapsulate peer UI w/in peers
	// type Peer = {
	// 	peerId: string;
	// 	userName: string;
	// };

	// let name = $state('');
	// let peers = $state<Peer[]>([]);

	const circleId = page.params.circle_id;

	let drumCircle: DrumCircle | undefined = $state();
	let soundMachine: SoundMachine | undefined = $state();

	onMount(async () => {
		drumCircle = new DrumCircle();
		soundMachine = new SoundMachine();

		await drumCircle.connect();
		drumCircle.join(circleId);
		const unsubscribe = drumCircle.onSound(soundMachine?.handleEvent.bind(soundMachine));
	});

	function onSoundEvent(sound: SoundEvent) {
		soundMachine?.handleEvent(sound);
		drumCircle?.broadcastSoundPayload(sound);
	}
</script>

<!-- <Name {name} changeName={onChangeName} /> -->
<!-- <Peers {peers} /> -->
<div class="h-full w-full flex flex-col">
	<div>Circle ID {circleId}</div>

	<div class="flex-grow">
		<Synth {onSoundEvent} />
	</div>
</div>
