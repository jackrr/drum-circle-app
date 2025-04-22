<script lang="ts">
	import type { SoundEvent } from '$lib/sound';
	import { onMount } from 'svelte';
	import { pipe, subscribe } from 'wonka';
	import { env } from '$env/dynamic/public';
	import { DrumCircle, DrumCircleEventName, P2PMessageName } from '$lib/peerpool';
	import { SoundMachine } from '$lib/sound';
	import Synth from '$lib/components/Synth.svelte';

	import Name from './Name.svelte';
	import Peers from './Peers.svelte';

	type Peer = {
		peerId: string;
		userName: string;
	};

	let circleId = $state();
	let pendingCircleId = $state('');
	let name = $state('');
	let peers = $state<Peer[]>([]);

	let drumCircle: DrumCircle | undefined = $state();
	let soundMachine: SoundMachine | undefined = $state();

	onMount(() => {
		drumCircle = new DrumCircle(env.PUBLIC_WS_SERVER_HOST, name);
		soundMachine = new SoundMachine();

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

	async function createCircle() {
		if (drumCircle) {
			drumCircle.create();
		} else {
			console.log('NO CONNECTION TO CONNECT TO!');
		}
	}

	async function joinCircle() {
		if (drumCircle) {
			drumCircle.join(pendingCircleId);
		} else {
			console.log('NO CONNECTION TO CONNECT TO!');
		}
	}

	function onChangeName(newName: string) {
		if (drumCircle) drumCircle.setUserName(newName);
		name = newName;
	}

	function onSoundEvent(sound: SoundEvent) {
		soundMachine?.handleEvent(sound);
		drumCircle?.broadcastSoundPayload(sound);
	}
</script>

<div class="flex h-full w-full flex-col flex-wrap">
	<div class="flex w-full flex-none flex-row flex-nowrap">
		<Name {name} changeName={onChangeName} />
		<Peers {peers} />
		{#if circleId}
			<div>Circle ID {circleId}</div>
		{/if}
	</div>

	{#if circleId}
		<div class="flex-1">
			<Synth {onSoundEvent} />
		</div>
	{/if}

	{#if drumCircle && !circleId}
		<div class="flex-1">
			<div
				style="grid-template-rows: repeat(3, max-content)"
				class="grid grid-cols-2 place-items-center gap-8 p-4"
			>
				<svg
					class="col-span-2"
					width="200"
					height="200"
					xmlns="http://www.w3.org/2000/svg"
					xmlns:xlink="http://www.w3.org/1999/xlink"
				>
					<path
						id="circularPath"
						d="M 100,100 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0"
						fill="none"
						stroke="lightgray"
						stroke-width="0"
					/>
					<text style="font-size: 47px; fill: #2b7fff; font-weight: bold">
						<textPath xlink:href="#circularPath" startOffset="0%"> DRUM CIRCLE </textPath>
					</text>
				</svg>

				<button
					class="col-span-2 h-12 w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
					onclick={createCircle}>Create new circle</button
				>
				<input
					class="h-12 w-full rounded border px-3 py-1"
					bind:value={pendingCircleId}
					placeholder="Circle ID"
				/>
				<button
					class="h-12 w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
					onclick={joinCircle}
					disabled={pendingCircleId.length < 1}>Join circle {circleId}</button
				>
			</div>
		</div>
	{/if}
</div>
