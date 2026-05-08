import type { PrintEngine } from './device.js';
import type { MediaDescriptor } from './media.js';

/**
 * Chassis-physical dead-zone insets around the printable rectangle.
 *
 * Insets the printhead physically cannot reach — head-to-cutter
 * offsets, head-vs-tape-width geometry, sensor-window keep-outs.
 * Encoders consume this to crop / shift the bitmap so authored content
 * lands where the user expects.
 *
 * Distinct from `MediaDescriptor.printMargins` (per-media design-tool
 * inset, conservative of the chassis floor), from
 * `PrintEngine.forcedTrailingFeedMm` (post-print tape advance), and
 * from any wire-protocol "feed margin" command the firmware enacts on
 * its own (Brother QL/PT `ESC i d`).
 *
 * Field naming is print-direction-relative, not bitmap-coordinate-
 * relative — `leading` / `trailing` survive 90° rotations the driver
 * applies before encoding, where `top` / `bottom` would invert.
 */
export interface PrintableArea {
  /** Unprintable strip at the leading edge of the print, in mm. */
  readonly leading: number;
  /** Unprintable strip at the trailing edge of the print, in mm. */
  readonly trailing: number;
  /** Unprintable strip at the left side of the head, in mm. */
  readonly left: number;
  /** Unprintable strip at the right side of the head, in mm. */
  readonly right: number;
}

/**
 * The all-zero `PrintableArea` returned by `getPrintableArea` when
 * neither the engine nor the media carries dead-zone data.
 *
 * Frozen so callers can rely on referential identity if they choose to.
 */
export const ZERO_PRINTABLE_AREA: PrintableArea = Object.freeze({
  leading: 0,
  trailing: 0,
  left: 0,
  right: 0,
});

/**
 * Per-roll printable-area override surfaced by media that carries
 * physical dead-zone data of its own (today: the LabelWriter 5xx NFC
 * tag, whose `SkuInfo` exposes per-SKU `printableHorizontalOffsetMm`
 * and `printableVerticalOffsetMm`).
 *
 * Both fields are optional and additive on top of the base
 * `MediaDescriptor`. Drivers that don't carry per-roll truth simply
 * never populate them; `getPrintableArea(engine, media)` falls back
 * to the engine-level field and finally to zeros.
 *
 * The two-scalar shape mirrors the SkuInfo tag — a single inset on
 * each axis. The horizontal scalar is interpreted as `left` and the
 * vertical scalar as `leading`; `right` and `trailing` stay at the
 * engine-level values (or zero) because the tag does not encode them.
 */
export interface MediaPrintableAreaOverride {
  /**
   * Horizontal (head-axis) inset, in mm. Maps to `PrintableArea.left`.
   */
  readonly printableHorizontalOffsetMm?: number;
  /**
   * Vertical (feed-axis) inset, in mm. Maps to `PrintableArea.leading`.
   */
  readonly printableVerticalOffsetMm?: number;
}

/**
 * Resolve the chassis dead-zone for a print, with the standard
 * precedence: per-roll media tag (when present) > engine-level field >
 * zeros.
 *
 * The `media` argument is optional so the helper is usable from
 * encoders that haven't resolved a media yet (e.g. status probes).
 * When `media` carries `printableHorizontalOffsetMm` /
 * `printableVerticalOffsetMm`, those values override the matching
 * edges on the engine field; the unaffected edges (`right`,
 * `trailing`) keep their engine-level values.
 *
 * Always returns a fully-populated object — callers never need to
 * `?? 0` individual edges.
 */
export function getPrintableArea(engine: PrintEngine, media?: MediaDescriptor): PrintableArea {
  const fromEngine = engine.printableArea;
  const base: PrintableArea = fromEngine
    ? {
        leading: fromEngine.leading,
        trailing: fromEngine.trailing,
        left: fromEngine.left,
        right: fromEngine.right,
      }
    : { leading: 0, trailing: 0, left: 0, right: 0 };

  if (!media) {
    return fromEngine ? base : ZERO_PRINTABLE_AREA;
  }

  // Structural narrowing — drivers that ship per-roll truth (LW 5xx)
  // extend `MediaDescriptor` with these well-known field names. Other
  // media descriptors don't carry the keys, so the override is a no-op.
  const override = media as MediaDescriptor & MediaPrintableAreaOverride;
  const hasHorizontal = typeof override.printableHorizontalOffsetMm === 'number';
  const hasVertical = typeof override.printableVerticalOffsetMm === 'number';

  if (!hasHorizontal && !hasVertical) {
    return fromEngine ? base : ZERO_PRINTABLE_AREA;
  }

  return {
    leading: hasVertical ? override.printableVerticalOffsetMm : base.leading,
    trailing: base.trailing,
    left: hasHorizontal ? override.printableHorizontalOffsetMm : base.left,
    right: base.right,
  };
}

/**
 * Resolve the post-print forced trailing feed for an engine.
 *
 * Returns the engine's `forcedTrailingFeedMm` when set, `0` otherwise.
 * Distinct from the chassis dead-zone (`getPrintableArea`): this
 * scalar describes blank tape the printer (or this driver's encoder)
 * forces *after* the printed bitmap — cut-clearance feed, encoder-
 * emitted padding rows, etc.
 *
 * `0` legitimately means "no forced feed modelled" — drivers whose
 * firmware advances a variable amount (LabelWriter `ESC E` to next
 * tear bar, Brother autocut) leave the field empty so its zero
 * default surfaces.
 */
export function getForcedTrailingFeedMm(engine: PrintEngine): number {
  return engine.forcedTrailingFeedMm ?? 0;
}
