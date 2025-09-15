import { baseUrl } from './consts';

export const dateWalksPrefix = 'walksForDate-{{date}}';

export default async function initializeWalkData({ year, month, day, setWalks }) {
	const ymd = `${year}-${month}-${day}`;
	const keyForDate = dateWalksPrefix.replace('{{date}}', ymd);
	const storageWalks = localStorage.getItem(keyForDate);

	if (storageWalks) {
		setWalks(JSON.parse(storageWalks));
		console.log('Restored walks from localStorage');
	} else {
		await fetch(`${baseUrl}/date/${ymd}`, { headers: { 'cache-control': 'no-cache' } })
			.then(r => r.json())
			.then(r => { setWalks(r); localStorage.setItem(keyForDate, JSON.stringify(r)); console.log('Loaded walks from API'); })
			.catch((e) => {
				console.error(e);
				window.alert(`Failed to load walks for ${ymd}`);
			});
	}
}