/**
 * Base media descriptor.
 *
 * Each driver extends this with family-specific fields (print area dots,
 * margins, head geometry, etc.). Structural typing means any superset
 * passes cleanly to `PrinterAdapter` methods.
 *
 * @example
 * // Brother QL continuous tape
 * const m: MediaDescriptor = {
 *   id: 259,
 *   name: '62mm continuous',
 *   widthMm: 62,
 *   type: 'continuous',
 *   colorCapable: false,
 * };
 *
 * @example
 * // Brother QL two-colour tape
 * const m: MediaDescriptor = {
 *   id: 251,
 *   name: 'DK-22251 62mm',
 *   widthMm: 62,
 *   type: 'continuous',
 *   colorCapable: true,
 * };
 *
 * @example
 * // Die-cut address label
 * const m: MediaDescriptor = {
 *   id: 274,
 *   name: '62×29mm',
 *   widthMm: 62,
 *   heightMm: 29,
 *   type: 'die-cut',
 *   colorCapable: false,
 * };
 */
export interface MediaDescriptor {
  /** Unique identifier within the driver family. */
  id: string | number;

  /** Human-readable name, e.g. `"62mm continuous"` or `"DK-22251"`. */
  name: string;

  /** Physical width in mm. */
  widthMm: number;

  /**
   * Physical height/length in mm.
   *
   * - Undefined = continuous (variable length; printer cuts to content).
   * - A number = fixed length (die-cut labels, tape segments).
   */
  heightMm?: number;

  /**
   * Media type classification — driver-specific string values.
   *
   * Common values: `'continuous'`, `'die-cut'`, `'tape'`.
   * Drivers may define additional values as needed.
   */
  type: string;

  /**
   * Whether this media supports multi-colour printing.
   *
   * `false` for most media. `true` for e.g. Brother QL DK-22251
   * (black + red). The driver uses this to decide whether to split
   * colour planes.
   */
  colorCapable: boolean;
}
