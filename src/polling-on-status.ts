import type { PrinterAdapter } from './adapter.js';
import type { PrinterStatus } from './status.js';

// Ambient declarations: the contracts package intentionally avoids
// pulling in @types/node / DOM globals so consumers of the type
// surface stay clean. The poll helper only needs the shape of
// `setInterval` / `clearInterval`, which is identical in browsers and
// Node, so we declare the minimal slice we use rather than depending
// on a host-environment type set.
declare const setInterval: (cb: () => void, ms: number) => unknown;
declare const clearInterval: (handle: unknown) => void;

/**
 * Default poll cadence used by `pollingOnStatus`. Picked to match the
 * harness shell's pre-refactor `setInterval` cadence so the visible
 * status-pill freshness stays the same.
 */
export const DEFAULT_POLLING_INTERVAL_MS = 4000;

/**
 * Build an `onStatus` implementation for drivers whose printers don't
 * push spontaneous status frames (LM / LW today; anything where
 * `getStatus()` is a discrete request/response cycle).
 *
 * Returns a function with the same shape as `PrinterAdapter.onStatus` —
 * subscribe a callback, get back an unsubscribe function. Internally
 * it kicks an immediate `getStatus()` so the subscriber resolves
 * quickly, then polls at `intervalMs` until the unsubscribe handle
 * fires.
 *
 * Errors during a poll are swallowed silently — a missed read keeps
 * the last-known status visible upstream rather than flickering the
 * pill on every transient timeout. The cadence matches the harness
 * shell's pre-plan-11 polling timer (4 s) so visible status freshness
 * is unchanged.
 *
 * Multi-subscriber: each call returns its own unsubscribe; the
 * underlying poll loop runs once per subscriber. Drivers that need a
 * shared loop should implement their own `onStatus` directly.
 *
 * Usage on a driver-web printer class:
 * ```ts
 * onStatus(cb: (s: PrinterStatus) => void): () => void {
 *   return pollingOnStatus(this, cb);
 * }
 * ```
 *
 * Per plan 11 §`onStatus` parity: lifting the harness's pull-side
 * timer into each driver collapses the shell's push-vs-pull branch
 * down to a single subscription path. Every driver looks like a
 * push driver to the shell.
 */
export function pollingOnStatus(
  printer: Pick<PrinterAdapter, 'getStatus'>,
  cb: (status: PrinterStatus) => void,
  intervalMs: number = DEFAULT_POLLING_INTERVAL_MS,
): () => void {
  let stopped = false;
  let inFlight = false;

  const tick = async (): Promise<void> => {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      const status = await printer.getStatus();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- `stopped` is closed-over mutable state; ESLint's flow analysis doesn't carry the mutation through the await suspension
      if (!stopped) cb(status);
    } catch {
      // Swallow — see the docstring. Missed poll keeps the last-known
      // status visible upstream.
    } finally {
      inFlight = false;
    }
  };

  // Immediate kick so the subscriber doesn't wait `intervalMs` for
  // its first frame.
  void tick();
  const handle = setInterval(() => {
    void tick();
  }, intervalMs);

  return () => {
    stopped = true;
    clearInterval(handle);
  };
}
