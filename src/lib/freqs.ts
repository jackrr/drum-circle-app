const divMod = (num: number, denom: number): [quotient: number, remainder: number] => {
	return [Math.floor(num / denom), num % denom];
};

export enum Scale {
	Chromatic = 'Chromatic',
	Pentatonic = 'Pentatonic',
	Major = 'Major',
	Minor = 'Minor',
	Dominant = 'Dominant',
	MajBlues = 'MajBlues',
	MinBlues = 'MinBlues'
}

export const scaleNames = Object.values(Scale);

export enum NoteName {
	C = 'C',
	CSharp = 'C#',
	D = 'D',
	DSharp = 'D#',
	E = 'E',
	F = 'F',
	FSharp = 'F#',
	G = 'G',
	GSharp = 'G#',
	A = 'A',
	ASharp = 'A#',
	B = 'B'
}

export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const noteNames = Object.values(NoteName);

const scaleIntervals = {
	[Scale.Chromatic]: [...Array(12).keys()],
	// 1, 2, 3f, 3, 5, 6
	[Scale.MajBlues]: [0, 2, 3, 4, 7, 9],
	// 1, 3f, 4, 5f, 5, 7f
	[Scale.MinBlues]: [0, 3, 5, 6, 7, 10],
	// 1, 2, 3, 5, 6
	[Scale.Pentatonic]: [0, 2, 4, 7, 9],
	// 1, 2, 3, 4, 5, 6, 7
	[Scale.Major]: [0, 2, 4, 6, 7, 9, 11],
	// 1, 2, 3, 4, 5, 6, 7f
	[Scale.Dominant]: [0, 2, 4, 6, 7, 9, 10],
	// 1, 2, 3f, 4, 5, 6, 7f
	[Scale.Minor]: [0, 2, 3, 6, 7, 9, 10]
};

export const generateScale = (
	currentNote: Note,
	scale: Scale,
	length: number,
	step: number = 0
): Note[] => {
	if (length === 0) return [];

	const scaleInterval = scaleIntervals[scale];
	const nextStep = (step + 1) % scaleInterval.length;
	const scaleStep = scaleInterval[nextStep];
	let interval = 0;
	if (scaleStep === 0) {
		// gap between root of next octave of scale and last step
		interval = 12 - scaleInterval[scaleInterval.length - 1];
	} else {
		// gap between next and previous steps
		interval = scaleStep - scaleInterval[step];
	}

	const nextNote = Note.fromInterval(currentNote, interval);

	return [currentNote, ...generateScale(nextNote, scale, length - 1, nextStep)];
};

export class Note {
	freq: number;
	octave: Octave;
	name: NoteName;

	constructor(name: NoteName, octave: Octave) {
		this.octave = octave;
		this.name = name;
		this.freq = absFreqs[this.toAbsolute()];
	}

	toAbsolute() {
		return this.octave * 12 + noteNames.indexOf(this.name);
	}

	static fromAbsolute(absNote: number) {
		const [octave, noteIdx] = divMod(absNote, 12);
		return new Note(noteNames[noteIdx], octave as Octave);
	}

	static fromInterval(note: Note, interval: number) {
		return Note.fromAbsolute(note.toAbsolute() + interval);
	}

	label() {
		return `${this.name}${this.octave}`;
	}
}

// C0 -> B8
const absFreqs = [
	16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87, 32.7, 34.65,
	36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74, 65.41, 69.3, 73.42, 77.78, 82.41,
	87.31, 92.5, 98, 103.83, 110, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185,
	196, 207.65, 220, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392,
	415.3, 440, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99,
	830.61, 880, 932.33, 987.77, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98,
	1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83,
	2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01, 4434.92, 4698.63, 4978.03, 5274.04,
	5587.65, 5919.91, 6271.93, 6644.88, 7040, 7458.62, 7902.13
];
