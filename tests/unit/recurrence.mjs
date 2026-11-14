import test from 'node:test';
import assert from 'node:assert/strict';
import { occursOn, nextOccurrenceOnOrAfter, occurrencesInRange } from '../../js/core/recurrence.js';

test('monthly 31 clamps to end of month', () => {
  assert.ok(occursOn('2026-02-28', '2026-01-31', 'mensual'));
  assert.ok(occursOn('2026-04-30', '2026-01-31', 'mensual'));
});

test('annual 29-feb -> 28-feb on non-leap', () => {
  assert.ok(occursOn('2027-02-28', '2024-02-29', 'anual'));
  assert.ok(occursOn('2028-02-29', '2024-02-29', 'anual'));
});

test('nextOccurrenceOnOrAfter', () => {
  assert.equal(nextOccurrenceOnOrAfter('2026-11-01', 'semanal', '2026-11-10'), '2026-11-15');
});

test('exceptions excluded', () => {
  const list = occurrencesInRange('2026-11-01', 'diaria', '2026-11-01', '2026-11-03', ['2026-11-02']);
  assert.deepEqual(list, ['2026-11-01','2026-11-03']);
});
