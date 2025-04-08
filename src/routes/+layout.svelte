<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="h-100 ">
	{@render children()}
</div>
