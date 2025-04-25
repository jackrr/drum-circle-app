<script lang="ts">
	import Username from '$lib/components/Username.svelte';
	import FrequencyPicker from '$lib/components/FrequencyPicker.svelte';
	import Choice from '$lib/components/Choice.svelte';
	import { noteNames, scaleNames } from '$lib/freqs';
	import { userSettings, thereminSettings, Instruments, synthSettings } from '$lib/settings.svelte';

	let dialog = $state<HTMLDialogElement>();
	let showModal = $state(false);

	$effect(() => {
		showModal ? dialog?.showModal() : dialog?.close();
	});
</script>

<button
	class="grid place-content-center p-2"
	onclick={() => (showModal = true)}
	aria-label="Settings"
>
	<span class="icon-[meteor-icons--gear] text-lg"></span>
</button>

{#snippet label(f: string)}
	<p class="mt-3 mr-3">{f}</p>
{/snippet}

<dialog
	class="open:bg m-8 p-2 backdrop:bg-slate-400 open:flex open:flex-col open:justify-between open:transition-opacity open:backdrop:transition-opacity"
	bind:this={dialog}
	onclose={() => (showModal = false)}
	onclick={(e) => {
		if (e.target === dialog) showModal = false;
	}}
>
	<div class="flex grow flex-col">
		<div class="flex h-12 flex-row content-center">
			{@render label('Username:')}
			<Username bind:value={userSettings.username} />
		</div>
		<div class="flex h-12 flex-row content-center">
			{@render label('Instrument:')}
			<Choice bind:choice={userSettings.instrument} choices={Object.values(Instruments)} />
		</div>

		{#if userSettings.instrument === Instruments.Synth}
			<div class="flex h-12 flex-row content-center">
				{@render label('Root:')}
				<select bind:value={synthSettings.rootNote}>
					{#each noteNames as note}
						<option value={note}>{note}</option>
					{/each}
				</select>
				<div class="flex flex-row content-center gap-2">
					<div>{synthSettings.rootOctave}</div>
					<input type="range" bind:value={synthSettings.rootOctave} step={1} min={0} max={8} />
				</div>
			</div>

			<div class="flex h-12 flex-row content-center">
				{@render label('Scale')}
				<Choice bind:choice={synthSettings.scale} choices={Object.values(scaleNames)} />
			</div>

			<div class="flex h-12 flex-row content-center">
				{@render label(`Keys: ${synthSettings.numKeys}`)}
				<input type="range" bind:value={synthSettings.numKeys} step={1} min={3} max={20} />
			</div>
		{/if}

		{#if userSettings.instrument === Instruments.Theremin}
			<div class="flex h-12 flex-row content-center">
				{@render label(`Min Freq: ${thereminSettings.minFreq}`)}
				<FrequencyPicker
					bind:freq={thereminSettings.minFreq}
					min={0}
					max={thereminSettings.maxFreq}
				/>
			</div>
			<div class="flex h-12 flex-row content-center">
				{@render label(`Min Freq: ${thereminSettings.maxFreq}`)}
				<FrequencyPicker
					bind:freq={thereminSettings.maxFreq}
					min={thereminSettings.minFreq + 2}
					max={8000.0}
				/>
			</div>
		{/if}
	</div>
	<button class="text-left" onclick={() => (showModal = false)}>Done</button>
</dialog>
