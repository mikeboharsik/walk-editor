import { baseUrl } from './consts';

async function sendUpdatedEvents(year, month, day, walkIdx, body) {
	return await fetch(`${baseUrl}/date/${year}-${month}-${day}/${walkIdx}/events`, { method: 'put', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

export default async function exportEvents(ev, year, month, day, walkIdx, updatedEvents) {
	if (ev.ctrlKey) {
		console.log(JSON.stringify(updatedEvents, null, '  '));
	} else {
		try {
			await sendUpdatedEvents(year, month, day, walkIdx, updatedEvents);
			alert(`Updated ${year}-${month}-${day} walk ${walkIdx}`);
		} catch (e) {
			alert(`Failed to update ${year}-${month}-${day} walk ${walkIdx}`);
			return false;
		}
	}
	return true;
}