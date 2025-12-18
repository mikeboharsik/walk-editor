import { useCallback, useEffect, useState } from 'react';

import PlateInputs from './PlateInputs';
import VideoPreview from './VideoPreview';

import currentTimeToTimestamp from '../util/currentTimeToTimestamp';
import timestampToCurrentTime from '../util/timestampToCurrentTime';
import timespanToMilliseconds from '../util/timespanToMilliseconds';
import millisecondsToTimespan from '../util/millisecondsToTimespan';

import { dateWalksPrefix } from '../util/consts';
import getWalkData from '../util/getWalkData';
import exportEvents from '../util/exportEvents';

function setPlayerTime(time) {
  const player = document.querySelector('#wip-video');
  if (player) {
    player.currentTime = time;
  } else {
    console.warn(`Attempted to set player time to [${time}] but player is [${player}]`);
  }
}

function jumpToEvent(walk, eventIdx, eventOffset, setPlayerTime) {
  if (localStorage.getItem('jumpToMark') !== 'true') return;
  const event = walk.events[eventIdx];
  if (event && (event.mark || event.start || event.timestamp)) {
    if (event.timestamp) {
      setPlayerTime(((event.timestamp - walk.startTime) / 1000) + (timespanToMilliseconds(eventOffset) / 1000));
      return;
    }

    const markMilliseconds = event.start || event.mark;
    setPlayerTime((markMilliseconds / 1000) + (event.start ? 0 : (timespanToMilliseconds(eventOffset) / 1000)));
  }
}

function TagInputs({ tags, onTagUpdate }) {
	const [updatedTags, setUpdatedTags] = useState(tags?.map(e => ({ key: crypto.randomUUID(), value: e })) || []);
  return (
    <div>
      {updatedTags.map((e, idx, arr) => (
        <div key={e.key} className="tag">
          <input
            onChange={(ev) => {
              setUpdatedTags(t => {
                e.value = ev.target.value;
                const updated = [...t];
                onTagUpdate(updated);
                return updated;
              });
            }}
            className="tag-value" 
            type="text"
            value={e.value}
          >
          </input>
          <button onClick={() => { const updated = updatedTags.toSpliced(idx, 1); setUpdatedTags(updated); onTagUpdate(updated); }}>X</button>
        </div>
      ))}
      <span onClick={() => setUpdatedTags(e => [...e, { key: crypto.randomUUID(), value: '' }])}>{'+'}</span>
    </div>
  );
}

function loadIntFromLocalStorage(key, defaultValue = 0) {
  const val = localStorage.getItem(key);
  if (val) {
    const result = parseInt(val);
    if (isNaN(result)) {
      return defaultValue;
    }
    return result;
  }
  return defaultValue;
}

export default function EventInputs({ year, month, day, revert }) {
  const [walks, setWalks] = useState(null);
  const [walkIdx, setWalkIdx] = useState(loadIntFromLocalStorage(`${year}-${month}-${day}-walkIdx`));
  const [eventIdx, setEventIdx] = useState(loadIntFromLocalStorage(`${year}-${month}-${day}-eventIdx`));
  const [eventOffset, setEventOffset] = useState(localStorage.getItem('eventOffset') || '-00:00:10.000');

  const writeWalks = useCallback(() => {
    const ymd = `${year}-${month}-${day}`;
    const keyForDate = dateWalksPrefix.replace('{{date}}', ymd);
    localStorage.setItem(keyForDate, JSON.stringify(walks));
  }, [year, month, day, walks]);

  useEffect(() => {
    if (year && month && day) {
      getWalkData(year, month, day)
        .then(walksForDate => {
          walksForDate.forEach(walk => {
            walk.events.forEach(event => {
              if (event.timestamp && event.start === undefined) {
                event.start = event.timestamp - walk.startTime;
                return;
              }

              if (event.mark && event.start === undefined) {
                event.start = event.mark + timespanToMilliseconds(eventOffset);
              }
            });
          });
          setWalks(walksForDate);
        });
    }
  }, [eventOffset, year, month, day, setWalks]);

  const addEvent = useCallback((walkIdx, eventIdx, before) => {
    const player = document.querySelector('#wip-video');
    if (!player) {
      alert('Load a video first!');
      return;
    }
    const currentVideoTime = currentTimeToTimestamp(player.currentTime);
    const walk = walks[walkIdx];
    const newEvent = { id: crypto.randomUUID(), trimmedStart: timespanToMilliseconds(currentVideoTime), plates: [], coords: undefined };
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
    const updatedWalks = JSON.parse(JSON.stringify(walks));
    setWalks(updatedWalks);
    writeWalks();
  }, [setWalks, walks, writeWalks]);

  const deleteEvent = useCallback((walkIdx, eventIdx) => {
    const eventsCount = walks[walkIdx].events.length;
    walks[walkIdx].events = walks[walkIdx].events.toSpliced(eventIdx, 1);
    const updatedWalks = JSON.parse(JSON.stringify(walks));
    setWalks(updatedWalks);
    writeWalks();
    if (walkIdx === eventsCount - 1) {
      const finalIdx = walkIdx - 1;
      localStorage.setItem(`${year}-${month}-${day}-eventIdx`, finalIdx);
      jumpToEvent(walks[walkIdx], finalIdx, eventOffset, setPlayerTime);
    } else {
      jumpToEvent(walks[walkIdx], eventIdx, eventOffset, setPlayerTime);
    }
  }, [setWalks, walks, writeWalks, year, month, day, eventOffset]);

  const updateText = useCallback((propName, newName) => {
    walks[walkIdx].events[eventIdx][propName] = newName;
    setWalks(JSON.parse(JSON.stringify(walks)));
    writeWalks();
  }, [eventIdx, setWalks, walks, walkIdx, writeWalks]);

  const setEventProperty = useCallback((propName, newValue) => {
    try {
      walks[walkIdx].events[eventIdx][propName] = typeof newValue === 'string' ? timespanToMilliseconds(newValue) : newValue;
      writeWalks();
      setWalks(JSON.parse(JSON.stringify(walks)));
    } catch (e) {
      console.error(`Failed to setEventProperty [${propName}]`, e);
    }
  }, [eventIdx, setWalks, walks, walkIdx, writeWalks]);

  const updateCheckbox = useCallback((propName, newValue) => {
    if (newValue) {
      walks[walkIdx].events[eventIdx][propName] = newValue;
    } else {
      delete walks[walkIdx].events[eventIdx][propName];
    }
    writeWalks();
  }, [eventIdx, walks, walkIdx, writeWalks]);

  const changeEvent = useCallback((ev, offset) => {
    let finalOffset = offset;
    let finalIdx;
    if (ev) {
      if(ev.shiftKey) {
        finalOffset *= 10;
      } else if (ev.ctrlKey) {
        if (offset < 0) {
          finalIdx = 0;
        } else {
          const val = walks[walkIdx].events.length - 1;
          finalIdx = val;
        }
      }
    }
    const maxOrMin = offset < 0 ? Math.max : Math.min;
    const maxOrMinLimit = offset < 0 ? 0 : walks[walkIdx].events.length - 1;
    setEventIdx(i => {
      if (finalIdx === undefined) {
        finalIdx = maxOrMin(maxOrMinLimit, i + finalOffset);
      }
      localStorage.setItem(`${year}-${month}-${day}-eventIdx`, finalIdx);
      jumpToEvent(walks[walkIdx], finalIdx, eventOffset, setPlayerTime);
      return finalIdx;
    });
  }, [day, month, walkIdx, walks, setEventIdx, year, eventOffset]);

  function handleStartOrEndClick(e) {
    try {
      const newTime = timestampToCurrentTime(e.target.value);
      if (e.ctrlKey) {
        setPlayerTime(newTime - 10); // assume it's off by 10 seconds
      }
      if (e.altKey) {
        setPlayerTime(newTime);
      }
    } catch (e) {
      console.warn('Failed to properly handle start or end click', e);
    }
  }

  const handleCurrentTimeClick = useCallback((ev) => {
    if (ev.ctrlKey) {
      setEventProperty('start', ev.target.value);
    } else if (ev.altKey) {
      setEventProperty('end', ev.target.value);
    }
  }, [setEventProperty]);

  const handleVideoLoaded = useCallback(() => {
    setTimeout(() => {
      const walk = walks[walkIdx];
      const event = walk.events[eventIdx];
      const offsetMs = timespanToMilliseconds(eventOffset);
      if (event.timestamp) {
        setPlayerTime(((event.timestamp - walk.startTime) / 1000) + (offsetMs / 1000));
      } else {
        setPlayerTime((event.mark / 1000) + (offsetMs / 1000));
      }
    }, 250);
  }, [eventIdx, eventOffset, walks, walkIdx]);

  const Title = () => <title>{`${year}${month ? '-' + month : ''}${day ? '-' + day : ''}${day ? ' ' + walkIdx : ''}`}</title>;

  if (year && month && day && walks) {
    const { events, startTime } = walks[walkIdx];
    const walkEvent = events[eventIdx];
    if (!walkEvent) {
      console.log('Failed to walk event', { walks, walkIdx, eventIdx });
    };
    return (
      <div style={{ display: 'flex', width: '100%' }}>
        <Title />
        <div style={{ width: '85%' }}>
          <VideoPreview
            revert={revert}
            handleCurrentTimeClick={handleCurrentTimeClick}
            handleVideoLoaded={handleVideoLoaded}
          />
        </div>
        <div style={{ width: '15%', borderLeft: '1px solid gray', height: '100vh', overflow: 'scroll' }}>
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
              <div style={{ fontSize: '18px', marginTop: '0.5em' }}>
                <div>
                  Jump to mark:
                  <input
                    type="checkbox"
                    defaultChecked={localStorage.getItem('jumpToMark') === 'true'}
                    onChange={(ev) => localStorage.setItem('jumpToMark', ev.target.checked)}
                  />
                </div>
                <div>
                  Offset:
                  <input
                    type="text"
                    defaultValue={eventOffset}
                    onChange={(ev) => setEventOffset(() => { localStorage.setItem('eventOffset', ev.target.value); return ev.target.value; })}
                  ></input>
                </div>
              </div>
              {events.length ? <div><button onClick={async (ev) => {
                await exportEvents(ev, year, month, day, walkIdx, walks[walkIdx].events);
              }}>Submit</button></div> : null}
            </div>
            
            <hr />

            <div style={{ textAlign: 'center', marginBottom: '1em' }}>
              <button onClick={() => addEvent(walkIdx, 0, true)}>Add event before</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
              <button style={{ cursor: 'pointer', userSelect: 'none', opacity: eventIdx > 0 ? '1' : '0', pointerEvents: eventIdx > 0 ? 'all' : 'none' }} onClick={(ev) => changeEvent(ev, -1)}>{'←'}</button>
              <div style={{ fontSize: '24px', userSelect: 'none' }}>
                {(eventIdx + 1).toString().padStart(3, '0')} / {events.length.toString().padStart(3, '0')}
              </div>
              <button style={{ cursor: 'pointer', userSelect: 'none', opacity: eventIdx < events.length - 1 ? '1' : '0', pointerEvents: eventIdx < events.length - 1 ? 'all' : 'none'  }} onClick={(ev) => changeEvent(ev, 1)}>{'→'}</button>
            </div>
            <div style={{ fontSize: '18px', marginTop: '1em' }}>
              Mark: {millisecondsToTimespan(walkEvent.mark || walkEvent.timestamp - startTime)}
            </div>
            <div>
              <button onClick={() => deleteEvent(walkIdx, eventIdx)}>Delete event</button>
            </div>
            <div
              className="event"
              style={{ textAlign: 'left', fontSize: '18px', marginTop: '1em', padding: '0 1em' }}
              key={walkEvent.id}
            >
              <div>
                Start&nbsp;&nbsp;
                <input
                  onClick={handleStartOrEndClick}
                  onChange={(ev) => { setEventProperty('start', ev.target.value) }}
                  style={{ textAlign: 'center', marginLeft: '1em', width: '6.2em' }}
                  type="text"
                  value={millisecondsToTimespan(walkEvent.start)}
                ></input>
              </div>

              <div style={{ marginTop: '0.5em' }} title={`${eventIdx} - ${walkEvent.id}`}>
                <span onClick={() => { window.open(`https://www.google.com/maps/place/${walkEvent.coords[0]},${walkEvent.coords[1]}`, '_blank') }}>
                  Name
                </span>
                <input
                  style={{ marginLeft: '1em' }}
                  disabled={walkEvent.tags}
                  onChange={(ev) => updateText('name', ev.target.value)}
                  className="name"
                  type="text"
                  value={walkEvent.name}
                ></input>
              </div>

              <div style={{ marginTop: '0.5em' }}>
                End&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <input
                  onClick={handleStartOrEndClick}
                  onChange={(ev) => { setEventProperty('end', ev.target.value) }}
                  style={{ textAlign: 'center', marginleft: '1em', width: '6.2em' }}
                  type="text"
                  value={millisecondsToTimespan(walkEvent.end)}
                ></input>
              </div>

              <div style={{ marginTop: '1em', textAlign: 'center' }}>
                Plates
                <PlateInputs
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

              <div style={{ marginTop: '1em', textAlign: 'center' }}>
                Tags
                <TagInputs
                  backupEvents={writeWalks}
                  onTagUpdate={(updated) => { walkEvent.tags = updated.map(e => e.value); writeWalks(); }}
                  tags={walkEvent.tags} 
                />
              </div>
              
              <div style={{ textAlign: 'center', margin: '1em 0' }}>
                <button onClick={() => addEvent(walkIdx, eventIdx, false)}>Add event after</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}