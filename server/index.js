const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 8089;

const metaArchivePath = path.resolve(`${__dirname}/../../../walk-routes/meta_archive`);

const getFilePathFromDate = (date) => {
	const [year, month, day] = date.split('-');
	return path.resolve(`${metaArchivePath}/${year}/${month}/${day}.json`);
};

const getFile = (date) => {
	const path = getFilePathFromDate(date);
	return fs.readFileSync(path, 'utf8');
}

const setEvents = (date, walk, newEvents) => {
	const path = getFilePathFromDate(date);
	const allWalks = JSON.parse(getFile(date));
	const updatedWalk = allWalks[walk];
	updatedWalk.events = newEvents;
	fs.writeFileSync(path, JSON.stringify(allWalks, null, '  '));
}

const getAllDates = () => {
	const allDates = [];

	const yearDirs = fs.readdirSync(metaArchivePath)
		.filter(d => d.match(/\d{4}/));
	
	yearDirs.forEach((dir) => {
		allDates.push(
			...fs.readdirSync(`${metaArchivePath}/${dir}`, { recursive: true })
				.filter(e => e.match(/\d{2}.json/))
				.map(e => `${dir}/${e.replace(/\\/g, '/').replace('.json', '')}`.replace(/\//g, '-')));
	});

	return allDates.reduce((acc, cur) => {
		const [year, month, day] = cur.split('-');

		if (acc[year]) {
			if (acc[year][month]) {
				acc[year][month].push(day);
			} else {
				acc[year][month] =  [day];
			}
		} else {
			acc[year] = {};
			if (acc[year][month]) {
				acc[year][month].push(day);
			} else {
				acc[year][month] = [day];
			}
		}

		return acc;
	}, {});
}

app.use(express.json());

app.use((req, res, next) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Headers', '*');
	res.set('Access-Control-Allow-Methods', '*');
	next();
});

app.get('/dates', (req, res) => {
	res.json(getAllDates());
});

app.get('/date/:date', (req, res) => {
	const { date } = req.params;
	res.json(getFile(date));
});

app.put('/date/:date/:walk/events', (req, res) => {
	const { date, walk } = req.params;
	const updatedEvents = req.body;
	setEvents(date, walk, updatedEvents);
	res.send('OK');
});

app.listen(port, () => {
	console.log(`Editor backend listening on port ${port}`);
});

console.log('wtf');