<script lang="ts">
	import { freqs } from '$lib/freqs';

	type Sound = {
		soundId: string;
		freq: number;
		gain: number;
		x: number;
		y: number;
	};

	const { playSound, stopSound } = $props();
	let width = $state(1);
	let height = $state(1);

	let sounds = $state<{ [touchId: string]: Sound }>({});

	let minFreq = $state(parseFloat(freqs['C'][2]));
	let maxFreq = $state(parseFloat(freqs['C'][6]));
	let minGain = $state(0.2);
	let maxGain = $state(1.0);

	function soundIdFromTouchId(touchId: number) {
		return `synth-${touchId}`;
	}

	function handleTouchUpdate(t: Touch) {
		const soundId = soundIdFromTouchId(t.identifier);

		const x = t.clientX;
		const y = t.clientY;

		const round = (val: number) => Math.round(val * 100) / 100;

		const freq = round(minFreq + (maxFreq - minFreq) * (x / width));
		const gain = round(maxGain - (maxGain - minGain) * (y / height));

		const sound = {
			soundId,
			freq,
			gain,
			x,
			y
		};

		playSound(sound);
		sounds[soundId] = sound;
	}

	function handleTouchEnd(t: Touch) {
		const id = soundIdFromTouchId(t.identifier);
		stopSound(id);
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
	bind:clientHeight={height}
	bind:clientWidth={width}
	class="relative h-full w-full"
>
	<!-- <SynthSettings /> -->
	{#each Object.values(sounds) as sound}
		<div style="left: {sound.x}px; top: {sound.y}px;" class="absolute">
			{sound.freq},{sound.gain}
		</div>
	{/each}
	<div class="absolute bottom-4 flex w-full flex-row content-end justify-between p-4">
		<div class="">Min: {minFreq}</div>
		<div class="">Max: {maxFreq}</div>
	</div>
</div>
