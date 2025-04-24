export enum EventType {
	Play = 'Play',
	End = 'End'
}

export type PlaySoundEvent = {
	type: EventType.Play;
	soundId: string; // For updates
	freq: number;
	gain: number;
};

export type EndSoundEvent = {
	type: EventType.End;
	soundId: string;
};

export type SoundEvent = PlaySoundEvent | EndSoundEvent;

type Sound = {
	id: string;
	osc: OscillatorNode;
	gain: GainNode;
	timeoutId?: number;
};

const DEFAULT_TIMEOUT = 10 * 1000; // Kill sound after 10s without update

export class SoundMachine {
	audioContext: AudioContext;
	activeSounds: Sound[];
	// remote is true if representing sounds from a device across a
	// network partition
	remote: boolean;
	playing = $state(false);

	constructor(ac: AudioContext, remote: boolean = false) {
		this.audioContext = ac;
		this.activeSounds = [];
		this.remote = remote;
	}

	handleEvent(e: SoundEvent) {
		switch (e.type) {
			case EventType.Play:
				this.playSound(e);
				break;
			case EventType.End:
				this.stopSound(e.soundId);
				break;
			default:
				console.error('Unhandled sound event', e);
		}
	}

	private getSound(id: string) {
		const sound = this.activeSounds.find((s) => s.id === id);

		if (!sound) throw new Error(`No sound with id ${id}`);

		return sound;
	}

	private debounceCancellation(soundId: string) {
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

	private playSound(event: PlaySoundEvent) {
		this.playing = true;
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
		if (this.remote) {
			this.debounceCancellation(sound.id);
		}
	}

	private stopSound(soundId: string) {
		const sound = this.getSound(soundId);
		sound.osc.stop();
		this.activeSounds = this.activeSounds.filter((s) => s.id !== soundId);

		this.playing = this.activeSounds.length !== 0;

		if (sound.timeoutId) clearTimeout(sound.timeoutId);
	}

	private createSound(soundEvent: PlaySoundEvent) {
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
			id: soundEvent.soundId
		};
	}
}
