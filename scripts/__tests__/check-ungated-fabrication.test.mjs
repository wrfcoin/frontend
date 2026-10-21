import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createHash } from 'node:crypto';

const checker = path.resolve('scripts/check-ungated-fabrication.mjs');

function fixture(files, baseline = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fabrication-ratchet-'));
  for (const [name, contents] of Object.entries(files)) {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'scripts/ungated-fabrication-baseline.json'),
    `${JSON.stringify(baseline)}\n`,
  );
  return root;
}

function run(root) {
  return spawnSync(process.execPath, [checker, '--root', root], { encoding: 'utf8' });
}

test('a planted reachable ungated marker is red', t => {
  const root = fixture({
    'src/App.jsx': "import Widget from './Widget.jsx'; export default Widget;\n",
    'src/Widget.jsx': 'const MOCK_VALUE = 4; export default function Widget() { return MOCK_VALUE; }\n',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /New reachable ungated/);
});

test('the same marker behind a recognized gate is green', t => {
  const root = fixture({
    'src/App.jsx': "import Widget from './Widget.jsx'; export default Widget;\n",
    'src/Widget.jsx': "import DemoSurfaceGate from './DemoSurfaceGate.jsx'; const MOCK_VALUE = 4; const Widget = () => (<DemoSurfaceGate>{MOCK_VALUE}</DemoSurfaceGate>); export default Widget;\n",
    'src/DemoSurfaceGate.jsx': 'export default function DemoSurfaceGate() { return null; }\n',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(run(root).status, 0);
});

for (const marker of ['// FEATURES.demoSurfaces', '/* DemoSurfaceGate */', 'const label = "PublicViewerNotice";', 'const label = `DemoSurfaceGate`;', 'const enabled = FEATURES.demoSurfaces;']) {
  for (const entry of ['src/App.jsx', 'src/main.jsx', 'src/Layout.jsx']) {
    test(`${entry}: ${marker} cannot hide an ungated descendant`, t => {
      const root = fixture({
        'src/App.jsx': "import Layout from './Layout.jsx'; export default Layout;",
        'src/main.jsx': "import App from './App.jsx';",
        'src/Layout.jsx': "import Widget from './Widget.jsx'; export default Widget;",
        'src/Widget.jsx': 'const MOCK_VALUE = 4; export default function Widget() { return MOCK_VALUE; }',
      });
      t.after(() => fs.rmSync(root, { recursive: true, force: true }));
      fs.appendFileSync(path.join(root, entry), `\n${marker}\n`);
      const result = run(root);
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stderr, /src\/Widget.jsx/);
    });
  }
}

test('an imported gate without a gated default render cannot exempt its own markers', t => {
  const root = fixture({
    'src/App.jsx': "import Widget from './Widget.jsx';",
    'src/Widget.jsx': "import DemoSurfaceGate from './DemoSurfaceGate.jsx'; const MOCK_VALUE = 4; export default function Widget() { return MOCK_VALUE; }",
    'src/DemoSurfaceGate.jsx': 'export default function DemoSurfaceGate() { return null; }',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(run(root).status, 1);
});

test('whole-file gates are still traversed; an ungated second importer wins', t => {
  const root = fixture({
    'src/App.jsx': "import Gated from './Gated.jsx'; import Ungated from './Ungated.jsx';",
    'src/Gated.jsx': "import Child from './Child.jsx'; const Gated = () => (<DemoSurfaceGate><Child /></DemoSurfaceGate>); export default Gated;",
    'src/Ungated.jsx': "import Child from './Child.jsx'; export default Child;",
    'src/Child.jsx': 'const MOCK_VALUE = 4; export default function Child() { return MOCK_VALUE; }',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /src\/Child.jsx/);
  fs.writeFileSync(path.join(root, 'src/App.jsx'), "import Gated from './Gated.jsx';");
  const gated = run(root);
  assert.equal(gated.status, 0, gated.stdout + gated.stderr);
  assert.match(gated.stdout, /3 files scanned/);
});

test('a notice or partial gate inside a layout cannot waive sibling fabrication', t => {
  const root = fixture({
    'src/App.jsx': "import Widget from './Widget.jsx';",
    'src/Widget.jsx': 'const MOCK_VALUE = 4; const Widget = () => (<><DemoSurfaceGate>sample</DemoSurfaceGate><PublicViewerNotice />{MOCK_VALUE}</>); export default Widget;',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(run(root).status, 1);
});

test('a reviewed mixed gate exempts only its exact source version, never its children', t => {
  const source = "import Child from './Child.jsx'; const MOCK_VALUE = 4; export default function Widget() { return MOCK_VALUE; }";
  const root = fixture({
    'src/App.jsx': "import Widget from './Widget.jsx';",
    'src/Widget.jsx': source,
    'src/Child.jsx': 'const MOCK_CHILD = 9;',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'scripts/fabrication-reviewed-local-gates.json'), JSON.stringify({
    'src/Widget.jsx': { reason: 'Synthetic exact-version exemption control', sha256: createHash('sha256').update(source).digest('hex') },
  }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /src\/Child.jsx/);
  assert.doesNotMatch(result.stderr, /\+ src\/Widget.jsx/);
  fs.appendFileSync(path.join(root, 'src/Widget.jsx'), '\n// changed');
  assert.match(run(root).stderr, /changed reviewed gate/);
});

test('a stale baseline entry is red', t => {
  const root = fixture({ 'src/App.jsx': 'export default function App() { return null; }\n' }, [
    'src/OldMock.jsx',
  ]);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Stale baseline entries/);
});

test('zero scanned entrypoints is void, not green', t => {
  const root = fixture({});
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /VOID/);
});

// Ratchet-down record: entries removed from the baseline once their surface
// became truthful. Each must stay out of the baseline, and the checker on the
// real tree must stay green, which fails if any of these files regains a marker.
const RETIRED_BASELINE_ENTRIES = [
  // frontend#355: fake Start/Pause/Stop state machine and simulated delays.
  'src/components/Miner/v2/MiningControlsPanel.jsx',
  'src/pages/NewMinerPage.jsx',
];

test('retired baseline entries stay removed', () => {
  const baseline = JSON.parse(
    fs.readFileSync(path.resolve('scripts/ungated-fabrication-baseline.json'), 'utf8'),
  );
  for (const entry of RETIRED_BASELINE_ENTRIES) {
    assert.ok(fs.existsSync(path.resolve(entry)), `${entry} still exists`);
    assert.ok(!baseline.includes(entry), `${entry} is back in the baseline`);
  }
  const result = spawnSync(process.execPath, [checker], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('Math.random feeding a reachable render value is red; the opaque-id idiom is green', t => {
  const bad = fixture({
    'src/App.jsx': "import Chart from './Chart.jsx'; export default Chart;\n",
    'src/Chart.jsx': 'export default function Chart() { return [1, 2].map(v => v + (Math.random() - 0.5)); }\n',
  });
  t.after(() => fs.rmSync(bad, { recursive: true, force: true }));
  const result = run(bad);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /src\/Chart\.jsx/);
  const id = fixture({
    'src/App.jsx': "import Id from './Id.jsx'; export default Id;\n",
    'src/Id.jsx': 'export default function Id() { return Math.random().toString(36).slice(2); }\n',
  });
  t.after(() => fs.rmSync(id, { recursive: true, force: true }));
  assert.equal(run(id).status, 0);
});

test('Math.random behind a recognized whole-file gate or in a comment/string is green', t => {
  const root = fixture({
    'src/App.jsx': "import Widget from './Widget.jsx'; export default Widget;\n",
    'src/Widget.jsx': "import DemoSurfaceGate from './DemoSurfaceGate.jsx'; const Widget = () => (<DemoSurfaceGate>{Math.random()}</DemoSurfaceGate>); export default Widget; // Math.random() never in prose\n",
    'src/DemoSurfaceGate.jsx': 'export default function DemoSurfaceGate() { return null; }\n',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(run(root).status, 0);
});

test('the Math.random id exemption does not let a displayed number through', t => {
  const numeric = [
    'parseInt(Math.random().toString(16).slice(2, 6), 16)',
    'Number(Math.random().toString(36).slice(2, 5))',
    'parseFloat(Math.random().toString(36))',
    '+Math.random().toString(36).slice(2)',
    'const h = Math.random().toString(16).slice(2, 6); return parseInt(h, 16)',
  ];
  for (const [index, expression] of numeric.entries()) {
    const root = fixture({
      'src/App.jsx': "import V from './V.jsx'; export default V;\n",
      'src/V.jsx': `export default function V() { ${expression.startsWith('const') ? expression : `return ${expression}`}; }\n`,
    });
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const result = run(root);
    assert.equal(result.status, 1, `case ${index}: ${expression}`);
    assert.match(result.stderr, /src\/V\.jsx/);
  }
  for (const expression of [
    'key={`row-${Math.random().toString(36).slice(2)}`}',
    'const id = "x" + Math.random().toString(16).slice(2, 10); return id',
  ]) {
    const root = fixture({
      'src/App.jsx': "import V from './V.jsx'; export default V;\n",
      'src/V.jsx': `export default function V() { ${expression.startsWith('const') ? expression : `return <i ${expression} />`}; }\n`,
    });
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    assert.equal(run(root).status, 0, expression);
  }
});
