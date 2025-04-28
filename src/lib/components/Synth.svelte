<script lang="ts">
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

	function startSound(pointerId: number, note: Note) {
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

	function endSound(pointerId: number) {
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

<div class="h-full px-4 grid auto-cols-fr grid-flow-col">
	{#each notes as note}
		<div
			class="grid place-content-center border-l last:border-r"
			onpointerenter={(e) => {
				// Release pointer capture allows drag across keys
				e.target?.releasePointerCapture(e.pointerId);
				startSound(e.pointerId, note);
			}}
			onpointerleave={(e) => endSound(e.pointerId)}
		>
			{note.label()}
		</div>
	{/each}
</div>
