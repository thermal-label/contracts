import { describe, expectTypeOf, it } from 'vitest';

import type {
  BluetoothGattTransport,
  BluetoothSppTransport,
  DeviceEntry,
  DeviceRegistry,
  DeviceSupport,
  DeviceTransports,
  DiscoveredPrinter,
  MediaDescriptor,
  OpenOptions,
  PaletteEntry,
  PreviewOptions,
  PreviewPlane,
  PreviewResult,
  PrintEngine,
  PrinterAdapter,
  PrinterDiscovery,
  PrinterError,
  PrinterStatus,
  PrintOptions,
  SerialTransport,
  SupportStatus,
  TcpTransport,
  Transport,
  TransportType,
  UsbTransport,
} from '../index.js';

describe('structural compatibility', () => {
  it('a driver-extended DeviceEntry satisfies the base', () => {
    interface BrotherQLDevice extends DeviceEntry {
      family: 'brother-ql';
    }
    expectTypeOf<BrotherQLDevice>().toExtend<DeviceEntry>();
  });

  it('a driver-extended PrintEngine satisfies the base', () => {
    interface BrotherQLEngine extends PrintEngine {
      bytesPerRow: number;
    }
    expectTypeOf<BrotherQLEngine>().toExtend<PrintEngine>();
  });

  it('a driver-extended MediaDescriptor satisfies the base', () => {
    interface BrotherQLMedia extends MediaDescriptor {
      printAreaDots: number;
      leftMarginPins: number;
      rightMarginPins: number;
    }
    expectTypeOf<BrotherQLMedia>().toExtend<MediaDescriptor>();
  });

  it('MediaDescriptor.palette is readonly PaletteEntry[] | undefined', () => {
    expectTypeOf<MediaDescriptor['palette']>().toEqualTypeOf<readonly PaletteEntry[] | undefined>();
  });

  it("MediaDescriptor.defaultOrientation accepts 'horizontal' | 'vertical' | undefined", () => {
    expectTypeOf<MediaDescriptor['defaultOrientation']>().toEqualTypeOf<
      'horizontal' | 'vertical' | undefined
    >();
  });

  it('MediaDescriptor.printMargins requires all four edges when present', () => {
    type Margins = NonNullable<MediaDescriptor['printMargins']>;
    expectTypeOf<Margins>().toEqualTypeOf<{
      readonly leftMm: number;
      readonly rightMm: number;
      readonly topMm: number;
      readonly bottomMm: number;
    }>();
  });

  it('MediaDescriptor.cornerRadiusMm is optional number', () => {
    expectTypeOf<MediaDescriptor['cornerRadiusMm']>().toEqualTypeOf<number | undefined>();
  });

  it('MediaDescriptor.skus is optional readonly string[]', () => {
    expectTypeOf<MediaDescriptor['skus']>().toEqualTypeOf<readonly string[] | undefined>();
  });

  it('MediaDescriptor.targetModels is optional readonly string[]', () => {
    expectTypeOf<MediaDescriptor['targetModels']>().toEqualTypeOf<readonly string[] | undefined>();
  });

  it('MediaDescriptor.category accepts the documented union', () => {
    expectTypeOf<MediaDescriptor['category']>().toEqualTypeOf<
      | 'address'
      | 'shipping'
      | 'file-folder'
      | 'multi-purpose'
      | 'name-badge'
      | 'barcode'
      | 'price-tag'
      | 'continuous'
      | 'cartridge'
      | 'tape'
      | 'die-cut'
      | undefined
    >();
  });

  it('a driver-extended PrintOptions satisfies the base', () => {
    interface BrotherQLPrintOptions extends PrintOptions {
      autoCut?: boolean;
      highResolution?: boolean;
    }
    expectTypeOf<BrotherQLPrintOptions>().toExtend<PrintOptions>();
  });

  it('PrintOptions.engine is optional string', () => {
    expectTypeOf<PrintOptions['engine']>().toEqualTypeOf<string | undefined>();
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
  it('TransportType is the wire-protocol-only union', () => {
    expectTypeOf<TransportType>().toEqualTypeOf<
      'usb' | 'tcp' | 'serial' | 'bluetooth-spp' | 'bluetooth-gatt'
    >();
  });

  it('SupportStatus is the four-state union', () => {
    expectTypeOf<SupportStatus>().toEqualTypeOf<
      'verified' | 'partial' | 'broken' | 'untested'
    >();
  });

  it('UsbTransport.vid and pid are hex strings', () => {
    expectTypeOf<UsbTransport['vid']>().toEqualTypeOf<string>();
    expectTypeOf<UsbTransport['pid']>().toEqualTypeOf<string>();
  });

  it('TcpTransport.port is number; mdns optional', () => {
    expectTypeOf<TcpTransport['port']>().toEqualTypeOf<number>();
    expectTypeOf<TcpTransport['mdns']>().toEqualTypeOf<
      { serviceType: string; subtypes?: readonly string[] } | undefined
    >();
  });

  it('SerialTransport.defaultBaud is required', () => {
    expectTypeOf<SerialTransport['defaultBaud']>().toEqualTypeOf<number>();
  });

  it('BluetoothSppTransport fields are all optional', () => {
    expectTypeOf<Record<string, never>>().toExtend<BluetoothSppTransport>();
  });

  it('BluetoothGattTransport requires service + tx UUIDs', () => {
    expectTypeOf<BluetoothGattTransport['serviceUuid']>().toEqualTypeOf<string>();
    expectTypeOf<BluetoothGattTransport['txCharacteristicUuid']>().toEqualTypeOf<string>();
  });

  it('DeviceTransports keys are all optional (a stub passes)', () => {
    expectTypeOf<Record<string, never>>().toExtend<DeviceTransports>();
  });

  it('DeviceEntry.engines is a readonly PrintEngine[]', () => {
    expectTypeOf<DeviceEntry['engines']>().toEqualTypeOf<readonly PrintEngine[]>();
  });

  it('DeviceEntry.support is required', () => {
    expectTypeOf<DeviceEntry['support']>().toEqualTypeOf<DeviceSupport>();
  });

  it('PrintEngine.bind.usb carries bInterfaceNumber', () => {
    type Bind = NonNullable<PrintEngine['bind']>;
    expectTypeOf<NonNullable<Bind['usb']>>().toEqualTypeOf<{ bInterfaceNumber: number }>();
  });

  it('PrintEngine.bind.address is optional number (opaque protocol-layer)', () => {
    type Bind = NonNullable<PrintEngine['bind']>;
    expectTypeOf<Bind['address']>().toEqualTypeOf<number | undefined>();
  });

  it('PrintEngine.capabilities allows mediaDetection / autocut and an open index', () => {
    type Caps = NonNullable<PrintEngine['capabilities']>;
    expectTypeOf<Caps['mediaDetection']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<Caps['autocut']>().toEqualTypeOf<boolean | undefined>();
    // Index signature accepts arbitrary keys.
    expectTypeOf<Caps[string]>().toEqualTypeOf<unknown>();
  });

  it('DeviceRegistry pins schemaVersion to 1', () => {
    expectTypeOf<DeviceRegistry['schemaVersion']>().toEqualTypeOf<1>();
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
