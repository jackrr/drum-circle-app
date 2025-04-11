<script lang="ts">
	let { peers } = $props();
</script>

<div class="flex flex-col px-1">
	{#each peers as peer, i (peer.peerId)}
		<div>Peer {i + 1}: {peer.userName}</div>
	{/each}
</div>
