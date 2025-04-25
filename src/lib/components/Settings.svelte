<script lang="ts">
	import Username from '$lib/components/Username.svelte';
	import { userSettings } from '$lib/settings.svelte';

	let dialog = $state<HTMLDialogElement>();
	let showModal = $state(false);

	$effect(() => {
		showModal ? dialog.showModal() : dialog.close();
	});
</script>

<button
	class="grid place-content-center p-2"
	onclick={() => (showModal = true)}
	aria-label="Settings"
>
	<span class="icon-[meteor-icons--gear] text-lg"></span>
</button>

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
			<p class="mt-3 mr-3">Username:</p>
			<Username bind:value={userSettings.username} />
		</div>
	</div>
	<button class="text-left" onclick={() => (showModal = false)}>Done</button>
</dialog>
