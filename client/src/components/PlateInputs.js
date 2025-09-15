import { useState } from 'react';

const states = [
	"AL",
	"AK",
	"AZ",
	"AR",
	"CA",
	"CO",
	"CT",
	"DE",
	"FL",
	"GA",
	"HI",
	"ID",
	"IL",
	"IN",
	"IA",
	"KS",
	"KY",
	"LA",
	"ME",
	"MD",
	"MA",
	"MI",
	"MN",
	"MS",
	"MO",
	"MT",
	"NE",
	"NV",
	"NH",
	"NJ",
	"NM",
	"NY",
	"NC",
	"ND",
	"OH",
	"OK",
	"OR",
	"PA",
	"RI",
	"SC",
	"SD",
	"TN",
	"TX",
	"UT",
	"VT",
	"VA",
	"WA",
	"WV",
	"WI",
	"WY",
	"DC",
	"AS",
	"GU",
	"MP",
	"PR",
	"UM",
	"VI",
	"ON",
	"QU",
	"?",
];

function PlateStateInput({ backupEvents, defaultValue = 'MA', eventId, idx, onPlateStateUpdate }) {
	return (
		<select
			className="plate-state"
			defaultValue={defaultValue}
			onChange={onPlateStateUpdate}
			id={`${eventId}-plates-${idx}`}
		>
			{states.map(e => <option key={e} value={e}>{e}</option>)}
		</select>
	);
}

function internalToFinal(arr) {
	return arr.map(({ state, value}) => [state, value]);
}

export default function PlateInputs({ backupEvents, eventId, plates, onPlateUpdate }) {
	const [updatedPlates, setUpdatedPlates] = useState(plates?.map(([state, value]) => ({ state, value, id: crypto.randomUUID() })) || []);

	if (updatedPlates.length) {
		return (
			<div>
				{updatedPlates.map((e, idx, arr) => (
					<div key={e.id}>
						<div style={{ display: 'flex', flexDirection: 'row' }} className="plate">
							<PlateStateInput
								backupEvents={backupEvents}
								defaultValue={e.state}
								eventId={eventId}
								idx={idx}
								onPlateStateUpdate={(ev) => setUpdatedPlates(p => {
									p[idx].state = ev.target.value;
									const updated = [...p];
									onPlateUpdate(internalToFinal(updated));
									return updated;
								})}
							/>
							<input
								style={{ width: '100%' }}
								onChange={(ev) => {
									setUpdatedPlates(p => {
										p[idx].value = ev.target.value;
										const updated = [...p];
										onPlateUpdate(internalToFinal(updated));
										return updated;
									});
								}}
								className="plate-value"
								type="text"
								defaultValue={e.value}
							>
							</input>
							<button onClick={() => {
								setUpdatedPlates(p => {
									const shortened = p.toSpliced(idx, 1);
									onPlateUpdate(internalToFinal(shortened));
									return shortened;
								});
							}}>
								X
							</button>
						</div>
						<div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5em' }}>
							{idx === arr.length - 1 && <span style={{ cursor: 'pointer' }} onClick={() => setUpdatedPlates(e => { const updated = [...e, { state: 'MA', value: '' }]; onPlateUpdate(internalToFinal(updated)); return updated; })}>{'+'}</span>}
						</div>
					</div>
				))}
			</div>
		);
	}
	return <div>No plates <span onClick={() => setUpdatedPlates(e => { const updated = [...e, { state: 'MA',  value: '' }]; onPlateUpdate(internalToFinal(updated)); return updated; })}>{'+'}</span></div>;
}