<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { children } = $props();

	function preventPinchZoom(e: GestureEvent) {
		e.preventDefault();
		// special hack to prevent zoom-to-tabs gesture in safari
		document.body.style.zoom = 0.99;
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
		document.addEventListener('gesturestart', preventPinchZoom, { passive: false });
		document.addEventListener('gesturechange', preventPinchZoom, { passive: false });
		document.addEventListener('gestureend', preventPinchZoom, { passive: false });
		document.addEventListener('touchend', preventDblTapZoom, { passive: false });
	});

	onDestroy(() => {
		if (!browser) return;

		document.removeEventListener('gesturestart', preventPinchZoom);
		document.removeEventListener('gesturechange', preventPinchZoom);
		document.removeEventListener('gestureend', preventPinchZoom);
		document.removeEventListener('touchend', preventDblTapZoom);
	});
</script>

<div class="bg-gr-200 p-safe flex h-full w-full flex-col">
	<div class="flex-grow">
		{@render children()}
	</div>
</div>
