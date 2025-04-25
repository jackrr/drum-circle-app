<script lang="ts">
	let { choice = $bindable(), choices } = $props();
</script>

{#each choices as c}
	<div class="mr-2">
		<div>{c}</div>
		<input type="radio" bind:group={choice} value={c} />
	</div>
{/each}
