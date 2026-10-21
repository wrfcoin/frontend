#!/usr/bin/env node
/**
 * Design System Usage Report
 *
 * Counts imports from each UI source to track migration progress
 * toward the canonical @/components/DesignSystem.
 *
 * Usage:
 *   node scripts/design-system-report.mjs [--verbose] [--json] [--fail-threshold N]
 *
 * Flags:
 *   --verbose          List every file per category
 *   --json             Output machine-readable JSON (for CI)
 *   --fail-threshold N Exit non-zero if Bootstrap file count exceeds N
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SRC_DIR = new URL('../src', import.meta.url).pathname;
const VERBOSE = process.argv.includes('--verbose');
const JSON_MODE = process.argv.includes('--json');

const thresholdIdx = process.argv.indexOf('--fail-threshold');
const FAIL_THRESHOLD = thresholdIdx !== -1 ? parseInt(process.argv[thresholdIdx + 1], 10) : null;

const EXT_RE = /\.(tsx?|jsx?)$/;

const counters = {
  designSystem: { files: new Set(), label: 'DesignSystem imports' },
  uiTokens: { files: new Set(), label: 'ui/tokens imports' },
  uiComponents: { files: new Set(), label: 'ui/ component imports' },
  commonLegacy: { files: new Set(), label: 'common/ legacy imports' },
  directMui: { files: new Set(), label: 'Direct MUI wrapped-component imports' },
  bootstrapClasses: { files: new Set(), label: 'Bootstrap className usage' },
};

const DESIGN_SYSTEM_RE = /from\s+['"].*\/DesignSystem['"\/]/;
const UI_TOKENS_RE = /from\s+['"].*\/ui\/tokens(?:-compat)?['"]/;
const UI_COMPONENTS_RE = /from\s+['"].*\/ui\/(?!tokens)[\w]+['"]/;
const COMMON_LEGACY_RE = /from\s+['"].*\/common\/(?:Button|Card|CustomComponents)['"]/;
const DIRECT_MUI_RE = /from\s+['"]@mui\/material\/(?:Button|Card|Chip|TextField|Tooltip|Alert|Skeleton|Dialog|Tabs)['"]/;
// Actual Bootstrap CSS framework compound-class patterns.
// Requires Bootstrap's characteristic two-class combos (btn btn-*, alert alert-*)
// or unique single-class names (form-control, navbar, nav-tabs, etc.)
// Avoids false positives from custom CSS (action-btn, wallet-card, status-badge).
const BOOTSTRAP_PATTERNS = [
  '(?<![\\w-])btn\\s+btn-',                             // btn btn-primary, btn btn-sm
  '(?<![\\w-])alert\\s+alert-',                          // alert alert-danger
  '(?<![\\w-])badge\\s+(?:badge-|bg-|text-bg-)',         // badge bg-primary (BS5)
  '(?<![\\w-])form-control(?![\\w-])',                    // form-control (standalone)
  '(?<![\\w-])form-select(?![\\w-])',                     // form-select
  '(?<![\\w-])form-check(?![\\w-])',                      // form-check
  '(?<![\\w-])input-group(?![\\w-])',                     // input-group
  '(?<![\\w-])modal-(?:dialog|content)(?![\\w-])',        // modal-dialog, modal-content
  '(?<![\\w-])navbar(?![\\w-])',                          // navbar
  '(?<![\\w-])nav-(?:tabs|pills)(?![\\w-])',              // nav-tabs, nav-pills
  '(?<![\\w-])dropdown-(?:menu|item|toggle)(?![\\w-])',   // dropdown-menu, etc.
  '(?<![\\w-])table-(?:striped|hover|bordered)(?![\\w-])', // Bootstrap table classes
].join('|');
const BOOTSTRAP_RE = new RegExp(
  `className=["'\`{].*?(?:${BOOTSTRAP_PATTERNS})`
);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'stories') continue;
      files.push(...await walk(full));
    } else if (EXT_RE.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function analyze(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const rel = relative(SRC_DIR, filePath);

  if (DESIGN_SYSTEM_RE.test(content)) counters.designSystem.files.add(rel);
  if (UI_TOKENS_RE.test(content)) counters.uiTokens.files.add(rel);
  if (UI_COMPONENTS_RE.test(content)) counters.uiComponents.files.add(rel);
  if (COMMON_LEGACY_RE.test(content)) counters.commonLegacy.files.add(rel);
  if (DIRECT_MUI_RE.test(content)) counters.directMui.files.add(rel);
  if (BOOTSTRAP_RE.test(content)) counters.bootstrapClasses.files.add(rel);
}

async function main() {
  const files = await walk(SRC_DIR);
  await Promise.all(files.map(analyze));

  const timestamp = new Date().toISOString();

  // JSON output mode
  if (JSON_MODE) {
    const result = {
      timestamp,
      totalFiles: files.length,
      metrics: {},
    };
    for (const [key, { label, files: fileSet }] of Object.entries(counters)) {
      result.metrics[key] = {
        label,
        count: fileSet.size,
        target: label.includes('DesignSystem') ? 'increase' : 'decrease',
        files: [...fileSet].sort(),
      };
    }
    console.log(JSON.stringify(result, null, 2));
  } else {
    // Human-readable output
    console.log('');
    console.log('Design System Usage Report');
    console.log('='.repeat(60));
    console.log(`Scanned ${files.length} source files under src/`);
    console.log(`Report generated: ${timestamp}`);
    console.log('');

    const rows = Object.values(counters);
    const maxLabel = Math.max(...rows.map(r => r.label.length));

    for (const { label, files: fileSet } of rows) {
      const count = String(fileSet.size).padStart(4);
      const direction = label.includes('DesignSystem') ? '(target: increase)' : '(target: decrease)';
      console.log(`  ${label.padEnd(maxLabel)}  ${count} files  ${direction}`);
    }
    console.log('');

    if (VERBOSE) {
      for (const { label, files: fileSet } of rows) {
        if (fileSet.size > 0) {
          console.log(`\n--- ${label} (${fileSet.size} files) ---`);
          for (const f of [...fileSet].sort()) {
            console.log(`  ${f}`);
          }
        }
      }
      console.log('');
    }
  }

  // Threshold check
  if (FAIL_THRESHOLD !== null) {
    const bootstrapCount = counters.bootstrapClasses.files.size;
    if (bootstrapCount > FAIL_THRESHOLD) {
      console.error(
        `FAIL: Bootstrap className usage (${bootstrapCount} files) exceeds threshold (${FAIL_THRESHOLD}).`,
      );
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
