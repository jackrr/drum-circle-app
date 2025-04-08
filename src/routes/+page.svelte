<script lang="ts">
	import { onMount } from 'svelte';
	import { ConnectionManager, initialize } from '$lib/peerpool';

	let circleId = $state('');

	let connection: ConnectionManager | undefined = $state();

	onMount(async () => {
		connection = await initialize('127.0.0.1:8080');
	});

	async function createCircle() {
		if (connection) {
			await connection.createCircle();
			console.log('connected!');
		} else {
			console.log('NO CONNECTION TO CONNECT TO!');
		}
	}

	async function joinCircle() {
		if (connection) {
			await connection.joinCircle(circleId);
			console.log('Joined!');
		} else {
			console.log('NO CONNECTION TO CONNECT TO!');
		}
	}
</script>

<h1>Drum Circle</h1>
{#if connection}
	<button onclick={createCircle}>Create new circle</button>
	<input bind:value={circleId} />
	<button onclick={joinCircle} disabled={circleId.length < 1}>Join circle {circleId}</button>
{/if}
