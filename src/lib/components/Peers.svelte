<script lang="ts">
	import { SoundMachine } from '$lib/sound';

	export type Peer = {
		peerId: string;
		sound: SoundMachine;
		username?: string;
	};

	let {
		peers
	}: {
		peers: Peer[];
	} = $props();
</script>

<div class="flex flex-row">
	{#each peers as peer, i (peer.peerId)}
		<div class="px-2">{peer.username || `User ${i + 1}`}</div>
	{/each}
</div>
