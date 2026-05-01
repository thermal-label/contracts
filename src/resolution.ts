import type { DeviceEntry, DeviceRegistry, PrintEngine, TransportType } from './device.js';

/**
 * A `PrintEngine` enriched with whether the host runtime has a
 * registered protocol implementation for it. Returned per-engine by
 * `resolveSupportedDevices`.
 */
export interface EngineDescriptor extends PrintEngine {
  /** True iff `protocols` passed to the resolver included this engine's protocol. */
  drivable: boolean;
}

/**
 * A device entry resolved against the host runtime's protocol and
 * transport implementations.
 *
 * Only devices with at least one drivable transport AND at least one
 * drivable engine are returned by the resolver — anything fully
 * undrivable is filtered out.
 */
export interface SupportedDevice extends Omit<DeviceEntry, 'engines'> {
  /** Per-engine drivability info. */
  engines: readonly EngineDescriptor[];

  /** Transports the host runtime has implementations for. */
  drivableTransports: readonly TransportType[];

  /**
   * Transports the device declares but the host runtime does not
   * implement. Surface these as per-transport hints in the picker
   * ("via USB only — Bluetooth requires the web package"); the
   * device is still supported as long as `drivableTransports` is
   * non-empty.
   */
  undrivableTransports: readonly TransportType[];

  /**
   * `true` iff every engine on this device has a registered protocol
   * impl. Property of `(device, PROTOCOLS)` only — not affected by
   * which transports the host runtime exposes. Drives the "fully
   * supported by this driver" badge in pickers and docs.
   */
  allEnginesDrivable: boolean;
}

/**
 * Filter a registry down to the devices a host runtime can actually
 * drive, given the set of registered protocols and transport
 * implementations.
 *
 * Two dimensions, deliberately kept separate:
 *
 * - **Engine coverage** is a property of `(device, PROTOCOLS)` —
 *   stable per package version. Drives the "is this device supported
 *   by this driver" verdict (`allEnginesDrivable`).
 * - **Transport coverage** is a property of
 *   `(device, TRANSPORT_IMPLS)` — varies by host runtime. Surfaced
 *   as `drivableTransports` / `undrivableTransports`; consumers
 *   compose their own UI from the arrays.
 *
 * A device with usb + tcp + bluetooth-spp on a Node host without SPP
 * is *fully supported* in every sense the user cares about — the
 * missing SPP is a per-transport hint, not a device-level demotion.
 *
 * The resolver also filters out devices with zero drivable transports
 * or zero drivable engines — they cannot be opened or printed to from
 * this runtime, so there is nothing useful to surface.
 */
export function resolveSupportedDevices(
  registry: DeviceRegistry,
  protocols: ReadonlySet<string>,
  transports: ReadonlySet<TransportType>,
): SupportedDevice[] {
  return registry.devices.flatMap(dev => {
    const declaredTransports = (Object.keys(dev.transports) as TransportType[]).filter(
      t => dev.transports[t] !== undefined,
    );
    const drivableTransports = declaredTransports.filter(t => transports.has(t));
    const undrivableTransports = declaredTransports.filter(t => !transports.has(t));
    if (drivableTransports.length === 0) return [];

    const engines: EngineDescriptor[] = dev.engines.map(e => ({
      ...e,
      drivable: protocols.has(e.protocol),
    }));
    if (!engines.some(e => e.drivable)) return [];

    return [
      {
        ...dev,
        engines,
        drivableTransports,
        undrivableTransports,
        allEnginesDrivable: engines.every(e => e.drivable),
      },
    ];
  });
}
