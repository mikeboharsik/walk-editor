import { useCallback, useState } from 'react';

import PlateInputs from './PlateInputs';
import VideoPreview from './VideoPreview';

import currentTimeToTimestamp from '../util/currentTimeToTimestamp';
import timestampToCurrentTime from '../util/timestampToCurrentTime';

import backupEvents from '../util/backupEvents';
import exportEvents from '../util/exportEvents';

function handleTrimmedStartClick(e) {
	const player = document.querySelector('#wip-video');
	if (player) {
		const newTime = timestampToCurrentTime(e.target.value);
		if (e.ctrlKey) {
			player.currentTime = newTime - 10; // assume it's off by 10 seconds
		}
		if (e.altKey) {
			player.currentTime = newTime;
		}
	}
}

function TagInputs({ tags }) {
	const [newTags, setNewTags] = useState([]);
	if (tags?.length || newTags.length) {
		return (
			<div>
				{(tags || []).concat(newTags).map((e, idx, arr) => (
					<div className="tag">
						<input key={e} onChange={() => backupEvents()} className="tag-value" type="text" defaultValue={e}></input>
						{idx === arr.length - 1 && <span onClick={() => setNewTags(e => [...e, ''])}>{'+'}</span>}
					</div>
				))}
			</div>
		);
	}
}

export default function EventInputs({ year, month, day, walks, walkIdx, revert, loadWalkData, updateWalks, setSelectedWalk }) {
  const addEvent = useCallback((walkIdx, eventIdx, before) => {
    const player = document.querySelector('#wip-video');
    if (!player) {
      alert('Load a video first!');
      return;
    }
    const currentVideoTime = currentTimeToTimestamp(player.currentTime);
    const walk = walks[walkIdx];
    const newEvent = { id: crypto.randomUUID(), trimmedStart: currentVideoTime, plates: [], coords: undefined };
    if (walk.events.length === 0) {
      walk.events = [];
    }
    if (before) {
      walk.events = walk.events.toSpliced(eventIdx, 0, newEvent);
    } else {
      walk.events = walk.events.toSpliced(eventIdx + 1, 0, newEvent);
    }
    updateWalks([...walks]);
  }, [updateWalks, walks]);

  const deleteEvent = useCallback((walkIdx, eventIdx) => {
    const walk = walks[walkIdx];
    walk.events = walk.events.toSpliced(eventIdx, 1);
    updateWalks([...walks]);
  }, [updateWalks, walks]);

  const detectDelete = useCallback((e, walkIdx, eventIdx) => {
    if (e.target.value.toUpperCase() === 'DELETE') {
      deleteEvent(walkIdx, eventIdx);
    }
  }, [deleteEvent]);

  if (year && month && day && walks) {
    const { events } = walks[walkIdx];
    return (
      <div style={{ display: 'flex', width: '100%' }}>
        <div style={{ width: '80%' }}>
          <VideoPreview revert={revert} />
        </div>
        <div style={{ width: '20%', borderLeft: '1px solid gray', height: '100vh', overflow: 'scroll' }}>
          <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
            {(walks?.length > 1 && walks.map((_, idx) => (
              <span
                key={_.events?.at(0)?.id}
                style={idx === walkIdx ? { fontWeight: 'bold' } : { cursor: 'pointer' }}
                onClick={() => setSelectedWalk(idx)}
              >
                {idx}
              </span>
            ))) || null}
          </div>
          <div id="eventInputs" style={{ width: '100%' }}>
            {!events.length && <div style={{ textAlign: 'center', margin: '1em 0' }}>
              <button onClick={() => addEvent(walkIdx, 0, false)}>Add event</button>
            </div>}
            {(events.length && events.map((e, idx) => (
              <div
                className="event"
                style={{ textAlign: 'left', fontSize: '18px', padding: '0 1em' }}
                key={e.id}
              >
                <div title={`Mark: ${e.mark}`}>
                  Trimmed start:
                  <input
                    onClick={handleTrimmedStartClick}
                    onChange={() => backupEvents()}
                    className="trimmedStart"
                    style={{ textAlign: 'center', width: '6.2em' }}
                    type="text"
                    defaultValue={e.trimmedStart}
                  ></input>
                </div>

                <div title={`${idx} - ${e.id}`}>
                  <span onClick={() => { window.open(`https://www.google.com/maps/place/${e.coords[0]},${e.coords[1]}`, '_blank') }}>
                    Name:
                  </span>
                  <input disabled={e.tags} onChange={(e) => { detectDelete(e, walkIdx, idx); backupEvents(); }} className="name" type="text" defaultValue={e.name}></input>
                </div>

                <div>
                  Trimmed end: <input className="trimmedEnd" onChange={() => backupEvents()} style={{ textAlign: 'center', width: '6.2em' }} type="text" defaultValue={e.trimmedEnd}></input>
                </div>

                <div>
                  <input className="coords" type="hidden" defaultValue={e.coords}></input>
                </div>

                <div>
                  <input className="mark" type="hidden" defaultValue={e.mark}></input>
                </div>

                <div>
                  <input className="id" type="hidden" defaultValue={e.id}></input>
                </div>

                <div>
                  <PlateInputs backupEvents={backupEvents} plates={((!e.tags || e.tags.length === 0) && e.plates) || []} />
                </div>

                <div>
                  Skip: <input className="skip" type="checkbox" onChange={() => backupEvents()} defaultChecked={e.skip === true}></input>
                  Resi: <input className="resi" type="checkbox" onChange={() => backupEvents()} defaultChecked={e.resi === true}></input>
                </div>

                <div>
                  <TagInputs backupEvents={backupEvents} tags={e.tags} />
                </div>
                
                <div style={{ textAlign: 'center', margin: '1em 0' }}>
                  <button onClick={() => addEvent(walkIdx, idx, false)}>Add event</button>
                </div>
              </div>
            ))) || null}
            {events.length ? <button onClick={async (ev) => {
              const success = await exportEvents(ev, year, month, day, walkIdx);
              if (success) window.location.reload();
            }}>Submit</button> : null}
          </div>
        </div>
      </div>
    );
  }

  return null;
}