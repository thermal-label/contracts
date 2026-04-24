import { type RawImageData } from './bitmap.js';
import { type DeviceDescriptor } from './device.js';
import { type MediaDescriptor } from './media.js';
import { type PreviewOptions, type PreviewResult } from './preview.js';
import { type PrinterStatus, type PrintOptions } from './status.js';

/**
 * High-level printer interface implemented by each driver family.
 *
 * Consumers (CLIs, label-maker apps, ad-hoc scripts) program against
 * `PrinterAdapter` and don't need to know which driver is behind it.
 * Driver-specific features are available by extending this interface
 * in each `*-node` / `*-web` package.
 */
export interface PrinterAdapter {
  /** Driver family identifier, e.g. `'brother-ql'` or `'labelwriter'`. */
  readonly family: string;

  /** Human-readable model name from the driver's device registry. */
  readonly model: string;

  /** Whether the printer is currently connected. */
  readonly connected: boolean;

  /**
   * The device descriptor for the connected printer.
   *
   * Useful for logging, diagnostics, and displaying VID/PID. Undefined
   * if the connection was established without device matching (e.g. a
   * raw TCP connection to a known IP).
   */
  readonly device?: DeviceDescriptor;

  /**
   * Print from a full-colour RGBA image.
   *
   * The driver converts to its native format internally:
   *
   * - Single-colour drivers threshold/dither RGBA to 1bpp.
   * - Two-colour drivers check `media.colorCapable` and split planes
   *   if true.
   *
   * **Two-colour splitting:** the driver decides what constitutes each
   * colour. The contracts package does not define what "red" means —
   * that is driver-specific knowledge (e.g. brother-ql-core's
   * `isRedish()` heuristic).
   *
   * **Batch printing:** call `print()` once per label. The driver
   * handles job framing internally (e.g. Brother QL page-break commands
   * between sequential `print()` calls within the same session).
   *
   * @param image — full RGBA, typically from `designer.render()`.
   * @param media — which media to print on. Determines dimensions,
   *   margins, and colour mode. If omitted, uses detected media from
   *   the last `getStatus()`.
   * @param options — per-call options (copies, density, etc.).
   * @throws MediaNotSpecifiedError if no media is known.
   */
  print(image: RawImageData, media?: MediaDescriptor, options?: PrintOptions): Promise<void>;

  /**
   * Generate a preview showing how this printer would reproduce the
   * design on the given media. Returns separated 1bpp planes with
   * display colours.
   *
   * The driver uses its own colour-splitting logic (the same code that
   * `print()` uses internally) to produce the planes. The consuming app
   * renders whatever planes come back without needing to know the
   * splitting rules.
   *
   * For offline preview without a live connection, use the static
   * `createPreviewOffline()` function exported from the driver's
   * `*-core` package instead.
   *
   * @param image — full RGBA, typically from `designer.render()`.
   * @param options — optional media override. If media is omitted, uses
   *   detected media from the last `getStatus()`. If no status is
   *   available, the driver defaults to single-colour at the printer's
   *   native head width and sets `PreviewResult.assumed = true`.
   */
  createPreview(image: RawImageData, options?: PreviewOptions): Promise<PreviewResult>;

  /** Query printer status including detected media. */
  getStatus(): Promise<PrinterStatus>;

  /** Close the connection. Always call in `finally` blocks. */
  close(): Promise<void>;
}
