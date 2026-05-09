import type { PrinterAdapterMap } from './adapter.js';
import type { DeviceEntry, TransportType } from './device.js';

/**
 * Base class for transport-layer errors.
 *
 * Wraps a transport-specific failure with the `TransportType` it came
 * from, so callers can branch on transport (USB vs TCP vs BLE) without
 * string-matching error messages.
 */
export class TransportError extends Error {
  readonly transport: TransportType;

  constructor(message: string, transport: TransportType) {
    super(message);
    this.name = 'TransportError';
    this.transport = transport;
  }
}

/**
 * A read timed out waiting for bytes from the printer.
 */
export class TransportTimeoutError extends TransportError {
  constructor(transport: TransportType, timeoutMs: number) {
    super(`Read timed out after ${timeoutMs.toString()}ms`, transport);
    this.name = 'TransportTimeoutError';
  }
}

/**
 * The transport was closed while a read or write was in flight, or a
 * new operation was attempted on a closed transport.
 */
export class TransportClosedError extends TransportError {
  constructor(transport: TransportType) {
    super('Transport is closed', transport);
    this.name = 'TransportClosedError';
  }
}

/**
 * No device matching the requested filter was found on the host.
 *
 * When both `vid` and `pid` are provided, the message includes them in
 * hex for easier cross-referencing with the device registry.
 */
export class DeviceNotFoundError extends Error {
  constructor(vid?: number, pid?: number) {
    const message =
      vid !== undefined && pid !== undefined
        ? `No device found with VID=0x${vid.toString(16)} PID=0x${pid.toString(16)}`
        : 'No compatible device found';
    super(message);
    this.name = 'DeviceNotFoundError';
  }
}

/**
 * The requested operation is not supported by this driver, printer, or
 * media.
 *
 * Used by drivers to reject e.g. an unknown `PrintOptions.density` value,
 * a cut command on a printer without a cutter, or a two-colour image on
 * single-colour media.
 */
export class UnsupportedOperationError extends Error {
  constructor(operation: string, reason: string) {
    super(`${operation}: ${reason}`);
    this.name = 'UnsupportedOperationError';
  }
}

/**
 * `PrinterAdapter.print()` or `createPreview()` was called without a
 * media argument and no detected media was available.
 *
 * The caller must either pass `media` explicitly or call `getStatus()`
 * first so the adapter can cache a detected media descriptor.
 */
export class MediaNotSpecifiedError extends Error {
  constructor() {
    super(
      'No media specified and none detected. Provide media explicitly or call getStatus() first.',
    );
    this.name = 'MediaNotSpecifiedError';
  }
}

/**
 * `PrinterAdapter.print()` was called on a multi-engine device whose
 * protocol does not support firmware-side auto-routing, without an
 * explicit `engine` in `PrintOptions`.
 *
 * Thrown by drivers when `options.engine` is omitted on devices like
 * the LabelWriter Duo where the host has to pick a target engine
 * up-front. The list of valid roles is included so the caller can
 * surface a useful UX message.
 */
export class EngineRequiredError extends Error {
  /** Available engine roles on the connected device. */
  readonly availableEngines: readonly string[];

  constructor(availableEngines: readonly string[]) {
    super(
      `This printer has multiple engines and does not support auto-routing. Specify options.engine — one of: ${availableEngines.join(', ')}.`,
    );
    this.name = 'EngineRequiredError';
    this.availableEngines = availableEngines;
  }
}

/**
 * A driver-web `requestPrinters(opts)` factory opened the browser
 * picker and got a port/device back, but couldn't decide which
 * registry entry it corresponds to. The picker may have offered an
 * unidentifiable serial port (Web Serial doesn't expose BT device
 * names) or the picked USB device's VID/PID didn't match anything in
 * the driver's registry.
 *
 * The error carries the candidate registry entries (filtered to ones
 * declaring the connecting transport) and a `continueWith(deviceKey)`
 * closure that resumes the connect flow with the operator's choice —
 * no second picker open required, the original port/device is held
 * inside the closure.
 *
 * Harness-shell shape:
 * ```ts
 * try {
 *   return await adapter.requestPrinters({ transport });
 * } catch (err) {
 *   if (err instanceof DeviceIdentificationRequiredError) {
 *     const choice = await showDropdown(err.candidates);
 *     return await err.continueWith(choice);
 *   }
 *   throw err;
 * }
 * ```
 */
export class DeviceIdentificationRequiredError extends Error {
  readonly candidates: readonly DeviceEntry[];
  readonly continueWith: (deviceKey: string) => Promise<PrinterAdapterMap>;

  constructor(
    candidates: readonly DeviceEntry[],
    continueWith: (deviceKey: string) => Promise<PrinterAdapterMap>,
  ) {
    super(
      `Connected device could not be auto-identified. Caller must pick one of: ${candidates.map(c => c.key).join(', ')}.`,
    );
    this.name = 'DeviceIdentificationRequiredError';
    this.candidates = candidates;
    this.continueWith = continueWith;
  }
}
