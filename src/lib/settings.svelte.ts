import { browser } from '$app/environment';
import { freqs } from '$lib/freqs';

export enum Scales {
	Chromatic = 'Chromatic',
	Pentatonic = 'Pentatonic',
	Major = 'Major',
	Minor = 'Minor',
	Blues = 'Blues'
}

export enum Instruments {
	Theremin = 'Theremin',
	Synth = 'Synth'
}

enum UserSettingsKeys {
	username = 'username',
	instrument = 'instrument'
}

enum ThereminSettingsKeys {
	minFreq = 'minFreq',
	maxFreq = 'maxFreq'
}

enum SynthSettingsKeys {
	rootNote = 'rootNote',
	rootOctave = 'rootOctave',
	scale = 'scale',
	numKeys = 'numKeys'
}

function getSetting(key: string) {
	return browser ? localStorage.getItem(key) : undefined;
}

export const userSettings = $state({
	[UserSettingsKeys.username]: getSetting('user_' + UserSettingsKeys.username) || '',
	[UserSettingsKeys.instrument]:
		getSetting('user_' + UserSettingsKeys.instrument) || Instruments.Theremin
});

export const thereminSettings = $state({
	[ThereminSettingsKeys.minFreq]: parseFloat(
		getSetting('theremin_' + ThereminSettingsKeys.minFreq) || freqs['C'][0].toString()
	),
	[ThereminSettingsKeys.maxFreq]: parseFloat(
		getSetting('theremin_' + ThereminSettingsKeys.maxFreq) || freqs['B'][4].toString()
	)
});

export const synthSettings = $state({
	[SynthSettingsKeys.rootNote]: getSetting('synth_' + SynthSettingsKeys.rootNote) || 'C',
	[SynthSettingsKeys.rootOctave]: parseInt(
		getSetting('synth_' + SynthSettingsKeys.rootOctave) || '3'
	),
	[SynthSettingsKeys.scale]: getSetting('synth_' + SynthSettingsKeys.scale) || Scales.Pentatonic,
	[SynthSettingsKeys.numKeys]: parseInt(getSetting('synth_' + SynthSettingsKeys.numKeys) || '10')
});

const destroy = $effect.root(() => {
	$effect(() => {
		for (const key in UserSettingsKeys) {
			const lsKey = 'user_' + key;
			if (userSettings[key] !== localStorage.getItem(lsKey)) {
				localStorage.setItem(lsKey, userSettings[key]);
			}
		}
	});

	$effect(() => {
		for (const key in SynthSettingsKeys) {
			const lsKey = 'synth_' + key;
			if (synthSettings[key].toString !== localStorage.getItem(lsKey)) {
				localStorage.setItem(lsKey, synthSettings[key]);
			}
		}
	});

	$effect(() => {
		for (const key in ThereminSettingsKeys) {
			const lsKey = 'theremin_' + key;
			if (thereminSettings[key].toString !== localStorage.getItem(lsKey)) {
				localStorage.setItem(lsKey, thereminSettings[key]);
			}
		}
	});

	return () => {};
});
