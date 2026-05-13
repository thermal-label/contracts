import { describe, expect, it, vi } from 'vitest';
import type { PrinterStatus } from '../index.js';
import { DEFAULT_POLLING_INTERVAL_MS, pollingOnStatus } from '../index.js';

const READY_STATUS: PrinterStatus = {
  ready: true,
  mediaLoaded: true,
  errors: [],
  rawBytes: new Uint8Array(),
};

declare const setTimeout: (cb: () => void, ms: number) => unknown;

function wait(ms: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

describe('pollingOnStatus', () => {
  it('exports the documented default interval (4 s)', () => {
    expect(DEFAULT_POLLING_INTERVAL_MS).toBe(4000);
  });

  it('fires an immediate getStatus on subscribe', async () => {
    const getStatus = vi.fn().mockResolvedValue(READY_STATUS);
    const cb = vi.fn();
    const unsub = pollingOnStatus({ getStatus }, cb);
    // Immediate kick — wait one tick for the promise chain.
    await wait(0);
    expect(getStatus).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(READY_STATUS);
    unsub();
  });

  it('polls at the custom interval (real timers, short)', async () => {
    const getStatus = vi.fn().mockResolvedValue(READY_STATUS);
    const cb = vi.fn();
    const unsub = pollingOnStatus({ getStatus }, cb, 30);
    // Immediate + at least two ticks within 100 ms.
    await wait(100);
    unsub();
    expect(getStatus.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('unsubscribe stops further polls', async () => {
    const getStatus = vi.fn().mockResolvedValue(READY_STATUS);
    const cb = vi.fn();
    const unsub = pollingOnStatus({ getStatus }, cb, 20);
    await wait(0); // immediate kick
    const callsBeforeUnsub = getStatus.mock.calls.length;
    unsub();
    await wait(80);
    // No new calls after unsubscribe (allow the in-flight one to settle).
    expect(getStatus.mock.calls.length).toBe(callsBeforeUnsub);
  });

  it('swallows getStatus rejections without breaking the timer', async () => {
    const getStatus = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(READY_STATUS);
    const cb = vi.fn();
    const unsub = pollingOnStatus({ getStatus }, cb, 25);
    await wait(80);
    unsub();
    // First call rejected, no cb yet; second call resolves and fires cb.
    expect(getStatus.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(cb).toHaveBeenCalledWith(READY_STATUS);
  });

  it('skips overlapping ticks while a poll is in flight', async () => {
    // `resolveFirst` is assigned inside the first mockImplementation
    // call. ESLint's flow analysis doesn't see the indirect mutation
    // through the closure so it flags the post-await read as
    // always-null; disable for this block.
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    let resolveFirst: ((s: PrinterStatus) => void) | null = null;
    let callCount = 0;
    const getStatus = vi.fn().mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return new Promise<PrinterStatus>(resolve => {
          resolveFirst = resolve;
        });
      }
      return Promise.resolve(READY_STATUS);
    });
    const cb = vi.fn();
    const unsub = pollingOnStatus({ getStatus }, cb, 20);
    // Let several intervals fire while the first call is still pending.
    await wait(100);
    // Still only one call started (the in-flight guard skipped the rest).
    expect(getStatus).toHaveBeenCalledTimes(1);
    // Resolve the first call; the next interval can now run.
    if (resolveFirst !== null) {
      (resolveFirst as (s: PrinterStatus) => void)(READY_STATUS);
    }
    await wait(60);
    unsub();
    expect(getStatus.mock.calls.length).toBeGreaterThanOrEqual(2);
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */
  });
});
