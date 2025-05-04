<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { children } = $props();

	function preventPinchZoom(e: TouchEvent) {
		// TODO: This doesn't work on iOS
		if (e.scale !== 1) {
			e.preventDefault();
		}
	}

	let lastTouchEnd = $state(new Date().getTime());

	function preventDblTapZoom(e: TouchEvent) {
		var now = new Date().getTime();
		if (now - lastTouchEnd <= 300) {
			e.preventDefault();
		}
		lastTouchEnd = now;
	}

	onMount(() => {
		document.addEventListener('touchmove', preventPinchZoom, { passive: false });
		document.addEventListener('touchend', preventDblTapZoom, { passive: false });
	});

	onDestroy(() => {
		if (!browser) return;

		document.removeEventListener('touchmove', preventPinchZoom);
		document.removeEventListener('touchend', preventDblTapZoom);
	});
</script>

<div class="bg-gr-200 p-safe flex h-full w-full flex-col">
	<div class="flex-grow">
		{@render children()}
	</div>
</div>
