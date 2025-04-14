export type Sound = {
	type: OscillatorType;
	freq: number;
};

const defaultSound = {
	type: 'sine',
	freq: 440.0
};

export function serializableSound(payload: Partial<Sound> = {}) {
	return {
		...defaultSound,
		...payload
	};
}

export class SoundMachine {
	audioContext: AudioContext;

	constructor() {
		this.audioContext = new AudioContext();
	}

	playSound(sound: Sound) {
		console.log(sound);
		const osc = this.audioContext.createOscillator();

		osc.type = sound.type;
		osc.frequency.value = sound.freq;
		osc.connect(this.audioContext.destination);
		osc.start();

		setTimeout(() => osc.stop(), 200);
	}
}
