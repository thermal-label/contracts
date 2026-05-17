import { describe, expect, it } from 'vitest';
import { WriteSerializer } from '../index.js';

declare const setTimeout: (cb: () => void, ms: number) => unknown;

function wait(ms: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

describe('WriteSerializer', () => {
  it('executes interleaved run() calls strictly in submission order', async () => {
    const serializer = new WriteSerializer();
    const log: string[] = [];

    // Submit three jobs back-to-back. The first sleeps longest, so
    // without serialization it would finish last; with serialization
    // the recorded order must match submission order.
    const a = serializer.run(async () => {
      await wait(30);
      log.push('a');
    });
    const b = serializer.run(async () => {
      await wait(20);
      log.push('b');
    });
    const c = serializer.run(async () => {
      await wait(0);
      log.push('c');
    });

    await Promise.all([a, b, c]);
    expect(log).toEqual(['a', 'b', 'c']);
  });

  it('never overlaps two run() bodies', async () => {
    const serializer = new WriteSerializer();
    let active = 0;
    let maxActive = 0;

    const job = (): Promise<void> =>
      serializer.run(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await wait(10);
        active -= 1;
      });

    await Promise.all([job(), job(), job(), job()]);
    expect(maxActive).toBe(1);
  });

  it('resolves run() with the wrapped function value', async () => {
    const serializer = new WriteSerializer();
    await expect(serializer.run(() => Promise.resolve(42))).resolves.toBe(42);
  });

  it('rejects only the failing caller and keeps the lock usable', async () => {
    const serializer = new WriteSerializer();
    const log: string[] = [];

    const failing = serializer.run(async () => {
      await wait(10);
      log.push('failing');
      throw new Error('boom');
    });
    const next = serializer.run(async () => {
      await wait(0);
      log.push('next');
      return 'ok';
    });

    await expect(failing).rejects.toThrow('boom');
    // The next job still runs and resolves normally — the rejection
    // did not poison the lock.
    await expect(next).resolves.toBe('ok');
    // And it ran after the failing job, in submission order.
    expect(log).toEqual(['failing', 'next']);
  });

  it('a rejecting job does not reject the subsequent caller', async () => {
    const serializer = new WriteSerializer();

    // Swallow the rejection so it doesn't surface as unhandled.
    const failing = serializer.run(() => Promise.reject(new Error('boom')));
    failing.catch(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function

    await expect(serializer.run(() => Promise.resolve('survived'))).resolves.toBe('survived');
  });
});
