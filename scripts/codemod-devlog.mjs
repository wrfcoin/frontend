#!/usr/bin/env node
/**
 * Codemod: replace console.log() with devLog() from src/utils/logger
 * - Skips files that already use devLog
 * - Adds/updates import for each touched file
 * - Never touches console.error / console.warn
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../src');
const LOGGER_ABS = path.resolve(SRC_DIR, 'utils/logger');

function walk(dir, exts, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      walk(full, exts, results);
    } else if (exts.some(e => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function relImport(fromFile) {
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, LOGGER_ABS);
  if (!rel.startsWith('.')) rel = './' + rel;
  // normalise to forward slashes
  return rel.replace(/\\/g, '/');
}

let changed = 0, skipped = 0;

for (const file of walk(SRC_DIR, ['.ts', '.tsx', '.js', '.jsx'])) {
  let src = fs.readFileSync(file, 'utf8');

  if (!src.includes('console.log(')) { skipped++; continue; }

  // Replace all console.log( with devLog(
  const updated = src.replace(/console\.log\(/g, 'devLog(');

  const rel = relImport(file);

  // Escape for use in regex
  const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Patterns to detect existing logger import
  const existingLoggerRe = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${escaped}['"]`
  );
  const match = existingLoggerRe.exec(updated);

  let final;
  if (match) {
    const imports = match[1];
    if (imports.includes('devLog')) {
      // already has devLog
      final = updated;
    } else {
      // inject devLog into the existing import braces
      final = updated.replace(existingLoggerRe, (_, inner) => {
        return `import { ${inner.trim()}, devLog } from '${rel}'`;
      });
    }
  } else {
    // Find last import line and insert after it
    const lines = updated.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImport = i;
    }
    const insertLine = `import { devLog } from '${rel}';`;
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, insertLine);
    } else {
      lines.unshift(insertLine);
    }
    final = lines.join('\n');
  }

  fs.writeFileSync(file, final, 'utf8');
  changed++;
}

console.log(`codemod done: ${changed} files updated, ${skipped} files skipped`);
