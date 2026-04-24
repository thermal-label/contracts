import { type MediaDescriptor } from './media.js';

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
}
