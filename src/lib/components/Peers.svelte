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
</script>

<div class="flex flex-row">
	{#each peers as peer, i (peer.peerId)}
		<div class="mx-2 px-2 {peer.sound.playing ? 'bg-blue-200' : ''}">
			{peer.username || `User ${i + 1}`}
		</div>
	{/each}
</div>
