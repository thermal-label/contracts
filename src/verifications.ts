/**
 * Per-cell verification grid: stored evidence + derived effective view.
 *
 * Authoring shape (`DeviceVerifications`) records what a maintainer has
 * directly observed per (transport) cell. The expansion pass
 * (`expandVerifications` in `./expand.js`) reads it together with the
 * device's transport and engine declarations to produce an
 * `ExpandedRegistry` whose grid carries the *effective* status —
 * including `'expected'` cells lifted from sibling protocols and
 * cross-transport propagation, and `'unverified'` for cells that
 * carry no claim.
 *
 * Stored vs derived:
 *  - `SupportStatus` is the closed set of *stored* rungs.
 *  - `EffectiveStatus` is the open set surfaced after expansion —
 *    superset that adds `'expected'` (inferred) and `'unverified'`
 *    (no claim).
 */

import type { TransportType } from './device.js';

/**
 * Stored verification rung — what a maintainer has directly observed.
 *
 * - `'verified'` — known-good against a recent reporter.
 * - `'partial'` — works for some operations / paths but not all.
 *   Transport- or context-specific by nature; does not propagate.
 * - `'unsupported'` — known-broken; do not promise support. Beats any
 *   `'expected'` from propagation.
 */
export type SupportStatus = 'verified' | 'partial' | 'unsupported';

/**
 * Render-time status surfaced after `expandVerifications`.
 *
 * Adds two derived states on top of the stored rungs:
 *  - `'expected'` — inferred from sibling-protocol or cross-transport
 *    propagation. Never stored; computed each codegen run.
 *  - `'unverified'` — no claim has been recorded for this cell.
 */
export type EffectiveStatus = SupportStatus | 'expected' | 'unverified';

/**
 * One cell of the verification grid — direct observation against one
 * transport on one device.
 *
 * `issues` is bounded at 2 entries (codegen-enforced): one canonical
 * report, optionally one conflict-corroboration. Duplicate reports
 * link via GitHub's "linked issues" panel rather than growing the
 * array. Issue numbers are scoped to the driver's own repo (same
 * convention as `engines[].protocol`).
 */
export interface VerificationCell {
  status: SupportStatus;
  /** GitHub issue numbers, same-repo. Max 2 entries (codegen-enforced). */
  issues?: readonly number[];
  /** Short tagline; one line max. Convention-discouraged on `verified`. */
  reason?: string;
  /** ISO date (YYYY-MM-DD) of the latest report. Manually authored. */
  lastReported?: string;
}

/**
 * Per-device authoring block.
 *
 * Keys are `TransportType` values; only transports the device actually
 * declares should appear, and only when there is an observation worth
 * recording. Absent transport key = `'unverified'` (no claim).
 *
 * Engine-level verifications are deliberately not in this iteration —
 * forward-compatible to add an `engines` axis later without breaking
 * existing transport authoring.
 */
export type DeviceVerifications = Partial<Record<TransportType, VerificationCell>>;

/**
 * Derived per-cell view emitted by `expandVerifications`.
 *
 * `propagatedFrom` is present iff `status === 'expected'`. Each entry
 * names the verified cell that lifted this one and which propagation
 * vector did the lifting:
 *
 *  - `'sibling-protocol'` — same transport, different device, same
 *    `engines[].protocol` (single-engine devices only).
 *  - `'cross-transport'` — same device, a different transport carries
 *    a `verified` cell.
 *
 * UI consumers read this directly instead of reinventing provenance
 * lookup against the registry.
 */
export interface ExpandedCell {
  status: EffectiveStatus;
  propagatedFrom?: readonly {
    vector: 'sibling-protocol' | 'cross-transport';
    from: { deviceKey: string; transport: TransportType };
  }[];
}
