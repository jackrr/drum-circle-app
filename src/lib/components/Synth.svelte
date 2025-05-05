<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { Octave } from '$lib/freqs';
	import { Note, NoteName, Scale, generateScale } from '$lib/freqs';
	import { EventType, Instruments } from '$lib/sound.svelte';
	import { synthSettings, samplerSettings } from '$lib/settings.svelte';
	const { onSoundEvent, variant } = $props();

	type Sound = {
		soundId: string;
		note: Note;
	};

	function getSoundId(note: Note) {
		return `synth-${note.label()}`;
	}

	let sounds = $state<{ [soundId: string]: Sound }>({});
	let pressedKeys = new SvelteSet();

	function playNote(note: Note) {
		pressedKeys.add(note.label());
		const soundId = getSoundId(note);
		if (variant === Instruments.Sampler) {
			onSoundEvent({
				soundId,
				freq: note.freq,
				type: EventType.Sample,
				sample: samplerSettings.sample,
				instrument: Instruments.Sampler
			});
		} else if (variant === Instruments.Synth) {
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
	}

	function stopNote(note: Note) {
		pressedKeys.delete(note.label());
		if (variant === Instruments.Synth) {
			const soundId = getSoundId(note);
			onSoundEvent({ soundId, type: EventType.End });
			delete sounds[soundId];
		}
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
				? 'text-gr-200 bg-pink-700'
				: ''}"
			onpointerover={(e) => {
				e.currentTarget.releasePointerCapture(e.pointerId);
				e.target?.releasePointerCapture(e.pointerId);
				playNote(note);
			}}
			onpointerleave={(_) => stopNote(note)}
		>
			{note.label()}
		</div>
	{/each}
</div>
