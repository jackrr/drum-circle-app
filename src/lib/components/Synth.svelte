<script lang="ts">
	const { playSound, stopSound } = $props();
	let soundId = $state<number | null>(null);

	function playClick() {
		soundId = playSound({
			soundId,
			freq: 440.0,
			gain: 0.8,
			remote: true
		});
	}

	function stopClick() {
		stopSound(soundId);
		soundId = null;
	}
</script>

<div>
	Synth!
	<button onclick={playClick}>Play</button>
	<button onclick={stopClick}>Stop</button>
</div>
