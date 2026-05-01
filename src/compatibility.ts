import type { PrintEngine } from './device.js';
import type { MediaDescriptor } from './media.js';

/**
 * Engine acceptance is described by `PrintEngine.mediaCompatibility`
 * (which media classes the head accepts) and media advertise which
 * device classes they fit via `MediaDescriptor.targetModels`. Both
 * are driver-defined string sets, matched as set intersection.
 *
 * Either side omitting its set means *unrestricted* on that side —
 * an engine without `mediaCompatibility` accepts every media in the
 * driver's registry, and media without `targetModels` fits every
 * device in the family.
 */
type EngineCompat = Pick<PrintEngine, 'mediaCompatibility'>;

/**
 * Returns `true` iff the media is compatible with the engine.
 *
 * Rule: if either side omits its set, the other is unrestricted →
 * true. Otherwise, compatible iff the two sets intersect.
 *
 * Pure function over the registry shapes — no I/O, no runtime state.
 */
export function mediaCompatibleWith(media: MediaDescriptor, engine: EngineCompat): boolean {
  const eng = engine.mediaCompatibility;
  const mod = media.targetModels;
  if (eng === undefined || mod === undefined) return true;
  return eng.some(t => mod.includes(t));
}

/**
 * Filter a media list to entries this engine accepts.
 *
 * Used by docs to render the per-device "supported media" table and
 * by frontend pickers to scope the media selector to what the
 * connected printer can print.
 */
export function compatibleMediaFor(
  engine: EngineCompat,
  media: readonly MediaDescriptor[],
): MediaDescriptor[] {
  return media.filter(m => mediaCompatibleWith(m, engine));
}

/**
 * Returns `true` iff two media descriptors describe the same
 * physical media.
 *
 * Strategy:
 * 1. If both `id` fields are non-null and equal, they are the same.
 * 2. Otherwise, fall back to dimension equality (`widthMm` and
 *    `heightMm`) — covers the common case of comparing a
 *    detected-from-printer descriptor (id may be absent) against a
 *    registry entry.
 *
 * Apps use this for "is the loaded media the one I selected?" — what
 * to *do* on mismatch (silent print, confirm, refuse) is the app's
 * call. The contracts library does not enforce a policy.
 */
export function mediaIdentitiesMatch(a: MediaDescriptor, b: MediaDescriptor): boolean {
  if (a.id === b.id) return true;
  return a.widthMm === b.widthMm && a.heightMm === b.heightMm;
}
