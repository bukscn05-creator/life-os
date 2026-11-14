import test from 'node:test';
import assert from 'node:assert/strict';
import { countLabel } from '../../js/core/plural.js';

test('pluralization es-ES', () => {
  assert.equal(countLabel(1, 'vencimiento', 'vencimientos'), '1 vencimiento');
  assert.equal(countLabel(2, 'vencimiento', 'vencimientos'), '2 vencimientos');
  assert.equal(countLabel(0, 'día', 'días'), '0 días');
});
