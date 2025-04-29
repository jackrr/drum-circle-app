<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { Octave } from '$lib/freqs';
	import { Note, NoteName, Scale, generateScale } from '$lib/freqs';
	import { EventType, Instruments } from '$lib/sound.svelte';
	import { synthSettings } from '$lib/settings.svelte';
	const { onSoundEvent } = $props();

	type Sound = {
		soundId: string;
		note: Note;
	};

	function soundIdFromPointerId(pointerId: number) {
		return `synth-${pointerId}`;
	}

	let sounds = $state<{ [pointerId: string]: Sound }>({});
	let pressedKeys = new SvelteSet();

	function playNote(pointerId: number, note: Note) {
		pressedKeys.add(note.label());
		const soundId = soundIdFromPointerId(pointerId);
		onSoundEvent({
			soundId,
			freq: note.freq,
			type: EventType.Play,
			instrument: Instruments.Synth
		});
		sounds[soundId] = {
			soundId,
			note
		};
	}

	function stopNote(pointerId: number, note: Note) {
		pressedKeys.delete(note.label());
		const soundId = soundIdFromPointerId(pointerId);
		onSoundEvent({ soundId, type: EventType.End });
		delete sounds[soundId];
	}

	let notes: Note[] = $derived(
		generateScale(
			new Note(synthSettings.rootNote as NoteName, synthSettings.rootOctave as Octave),
			synthSettings.scale as Scale,
			synthSettings.numKeys
		)
	);
</script>

<div class="grid h-full auto-cols-fr grid-flow-col px-4">
	{#each notes as note}
		<div
			class="grid place-content-center border-l last:border-r {pressedKeys.has(note.label())
				? 'bg-pink-700'
				: ''}"
			onpointerenter={(e) => {
				// Release pointer capture allows drag across keys
				e.target?.releasePointerCapture(e.pointerId);
				playNote(e.pointerId, note);
			}}
			onpointerleave={(e) => stopNote(e.pointerId, note)}
		>
			{note.label()}
		</div>
	{/each}
</div>
