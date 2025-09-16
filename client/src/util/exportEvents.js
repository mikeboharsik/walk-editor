import { baseUrl } from './consts';

async function sendUpdatedEvents(year, month, day, walkIdx, body) {
	return await fetch(`${baseUrl}/date/${year}-${month}-${day}/${walkIdx}/events`, { method: 'put', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

export default async function exportEvents(ev, year, month, day, walkIdx, updatedEvents) {
	const eventsForExport = JSON.parse(JSON.stringify(updatedEvents));
	eventsForExport.forEach(e => {
		Object.entries(e).forEach(([key, val]) => {
			if (val === '' && !val) {
				delete e[key];
			}
		});
	});

	if (ev.ctrlKey) {
		console.log(JSON.stringify(eventsForExport, null, '  '));
	} else {
		try {
			await sendUpdatedEvents(year, month, day, walkIdx, eventsForExport);
		} catch (e) {
			alert(`Failed to update ${year}-${month}-${day} walk ${walkIdx}`);
			return false;
		}
	}
	return true;
}