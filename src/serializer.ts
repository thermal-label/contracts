/**
 * A job-scoped write serializer for driver transport access.
 *
 * A printer driver issues transport I/O from several methods —
 * `print()` (a long burst of `transport.write()` calls), `getStatus()`
 * (a write + read round-trip), and driver-specific helpers. Nothing in
 * the transport layer orders those against each other: a status poll
 * firing mid-`print()` would interleave its `write()` between two
 * raster `write()`s and corrupt the device's command stream.
 *
 * `WriteSerializer` fixes that at the driver layer — the only layer
 * that knows job boundaries. Each driver holds one instance and routes
 * **every transport-touching method** through `run()`; calls then
 * execute strictly in submission order, each waiting for the prior one
 * to finish before touching the transport.
 *
 * It is exactly the hand-rolled `runLocked` pattern proven in the
 * brother-ql driver, lifted into one shared primitive so every driver
 * serialises identically rather than carrying its own copy.
 *
 * Like `polling-on-status.ts`, this module stays free of `@types/node`
 * and DOM globals — it only needs `Promise` — so the contracts type
 * surface stays platform-clean.
 *
 * Usage on a driver printer class:
 * ```ts
 * private readonly serializer = new WriteSerializer();
 *
 * print(image: RawImageData): Promise<void> {
 *   return this.serializer.run(() => this.doPrint(image));
 * }
 *
 * getStatus(): Promise<PrinterStatus> {
 *   return this.serializer.run(() => this.doGetStatus());
 * }
 * ```
 */
export class WriteSerializer {
  /**
   * Tail of the serialized chain. Each `run()` call chains onto this
   * promise and replaces it with its own completion promise, so the
   * next call awaits this one.
   */
  private tail: Promise<void> = Promise.resolve();

  /**
   * Run `fn` once every previously-submitted operation has finished.
   *
   * Concurrent callers queue and execute in submission order. The
   * caller receives `fn`'s resolved value, or its rejection — a
   * thrown/rejecting `fn` rejects only its own caller and does **not**
   * poison the lock: the next `run()` still proceeds.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    const prior = this.tail;
    /* v8 ignore start -- placeholder, always replaced synchronously by
       the Promise executor below */
    let release: () => void = () => {
      // Replaced synchronously below.
    };
    /* v8 ignore stop */
    this.tail = new Promise<void>(resolve => {
      release = resolve;
    });
    try {
      // Wait for the prior operation; swallow its rejection here so a
      // failed earlier job doesn't reject this caller — that caller
      // already saw its own rejection.
      await prior.catch(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
      return await fn();
    } finally {
      release();
    }
  }
}
