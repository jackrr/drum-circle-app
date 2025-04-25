<script lang="ts">
	import { Note, generateScale } from '$lib/freqs';
	import { EventType } from '$lib/sound.svelte';
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
			type: EventType.Play
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
			new Note(synthSettings.rootNote, synthSettings.rootOctave),
			synthSettings.scale,
			synthSettings.numKeys
		)
	);
</script>

<div class="flex h-full flex-row px-2">
	{#each notes as note}
		<div
			class="grid grow place-content-center border-r border-l"
			onpointerover={(e) => startSound(e.pointerId, note)}
			onpointerout={(e) => endSound(e.pointerId)}
		>
			{note.label()}
		</div>
	{/each}
</div>
