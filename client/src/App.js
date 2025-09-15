import { useCallback, useEffect, useState } from 'react';

import { baseUrl } from './util/consts';

import './App.css';
import DateComponentSelector from './components/DateComponentSelector';
import EventInputs from './components/EventInputs';

function App() {
  const [years, setYears] = useState(null);

  const [selectedYear, setSelectedYear] = useState(localStorage.getItem('selectedYear') ?? null);
  const [selectedMonth, setSelectedMonth] = useState(localStorage.getItem('selectedMonth') ?? null);
  const [selectedDay, setSelectedDay] = useState(localStorage.getItem('selectedDay') ?? null);

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

  if (!years) {
    return null;
  }

  return (
    <div className="App" onWheel={(e) => { if (e.ctrlKey) e.preventDefault() } }>
      <header className="App-header">
        <DateComponentSelector
          isVisible={selectedYear === null && years}
          options={years && Object.keys(years)}
          updateValue={(e) => { setSelectedYear(e); localStorage.setItem('selectedYear', e); }}
        />
        <DateComponentSelector
          isVisible={selectedYear !== null && selectedMonth === null}
          options={selectedYear && Object.keys(years?.[selectedYear])}
          updateValue={(e) => { setSelectedMonth(e); localStorage.setItem('selectedMonth', e); }}
          revert={() => { setSelectedYear(null); localStorage.removeItem('selectedYear'); }}
        />
        <DateComponentSelector
          isVisible={selectedYear !== null && selectedMonth !== null && selectedDay === null}
          options={years?.[selectedYear]?.[selectedMonth]}
          updateValue={(e) => { setSelectedDay(e); localStorage.setItem('selectedDay', e); }}
          revert={() => { setSelectedMonth(null); localStorage.removeItem('selectedMonth'); }}
        />
        <EventInputs
          year={selectedYear}
          month={selectedMonth}
          day={selectedDay}
          revert={() => { setSelectedDay(null); localStorage.removeItem('selectedDay'); }}
        />
      </header>
    </div>
  );
}

export default App;
