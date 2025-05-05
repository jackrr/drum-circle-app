<script lang="ts">
	import { EventType, Instruments, Sample } from '$lib/sound.svelte';
	import { makeDebounce } from '$lib/utils';
	const { onSoundEvent } = $props();
	const samples = [
		Sample.Bass,
		Sample.Snare,
		Sample.Clap,
		Sample.TomHi,
		Sample.Ride,
		Sample.HatClosed,
		Sample.HatOpen,
		Sample.CrashCym
	];

	function playSample(sample: Sample) {
		onSoundEvent({
			sample,
			instrument: Instruments.Drums,
			type: EventType.Sample
		});

		const button = buttons.find((b) => b.sample === sample);
		button && (button.playing = true);

		debouncedPlayUIStops[sample](150);
	}

	let buttons = $state(
		samples.map((sample) => ({
			sample,
			playing: false
		}))
	);

	let debouncedPlayUIStops: Record<Sample, ReturnType<typeof makeDebounce>> = samples.reduce(
		(acc, sample) => {
			acc[sample] = makeDebounce(() => {
				const button = buttons.find((b) => b.sample === sample);
				button && (button.playing = false);
			});
			return acc;
		},
		{}
	);
</script>

<div class="grid h-full grid-cols-4 gap-4 p-4">
	{#each buttons as button}
		<button
			class="grid max-h-24 place-content-center border {button.playing
				? 'text-gr-200 bg-pink-700'
				: ''}"
			onpointerenter={(_) => playSample(button.sample)}
		>
			{button.sample.toString()}
		</button>
	{/each}
</div>
