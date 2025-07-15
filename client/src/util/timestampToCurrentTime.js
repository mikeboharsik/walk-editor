export default function timestampToCurrentTime(timestamp) {
  let [, hour, minute, second, , millisecond] = timestamp.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})(\.)*(\d{1,})*/);
  if (millisecond) millisecond = millisecond.padEnd(3, 0);
  return (parseInt(hour) * 60 * 60) + (parseInt(minute) * 60) + parseInt(second) + (parseInt(millisecond ?? 0) / 1000);
}