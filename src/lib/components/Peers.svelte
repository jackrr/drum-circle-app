<script module lang="ts">
	import { SoundMachine } from '$lib/sound.svelte';

	export class Peer {
		peerId: string;
		sound: SoundMachine;
		username = $state('');

		constructor(peerId: string, sound: SoundMachine) {
			this.peerId = peerId;
			this.sound = sound;
		}
	}
</script>

<script lang="ts">
	let {
		peers
	}: {
		peers: Peer[];
	} = $props();

	const sortedPeers = $derived(
		peers.sort((a, b) => {
			if (a.sound.playing) return -1;
			if (b.sound.playing) return 1;
			return 0;
		})
	);
</script>

<div class="flex flex-row truncate">
	{#each sortedPeers as peer, i (peer.peerId)}
		<div class="mx-2 px-2 truncate {peer.sound.playing ? 'bg-blue-200' : ''}">
			{peer.username || `User ${i + 1}`}
		</div>
	{/each}
</div>
