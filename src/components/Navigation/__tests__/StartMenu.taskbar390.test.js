import { describe, expect, it } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';

// At 390 px the 250 px taskbar search box overlapped the clock and theme toggle.
const css = fs.readFileSync(path.join(process.cwd(), 'src/components/Navigation/StartMenu.css'), 'utf8');
const jsx = fs.readFileSync(path.join(process.cwd(), 'src/components/Navigation/StartMenu.jsx'), 'utf8');

describe('taskbar at phone width', () => {
  it('hides the search box at <= 480px', () => {
    const block = css.slice(css.indexOf('@media screen and (max-width: 480px)'));
    expect(block).toMatch(/\.search-container\s*\{\s*display:\s*none;\s*\}/);
  });

  it('keeps a Search entry in the Start menu so search stays reachable', () => {
    expect(jsx).toMatch(/name:\s*'Search'[\s\S]{0,80}path:\s*'\/search'/);
  });
});
