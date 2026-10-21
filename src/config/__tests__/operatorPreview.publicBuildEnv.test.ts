/**
 * frontend#348: VITE_ENABLE_OPERATOR_PREVIEW is for internal/staging builds
 * only. Nothing committed to this repository may turn it on — the public
 * release build must get it from nowhere. (Infra's build must additionally
 * assert it empty; that is infra's story, not checked here.)
 */
import { readdirSync, readFileSync } from 'node:fs';

const FLAG = 'VITE_ENABLE_OPERATOR_PREVIEW';

function committedEnvFiles(): string[] {
  return readdirSync('.').filter(name => /^\.env(\..+)?$/.test(name));
}

describe(`${FLAG} is never enabled by committed build config`, () => {
  it.each(committedEnvFiles())('%s leaves the flag unset or empty', file => {
    const assignments = readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.startsWith(`${FLAG}=`));
    for (const line of assignments) {
      expect(line).toBe(`${FLAG}=`);
    }
  });

  it('vite.config.js does not define or inject the flag', () => {
    expect(readFileSync('vite.config.js', 'utf8')).not.toContain(FLAG);
  });
});
