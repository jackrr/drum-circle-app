export function makeDebounce(debounced: () => void) {
	let timeoutId: number;

	return (delay: number) => {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(debounced, delay);
	};
}
