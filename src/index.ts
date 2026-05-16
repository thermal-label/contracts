export type { LabelBitmap, PaletteEntry, RawImageData } from './bitmap.js';

/* eslint-disable @typescript-eslint/no-deprecated -- deprecated types re-exported intentionally during alias transition */
export type {
  BluetoothGattTransport,
  BluetoothSppTransport,
  DeviceEntry,
  DeviceRegistry,
  DeviceReport,
  DeviceSupport,
  DeviceTransports,
  EngineBind,
  LegacySupportStatus,
  PrintEngine,
  PrintEngineCapabilities,
  SerialTransport,
  TcpTransport,
  TransportType,
  UsbTransport,
} from './device.js';
/* eslint-enable @typescript-eslint/no-deprecated */

export type {
  DeviceVerifications,
  EffectiveStatus,
  ExpandedCell,
  SupportStatus,
  VerificationCell,
} from './verifications.js';

export type { ExpandedDeviceEntry, ExpandedRegistry, ExpandedVerificationGrid } from './expand.js';
export { expandVerifications, mapLegacyStatus } from './expand.js';

export type { MediaDescriptor } from './media.js';

export type { PrintableArea } from './printable-area.js';
export {
  getForcedTrailingFeedMm,
  getPrintableArea,
  ZERO_PRINTABLE_AREA,
} from './printable-area.js';

export type { RotateDirection } from './orientation.js';
export { pickRotation } from './orientation.js';

export { compatibleMediaFor, mediaCompatibleWith, mediaIdentitiesMatch } from './compatibility.js';

export type { EngineDescriptor, SupportedDevice } from './resolution.js';
export { resolveSupportedDevices } from './resolution.js';

export type {
  BatteryStatus,
  PrinterError,
  PrinterStatus,
  PrintOptions,
  StatusDetail,
} from './status.js';

export type { Transport } from './transport.js';

export type { PreviewOptions, PreviewPlane, PreviewResult } from './preview.js';

export type { PrinterAdapter, PrinterAdapterMap } from './adapter.js';

export { DEFAULT_POLLING_INTERVAL_MS, pollingOnStatus } from './polling-on-status.js';

export { WriteSerializer } from './serializer.js';

export type {
  ConnectOptions,
  DiscoveredPrinter,
  OpenOptions,
  PrinterDiscovery,
} from './discovery.js';

export {
  DeviceIdentificationRequiredError,
  DeviceNotFoundError,
  EngineRequiredError,
  MediaNotSpecifiedError,
  TransportClosedError,
  TransportError,
  TransportTimeoutError,
  UnsupportedOperationError,
} from './errors.js';
