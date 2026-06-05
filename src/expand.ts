/**
 * Pure expansion of a per-driver `DeviceRegistry` into an
 * `ExpandedRegistry` whose grid carries effective per-cell status —
 * direct observations plus the two propagation vectors documented in
 * `plans/backlog/00-verification-foundation.md`.
 *
 * Called by each driver's `compile-data.mjs` after validation. The
 * function is per-repo: protocol keys (`engines[].protocol`) are
 * scoped to the driver, and no cross-driver lifting happens here.
 */

import type { DeviceEntry, DeviceRegistry, TransportType } from './device.js';
import type {
  DeviceVerifications,
  EffectiveStatus,
  ExpandedCell,
  SupportStatus,
} from './verifications.js';

/** Provenance entry on an `'expected'` cell. */
type Provenance = NonNullable<ExpandedCell['propagatedFrom']>[number];

/**
 * Per-device expanded grid: `transport → ExpandedCell`. Only
 * transports the device declares appear; any cell with no direct
 * observation and no propagation lift surfaces as
 * `{ status: 'unverified' }`.
 */
export type ExpandedVerificationGrid = Partial<Record<TransportType, ExpandedCell>>;

/**
 * One device after expansion: original entry plus the derived grid
 * and the rolled-up `supportStatus` (worst-case across declared
 * transports, mapped to `EffectiveStatus`).
 */
export interface ExpandedDeviceEntry extends DeviceEntry {
  verificationGrid: ExpandedVerificationGrid;
  supportStatus: EffectiveStatus;
}

/** Registry projection emitted by `expandVerifications`. */
export interface ExpandedRegistry extends Omit<DeviceRegistry, 'devices'> {
  devices: readonly ExpandedDeviceEntry[];
}

const TRANSPORT_KEYS: readonly TransportType[] = [
  'usb',
  'tcp',
  'serial',
  'bluetooth-spp',
  'bluetooth-gatt',
];

function declaredTransports(entry: DeviceEntry): readonly TransportType[] {
  return TRANSPORT_KEYS.filter(t => entry.transports[t] !== undefined);
}

/**
 * Canonical propagation key for a device: its engine protocols, sorted
 * and joined. Single-engine devices reduce to the bare protocol (so the
 * sibling-protocol vector is unchanged); multi-engine devices match only
 * when their *entire* engine set agrees (`label:lw-raster + tape:d1-tape`
 * Duos lift each other, but never a `left/right:lw-raster` Twin Turbo).
 * Returns `undefined` if any engine lacks a protocol or there are none.
 */
function engineSignature(entry: DeviceEntry): string | undefined {
  const protos = entry.engines.map(e => e.protocol);
  if (protos.length === 0 || protos.some(p => !p)) return undefined;
  return [...protos].sort().join('+');
}

/**
 * Roll up a per-transport grid to a single device-level
 * `EffectiveStatus`. Worst-case ranking, with `'unsupported'` and
 * `'partial'` beating `'expected'` and `'verified'`; `'unverified'`
 * is the floor when nothing is recorded.
 */
function rollupStatus(grid: ExpandedVerificationGrid): EffectiveStatus {
  // Order: most-severe-first. First match wins.
  const ranking: readonly EffectiveStatus[] = [
    'unsupported',
    'partial',
    'verified',
    'expected',
    'unverified',
  ];
  const present = new Set<EffectiveStatus>();
  for (const cell of Object.values(grid)) {
    present.add(cell.status);
  }
  // First match wins. An empty grid (a device declaring zero
  // transports) finds nothing and falls through to `unverified`.
  return ranking.find(r => present.has(r)) ?? 'unverified';
}

/**
 * Expand a registry's `verifications` blocks into a derived grid per
 * device.
 *
 * Propagation rules (per the foundation plan):
 *  - Only `'verified'` triggers propagation.
 *  - Sibling-protocol vector: devices sharing a canonical engine
 *    signature (sorted engine protocols, see `engineSignature`) lift
 *    each other's matching transport to `'expected'`. Single-engine
 *    devices match on their lone protocol; multi-engine devices match
 *    only when their full engine set agrees.
 *  - Cross-transport vector: a `'verified'` cell on any one transport
 *    of a device lifts that device's other declared transports to
 *    `'expected'`.
 *  - `'partial'` does not propagate.
 *  - Direct `'partial'` and `'unsupported'` beat propagated
 *    `'expected'` (observation beats inference).
 *  - Single-transport devices trivially no-op the cross-transport
 *    vector.
 *  - Per-repo only — protocol keys are scoped to the driver.
 */
export function expandVerifications(registry: DeviceRegistry): ExpandedRegistry {
  // Index `verified` cells by (engine-signature, transport) for the
  // sibling-protocol vector. Multi-engine devices participate only when
  // their full engine set matches another device's (see engineSignature).
  const verifiedBySigTransport = new Map<
    string,
    { deviceKey: string; transport: TransportType }[]
  >();
  for (const device of registry.devices) {
    const sig = engineSignature(device);
    if (!sig) continue;
    const v: DeviceVerifications | undefined = device.verifications;
    if (!v) continue;
    for (const transport of declaredTransports(device)) {
      const cell = v[transport];
      if (cell?.status === 'verified') {
        const k = `${sig}␞${transport}`;
        let bucket = verifiedBySigTransport.get(k);
        if (!bucket) {
          bucket = [];
          verifiedBySigTransport.set(k, bucket);
        }
        bucket.push({ deviceKey: device.key, transport });
      }
    }
  }

  const expandedDevices: ExpandedDeviceEntry[] = registry.devices.map(device => {
    const transports = declaredTransports(device);
    const grid: ExpandedVerificationGrid = {};
    const v: DeviceVerifications | undefined = device.verifications;

    // Pass 1: direct observations.
    for (const transport of transports) {
      const cell = v?.[transport];
      if (cell) {
        grid[transport] = { status: cell.status };
      }
    }

    // Pass 2: propagation. Applies to single- and multi-engine devices
    // alike — multi-engine devices simply key on their full engine set.
    const sig = engineSignature(device);
    const hasOwnVerifiedTransport = transports.some(t => v?.[t]?.status === 'verified');

    for (const transport of transports) {
      const direct = v?.[transport];
      // Direct partial/unsupported beats expected — already placed
      // in pass 1 with that status; do not overwrite.
      if (direct && (direct.status === 'partial' || direct.status === 'unsupported')) {
        continue;
      }
      // Direct verified — already placed; do not overwrite.
      if (direct?.status === 'verified') continue;

      const provenance: Provenance[] = [];

      // Sibling-protocol vector — match on the canonical engine signature.
      if (sig) {
        const k = `${sig}␞${transport}`;
        const siblings = verifiedBySigTransport.get(k);
        if (siblings) {
          for (const s of siblings) {
            /* v8 ignore next -- unreachable: a self-verified transport already continued at the direct-verified guard */
            if (s.deviceKey === device.key) continue;
            provenance.push({ vector: 'sibling-protocol', from: s });
          }
        }
      }

      // Cross-transport vector — only if some other declared
      // transport on this device is `verified`.
      if (hasOwnVerifiedTransport) {
        for (const otherT of transports) {
          if (otherT === transport) continue;
          if (v?.[otherT]?.status === 'verified') {
            provenance.push({
              vector: 'cross-transport',
              from: { deviceKey: device.key, transport: otherT },
            });
          }
        }
      }

      if (provenance.length > 0) {
        grid[transport] = {
          status: 'expected',
          propagatedFrom: provenance,
        };
      } else {
        grid[transport] ??= { status: 'unverified' };
      }
    }

    return {
      ...device,
      verificationGrid: grid,
      supportStatus: rollupStatus(grid),
    };
  });

  return {
    ...registry,
    devices: expandedDevices,
  };
}

/**
 * Map a legacy `DeviceSupport.status` value to a stored
 * `SupportStatus`. Returns `undefined` for `'untested'` (= absent in
 * the new shape).
 */
export function mapLegacyStatus(
  legacy: 'verified' | 'partial' | 'broken' | 'untested' | undefined,
): SupportStatus | undefined {
  switch (legacy) {
    case 'verified':
      return 'verified';
    case 'partial':
      return 'partial';
    case 'broken':
      return 'unsupported';
    case 'untested':
    case undefined:
      return undefined;
  }
}
