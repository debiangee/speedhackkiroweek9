import { it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
it('migration clears only owned legacy caches and does not intercept any requests', async () => {
  const listeners = new Map<string, (event: { waitUntil: (p: Promise<unknown>) => void }) => void>();
  const remove = vi.fn().mockResolvedValue(true);
  const claim = vi.fn().mockResolvedValue(undefined);
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { addEventListener: (name: string, fn: typeof listeners extends Map<string, infer F> ? F : never) => listeners.set(name, fn), skipWaiting: vi.fn(), clients: { claim } },
    caches: { keys: async () => ['ulanba-v1', 'weather-lang-old', 'another-app'], delete: remove },
  });
  let activation: Promise<unknown> | undefined;
  listeners.get('activate')!({ waitUntil: p => { activation = p; } });
  await activation;
  expect(remove.mock.calls.map(c => c[0])).toEqual(['ulanba-v1', 'weather-lang-old']);
  expect(listeners.has('fetch')).toBe(false);
  expect(claim).toHaveBeenCalledOnce();
});
