import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('explorer PR supersession preserves all non-PR pending and running jobs', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/explorer-health-probe.yml', import.meta.url), 'utf8');
  assert.ok(workflow.includes("group: ${{ github.workflow }}-${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || format('run-{0}', github.run_id) }}"));
  assert.ok(workflow.includes("cancel-in-progress: ${{ github.event_name == 'pull_request' }}"));
});

test('the active fabrication PR trigger includes the scheduling policy subject', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/fabrication-ratchet.yml', import.meta.url), 'utf8');
  const pullRequest = workflow.match(/^  pull_request:\n((?: {4,}.*\n|\n| *#.*\n)*)/m)?.[1] ?? '';
  assert.match(pullRequest, /^ {6}- "\.github\/workflows\/explorer-health-probe\.yml"$/m);
});
