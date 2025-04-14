<script lang="ts">
	import Drum from './Drum.svelte';

	const { makeSound } = $props();
</script>

<div>Hello world</div>
<Drum hitme={() => makeSound()} />
