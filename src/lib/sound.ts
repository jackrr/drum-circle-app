import type { DrumCircle } from './peerpool';

type Sound = {
	test: string;
	freq: number;
};

export class SoundMachine {
	audioContext: AudioContext;

	constructor() {
		this.audioContext = new AudioContext();
	}

	private playDrumSound(sound: Sound) {
		console.log('making sound');

		const osc = this.audioContext.createOscillator();
		osc.type = 'square';
		osc.connect(this.audioContext.destination);
		osc.start();

		setTimeout(() => osc.stop(), 200);
	}

	playDrum(drumCircle: DrumCircle) {
		const sound = { test: 'a sound!', freq: 440.0 };
		this.playDrumSound(sound);
		drumCircle.broadcastSoundPayload({
			...sound,
			freq: sound.freq + Math.random() * 440
		});
	}

	handleRemoteSound(sound: Sound) {
		console.log('got sound', sound);
		this.playDrumSound(sound);
	}
}
