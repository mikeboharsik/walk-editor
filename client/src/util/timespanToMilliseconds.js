export default function timespanToMilliseconds(timespan) {
	try {
		const [hours, minutes, seconds, milliseconds] = timespan.match(/(\d{2}):(\d{2}):(\d{2})\.*(\d{3})*/).slice(1).map(e => parseInt(e ?? 0));
		return (hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
	} catch {
		return null;
	}
}
