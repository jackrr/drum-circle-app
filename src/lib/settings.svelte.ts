import { browser } from '$app/environment';

export const userSettings = $state({
	username: (browser && localStorage.getItem('username')) || ''
});

export const synthSettings = $state({});

const destroy = $effect.root(() => {
	$effect(() => {
		if (userSettings.username !== localStorage.getItem('username')) {
			localStorage.setItem('username', userSettings.username);
		}
	});

	return () => {};
});
