const millisecondsInThirtyDays = 1000 * 60 * 60 * 24 * 30;

export default function doLocalStorageHousekeeping() {
	try {
		const now = new Date().getTime();
		const cutoff = now - millisecondsInThirtyDays;
		const keys = Object.keys(localStorage).toSorted();
		keys.forEach(key => {
			const [date] = key.match(/^(\d{4}-\d{2}-\d{2})/) || [];
			if (date) {
				const then = new Date(date).getTime();
				if (then < cutoff) {
					localStorage.removeItem(key);
					console.log('Removed stale localStorage entry', key);
				}
			}
		});
	} catch (e) {
		console.error('Failed to do localStorage housekeeping', e);
	}
}
