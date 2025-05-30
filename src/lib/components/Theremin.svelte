<script lang="ts">
	import { EventType, Instruments } from '$lib/sound.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { thereminSettings } from '$lib/settings.svelte';

	type Sound = {
		soundId: string;
		freq: number;
		gain: number;
		x: number;
		y: number;
	};

	const { onSoundEvent } = $props();
	let dimensions = $state();

	let sounds = $state<{ [touchId: string]: Sound }>({});

	let minGain = $state(0.2);
	let maxGain = $state(1.0);

	function soundIdFromTouchId(touchId: number) {
		return `theremin-${touchId}`;
	}

	function handleTouchUpdate(t: Touch) {
		const soundId = soundIdFromTouchId(t.identifier);
		const { width, height } = dimensions;

		const x = t.clientX;
		const y = t.clientY;

		const round = (val: number) => Math.round(val * 100) / 100;

		const freq = round(
			thereminSettings.minFreq + (thereminSettings.maxFreq - thereminSettings.minFreq) * (x / width)
		);
		const gain = round(maxGain - (maxGain - minGain) * (y / height));

		const sound = {
			soundId,
			freq,
			gain
		};

		onSoundEvent({ ...sound, type: EventType.Play, instrument: Instruments.Theremin });
		sounds[soundId] = {
			...sound,
			x,
			y
		};
	}

	function handleTouchEnd(t: Touch) {
		const id = soundIdFromTouchId(t.identifier);
		onSoundEvent({ soundId: id, type: EventType.End });
		delete sounds[id];
	}

	function playTouches(e: TouchEvent) {
		for (const x of Array(e.changedTouches.length).keys()) {
			const item = e.changedTouches.item(x);
			if (item) handleTouchUpdate(item);
		}
	}

	function endTouches(e: TouchEvent) {
		for (const x of Array(e.changedTouches.length).keys()) {
			const item = e.changedTouches.item(x);
			if (item) handleTouchEnd(item);
		}
	}
</script>

<div
	ontouchstart={playTouches}
	ontouchmove={playTouches}
	ontouchcancel={endTouches}
	ontouchend={endTouches}
	bind:contentRect={dimensions}
	class="relative h-full w-full"
>
	{#each Object.values(sounds) as sound}
		<Tooltip
			x={sound.x}
			y={sound.y}
			parentHeight={dimensions.height as number}
			parentWidth={dimensions.width as number}>{sound.freq},{sound.gain}</Tooltip
		>
		<div style="{sound.tooltipX}; {sound.tooltipY};" class="fixed"></div>
	{/each}
	<div class="absolute bottom-4 flex w-full flex-row content-end justify-between p-4">
		<div class="">Min: {thereminSettings.minFreq}</div>
		<div class="">Max: {thereminSettings.maxFreq}</div>
	</div>
</div>
