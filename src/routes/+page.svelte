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

<div class="flex flex-col items-center pt-7">
	<h1>Drum Circle</h1>
	<div class="flex flex-col pt-7">
		{#if connection}
			<button
				class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
				onclick={createCircle}>Create new circle</button
			>

			<div class="flex my-7">
				<input class="border mr-8" bind:value={circleId} placeholder="Circle ID" />
				<button
					class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
					onclick={joinCircle}
					disabled={circleId.length < 1}>Join circle {circleId}</button
				>
			</div>
		{/if}
	</div>
</div>
