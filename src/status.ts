import type { MediaDescriptor } from './media.js';

/**
 * Options for a single `PrinterAdapter.print()` call.
 *
 * Drivers may extend this with family-specific fields; structural typing
 * accepts any superset wherever `PrintOptions` is consumed.
 */
export interface PrintOptions {
  /** Number of copies to print. Default 1. */
  copies?: number;

  /**
   * Driver-specific density setting.
   *
   * Common values: `'light'`, `'normal'`, `'dark'`. Some drivers support
   * additional values such as `'medium'` or `'high'`. Drivers throw
   * `UnsupportedOperationError` for unrecognised values.
   *
   * `'normal'` is universally supported across all drivers.
   */
  density?: string;

  /**
   * Engine to route to on multi-engine devices. Role name from
   * `printer.engines` (e.g. `'left'`, `'right'`, `'label'`, `'tape'`)
   * or `'auto'` to defer to firmware (where the protocol supports it).
   *
   * Default behaviour:
   * - Single-engine device — ignored.
   * - Multi-engine, protocol supports auto — defaults to `'auto'`.
   * - Multi-engine, protocol does not (e.g. LabelWriter Duo) —
   *   required; the driver throws `EngineRequiredError` when omitted.
   *
   * `'auto'` is a routing mode the protocol module interprets — the
   * registry does not store it. Whether a protocol supports auto is
   * implicit in whether its implementation exposes an auto-address
   * sentinel.
   */
  engine?: string;
}

/**
 * A single error reported by the printer.
 *
 * Use `code` for programmatic branching (e.g. showing an "out of paper"
 * dialog) and `message` for display.
 */
export interface PrinterError {
  /**
   * Machine-readable error code, e.g. `'no_media'`, `'cover_open'`,
   * `'cutter_jam'`. Driver-specific — document the full set in each
   * driver's README.
   */
  code: string;

  /** Human-readable error description, safe to show to the end user. */
  message: string;
}

/**
 * A driver-formatted diagnostic row.
 *
 * Drivers decode protocol-specific status fields (print density, head
 * voltage, labels remaining, ...) into pre-formatted `{label, value}`
 * pairs that a consumer renders verbatim — no consumer needs to know
 * any vendor field names. The driver owns formatting; the harness (or
 * any other consumer) renders any device blindly, with zero change
 * when a new model lands.
 */
export interface StatusDetail {
  /** Short label, e.g. `'Print density'`, `'Labels remaining'`. */
  label: string;

  /** Pre-formatted value, e.g. `'100%'`, `'47'`, `'0x1A1A'`. */
  value: string;

  /**
   * Severity hint — drives row colour where the consumer renders it.
   * Defaults to `'info'` when omitted.
   */
  severity?: 'info' | 'warn' | 'error';
}

/**
 * Runtime status of a printer.
 *
 * Returned by `PrinterAdapter.getStatus()` and used to drive media
 * auto-detection in subsequent `print()` / `createPreview()` calls.
 */
export interface PrinterStatus {
  /** Printer is ready to accept a print job. */
  ready: boolean;

  /** Media is loaded (only meaningful if the printer supports detection). */
  mediaLoaded: boolean;

  /**
   * Detected media descriptor, if the printer supports detection.
   *
   * Undefined if the printer cannot detect media (e.g. LabelWriter 450,
   * LabelManager) or no status has been queried yet.
   *
   * When present, this is what `PrinterAdapter.print()` and
   * `PrinterAdapter.createPreview()` use as the default when no explicit
   * media is provided.
   */
  detectedMedia?: MediaDescriptor;

  /**
   * Structured error list. Empty array = no errors.
   *
   * Use `PrinterError.code` for programmatic branching and
   * `PrinterError.message` for display.
   */
  errors: PrinterError[];

  /**
   * Raw status bytes from the printer.
   *
   * Exposed for diagnostics and debugging — higher-level fields on this
   * interface should be preferred for normal use.
   */
  rawBytes: Uint8Array;

  /**
   * Driver-formatted diagnostic rows decoded from the protocol status.
   *
   * Optional and additive — drivers that decode nothing beyond
   * `ready` / `mediaLoaded` / `errors` leave it undefined. Each row is
   * a pre-formatted `{label, value}` pair the consumer renders
   * verbatim; the driver owns all formatting (see {@link StatusDetail}).
   */
  details?: readonly StatusDetail[];
}
