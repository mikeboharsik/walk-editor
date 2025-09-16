export default function millisecondsToTimespan(ms) {
	try {
		if (!ms) return null;
		const totalHours = ms / 1000 / 60 / 60;
		const hours = Math.floor(totalHours).toString().padStart(2, '0');
		const totalMinutes = ms / 1000 / 60;
		const minutes = (Math.floor(totalMinutes) % 60).toString().padStart(2, '0');
		const seconds = (Math.floor(ms / 1000) % 60).toString().padStart(2, '0');
		const milliseconds = (ms % 1000).toString().padStart(3, '0');
		return `${ms < 0 ? '-' : ''}${hours}:${minutes}:${seconds}.${milliseconds}`;
	} catch {
		return null;
	}
}