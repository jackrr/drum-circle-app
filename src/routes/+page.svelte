<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { DrumCircle } from '$lib/peerpool';

	import Logo from '$lib/components/Logo.svelte';

	let pendingCircleId = $state('');

	// For creation
	let drumCircle: DrumCircle | undefined = $state();

	onMount(() => {
		drumCircle = new DrumCircle();
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

<div class="h-full w-full flex flex-row content-center flex-wrap">
	<div class="grid place-content-center p-12">
		<Logo size={120} />
	</div>
	<div class="flex-grow grid place-content-center p-8">
		<button
			class="h-12 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
			onclick={createCircle}>Create new circle</button
		>
		<p class="text-center p-4">-- OR --</p>
		<input
			class="h-12 rounded border px-3 py-1 mb-4"
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
