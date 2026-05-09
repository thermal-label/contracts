import { describe, expect, it } from 'vitest';

import {
  DeviceIdentificationRequiredError,
  DeviceNotFoundError,
  EngineRequiredError,
  MediaNotSpecifiedError,
  TransportClosedError,
  TransportError,
  TransportTimeoutError,
  UnsupportedOperationError,
} from '../index.js';
import type { DeviceEntry } from '../index.js';

describe('TransportError', () => {
  it('sets name, message, and transport field', () => {
    const err = new TransportError('boom', 'usb');
    expect(err.name).toBe('TransportError');
    expect(err.message).toBe('boom');
    expect(err.transport).toBe('usb');
  });

  it('is an Error', () => {
    expect(new TransportError('x', 'tcp')).toBeInstanceOf(Error);
  });
});

describe('TransportTimeoutError', () => {
  it('sets name and embeds timeout value in message', () => {
    const err = new TransportTimeoutError('usb', 1500);
    expect(err.name).toBe('TransportTimeoutError');
    expect(err.message).toBe('Read timed out after 1500ms');
    expect(err.transport).toBe('usb');
  });

  it('is instanceof TransportError and Error', () => {
    const err = new TransportTimeoutError('tcp', 500);
    expect(err).toBeInstanceOf(TransportError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('TransportClosedError', () => {
  it('sets name and transport field', () => {
    const err = new TransportClosedError('bluetooth-gatt');
    expect(err.name).toBe('TransportClosedError');
    expect(err.message).toBe('Transport is closed');
    expect(err.transport).toBe('bluetooth-gatt');
  });

  it('is instanceof TransportError and Error', () => {
    const err = new TransportClosedError('bluetooth-spp');
    expect(err).toBeInstanceOf(TransportError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('DeviceNotFoundError', () => {
  it('formats VID/PID in hex when both are provided', () => {
    const err = new DeviceNotFoundError(0x04f9, 0x209d);
    expect(err.name).toBe('DeviceNotFoundError');
    expect(err.message).toBe('No device found with VID=0x4f9 PID=0x209d');
  });

  it('uses a generic message when VID/PID are not provided', () => {
    const err = new DeviceNotFoundError();
    expect(err.message).toBe('No compatible device found');
  });

  it('uses the generic message when only VID is provided', () => {
    const err = new DeviceNotFoundError(0x04f9);
    expect(err.message).toBe('No compatible device found');
  });

  it('uses the generic message when only PID is provided', () => {
    const err = new DeviceNotFoundError(undefined, 0x209d);
    expect(err.message).toBe('No compatible device found');
  });

  it('is an Error but not a TransportError', () => {
    const err = new DeviceNotFoundError();
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(TransportError);
  });
});

describe('UnsupportedOperationError', () => {
  it('formats message as "operation: reason"', () => {
    const err = new UnsupportedOperationError('cut', 'printer has no cutter');
    expect(err.name).toBe('UnsupportedOperationError');
    expect(err.message).toBe('cut: printer has no cutter');
  });

  it('is an Error', () => {
    expect(new UnsupportedOperationError('a', 'b')).toBeInstanceOf(Error);
  });
});

describe('MediaNotSpecifiedError', () => {
  it('sets name and a helpful message mentioning getStatus()', () => {
    const err = new MediaNotSpecifiedError();
    expect(err.name).toBe('MediaNotSpecifiedError');
    expect(err.message).toContain('getStatus()');
  });

  it('is an Error', () => {
    expect(new MediaNotSpecifiedError()).toBeInstanceOf(Error);
  });
});

describe('EngineRequiredError', () => {
  it('sets name and lists the available engine roles in the message', () => {
    const err = new EngineRequiredError(['label', 'tape']);
    expect(err.name).toBe('EngineRequiredError');
    expect(err.message).toContain('label');
    expect(err.message).toContain('tape');
    expect(err.availableEngines).toEqual(['label', 'tape']);
  });

  it('is an Error', () => {
    expect(new EngineRequiredError([])).toBeInstanceOf(Error);
  });
});

describe('DeviceIdentificationRequiredError', () => {
  const candidate = { key: 'QL_820NWBc', name: 'QL-820NWBc' } as unknown as DeviceEntry;

  it('sets name, candidates, and continueWith closure', () => {
    const continueWith = (): Promise<Record<string, never>> => Promise.resolve({});
    const err = new DeviceIdentificationRequiredError([candidate], continueWith);
    expect(err.name).toBe('DeviceIdentificationRequiredError');
    expect(err.candidates).toEqual([candidate]);
    expect(err.continueWith).toBe(continueWith);
  });

  it('lists candidate keys in the message', () => {
    const err = new DeviceIdentificationRequiredError([candidate], () => Promise.resolve({}));
    expect(err.message).toContain('QL_820NWBc');
  });

  it('is an Error', () => {
    expect(new DeviceIdentificationRequiredError([], () => Promise.resolve({}))).toBeInstanceOf(
      Error,
    );
  });
});
