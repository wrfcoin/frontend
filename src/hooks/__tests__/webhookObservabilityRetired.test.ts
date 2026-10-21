/** @jest-environment node */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// /api/webhooks is not a mounted backend family. The only caller was an
// unimported polling hook that kept stale rows on a failed read. It is retired
// rather than gated: no page may poll an unmounted webhook status endpoint.
function production(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (/__tests__|__mocks__|__fixtures__|stories/.test(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? production(path) : /\.[jt]sx?$/.test(path) && !/\.(test|spec)\./.test(path) ? [path] : [];
  });
}

describe('retired webhook observability polling', () => {
  it('has no hook file and no production reference to the unmounted webhooks family', () => {
    const root = join(process.cwd(), 'src');
    expect(existsSync(join(root, 'hooks/useWebhookObservability.ts'))).toBe(false);
    const offenders = production(root).filter(file => /useWebhookObservability|\/api\/webhooks/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
