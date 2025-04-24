<script lang="ts">
	import type { SoundEvent } from '$lib/sound';
	import type { Peer } from '$lib/components/Peers.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { P2PMessageName, DrumCircle } from '$lib/peerpool';
	import { SoundMachine } from '$lib/sound';
	import Synth from '$lib/components/Synth.svelte';
	import Peers from '$lib/components/Peers.svelte';

	const circleId = page.params.circle_id;

	let drumCircle: DrumCircle | undefined = $state();
	let soundMachine: SoundMachine | undefined = $state();
	let peers: { [peerId: string]: Peer } = $state({});

	onMount(async () => {
		drumCircle = new DrumCircle();
		const audioContext = new AudioContext();
		soundMachine = new SoundMachine(audioContext);

		const unsubscribe = drumCircle.onPeerEvent((ev) => {
			const { peerId, name, payload } = ev;

			let peer = peers[peerId];

			if (!peer) {
				peer = {
					peerId,
					sound: new SoundMachine(audioContext, true)
				};
			}

			peers = { ...peers, [peerId]: peer };

			switch (name) {
				case P2PMessageName.USERNAME:
					peer.username = payload.username;
					break;

				case P2PMessageName.SOUND:
					peer.sound.handleEvent(payload);
					break;

				case P2PMessageName.DISCONNECT:
					delete peers[peerId];
					break;

				default:
					console.warn("Don't know how to handle peer event", ev);
			}
		});

		await drumCircle.connect();
		drumCircle.join(circleId);
	});

	function onSoundEvent(sound: SoundEvent) {
		soundMachine?.handleEvent(sound);
		drumCircle?.broadcastSoundPayload(sound);
	}
</script>

<!-- <Name {name} changeName={onChangeName} /> -->
<div class="flex h-full w-full flex-col">
	<div class="flex flex-row">
		<div>Circle ID {circleId}</div>
		<Peers peers={Object.values(peers)} />
	</div>

	<div class="flex-grow">
		<Synth {onSoundEvent} />
	</div>
</div>
