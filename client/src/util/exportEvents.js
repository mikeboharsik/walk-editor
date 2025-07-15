import { baseUrl } from './consts';

import getAllEvents from './getAllEvents';

async function sendUpdatedEvents(year, month, day, walkIdx, body) {
	return await fetch(`${baseUrl}/date/${year}-${month}-${day}/${walkIdx}/events`, { method: 'put', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

export default async function exportEvents(ev, year, month, day, walkIdx) {
	const updatedEvents = getAllEvents();

	const invalidEvents = [];
	updatedEvents.forEach((ev, idx) => {
		const { name, plates, skip, trimmedStart, trimmedEnd } = ev;

		if (name?.toUpperCase() === 'DELETE') return;

		if (!skip && trimmedStart && trimmedEnd && trimmedStart >= trimmedEnd) {
			invalidEvents.push([idx, 'trimmedStart is greater than or equal to trimmedEnd']);
		} else if (plates?.some(([state, val]) => state && !val)) {
			invalidEvents.push([idx, 'missing plate']);
		}
	});
	if (invalidEvents.length > 0) {
		alert(`Invalid events detected, failed to save: ${JSON.stringify(invalidEvents, null, '  ')}`);
		return;
	}

	if (ev.ctrlKey) {
		console.log(JSON.stringify(updatedEvents, null, '  '));
	} else {
		try {
			await sendUpdatedEvents(year, month, day, walkIdx, updatedEvents);
			alert(`Updated ${year}-${month}-${day} walk ${walkIdx}`);
		} catch (e) {
			alert(`Failed to update ${year}-${month}-${day} walk ${walkIdx}`);
		}
	}
}