export default function currentTimeToTimestamp(currentTime) {
	const hours = Math.floor(currentTime / (60 * 60)).toString().padStart(2, 0);
	const minutes = Math.floor((currentTime / 60) % 60).toString().padStart(2, 0);
	const seconds = Math.floor(currentTime % 60).toString().padStart(2, 0);
	const ms = (currentTime % 1).toFixed(3).padEnd(3, 0).replace('0.', '');
	return `${hours}:${minutes}:${seconds}.${ms}`;
}