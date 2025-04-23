<script lang="ts">
	import type { SoundEvent } from '$lib/sound';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
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

	onMount(() => {
		drumCircle = new DrumCircle(name);
		soundMachine = new SoundMachine();

		// TODO: refactor me to be callbacks instead of streams for performance
		const { unsubscribe } = pipe(
			drumCircle.feed.source,
			subscribe((ev) => {
				console.log('DrumCircle event', ev);
				switch (ev.name) {
					case DrumCircleEventName.JOINED:
						circleId = ev.payload.circleId;
						break;
					case DrumCircleEventName.PEER_MESSAGE:
						const { payload, peerId, name } = ev.payload;
						switch (name) {
							case P2PMessageName.USERNAME:
								const { userName } = payload;
								const existing = peers.find((p) => p.peerId === peerId);
								if (existing) {
									existing.userName = userName;
								} else {
									peers.push({ peerId, userName });
								}
								break;
							case P2PMessageName.SOUND:
								soundMachine?.playSound(payload);
								// TODO: show sound happened on peer
								break;
						}
						break;
					default:
						console.error('Unrecognized event', ev);
				}
			})
		);
	});

	function onSoundEvent(sound: SoundEvent) {
		soundMachine?.handleEvent(sound);
		drumCircle?.broadcastSoundPayload(sound);
	}

	console.log({ circleId });
</script>

<!-- <Name {name} changeName={onChangeName} /> -->
<!-- <Peers {peers} /> -->
<div>Circle ID {circleId}</div>

<div class="col-span-full row-2">
	<Synth {onSoundEvent} />
</div>
