<script lang="ts">
	const { size } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 200 200"
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
>
	<path
		id="circularPath"
		d="M 100,100 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0"
		fill="none"
		stroke="lightgray"
		stroke-width="0"
	/>
	<text style="font-size: 47px; fill: #2b7fff; font-weight: bold">
		<textPath xlink:href="#circularPath" startOffset="0%"> DRUM CIRCLE </textPath>
	</text>
</svg>
