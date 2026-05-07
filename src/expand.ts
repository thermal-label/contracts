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

function isMultiEngine(entry: DeviceEntry): boolean {
  return entry.engines.length > 1;
}

function singleEngineProtocol(entry: DeviceEntry): string | undefined {
  if (isMultiEngine(entry)) return undefined;
  const eng = entry.engines[0];
  return eng?.protocol;
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
  if (present.size === 0) return 'unverified';
  for (const r of ranking) if (present.has(r)) return r;
  return 'unverified';
}

/**
 * Expand a registry's `verifications` blocks into a derived grid per
 * device.
 *
 * Propagation rules (per the foundation plan):
 *  - Only `'verified'` triggers propagation.
 *  - Sibling-protocol vector: single-engine devices sharing
 *    `engines[0].protocol` lift each other's matching transport to
 *    `'expected'`.
 *  - Cross-transport vector: a `'verified'` cell on any one transport
 *    of a device lifts that device's other declared transports to
 *    `'expected'`.
 *  - `'partial'` does not propagate.
 *  - Direct `'partial'` and `'unsupported'` beat propagated
 *    `'expected'` (observation beats inference).
 *  - Multi-engine devices skip propagation entirely (forward-compatible
 *    carve-out — engine-aware grid can lift this later).
 *  - Single-transport devices trivially no-op the cross-transport
 *    vector.
 *  - Per-repo only — protocol keys are scoped to the driver.
 */
export function expandVerifications(registry: DeviceRegistry): ExpandedRegistry {
  // Index `verified` cells by (protocol, transport) for the
  // sibling-protocol vector. Multi-engine devices are excluded —
  // their protocol-on-transport mapping is ambiguous.
  const verifiedByProtoTransport = new Map<
    string,
    { deviceKey: string; transport: TransportType }[]
  >();
  for (const device of registry.devices) {
    if (isMultiEngine(device)) continue;
    const proto = singleEngineProtocol(device);
    if (!proto) continue;
    const v: DeviceVerifications | undefined = device.verifications;
    if (!v) continue;
    for (const transport of declaredTransports(device)) {
      const cell = v[transport];
      if (cell?.status === 'verified') {
        const k = `${proto}␞${transport}`;
        let bucket = verifiedByProtoTransport.get(k);
        if (!bucket) {
          bucket = [];
          verifiedByProtoTransport.set(k, bucket);
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

    // Pass 2: propagation. Skip for multi-engine devices entirely.
    if (!isMultiEngine(device)) {
      const proto = singleEngineProtocol(device);
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

        // Sibling-protocol vector — only if this device has a single
        // engine with a known protocol.
        if (proto) {
          const k = `${proto}␞${transport}`;
          const siblings = verifiedByProtoTransport.get(k);
          if (siblings) {
            for (const s of siblings) {
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
    } else {
      // Multi-engine: no propagation. Fill remaining declared
      // transports as `unverified`.
      for (const transport of transports) {
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
