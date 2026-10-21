// Opt-in reproduction of #432's cold-transform cost, with the real UI intact.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const config = { ...require('./../jest.config.cjs'), rootDir: root };
const transformKey = Object.keys(config.transform)[0];
config.transform = {
  ...config.transform,
  [transformKey]: [path.join(__dirname, 'coldMinerImportProbe.cjs'), config.transform[transformKey][1]],
};
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'miner-cold-import-'));
const file = path.join(dir, 'jest.json');
fs.writeFileSync(file, JSON.stringify(config));
try {
  const run = spawnSync(process.execPath, [require.resolve('jest/bin/jest'),
    '--runInBand', '--no-cache', '--config', file,
    'src/pages/__tests__/NewMinerPage.truth.test.jsx'], {
    cwd: root, stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --experimental-vm-modules` },
  });
  if (run.error) throw run.error;
  process.exitCode = run.status ?? 1;
} finally {
  fs.unlinkSync(file);
  fs.rmdirSync(dir);
}
