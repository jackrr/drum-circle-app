<script lang="ts">
	import { EventType, Instruments, Sample } from '$lib/sound.svelte';
	import { makeDebounce } from '$lib/utils';
	const { onSoundEvent } = $props();

	function sampleToLabel(s: Sample) {
		switch (s) {
			case Sample.HatClosed:
				return 'Hat Cl';
			case Sample.HatOpen:
				return 'Hat Op';
			case Sample.TomHi:
				return 'Tom';
			default:
				return s.toString();
		}
	}

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
		Object.values(Sample).map((sample) => ({
			sample,
			playing: false,
			label: sampleToLabel(sample)
		}))
	);

	let debouncedPlayUIStops: Record<Sample, ReturnType<typeof makeDebounce>> = Object.values(
		Sample
	).reduce((acc, sample) => {
		acc[sample] = makeDebounce(() => {
			const button = buttons.find((b) => b.sample === sample);
			button && (button.playing = false);
		});
		return acc;
	}, {});
</script>

<div class="grid h-full grid-cols-4 gap-4 p-4">
	{#each buttons as button}
		<button
			class="grid max-h-24 place-content-center border {button.playing
				? 'text-gr-200 bg-pink-700'
				: ''}"
			onpointerenter={(_) => playSample(button.sample)}
		>
			{button.label}
		</button>
	{/each}
</div>
