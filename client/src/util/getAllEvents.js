export default function getAllEvents() {
	return Array.from(document.querySelector('#eventInputs').querySelectorAll('.event'))
		.map(e => {
			const mark = e.querySelector('.mark')?.value || undefined;
			const trimmedStart = e.querySelector('.trimmedStart')?.value || undefined;
			const trimmedEnd = e.querySelector('.trimmedEnd')?.value || undefined;
			const name = e.querySelector('.name')?.value || undefined;
			const coords = e.querySelector('.coords')?.value.split(',').map(e => parseFloat(e)).filter(e => e) || undefined;
			const plates = Array.from(e.querySelectorAll('.plate'))?.map?.(p => ([p.querySelector('.plate-state')?.value, p.querySelector('.plate-value')?.value])).filter(p => !p[1].toUpperCase().endsWith('DELETE')) || undefined;
			const tags = Array.from(e.querySelectorAll('.tag-value'))?.map?.(t => t.value);
			const skip = e.querySelector('.skip')?.checked || undefined;
			const resi = e.querySelector('.resi')?.checked || undefined;
			const id = e.querySelector('.id').value;
			if (name?.toUpperCase().trim() === 'DELETED') {
				return undefined;
			}
			return {
				id,
				mark,
				trimmedStart,
				trimmedEnd,
				name,
				coords: coords.length ? coords : undefined,
				plates: plates.length ? plates : undefined,
				tags: tags.length ? tags : undefined,
				skip,
				resi,
			};
		}).filter(e => e && e.name !== 'DELETE');
}