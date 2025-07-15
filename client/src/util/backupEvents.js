import getAllEvents from './getAllEvents';

export default function backupEvents() {
  const events = getAllEvents();
  localStorage.setItem('backup', JSON.stringify(events));
}