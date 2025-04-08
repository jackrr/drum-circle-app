<script lang="ts">
	import { onMount } from 'svelte';
	import { ConnectionManager, initialize } from '$lib/peerpool';

	let circleId = $state('');

	let connection: ConnectionManager | undefined = $state();

	onMount(async () => {
		connection = await initialize('127.0.0.1:8080');
	});

	// calls 
	// 1234: 
	// {
	// 	offerCandidates: [{ice_candidate_1}, {ice_candidate_two},.....]
	// 	answerCandidates: [{}, ...]
	// 	offer: {
	//		sdp: <>
	//		type: <>
	// 	},
	// 	answer: {
	//  }
	// }

	async function createCircle() {
		if (connection) {
			const msg = await connection.createCircle();
			console.log('connected!',);
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
	<div style="grid-template-rows: repeat(3, max-content)" class="grid grid-cols-2 place-items-center p-4 gap-8">
		<svg class="col-span-2" width="200" height="200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
			<path id="circularPath" d="M 100,100 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" fill="none" stroke="lightgray" stroke-width="0" />
			<text style="font-size: 47px; fill: #2b7fff; font-weight: bold">
				<textPath xlink:href="#circularPath" startOffset="0%">
				DRUM CIRCLE
				</textPath>
			</text>
		</svg>

		{#if connection}
			<button
				class="col-span-2 rounded bg-blue-500 px-4 py-2 w-full font-bold text-white hover:bg-blue-700 h-12"
				onclick={createCircle}>Create new circle</button
			>
				<input class="rounded border px-3 py-1 h-12 w-full" bind:value={circleId} placeholder="Circle ID" />
				<button
					class="w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 h-12"
					onclick={joinCircle}
					disabled={circleId.length < 1}>Join circle {circleId}</button
				>
		{/if}
	</div>
</div>
