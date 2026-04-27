export type { LabelBitmap, PaletteEntry, RawImageData } from './bitmap.js';

export type { BluetoothConfig, DeviceDescriptor, TransportType } from './device.js';

export type { MediaDescriptor } from './media.js';

export type { RotateDirection } from './orientation.js';
export { pickRotation } from './orientation.js';

export type { PrinterError, PrinterStatus, PrintOptions } from './status.js';

export type { Transport } from './transport.js';

export type { PreviewOptions, PreviewPlane, PreviewResult } from './preview.js';

export type { PrinterAdapter } from './adapter.js';

export type { DiscoveredPrinter, OpenOptions, PrinterDiscovery } from './discovery.js';

export {
  DeviceNotFoundError,
  MediaNotSpecifiedError,
  TransportClosedError,
  TransportError,
  TransportTimeoutError,
  UnsupportedOperationError,
} from './errors.js';
