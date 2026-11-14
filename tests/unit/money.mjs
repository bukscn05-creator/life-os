import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoneyToCents, formatEUR, centsFromNumber } from '../../js/core/money.js';

test('parseMoneyToCents accepts es-ES formats', () => {
  assert.equal(parseMoneyToCents('12,5').cents, 1250);
  assert.equal(parseMoneyToCents('12.50').cents, 1250);
  assert.equal(parseMoneyToCents('1.234,56').cents, 123456);
  assert.equal(parseMoneyToCents('1234,56').cents, 123456);
});

test('parseMoneyToCents rejects invalid', () => {
  assert.equal(parseMoneyToCents('').ok, false);
  assert.equal(parseMoneyToCents('abc').ok, false);
  assert.equal(parseMoneyToCents('1e9').ok, false);
  assert.equal(parseMoneyToCents('-5', { allowNegative:false }).ok, false);
  assert.equal(parseMoneyToCents('NaN').ok, false);
});

test('formatEUR uses euro', () => {
  const s = formatEUR(123456);
  assert.match(s, /€|EUR/);
  assert.match(s.replace(/\u00A0/g,' '), /1\.234,56|1234,56/);
});

test('centsFromNumber', () => {
  assert.equal(centsFromNumber(12.34), 1234);
});
