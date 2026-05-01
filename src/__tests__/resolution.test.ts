import { describe, expect, it } from 'vitest';

import type { DeviceEntry, DeviceRegistry, PrintEngine, TransportType } from '../index.js';
import { resolveSupportedDevices } from '../index.js';

const engine = (role: string, protocol: string, extra: Partial<PrintEngine> = {}): PrintEngine => ({
  role,
  protocol,
  dpi: 300,
  headDots: 672,
  ...extra,
});

const device = (
  key: string,
  transports: DeviceEntry['transports'],
  engines: readonly PrintEngine[],
): DeviceEntry => ({
  key,
  name: key,
  family: 'test',
  transports,
  engines,
  support: { status: 'untested' },
});

const registry = (devices: readonly DeviceEntry[]): DeviceRegistry => ({
  schemaVersion: 1,
  driver: 'test',
  devices,
});

const ALL: ReadonlySet<TransportType> = new Set<TransportType>(['usb', 'tcp', 'serial', 'bluetooth-spp', 'bluetooth-gatt']);

describe('resolveSupportedDevices', () => {
  it('returns single-engine device with allEnginesDrivable when protocol + transport match', () => {
    const reg = registry([
      device('LW_450', { usb: { vid: '0x0922', pid: '0x0020' } }, [engine('primary', 'lw-450')]),
    ]);
    const result = resolveSupportedDevices(reg, new Set(['lw-450']), ALL);
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('LW_450');
    expect(result[0]?.engines).toHaveLength(1);
    expect(result[0]?.engines[0]?.drivable).toBe(true);
    expect(result[0]?.allEnginesDrivable).toBe(true);
    expect(result[0]?.drivableTransports).toEqual(['usb']);
    expect(result[0]?.undrivableTransports).toEqual([]);
  });

  it('filters out devices with no drivable transport', () => {
    const reg = registry([
      device('NETWORK_ONLY', { tcp: { port: 9100 } }, [engine('primary', 'lw-450')]),
    ]);
    const result = resolveSupportedDevices(reg, new Set(['lw-450']), new Set(['usb']));
    expect(result).toEqual([]);
  });

  it('filters out devices with no drivable engine', () => {
    const reg = registry([
      device('UNKNOWN', { usb: { vid: '0x0', pid: '0x0' } }, [engine('primary', 'unknown-proto')]),
    ]);
    const result = resolveSupportedDevices(reg, new Set(['lw-450']), ALL);
    expect(result).toEqual([]);
  });

  it('returns multi-engine device with mixed drivability when only some protocols are registered', () => {
    const reg = registry([
      device('DUO', { usb: { vid: '0x0922', pid: '0x0023' } }, [
        engine('label', 'lw-450', { bind: { usb: { bInterfaceNumber: 0 } } }),
        engine('tape', 'd1-tape', { bind: { usb: { bInterfaceNumber: 1 } } }),
      ]),
    ]);
    const result = resolveSupportedDevices(reg, new Set(['lw-450']), ALL);
    expect(result).toHaveLength(1);
    const drivable = result[0]?.engines.find((e) => e.role === 'label');
    const undrivable = result[0]?.engines.find((e) => e.role === 'tape');
    expect(drivable?.drivable).toBe(true);
    expect(undrivable?.drivable).toBe(false);
    expect(result[0]?.allEnginesDrivable).toBe(false);
  });

  it('records both drivable and undrivable transports without demoting allEnginesDrivable', () => {
    const reg = registry([
      device(
        'QL_820NWB',
        {
          usb: { vid: '0x04f9', pid: '0x209d' },
          tcp: { port: 9100 },
          'bluetooth-spp': { namePrefix: 'QL-820' },
        },
        [engine('primary', 'ql-raster')],
      ),
    ]);
    const result = resolveSupportedDevices(reg, new Set(['ql-raster']), new Set(['usb', 'tcp']));
    expect(result).toHaveLength(1);
    expect(result[0]?.drivableTransports).toEqual(['usb', 'tcp']);
    expect(result[0]?.undrivableTransports).toEqual(['bluetooth-spp']);
    // allEnginesDrivable is property of (device, PROTOCOLS) only — runtime
    // missing one transport does not demote it.
    expect(result[0]?.allEnginesDrivable).toBe(true);
  });

  it('preserves device-entry fields on the resolved descriptor', () => {
    const reg = registry([
      device('LW_450', { usb: { vid: '0x0922', pid: '0x0020' } }, [engine('primary', 'lw-450')]),
    ]);
    const result = resolveSupportedDevices(reg, new Set(['lw-450']), ALL);
    expect(result[0]?.name).toBe('LW_450');
    expect(result[0]?.family).toBe('test');
    expect(result[0]?.support.status).toBe('untested');
  });
});
