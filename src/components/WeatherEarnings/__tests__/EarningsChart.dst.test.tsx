/** @jest-environment node */
// frontend#442 review (SOL-C r3): the DST regression needs a Node process that STARTS in America/Los_Angeles
// (assigning process.env.TZ inside a running Jest worker does not change its zone, so it failed on UTC runners).
// This test runs EarningsChart.dstzone.test.tsx in a child Jest with TZ set, whatever zone the parent has.
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const inner = 'src/components/WeatherEarnings/__tests__/EarningsChart.dstzone.test.tsx';

function runInner(tz: string) {
  const r = spawnSync(process.execPath, ['--experimental-vm-modules', path.join(root, 'node_modules/jest/bin/jest.js'),
    '--runInBand', '--json', '--runTestsByPath', inner], {
    cwd: root, encoding: 'utf8', timeout: 240000, maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, TZ: tz, EARNINGS_DST_CHILD: '1', NODE_OPTIONS: '--experimental-vm-modules' },
  });
  const report = JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
  return { status: r.status, report };
}

describe('EarningsChart DST window (child Jest started with an explicit TZ)', () => {
  it('passes every assertion in America/Los_Angeles, whatever the parent zone is', () => {
    const { status, report } = runInner('America/Los_Angeles');
    expect(report.numTotalTests).toBe(2);
    expect(report.numPassedTests).toBe(2);
    expect(status).toBe(0);
  }, 300000);

  it('negative control: the same assertions are RED in UTC, so the zone is really what is tested', () => {
    const { status, report } = runInner('UTC');
    expect(report.numFailedTests).toBeGreaterThan(0);
    expect(status).not.toBe(0);
  }, 300000);
});
