import test from 'node:test';
import assert from 'node:assert/strict';
import { parseYMD, toYMD, calendarDayDiff, addDaysYMD, monthGrid, startOfWeekMonday, todayYMD, formatDateShort, formatRelative } from '../../js/core/dates.js';

test('parseYMD valid/invalid', () => {
  assert.deepEqual(parseYMD('2026-11-14'), {y:2026,mo:11,d:14});
  assert.equal(parseYMD('2026-02-30'), null);
  assert.equal(parseYMD('14/11/2026'), null);
});

test('calendarDayDiff uses calendar days', () => {
  assert.equal(calendarDayDiff('2026-11-14','2026-11-15'), 1);
  assert.equal(calendarDayDiff('2026-03-28','2026-03-29'), 1); // DST boundary Europe/Berlin context-safe by date diff
});

test('addDaysYMD crosses month/year', () => {
  assert.equal(addDaysYMD('2026-12-31', 1), '2027-01-01');
  assert.equal(addDaysYMD('2026-03-01', -1), '2026-02-28');
});

test('week starts Monday', () => {
  assert.equal(startOfWeekMonday('2026-11-14'), '2026-11-09');
});

test('monthGrid covers month', () => {
  const g = monthGrid('2026-11');
  assert.ok(g.length === 35 || g.length === 42);
  assert.ok(g.some(d => d.ymd === '2026-11-01' && d.inMonth));
  assert.ok(g.some(d => d.ymd === '2026-11-30' && d.inMonth));
});

test('formatDateShort es-ES', () => {
  const s = formatDateShort('2026-11-14');
  assert.match(s, /14/);
  assert.match(s.toLowerCase(), /nov/);
});
