export default function getInterpolatedCoordinatesFromTime(allCoords, newCoordTime) {
	const coordsReversed = allCoords.toReversed();
	const coordBefore = coordsReversed.find(c => c.time < newCoordTime);
	const coordAfter = allCoords.find(c => c.time > newCoordTime);

	const newCoordTimeOffsetFromBefore = newCoordTime - coordBefore.time;
	const totalTime = (coordAfter.time - coordBefore.time);
	const timeRatio = newCoordTimeOffsetFromBefore / totalTime;

	const interpolatedLat = parseFloat((coordBefore.lat + ((coordAfter.lat - coordBefore.lat) * timeRatio)).toFixed(6));
	const interpolatedLon = parseFloat((coordBefore.lon + ((coordAfter.lon - coordBefore.lon) * timeRatio)).toFixed(6));

	return [interpolatedLat, interpolatedLon];
}