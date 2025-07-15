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
	"ONTARIO",
	"QUEBEC",
	"?",
];

function PlateStateInput({ backupEvents, defaultValue = 'MA' }) {
	return <select onChange={() => backupEvents()} defaultValue={defaultValue} className="plate-state">{states.map(e => <option key={e} value={e}>{e}</option>)}</select>;
}

export default function PlateInputs({ backupEvents, plates }) {
	const [newPlates, setNewPlates] = useState([]);

	if (plates?.length || newPlates.length) {
		return (
			<div>
				{(plates || []).concat(newPlates).map((e, idx, arr) => (
					<div key={e + idx} className="plate">
						<PlateStateInput backupEvents={backupEvents} defaultValue={e[0]} />
						<input onChange={() => backupEvents()}className="plate-value" type="text" defaultValue={e[1]}></input>
						{idx === arr.length - 1 && <span style={{ cursor: 'pointer' }} onClick={() => setNewPlates(e => [...e, ''])}>{'+'}</span>}
					</div>
				))}
			</div>
		);
	}
	return <div>No plates <span onClick={() => setNewPlates(e => [...e, ''])}>{'+'}</span></div>;
}