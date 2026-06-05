import { describe, expect, it } from 'vitest';

import type { DeviceEntry, DeviceRegistry } from '../device.js';
import type { DeviceVerifications } from '../verifications.js';
import { expandVerifications, mapLegacyStatus } from '../expand.js';

function makeDevice(overrides: Partial<DeviceEntry> & Pick<DeviceEntry, 'key'>): DeviceEntry {
  return {
    name: overrides.key,
    family: 'driver-x',
    transports: { usb: { vid: '0x0001', pid: '0x0001' } },
    engines: [{ role: 'primary', protocol: 'proto-a', dpi: 300, headDots: 600 }],
    support: { status: 'untested' },
    ...overrides,
  };
}

function makeRegistry(devices: readonly DeviceEntry[]): DeviceRegistry {
  return { schemaVersion: 1, driver: 'driver-x', devices };
}

describe('expandVerifications', () => {
  it('returns `unverified` for every declared transport when no verifications block', () => {
    const reg = makeRegistry([
      makeDevice({
        key: 'A',
        transports: { usb: { vid: '0x1', pid: '0x1' }, tcp: { port: 9100 } },
      }),
    ]);
    const out = expandVerifications(reg);
    const a = out.devices[0]!;
    expect(a.verificationGrid).toEqual({
      usb: { status: 'unverified' },
      tcp: { status: 'unverified' },
    });
    expect(a.supportStatus).toBe('unverified');
  });

  it('records direct observations on the grid', () => {
    const verifications: DeviceVerifications = {
      usb: { status: 'verified', issues: [12] },
    };
    const reg = makeRegistry([makeDevice({ key: 'A', verifications })]);
    const out = expandVerifications(reg);
    expect(out.devices[0]!.verificationGrid.usb).toEqual({ status: 'verified' });
    expect(out.devices[0]!.supportStatus).toBe('verified');
  });

  describe('sibling-protocol vector', () => {
    it('lifts a same-protocol sibling on the same transport to `expected`', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          verifications: { usb: { status: 'verified' } },
        }),
        makeDevice({ key: 'B' }),
      ]);
      const out = expandVerifications(reg);
      const b = out.devices.find(d => d.key === 'B')!;
      expect(b.verificationGrid.usb?.status).toBe('expected');
      expect(b.verificationGrid.usb?.propagatedFrom).toEqual([
        { vector: 'sibling-protocol', from: { deviceKey: 'A', transport: 'usb' } },
      ]);
      expect(b.supportStatus).toBe('expected');
    });

    it('does not lift across different protocols', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          verifications: { usb: { status: 'verified' } },
        }),
        makeDevice({
          key: 'B',
          engines: [{ role: 'primary', protocol: 'proto-b', dpi: 300, headDots: 600 }],
        }),
      ]);
      const out = expandVerifications(reg);
      expect(out.devices.find(d => d.key === 'B')!.verificationGrid.usb?.status).toBe('unverified');
    });

    it('does not lift across different transports', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          transports: { usb: { vid: '0x1', pid: '0x1' } },
          verifications: { usb: { status: 'verified' } },
        }),
        makeDevice({
          key: 'B',
          transports: { tcp: { port: 9100 } },
        }),
      ]);
      const out = expandVerifications(reg);
      expect(out.devices.find(d => d.key === 'B')!.verificationGrid.tcp?.status).toBe('unverified');
    });
  });

  describe('cross-transport vector', () => {
    it('a verified cell lifts other declared transports on the same device', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          transports: {
            usb: { vid: '0x1', pid: '0x1' },
            tcp: { port: 9100 },
            serial: { defaultBaud: 115200 },
          },
          verifications: { usb: { status: 'verified' } },
        }),
      ]);
      const out = expandVerifications(reg);
      const a = out.devices[0]!;
      expect(a.verificationGrid.usb?.status).toBe('verified');
      expect(a.verificationGrid.tcp?.status).toBe('expected');
      expect(a.verificationGrid.tcp?.propagatedFrom).toEqual([
        { vector: 'cross-transport', from: { deviceKey: 'A', transport: 'usb' } },
      ]);
      expect(a.verificationGrid.serial?.status).toBe('expected');
    });

    it('single-transport devices no-op the cross-transport vector', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          transports: { usb: { vid: '0x1', pid: '0x1' } },
          verifications: { usb: { status: 'verified' } },
        }),
      ]);
      const out = expandVerifications(reg);
      // Only `usb` in the grid; no other transports to lift.
      expect(Object.keys(out.devices[0]!.verificationGrid)).toEqual(['usb']);
    });
  });

  describe('verified-only trigger gate', () => {
    it('`partial` does not propagate via sibling-protocol', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          verifications: { usb: { status: 'partial' } },
        }),
        makeDevice({ key: 'B' }),
      ]);
      const out = expandVerifications(reg);
      expect(out.devices.find(d => d.key === 'B')!.verificationGrid.usb?.status).toBe('unverified');
    });

    it('`partial` does not propagate cross-transport', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          transports: {
            usb: { vid: '0x1', pid: '0x1' },
            tcp: { port: 9100 },
          },
          verifications: { usb: { status: 'partial' } },
        }),
      ]);
      const out = expandVerifications(reg);
      expect(out.devices[0]!.verificationGrid.tcp?.status).toBe('unverified');
    });

    it('`unsupported` does not propagate', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          verifications: { usb: { status: 'unsupported' } },
        }),
        makeDevice({ key: 'B' }),
      ]);
      const out = expandVerifications(reg);
      expect(out.devices.find(d => d.key === 'B')!.verificationGrid.usb?.status).toBe('unverified');
    });
  });

  describe('override semantics', () => {
    it('direct `partial` beats propagated `expected` (sibling vector)', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          verifications: { usb: { status: 'verified' } },
        }),
        makeDevice({
          key: 'B',
          verifications: { usb: { status: 'partial' } },
        }),
      ]);
      const out = expandVerifications(reg);
      const b = out.devices.find(d => d.key === 'B')!;
      expect(b.verificationGrid.usb?.status).toBe('partial');
      expect(b.verificationGrid.usb?.propagatedFrom).toBeUndefined();
    });

    it('direct `unsupported` beats propagated `expected` (cross-transport vector)', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          transports: {
            usb: { vid: '0x1', pid: '0x1' },
            tcp: { port: 9100 },
          },
          verifications: {
            usb: { status: 'verified' },
            tcp: { status: 'unsupported' },
          },
        }),
      ]);
      const out = expandVerifications(reg);
      const a = out.devices[0]!;
      expect(a.verificationGrid.tcp?.status).toBe('unsupported');
      expect(a.verificationGrid.tcp?.propagatedFrom).toBeUndefined();
    });
  });

  describe('multi-engine propagation (matched engine signature)', () => {
    const duoEngines = [
      { role: 'label', protocol: 'proto-a', dpi: 300, headDots: 600 },
      { role: 'tape', protocol: 'proto-b', dpi: 180, headDots: 128 },
    ];

    it('cross-transport lifts a multi-engine device’s other transports', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'DUO',
          transports: {
            usb: { vid: '0x1', pid: '0x1' },
            tcp: { port: 9100 },
          },
          engines: duoEngines,
          verifications: { usb: { status: 'verified' } },
        }),
      ]);
      const out = expandVerifications(reg);
      const duo = out.devices[0]!;
      expect(duo.verificationGrid.usb?.status).toBe('verified');
      // tcp now lifts via cross-transport — multi-engine is no longer
      // carved out of propagation.
      expect(duo.verificationGrid.tcp?.status).toBe('expected');
    });

    it('lifts a sibling multi-engine device with the same engine signature', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'DUO_A',
          engines: duoEngines,
          verifications: { usb: { status: 'verified' } },
        }),
        makeDevice({ key: 'DUO_B', engines: duoEngines }),
      ]);
      const out = expandVerifications(reg);
      const b = out.devices.find(d => d.key === 'DUO_B')!;
      expect(b.verificationGrid.usb?.status).toBe('expected');
      expect(b.verificationGrid.usb?.propagatedFrom?.[0]).toEqual({
        vector: 'sibling-protocol',
        from: { deviceKey: 'DUO_A', transport: 'usb' },
      });
    });

    it('does not lift a device whose engine set differs', () => {
      const reg = makeRegistry([
        // Duo-shaped: proto-a + proto-b.
        makeDevice({
          key: 'DUO',
          engines: duoEngines,
          verifications: { usb: { status: 'verified' } },
        }),
        // Twin-shaped: proto-a + proto-a — different signature, no lift.
        makeDevice({
          key: 'TWIN',
          engines: [
            { role: 'left', protocol: 'proto-a', dpi: 300, headDots: 600 },
            { role: 'right', protocol: 'proto-a', dpi: 300, headDots: 600 },
          ],
        }),
        // Single-engine proto-a — different signature, no lift.
        makeDevice({ key: 'SOLO' }),
      ]);
      const out = expandVerifications(reg);
      expect(out.devices.find(d => d.key === 'TWIN')!.verificationGrid.usb?.status).toBe(
        'unverified',
      );
      expect(out.devices.find(d => d.key === 'SOLO')!.verificationGrid.usb?.status).toBe(
        'unverified',
      );
    });
  });

  describe('degenerate inputs', () => {
    it('a device declaring zero transports rolls up to `unverified`', () => {
      const reg = makeRegistry([makeDevice({ key: 'A', transports: {} })]);
      const out = expandVerifications(reg);
      expect(out.devices[0]!.verificationGrid).toEqual({});
      expect(out.devices[0]!.supportStatus).toBe('unverified');
    });

    it('a device with no engines is excluded from the sibling-protocol index', () => {
      const reg = makeRegistry([
        makeDevice({
          key: 'A',
          engines: [],
          verifications: { usb: { status: 'verified' } },
        }),
        makeDevice({ key: 'B' }),
      ]);
      const out = expandVerifications(reg);
      // A has no engine → no protocol → never indexed as a sibling,
      // so B does not inherit A's verified usb cell.
      const b = out.devices.find(d => d.key === 'B')!;
      expect(b.verificationGrid.usb?.status).toBe('unverified');
    });
  });

  it('rollupStatus picks worst-case across declared transports', () => {
    const reg = makeRegistry([
      makeDevice({
        key: 'A',
        transports: {
          usb: { vid: '0x1', pid: '0x1' },
          tcp: { port: 9100 },
        },
        verifications: {
          usb: { status: 'verified' },
          tcp: { status: 'unsupported' },
        },
      }),
    ]);
    const out = expandVerifications(reg);
    expect(out.devices[0]!.supportStatus).toBe('unsupported');
  });

  it('per-repo isolation invariant: function only sees the registry it is given', () => {
    // Two separate registries — sibling-protocol lift never crosses
    // them because each call only sees its own devices.
    const regA = makeRegistry([
      makeDevice({
        key: 'A',
        verifications: { usb: { status: 'verified' } },
      }),
    ]);
    const regB = makeRegistry([makeDevice({ key: 'B' })]);
    const outB = expandVerifications(regB);
    expect(outB.devices[0]!.verificationGrid.usb?.status).toBe('unverified');
    // Sanity: lift works within a single registry.
    const merged = makeRegistry([...regA.devices, ...regB.devices]);
    const outMerged = expandVerifications(merged);
    expect(outMerged.devices.find(d => d.key === 'B')!.verificationGrid.usb?.status).toBe(
      'expected',
    );
  });
});

describe('mapLegacyStatus', () => {
  it('maps legacy rungs per the foundation table', () => {
    expect(mapLegacyStatus('verified')).toBe('verified');
    expect(mapLegacyStatus('partial')).toBe('partial');
    expect(mapLegacyStatus('broken')).toBe('unsupported');
    expect(mapLegacyStatus('untested')).toBeUndefined();
    // undefined input → undefined output (legacy "absent" carries through)
    // eslint-disable-next-line unicorn/no-useless-undefined -- explicit absent value under test
    expect(mapLegacyStatus(undefined)).toBeUndefined();
  });
});
