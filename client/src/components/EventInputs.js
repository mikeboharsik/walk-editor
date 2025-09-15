import { useCallback, useEffect, useState } from 'react';

import PlateInputs from './PlateInputs';
import VideoPreview from './VideoPreview';

import currentTimeToTimestamp from '../util/currentTimeToTimestamp';
import timestampToCurrentTime from '../util/timestampToCurrentTime';
import timespanToMilliseconds from '../util/timespanToMilliseconds';
import millisecondsToTimespan from '../util/millisecondsToTimespan';

import initializeWalkData, { dateWalksPrefix } from '../util/initializeWalkData';
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

function TagInputs({ tags, onTagUpdate }) {
	const [updatedTags, setUpdatedTags] = useState(tags);
	if (updatedTags?.length) {
		return (
			<div>
				{updatedTags.map((e, idx, arr) => (
					<div key={e} className="tag">
						<input
              onChange={(ev) => {
                setUpdatedTags(t => {
                  t[idx] = ev.target.value;
                  const updated = [...t];
                  onTagUpdate(updated);
                  return updated;
                });
              }}
              className="tag-value" 
              type="text"
              defaultValue={e}
            >
            </input>
						{idx === arr.length - 1 && <span onClick={() => setUpdatedTags(e => [...e, ''])}>{'+'}</span>}
					</div>
				))}
			</div>
		);
	}
}

function loadIntFromLocalStorage(key, defaultValue = 0) {
  const val = localStorage.getItem(key);
  if (val) {
    return parseInt(val);
  }
  return defaultValue;
}

export default function EventInputs({ year, month, day, revert }) {
  const [walks, setWalks] = useState(null);
  const [walkIdx, setWalkIdx] = useState(loadIntFromLocalStorage(`${year}-${month}-${day}-walkIdx`));
  const [eventIdx, setEventIdx] = useState(loadIntFromLocalStorage(`${year}-${month}-${day}-eventIdx`));

  const writeWalks = useCallback(() => {
    const ymd = `${year}-${month}-${day}`;
    const keyForDate = dateWalksPrefix.replace('{{date}}', ymd);
    localStorage.setItem(keyForDate, JSON.stringify(walks));
  }, [year, month, day, walks]);

  useEffect(() => {
    if (walks === null && year && month && day) {
      initializeWalkData({ year, month, day, setWalks });
    }
  }, [year, month, day, setWalks, walks]);

  const addEvent = useCallback((walkIdx, eventIdx, before) => {
    const player = document.querySelector('#wip-video');
    if (!player) {
      alert('Load a video first!');
      return;
    }
    const currentVideoTime = currentTimeToTimestamp(player.currentTime);
    const walk = walks[walkIdx];
    const newEvent = { id: crypto.randomUUID(), trimmedStart: timespanToMilliseconds(currentVideoTime), plates: [], coords: undefined };
    console.log({ walkIdx, eventIdx, before });
    if (walk.events.length === 0) {
      walk.events = [];
    }
    if (before) {
      if (eventIdx === 0) {
        walk.events = [newEvent, ...walk.events];
      } else {
        walk.events = walk.events.toSpliced(eventIdx, 0, newEvent);
      }
    } else {
      walk.events = walk.events.toSpliced(eventIdx + 1, 0, newEvent);
    }
    const updatedWalks = [...walks];
    setWalks(updatedWalks);
    writeWalks();
  }, [setWalks, walks, writeWalks]);

  const updateText = (propName, newName) => {
    walks[walkIdx].events[eventIdx][propName] = newName;
    writeWalks();
  }

  const updateTimestamp = (propName, newValue) => {
    try {
      walks[walkIdx].events[eventIdx][propName] = timespanToMilliseconds(newValue);
      writeWalks();
    } catch (e) {
      console.error(`Failed to updateTimestamp [${propName}]`, e);
    }
  }

  const updateCheckbox = (propName, newValue) => {
    if (newValue) {
      walks[walkIdx].events[eventIdx][propName] = newValue;
    } else {
      delete walks[walkIdx].events[eventIdx][propName];
    }
    writeWalks();
  }

  const changeEvent = (ev, offset) => {
    let finalOffset = offset;
    if (ev) {
      if(ev.shiftKey) {
        finalOffset *= 10;
      } else if (ev.ctrlKey) {
        if (offset < 0) {
          localStorage.setItem(`${year}-${month}-${day}-eventIdx`, 0);
          setEventIdx(0);
        } else {
          const val = walks[walkIdx].events.length - 1;
          localStorage.setItem(`${year}-${month}-${day}-eventIdx`, val);
          setEventIdx(val);
        }
        return;
      }
    }
    const maxOrMin = offset < 0 ? Math.max : Math.min;
    const maxOrMinLimit = offset < 0 ? 0 : walks[walkIdx].events.length - 1;
    setEventIdx(i => {
      const finalIdx = maxOrMin(maxOrMinLimit, i + finalOffset);
      localStorage.setItem(`${year}-${month}-${day}-eventIdx`, finalIdx);
      return finalIdx;
    });
  };

  if (year && month && day && walks) {
    const { events } = walks[walkIdx];
    let walkEvent = events[eventIdx];
    return (
      <div style={{ display: 'flex', width: '100%' }}>
        <title>{`${year}${month ? '-' + month : ''}${day ? '-' + day : ''}${day ? ' ' + walkIdx : ''}`}</title>
        <div style={{ width: '88%' }}>
          <VideoPreview revert={revert} />
        </div>
        <div style={{ width: '12%', borderLeft: '1px solid gray', height: '100vh', overflow: 'scroll' }}>
          {(walks?.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
              {walks.map((walk, idx) => (
                <span
                  key={walk.events?.at(0)?.id}
                  style={idx === walkIdx ? { fontWeight: 'bold' } : { cursor: 'pointer' }}
                  onClick={() => setWalkIdx(idx)}
                >
                  {idx}
                </span>
              ))}
            </div>
          ))}
          <div id="eventInputs" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => {
                const response = window.confirm('Revert changes and reload events from disk?');
                if (response) {
                  const key = dateWalksPrefix.replace('{{date}}', `${year}-${month}-${day}`);
                  localStorage.removeItem(key);
                  localStorage.removeItem(`${year}-${month}-${day}-eventIdx`);
                  window.location.reload();
                }
              }}>
                Revert
              </button>
            </div>
            <div style={{ textAlign: 'center', margin: '1em 0' }}>
              <button onClick={() => addEvent(walkIdx, 0, true)}>Add event before</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
              <button style={{ cursor: 'pointer', userSelect: 'none', opacity: eventIdx > 0 ? '1' : '0', pointerEvents: eventIdx > 0 ? 'all' : 'none' }} onClick={(ev) => changeEvent(ev, -1)}>{'←'}</button>
              <div style={{ fontSize: '24px', userSelect: 'none' }}>
                {(eventIdx + 1).toString().padStart(3, '0')} / {events.length.toString().padStart(3, '0')}
              </div>
              <button style={{ cursor: 'pointer', userSelect: 'none', opacity: eventIdx < events.length - 1 ? '1' : '0', pointerEvents: eventIdx < events.length - 1 ? 'all' : 'none'  }} onClick={(ev) => changeEvent(ev, 1)}>{'→'}</button>
            </div>
            <div
              className="event"
              style={{ textAlign: 'left', fontSize: '18px', marginTop: '1em', padding: '0 1em' }}
              key={walkEvent.id}
            >
              <div title={`Mark: ${millisecondsToTimespan(walkEvent.mark)}`}>
                Trimmed start:
                <input
                  onClick={handleTrimmedStartClick}
                  onChange={(ev) => { updateTimestamp('trimmedStart', ev.target.value) }}
                  className="trimmedStart"
                  style={{ textAlign: 'center', width: '6.2em' }}
                  type="text"
                  defaultValue={millisecondsToTimespan(walkEvent.trimmedStart)}
                ></input>
              </div>

              <div title={`${eventIdx} - ${walkEvent.id}`}>
                <span onClick={() => { window.open(`https://www.google.com/maps/place/${walkEvent.coords[0]},${walkEvent.coords[1]}`, '_blank') }}>
                  Name:
                </span>
                <input
                  disabled={walkEvent.tags}
                  onChange={(ev) => updateText('name', ev.target.value)}
                  className="name"
                  type="text"
                  defaultValue={walkEvent.name}
                ></input>
              </div>

              <div>
                Trimmed end:
                <input
                  className="trimmedEnd"
                  onChange={(ev) => { updateTimestamp('trimmedEnd', ev.target.value) }}
                  style={{ textAlign: 'center', width: '6.2em' }}
                  type="text"
                  defaultValue={walkEvent.trimmedEnd}
                ></input>
              </div>

              <div style={{ marginTop: '1em' }}>
                <PlateInputs
                  backupEvents={writeWalks}
                  eventId={walkEvent.id}
                  onPlateUpdate={(updated) => { walkEvent.plates = updated; writeWalks(); }}
                  plates={((!walkEvent.tags || walkEvent.tags.length === 0) && walkEvent.plates) || []}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-evenly', marginTop: '1em' }}>
                <div>
                  Skip:
                  <input
                    className="skip"
                    type="checkbox"
                    onChange={(ev) => updateCheckbox('skip', ev.target.checked)}
                    defaultChecked={walkEvent.skip === true}
                  ></input>
                </div>
                <div>
                  Resi:
                  <input 
                    className="resi"
                    type="checkbox"
                    onChange={(ev) => updateCheckbox('resi', ev.target.checked)}
                    defaultChecked={walkEvent.resi === true}
                  ></input>
                </div>
              </div>

              <div>
                <TagInputs backupEvents={writeWalks} onTagUpdate={(updated) => walkEvent.plates = updated} tags={walkEvent.tags} />
              </div>
              
              <div style={{ textAlign: 'center', margin: '1em 0' }}>
                <button onClick={() => addEvent(walkIdx, eventIdx, false)}>Add event after</button>
              </div>
            </div>
            {events.length ? <button onClick={async (ev) => {
              await exportEvents(ev, year, month, day, walkIdx, walks[walkIdx].events);
            }}>Submit</button> : null}
          </div>
        </div>
      </div>
    );
  }

  return null;
}