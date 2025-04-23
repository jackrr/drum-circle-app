<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { DrumCircle } from '$lib/peerpool';

	import Logo from '$lib/components/Logo.svelte';

	let pendingCircleId = $state('');

	// For creation
	let drumCircle: DrumCircle | undefined = $state();

	onMount(async () => {
		const dc = new DrumCircle();

		await dc.connect();

		drumCircle = dc;
	});

	async function createCircle() {
		if (drumCircle) {
			const circleId = await drumCircle.create();
			goto(`/drum-circle/${circleId}`);
		} else {
			console.log('NO CONNECTION TO CONNECT TO!');
		}
	}
</script>

<div class="flex h-full w-full flex-row flex-wrap content-center">
	<div class="grid place-content-center p-12">
		<Logo size={120} />
	</div>
	<div class="grid flex-grow place-content-center p-8">
		<button
			class="h-12 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
			onclick={createCircle}>Create new circle</button
		>
		<p class="p-4 text-center">-- OR --</p>
		<input
			class="mb-4 h-12 rounded border px-3 py-1"
			bind:value={pendingCircleId}
			placeholder="Circle ID"
		/>
		<a
			class="h-12 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
			href={pendingCircleId.length > 0 ? `/drum-circle/${pendingCircleId}` : '#'}
			>Join circle {pendingCircleId}</a
		>
	</div>
</div>
