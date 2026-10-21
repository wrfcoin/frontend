/**
 * Test double for the browser's Web Locks API (navigator.locks), which jsdom lacks. Like the browser's, one
 * manager is shared by every "tab" (agent) of the origin, and an exclusive lock runs its holders one at a time,
 * first come first served. Install one instance and every module instance that calls navigator.locks shares it.
 */
export function createWebLocksStub() {
  const tails = new Map<string, Promise<unknown>>();
  const granted: string[] = [];
  const request = <T>(
    name: string,
    optionsOrTask: LockOptions | (() => Promise<T>),
    maybeTask?: () => Promise<T>,
  ): Promise<T> => {
    const task = (typeof optionsOrTask === 'function' ? optionsOrTask : maybeTask) as () => Promise<T>;
    const previous = tails.get(name) ?? Promise.resolve();
    const run = previous.then(() => {
      granted.push(name);
      return task();
    });
    tails.set(name, run.catch(() => undefined));
    return run;
  };
  return { request, query: async () => ({ held: [], pending: [] }), granted } as unknown as LockManager & {
    granted: string[];
  };
}

export function installWebLocks(locks: LockManager | undefined): () => void {
  const nav = globalThis.navigator as Navigator & { locks?: LockManager };
  const had = Object.getOwnPropertyDescriptor(nav, 'locks');
  Object.defineProperty(nav, 'locks', { value: locks, configurable: true });
  return () => {
    if (had) Object.defineProperty(nav, 'locks', had);
    else delete (nav as { locks?: LockManager }).locks;
  };
}
