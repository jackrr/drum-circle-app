<script lang="ts">
	import { onMount } from 'svelte';
	import { initialize } from '$lib/peerpool';

	onMount(() => {
		initialize('127.0.0.1:8080');
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
