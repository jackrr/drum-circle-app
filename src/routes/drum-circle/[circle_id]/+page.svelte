<script lang="ts">
	import type { SoundEvent } from '$lib/sound.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { userSettings } from '$lib/settings.svelte';
	import { P2PMessageName, DrumCircle } from '$lib/peerpool';
	import { SoundMachine, Instruments } from '$lib/sound.svelte';
	import Drums from '$lib/components/Drums.svelte';
	import Theremin from '$lib/components/Theremin.svelte';
	import Synth from '$lib/components/Synth.svelte';
	import Peers, { Peer } from '$lib/components/Peers.svelte';
	import Settings from '$lib/components/Settings.svelte';

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
				peer = new Peer(peerId, new SoundMachine(audioContext, true, soundMachine!.sink));
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
					peer.sound.teardown();
					delete peers[peerId];
					break;

				case P2PMessageName.CONNECTED:
					// noop
					break;

				default:
					console.warn("Don't know how to handle peer event", ev);
			}
		});

		await drumCircle.connect();
		drumCircle.join(circleId);
	});

	onDestroy(() => {
		drumCircle?.close();
	});

	$effect(() => {
		userSettings.username !== '' && drumCircle?.setUserName(userSettings.username);
	});

	function onSoundEvent(sound: SoundEvent) {
		soundMachine?.handleEvent(sound);
		drumCircle?.broadcastSoundPayload(sound);
	}
</script>

<div class="bg-gr-200 flex h-full w-full flex-col text-blue-800">
	<div class="flex flex-row content-center justify-between">
		<div class="grid place-content-center">
			<h1 class="w-36 px-4 text-lg">Circle ID {circleId}</h1>
		</div>
		<div class="grid place-content-center">
			<Peers peers={Object.values(peers)} />
		</div>
		<Settings />
	</div>

	<div class="flex-grow">
		{#if userSettings.instrument === Instruments.Theremin}
			<Theremin {onSoundEvent} />
		{/if}
		{#if userSettings.instrument === Instruments.Synth}
			<Synth {onSoundEvent} variant={Instruments.Synth} />
		{/if}
		{#if userSettings.instrument === Instruments.Sampler}
			<Synth {onSoundEvent} variant={Instruments.Sampler} />
		{/if}
		{#if userSettings.instrument === Instruments.Drums}
			<Drums {onSoundEvent} />
		{/if}
	</div>
</div>
