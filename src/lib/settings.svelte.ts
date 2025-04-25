import { browser } from '$app/environment';
import { freqs } from '$lib/freqs';

export enum Instruments {
	Theremin = 'Theremin'
}

enum UserSettingsKeys {
	username = 'username',
	instrument = 'instrument'
}

enum ThereminSettingsKeys {
	minFreq = 'minFreq',
	maxFreq = 'maxFreq'
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
		for (const key in ThereminSettingsKeys) {
			console.log({ thereminSettings, key });
			const lsKey = 'theremin_' + key;
			if (thereminSettings[key].toString !== localStorage.getItem(lsKey)) {
				localStorage.setItem(lsKey, thereminSettings[key]);
			}
		}
	});

	return () => {};
});
