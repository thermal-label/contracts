import { describe, expectTypeOf, it } from 'vitest';

import type {
  DeviceDescriptor,
  DiscoveredPrinter,
  MediaDescriptor,
  OpenOptions,
  PreviewOptions,
  PreviewPlane,
  PreviewResult,
  PrinterAdapter,
  PrinterDiscovery,
  PrinterError,
  PrinterStatus,
  PrintOptions,
  Transport,
  TransportType,
} from '../index.js';

describe('structural compatibility', () => {
  it('a driver-extended DeviceDescriptor satisfies the base', () => {
    interface BrotherQLDevice extends DeviceDescriptor {
      family: 'brother-ql';
      headPins: 720 | 1296;
      bytesPerRow: number;
      twoColor: boolean;
    }
    expectTypeOf<BrotherQLDevice>().toExtend<DeviceDescriptor>();
  });

  it('a driver-extended MediaDescriptor satisfies the base', () => {
    interface BrotherQLMedia extends MediaDescriptor {
      printAreaDots: number;
      leftMarginPins: number;
      rightMarginPins: number;
    }
    expectTypeOf<BrotherQLMedia>().toExtend<MediaDescriptor>();
  });

  it('a driver-extended PrintOptions satisfies the base', () => {
    interface BrotherQLPrintOptions extends PrintOptions {
      autoCut?: boolean;
      highResolution?: boolean;
    }
    expectTypeOf<BrotherQLPrintOptions>().toExtend<PrintOptions>();
  });
});

describe('preview shapes', () => {
  it('PreviewResult.planes is PreviewPlane[]', () => {
    expectTypeOf<PreviewResult['planes']>().toEqualTypeOf<PreviewPlane[]>();
  });

  it('PreviewResult.media is MediaDescriptor', () => {
    expectTypeOf<PreviewResult['media']>().toEqualTypeOf<MediaDescriptor>();
  });

  it('PreviewResult.assumed is boolean', () => {
    expectTypeOf<PreviewResult['assumed']>().toEqualTypeOf<boolean>();
  });

  it('PreviewOptions has only optional media', () => {
    // Accepts empty object
    expectTypeOf<Record<string, never>>().toExtend<PreviewOptions>();
    // Accepts { media }
    expectTypeOf<{ media: MediaDescriptor }>().toExtend<PreviewOptions>();
  });
});

describe('status shapes', () => {
  it('PrinterStatus.errors is PrinterError[]', () => {
    expectTypeOf<PrinterStatus['errors']>().toEqualTypeOf<PrinterError[]>();
  });

  it('PrinterStatus.detectedMedia is optional MediaDescriptor', () => {
    expectTypeOf<PrinterStatus['detectedMedia']>().toEqualTypeOf<MediaDescriptor | undefined>();
  });

  it('PrinterStatus.rawBytes is Uint8Array', () => {
    expectTypeOf<PrinterStatus['rawBytes']>().toEqualTypeOf<Uint8Array>();
  });
});

describe('device shapes', () => {
  it('DeviceDescriptor.vid and pid are optional numbers', () => {
    expectTypeOf<DeviceDescriptor['vid']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<DeviceDescriptor['pid']>().toEqualTypeOf<number | undefined>();
  });

  it('TransportType is the expected union', () => {
    expectTypeOf<TransportType>().toEqualTypeOf<'usb' | 'tcp' | 'webusb' | 'web-bluetooth'>();
  });
});

describe('discovery shapes', () => {
  it('DiscoveredPrinter.transport is a TransportType', () => {
    expectTypeOf<DiscoveredPrinter['transport']>().toEqualTypeOf<TransportType>();
  });

  it('OpenOptions is all-optional', () => {
    expectTypeOf<Record<string, never>>().toExtend<OpenOptions>();
  });

  it('PrinterDiscovery exposes family/listPrinters/openPrinter', () => {
    expectTypeOf<PrinterDiscovery>().toHaveProperty('family');
    expectTypeOf<PrinterDiscovery>().toHaveProperty('listPrinters');
    expectTypeOf<PrinterDiscovery>().toHaveProperty('openPrinter');
  });
});

describe('adapter shape', () => {
  it('PrinterAdapter exposes the required members', () => {
    expectTypeOf<PrinterAdapter>().toHaveProperty('family');
    expectTypeOf<PrinterAdapter>().toHaveProperty('model');
    expectTypeOf<PrinterAdapter>().toHaveProperty('connected');
    expectTypeOf<PrinterAdapter>().toHaveProperty('device');
    expectTypeOf<PrinterAdapter>().toHaveProperty('print');
    expectTypeOf<PrinterAdapter>().toHaveProperty('createPreview');
    expectTypeOf<PrinterAdapter>().toHaveProperty('getStatus');
    expectTypeOf<PrinterAdapter>().toHaveProperty('close');
  });

  it('print returns Promise<void>', () => {
    expectTypeOf<PrinterAdapter['print']>().returns.toEqualTypeOf<Promise<void>>();
  });

  it('createPreview returns Promise<PreviewResult>', () => {
    expectTypeOf<PrinterAdapter['createPreview']>().returns.toEqualTypeOf<Promise<PreviewResult>>();
  });

  it('getStatus returns Promise<PrinterStatus>', () => {
    expectTypeOf<PrinterAdapter['getStatus']>().returns.toEqualTypeOf<Promise<PrinterStatus>>();
  });
});

describe('transport shape', () => {
  it('Transport exposes write/read/close/connected', () => {
    expectTypeOf<Transport>().toHaveProperty('write');
    expectTypeOf<Transport>().toHaveProperty('read');
    expectTypeOf<Transport>().toHaveProperty('close');
    expectTypeOf<Transport>().toHaveProperty('connected');
  });

  it('Transport.connected is readonly boolean', () => {
    expectTypeOf<Transport['connected']>().toEqualTypeOf<boolean>();
  });
});
