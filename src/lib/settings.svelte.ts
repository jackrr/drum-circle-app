import { browser } from '$app/environment';

export enum Instruments {
	Theremin = 'Theremin'
}

export const userSettings = $state({
	username: (browser && localStorage.getItem('username')) || '',
	instrument: Instruments.Theremin
});

export const thereminSettings = $state({});

const destroy = $effect.root(() => {
	$effect(() => {
		if (userSettings.username !== localStorage.getItem('username')) {
			localStorage.setItem('username', userSettings.username);
		}
	});

	return () => {};
});
