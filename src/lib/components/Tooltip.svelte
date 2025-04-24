<script lang="ts">
	const { x, y, children, parentWidth, parentHeight } = $props();
	let position = $derived.by(() => {
		let vert, horiz;
		if (x > parentWidth / 2) {
			horiz = 'right: 10px';
		} else {
			horiz = 'left: 10px';
		}

		if (y > parentHeight / 2) {
			vert = 'bottom: 10px';
		} else {
			vert = 'top: 10px';
		}
		return `${horiz}; ${vert}`;
	});

	console.log({ position, x, y });
</script>

<div style="left: {x}px; top: {y}px;" class="fixed">
	<div style={position} class="absolute">
		{@render children()}
	</div>
</div>
