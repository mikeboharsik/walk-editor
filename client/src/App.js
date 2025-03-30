import './App.css';

import { useCallback, useEffect, useState } from 'react';

const baseUrl = 'http://localhost:8089';

function SelectDateComponent({ isVisible, options, updateValue, revert }) {
  if (isVisible && options) {
    return (
      <div>
        {revert && <span style={{ cursor: 'pointer' }} onClick={revert}>{'←'}</span>}
        {
          options
            .toSorted((a,b) => parseInt(a) < parseInt(b) ? -1 : parseInt(a) > parseInt(b) ? 1 : 0)
            .map(dateComponent => (
              <div key={`year-${dateComponent}`} style={{ cursor: 'pointer' }} onClick={() => updateValue(dateComponent)}>{dateComponent}</div>
            ))
        }
      </div>);
  }

  return null;
}

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
  "?",
];

function PlateStateInput({ defaultValue = 'MA' }) {
  return <select defaultValue={defaultValue} className="plate-state">{states.map(e => <option value={e}>{e}</option>)}</select>;
}

function PlateInputs({ plates }) {
  const [newPlates, setNewPlates] = useState([]);

  if (plates?.length || newPlates.length) {
    return (
      <div>
        {(plates || []).concat(newPlates).map((e, idx, arr) => (
          <div className="plate">
            <PlateStateInput defaultValue={e[0]} />
            <input key={e} className="plate-value" type="text" defaultValue={e[1]}></input>
            {idx === arr.length - 1 && <span onClick={() => setNewPlates(e => [...e, ''])}>{'+'}</span>}
          </div>
        ))}
      </div>
    );
  }
  return <div>No plates <span onClick={() => setNewPlates(e => [...e, ''])}>{'+'}</span></div>;
}

function TagInputs({ tags }) {
  const [newTags, setNewTags] = useState([]);
  if (tags?.length || newTags.length) {
    return (
      <div>
        {(tags || []).concat(newTags).map((e, idx, arr) => (
          <div className="tag">
            <input key={e} className="tag-value" type="text" defaultValue={e}></input>
            {idx === arr.length - 1 && <span onClick={() => setNewTags(e => [...e, ''])}>{'+'}</span>}
          </div>
        ))}
      </div>
    );
  }
}

function currentTimeToTimestamp(currentTime) {
  const hours = Math.floor(currentTime / (60 * 60)).toString().padStart(2, 0);
  const minutes = Math.floor((currentTime / 60) % 60).toString().padStart(2, 0);
  const seconds = Math.floor(currentTime % 60).toString().padStart(2, 0);
  const ms = (currentTime % 1).toFixed(3).padEnd(3, 0).replace('0.', '');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function timestampToCurrentTime(timestamp) {
  let [, hour, minute, second, , millisecond] = timestamp.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})(\.)*(\d{1,})*/);
  if (millisecond) millisecond = millisecond.padEnd(3, 0);
  return (parseInt(hour) * 60 * 60) + (parseInt(minute) * 60) + parseInt(second) + (parseInt(millisecond ?? 0) / 1000);
}

function jumpToTime() {
  const targetTime = document.querySelector('#jump-to-time').value;
  document.querySelector('#wip-video').currentTime = timestampToCurrentTime(targetTime);
}

async function exportEvents(ev, year, month, day) {
  const updatedEvents = Array.from(document.querySelector('#eventInputs').querySelectorAll('.event'))
    .map(e => {
      const mark = e.querySelector('.mark')?.value || undefined;
      const trimmedStart = e.querySelector('.trimmedStart')?.value || undefined;
      const trimmedEnd = e.querySelector('.trimmedEnd')?.value || undefined;
      const name = e.querySelector('.name')?.value || undefined;
      const coords = e.querySelector('.coords')?.value.split(',').map(e => parseFloat(e)).filter(e => e) || undefined;
      const plates = Array.from(e.querySelectorAll('.plate'))?.map?.(p => ([p.querySelector('.plate-state')?.value, p.querySelector('.plate-value')?.value])).filter(p => !p[1].endsWith('DELETE')) || undefined;
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

  const invalidEvents = [];
  updatedEvents.forEach((ev, idx) => {
    const { name, plates, skip, trimmedStart, trimmedEnd } = ev;

    if (name.toUpperCase() === 'DELETE') return;

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
    fetch(`${baseUrl}/date/${year}-${month}-${day}/0/events`, { method: 'put', headers: { 'content-type': 'application/json' }, body: JSON.stringify(updatedEvents) });
  }
}

function VideoPreview({ revert }) {
  const [vidSrc, setVidSrc] = useState(null);
  const [vidZoom, setVidZoom] = useState(1.0);
  const [vidOffset, setVidOffset] = useState([0, 0]);
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <>
      <div
        id="video-container"
        style={{
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div>
          {revert && <span style={{ position: 'absolute', cursor: 'pointer', top: '2.5%', zIndex: 10 }} onClick={revert}>{'←'}</span>}
        </div>
        {vidSrc && <video
          onDoubleClick={(e) => e.preventDefault()}
          onTimeUpdate={(e) => {setCurrentTime(e.target.currentTime)}}
          id="wip-video"
          src={vidSrc}
          controls
          controlsList="nofullscreen"
          style={{ marginBottom: '2.5em', display: 'inline-block', scale: vidZoom, translate: `${vidOffset[0]}px ${vidOffset[1]}px`, width: '100%' }}
          onWheel={(e) => {
            if (e.ctrlKey) {
              let newVal = vidZoom;   
              if (e.nativeEvent.wheelDeltaY > 0) {
                newVal = Math.min(10.0, vidZoom + 1);
              } else {
                newVal = Math.max(1.0, vidZoom - 1);
                if (newVal === 1) {
                  setVidOffset([0, 0]);
                }
              }
              setVidZoom(newVal);
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseMove={(e) => { if (e.shiftKey) setVidOffset(([x, y]) => ([x + e.movementX, y + e.movementY]))}}
        ></video>}
        {!vidSrc && <input type="file" onChange={(e) => {
          const url = URL.createObjectURL(e.target.files[0]);
          setVidSrc(url);
        }}></input>}

        <div
          id="video-controls-container"
          style={{ position: 'absolute', bottom: '0.5em' }}
        >
          <div>
            <button onClick={() => {
              setVidZoom(1.0);
              setVidOffset([0, 0]);
            }}>Reset video transforms</button>
          </div>
          <div>
            <input onKeyDown={(e) => e.key === 'Enter' && jumpToTime()} type="text" id="jump-to-time" defaultValue={'00:00:00'}></input>
          </div>
          <div>
            <button onClick={() => document.querySelector('#wip-video').currentTime -= 1.0}>{'<-'}</button>
            <button onClick={() => document.querySelector('#wip-video').currentTime -= (1 / 59.94)}>{'<'}</button>
            <input type="text" value={currentTimeToTimestamp(currentTime)}></input>
            <button onClick={() => document.querySelector('#wip-video').currentTime += (1 / 59.94)}>{'>'}</button>
            <button onClick={() => document.querySelector('#wip-video').currentTime += 1.0}>{'->'}</button>
          </div>
        </div>
      </div>
    </>
  );
}

function handleTrimmedStartClick(e) {
  const newTime = timestampToCurrentTime(e.target.value);
  if (e.ctrlKey) {
    document.querySelector('#wip-video').currentTime = newTime - 10; // assume it's off by 10 seconds
  }
  if (e.altKey) {
    document.querySelector('#wip-video').currentTime = newTime;
  }
}

function EventInputs({ year, month, day, walks, walkIdx, revert, loadWalkData, updateWalks }) {
  const addEvent = useCallback((walkIdx, eventIdx, before) => {
    const currentVideoTime = currentTimeToTimestamp(document.querySelector('#wip-video').currentTime);
    const walk = walks[walkIdx];
    const newEvent = { id: crypto.randomUUID(), trimmedStart: currentVideoTime, plates: [], coords: undefined };
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
        <div style={{ width: '20%' }}>
          <div id="eventInputs" style={{ width: '100%', height: '100vh', overflow: 'scroll' }}>
            {events.map((e, idx) => (
              <div
                className="event"
                style={{ textAlign: 'left', fontSize: '18px', padding: '0 1em' }}
                key={e.id}
                title={`${idx} - ${e.id}`}
              >
                <div>
                  Trimmed start: <input onClick={handleTrimmedStartClick} className="trimmedStart" style={{ textAlign: 'center', width: '6.2em' }} type="text" defaultValue={e.trimmedStart}></input>
                </div>

                <div>
                  <span onClick={() => { window.open(`https://www.google.com/maps/place/${e.coords[0]},${e.coords[1]}`, '_blank') }}>
                    Name:
                  </span>
                  <input disabled={e.tags} onChange={(e) => detectDelete(e, walkIdx, idx)} className="name" type="text" defaultValue={e.name}></input>
                </div>

                <div>
                  Trimmed end: <input className="trimmedEnd" style={{ textAlign: 'center', width: '6.2em' }} type="text" defaultValue={e.trimmedEnd}></input>
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
                  <PlateInputs plates={((!e.tags || e.tags.length === 0) && e.plates) || []} />
                </div>

                <div>
                  Skip: <input className="skip" type="checkbox" defaultChecked={e.skip === true}></input>
                  Resi: <input className="resi" type="checkbox" defaultChecked={e.resi === true}></input>
                </div>

                <div>
                  <TagInputs tags={e.tags} />
                </div>
                
                <div style={{ textAlign: 'center', margin: '1em 0' }}>
                  <button onClick={() => addEvent(walkIdx, idx, false)}>Add event</button>
                </div>
              </div>
            ))}
            <button onClick={async (ev) => { await exportEvents(ev, year, month, day); await loadWalkData(); }}>Submit</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function App() {
  const [years, setYears] = useState(null);
  const [dateData, setDateData] = useState(null);

  const [selectedYear, setSelectedYear] = useState(localStorage.getItem('selectedYear') ?? null);
  const [selectedMonth, setSelectedMonth] = useState(localStorage.getItem('selectedMonth') ?? null);
  const [selectedDay, setSelectedDay] = useState(localStorage.getItem('selectedDay') ?? null);
  const [selectedWalk, setSelectedWalk] = useState(localStorage.getItem('selectedWalk') ?? 0);

  const loadWalkData = useCallback(async () => {
    await fetch(`${baseUrl}/date/${selectedYear}-${selectedMonth}-${selectedDay}`, { headers: { 'cache-control': 'no-cache' } })
      .then(r => r.json())
      .then(r => setDateData(JSON.parse(r)))
      .catch(() => { localStorage.removeItem('selectedDay'); window.location.reload(); });
  }, [selectedYear, selectedMonth, selectedDay]);

  useEffect(() => {
    const handleWheel = (event) => {
      if (event.ctrlKey) {
        event.preventDefault(); // Prevent default browser zoom
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false }); // Important: passive: false for preventDefault to work

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    fetch(`${baseUrl}/dates`)
      .then(r => r.json())
      .then(r => setYears(r));
  }, [setYears]);

  useEffect(() => {
    if (selectedDay) {
      loadWalkData();
    }
  }, [loadWalkData, selectedDay]);

  if (!years) {
    return null;
  }

  return (
    <div className="App" onWheel={(e) => { if (e.ctrlKey) e.preventDefault() } }>
      <header className="App-header">
        <SelectDateComponent
          isVisible={selectedYear === null && years}
          options={years && Object.keys(years)}
          updateValue={(e) => { setSelectedYear(e); localStorage.setItem('selectedYear', e); }}
        />
        <SelectDateComponent
          isVisible={selectedYear !== null && selectedMonth === null}
          options={selectedYear && Object.keys(years?.[selectedYear])}
          updateValue={(e) => { setSelectedMonth(e); localStorage.setItem('selectedMonth', e); }}
          revert={() => { setSelectedYear(null); localStorage.removeItem('selectedYear'); }}
        />
        <SelectDateComponent
          isVisible={selectedYear !== null && selectedMonth !== null && selectedDay === null}
          options={years?.[selectedYear]?.[selectedMonth]}
          updateValue={(e) => { setSelectedDay(e); localStorage.setItem('selectedDay', e); }}
          revert={() => { setSelectedMonth(null); localStorage.removeItem('selectedMonth'); }}
        />
        <EventInputs
          year={selectedYear}
          month={selectedMonth}
          day={selectedDay}
          walks={dateData}
          updateWalks={setDateData}
          walkIdx={selectedWalk}
          revert={() => { setSelectedDay(null); localStorage.removeItem('selectedDay'); }}
          loadWalkData={loadWalkData}
        />
      </header>
    </div>
  );
}

export default App;
