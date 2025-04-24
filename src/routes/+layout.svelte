<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="h-screen w-screen flex flex-col">
	<!-- ...mobile hack... -->
	<div style="height: 44px;"></div>
	<div class="flex-grow">
		{@render children()}
	</div>
</div>
