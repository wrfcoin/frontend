import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkSnapshot } from '../check-forecast-accuracy-snapshot.mjs';

const fixture = readFileSync(new URL('../../src/types/__fixtures__/ForecastAccuracyMetrics.generated.ts.txt', import.meta.url), 'utf8');
const body = fixture.slice(fixture.indexOf('\n') + 1);

test('reviewed fixture and both backend sources agree', () => {
  assert.match(checkSnapshot(fixture, body, body).sha256, /^[a-f0-9]{64}$/);
});
test('a format-valid invented commit is rejected', () => {
  assert.throws(() => checkSnapshot(fixture.replace(/backend@[a-f0-9]{40}/, `backend@${'0'.repeat(40)}`), body, body), /provenance commit/);
});
test('same-shape comment or whitespace edits cannot change provenance bytes', () => {
  assert.throws(() => checkSnapshot(`${fixture}\n`, body, body), /provenance commit/);
  assert.throws(() => checkSnapshot(fixture, `${body}\n`, body), /provenance commit/);
});
test('current backend drift is detected even when the snapshot and pin agree', () => {
  assert.throws(() => checkSnapshot(fixture, body, body.replace('mae: number', 'mae: string')), /backend drift/);
});
