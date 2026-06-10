export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = String(timeStr).split(':').map((p) => Number(p));
  const hours = Number.isFinite(parts[0]) ? parts[0] : 0;
  const minutes = Number.isFinite(parts[1]) ? parts[1] : 0;
  return hours * 60 + minutes;
}

export function normalizeTimeHHMM(timeStr) {
  if (!timeStr) return '';
  const parts = String(timeStr).split(':');
  const hh = (parts[0] || '0').padStart(2, '0');
  const mm = (parts[1] || '0').padStart(2, '0');
  return `${hh}:${mm}`;
}

export function intervalsOverlap(aStartMin, aEndMin, bStartMin, bEndMin) {
  return aStartMin < bEndMin && aEndMin > bStartMin;
}

export function computeAvailableStandardShifts(existingSchedules = [], standardShifts = []) {
  const occupied = (existingSchedules || []).map((s) => {
    const start = parseTimeToMinutes(normalizeTimeHHMM(s.shiftStart || s.startTime || s.start || '00:00'));
    const end = parseTimeToMinutes(normalizeTimeHHMM(s.shiftEnd || s.endTime || s.end || '00:00'));
    return { start, end };
  }).filter(o => o.start != null && o.end != null);

  return (standardShifts || []).map((shift) => {
    const sStart = parseTimeToMinutes(shift.start);
    const sEnd = parseTimeToMinutes(shift.end);
    const conflict = occupied.some(o => intervalsOverlap(sStart, sEnd, o.start, o.end));
    return { ...shift, available: !conflict };
  });
}

export const STANDARD_SHIFTS = [
  { key: 'morning', label: 'Morning', start: '08:00', end: '12:00' },
  { key: 'afternoon', label: 'Afternoon', start: '13:00', end: '17:00' },
  { key: 'evening', label: 'Evening', start: '17:00', end: '21:00' },
];

export default {
  parseTimeToMinutes,
  normalizeTimeHHMM,
  intervalsOverlap,
  computeAvailableStandardShifts,
  STANDARD_SHIFTS,
};
