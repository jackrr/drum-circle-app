import { semitoneDistance } from '$lib/freqs';

export enum Instruments {
	Synth = 'Synth',
	Drums = 'Drums',
	Theremin = 'Theremin',
	Sampler = 'Sampler'
}

export enum EventType {
	Play = 'Play',
	End = 'End',
	Sample = 'Sample'
}

export type PlaySampleEvent = {
	type: EventType.Sample;
	instrument: Instruments.Drums | Instruments.Sampler;
	sample: Sample;
	freq?: number;
};

export type PlaySoundEvent = {
	type: EventType.Play;
	instrument: Instruments.Synth | Instruments.Theremin;
	soundId: string; // For updates
	freq: number;
	gain: number;
};

export type EndSoundEvent = {
	type: EventType.End;
	soundId: string;
};

export type SoundEvent = PlaySoundEvent | EndSoundEvent | PlaySampleEvent;

type SoundComponent = {
	osc: OscillatorNode;
	gain: GainNode;
};

type Sound = {
	id: string;
	components: SoundComponent[];
	timeoutId?: number;
};

const DEFAULT_TIMEOUT = 10 * 1000; // Kill sound after 10s without update

export class SoundMachine {
	audioContext: AudioContext;
	sink: AudioNode;
	activeSounds: Sound[];
	// remote is true if representing sounds from a device across a
	// network partition
	remote: boolean;
	reverbBuffer?: AudioBuffer;
	playing = $state(false);
	sampleBuffers: Partial<Record<Sample, AudioBuffer>>;

	constructor(ac: AudioContext, remote: boolean = false, sink?: AudioNode) {
		this.audioContext = ac;
		this.activeSounds = [];
		this.remote = remote;
		this.sink = sink || this.createDynamicsCompressor();
		this.sampleBuffers = {};
		this.init();
	}

	createDynamicsCompressor() {
		const compressor = this.audioContext.createDynamicsCompressor();
		compressor.connect(this.audioContext.destination);
		return compressor;
	}

	async init() {
		return Promise.all([
			this.setupReverb,
			...Object.values(Sample).map((s) => this.preloadSample(s))
		]);
	}

	async preloadSample(s: Sample) {
		const data = await fetch(`/${sampleToFile(s)}`);
		const buffer = await data.arrayBuffer();
		this.sampleBuffers[s] = await this.audioContext.decodeAudioData(buffer);
	}

	async setupReverb() {
		const result = await fetch('/impulse_rev.wav');
		const arrayBuffer = await result.arrayBuffer();
		this.reverbBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
	}

	teardown() {
		this.activeSounds.map((s) => this.stopSound(s.id));
	}

	handleEvent(e: SoundEvent) {
		switch (e.type) {
			case EventType.Play:
				this.playSound(e);
				break;
			case EventType.End:
				this.stopSound(e.soundId);
				break;
			case EventType.Sample:
				this.playSample(e);
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
			try {
				sound = this.getSound(event.soundId);
				sound.components[0].osc.frequency.value = event.freq;
				sound.components[0].gain.gain.value = event.gain;
			} catch (e) {
				// Expected on first play event
			}
		}

		// It's possible that the sound was debounce-canceled, or the
		// original create payload was dropped on network. If so, just
		// make one from the update payload
		if (!sound) {
			sound = this.createSound(event);
			this.activeSounds.push(sound);
		}

		// "Debounce" remote sound stopping on create+update
		if (this.remote) {
			this.debounceCancellation(sound.id);
		}
	}

	private playSample(event: PlaySampleEvent) {
		const { sample, freq } = event;
		const source = this.audioContext.createBufferSource();
		const buffer = this.sampleBuffers[sample];
		if (!buffer) {
			console.warn('No audio buffer for sample', sample);
			return;
		}

		if (freq) {
			const semitones = semitoneDistance(freq, 440);
			source.playbackRate.value = 2 ** (semitones / 12);
		}

		source.buffer = buffer;
		source.connect(this.sink);

		source.start();
	}

	private stopSound(soundId: string) {
		const sound = this.getSound(soundId);
		sound.components.map((c) => {
			c.osc.stop();
			c.gain.disconnect();
		});
		this.activeSounds = this.activeSounds.filter((s) => s.id !== soundId);

		this.playing = this.activeSounds.length !== 0;

		if (sound.timeoutId) clearTimeout(sound.timeoutId);
	}

	private createSound(soundEvent: PlaySoundEvent) {
		const { instrument, freq = 440, gain = 1.0 } = soundEvent;

		let components: SoundComponent[];

		switch (instrument) {
			case Instruments.Theremin:
				components = [createSoundComponent(this.audioContext, freq, gain, this.sink)];
				break;
			case Instruments.Synth:
				let dest = this.sink;
				if (this.reverbBuffer) {
					const reverb = this.audioContext.createConvolver();
					reverb.buffer = this.reverbBuffer;
					reverb.connect(this.sink);
					dest = reverb;
				}

				components = [
					createSoundComponent(this.audioContext, freq, (gain * 2) / 3, dest),
					createSoundComponent(this.audioContext, freq * 2, gain / 5, dest),
					createSoundComponent(this.audioContext, freq * 3, gain / 7, dest),
					createSoundComponent(this.audioContext, freq * 4, gain / 14, dest)
				];
				break;
		}

		components.map((c) => c.osc.start());

		return {
			components,
			id: soundEvent.soundId
		};
	}
}

function createSoundComponent(ac: AudioContext, freq: number, amp: number, dest: AudioNode) {
	const osc = ac.createOscillator();
	const gain = ac.createGain();

	osc.frequency.value = freq;
	gain.gain.value = amp;

	osc.connect(gain);
	gain.connect(dest);

	return {
		osc,
		gain
	};
}

export enum Sample {
	Bass = 'Bass',
	Snare = 'Snare',
	Clap = 'Clap',
	// TomLo = 'Mid Tom',
	TomHi = 'Tom',
	Ride = 'Ride',
	HatClosed = 'Hat Cl',
	HatOpen = 'Hat Op',
	CrashCym = 'Crash',
	BassPluck = 'B Guit',
	// PenSound = 'pen-sounds',
	// PenGrowl = 'pen-growl'
	PenBark = 'Bark'
}

function sampleToFile(s: Sample) {
	switch (s) {
		case Sample.HatClosed:
			return 'Closed.wav';
		case Sample.HatOpen:
			return 'Open.wav';
		case Sample.TomHi:
			return 'Hi Tom.wav';
		case Sample.BassPluck:
			return 'bass-guitar-pluck.wav';
		case Sample.PenBark:
			return 'pen-bark.wav';
		default:
			return `${s}.wav`;
	}
}
