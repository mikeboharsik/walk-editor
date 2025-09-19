import { baseUrl } from './consts';

export const dateWalksPrefix = 'walksForDate-{{date}}';

export default async function getWalkData(year, month, day) {
	const ymd = `${year}-${month}-${day}`;
	const keyForDate = dateWalksPrefix.replace('{{date}}', ymd);
	const storageWalks = localStorage.getItem(keyForDate);

	if (storageWalks) {
		console.log('Restored walks from localStorage');
		return JSON.parse(storageWalks);
	} else {
		return fetch(`${baseUrl}/date/${ymd}`, { headers: { 'cache-control': 'no-cache' } })
			.then(r => r.json())
			.then(r => {
				console.log('Loaded walks from API');
				return r;
			})
			.catch((e) => {
				console.error(e);
				window.alert(`Failed to load walks for ${ymd}`);
			});
	}
}