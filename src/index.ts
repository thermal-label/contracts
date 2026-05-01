export type { LabelBitmap, PaletteEntry, RawImageData } from './bitmap.js';

export type {
  BluetoothGattTransport,
  BluetoothSppTransport,
  DeviceEntry,
  DeviceRegistry,
  DeviceReport,
  DeviceSupport,
  DeviceTransports,
  EngineBind,
  PrintEngine,
  PrintEngineCapabilities,
  SerialTransport,
  SupportStatus,
  TcpTransport,
  TransportType,
  UsbTransport,
} from './device.js';

export type { MediaDescriptor } from './media.js';

export type { RotateDirection } from './orientation.js';
export { pickRotation } from './orientation.js';

export { compatibleMediaFor, mediaCompatibleWith, mediaIdentitiesMatch } from './compatibility.js';

export type { EngineDescriptor, SupportedDevice } from './resolution.js';
export { resolveSupportedDevices } from './resolution.js';

export type { PrinterError, PrinterStatus, PrintOptions } from './status.js';

export type { Transport } from './transport.js';

export type { PreviewOptions, PreviewPlane, PreviewResult } from './preview.js';

export type { PrinterAdapter } from './adapter.js';

export type { DiscoveredPrinter, OpenOptions, PrinterDiscovery } from './discovery.js';

export {
  DeviceNotFoundError,
  EngineRequiredError,
  MediaNotSpecifiedError,
  TransportClosedError,
  TransportError,
  TransportTimeoutError,
  UnsupportedOperationError,
} from './errors.js';
