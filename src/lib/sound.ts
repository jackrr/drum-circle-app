type Sound = {
	id: number;
	osc: OscillatorNode;
	gain: GainNode;
	timeoutId?: number;
};

export type PlaySoundEvent = {
	soundId?: number; // For updates
	remote?: boolean; // If remote, make terminating
	freq: number;
	gain: number;
};

const DEFAULT_TIMEOUT = 10 * 1000; // Kill sound after 10s without update

export class SoundMachine {
	audioContext: AudioContext;
	curSoundId: number;
	activeSounds: Sound[];

	constructor() {
		this.audioContext = new AudioContext();
		this.curSoundId = 1;
		this.activeSounds = [];
	}

	private getSound(id: number) {
		const sound = this.activeSounds.find((s) => s.id === id);

		if (!sound) throw new Error(`No sound with id ${id}`);

		return sound;
	}

	private debounceCancellation(soundId: number) {
		this.activeSounds = this.activeSounds.map((s) => {
			if (s.id === soundId) {
				if (s.timeoutId) clearTimeout(s.timeoutId);

				const timeoutId = setTimeout(() => {
					console.warn('Hit timeout on sound', s.id);
					this.stopSound(s.id);
				}, DEFAULT_TIMEOUT);
				return {
					...s,
					timeoutId
				};
			} else {
				return s;
			}
		});
	}

	playSound(event: PlaySoundEvent) {
		let sound;
		if (event.soundId) {
			console.log('updating sound');
			try {
				sound = this.getSound(event.soundId);
				sound.osc.frequency.value = event.freq;
				sound.gain.gain.value = event.gain;
			} catch (e) {
				console.warn(e);
			}
		}

		// It's possible that the sound was debounce-canceled, or the
		// original create payload was dropped on network. If so, just
		// make one from the update payload
		if (!sound) {
			console.log('making sound');
			sound = this.createSound(event);
			this.activeSounds.push(sound);
		}

		// "Debounce" remote sound stopping on create+update
		if (event.remote) {
			this.debounceCancellation(sound.id);
		}

		return sound.id;
	}

	stopSound(soundId: number) {
		const sound = this.getSound(soundId);
		sound.osc.stop();
		this.activeSounds = this.activeSounds.filter((s) => s.id !== soundId);

		if (sound.timeoutId) clearTimeout(sound.timeoutId);
	}

	createSound(soundEvent: PlaySoundEvent) {
		const osc = this.audioContext.createOscillator();
		const gain = this.audioContext.createGain();

		// osc.type = soundEvent.oscillatorType || 'sine';
		gain.gain.value = soundEvent.gain || 1.0;
		osc.frequency.value = soundEvent.freq || 440.0;

		osc.connect(gain);
		gain.connect(this.audioContext.destination);
		osc.start();

		return {
			osc,
			gain,
			id: this.curSoundId++
		};
	}
}
