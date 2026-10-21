#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';

const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

const root = path.resolve(option('--root', process.cwd()));
const baselinePath = path.resolve(
  root,
  option('--baseline', 'scripts/ungated-fabrication-baseline.json'),
);
const writeBaseline = args.includes('--write-baseline');

// Only code can establish containment. Strings/comments mentioning a gate
// never change traversal. Keep this conservative: unrecognized forms are debt.
function codeOnly(source) {
  return source.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    token => token.startsWith('/') ? '' : '""');
}

function wholeFileGate(source) {
  const code = codeOnly(source);
  // A default-export wrapper with no additional runtime exports owns its
  // sample body. A mere import, partial conditional or sibling notice does not.
  const name = code.match(/\bexport\s+default\s+(\w+)\s*;/)?.[1];
  const wrapper = name
    ? code.match(new RegExp(`(?:export\\s+)?\\bconst\\s+${name}\\s*(?::[^;=]+)?=\\s*\\([^)]*\\)\\s*=>\\s*\\(\\s*<DemoSurfaceGate\\b([^>]*>)[\\s\\S]*?</DemoSurfaceGate>\\s*\\)\\s*;`))
    : code.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{\s*return\s+<DemoSurfaceGate\b([^>]*>)[\s\S]*?<\/DemoSurfaceGate>\s*;\s*\}/);
  if (wrapper && /\bexport\s+(?:const|let|var|function|class|\{)/.test(code.replace(wrapper[0], ''))) return false;
  // action/children/spread props can mount components outside the sample gate.
  return Boolean(wrapper && !/\b(?:action|children)\s*=|\.\.\.|</.test(wrapper[1]));
}

const reviewedGatesPath = path.join(root, 'scripts/fabrication-reviewed-local-gates.json');
const reviewedGates = fs.existsSync(reviewedGatesPath)
  ? JSON.parse(fs.readFileSync(reviewedGatesPath, 'utf8')) : {};
function reviewedLocalGate(file, source) {
  const entry = reviewedGates[relative(file)];
  return entry && entry.reason && entry.sha256 === createHash('sha256').update(source).digest('hex');
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function isExcluded(file) {
  const name = relative(file);
  return (
    name.includes('/__tests__/') ||
    name.includes('/__mocks__/') ||
    /\.(?:test|spec|stories)\.[^.]+$/.test(name) ||
    /(?:^|\/)mocks(?:\/|$)/.test(name)
  );
}

function resolveImport(fromFile, specifier) {
  let base;
  if (specifier.startsWith('@/')) {
    base = path.join(root, 'src', specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }

  const candidates = [base];
  for (const extension of SOURCE_EXTENSIONS) candidates.push(`${base}${extension}`);
  for (const extension of SOURCE_EXTENSIONS) candidates.push(path.join(base, `index${extension}`));
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function importSpecifiers(source) {
  const found = new Set();
  const patterns = [
    /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.add(match[1]);
  }
  return found;
}

// The id idiom is exempt only while its result stays a string. Wrapping it in
// parseInt/parseFloat/Number, a unary +, or doing the same to a variable it
// was assigned to turns it back into a displayed number.
function numericFromRandomString(code) {
  const idiom = String.raw`Math\.random\s*\(\s*\)\s*\.toString\s*\(\s*(?:36|16)\s*\)`;
  if (new RegExp(String.raw`\b(?:parseInt|parseFloat|Number)\s*\([^;]*?${idiom}`).test(code)) return true;
  if (new RegExp(String.raw`(?:^|[=(,:?&|!<>*/%{\[;]|\breturn)\s*\+\s*${idiom}`).test(code)) return true;
  for (const match of code.matchAll(new RegExp(String.raw`\b([\w$]+)\s*=\s*${idiom}`, 'g'))) {
    const name = match[1].replace(/\$/g, '\\$');
    if (new RegExp(String.raw`(?:\b(?:parseInt|parseFloat|Number)\s*\(\s*|(?:^|[=(,:?&|!<>*/%{\[;]|\breturn)\s*\+\s*)${name}\b`).test(code)) return true;
  }
  return false;
}

function carriesFabricationMarker(source) {
  const withoutRemovedComments = source
    .split('\n')
    .filter(line => !(/^\s*\/\//.test(line) && /removed/i.test(line)))
    .join('\n');
  return (
    /\/\/\s*-*\s*(?:Mock|Simulat)/i.test(withoutRemovedComments) ||
    /\bSAMPLE_KEY_LIFECYCLE\b/.test(codeOnly(source)) ||
    /\b(?:generateMock|mockMetrics|fallbackMetrics)/.test(withoutRemovedComments) ||
    /\bconst\s+(?:MOCK_|mock[A-Z]|FALLBACK_CREDENTIALS\b|FALLBACK_POLICIES\b|EMPTY_SUMMARY\b)/.test(withoutRemovedComments) ||
    // Named illustrative component bodies remain fabrication even after a
    // gate is removed; badge styling alone is not a component body.
    /\b(?:const|function)\s+[A-Z]\w*Sample\b/.test(codeOnly(source)) ||
    // Browser-generated figures: Math.random() feeding a value that is not
    // the opaque-id idiom (Math.random().toString(36)...) draws invented data.
    /\bMath\.random\s*\(\s*\)(?!\s*\.toString\s*\(\s*(?:36|16)\s*\))/.test(codeOnly(source)) ||
    numericFromRandomString(codeOnly(source)) ||
    /setTimeout\s*\([\s\S]{0,300}?\/\/[^\n]*simulat/i.test(withoutRemovedComments)
  );
}

function roots() {
  const candidates = [path.join(root, 'src/main.jsx'), path.join(root, 'src/App.jsx')];
  const routesDir = path.join(root, 'src/routes');
  if (fs.existsSync(routesDir)) {
    for (const entry of fs.readdirSync(routesDir).sort()) {
      if (entry.endsWith('.jsx')) candidates.push(path.join(routesDir, entry));
    }
  }
  return [...new Set(candidates.filter(file => fs.existsSync(file) && !isExcluded(file)))];
}

const entrypoints = roots();
if (entrypoints.length === 0) {
  console.error('VOID: no frontend entrypoints were found; nothing was scanned');
  process.exit(2);
}

const visited = new Set();
const visitedModes = new Set();
const findings = new Set();
const routeRoot = path.join(root, 'src/routes') + path.sep;

function walk(file, inheritedGate = false) {
  const mode = `${file}:${inheritedGate}`;
  if (visitedModes.has(mode) || isExcluded(file)) return;
  visitedModes.add(mode);
  visited.add(file);
  const source = fs.readFileSync(file, 'utf8');
  const isRouteRoot = file.startsWith(routeRoot) && path.dirname(file) === path.join(root, 'src/routes');
  const isRoot = entrypoints.includes(file);
  const isGate = !isRoot && !isRouteRoot && wholeFileGate(source);
  // Reviewed mixed gates exempt this exact file version only. Their imports
  // remain ungated. Any source edit requires renewed evidence or baseline debt.
  if (!inheritedGate && !isGate && !reviewedLocalGate(file, source) && carriesFabricationMarker(source)) findings.add(relative(file));
  for (const specifier of importSpecifiers(source)) {
    const imported = resolveImport(file, specifier);
    const reviewedImport = reviewedLocalGate(file, source) && reviewedGates[relative(file)].gatedImports?.includes(specifier);
    if (imported) walk(imported, inheritedGate || isGate || Boolean(reviewedImport));
  }
}

for (const entrypoint of entrypoints) walk(entrypoint);
for (const file of Object.keys(reviewedGates)) {
  const target = path.resolve(root, file);
  if (!visited.has(target) || entrypoints.includes(target) ||
      !reviewedLocalGate(target, fs.readFileSync(target, 'utf8'))) {
    console.error(`Stale or changed reviewed gate (renew evidence or remove it): ${file}`);
    process.exit(1);
  }
}
if (visited.size === 0) {
  console.error('VOID: import graph visited zero files');
  process.exit(2);
}

const current = [...findings].sort();
if (writeBaseline) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`Wrote ${current.length} findings to ${relative(baselinePath)} (${visited.size} files scanned)`);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  console.error(`Missing baseline: ${relative(baselinePath)}`);
  process.exit(2);
}

let baseline;
try {
  baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
} catch (error) {
  console.error(`Invalid baseline: ${error.message}`);
  process.exit(2);
}
if (!Array.isArray(baseline) || baseline.some(item => typeof item !== 'string')) {
  console.error('Invalid baseline: expected an array of source paths');
  process.exit(2);
}

const expected = [...new Set(baseline)].sort();
const added = current.filter(file => !expected.includes(file));
const stale = expected.filter(file => !current.includes(file));
if (added.length || stale.length) {
  if (added.length) console.error(`New reachable ungated fabrication markers:\n${added.map(file => `  + ${file}`).join('\n')}`);
  if (stale.length) console.error(`Stale baseline entries (remove them to ratchet down):\n${stale.map(file => `  - ${file}`).join('\n')}`);
  process.exit(1);
}

console.log(`Fabrication ratchet clean: ${current.length} baselined findings, ${visited.size} files scanned`);
