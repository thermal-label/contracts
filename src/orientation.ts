import type { MediaDescriptor } from './media.js';

/**
 * Direction the printer family rotates landscape input.
 *
 * `90` = clockwise, `270` = counter-clockwise. Each driver picks the
 * value that matches its head/leading-edge geometry — confirm once on
 * hardware with a die-cut "F" landscape print, then export the constant
 * from the driver core.
 */
export type RotateDirection = 90 | 270;

/**
 * Pick the rotation value to pass to `renderImage` / `renderMultiPlaneImage`.
 *
 * Pure function — no IO, no driver state. The driver supplies its
 * family-specific rotation direction; this helper combines that with
 * the media's `defaultOrientation` hint and the caller's optional
 * override to produce a single rotation angle.
 *
 * Decision table:
 *
 * - `override` is set (and not `'auto'`) → returned verbatim.
 * - media `defaultOrientation === 'horizontal'` and image is landscape
 *   (`width > height`) → return `familyDirection`.
 * - everything else → `0` (pass through).
 *
 * @param image            Source image dimensions.
 * @param media            Resolved media descriptor.
 * @param familyDirection  Driver family's rotation direction.
 * @param override         Caller's per-print override. `'auto'` means
 *                         "use the heuristic" (same as omitted).
 */
export function pickRotation(
  image: { width: number; height: number },
  media: MediaDescriptor,
  familyDirection: RotateDirection,
  override?: 'auto' | 0 | 90 | 180 | 270,
): 0 | 90 | 180 | 270 {
  if (override !== undefined && override !== 'auto') return override;
  const isLandscape = image.width > image.height;
  if (media.defaultOrientation === 'horizontal' && isLandscape) {
    return familyDirection;
  }
  return 0;
}
