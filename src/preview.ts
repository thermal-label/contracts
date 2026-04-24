import type { LabelBitmap } from './bitmap.js';
import type { MediaDescriptor } from './media.js';

/**
 * Options for `PrinterAdapter.createPreview()`.
 *
 * Only `media?` is part of the contract — rendering knobs like threshold
 * and dithering are driver-specific concerns that belong on the driver's
 * own options, not on this cross-family interface.
 */
export interface PreviewOptions {
  /**
   * Override detected media. Use when:
   *
   * - the printer can't detect media (e.g. LabelWriter 450, LabelManager);
   * - designing offline for a specific media type;
   * - testing with a specific media configuration.
   *
   * If omitted, the driver uses detected media from the last
   * `getStatus()`. If no status is available and no override is
   * provided, the driver falls back to single-colour at its native head
   * width and sets `PreviewResult.assumed = true`.
   */
  media?: MediaDescriptor;
}

/**
 * A single colour plane in a preview.
 *
 * Single-colour drivers return exactly one plane. Two-colour drivers
 * return one plane per colour the printer physically produces.
 */
export interface PreviewPlane {
  /** Plane name, e.g. `'black'` or `'red'`. */
  name: string;

  /** The 1bpp bitmap for this plane. */
  bitmap: LabelBitmap;

  /**
   * CSS colour to display this plane in the preview UI, e.g.
   * `'#000000'` for black or `'#ff0000'` for red.
   *
   * The consuming app renders each plane in its own colour and
   * composites them — it does not need to know how the driver split
   * the colours.
   */
  displayColor: string;
}

/**
 * Result of `PrinterAdapter.createPreview()`.
 *
 * Contains one `PreviewPlane` per colour the printer would produce,
 * along with the media that was used (detected, overridden, or defaulted)
 * and an `assumed` flag indicating whether the preview is based on a
 * guess.
 */
export interface PreviewResult {
  /** One entry per colour plane the printer would produce. */
  planes: PreviewPlane[];

  /** The media used for this preview (detected, overridden, or defaulted). */
  media: MediaDescriptor;

  /**
   * True if the media was assumed/defaulted because detection wasn't
   * available and no override was provided.
   *
   * The consuming app MUST communicate this to the user, e.g.:
   * "Preview may differ from print — select media or connect printer
   * for accurate result."
   */
  assumed: boolean;
}
